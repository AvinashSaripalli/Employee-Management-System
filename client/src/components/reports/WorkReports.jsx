import React, { useState, useEffect } from "react";
import {
  Container, TextField, Button, Typography, Snackbar,
  Dialog, DialogActions, DialogContent, DialogTitle, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,IconButton,Divider,
  Grid, TablePagination, Box
} from "@mui/material";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import CloseIcon from "@mui/icons-material/Close";
import axios from '../../api/axios';

const WorkReports = () => {
  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState({
    date: "",
    taskName: "",
    workDescription: "",
    hoursWorked: "",
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [errors, setErrors] = useState({});
  const [selectedReport, setSelectedReport] = useState(null);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);
  const department = localStorage.getItem("userDepartment");
  const employeeId = localStorage.getItem("userEmployeeId");
  const worked = localStorage.getItem("workedTime");
  const companyName = localStorage.getItem("companyName");
  
  useEffect(() => {
    if (!employeeId) return;

    axios
      .get(`/reports/getAll?employeeId=${employeeId}`)
      .then((res) => setReports(res.data))
      .catch((err) => console.error("Axios GET error:", err));
  }, [employeeId]);

  const validateForm = () => {
    const newErrors = {};
    if (!newReport.date) newErrors.date = "Date is required";
    if (!newReport.taskName) newErrors.taskName = "Task name is required";
    
    const cleanedDescription = newReport.workDescription
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !/^\d+\.\s*$/.test(line));

    if (cleanedDescription.length === 0) {
      newErrors.workDescription = "Please enter at least one work item.";
    }
    if (!newReport.hoursWorked)
      newErrors.hoursWorked = "Please Clock Out to submit the Report";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const workDescriptionArray = newReport.workDescription
      .split("\n")
      .filter((line) => line.trim() !== "");

    try {
      const response = await axios.post("/reports", {
        ...newReport,
        workDescription: JSON.stringify(workDescriptionArray),
        employeeId,
        department,
        companyName,
      });

      setReports([...reports, { ...newReport, id: response.data.id }]);
      setNewReport({ date: "", taskName: "", workDescription: "", hoursWorked: "" });
      setOpenSnackbar(true);
      setOpenDialog(false);
    } catch (error) {
      console.error("Axios POST error:", error.response?.data || error.message);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedReports = reports.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Grid container spacing={3} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }} align="center" gutterBottom>
          My Work Reports
        </Typography>
        <Grid>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => {
              const today = new Date().toISOString().split("T")[0];
              setNewReport({ date: today, taskName: "", workDescription: "1. ", hoursWorked: worked });
              setOpenDialog(true);
            }}
          >
            Add Report
          </Button>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ color: '#000', fontWeight: 'bold' }}>Date</TableCell>
              <TableCell align="left" sx={{ color: '#000', fontWeight: 'bold' }}>Task Name</TableCell>
              <TableCell align="left" sx={{ color: '#000', fontWeight: 'bold' }}>Work Description</TableCell>
              <TableCell align="center" sx={{ color: '#000', fontWeight: 'bold' }}>Hours Worked</TableCell>
              <TableCell align="left" sx={{ color: '#000', fontWeight: 'bold' }}>Feedback</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedReports.map((report) => (
              <TableRow key={report.id} sx={{ '&:nth-of-type(odd)': { backgroundColor: '#f9f9f9' } }}>
                <TableCell align="center">{new Date(report.date).toLocaleDateString("en-GB")}</TableCell>
                <TableCell align="left">{report.taskName}</TableCell>
                <TableCell align="left">
                  {Array.isArray(JSON.parse(report.workDescription)) ? (
                    JSON.parse(report.workDescription).map((line, index) => (
                      <Typography key={index} variant="body2">
                        {line}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2">{report.workDescription}</Typography>
                  )}
                </TableCell >
                <TableCell align="center">{report.hoursWorked}
                </TableCell>
                <TableCell align="left">
                  <Button variant="contained" size="small"
                    onClick={() => {
                      setSelectedReport(report); 
                      setOpenFeedbackDialog(true);
                    }}>
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {paginatedReports.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No reports found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={reports.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />

      <Dialog open={openDialog} 
        onClose={() => { setOpenDialog(false); 
          setErrors({});
        }} 
      fullWidth maxWidth="sm">
        <DialogTitle>Add Report</DialogTitle>
        <DialogContent>
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="dense"
            value={newReport.date}
            onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
            required
            error={!!errors.date}
            helperText={errors.date}
            InputProps={{
              inputProps: {
                min: new Date().toISOString().split("T")[0],
              },
            }}
          />
          <TextField
            label="Task Name"
            fullWidth
            margin="dense"
            value={newReport.taskName}
            onChange={(e) => setNewReport({ ...newReport, taskName: e.target.value })}
            required
            error={!!errors.taskName}
            helperText={errors.taskName}
          />
          <TextField
            label="Work Description"
            multiline
            rows={5}
            fullWidth
            margin="dense"
            value={newReport.workDescription}
            onChange={(e) => {
              let value = e.target.value;
              if (!value.startsWith("1. ")) {
                value = "1. ";
              }
              setNewReport({ ...newReport, workDescription: value });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const lines = newReport.workDescription.split("\n");
                const lastLine = lines[lines.length - 1];
                const match = lastLine.match(/^(\d+)\.\s/);
                let nextNumber = 1;
                if (match) {
                  nextNumber = parseInt(match[1]) + 1;
                } else if (lines.length > 0) {
                  nextNumber = lines.length + 1;
                }
                const newValue = newReport.workDescription + `\n${nextNumber}. `;
                setNewReport({ ...newReport, workDescription: newValue });
              }
            }}
            error={!!errors.workDescription}
            helperText={errors.workDescription}
          />

          <TextField
            label="Hours Worked"
            fullWidth
            margin="dense"
            value={newReport.hoursWorked}
            onChange={(e) => setNewReport({ ...newReport, hoursWorked: e.target.value })}
            required
            error={!!errors.hoursWorked}
            helperText={errors.hoursWorked}
            disabled
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => { 
          setOpenDialog(false);
          setErrors({}); 
          }} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openFeedbackDialog}
        onClose={() => setOpenFeedbackDialog(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle fontWeight="bold">Feedback
        <IconButton
            color="inherit"
            onClick={() => setOpenFeedbackDialog(false)}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent>
          <Typography variant="body1">
          {selectedReport?.feedback?.toLowerCase() === "pending" || !selectedReport?.feedback
          ? "No Feedback available"
          : selectedReport.feedback}
          </Typography>
        </DialogContent>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          backgroundColor: "#4CAF50", 
          color: "#fff",   
        }}
        message="Report saved successfully!"
      />
    </Box>
  );
};

export default WorkReports;