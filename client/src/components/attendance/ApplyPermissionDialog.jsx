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
                p: 1.5,
                border: '1.5px solid',
                borderColor: permissionType === 'Early Sign-Out' ? '#14286D' : '#E2E8F0',
                bgcolor: permissionType === 'Early Sign-Out' ? '#F0F4FF' : '#FFFFFF',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                transition: 'all 0.15s ease',
              }}
            >
              <FormControlLabel
                value="Early Sign-Out"
                control={<Radio size="small" sx={{ p: 0.5, color: '#14286D', '&.Mui-checked': { color: '#14286D' } }} />}
                label=""
                sx={{ m: 0 }}
              />
              <ExitToAppIcon sx={{ color: permissionType === 'Early Sign-Out' ? '#14286D' : '#64748B', fontSize: 20 }} />
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  Early Sign-Out
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                  Leaving before standard shift ends
                </Typography>
              </Box>
            </Box>

            <Box
              onClick={() => setPermissionType('Late Sign-In')}
              sx={{
                flex: 1,
                p: 1.5,
                border: '1.5px solid',
                borderColor: permissionType === 'Late Sign-In' ? '#14286D' : '#E2E8F0',
                bgcolor: permissionType === 'Late Sign-In' ? '#F0F4FF' : '#FFFFFF',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 1.2,
                transition: 'all 0.15s ease',
              }}
            >
              <FormControlLabel
                value="Late Sign-In"
                control={<Radio size="small" sx={{ p: 0.5, color: '#14286D', '&.Mui-checked': { color: '#14286D' } }} />}
                label=""
                sx={{ m: 0 }}
              />
              <LoginIcon sx={{ color: permissionType === 'Late Sign-In' ? '#14286D' : '#64748B', fontSize: 20 }} />
              <Box>
                <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                  Late Sign-In
                </Typography>
                <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
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
                return (
                  <Chip
                    key={opt.value}
                    label={opt.label}
                    onClick={() => setDurationHours(opt.value)}
                    sx={{
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '12px',
                      borderRadius: '8px',
                      px: 1,
                      border: '1px solid',
                      borderColor: isSelected ? '#14286D' : '#E2E8F0',
                      bgcolor: isSelected ? '#14286D' : '#F8FAFC',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      '&:hover': {
                        bgcolor: isSelected ? '#0E1D50' : '#E2E8F0',
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
            bgcolor: '#14286D',
            '&:hover': { bgcolor: '#0E1D50' },
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '13.5px',
            borderRadius: '8px',
            px: 3,
            py: 0.8,
            boxShadow: '0 4px 6px -1px rgba(20, 40, 109, 0.2)',
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
