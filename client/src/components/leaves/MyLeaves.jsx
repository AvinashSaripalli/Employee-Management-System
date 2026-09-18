import React, { useEffect, useState } from 'react';
import axios from '../../api/axios';
import { 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Paper, Typography, Chip, CircularProgress, Box, Card, CardContent, 
  TablePagination 
} from '@mui/material';

const MyLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const fetchMyLeaves = async () => {
    const employeeId = localStorage.getItem('userEmployeeId');
    const companyName = localStorage.getItem('companyName');
    
    if (!employeeId) {
      console.error('No employee ID found in localStorage');
      return;
    }

    try {
      const response = await axios.get('/leaves', {
        params: { employeeId, companyName },
      });
      setLeaves(response.data);
      console.log("Fetched Leaves Successfully", response.data);
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyLeaves();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB'); 
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'success';
      case 'Rejected': return 'error';
      case 'Pending': return 'warning';
      default: return 'default';
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
      <Card sx={{ maxWidth: 1300, width: '100%', p: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', mb: 2, color: 'black' }}>
            My Leave Requests
          </Typography>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Leave Type</TableCell>
                      <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Start Date</TableCell>
                      <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>End Date</TableCell>
                      <TableCell sx={{ color: '#000', fontWeight: 'bold' }}>Reason</TableCell>
                      <TableCell align="center" sx={{ color: '#000', fontWeight: 'bold' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {leaves.length > 0 ? (
                      leaves.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((leave, index) => (
                        <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                          <TableCell>{leave.leave_type}</TableCell>
                          <TableCell>{formatDate(leave.start_date)}</TableCell>
                          <TableCell>{formatDate(leave.end_date)}</TableCell>
                          <TableCell>{leave.reason}</TableCell>
                          <TableCell align="center">
                            <Chip 
                              label={leave.status} 
                              color={getStatusColor(leave.status)}
                              style={{ width: "100px", minWidth: "unset" }}
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No leave records found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                rowsPerPageOptions={[5]}
                //rowsPerPageOptions={[5, 10, 25]}
                component="div"
                count={leaves.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default MyLeaves;
