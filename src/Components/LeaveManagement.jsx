import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Chip, TablePagination, Grid, Card, CardContent, CardHeader
} from '@mui/material';
import axios from '../api/axios';

const LeaveManagement = () => {
  const [leaves, setLeaves] = useState([]);
  const [page, setPage] = useState(0); 
  const [rowsPerPage, setRowsPerPage] = useState(5); 
  const [leaveCounts, setLeaveCounts] = useState({ total: 0, approved: 0, pending: 0, rejected: 0 });

  const fetchLeaves = async () => {
    try {
      const companyName = localStorage.getItem("companyName"); 
      
      const response = await axios.get('/leaves/leave', {
        params: { companyName },
      });
      setLeaves(response.data);

      const countResponse = await axios.get('/leaves/leave-counts', {
        params: { companyName },
      });
    
      setLeaveCounts(countResponse.data);

    } catch (error) {
      console.error('Error fetching leave data:', error);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);




  const handleUpdateStatus = async (leaveId, status) => {
    try {
      await axios.put('/leaves/update-status',
        { leaveId, status },
      );
      fetchLeaves();
    } catch (error) {
      console.error(`Error updating leave status to ${status}:`, error);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };

  return (
    <Box sx={{ display: 'flex',gap: 3, pl: 6, pr:6, mt: '60px' }}>
      <Box sx={{ flex: 1 ,}}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Leave Management</Typography>

        <TableContainer component={Paper} sx={{
          maxHeight: '462px',
          overflowY: 'auto',
          boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px",
        }}>
          <Table stickyHeader aria-label="leaves table">
            <TableHead sx={{ backgroundColor: '#f4f7fe', height:"80px" }} >
              <TableRow>
                <TableCell align='Center' sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Employee ID</TableCell>
                <TableCell align='left' sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Leave Type</TableCell>
                <TableCell align='left' sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Start Date</TableCell>
                <TableCell align='left' sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>End Date</TableCell>
                <TableCell align='left' sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Reason</TableCell>
                <TableCell align="left" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {leaves.length > 0 ? (
                leaves
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((leave, index) => (
                    <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' },maxHeight: '60px', }}>
                      <TableCell align='center'>{leave.employeeId}</TableCell>
                      <TableCell align='left'>{leave.leave_type}</TableCell>
                      <TableCell align='left'>{new Date(leave.start_date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell align='left'>{new Date(leave.end_date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell align='left'>{leave.reason}</TableCell>
                      <TableCell align="left">
                        {leave.status === 'Pending' ? (
                          <Box sx={{ display: 'inline-flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              onClick={() => handleUpdateStatus(leave.id, 'Approved')}
                              sx={{ mr: 1 }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              color="error"
                              onClick={() => handleUpdateStatus(leave.id, 'Rejected')}
                            >
                              Reject
                            </Button>
                          </Box>
                        ) : (
                          <Chip
                            label={leave.status}
                            color={
                              leave.status === 'Approved' ? 'success' :
                              leave.status === 'Rejected' ? 'error' : 'warning'
                            }
                            style={{ width: "100px", minWidth: "unset"}}
                          />
                        )}
                      </TableCell>

                    </TableRow>
                  ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                    No leave records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={leaves.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Box>

      <Box sx={{ ml: 1,mt:6, width: '390px' }}>
        <Grid container spacing={3}>
          <Grid item xs={6}>
            <Card sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  borderRadius: 2,                  
                  p: 2,
                  boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px",
                  minHeight: 30,
                  minWidth: 130,
                  borderBottom: `13px solid #11146a`
                }}>
              
              <CardHeader title="Total Leaves" sx={{width: '100%', fontWeight: "bold" }} />
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>{leaveCounts.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  borderRadius:2,                
                  p: 2,
                  boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px",
                  minHeight: 30,
                  minWidth: 130,
                  borderBottom: `13px solid green`
                }}>
              <CardHeader title="Approved" sx={{width: '100%',fontWeight: "bold" }} />
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>{leaveCounts.approved}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  p: 2,
                  borderRadius:2,
                  //boxShadow: 3,
                  boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px",
                  minHeight: 30,
                  minWidth: 130,
                  borderBottom: `13px solid #fc4404 `
                }}>
              <CardHeader title="Pending" sx={{width: '100%' }} />
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>{leaveCounts.pending}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={6}>
            <Card sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  p: 2,
                  borderRadius:2,
                  //boxShadow: 3,
                  boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px",
                  minHeight: 30,
                  minWidth: 130,
                  borderBottom: `13px solid #da0704`
                }}>
              <CardHeader title="Rejected" sx={{width: '100%' }} />
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: "bold" }}>{leaveCounts.rejected}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
};

export default LeaveManagement;


