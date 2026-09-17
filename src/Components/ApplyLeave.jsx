import React, { useState, useEffect } from "react";
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
  Divider,
  Chip,
  CircularProgress,
  Paper
} from "@mui/material";
import axios from '../api/axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';

const ApplyLeave = () => {
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [onlyTomorrow, setOnlyTomorrow] = useState(false);
  const [halfDay, setHalfDay] = useState(false);
  const [errors, setErrors] = useState({});
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentLeaves, setRecentLeaves] = useState([]);

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split("T")[0];

  const upcomingHolidays = [
    { date: "2025-01-26", name: "Republic Day" },
    { date: "2025-03-17", name: "Holi" },
    { date: "2025-04-14", name: "Ambedkar Jayanti" },
    { date: "2025-05-01", name: "Labour Day" },
    { date: "2025-08-15", name: "Independence Day" },
    { date: "2025-08-29", name: "Raksha Bandhan" },
    { date: "2025-10-02", name: "Gandhi Jayanti" },
    { date: "2025-10-22", name: "Dussehra" },
    { date: "2025-11-01", name: "Diwali" },
    { date: "2025-11-14", name: "Children's Day" },
    { date: "2025-12-25", name: "Christmas" },
    { date: "2026-01-01", name: "New Year's Day" },
  ];

  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const employeeId = localStorage.getItem("userEmployeeId");
        const companyName = localStorage.getItem("companyName");

        if (!employeeId || !companyName) return;

        const response = await axios.get("/leaves", {
          params: { employeeId, companyName },
        });
        setLeaves(response.data);

        const recentResponse = await axios.get("/leaves/recent", {
          params: { employeeId, companyName },
        });
        setRecentLeaves(recentResponse.data);
      } catch (error) {
        console.error("Error fetching leaves:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaves();
  }, []);

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
      const response = await axios.post("/leaves/apply", leaveData);
      alert(response.data.message);
      const updatedLeaves = await axios.get("/leaves", {
        params: { employeeId, companyName },
      });
      setLeaves(updatedLeaves.data);
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

  const isHoliday = (date) => {
    const currentDate = dayjs(date).format('YYYY-MM-DD');
    return upcomingHolidays.some((holiday) => holiday.date === currentDate);
  };

  const CustomDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const isHolidayDate = !outsideCurrentMonth && isHoliday(day);
    const holidayName = isHolidayDate
      ? upcomingHolidays.find((holiday) => holiday.date === dayjs(day).format('YYYY-MM-DD'))?.name
      : '';

    return (
      <Box
        sx={{
          position: 'relative',
          '& .holiday-indicator': {
            position: 'absolute',
            bottom: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#ff9800', 
          },
        }}
      >
        <PickersDay {...other} day={day} outsideCurrentMonth={outsideCurrentMonth} />
        {isHolidayDate && (
          <Box
            className="holiday-indicator"
            title={holidayName}
          />
        )}
      </Box>
    );
  };

  const getStatusChip = (status) => {
    switch (status) {
      case 'Approved':
        return <Chip label="Approved" color="success" size="small" />;
      case 'Pending':
        return <Chip label="Pending" color="warning" size="small" />;
      case 'Rejected':
        return <Chip label="Rejected" color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  return (
    <Box sx={{ maxWidth: 1380, margin: "auto", mt: 3, ml: 6 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card elevation={3} sx={{ mb: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <CardContent sx={{ py: 1, textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Total Leaves
                  </Typography>
                  <Typography variant="h5">12</Typography>
                </CardContent>
              </Grid>
              <Grid item xs={3}>
                <CardContent sx={{ py: 1, textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Leave Balance
                  </Typography>
                  <Typography variant="h5">10</Typography>
                </CardContent>
              </Grid>
              <Grid item xs={3}>
                <CardContent sx={{ py: 1, textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Extra Leaves taken
                  </Typography>
                  <Typography variant="h5">8</Typography>
                </CardContent>
              </Grid>
              <Grid item xs={3}>
                <CardContent sx={{ py: 1, textAlign: 'center' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Public Holidays
                  </Typography>
                  <Typography variant="h5">24</Typography>
                </CardContent>
              </Grid>
            </Grid>
          </Card>

          <Card elevation={3}>
            <CardContent>
              <Typography variant="h5" mb={2} textAlign="left">
                Apply Leave
              </Typography>
              <Grid container spacing={1}>
                <Grid item xs={12} sm={6}>
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
                          disabled={onlyTomorrow}
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
                          disabled={onlyTomorrow}
                        />
                      </Grid>

                      <Grid item xs={12}>
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
                      </Grid>

                      <Grid item xs={6}>
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{ backgroundColor: "#E0E0E0", color: "#000" }}
                          onClick={handleClear}
                        >
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
                </Grid>

                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateCalendar
                      slots={{ day: CustomDay }}
                      sx={{
                        '& .Mui-selected': {
                          backgroundColor: '#1976d2 !important',
                        },
                      }}
                    />
                  </LocalizationProvider>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" mb={2} sx={{ fontWeight: 'bold' }}>
                  Recent Leaves
                </Typography>
                {loading ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : recentLeaves.length > 0 ? (
                  <Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 1 }}>
                    {recentLeaves.map((leave, index) => (
                      <Box key={index} sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" mb={1} justifyContent="space-between">
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {leave.leave_type}
                          </Typography>
                          {getStatusChip(leave.status)}
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          {dayjs(leave.start_date).format('MMM D, YYYY')} -{' '}
                          {dayjs(leave.end_date).format('MMM D, YYYY')}
                        </Typography>
                        {leave.reason && (
                          <Typography variant="body2" sx={{ mt: 1}}>
                            &quot;{leave.reason.substring(0, 50)}{leave.reason.length > 50 ? '...' : ''}&quot;
                          </Typography>
                        )}
                        <Divider sx={{ my: 2 }} />
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: '#fafafa' }}>
                    <Typography variant="body2" color="text.secondary">
                      No recent leave applications found.
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>

            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" mb={2} sx={{ fontWeight: 'bold' }}>
                  Upcoming Holidays
                </Typography>
                <Box sx={{ maxHeight: 180, overflowY: 'auto', pr: 1 }}>
                  {upcomingHolidays.map((holiday, index) => (
                    <Box key={index} sx={{ mb: 1 }}>
                      <Box>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                          {holiday.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {dayjs(holiday.date).format('MMMM D, YYYY (dddd)')}
                        </Typography>
                      </Box>
                      {index < upcomingHolidays.length - 1 && <Divider sx={{ my: 1.5 }} />}
                    </Box>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApplyLeave;