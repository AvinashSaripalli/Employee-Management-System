import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  Switch,
  FormControlLabel,
  Paper,
  Divider,
  IconButton,
  Chip,
} from '@mui/material';
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineCpuChip,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineBuildingOffice2,
  HiOutlineXMark,
  HiOutlineCheckCircle,
} from 'react-icons/hi2';
import axios from '../../api/axios';

const HelpdeskSettingsDialog = ({ open, onClose, onSaved }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    itApproverId: '',
    assetApproverId: '',
    hrApproverId: '',
    facilityApproverId: '',
    autoAssignEnabled: true,
    requireSupervisorApproval: false,
  });

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/support-tickets/settings');
      if (res.data?.users) {
        setUsers(res.data.users);
      }
      if (res.data?.setting) {
        const s = res.data.setting;
        setFormData({
          itApproverId: s.itApproverId ? String(s.itApproverId) : '',
          assetApproverId: s.assetApproverId ? String(s.assetApproverId) : '',
          hrApproverId: s.hrApproverId ? String(s.hrApproverId) : '',
          facilityApproverId: s.facilityApproverId ? String(s.facilityApproverId) : '',
          autoAssignEnabled: s.autoAssignEnabled !== undefined ? s.autoAssignEnabled : true,
          requireSupervisorApproval: s.requireSupervisorApproval !== undefined ? s.requireSupervisorApproval : false,
        });
      }
    } catch (err) {
      console.error('Failed to load helpdesk settings:', err);
      setError(err.response?.data?.error || 'Could not load settings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchSettings();
      setSuccessMsg('');
    }
  }, [open, fetchSettings]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      await axios.put('/support-tickets/settings', formData);
      setSuccessMsg('Helpdesk approvers and routing policies saved successfully!');
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error saving helpdesk settings:', err);
      setError(err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const renderUserOption = (user) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    return (
      <MenuItem key={user.id} value={String(user.id)}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1E293B' }}>
              {fullName}
            </Typography>
            <Typography variant="caption" sx={{ color: '#64748B' }}>
              {user.employeeId} · {user.department || 'General'}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={user.role}
            sx={{
              height: 20,
              fontSize: '0.68rem',
              fontWeight: 600,
              bgcolor: user.role === 'Admin' ? '#EEF2FF' : '#F1F5F9',
              color: user.role === 'Admin' ? '#4F46E5' : '#475569',
            }}
          />
        </Box>
      </MenuItem>
    );
  };

  const sections = [
    {
      key: 'itApproverId',
      title: 'IT Support Approver / Lead',
      subtitle: 'Handles software defects, network/VPN, license provisioning, and system access.',
      icon: <HiOutlineCpuChip size={20} color="#4F46E5" />,
      color: '#4F46E5',
      bgColor: '#EEF2FF',
    },
    {
      key: 'assetApproverId',
      title: 'Asset Requisition Approver',
      subtitle: 'Authorizes equipment requests and allocates laptops/devices directly from inventory.',
      icon: <HiOutlineCube size={20} color="#059669" />,
      color: '#059669',
      bgColor: '#ECFDF5',
    },
    {
      key: 'hrApproverId',
      title: 'HR & Document Approver',
      subtitle: 'Processes bonafide letters, salary certificates, and employment verification.',
      icon: <HiOutlineDocumentText size={20} color="#0284C7" />,
      color: '#0284C7',
      bgColor: '#F0F9FF',
    },
    {
      key: 'facilityApproverId',
      title: 'Facility & Office Approver',
      subtitle: 'Manages physical workstation, access keycards, and office infrastructure requests.',
      icon: <HiOutlineBuildingOffice2 size={20} color="#D97706" />,
      color: '#D97706',
      bgColor: '#FFFBEB',
    },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: 2.5,
          bgcolor: '#F8FAFC',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 42,
              height: 42,
              borderRadius: '10px',
              bgcolor: '#EEF2FF',
              color: '#4F46E5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <HiOutlineAdjustmentsHorizontal size={24} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '1.15rem' }}>
              Helpdesk Workflow & Approver Settings
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
              Designate resolvers and automation rules for service desk inquiries
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#94A3B8', '&:hover': { color: '#0F172A' } }}>
          <HiOutlineXMark size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box sx={{ py: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={36} sx={{ color: '#4F46E5' }} />
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Loading approver configuration...
            </Typography>
          </Box>
        ) : (
          <Stack spacing={3}>
            {error && (
              <Alert severity="error" onClose={() => setError('')} sx={{ borderRadius: '8px' }}>
                {error}
              </Alert>
            )}

            {successMsg && (
              <Alert
                icon={<HiOutlineCheckCircle size={20} />}
                severity="success"
                sx={{ borderRadius: '8px', bgcolor: '#ECFDF5', color: '#065F46' }}
              >
                {successMsg}
              </Alert>
            )}

            {/* Approver Category Configuration */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                Designated Category Leads & Approvers
              </Typography>
              <Stack spacing={2}>
                {sections.map((sec) => (
                  <Paper
                    key={sec.key}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid #E2E8F0',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      '&:hover': { borderColor: '#CBD5E1', bgcolor: '#F8FAFC' },
                    }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                        <Box
                          sx={{
                            width: 38,
                            height: 38,
                            borderRadius: '8px',
                            bgcolor: sec.bgColor,
                            color: sec.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            mt: 0.25,
                          }}
                        >
                          {sec.icon}
                        </Box>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                            {sec.title}
                          </Typography>
                          <Typography variant="caption" sx={{ color: '#64748B', display: 'block', lineHeight: 1.4 }}>
                            {sec.subtitle}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ width: { xs: '100%', sm: 260 } }}>
                        <TextField
                          select
                          size="small"
                          fullWidth
                          value={formData[sec.key]}
                          onChange={(e) => setFormData((prev) => ({ ...prev, [sec.key]: e.target.value }))}
                          SelectProps={{
                            displayEmpty: true,
                            renderValue: (selected) => {
                              if (!selected) {
                                return <span style={{ color: '#94A3B8', fontSize: '0.85rem' }}>Unassigned (Open Pool)</span>;
                              }
                              const u = users.find((x) => String(x.id) === String(selected));
                              return u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email : 'Selected User';
                            },
                          }}
                          sx={{
                            bgcolor: '#FFFFFF',
                            borderRadius: '8px',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: '#CBD5E1' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#4F46E5' },
                          }}
                        >
                          <MenuItem value="">
                            <em>Unassigned (Open Pool / Anyone Can Review)</em>
                          </MenuItem>
                          {users.map(renderUserOption)}
                        </TextField>
                      </Box>
                    </Box>
                  </Paper>
                ))}
              </Stack>
            </Box>

            <Divider />

            {/* Automation Policies */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0F172A', mb: 1.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                Routing & Automation Policies
              </Typography>

              <Stack spacing={1.5}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ pr: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      Auto-Assign Requests on Submission
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      Automatically assign newly submitted tickets to the designated category approver and dispatch immediate task notifications.
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.autoAssignEnabled}
                        onChange={(e) => setFormData((prev) => ({ ...prev, autoAssignEnabled: e.target.checked }))}
                        color="primary"
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ pr: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#1E293B' }}>
                      Require Department Supervisor Pre-Approval
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748B', display: 'block' }}>
                      Hold new requests in 'Waiting on Supervisor' until the employee's direct supervisor endorses before reaching the category approver.
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.requireSupervisorApproval}
                        onChange={(e) => setFormData((prev) => ({ ...prev, requireSupervisorApproval: e.target.checked }))}
                        color="primary"
                      />
                    }
                    label=""
                    sx={{ m: 0 }}
                  />
                </Paper>
              </Stack>
            </Box>
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#F8FAFC', borderTop: '1px solid #E2E8F0' }}>
        <Button
          onClick={onClose}
          sx={{
            textTransform: 'none',
            fontWeight: 600,
            color: '#64748B',
            '&:hover': { bgcolor: '#F1F5F9', color: '#0F172A' },
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || loading}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          sx={{
            bgcolor: '#4F46E5',
            textTransform: 'none',
            fontWeight: 700,
            px: 3,
            py: 1,
            borderRadius: '8px',
            '&:hover': { bgcolor: '#4338CA' },
          }}
        >
          {saving ? 'Saving Changes...' : 'Save Settings'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HelpdeskSettingsDialog;
