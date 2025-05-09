import React, { useState } from "react";
import {
  TextField,
  Button,
  MenuItem,
  Box,
  Typography,
  FormControlLabel,
  Checkbox,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import axios from "axios";

const ApplyLeave = () => {
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [onlyTomorrow, setOnlyTomorrow] = useState(false);
  const [halfDay, setHalfDay] = useState(false);
  const [errors, setErrors] = useState({});

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split("T")[0];

  const validateForm = () => {
    let newErrors = {};

    if (!leaveType) newErrors.leaveType = "Leave type is required.";
    if (!startDate) newErrors.startDate = "Start date is required.";
    if (!endDate) newErrors.endDate = "End date is required.";
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = "End date cannot be before start date.";
    }
    if (reason.length < 10) {
      newErrors.reason = "Reason must be at least 10 characters.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const employeeId = localStorage.getItem("userEmployeeId");
    const companyName = localStorage.getItem("companyName");
    if (!employeeId) {
      alert("Error: Employee ID not found. Please log in again.");
      return;
    }

    const leaveData = {
      employeeId,
      companyName,
      leaveType,
      startDate,
      endDate,
      reason,
      onlyTomorrow,
      halfDay,
    };

    try {
      const response = await axios.post("http://localhost:5000/api/leaves/apply", leaveData);
      alert(response.data.message);
      handleClear();
    } catch (error) {
      alert("Failed to apply for leave. Please try again.");
    }
  };

  const handleClear = () => {
    setLeaveType("");
    setStartDate("");
    setEndDate("");
    setReason("");
    setOnlyTomorrow(false);
    setHalfDay(false);
    setErrors({});
  };

  const handleOnlyTomorrowChange = (e) => {
    const checked = e.target.checked;
    setOnlyTomorrow(checked);
    if (checked) {
      setStartDate(tomorrowDate);
      setEndDate(tomorrowDate);
      setHalfDay(false); 
    } else {
      setStartDate("");
      setEndDate("");
    }
  };

  const handleHalfDayChange = (e) => {
    if (e.target.checked) {
      setOnlyTomorrow(false);
    }
    setHalfDay(e.target.checked);
  };

  return (
    <Box sx={{ maxWidth: 500, margin: "auto", mt:7 }}>
      <Card elevation={5} sx={{ p: 2 }}>
        <CardContent>
          <Typography variant="h5" mb={2} textAlign="center">
            Apply Leave
          </Typography>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  select
                  label="Leave Type"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  fullWidth
                  error={!!errors.leaveType}
                  helperText={errors.leaveType}
                >
                  <MenuItem value="Sick Leave">Sick Leave</MenuItem>
                  <MenuItem value="Casual Leave">Casual Leave</MenuItem>
                  <MenuItem value="Earned Leave">Earned Leave</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            <Grid container spacing={2} alignItems="center" mt={2}>
              <Grid item xs={6}>
                <FormControlLabel
                  control={<Checkbox checked={onlyTomorrow} onChange={handleOnlyTomorrowChange} />}
                  label="Only For Tomorrow"
                />
              </Grid>
              <Grid item xs={6}>
                <FormControlLabel
                  control={<Checkbox checked={halfDay} onChange={handleHalfDayChange} />}
                  label="Half Day"
                />
              </Grid>
            </Grid>

            <Grid container spacing={2} mt={1}>
              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="From"
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  fullWidth
                  error={!!errors.startDate}
                  helperText={errors.startDate}
                  inputProps={{ min: today.toISOString().split("T")[0] }}
                  //disabled={onlyTomorrow}
                />
              </Grid>

              <Grid item xs={6}>
                <TextField
                  type="date"
                  label="To"
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  fullWidth
                  error={!!errors.endDate}
                  helperText={errors.endDate}
                  inputProps={{ min: startDate || today.toISOString().split("T")[0] }}
                  //disabled={onlyTomorrow || !startDate}
                />
              </Grid>
            </Grid>

            <TextField
              label="Reason for Leave"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              fullWidth
              multiline
              rows={3}
              margin="normal"
              error={!!errors.reason}
              helperText={errors.reason}
            />


            <Grid container spacing={2} mt={2}>
              <Grid item xs={6}>
                <Button variant="contained" fullWidth sx={{ backgroundColor: "#E0E0E0", color: "#000" }} onClick={handleClear}>
                  Clear
                </Button>
              </Grid>
              <Grid item xs={6}>
                <Button type="submit" variant="contained" fullWidth color="primary">
                  Apply
                </Button>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default ApplyLeave;
