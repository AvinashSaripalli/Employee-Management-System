import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem,
  Box, Typography, Stack, Avatar, Snackbar, Alert, CircularProgress, FormControlLabel,
  Switch, Divider, FormControl, InputLabel, Select
} from '@mui/material';
import axios from '../../api/axios';
import useDepartments from '../../hooks/useDepartments';

const AssignEmployeeDialog = ({ open, onClose, user, existingDepartments = [], onAssigned }) => {
  const [department, setDepartment] = useState('');
  const [customDept, setCustomDept] = useState('');
  const [customParent, setCustomParent] = useState('');
  const [designation, setDesignation] = useState('');
  const [isManager, setIsManager] = useState(false);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const { departmentOptions, departmentNames: companyDepartments, refresh: refreshCompanyDepts } = useDepartments();
  const companyName = localStorage.getItem('companyName') || '';

  const ensureDepartment = async (name, parentId) => {
    try {
      await axios.post('/departments', { name, parentId: parentId || null, companyName });
    } catch (e) {
      if (e.response?.status !== 409) throw e;
    }
  };

  // Use the saved department tree first, then include legacy free-text names once.
  const canonicalName = (value) => String(value || '').trim().replace(/\s+/g, ' ');
  const optionMap = new Map();
  [
    ...departmentOptions,
    ...companyDepartments.map((name) => ({ name })),
    ...(existingDepartments || []).map((name) => ({ name })),
    ...(user?.department ? [{ name: user.department }] : []),
  ]
    .forEach((option) => {
      const name = canonicalName(option.name);
      if (!name || name === 'Unassigned' || name === 'KN Advisors') return;
      const key = name.toLowerCase();
      if (!optionMap.has(key)) {
        optionMap.set(key, {
          ...option,
          id: option.id || `extra-${key}`,
          name,
          depth: option.depth || 0,
          parentId: option.parentId || null,
          record: option.record || null,
        });
      }
    });
  const options = Array.from(optionMap.values());
  const hasSelectedDepartment = options.some((option) => option.name === department);

  useEffect(() => {
    if (open) refreshCompanyDepts();
  }, [open, refreshCompanyDepts]);

  useEffect(() => {
    if (open && user) {
      const currentDept = canonicalName(user.department);
      const matchingOption = options.find((option) => option.name.toLowerCase() === currentDept.toLowerCase());
      setDepartment(matchingOption?.name || currentDept);
      setCustomDept('');
      setCustomParent('');
      setDesignation(user.designation || (user.role === 'Admin' ? 'Administrator' : user.role || ''));
      setIsManager(user.role?.toLowerCase() === 'manager' || user.role?.toLowerCase() === 'admin');
    }
  }, [open, user]);

  const handleSave = async () => {
    const finalDept = (department === '__custom__' ? customDept.trim() : department.trim());
    if (!finalDept) {
      setSnackbar({ open: true, message: 'Please select or enter a department.', severity: 'warning' });
      return;
    }
    if (!designation.trim()) {
      setSnackbar({ open: true, message: 'Designation is required.', severity: 'warning' });
      return;
    }

    setSaving(true);
    try {
      if (department === '__custom__') {
        await ensureDepartment(finalDept, customParent);
      }

      // Preserve Admin role; otherwise reflect the manager toggle
      const isAdmin = String(user.role || '').toLowerCase() === 'admin';
      const desiredRole = isManager ? 'Manager' : (isAdmin ? 'Admin' : 'Employee');

      await axios.patch('/users/update', {
        id: user.id,
        department: finalDept,
        designation: designation.trim(),
        role: desiredRole,
      });

      // Single-supervisor consistency: demote other Managers in the same department
      if (isManager) {
        const res = await axios.get('/users', { params: { companyName } });
        const others = (Array.isArray(res.data) ? res.data : []).filter(
          (u) => u.id !== user.id && String(u.department || '').trim() === finalDept && String(u.role || '').toLowerCase() === 'manager'
        );
        for (const other of others) {
          await axios.patch('/users/update', { id: other.id, role: 'Employee' });
        }
      }

      setSnackbar({ open: true, message: 'Employee updated successfully!', severity: 'success' });
      setTimeout(() => {
        onAssigned && onAssigned();
      }, 500);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || error.response?.data?.message || 'Failed to update employee.',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'U';

  const renderDeptOptions = (includeCustom = true, source = options) => (
    <>
      {source.length === 0 ? (
        <MenuItem disabled value="">No departments yet — create one below</MenuItem>
      ) : (
        source.map((opt) => (
          <MenuItem key={String(opt.id)} value={opt.name} sx={{ pl: 1.5 + opt.depth * 2 }}>
            {opt.depth > 0 && <Typography component="span" sx={{ color: '#94A3B8', mr: 0.6 }}>└─</Typography>}
            {opt.name}
          </MenuItem>
        ))
      )}
      {includeCustom && (
        <MenuItem value="__custom__">
          <em>+ New Department...</em>
        </MenuItem>
      )}
    </>
  );

  const showNewDeptFields = department === '__custom__';

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, pb: 1, borderBottom: '1px solid #E8ECF5' }}>
          Assign / Move Employee
        </DialogTitle>
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2.5, p: 1.5, bgcolor: '#F5F9FC', borderRadius: 2 }}>
            <Avatar
              src={user.photo}
              sx={{ width: 48, height: 48, bgcolor: '#14286D', color: '#fff', fontWeight: 'bold' }}
            >
              {initials}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontWeight: 700, fontSize: 15 }} noWrap>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: 12 }} noWrap>
                {user.email}
              </Typography>
              <Typography sx={{ fontSize: 11, color: '#FE8600', fontWeight: 600 }}>
                Current: {user.department || 'Unassigned'} • {user.designation || user.role || 'Employee'}
              </Typography>
            </Box>
          </Stack>

          <TextField
            select
            native
            label="Department"
            fullWidth
            size="small"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            SelectProps={{ native: true }}
            InputLabelProps={{ shrink: true }}
            sx={{ mb: 2 }}
          >
            <option value="">Select department</option>
            {department && !options.some((option) => option.name === department) && (
              <option value={department}>{department}</option>
            )}
            {options.map((option) => (
              <option key={String(option.id)} value={option.name}>
                {`${option.depth > 0 ? `${'  '.repeat(option.depth)}└─ ` : ''}${option.name}`}
              </option>
            ))}
            <option value="__custom__">+ New Department...</option>
          </TextField>

          {showNewDeptFields && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#F8FAFD', border: '1px dashed #C7D2DD', borderRadius: 2 }}>
              <TextField
                label="New Department Name"
                size="small"
                fullWidth
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                placeholder="e.g. Risk Assessment"
                autoFocus
                sx={{ mb: 1.5 }}
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Parent (optional)</InputLabel>
                <Select label="Parent (optional)" value={customParent} onChange={(e) => setCustomParent(e.target.value)}>
                  <MenuItem value="">
                    <em>Top-level department</em>
                  </MenuItem>
                  {renderDeptOptions(false, options)}
                </Select>
              </FormControl>
            </Box>
          )}

          <TextField
            label="Designation / Position"
            size="small"
            fullWidth
            value={designation}
            onChange={(e) => setDesignation(e.target.value)}
            placeholder="e.g. Financial Consultant, Senior Analyst"
            sx={{ mb: 2 }}
          />

          <Divider sx={{ my: 1.5 }} />

          <FormControlLabel
            control={
              <Switch
                checked={isManager}
                onChange={(e) => setIsManager(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography sx={{ fontSize: 13, fontWeight: 700, color: '#14286D' }}>
                  Designate as Department Head / Manager
                </Typography>
                <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                  Position user at the top supervisor slot for this department
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start', ml: 0.2 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, borderTop: '1px solid #E8ECF5' }}>
          <Button onClick={onClose} color="inherit" sx={{ textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving && <CircularProgress size={16} color="inherit" />}
            sx={{
              bgcolor: '#14286D',
              '&:hover': { bgcolor: '#0B1844' },
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
            }}
          >
            {saving ? 'Saving...' : 'Confirm Assignment'}
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