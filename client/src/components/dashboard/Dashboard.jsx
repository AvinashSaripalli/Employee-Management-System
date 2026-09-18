import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart, CartesianGrid, PieChart, Pie, Cell, BarChart, Bar, Legend, Sector } from 'recharts';
import { Box, Typography, Select, MenuItem, FormControl, Card, CardContent, Grid } from '@mui/material';
import { People, EmojiHappy, UserRemove, Calendar1, UserAdd } from 'iconsax-react';
import axios from '../../api/axios';

const StatCard = ({ title, value, subtitle, icon, color }) => (
  <Card sx={{ height: '100%', overflow: 'hidden' }}>
    <Box
      sx={{
        height: 5,
        width: '100%',
        background: `linear-gradient(90deg, ${color}, ${color}CC)`,
      }}
    />
    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box
        sx={{
          width: 52,
          height: 52,
          minWidth: 52,
          borderRadius: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          backgroundColor: `${color}1A`,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" sx={{ lineHeight: 1.15 }}>{value}</Typography>
        <Typography color="text.secondary" sx={{ fontSize: '0.86rem', fontWeight: 600 }} noWrap>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.disabled">{subtitle}</Typography>
        )}
      </Box>
    </CardContent>
  </Card>
);

const ChartCard = ({ title, subtitle, children }) => (
  <Card sx={{ height: '100%', p: { xs: 1.5, md: 2.5 }, display: 'flex', flexDirection: 'column' }}>
    <Box sx={{ mb: 1 }}>
      <Typography variant="h6" sx={{ fontSize: '1rem' }}>{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Box>
    <Box sx={{ flexGrow: 1, minHeight: 0 }}>{children}</Box>
  </Card>
);

const Dashboard = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const employeesAlias = "Active Employees";
  const deletedEmployeesAlias = "Employees Left";
  const departmentAlias = "Departments";

  const [cardData, setCardData] = useState([
    { title: "Total Employees", value: "0" },
    { title: "Active Employees", value: "0" },
    { title: "Employees Left", value: "0" },
    { title: "On Leave", value: "0" },
    { title: "New Joinees", value: "0" },
  ]);

  const [monthOrder, setMonthOrder] = useState([
    { name: "Jan", employees: 0, deletedemployees: 0 },
    { name: "Feb", employees: 0, deletedemployees: 0 },
    { name: "Mar", employees: 0, deletedemployees: 0 },
    { name: "Apr", employees: 0, deletedemployees: 0 },
    { name: "May", employees: 0, deletedemployees: 0 },
    { name: "Jun", employees: 0, deletedemployees: 0 },
    { name: "Jul", employees: 0, deletedemployees: 0 },
    { name: "Aug", employees: 0, deletedemployees: 0 },
    { name: "Sep", employees: 0, deletedemployees: 0 },
    { name: "Oct", employees: 0, deletedemployees: 0 },
    { name: "Nov", employees: 0, deletedemployees: 0 },
    { name: "Dec", employees: 0, deletedemployees: 0 },
  ]);

  const [locationOrder, setLocationOrder] = useState([
    { locationName: 'Kerala', locations: 0 },
    { locationName: 'Hyderabad', locations: 0 },
    { locationName: 'Amaravati', locations: 0 },
    { locationName: 'Chennai', locations: 0 },
    { locationName: 'Mumbai', locations: 0 },
    { locationName: 'Kolkata', locations: 0 },
    { locationName: 'Delhi', locations: 0 },
  ]);

  const [departmentOrder, setDepartmentOrder] = useState([
    { departmentName: 'Human Resources', indepartment: 0 },
    { departmentName: 'Design', indepartment: 0 },
    { departmentName: 'Software Development', indepartment: 0 },
    { departmentName: 'Testing', indepartment: 0 },
    { departmentName: 'Accounting', indepartment: 0 },
  ]);

  const [genderOrder, setGenderOrder] = useState([
    { genderName: 'Male', genders: 0 },
    { genderName: 'Female', genders: 0 },
  ]);

  const colors = ["#14286D", "#3d5ae8", "#7c3aed", "#0e9f6e", "#f97316", "#e11d48", "#0891b2"];
  const colorcode = ['#14286D', '#FE8600'];

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem('token');
        const companyName = localStorage.getItem('companyName');
        if (!companyName) {
          console.error('No company name found in localStorage');
          return;
        }

        const { data } = await axios.get('/users-by-month', {
          params: { companyName, year: selectedYear },
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedMonthOrder = monthOrder.map((month, index) => {
          const foundData = data.find((item) => item.month === index + 1);
          return {
            name: month.name,
            employees: foundData ? Number(foundData.employees) : 0,
            deletedemployees: foundData ? Number(foundData.deletedemployees) : 0,
          };
        });
        setMonthOrder(updatedMonthOrder);

        const totalEmployees = updatedMonthOrder.reduce((sum, month) => sum + month.employees, 0);
        const totalDeletedEmployees = updatedMonthOrder.reduce((sum, month) => sum + month.deletedemployees, 0);
        const currentMonthName = new Date().toLocaleString('default', { month: 'short' });
        const currentMonthData = updatedMonthOrder.find((month) => month.name === currentMonthName);
        const newJoinees = currentMonthData ? currentMonthData.employees : 0;

        const { data: leaveData } = await axios.get('/leaves/approved-leaves-today', {
          params: { companyName, year: selectedYear },
          headers: { Authorization: `Bearer ${token}` }
        });

        setCardData([
          { title: "Total Employees", value: (totalEmployees + totalDeletedEmployees).toString() },
          { title: "Active Employees", value: totalEmployees.toString() },
          { title: "Employees Left", value: totalDeletedEmployees.toString() },
          { title: "On Leave", value: leaveData.leaveCount ? leaveData.leaveCount.toString() : "0" },
          { title: "New Joinees", value: newJoinees.toString() },
        ]);

        const { data: usersByLocationData } = await axios.get('/users-by-location', {
          params: { companyName, year: selectedYear },
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedLocationOrder = locationOrder.map((location) => {
          const foundLocation = usersByLocationData.find((item) => item.locationName === location.locationName);
          return {
            locationName: location.locationName,
            locations: foundLocation ? foundLocation.locations : 0,
          };
        });
        setLocationOrder(updatedLocationOrder);

        const { data: usersByDepartmentData } = await axios.get('/users-by-departments', {
          params: { companyName, year: selectedYear },
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedDepartmentOrder = departmentOrder.map((departments) => {
          const foundDepartment = usersByDepartmentData.find((item) => item.departmentName === departments.departmentName);
          return {
            departmentName: departments.departmentName,
            indepartment: foundDepartment ? foundDepartment.indepartment : 0,
          };
        });
        setDepartmentOrder(updatedDepartmentOrder);

        const { data: usersByGenderData } = await axios.get('/users-by-genders', {
          params: { companyName, year: selectedYear },
          headers: { Authorization: `Bearer ${token}` },
        });
        const updatedGenderOrder = genderOrder.map((genders) => {
          const foundGender = usersByGenderData.find((item) => item.genderName === genders.genderName);
          return {
            genderName: genders.genderName,
            genders: foundGender ? foundGender.genders : 0,
          };
        });
        setGenderOrder(updatedGenderOrder);
      } catch (err) {
        console.error('Failed to fetch user data:', err);
      }
    };

    fetchUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear]);

  const renderActiveShape = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, percent, value } = props;
    const RADIAN = Math.PI / 180;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 10) * cos;
    const sy = cy + (outerRadius + 10) * sin;
    const mx = cx + (outerRadius + 20) * cos;
    const my = cy + (outerRadius + 20) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 22;
    const ey = my;
    const textAnchor = cos >= 0 ? "start" : "end";

    return (
      <g>
        <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill} fontSize="14px">
          {payload.locationName}
        </text>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} startAngle={startAngle} endAngle={endAngle} innerRadius={outerRadius + 6} outerRadius={outerRadius + 10} fill={fill} />
        <path d={`M${sx},${sy} L${mx},${my} L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 5 : -5)} y={ey} textAnchor={textAnchor} fill="#333" fontSize="12px" fontWeight="bold">
          {`${payload.locationName} (${value})`}
        </text>
        <text x={ex + (cos >= 0 ? 5 : -5)} y={ey + 14} textAnchor={textAnchor} fill="#999" fontSize="10px">
          {`Rate ${(percent * 100).toFixed(2)}%`}
        </text>
      </g>
    );
  };

  const cardMeta = [
    { icon: <People size="24" variant="Bold" />, color: '#14286D' },
    { icon: <EmojiHappy size="24" variant="Bold" />, color: '#16A34A' },
    { icon: <UserRemove size="24" variant="Bold" />, color: '#E11D48' },
    { icon: <Calendar1 size="24" variant="Bold" />, color: '#F59E0B' },
    { icon: <UserAdd size="24" variant="Bold" />, color: '#7C3AED' },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 2, alignItems: { xs: 'stretch', md: 'center' }, justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5">Employee Statistics</Typography>
          <Typography color="text.secondary" sx={{ fontSize: '0.88rem' }}>
            Overview of your workforce for {selectedYear}
          </Typography>
        </Box>
        <FormControl sx={{ maxWidth: 200 }}>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            size="small"
            sx={{
              bgcolor: '#fff',
              borderRadius: 2,
              fontWeight: 600,
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E3E8F4' },
            }}
          >
            {[...Array(5)].map((_, index) => {
              const year = currentYear - index;
              return <MenuItem key={year} value={year}>{year}</MenuItem>;
            })}
          </Select>
        </FormControl>
      </Box>

      {/* KPI cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {cardData.map((card, index) => (
          <Grid item xs={12} sm={6} lg={4} xl={2.4} key={index}>
            <StatCard
              title={card.title}
              value={card.value}
              subtitle={card.title === "On Leave" ? "Today" : card.title === "New Joinees" ? "This month" : undefined}
              icon={cardMeta[index].icon}
              color={cardMeta[index].color}
            />
          </Grid>
        ))}
      </Grid>

      {/* Row 1: Area + Location */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={7} xl={8}>
          <ChartCard title="Employee Growth" subtitle={`Net workforce change per month — ${selectedYear}`}>
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthOrder} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="5%" stopColor="#14286D" stopOpacity={0.85} />
                      <stop offset="95%" stopColor="#14286D" stopOpacity={0.15} />
                    </linearGradient>
                    <linearGradient id="colorDel" x1="0" y1="1" x2="1" y2="0">
                      <stop offset="5%" stopColor="#FE8600" stopOpacity={0.85} />
                      <stop offset="95%" stopColor="#FE8600" stopOpacity={0.15} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" interval={0} height={35} tickLine={false} axisLine={false} tick={{ fill: '#8A94B0', fontSize: 12 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#8A94B0', fontSize: 12 }} />
                  <CartesianGrid strokeDasharray="4 4" stroke="#EDF0F7" vertical={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #EDF0F7', boxShadow: '0 8px 30px rgba(17,32,77,0.12)' }} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Area type="monotone" dataKey="employees" name={employeesAlias} stroke="#14286D" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUv)" activeDot={{ r: 5 }} />
                  <Area type="monotone" dataKey="deletedemployees" name={deletedEmployeesAlias} stroke="#FE8600" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDel)" activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        </Grid>
        <Grid item xs={12} lg={5} xl={4}>
          <ChartCard title="Office Locations" subtitle="Employee distribution by location">
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    activeIndex={activeIndex}
                    activeShape={renderActiveShape}
                    data={locationOrder}
                    dataKey="locations"
                    nameKey="locationName"
                    cx="50%"
                    cy="50%"
                    innerRadius={90}
                    outerRadius={120}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                  >
                    {locationOrder.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>

      {/* Row 2: Department + Gender */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={7} xl={8}>
          <ChartCard title="Department Distribution" subtitle="Headcount across departments">
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentOrder} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
                  <XAxis dataKey="departmentName" interval={0} height={45} tickLine={false} axisLine={false} tick={{ fill: '#8A94B0', fontSize: 11 }} />
                  <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: '#8A94B0', fontSize: 12 }} />
                  <CartesianGrid strokeDasharray="4 4" stroke="#EDF0F7" vertical={false} />
                  <Tooltip cursor={{ fill: 'rgba(20,40,109,0.05)' }} contentStyle={{ borderRadius: 12, border: '1px solid #EDF0F7', boxShadow: '0 8px 30px rgba(17,32,77,0.12)' }} />
                  <Legend wrapperStyle={{ fontSize: 13 }} />
                  <Bar dataKey="indepartment" name={departmentAlias} radius={[10, 10, 4, 4]} barSize={42}>
                    {departmentOrder.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        </Grid>
        <Grid item xs={12} lg={5} xl={4}>
          <ChartCard title="Gender Distribution" subtitle="Workforce split by gender">
            <Box sx={{ height: 320 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={genderOrder}
                    dataKey="genders"
                    nameKey="genderName"
                    cx="50%"
                    cy="50%"
                    outerRadius={105}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                      const RADIAN = Math.PI / 180;
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight="bold">
                          {value}
                        </text>
                      );
                    }}
                    labelLine={false}
                  >
                    {genderOrder.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colorcode[index % colorcode.length]} />
                    ))}
                  </Pie>
                  <Legend layout="horizontal" align="center" iconType="circle" wrapperStyle={{ fontSize: 13 }} />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </ChartCard>
        </Grid>
      </Grid>
    </Box>
  );
};
export default Dashboard;