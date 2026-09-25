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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LoginIcon from '@mui/icons-material/Login';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

const DURATION_OPTIONS = [
  { value: 0.5, label: '30 mins (0.5h)' },
  { value: 1.0, label: '1 hour (1.0h)' },
  { value: 1.5, label: '1.5 hours (1.5h)' },
  { value: 2.0, label: '2 hours (2.0h)' },
];

const ApplyPermissionDialog = ({
  open,
  onClose,
  onSuccess,
  defaultType = 'Early Sign-Out',
  remainingQuota = null,
}) => {
  const [permissionType, setPermissionType] = useState(defaultType);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [expectedTime, setExpectedTime] = useState(() => {
    // Default sensible time based on type
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });
  const [durationHours, setDurationHours] = useState(1.0);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (open) {
      setPermissionType(defaultType);
      setDate(new Date().toISOString().slice(0, 10));
      const now = new Date();
      const defaultPunchTime = defaultType === 'Late Sign-In' ? '10:30' : '16:30';
      setExpectedTime(defaultPunchTime);
      setDurationHours(1.0);
      setReason('');
      setErrorMessage('');
    }
  }, [open, defaultType]);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!date) {
      setErrorMessage('Please select a date.');
      return;
    }

    if (!expectedTime) {
      setErrorMessage('Please enter an expected punch time.');
      return;
    }

    if (!reason || reason.trim().length < 10) {
      setErrorMessage('Please provide a reason with at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const employeeId = localStorage.getItem('userEmployeeId');
      const employeeName = localStorage.getItem('userName') || localStorage.getItem('name');
      const department = localStorage.getItem('userDepartment') || localStorage.getItem('department');
      const companyName = localStorage.getItem('companyName') || 'KN Advisors';

      const payload = {
        employeeId,
        employeeName,
        department,
        companyName,
        permissionType,
        date,
        expectedTime,
        durationHours,
        reason: reason.trim(),
      };

      await axios.post('/attendance/permissions/apply', payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting permission request:', err);
      const msg = err.response?.data?.error || 'Failed to submit permission request. Please try again.';
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
              color: '#1E40AF',
            }}
          >
            <AccessTimeIcon fontSize="small" />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '17px', lineHeight: 1.2 }}>
              Apply for Attendance Permission
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '12px' }}>
              Request late arrival or early departure regularization (Max 2 hrs)
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

        {/* Policy Quota Banner */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 1.5,
            mb: 2.5,
            borderRadius: '10px',
            bgcolor: '#F8FAFC',
            border: '1px solid #E2E8F0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <InfoOutlinedIcon sx={{ color: '#1E40AF', fontSize: 18 }} />
            <Typography sx={{ fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
              Monthly Policy: Max 2 permissions (up to 2 hrs each)
            </Typography>
          </Box>
          {remainingQuota !== null && (
            <Chip
              label={`${remainingQuota} remaining this month`}
              size="small"
              sx={{
                fontWeight: 700,
                fontSize: '11px',
                bgcolor: remainingQuota > 0 ? '#DCFCE7' : '#FEE2E2',
                color: remainingQuota > 0 ? '#166534' : '#991B1B',
              }}
            />
          )}
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          {/* Permission Type Selection */}
          <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#334155', mb: 1 }}>
            Permission Type <span style={{ color: '#DC2626' }}>*</span>
          </Typography>
          <RadioGroup
            row
            value={permissionType}
            onChange={(e) => setPermissionType(e.target.value)}
            sx={{ mb: 2.5, gap: 1.5 }}
          >
            <Box
              onClick={() => setPermissionType('Early Sign-Out')}
              sx={{
                flex: 1,
                p: 1.75,
                border: '2px solid',
                borderColor: permissionType === 'Early Sign-Out' ? '#F59E0B' : '#E2E8F0',
                background: permissionType === 'Early Sign-Out'
                  ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
                  : '#FFFFFF',
                boxShadow: permissionType === 'Early Sign-Out'
                  ? '0 4px 14px rgba(245, 158, 11, 0.2)'
                  : 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                transition: 'all 0.2s ease',
              }}
            >
              <FormControlLabel
                value="Early Sign-Out"
                control={<Radio size="small" sx={{ p: 0.5, color: '#D97706', '&.Mui-checked': { color: '#D97706' } }} />}
                label=""
                sx={{ m: 0 }}
              />
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  bgcolor: permissionType === 'Early Sign-Out' ? 'rgba(217, 119, 6, 0.18)' : '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ExitToAppIcon sx={{ color: permissionType === 'Early Sign-Out' ? '#D97706' : '#64748B', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '13.5px', fontWeight: 800, color: permissionType === 'Early Sign-Out' ? '#92400E' : '#0F172A' }}>
                  Early Sign-Out
                </Typography>
                <Typography sx={{ fontSize: '11px', color: permissionType === 'Early Sign-Out' ? '#B45309' : '#64748B' }}>
                  Leaving before standard shift ends
                </Typography>
              </Box>
            </Box>

            <Box
              onClick={() => setPermissionType('Late Sign-In')}
              sx={{
                flex: 1,
                p: 1.75,
                border: '2px solid',
                borderColor: permissionType === 'Late Sign-In' ? '#6366F1' : '#E2E8F0',
                background: permissionType === 'Late Sign-In'
                  ? 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)'
                  : '#FFFFFF',
                boxShadow: permissionType === 'Late Sign-In'
                  ? '0 4px 14px rgba(99, 102, 241, 0.2)'
                  : 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                transition: 'all 0.2s ease',
              }}
            >
              <FormControlLabel
                value="Late Sign-In"
                control={<Radio size="small" sx={{ p: 0.5, color: '#4F46E5', '&.Mui-checked': { color: '#4F46E5' } }} />}
                label=""
                sx={{ m: 0 }}
              />
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  bgcolor: permissionType === 'Late Sign-In' ? 'rgba(79, 70, 229, 0.18)' : '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LoginIcon sx={{ color: permissionType === 'Late Sign-In' ? '#4F46E5' : '#64748B', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '13.5px', fontWeight: 800, color: permissionType === 'Late Sign-In' ? '#3730A3' : '#0F172A' }}>
                  Late Sign-In
                </Typography>
                <Typography sx={{ fontSize: '11px', color: permissionType === 'Late Sign-In' ? '#4338CA' : '#64748B' }}>
                  Arriving after standard shift start
                </Typography>
              </Box>
            </Box>
          </RadioGroup>

          {/* Date & Punch Time Grid */}
          <Grid container spacing={2} sx={{ mb: 2.5 }}>
            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.7 }}>
                Date <span style={{ color: '#DC2626' }}>*</span>
              </Typography>
              <TextField
                type="date"
                fullWidth
                size="small"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '13px',
                    bgcolor: '#F8FAFC',
                  },
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.7 }}>
                {permissionType === 'Late Sign-In' ? 'Expected Arrival Time' : 'Expected Departure Time'}{' '}
                <span style={{ color: '#DC2626' }}>*</span>
              </Typography>
              <TextField
                type="time"
                fullWidth
                size="small"
                value={expectedTime}
                onChange={(e) => setExpectedTime(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                    fontSize: '13px',
                    bgcolor: '#F8FAFC',
                  },
                }}
              />
            </Grid>
          </Grid>

          {/* Duration Selector */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 1 }}>
              Duration <span style={{ color: '#DC2626' }}>*</span>
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = durationHours === opt.value;
                const isEarlyOut = permissionType === 'Early Sign-Out';
                return (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    onClick={() => setDurationHours(opt.value)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 700,
                      fontSize: '12px',
                      borderRadius: '8px',
                      px: 1,
                      border: '1.5px solid',
                      borderColor: isSelected
                        ? isEarlyOut ? '#F59E0B' : '#6366F1'
                        : '#E2E8F0',
                      background: isSelected
                        ? isEarlyOut
                          ? 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)'
                          : 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)'
                        : '#F8FAFC',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      boxShadow: isSelected
                        ? isEarlyOut
                          ? '0 2px 8px rgba(245, 158, 11, 0.3)'
                          : '0 2px 8px rgba(99, 102, 241, 0.3)'
                        : 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        borderColor: isSelected
                          ? isEarlyOut ? '#D97706' : '#4F46E5'
                          : '#CBD5E1',
                        bgcolor: isSelected
                          ? isEarlyOut ? '#D97706' : '#4F46E5'
                          : '#F1F5F9',
                      },
                    }}
                  />
                );
              })}
            </Box>
          </Box>

          {/* Reason Multiline */}
          <Box sx={{ mb: 1 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.7 }}>
              Reason for Permission <span style={{ color: '#DC2626' }}>*</span>
            </Typography>
            <TextField
              multiline
              rows={3}
              fullWidth
              size="small"
              placeholder="e.g. Doctor's appointment, unavoidable traffic delay, personal emergency..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              helperText={`${reason.length}/10 characters minimum`}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '8px',
                  fontSize: '13px',
                  bgcolor: '#F8FAFC',
                },
              }}
            />
          </Box>
        </Box>
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', justifyContent: 'space-between' }}>
        <Button
          onClick={onClose}
          sx={{
            color: '#64748B',
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '13px',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || (remainingQuota !== null && remainingQuota <= 0)}
          variant="contained"
          sx={{
            background: permissionType === 'Early Sign-Out'
              ? 'linear-gradient(135deg, #D97706 0%, #B45309 100%)'
              : 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
            '&:hover': {
              background: permissionType === 'Early Sign-Out'
                ? 'linear-gradient(135deg, #B45309 0%, #92400E 100%)'
                : 'linear-gradient(135deg, #3730A3 0%, #312E81 100%)',
            },
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '13.5px',
            borderRadius: '9px',
            px: 3,
            py: 0.85,
            boxShadow: permissionType === 'Early Sign-Out'
              ? '0 4px 12px rgba(217, 119, 6, 0.25)'
              : '0 4px 12px rgba(79, 70, 229, 0.25)',
          }}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <CheckCircleOutlineIcon />}
        >
          {submitting ? 'Submitting...' : 'Submit Request'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ApplyPermissionDialog;
