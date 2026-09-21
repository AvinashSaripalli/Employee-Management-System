import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  Avatar,
  Box,
  Typography,
  Grid,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const CATEGORIES = [
  'Project Pod',
  'Client/Partner',
  'Cross-Functional',
  'Department',
  'Innovation Lab',
  'Committee',
];

const WorkgroupFormDialog = ({
  open,
  onClose,
  onSubmit,
  isEditMode,
  initialData,
  users = [],
  saving,
}) => {
  const [formData, setFormData] = useState({
    groupName: '',
    partnerCompanyName: '',
    description: '',
    category: 'Project Pod',
    status: 'Active',
    privacyType: 'Private',
    createdOn: new Date().toISOString().slice(0, 10),
    leaderId: '',
    tags: '',
    employeers: [],
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        groupName: initialData.groupName || initialData.partnerCompanyName || '',
        partnerCompanyName: initialData.partnerCompanyName || '',
        description: initialData.description || '',
        category: initialData.category || 'Project Pod',
        status: initialData.status || 'Active',
        privacyType: initialData.privacyType || 'Private',
        createdOn: initialData.createdOn
          ? initialData.createdOn.split('T')[0]
          : new Date().toISOString().slice(0, 10),
        leaderId: initialData.leaderId || '',
        tags: initialData.tags || '',
        employeers: Array.isArray(initialData.employeers)
          ? initialData.employeers
          : (initialData.employees || []).map((e) => e.employeeId),
      });
    } else {
      setFormData({
        groupName: '',
        partnerCompanyName: '',
        description: '',
        category: 'Project Pod',
        status: 'Active',
        privacyType: 'Private',
        createdOn: new Date().toISOString().slice(0, 10),
        leaderId: '',
        tags: '',
        employeers: [],
      });
    }
  }, [initialData, open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = () => {
    if (!formData.groupName.trim() && !formData.partnerCompanyName.trim()) {
      alert('Please enter a workgroup name or partner company');
      return;
    }
    if (formData.employeers.length === 0) {
      alert('Please assign at least one team member');
      return;
    }

    const payload = {
      ...formData,
      partnerCompanyName: formData.partnerCompanyName.trim() || formData.groupName.trim(),
      groupName: formData.groupName.trim() || formData.partnerCompanyName.trim(),
    };

    onSubmit(payload);
  };

  const selectedUsers = users.filter((u) => formData.employeers.includes(u.employeeId));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ m: 0, p: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {isEditMode ? 'Edit Workgroup' : 'Create New Workgroup'}
        </Typography>
        <IconButton onClick={onClose} aria-label="close" size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 2 }}>
          <TextField
            label="Workgroup Name"
            name="groupName"
            placeholder="e.g. NextGen Mobile App Team"
            required
            fullWidth
            value={formData.groupName}
            onChange={handleChange}
          />
          <TextField
            label="Partner / Client Company"
            name="partnerCompanyName"
            placeholder="e.g. Acme Corp, Internal"
            fullWidth
            value={formData.partnerCompanyName}
            onChange={handleChange}
            helperText="External partner or internal department entity"
          />
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2.5, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              name="category"
              value={formData.category}
              label="Category"
              onChange={handleChange}
            >
              {CATEGORIES.map((cat) => (
                <MenuItem key={cat} value={cat}>
                  {cat}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Privacy Type</InputLabel>
            <Select
              name="privacyType"
              value={formData.privacyType}
              label="Privacy Type"
              onChange={handleChange}
            >
              <MenuItem value="Private">Private (Invite Only)</MenuItem>
              <MenuItem value="Public">Public (Any Employee Can Join)</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              name="status"
              value={formData.status}
              label="Status"
              onChange={handleChange}
            >
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="On Hold">On Hold</MenuItem>
              <MenuItem value="Archived">Archived</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TextField
          label="Mission & Objectives / Description"
          name="description"
          placeholder="Summarize the purpose, goals, deliverables, or collaboration guidelines for this workgroup..."
          multiline
          rows={3}
          fullWidth
          value={formData.description}
          onChange={handleChange}
          sx={{ mb: 2.5 }}
        />

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2.5, mb: 2.5 }}>
          <FormControl fullWidth>
            <InputLabel>Workgroup Leader / Coordinator</InputLabel>
            <Select
              name="leaderId"
              value={formData.leaderId}
              label="Workgroup Leader / Coordinator"
              onChange={handleChange}
            >
              <MenuItem value="">
                <em>None designated (Auto-assign first member)</em>
              </MenuItem>
              {users.map((user) => (
                <MenuItem key={user.employeeId} value={user.employeeId}>
                  {user.firstName} {user.lastName} ({user.designation || 'Staff'})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            type="date"
            label="Date Created / Kickoff"
            name="createdOn"
            InputLabelProps={{ shrink: true }}
            fullWidth
            value={formData.createdOn}
            onChange={handleChange}
          />
        </Box>

        <Autocomplete
          multiple
          options={users}
          getOptionLabel={(option) => `${option.firstName} ${option.lastName} (${option.designation || 'Staff'})`}
          value={selectedUsers}
          onChange={(event, newValue) => {
            const newIds = newValue.map((u) => u.employeeId);
            setFormData((prev) => {
              const nextLeader = prev.leaderId && !newIds.includes(prev.leaderId) ? '' : prev.leaderId;
              return {
                ...prev,
                employeers: newIds,
                leaderId: nextLeader,
              };
            });
          }}
          filterSelectedOptions
          renderInput={(params) => (
            <TextField
              {...params}
              label="Assigned Team Members"
              required
              placeholder="Search and select employees..."
              helperText="Select colleagues who will collaborate in this workgroup"
            />
          )}
          renderOption={(props, option) => (
            <li {...props} key={option.employeeId}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Avatar
                  src={option.photo || undefined}
                  sx={{ width: 32, height: 32, bgcolor: '#6366F1' }}
                >
                  {option.firstName?.[0] || 'U'}
                </Avatar>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {option.firstName} {option.lastName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.designation || 'Specialist'} • {option.department || 'Operations'}
                  </Typography>
                </Box>
              </Box>
            </li>
          )}
          renderTags={(value, getTagProps) =>
            value.map((user, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  avatar={<Avatar src={user.photo || undefined}>{user.firstName?.[0]}</Avatar>}
                  label={`${user.firstName} ${user.lastName}`}
                  {...tagProps}
                  sx={{ m: 0.5 }}
                />
              );
            })
          }
          sx={{ mb: 2.5 }}
        />

        <TextField
          label="Tags & Domain Keywords"
          name="tags"
          placeholder="e.g. Mobile, Frontend, Q3-Initiative, Security"
          helperText="Comma-separated keywords to help filter and find workgroups"
          fullWidth
          value={formData.tags}
          onChange={handleChange}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2.5, bgcolor: '#FAFCFF' }}>
        <Button onClick={onClose} variant="outlined" sx={{ borderRadius: 2, textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={saving}
          sx={{ borderRadius: 2, textTransform: 'none', px: 3, fontWeight: 600 }}
        >
          {saving && <CircularProgress size={16} sx={{ mr: 1, color: 'inherit' }} />}
          {isEditMode ? 'Update Workgroup' : 'Create Workgroup'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WorkgroupFormDialog;
