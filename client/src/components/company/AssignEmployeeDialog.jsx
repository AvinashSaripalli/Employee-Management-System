import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem,
  Box, Typography, Stack, Avatar, Snackbar, Alert, CircularProgress,
} from '@mui/material';
import axios from '../../api/axios';

const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'Human Resources', 'Finance', 'Operations'];

const AssignEmployeeDialog = ({ open, onClose, user, onAssigned }) => {
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (open && user) {
      setDepartment(user.department || '');
      setDesignation(user.designation || '');
    }
  }, [open, user]);

  const handleSave = async () => {
    if (!department) {
      setSnackbar({ open: true, message: 'Please select a department.', severity: 'warning' });
      return;
    }
    if (!designation.trim()) {
      setSnackbar({ open: true, message: 'Designation is required.', severity: 'warning' });
      return;
    }

    setSaving(true);
    try {
      await axios.patch(`/users/${user.id}`, {
        department,
        designation: designation.trim(),
      });
      setSnackbar({ open: true, message: 'Employee assigned successfully!', severity: 'success' });
      onAssigned && onAssigned();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Failed to assign. Please try again.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', pb: 1 }}>Assign Employee</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
            <Avatar
              src={user.photo}
              sx={{ width: 52, height: 52, bgcolor: '#14286D', color: '#fff', fontWeight: 'bold' }}
            >
              {`${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase()}
            </Avatar>
            <Box>
              <Typography sx={{ fontWeight: 'bold' }}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 13 }}>
                {user.designation || user.role || 'Employee'}
              </Typography>
            </Box>
          </Stack>

          <TextField
            select
            label="Department"
            size="small"
            fullWidth
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            sx={{ mb: 2 }}
          >
            {DEPARTMENTS.map((dept) => (
              <MenuItem key={dept} value={dept}>
                {dept}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Designation"
            size="small"
            fullWidth
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g. Senior Developer"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving && <CircularProgress size={16} color="inherit" />}
            sx={{ bgcolor: '#FE6800', '&:hover': { bgcolor: '#E8590C' }, textTransform: 'none' }}
          >
            {saving ? 'Saving...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AssignEmployeeDialog;
