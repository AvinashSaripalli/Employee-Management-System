import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  Paper,
  LinearProgress,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Stack,
} from '@mui/material';
import axios from '../../api/axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import dayjs from 'dayjs';
import { FiCalendar, FiCheckCircle, FiClock, FiInfo } from 'react-icons/fi';
import { LEAVE_TYPE_META, statusColor, formatLeaveDate, leaveIdentityParams } from '../../utils/leaveConfig';

const isWeekend = (date) => {
  const day = dayjs(date).day();
  return day === 0 || day === 6;
};

const workingDaysBetween = (start, end, halfDay, holidaySet) => {
  if (!start || !end) return 0;
  if (halfDay) return 0.5;
  let count = 0;
  let cursor = dayjs(start);
  const last = dayjs(end);
  if (cursor.isAfter(last)) return 0;
  while (!cursor.isAfter(last)) {
    const key = cursor.format('YYYY-MM-DD');
    if (!isWeekend(cursor) && !holidaySet.has(key)) count += 1;
    cursor = cursor.add(1, 'day');
  }
  return count;
};

const ApplyLeave = () => {
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [onlyTomorrow, setOnlyTomorrow] = useState(false);
  const [halfDay, setHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState('AM');
  const [contactPhone, setContactPhone] = useState(localStorage.getItem('userPhoneNumber') || '');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [myLeaves, setMyLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [policies, setPolicies] = useState({ types: {}, holidays: [] });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const today = dayjs().format('YYYY-MM-DD');
  const tomorrowDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const holidaySet = useMemo(
    () => new Set((policies.holidays || []).map((h) => h.date)),
    [policies.holidays]
  );
  const upcomingHolidays = useMemo(
    () =>
      (policies.holidays || [])
        .filter((h) => h.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 8),
    [policies.holidays, today]
  );

  const gender = (localStorage.getItem('userGender') || '').toLowerCase();
  const leaveTypeOptions = useMemo(
    () =>
      Object.entries(policies.types || {}).filter(([, policy]) => {
        if (!policy.gender) return true;
        if (!gender) return true;
        return policy.gender.toLowerCase() === gender;
      }),
    [policies.types, gender]
  );

  const selectedPolicy = policies.types?.[leaveType];
  const selectedBalance = balance?.breakdown?.find((row) => row.leaveType === leaveType);
  const requestedDays = workingDaysBetween(startDate, endDate, halfDay, holidaySet);

  const loadData = useCallback(async () => {
    const params = leaveIdentityParams();
    try {
      const [policyRes, balanceRes, leavesRes, recentRes] = await Promise.allSettled([
        axios.get('/leaves/policies'),
        axios.get('/leaves/balance', { params }),
        axios.get('/leaves', { params }),
        axios.get('/leaves/recent', { params }),
      ]);
      if (policyRes.status === 'fulfilled') setPolicies(policyRes.value.data);
      if (balanceRes.status === 'fulfilled') setBalance(balanceRes.value.data);
      if (leavesRes.status === 'fulfilled') setMyLeaves(leavesRes.value.data || []);
      if (recentRes.status === 'fulfilled') setRecentLeaves(recentRes.value.data || []);
      const failed = [balanceRes, leavesRes, recentRes].find((result) => result.status === 'rejected');
      if (failed) console.error('Error fetching leave data:', failed.reason);
    } catch (error) {
      console.error('Error fetching leave data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const minStartDate = selectedPolicy?.allowPast
    ? dayjs().subtract(selectedPolicy.maxPastDays || 7, 'day').format('YYYY-MM-DD')
    : today;

  const validateForm = () => {
    const newErrors = {};
    if (!leaveType) newErrors.leaveType = 'Leave type is required.';
    if (!startDate) newErrors.startDate = 'Start date is required.';
    if (!endDate) newErrors.endDate = 'End date is required.';
    if (startDate && endDate && startDate > endDate) {
      newErrors.endDate = 'End date cannot be before start date.';
    }
    if (halfDay && startDate && endDate && startDate !== endDate) {
      newErrors.endDate = 'Half-day leave must be a single date.';
    }
    if (reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters.';
    }
    if (requestedDays <= 0 && startDate && endDate) {
      newErrors.endDate = 'Selected range has no working days.';
    }
    if (selectedBalance?.available != null && requestedDays > selectedBalance.available) {
      newErrors.leaveType = `Only ${selectedBalance.available} day(s) remaining for this type.`;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const response = await axios.post('/leaves/apply', {
        ...leaveIdentityParams(),
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
        onlyTomorrow,
        halfDay,
        halfDaySession: halfDay ? halfDaySession : null,
        contactPhone,
      });
      if (response.data.leave?.employeeId) {
        localStorage.setItem('userEmployeeId', response.data.leave.employeeId);
      }
      if (response.data.leave?.companyName) {
        localStorage.setItem('companyName', response.data.leave.companyName);
      }
      setSnackbar({
        open: true,
        message: response.data.message || 'Leave request submitted',
        severity: 'success',
      });
      handleClear();
      await loadData();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to apply for leave.',
        severity: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    setLeaveType('');
    setStartDate('');
    setEndDate('');
    setReason('');
    setOnlyTomorrow(false);
    setHalfDay(false);
    setHalfDaySession('AM');
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
      setStartDate('');
      setEndDate('');
    }
  };

  const handleHalfDayChange = (e) => {
    const checked = e.target.checked;
    setHalfDay(checked);
    if (checked) {
      setOnlyTomorrow(false);
      if (startDate) setEndDate(startDate);
    }
  };

  const leaveDateMap = useMemo(() => {
    const map = {};
    myLeaves
      .filter((leave) => ['Pending', 'Approved'].includes(leave.status))
      .forEach((leave) => {
        let cursor = dayjs(leave.start_date);
        const last = dayjs(leave.end_date);
        while (!cursor.isAfter(last)) {
          map[cursor.format('YYYY-MM-DD')] = leave.status;
          cursor = cursor.add(1, 'day');
        }
      });
    return map;
  }, [myLeaves]);

  const CustomDay = (props) => {
    const { day, outsideCurrentMonth, ...other } = props;
    const key = dayjs(day).format('YYYY-MM-DD');
    const holiday = !outsideCurrentMonth && holidaySet.has(key);
    const leaveStatus = !outsideCurrentMonth ? leaveDateMap[key] : null;
    const weekend = isWeekend(day);
    return (
      <Box sx={{ position: 'relative' }}>
        <PickersDay
          {...other}
          day={day}
          outsideCurrentMonth={outsideCurrentMonth}
          sx={{
            ...(weekend && !outsideCurrentMonth ? { color: 'text.disabled' } : {}),
            ...(leaveStatus === 'Approved' ? { bgcolor: 'success.light', fontWeight: 700 } : {}),
            ...(leaveStatus === 'Pending' ? { bgcolor: 'warning.light', fontWeight: 700 } : {}),
          }}
        />
        {holiday && (
          <Box
            title={policies.holidays.find((h) => h.date === key)?.name}
            sx={{
              position: 'absolute',
              bottom: 4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 6,
              height: 6,
              borderRadius: '50%',
              bgcolor: 'secondary.main',
            }}
          />
        )}
      </Box>
    );
  };

  const summaryCards = [
    { label: 'Annual quota', value: balance?.allocated ?? '—', icon: <FiCalendar size={18} color="#14286D" /> },
    { label: 'Available', value: balance?.available ?? '—', icon: <FiCheckCircle size={18} color="#16A34A" /> },
    { label: 'Pending', value: balance?.pending ?? '—', icon: <FiClock size={18} color="#F59E0B" /> },
    { label: 'Public holidays', value: balance?.holidays ?? upcomingHolidays.length, icon: <FiInfo size={18} color="#FE8600" /> },
  ];

  return (
    <Box sx={{ maxWidth: 1380, mx: 'auto', mt: 2, px: { xs: 1, md: 2 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {summaryCards.map((card) => (
              <Grid item xs={6} sm={3} key={card.label}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ py: 1.5, px: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      {card.icon}
                      <Typography variant="caption" color="text.secondary">
                        {card.label}
                      </Typography>
                    </Stack>
                    <Typography variant="h5">{loading ? '—' : card.value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {balance?.breakdown?.length > 0 && (
            <Card sx={{ mb: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" sx={{ mb: 1.5 }}>
                  Leave balances
                </Typography>
                <Grid container spacing={1.5}>
                  {balance.breakdown.map((row) => {
                    const meta = LEAVE_TYPE_META[row.leaveType] || {};
                    const max = row.allocated || 1;
                    const consumed = row.used + row.pending;
                    const pct = row.allocated == null ? 0 : Math.min(100, (consumed / max) * 100);
                    return (
                      <Grid item xs={12} sm={6} md={4} key={row.leaveType}>
                        <Paper
                          elevation={0}
                          sx={{
                            p: 1.25,
                            border: '1px solid',
                            borderColor: 'divider',
                            borderRadius: 2,
                            bgcolor: meta.bg || '#F6F8FE',
                          }}
                        >
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {row.code} · {row.leaveType}
                            </Typography>
                            <Typography variant="caption">
                              {row.allocated == null ? `${row.used} used` : `${row.available} left`}
                            </Typography>
                          </Stack>
                          {row.allocated != null && (
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{ mt: 1, height: 6, borderRadius: 4, bgcolor: '#fff' }}
                            />
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent>
              <Typography variant="h5" mb={0.5}>
                Apply for leave
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Working days exclude weekends and public holidays. Requests go to HR or your manager for approval.
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <form onSubmit={handleSubmit}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          select
                          label="Leave type"
                          value={leaveType}
                          onChange={(e) => setLeaveType(e.target.value)}
                          fullWidth
                          error={!!errors.leaveType}
                          helperText={errors.leaveType || (selectedPolicy?.minNoticeDays
                            ? `Requires ${selectedPolicy.minNoticeDays} day(s) notice`
                            : selectedPolicy?.allowPast
                              ? 'Backdated applications allowed for a limited period'
                              : ' ')}
                        >
                          {leaveTypeOptions.map(([name, policy]) => (
                            <MenuItem key={name} value={name}>
                              {policy.code} — {name}
                              {policy.allocated != null ? ` (${policy.allocated} / year)` : ' (unlimited)'}
                            </MenuItem>
                          ))}
                        </TextField>
                      </Grid>

                      <Grid item xs={6}>
                        <FormControlLabel
                          control={<Checkbox checked={onlyTomorrow} onChange={handleOnlyTomorrowChange} />}
                          label="Only tomorrow"
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <FormControlLabel
                          control={<Checkbox checked={halfDay} onChange={handleHalfDayChange} />}
                          label="Half day"
                        />
                      </Grid>

                      {halfDay && (
                        <Grid item xs={12}>
                          <ToggleButtonGroup
                            exclusive
                            size="small"
                            value={halfDaySession}
                            onChange={(_, value) => value && setHalfDaySession(value)}
                          >
                            <ToggleButton value="AM">First half (AM)</ToggleButton>
                            <ToggleButton value="PM">Second half (PM)</ToggleButton>
                          </ToggleButtonGroup>
                        </Grid>
                      )}

                      <Grid item xs={6}>
                        <TextField
                          type="date"
                          label="From"
                          InputLabelProps={{ shrink: true }}
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            if (halfDay) setEndDate(e.target.value);
                          }}
                          fullWidth
                          error={!!errors.startDate}
                          helperText={errors.startDate}
                          inputProps={{ min: minStartDate }}
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
                          inputProps={{ min: startDate || minStartDate }}
                          disabled={onlyTomorrow || halfDay}
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          label="Contact while on leave"
                          value={contactPhone}
                          onChange={(e) => setContactPhone(e.target.value)}
                          fullWidth
                          placeholder="Phone number"
                        />
                      </Grid>

                      <Grid item xs={12}>
                        <TextField
                          label="Reason"
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          fullWidth
                          multiline
                          rows={3}
                          error={!!errors.reason}
                          helperText={errors.reason || `${reason.trim().length}/10 characters minimum`}
                        />
                      </Grid>

                      {requestedDays > 0 && (
                        <Grid item xs={12}>
                          <Alert severity={selectedBalance?.available != null && requestedDays > selectedBalance.available ? 'warning' : 'info'}>
                            This request uses <strong>{requestedDays}</strong> working day{requestedDays === 1 ? '' : 's'}
                            {selectedBalance?.available != null
                              ? `. Remaining after submit: ${Number((selectedBalance.available - requestedDays).toFixed(1))}`
                              : '.'}
                          </Alert>
                        </Grid>
                      )}

                      <Grid item xs={6}>
                        <Button variant="outlined" fullWidth onClick={handleClear} disabled={submitting}>
                          Clear
                        </Button>
                      </Grid>
                      <Grid item xs={6}>
                        <Button type="submit" variant="contained" fullWidth disabled={submitting}>
                          {submitting ? 'Submitting…' : 'Submit request'}
                        </Button>
                      </Grid>
                    </Grid>
                  </form>
                </Grid>

                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DateCalendar slots={{ day: CustomDay }} />
                  </LocalizationProvider>
                  <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap">
                    <Chip size="small" label="Holiday" sx={{ bgcolor: 'secondary.light' }} />
                    <Chip size="small" label="Pending" color="warning" />
                    <Chip size="small" label="Approved" color="success" />
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2.5}>
            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Recent requests
                </Typography>
                {loading ? (
                  <Box display="flex" justifyContent="center" p={2}>
                    <CircularProgress size={24} />
                  </Box>
                ) : recentLeaves.length > 0 ? (
                  recentLeaves.map((leave) => (
                    <Box key={leave.id} sx={{ mb: 2 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2">{leave.leave_type}</Typography>
                        <Chip label={leave.status} color={statusColor(leave.status)} size="small" />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        {formatLeaveDate(leave.start_date)} – {formatLeaveDate(leave.end_date)}
                        {leave.days ? ` · ${leave.days} day(s)` : ''}
                      </Typography>
                      {leave.review_comment && leave.status !== 'Pending' && (
                        <Typography variant="caption" color="text.secondary">
                          Reviewer: {leave.review_comment}
                        </Typography>
                      )}
                      <Divider sx={{ mt: 1.5 }} />
                    </Box>
                  ))
                ) : (
                  <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'background.default' }}>
                    <Typography variant="body2" color="text.secondary">
                      No leave applications yet.
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" mb={2}>
                  Upcoming holidays
                </Typography>
                {upcomingHolidays.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No upcoming holidays on the calendar.
                  </Typography>
                ) : (
                  upcomingHolidays.map((holiday, index) => (
                    <Box key={holiday.date} sx={{ mb: 1 }}>
                      <Typography variant="subtitle2">{holiday.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {dayjs(holiday.date).format('MMMM D, YYYY (dddd)')}
                      </Typography>
                      {index < upcomingHolidays.length - 1 && <Divider sx={{ my: 1.25 }} />}
                    </Box>
                  ))
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ApplyLeave;
