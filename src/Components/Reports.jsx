import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper,TableContainer, Table, TableHead, TableBody, TableRow, TableCell, TablePagination, Button } from '@mui/material';
import axios from 'axios';

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  useEffect(() => {
    axios.get('http://localhost:5000/api/reports')
      .then((response) => {
        setReports(response.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Error fetching reports');
        setLoading(false);
      });
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">Loading Reports...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h5">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ pl: 17, pr: 17, mt: '40px' }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>Work Reports</Typography>
      <TableContainer component={Paper} sx={{
        maxHeight: '462px',
        overflowY: 'auto',
        boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px",
      }}>
        <Table>
          <TableHead sx={{ height:"80px" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Employee ID</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Department</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Tasks</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Hours Worked</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((report, index) => (
                <TableRow key={index} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' }, height:"70px" }}>
                  <TableCell>{report.employeeId}</TableCell>
                  <TableCell>{report.department}</TableCell>
                  <TableCell>{new Date(report.date).toLocaleDateString()}</TableCell>
                  <TableCell>{report.tasks}</TableCell>
                  <TableCell>{report.hoursWorked}</TableCell>
                  <TableCell>{report.status}</TableCell>
                  <TableCell><Button variant='contained' size='small'>View</Button></TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        </TableContainer>
      <TablePagination
          component="div"
          count={reports.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
    </Box>
  );
};

export default Reports;


