import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, IconButton, CircularProgress, Box, Typography, Alert, Chip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import axios from '../../api/axios';
import { timeToHours, formatDate } from '../../utils/reportUtils';

const buildDescription = (value) => {
  if (value && value.startsWith('1. ')) return value;
  return value ? `1. ${value}` : '1. ';
};

const WorkReportFormDialog = ({
  open,
  onClose,
  onSubmitted,
  initialData = null,
  dialogTitle = 'Submit Work Report',
  lockHours = false,
}) => {
  const getTodayString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const today = getTodayString();
  const [form, setForm] = useState({
    date: today,
    taskName: '',
    workDescription: '1. ',
    hoursWorked: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [checkingAttendance, setCheckingAttendance] = useState(false);
  const [hasClockedIn, setHasClockedIn] = useState(null); // null = unknown, true = clocked in, false = not clocked in
  const [attendanceRecord, setAttendanceRecord] = useState(null);

  const employeeId = localStorage.getItem('userEmployeeId');
  const department = localStorage.getItem('userDepartment');

  useEffect(() => {
    if (!open) return;

    const worked = localStorage.getItem('workedTime');
    const hoursValue = timeToHours(worked);

    if (initialData) {
      const parsed = (() => {
        try {
          const v = JSON.parse(initialData.workDescription);
          return Array.isArray(v) ? v.map((line) => `${line}`).join('\n') : String(v);
        } catch {
          return String(initialData.workDescription || '');
        }
      })();

      setForm({
        date: initialData.date ? String(initialData.date).slice(0, 10) : today,
        taskName: initialData.taskName || '',
        workDescription: buildDescription(parsed || '1. '),
        hoursWorked: initialData.hoursWorked != null && initialData.hoursWorked !== 0
          ? String(initialData.hoursWorked)
          : '',
      });
    } else {
      setForm({
        date: today,
        taskName: '',
        workDescription: '1. ',
        hoursWorked: hoursValue > 0 ? String(hoursValue) : '',
      });
    }
    setErrors({});
    setFormError('');
  }, [open, initialData, today]);

  // Verify clock-in requirement for chosen date
  useEffect(() => {
    if (!open || !form.date || !employeeId) return;

    const storedCompany = localStorage.getItem('companyName');
    const effectiveCompany =
      !storedCompany || storedCompany === 'null' || storedCompany === 'undefined'
        ? 'KN Advisors'
        : storedCompany;

    setCheckingAttendance(true);
    axios
      .get('/attendance/status', {
        params: { employeeId, companyName: effectiveCompany, date: form.date },
      })
      .then((res) => {
        const clocked = Boolean(res.data?.hasClockedInDate);
        setHasClockedIn(clocked);
        const record = res.data?.dateRecords?.[0] || null;
        setAttendanceRecord(record);

        // Auto-fill hours from clock session if not set or 0
        if (record?.workedTime && (!form.hoursWorked || form.hoursWorked === '0')) {
          const hoursNum = timeToHours(record.workedTime);
          if (hoursNum > 0) {
            setForm((prev) => ({ ...prev, hoursWorked: String(hoursNum) }));
          }
        }
      })
      .catch((err) => {
        console.error('Error verifying attendance status:', err);
        setHasClockedIn(null);
      })
      .finally(() => {
        setCheckingAttendance(false);
      });
  }, [open, form.date, employeeId]);

  const validate = () => {
    const next = {};
    if (!form.date) next.date = 'Date is required';
    if (!form.taskName.trim()) next.taskName = 'Task name is required';

    const cleaned = form.workDescription
      .split('\n')
      .map((line) => line.trim().replace(/^\d+\.\s*/, ''))
      .filter(Boolean);
    if (cleaned.length === 0) next.workDescription = 'Enter at least one work item';

    if (!lockHours && (form.hoursWorked === '' || form.hoursWorked == null)) {
      next.hoursWorked = 'Hours worked is required';
    }

    if (hasClockedIn === false) {
      setFormError(`You must clock in first on ${formatDate(form.date)} before submitting a work report.`);
      return false;
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const descriptionArray = form.workDescription
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.replace(/^\d+\.\s*/, ''));

    setSubmitting(true);
    setFormError('');

    const storedCompany = localStorage.getItem('companyName');
    const effectiveCompany =
      !storedCompany || storedCompany === 'null' || storedCompany === 'undefined'
        ? 'KN Advisors'
        : storedCompany;

    try {
      const payload = {
        ...form,
        taskName: form.taskName.trim(),
        workDescription: JSON.stringify(descriptionArray),
        hoursWorked: timeToHours(form.hoursWorked),
        employeeId,
        employeeName: `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim(),
        department,
        companyName: effectiveCompany,
        clockInTime: attendanceRecord?.clockInTime || null,
        clockOutTime: attendanceRecord?.clockOutTime || null,
      };

      if (initialData?.id) {
        await axios.put(`/reports/${initialData.id}`, payload);
      } else {
        await axios.post('/reports', payload);
      }

      if (onSubmitted) onSubmitted();
      handleClose();
    } catch (error) {
      setFormError(error.response?.data?.error || 'Failed to save the report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setErrors({});
    setFormError('');
    if (onClose) onClose();
  };

  const handleWorkDescriptionChange = (e) => {
    let value = e.target.value;
    if (!value.startsWith('1. ')) value = buildDescription(value);
    setForm((prev) => ({ ...prev, workDescription: value }));
  };

  const handleDescriptionKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const lines = form.workDescription.split('\n');
      const lastLine = lines[lines.length - 1];
      const match = lastLine.match(/^(\d+)\.\s/);
      let nextNumber = 1;
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      } else if (lines.length > 0) {
        nextNumber = lines.length + 1;
      }
      setForm((prev) => ({ ...prev, workDescription: `${prev.workDescription}\n${nextNumber}. ` }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>
          {dialogTitle}
        </Typography>
        <IconButton onClick={handleClose} aria-label="close" size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ py: 2.5 }}>
        {formError && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
            {formError}
          </Alert>
        )}

        {/* Clock-In Status Alert */}
        {checkingAttendance ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'text.secondary', fontSize: '13px' }}>
            <CircularProgress size={16} /> Verifying clock-in status for {formatDate(form.date)}...
          </Box>
        ) : hasClockedIn === false ? (
          <Alert severity="warning" sx={{ mb: 2, borderRadius: '8px', fontSize: '13px' }}>
            <strong>Clock-In Required:</strong> You have not clocked in on {formatDate(form.date)}. You can only submit a work report for days on which you have clocked in.
          </Alert>
        ) : hasClockedIn === true ? (
          <Alert severity="success" sx={{ mb: 2, borderRadius: '8px', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <CheckCircleIcon sx={{ fontSize: 16 }} />
              <span>Clock-in verified for {formatDate(form.date)}</span>
              {attendanceRecord?.clockInTime && (
                <span style={{ fontWeight: 600, marginLeft: 4 }}>
                  (Clock In: {attendanceRecord.clockInTime}
                  {attendanceRecord?.clockOutTime ? ` · Clock Out: ${attendanceRecord.clockOutTime}` : ''})
                </span>
              )}
            </Box>
          </Alert>
        ) : null}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Report Date"
            type="date"
            fullWidth
            value={form.date}
            onChange={(e) => setForm((prev) => ({ ...prev, date: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            error={!!errors.date}
            helperText={errors.date}
          />

          <TextField
            label="Task Name"
            fullWidth
            value={form.taskName}
            onChange={(e) => setForm((prev) => ({ ...prev, taskName: e.target.value }))}
            placeholder="e.g. Bug fix in payroll module / Client review"
            error={!!errors.taskName}
            helperText={errors.taskName}
          />

          <Box>
            <TextField
              label="Work Description"
              multiline
              rows={5}
              fullWidth
              value={form.workDescription}
              onChange={handleWorkDescriptionChange}
              onKeyDown={handleDescriptionKeyDown}
              placeholder="1. "
              error={!!errors.workDescription}
              helperText={errors.workDescription || 'Press Enter to automatically number the next work item'}
            />
          </Box>

          <TextField
            label="Hours Worked"
            type="number"
            fullWidth
            value={form.hoursWorked}
            onChange={(e) => setForm((prev) => ({ ...prev, hoursWorked: e.target.value }))}
            disabled={lockHours}
            helperText={
              lockHours
                ? "Hours are locked from today's clock session"
                : 'In decimal hours, e.g. 8 or 8.5'
            }
            error={!!errors.hoursWorked}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Typography variant="caption" sx={{ mr: 'auto', color: 'text.secondary' }}>
          {hasClockedIn === false ? 'Clock-in required to submit' : 'Saved against attendance record'}
        </Typography>
        <Button onClick={handleClose} color="inherit" sx={{ textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting || hasClockedIn === false || checkingAttendance}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            bgcolor: '#0284c7',
            borderRadius: '7px',
            '&:hover': { bgcolor: '#0369a1' },
          }}
        >
          {initialData?.id ? 'Save Changes' : 'Submit Report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkReportFormDialog;