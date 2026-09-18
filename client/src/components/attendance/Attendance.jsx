import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, CircularProgress, Box, TablePagination,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const Attendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [filteredAttendances, setFilteredAttendances] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [filter, setFilter] = useState('all');

  const fetchAttendance = async () => {
    const companyName = localStorage.getItem('companyName');
    try {
      const [attendanceRes, statsRes] = await Promise.all([
        axios.get('/attendance', { params: { companyName } }),
        axios.get('/attendance/stats', { params: { companyName } })
      ]);

      setAttendances(attendanceRes.data);
      setFilteredAttendances(attendanceRes.data);
      setStats(statsRes.data);
      console.log("Fetched data successfully");
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  useEffect(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const filtered = attendances.filter((attendance) => {
      const clockInDate = new Date(attendance.clockInDate);
      if (filter === 'today') {
        return (
          clockInDate.getDate() === today.getDate() &&
          clockInDate.getMonth() === today.getMonth() &&
          clockInDate.getFullYear() === today.getFullYear()
        );
      } else if (filter === 'week') {
        return clockInDate >= startOfWeek && clockInDate <= today;
      } else if (filter === 'month') {
        return clockInDate >= startOfMonth && clockInDate <= today;
      }
      return true;
    });

    setFilteredAttendances(filtered);
    setPage(0);
  }, [filter, attendances]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB');
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const processChartData = () => {
    return stats.map(item => ({
      name: new Date(item.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      onTime: item.late ,
      late: -item.onTime,
      total: item.total
    }));
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5, }}>
      <Box sx={{ maxWidth: 1400, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'black' }}>
            Attendance
          </Typography>
          <FormControl sx={{ width: 150, background: "#fff", borderRadius: 2, boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
            <Select
              value={filter}
              onChange={handleFilterChange}
              displayEmpty
              sx={{
                fontSize: "14px",
                fontWeight: "500",
                height: 40,
                color: "#333",
                padding: "6px 12px",
                "& .MuiSelect-icon": { color: "#777" },
                "&:hover": { backgroundColor: "#f1f3f5" },
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="week">This Week</MenuItem>
              <MenuItem value="month">This Month</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
          {!statsLoading && stats.length > 0 && (
            <Box sx={{ flex: '1 1 250px', p: 2, backgroundColor: 'white', borderRadius: 2, boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px" , height:'350px'}}>
              <Typography variant="h6" sx={{ mb: 2 }}>Attendance Trends (Last 7 Days)</Typography>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart
                  data={processChartData()}
                  margin={{ top: 10, right: 30, left: -25, bottom: 5 }}
                  stackOffset="sign"
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={13} />
                  <YAxis fontSize={13} />
                  <Tooltip
                    cursor={{ fill: "transparent" }}
                    formatter={(value, name) => {
                      if (name === 'Late (> 09:30)') return Math.abs(value);
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="onTime" name="Late ClockIn" fill="#F44336" stackId="a" barSize={35} />
                  <Bar dataKey="late" name="Early ClockIn" fill="#4CAF50" stackId="a" barSize={35} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}

          <Box sx={{ flex: '1 1 600px', minWidth: 0 }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer component={Paper} sx={{maxHeight: '462px', borderRadius: 2, overflow: 'hidden', boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px" }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell align="center" sx={{ color: '#000', fontWeight: 'bold' }}>Employee ID</TableCell>
                        <TableCell align="left" sx={{ color: '#000', fontWeight: 'bold' }}>Name</TableCell>
                        <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Department</TableCell>
                        <TableCell align="center"sx={{ color: '#000', fontWeight: 'bold' }}>ClockIn_Date</TableCell>
                        <TableCell align="center"sx={{ color: '#000', fontWeight: 'bold' }}>ClockIn_Time</TableCell>
                        <TableCell align="center" sx={{ color: '#000', fontWeight: 'bold' }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAttendances.length > 0 ? (
                        filteredAttendances
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((attendance, index) => (
                            <TableRow key={index}>
                              <TableCell align="center">{attendance.employeeId}</TableCell>
                              <TableCell align="left">{attendance.lastName} {attendance.firstName}</TableCell>
                              <TableCell>{attendance.department}</TableCell>
                              <TableCell align="center">{formatDate(attendance.clockInDate)}</TableCell>
                              <TableCell align="center">{attendance.clockInTime}</TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={attendance.clockInTime ? "Working" : "Not Working"}
                                  color={attendance.clockInTime ? "success" : "default"}
                                  sx={{ width: "100px", minWidth: "unset" }}
                                />
                              </TableCell>
                            </TableRow>
                          ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            No attendance records found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredAttendances.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Attendance;