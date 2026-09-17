import React, { useState, useEffect } from 'react';
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area,AreaChart, CartesianGrid, PieChart, Pie,Cell,Text, BarChart,Bar,Legend,Sector } from 'recharts';
import { Box, Typography, Paper, Select, MenuItem, FormControl, InputLabel, Card, CardContent, Grid2  } from '@mui/material';
import axios from '../api/axios';

const Dashboard = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const employeesAlias = "Active Employees";
  const deletedEmployeesAlias = "Left Employees";
  const locationAlias = "Office Locations";
  const departmentAlias = "Departments";
  const genderAlias = "Gender Distribution";

  const [cardData, setCardData] = useState([
    { title: "Total Employees", value: "150" },
    { title: "Active Employees", value: "130" },
    { title: "Left Employees", value: "20" },
    { title: "On Leave", value: "0" },
    { title: "New Joinees", value: '0' },
  ]);

  const [monthOrder, setMonthOrder] = useState([
    { name: "Jan", employees: 0 , deletedemployees: 0},
    { name: "Feb", employees: 0, deletedemployees: 0 },
    { name: "Mar", employees: 0, deletedemployees: 2  },
    { name: "Apr", employees: 0, deletedemployees: 0  },
    { name: "May", employees: 0, deletedemployees: 1  },
    { name: "Jun", employees: 0, deletedemployees: 0  },
    { name: "Jul", employees: 0, deletedemployees: 0  },
    { name: "Aug", employees: 0, deletedemployees: 0  },
    { name: "Sep", employees: 0, deletedemployees: 0  },
    { name: "Oct", employees: 0, deletedemployees: 0  },
    { name: "Nov", employees: 0, deletedemployees: 0  },
    { name: "Dec", employees: 0, deletedemployees: 0  },
  ]);

  const [locationOrder, setLocationOrder]=useState([
    { locationName: 'Kerala', locations: 0 },
    { locationName: 'Hyderabad', locations: 0 },
    { locationName: 'Amaravati', locations: 0 },
    { locationName: 'Chennai', locations: 0 },
    { locationName: 'Mumbai', locations: 0 },
    { locationName: 'Kolkata', locations: 0 },
    { locationName: 'Delhi', locations: 0 },
  ]);

  const [departmentOrder,setDepartmentOrder]=useState([
    {departmentName:'Human Resources',indepartment:0},
    {departmentName:'Design',indepartment:0},
    {departmentName:'Software Development',indepartment:0},
    {departmentName:'Testing',indepartment:0},
    {departmentName:'Accounting',indepartment:0},
  ]);

  const [genderOrder,setGenderOrder] =useState([
    {genderName:'Male',genders:0},
    {genderName:'Female',genders:0},
  ]);

  const colors = ["#14286D", "#3b335b", "#623e49", "#894937", "#b05425", "#d75f13", "#FE6800", ];
  const colorcode = ['#14286D', '#FE8600']; 
  const colorsbar =["#14286D", "#4f4052" , "#8a5837", "#c5701c", "#FE6800"];
  
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("token");
        const companyName = localStorage.getItem('companyName');
        if (!companyName) {
          console.error('No company name found in localStorage');
          return;
        }

        const { data } = await axios.get('/users-by-month', {
          params: { companyName ,year: selectedYear },
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
          { title: "Total Employees", value: totalEmployees + totalDeletedEmployees  },
          { title: "Active Employees", value: totalEmployees},
          { title: "Left Employees", value: totalDeletedEmployees },
          { title: "On Leave", value: leaveData.leaveCount},
          { title: "New Joinees", value: newJoinees },
        ]);

        const { data: usersByLocationData } = await axios.get('/users-by-location', {
          params: { companyName ,year: selectedYear},
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        const updatedLocationOrder = locationOrder.map((location) => {
          const foundLocation = usersByLocationData.find((item) => item.locationName === location.locationName);
          return {
            locationName: location.locationName,
            locations: foundLocation ? foundLocation.locations : 0,
          };
        });
        setLocationOrder(updatedLocationOrder);

        const{ data: usersByDepartmentData } =await axios.get('/users-by-departments',{
          params: { companyName ,year: selectedYear},
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const updatedDepartmentOrder =departmentOrder.map((departments)=>{
          const foundDepartment =usersByDepartmentData.find((item)=> item.departmentName===departments.departmentName);
          return{
            departmentName: departments.departmentName,
            indepartment: foundDepartment ? foundDepartment.indepartment : 0, 
          }
        });
        setDepartmentOrder(updatedDepartmentOrder);

        const { data: usersByGenderData } = await axios.get('/users-by-genders', {
          params: { companyName ,year: selectedYear},
          headers: {
            Authorization: `Bearer ${token}`,
          },
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
    
  }, [selectedYear]);
  
  const renderActiveShape = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle,
      fill, payload, percent, value } = props;
  
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
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
        />
        <path d={`M${sx},${sy} L${mx},${my} L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 5 : -5)} y={ey} textAnchor={textAnchor} fill="#333"  fontSize="12px" fontWeight="bold">
          {`${payload.locationName}(${value})`}
        </text>
        <text x={ex + (cos >= 0 ? 5 : -5)} y={ey + 14} textAnchor={textAnchor} fill="#999" fontSize="10px">
          {`(Rate ${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    );
  }; 
  
  return (
    <Box sx={{ p:4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }} gutterBottom>
          Employee Statistics
        </Typography>
        <FormControl sx={{ minWidth: 100, background: "#fff", borderRadius: 2, boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
        <Select
          value={selectedYear}
          onChange={(e) => setSelectedYear(e.target.value)}
          displayEmpty
          sx={{
            fontSize: "14px",
            fontWeight: "500",
            height:40,
            color: "#333",
            padding: "6px 12px",
            "& .MuiSelect-icon": { color: "#777" },
            "&:hover": { backgroundColor: "#f1f3f5" },
          }}
        >
          {[...Array(5)].map((_, index) => {
            const year = currentYear - index;
            return <MenuItem key={year} value={year}>{year}</MenuItem>;
          })}
        </Select>
      </FormControl>
      </Box>
      <Box sx={{ml:5,mr:5,mt:3,mb:3}}>
        <Grid2 container spacing={4.9} sx={{ mb: 3 }}>
          {cardData.map((card, index) => (
            <Grid2 item xs={12} sm={6} md={4} key={index}>
              <Card sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  p: 2,
                  boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px",
                  minHeight: 140,
                  minWidth: 200,
                }}
              >
                <CardContent
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexGrow: 1,
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: "bold", mb: 1 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="body1">{card.title}</Typography>
                  {card.title === "On Leave" && (
                    <Typography sx={{ color: "#777", fontSize: "12px" }}>
                      (Today)
                    </Typography>
                  )}
                  {card.title === "New Joinees" && (
                    <Typography sx={{ color: "#777", fontSize: "12px"}}>
                      (This Month)
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid2>
          ))}
        </Grid2>
      </Box>
      
      <Box sx={{ml:5,mr:5,mt:6, display: 'flex', flexDirection: 'row', gap: 4.9 ,}}>
        <Paper elevation={6} sx={{ flex: 1, height: 400, borderRadius: 2,boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px",  }}> 
        <ResponsiveContainer width={775} height={350} >
            <h3 style={{ textAlign: 'center' }}>Employee Count</h3>
            <AreaChart width={775} height={350} data={monthOrder} margin={{ top: 10, right: 40, bottom: 20}}>
              <defs>
                <linearGradient id="colorUv" x1="0" y1="1" x2="1" y2="0" >
                  <stop offset="5%" stopColor="#14286D" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#14286D" stopOpacity={0.2} />
                </linearGradient>
                <linearGradient id="colorDel" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="5%" stopColor="#FE8600" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#FE8600" stopOpacity={0.2} />
                </linearGradient>
              </defs> 
              <XAxis dataKey="name"  interval={0} height={35}  />
              <YAxis allowDecimals={false} tickFormatter={(value) => (value % 1 === 0 ? value : "")}/>
              <CartesianGrid  strokeOpacity={0.2} horizontal={false}/>
              <Tooltip />
              <Legend/>
              <Area type="monotone" dataKey="employees" name={employeesAlias} stroke="#14286D" fillOpacity={1} fill="url(#colorUv)" activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="deletedemployees" name={deletedEmployeesAlias} stroke="#FE8600" fillOpacity={1} fill="url(#colorDel)" activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </Paper>
        
        <Paper elevation={6} sx={{ flex: 2, height: 400, borderRadius: 2,boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px", }}> 
        <ResponsiveContainer width="100%" height="80%">
            <h3 style={{ textAlign: 'center' }}>Location</h3>
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
              {/* <Legend layout="horizontal" verticalAlign="top" align="center" /> */}
            </PieChart>
          </ResponsiveContainer>
        </Paper>

      </Box>
      <Box sx={{ ml:5,mr:5,display: 'flex', flexDirection: 'row', gap: 4.9, marginTop: 4}}>
        <Paper elevation={6} sx={{ flex: 1, height: 400, borderRadius: 2 ,boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px",}}>
          <ResponsiveContainer width={775} height={350}>
            <h3 style={{ textAlign: 'center' }}>Department</h3>
            <BarChart
              width={775}
              height={350}
              data={departmentOrder}
              margin={{right: 40, bottom: 20, }}
            >  
              <XAxis dataKey="departmentName"  interval={0} height={35}  />
              <YAxis allowDecimals={false} tickFormatter={(value) => (value % 1 === 0 ? value : "")} />
              <CartesianGrid strokeOpacity={0.2} vertical={false}/>
              <Tooltip cursor={{ fill: "transparent" }} />
              {/* <Legend /> */}
              <Bar dataKey="indepartment" name={departmentAlias} fill="#656ec1" barSize={45}> 
                {departmentOrder.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colorsbar[index % colorsbar.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      <Paper elevation={6} sx={{ flex: 2, height: 400, borderRadius: 2,boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px", }}>
        <ResponsiveContainer width="100%" height="80%">
          <h3 style={{ textAlign: 'center' }}>Gender</h3>
          <PieChart>
            <Pie
              data={genderOrder}
              dataKey="genders"
              nameKey="genderName"
              cx="50%"
              cy="50%"
              outerRadius={110}
              fill="#8884d8"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, value }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);

                return (
                  <text
                    x={x}
                    y={y}
                    fill="white"
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={14}
                    fontWeight="bold"
                  >
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
            <Legend layout="horizontal" align="center" iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </Paper>
      </Box>
    </Box>
    
  );
};
export default Dashboard;

