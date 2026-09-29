import React, { useState, useEffect } from 'react';
import axios from '../../api/axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Grid,
  RadioGroup,
  Radio,
  FormControlLabel,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import BugReportIcon from '@mui/icons-material/BugReport';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

const REGULARIZATION_TYPES = [
  {
    value: 'Missed Punch',
    title: 'Missed Punch',
    desc: 'Forgot to clock in or out during standard office hours',
    icon: <AccessTimeIcon fontSize="small" />,
  },
  {
    value: 'On Duty / Client Visit',
    title: 'On Duty / Client Visit',
    desc: 'Off-site client meeting or official assignment',
    icon: <BusinessCenterIcon fontSize="small" />,
  },
  {
    value: 'Technical Glitch',
    title: 'Technical Glitch',
    desc: 'System error, biometrics or network connectivity failure',
    icon: <BugReportIcon fontSize="small" />,
  },
  {
    value: 'Remote Work',
    title: 'Remote / WFH',
    desc: 'Approved work from home shift needing attendance log',
    icon: <LaptopMacIcon fontSize="small" />,
  },
];

const ApplyRegularizationDialog = ({ open, onClose, onSuccess }) => {
  const todayStr = new Date().toISOString().slice(0, 10);
  // Default to yesterday if weekday, else today
  const defaultDate = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  };

  const [date, setDate] = useState(defaultDate());
  const [regularizationType, setRegularizationType] = useState('Missed Punch');
  const [requestedClockInTime, setRequestedClockInTime] = useState('09:30');
  const [requestedClockOutTime, setRequestedClockOutTime] = useState('18:30');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Existing attendance status for picked date
  const [checkingDate, setCheckingDate] = useState(false);
  const [existingAttendance, setExistingAttendance] = useState(null);

  useEffect(() => {
    if (open) {
      setDate(defaultDate());
      setRegularizationType('Missed Punch');
      setRequestedClockInTime('09:30');
      setRequestedClockOutTime('18:30');
      setReason('');
      setErrorMessage('');
      setExistingAttendance(null);
    }
  }, [open]);

  // Check date punch status whenever picked date changes
  useEffect(() => {
    if (!open || !date) return;
    let isMounted = true;
    const checkDateStatus = async () => {
      setCheckingDate(true);
      try {
        const employeeId = localStorage.getItem('userEmployeeId');
        const res = await axios.get('/attendance/regularization/check-date', {
          params: { date, employeeId },
        });
        if (isMounted) {
          setExistingAttendance(res.data?.attendance || null);
          // If existing clock-in exists, pre-fill it for user convenience
          if (res.data?.attendance?.clockInTime && !requestedClockInTime) {
            setRequestedClockInTime(res.data.attendance.clockInTime);
          }
        }
      } catch (err) {
        console.error('Error checking date attendance:', err);
      } finally {
        if (isMounted) setCheckingDate(false);
      }
    };

    checkDateStatus();
    return () => {
      isMounted = false;
    };
  }, [open, date]);

  // Compute shift duration
  const shiftDuration = React.useMemo(() => {
    if (!requestedClockInTime || !requestedClockOutTime) return null;
    const [h1, m1] = requestedClockInTime.split(':').map(Number);
    const [h2, m2] = requestedClockOutTime.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) return null;

    const totalMinutes1 = h1 * 60 + m1;
    const totalMinutes2 = h2 * 60 + m2;
    const diff = totalMinutes2 - totalMinutes1;

    if (diff <= 0) return { valid: false, text: 'Clock-out time must be after clock-in time' };

    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return { valid: true, text: `${hours} hr${hours !== 1 ? 's' : ''} ${mins > 0 ? `${mins} min${mins !== 1 ? 's' : ''}` : ''}` };
  }, [requestedClockInTime, requestedClockOutTime]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!date) {
      setErrorMessage('Please choose a date.');
      return;
    }

    if (date > todayStr) {
      setErrorMessage('Cannot regularize attendance for future dates.');
      return;
    }

    if (!requestedClockInTime || !requestedClockOutTime) {
      setErrorMessage('Please provide both requested Clock-In and Clock-Out times.');
      return;
    }

    if (shiftDuration && !shiftDuration.valid) {
      setErrorMessage(shiftDuration.text);
      return;
    }

    if (!reason || reason.trim().length < 10) {
      setErrorMessage('Please provide a justification / reason with at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const employeeId = localStorage.getItem('userEmployeeId');
      const employeeName =
        `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim() ||
        localStorage.getItem('userName') ||
        localStorage.getItem('name');
      const department = localStorage.getItem('userDepartment') || localStorage.getItem('department');
      const companyName = localStorage.getItem('companyName') || 'KN Advisors';

      const payload = {
        employeeId,
        employeeName,
        department,
        companyName,
        date,
        regularizationType,
        requestedClockInTime,
        requestedClockOutTime,
        reason: reason.trim(),
      };

      await axios.post('/attendance/regularization/apply', payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting regularization request:', err);
      const msg = err.response?.data?.error || 'Failed to submit regularization request. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2.2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '10px',
              bgcolor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#14286D',
            }}
          >
            <EditCalendarIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '17px', lineHeight: 1.2 }}>
              Attendance Regularization Request
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '12px' }}>
              Request missed punch or shift hours correction for manager approval
            </Typography>
          </Box>
        </Box>
        <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#FFFFFF' }}>
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px', fontSize: '13px' }}>
            {errorMessage}
          </Alert>
        )}

        {/* Existing Punch Status Banner */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            mb: 2.5,
            borderRadius: '10px',
            bgcolor: existingAttendance ? '#F0FDF4' : '#F8FAFC',
            border: '1px solid',
            borderColor: existingAttendance ? '#BBF7D0' : '#E2E8F0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {checkingDate ? (
              <CircularProgress size={16} />
            ) : existingAttendance ? (
              <CheckCircleOutlineIcon sx={{ color: '#16A34A', fontSize: 18 }} />
            ) : (
              <InfoOutlinedIcon sx={{ color: '#64748B', fontSize: 18 }} />
            )}
            <Typography sx={{ fontSize: '12.5px', color: existingAttendance ? '#15803D' : '#475569', fontWeight: 600 }}>
              {checkingDate
                ? 'Verifying punch record for date...'
                : existingAttendance
                ? `Existing Punch: In: ${existingAttendance.clockInTime || 'None'} | Out: ${existingAttendance.clockOutTime || 'Missing'}`
                : 'No attendance punch record found for this date.'}
            </Typography>
          </Box>
          {existingAttendance && (
            <Chip
              label="Will Update"
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '10.5px',
                bgcolor: '#DCFCE7',
                color: '#166534',
              }}
            />
          )}
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Target Date Picker */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', mb: 0.75 }}>
              Date to Regularize <span style={{ color: '#DC2626' }}>*</span>
            </Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              inputProps={{ max: todayStr }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  bgcolor: '#F8FAFC',
                },
              }}
            />
          </Box>

          {/* Regularization Type Selection Grid */}
          <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', mb: 1 }}>
            Reason Type <span style={{ color: '#DC2626' }}>*</span>
          </Typography>
          <Grid container spacing={1.5} sx={{ mb: 2.5 }}>
            {REGULARIZATION_TYPES.map((type) => {
              const selected = regularizationType === type.value;
              return (
                <Grid item xs={12} sm={6} key={type.value}>
                  <Box
                    onClick={() => setRegularizationType(type.value)}
                    sx={{
                      p: 1.5,
                      border: '2px solid',
                      borderColor: selected ? '#14286D' : '#E2E8F0',
                      bgcolor: selected ? '#EEF2FF' : '#FFFFFF',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: selected ? '0 2px 8px rgba(20, 40, 109, 0.12)' : 'none',
                      '&:hover': {
                        borderColor: selected ? '#14286D' : '#CBD5E1',
                        bgcolor: selected ? '#EEF2FF' : '#F8FAFC',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Box
                        sx={{
                          width: 26,
                          height: 26,
                          borderRadius: '6px',
                          bgcolor: selected ? '#14286D' : '#F1F5F9',
                          color: selected ? '#FFFFFF' : '#64748B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {type.icon}
                      </Box>
                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: selected ? '#14286D' : '#0F172A' }}>
                        {type.title}
                      </Typography>
                    </Box>
                    <Typography sx={{ fontSize: '11px', color: '#64748B', pl: 0.5 }}>
                      {type.desc}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>

          {/* Requested Clock-In and Clock-Out Times */}
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', mb: 0.75 }}>
                Requested Clock-In <span style={{ color: '#DC2626' }}>*</span>
              </Typography>
              <TextField
                type="time"
                fullWidth
                size="small"
                value={requestedClockInTime}
                onChange={(e) => setRequestedClockInTime(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    bgcolor: '#F8FAFC',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', mb: 0.75 }}>
                Requested Clock-Out <span style={{ color: '#DC2626' }}>*</span>
              </Typography>
              <TextField
                type="time"
                fullWidth
                size="small"
                value={requestedClockOutTime}
                onChange={(e) => setRequestedClockOutTime(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    fontSize: '13.5px',
                    bgcolor: '#F8FAFC',
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Calculated Shift Duration Chip */}
          {shiftDuration && (
            <Box
              sx={{
                mb: 2.5,
                p: 1.2,
                borderRadius: '8px',
                bgcolor: shiftDuration.valid ? '#F0F9FF' : '#FEF2F2',
                border: '1px solid',
                borderColor: shiftDuration.valid ? '#BAE6FD' : '#FECACA',
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              {shiftDuration.valid ? (
                <>
                  <AccessTimeIcon sx={{ fontSize: 16, color: '#0284C7' }} />
                  <Typography sx={{ fontSize: '12.5px', color: '#0369A1', fontWeight: 700 }}>
                    Calculated Shift Duration: {shiftDuration.text}
                  </Typography>
                </>
              ) : (
                <>
                  <WarningAmberIcon sx={{ fontSize: 16, color: '#DC2626' }} />
                  <Typography sx={{ fontSize: '12px', color: '#B91C1C', fontWeight: 600 }}>
                    {shiftDuration.text}
                  </Typography>
                </>
              )}
            </Box>
          )}

          {/* Justification / Reason */}
          <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', mb: 0.75 }}>
              Justification & Details <span style={{ color: '#DC2626' }}>*</span>
            </Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="Provide a clear reason for the missing punch or adjustment (e.g. Attended on-site client audit at Client HQ; biometrics not registered)."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              helperText={`${reason.length}/10 characters minimum`}
              error={Boolean(reason && reason.trim().length < 10)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  fontSize: '13px',
                  bgcolor: '#F8FAFC',
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <Button onClick={onClose} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || (shiftDuration && !shiftDuration.valid)}
          variant="contained"
          sx={{
            background: 'linear-gradient(135deg, #14286D 0%, #0F1F58 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #0F1F58 0%, #091338 100%)',
            },
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: '9px',
            px: 3,
            py: 0.8,
            boxShadow: '0 4px 12px rgba(20, 40, 109, 0.25)',
          }}
        >
          {submitting ? (
            <CircularProgress size={18} sx={{ color: '#FFF' }} />
          ) : (
            'Submit Regularization'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplyRegularizationDialog;
