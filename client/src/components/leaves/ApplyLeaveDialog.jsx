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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { LEAVE_TYPE_META, leaveIdentityParams } from '../../utils/leaveConfig';

const LEAVE_TYPES = [
  'Casual Leave',
  'Sick Leave',
  'Earned Leave',
  'Compensatory Off',
  'Work From Home',
  'Unpaid Leave',
  'Maternity Leave',
  'Paternity Leave',
];

const ApplyLeaveDialog = ({ open, onClose, onSuccess, availableBalance = null }) => {
  const [leaveType, setLeaveType] = useState('Casual Leave');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [onlyTomorrow, setOnlyTomorrow] = useState(false);
  const [halfDay, setHalfDay] = useState(false);
  const [halfDaySession, setHalfDaySession] = useState('AM');
  const [reason, setReason] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tomorrow calculation
  const getTomorrowDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  };

  const getTodayDate = () => {
    return new Date().toISOString().slice(0, 10);
  };

  useEffect(() => {
    if (open) {
      // Default to today
      const today = getTodayDate();
      setLeaveType('Casual Leave');
      setStartDate(today);
      setEndDate(today);
      setOnlyTomorrow(false);
      setHalfDay(false);
      setHalfDaySession('AM');
      setReason('');
      setContactPhone(localStorage.getItem('userPhone') || '');
      setErrorMessage('');
    }
  }, [open]);

  const handleOnlyTomorrowChange = (e) => {
    const checked = e.target.checked;
    setOnlyTomorrow(checked);
    if (checked) {
      const tomorrow = getTomorrowDate();
      setStartDate(tomorrow);
      setEndDate(tomorrow);
      setHalfDay(false);
    } else {
      const today = getTodayDate();
      setStartDate(today);
      setEndDate(today);
    }
  };

  const handleHalfDayChange = (e) => {
    const checked = e.target.checked;
    setHalfDay(checked);
    if (checked) {
      setOnlyTomorrow(false);
      if (startDate) {
        setEndDate(startDate);
      }
    }
  };

  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (halfDay || !endDate || endDate < val) {
      setEndDate(val);
    }
  };

  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    if (halfDay) return 0.5;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;

    let count = 0;
    const cur = new Date(start);
    while (cur <= end) {
      const day = cur.getDay();
      if (day !== 0 && day !== 6) {
        count++;
      }
      cur.setDate(cur.getDate() + 1);
    }
    return count;
  };

  const requestedDays = calculateDays();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!leaveType) {
      setErrorMessage('Please select a leave type');
      return;
    }
    if (!startDate || !endDate) {
      setErrorMessage('Please specify start and end dates');
      return;
    }
    if (endDate < startDate) {
      setErrorMessage('End date cannot be before start date');
      return;
    }
    if (!reason || reason.trim().length < 10) {
      setErrorMessage('Please provide a reason of at least 10 characters');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...leaveIdentityParams(),
        leaveType,
        startDate,
        endDate: halfDay ? startDate : endDate,
        reason: reason.trim(),
        onlyTomorrow,
        halfDay,
        halfDaySession: halfDay ? halfDaySession : null,
        contactPhone: contactPhone.trim() || undefined,
      };

      await axios.post('/leaves/apply', payload);

      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('Error applying for leave:', err);
      setErrorMessage(err.response?.data?.error || 'Failed to submit leave request. Please check inputs.');
    } finally {
      setSubmitting(false);
    }
  };

  const currentMeta = LEAVE_TYPE_META[leaveType] || { bg: '#EFF6FF', color: '#1E40AF', short: 'LV' };

  return (
    <Dialog
      open={open}
      onClose={submitting ? undefined : onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #E2E8F0',
          bgcolor: '#FAFAFA',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '10px',
              bgcolor: '#14286D',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <EventNoteIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography sx={{ fontWeight: 800, fontSize: '17px', color: '#0F172A', lineHeight: 1.2 }}>
              Apply for Leave
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
              Submit a time-off or remote work application
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} disabled={submitting} size="small" sx={{ color: '#94A3B8' }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ px: 3, py: 2.5 }}>
          {errorMessage && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px', fontSize: '13px' }}>
              {errorMessage}
            </Alert>
          )}

          {/* Available balance notice */}
          {availableBalance !== null && (
            <Box
              sx={{
                mb: 2.5,
                p: 1.5,
                borderRadius: '10px',
                bgcolor: '#F0FDF4',
                border: '1px solid #BBF7D0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleOutlineIcon sx={{ color: '#16A34A', fontSize: 20 }} />
                <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#15803D' }}>
                  Annual Quota Remaining
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '14px', fontWeight: 800, color: '#14532D' }}>
                {availableBalance} Days Available
              </Typography>
            </Box>
          )}

          {/* 1. Leave Type Selection */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', mb: 0.75 }}>
              Leave Type *
            </Typography>
            <FormControl fullWidth size="small">
              <Select
                value={leaveType}
                onChange={(e) => setLeaveType(e.target.value)}
                sx={{
                  borderRadius: '10px',
                  fontSize: '13.5px',
                  bgcolor: '#FFFFFF',
                  '& fieldset': { borderColor: '#CBD5E1' },
                }}
              >
                {LEAVE_TYPES.map((type) => {
                  const meta = LEAVE_TYPE_META[type] || {};
                  return (
                    <MenuItem key={type} value={type} sx={{ py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                        <Box
                          sx={{
                            width: 26,
                            height: 26,
                            borderRadius: '6px',
                            bgcolor: meta.bg || '#EFF6FF',
                            color: meta.color || '#1E40AF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10.5px',
                            fontWeight: 800,
                          }}
                        >
                          {meta.short || 'LV'}
                        </Box>
                        <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                          {type}
                        </Typography>
                      </Box>
                    </MenuItem>
                  );
                })}
              </Select>
            </FormControl>
          </Box>

          {/* 2. Quick options: Tomorrow only & Half day */}
          <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={onlyTomorrow}
                      onChange={handleOnlyTomorrowChange}
                      size="small"
                      sx={{ color: '#64748B', '&.Mui-checked': { color: '#14286D' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: '12.5px', fontWeight: 650, color: '#1E293B' }}>
                        Emergency (Tomorrow Only)
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                        Sets leave date to tomorrow
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={halfDay}
                      onChange={handleHalfDayChange}
                      size="small"
                      sx={{ color: '#64748B', '&.Mui-checked': { color: '#14286D' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography sx={{ fontSize: '12.5px', fontWeight: 650, color: '#1E293B' }}>
                        Half-Day Leave
                      </Typography>
                      <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                        Single date 0.5 day (AM or PM)
                      </Typography>
                    </Box>
                  }
                />
              </Grid>
            </Grid>

            {/* Session selector for half day */}
            {halfDay && (
              <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                  Session:
                </Typography>
                <RadioGroup
                  row
                  value={halfDaySession}
                  onChange={(e) => setHalfDaySession(e.target.value)}
                >
                  <FormControlLabel
                    value="AM"
                    control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#14286D' } }} />}
                    label={<Typography sx={{ fontSize: '12px', fontWeight: 600 }}>Morning (AM)</Typography>}
                  />
                  <FormControlLabel
                    value="PM"
                    control={<Radio size="small" sx={{ '&.Mui-checked': { color: '#14286D' } }} />}
                    label={<Typography sx={{ fontSize: '12px', fontWeight: 600 }}>Afternoon (PM)</Typography>}
                  />
                </RadioGroup>
              </Box>
            )}
          </Box>

          {/* 3. Dates */}
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', mb: 0.75 }}>
                Start Date *
              </Typography>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                disabled={onlyTomorrow}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    fontSize: '13px',
                    '& fieldset': { borderColor: '#CBD5E1' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', mb: 0.75 }}>
                End Date *
              </Typography>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={halfDay ? startDate : endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={onlyTomorrow || halfDay}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '10px',
                    fontSize: '13px',
                    '& fieldset': { borderColor: '#CBD5E1' },
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Requested Duration Banner */}
          <Box
            sx={{
              mb: 2.5,
              p: 1.25,
              px: 1.75,
              borderRadius: '8px',
              bgcolor: '#F1F5FF',
              border: '1px solid #DDE4FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <InfoOutlinedIcon sx={{ fontSize: 17, color: '#14286D' }} />
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1E3A8A' }}>
                Estimated Working Days:
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#14286D' }}>
              {requestedDays} {requestedDays === 1 ? 'Working Day' : 'Working Days'}
            </Typography>
          </Box>

          {/* 4. Reason */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', mb: 0.75 }}>
              Reason for Leave *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="Please explain the reason for your leave request (minimum 10 characters)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              helperText={`${reason.trim().length}/10 characters minimum`}
              FormHelperTextProps={{
                sx: {
                  color: reason.trim().length >= 10 ? '#16A34A' : '#64748B',
                  fontWeight: 600,
                  fontSize: '11px',
                },
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  fontSize: '13px',
                  '& fieldset': { borderColor: '#CBD5E1' },
                },
              }}
            />
          </Box>

          {/* 5. Contact Phone (Optional) */}
          <Box>
            <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', mb: 0.75 }}>
              Emergency Contact Phone (Optional)
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="+91 9876543210"
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  fontSize: '13px',
                  '& fieldset': { borderColor: '#CBD5E1' },
                },
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: '1px solid #E2E8F0',
            bgcolor: '#FAFAFA',
            gap: 1,
          }}
        >
          <Button
            onClick={onClose}
            disabled={submitting}
            sx={{
              textTransform: 'none',
              fontWeight: 650,
              color: '#64748B',
              fontSize: '13px',
              borderRadius: '8px',
              px: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={submitting}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '8px',
              px: 2.5,
              py: 0.85,
              bgcolor: '#14286D',
              boxShadow: '0 2px 6px rgba(20, 40, 109, 0.2)',
              '&:hover': { bgcolor: '#0D1B4A' },
            }}
          >
            {submitting ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} sx={{ color: '#FFFFFF' }} />
                <span>Submitting...</span>
              </Box>
            ) : (
              'Submit Request'
            )}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ApplyLeaveDialog;
