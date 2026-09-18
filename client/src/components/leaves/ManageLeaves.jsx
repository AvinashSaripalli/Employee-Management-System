import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Chip, TablePagination
} from '@mui/material';
import axios from '../../api/axios';

const ManageLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [page, setPage] = useState(0); 
  const [rowsPerPage, setRowsPerPage] = useState(5); 

  const fetchLeaves = async () => {
    try {
      const token = localStorage.getItem("token");
      const companyName = localStorage.getItem("companyName"); 
      
      const response = await axios.get('/leaves/leave', {
        headers: { Authorization: `Bearer ${token}` },
        params: { companyName },
      });
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leave data:', error);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleUpdateStatus = async (leaveId, status) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put('/leaves/update-status',
        { leaveId, status },
        { headers: { Authorization: `Bearer ${token}` } }
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
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Leave Management</Typography>

      <TableContainer component={Paper} sx={{
        maxHeight: '462px',
        overflowY: 'auto',
        boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px",
      }}>
        <Table stickyHeader aria-label="leaves table">
          <TableHead sx={{ backgroundColor: '#f4f7fe', height:"80px" }} >
            <TableRow>
              <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Employee ID</TableCell>
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
                  <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                    <TableCell align='center'>{leave.employeeId}</TableCell>
                    <TableCell align='left'>{leave.leave_type}</TableCell>
                    <TableCell align='left'>{new Date(leave.start_date).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell align='left'>{new Date(leave.end_date).toLocaleDateString('en-GB')}</TableCell>
                    <TableCell align='left'>{leave.reason}</TableCell>
                    <TableCell align="left">
                      {leave.status === 'Pending' ? (
                        <>
                          <Button
                            variant="contained"
                            color="success"
                            onClick={() => handleUpdateStatus(leave.id, 'Approved')}
                            sx={{ mr: 1 }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            color="error"
                            onClick={() => handleUpdateStatus(leave.id, 'Rejected')}
                          >
                            Reject
                          </Button>
                        </>
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
  );
};

export default ManageLeaves;

