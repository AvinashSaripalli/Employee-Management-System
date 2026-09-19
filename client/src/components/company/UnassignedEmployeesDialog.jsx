import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, List,
  ListItem, ListItemAvatar, Avatar, ListItemText, CircularProgress, Snackbar, Alert,
  IconButton, Tooltip
} from '@mui/material';
import { FiUserPlus, FiUsers, FiXCircle } from 'react-icons/fi';
import axios from '../../api/axios';

const getInitials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((n) => n[0]?.toUpperCase()).join('');

const UnassignedEmployeesDialog = ({ open, onClose, department = '', employees = [], candidates, asHead = false, onAssigned, onCreateNew }) => {
  const [savingId, setSavingId] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const companyName = localStorage.getItem('companyName') || '';

  // When `candidates` is provided (e.g. assigning a supervisor) use it as-is,
  // otherwise default to employees that are not yet in any department.
  const pool = Array.isArray(candidates)
    ? candidates
    : employees.filter((u) => !u.department || u.department.trim() === '');

  const handleAdd = async (user) => {
    setSavingId(user.id);
    try {
      await axios.patch('/users/update', {
        id: user.id,
        department,
        ...(asHead ? { role: 'Manager' } : {}),
      });

      // Only one head per department — demote any other Managers in it.
      if (asHead) {
        const res = await axios.get('/users', { params: { companyName } });
        const others = (Array.isArray(res.data) ? res.data : []).filter(
          (u) => u.id !== user.id
            && String(u.department || '').trim() === String(department).trim()
            && String(u.role || '').toLowerCase() === 'manager'
        );
        for (const other of others) {
          await axios.patch('/users/update', { id: other.id, role: 'Employee' });
        }
      }

      setSnackbar({
        open: true,
        message: asHead
          ? `${user.firstName} ${user.lastName} is now the head of ${department}.`
          : `${user.firstName} ${user.lastName} added to ${department}.`,
        severity: 'success',
      });
      onAssigned && onAssigned(user);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to assign employee.',
        severity: 'error',
      });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: '1.1rem', color: '#14286D', pb: 1, borderBottom: '1px solid #E8ECF5' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FiUserPlus size="18" color="#14286D" />
            {asHead ? `Assign Supervisor — ${department}` : `Add Employee — ${department}`}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 400, display: 'block', mt: 0.4 }}>
            {asHead
              ? 'Pick the employee who will lead this department (sets them as Manager)'
              : 'Pick an existing employee who is not yet in any department'}
          </Typography>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 1.5 }}>
          {pool.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Box sx={{ width: 54, height: 54, borderRadius: '50%', bgcolor: '#E8EEF9', color: '#14286D', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 1.5 }}>
                <FiUsers size="26" />
              </Box>
              <Typography sx={{ fontWeight: 700, color: '#334155' }}>
                {asHead ? 'No employees available' : 'No unassigned employees'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2 }}>
                {asHead
                  ? 'Create a new employee first, then designate them as head.'
                  : `Every employee is already assigned to a department. You can create a brand-new employee for ${department} instead.`}
              </Typography>
              {onCreateNew && !asHead && (
                <Button variant="contained" startIcon={<FiUserPlus size="15" />} onClick={onCreateNew} sx={{ bgcolor: '#14286D', '&:hover': { bgcolor: '#0B1844' }, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}>
                  Create a New Employee
                </Button>
              )}
            </Box>
          ) : (
            <List sx={{ py: 0 }}>
              {pool.map((user) => (
                <ListItem
                  key={user.id}
                  secondaryAction={
                    <Tooltip title={asHead ? `Set as head of ${department}` : `Add to ${department}`}>
                      <Button
                        size="small"
                        variant="contained"
                        disabled={savingId === user.id}
                        startIcon={savingId === user.id ? <CircularProgress size={13} color="inherit" /> : <FiUserPlus size="13" />}
                        onClick={() => handleAdd(user)}
                        sx={{
                          bgcolor: '#14286D',
                          '&:hover': { bgcolor: '#0B1844' },
                          textTransform: 'none',
                          fontWeight: 700,
                          fontSize: 12,
                          borderRadius: 1.5,
                          px: 1.5,
                        }}
                      >
                        {asHead ? 'Set as Head' : 'Add'}
                      </Button>
                    </Tooltip>
                  }
                  sx={{
                    mb: 1,
                    bgcolor: '#F8FAFD',
                    borderRadius: 2,
                    border: '1px solid #E8ECF5',
                    p: 1,
                    '& .MuiListItemSecondaryAction-root': { right: 8 },
                    pr: 9,
                  }}
                >
                  <ListItemAvatar>
                    <Avatar src={user.photo} sx={{ width: 38, height: 38, bgcolor: '#14286D', color: '#fff', fontSize: 13, fontWeight: 700 }}>
                      {getInitials(`${user.firstName} ${user.lastName}`)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography sx={{ fontWeight: 700, fontSize: 13.5 }} noWrap>
                        {user.firstName} {user.lastName}
                      </Typography>
                    }
                    secondary={
                      <Box component="span">
                        <Typography component="span" sx={{ fontSize: 11.5, color: 'text.secondary', display: 'block' }} noWrap>
                          {user.email}
                        </Typography>
                        <Typography component="span" sx={{ fontSize: 10.5, color: '#64748B', display: 'block' }} noWrap>
                          {user.designation || user.role || 'Employee'} {user.employeeId ? `• ${user.employeeId}` : ''}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E8ECF5' }}>
          <Button onClick={onClose} color="inherit" startIcon={<FiXCircle size="15" />} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2500}
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

export default UnassignedEmployeesDialog;