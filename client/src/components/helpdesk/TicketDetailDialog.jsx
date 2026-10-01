import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Stack,
  Avatar,
} from '@mui/material';
import {
  HiOutlineLifebuoy,
  HiOutlineCpuChip,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineBuildingOffice2,
  HiOutlineXMark,
  HiOutlineCheckCircle,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineWrenchScrewdriver,
} from 'react-icons/hi2';
import axios from '../../api/axios';

const STATUS_COLORS = {
  Open: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  'In Progress': { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' },
  'Waiting on Employee': { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  Resolved: { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0' },
  Closed: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  Rejected: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
};

const PRIORITY_BADGES = {
  Critical: { bg: '#DC2626', text: '#ffffff' },
  High: { bg: '#EA580C', text: '#ffffff' },
  Medium: { bg: '#0284C7', text: '#ffffff' },
  Low: { bg: '#64748B', text: '#ffffff' },
};

const TicketDetailDialog = ({ open, ticket, onClose, onUpdated, isStaff }) => {
  const [status, setStatus] = useState('');
  const [assignedToId, setAssignedToId] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [availableAssets, setAvailableAssets] = useState([]);
  const [selectedAssetId, setSelectedAssetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [assetLoading, setAssetLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (ticket) {
      setStatus(ticket.status || 'Open');
      setAssignedToId(ticket.assignedToId ? String(ticket.assignedToId) : '');
      setResolutionNotes(ticket.resolutionNotes || '');
      setSelectedAssetId('');
      setError('');
      setSuccess('');

      // If it's an asset request and staff is viewing, fetch available unassigned assets
      if (ticket.category === 'ASSET_REQUEST' && isStaff && ticket.status !== 'Resolved' && ticket.status !== 'Closed') {
        fetchAvailableAssets();
      }
    }
  }, [ticket, isStaff]);

  const fetchAvailableAssets = async () => {
    setAssetLoading(true);
    try {
      const res = await axios.get('/assets', { params: { status: 'Available' } });
      setAvailableAssets(res.data?.assets || []);
    } catch (err) {
      console.error('Error fetching available assets:', err);
    } finally {
      setAssetLoading(false);
    }
  };

  if (!ticket) return null;

  const handleStatusUpdate = async (newStatus) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        status: newStatus || status,
        assignedToId: assignedToId ? parseInt(assignedToId, 10) : null,
        resolutionNotes: resolutionNotes.trim() || undefined,
      };

      const res = await axios.put(`/support-tickets/${ticket.id}`, payload);
      setSuccess(`Ticket status updated to ${newStatus || status}`);
      window.dispatchEvent(new Event('requestCountsUpdated'));
      if (onUpdated) onUpdated(res.data?.ticket);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update ticket.');
    } finally {
      setLoading(false);
    }
  };

  const handleAllocateAsset = async () => {
    if (!selectedAssetId) {
      setError('Please select an available device to allocate from inventory.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        assetId: parseInt(selectedAssetId, 10),
        notes: resolutionNotes.trim() || `Allocated for Request #${ticket.ticketNumber}`,
      };

      const res = await axios.post(`/support-tickets/${ticket.id}/allocate-asset`, payload);
      setSuccess('Asset successfully allocated to employee and ticket marked as Resolved!');
      window.dispatchEvent(new Event('requestCountsUpdated'));
      if (onUpdated) onUpdated(res.data?.ticket);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to allocate asset.');
    } finally {
      setLoading(false);
    }
  };

  const priorityStyle = PRIORITY_BADGES[ticket.priority] || PRIORITY_BADGES.Medium;
  const statusStyle = STATUS_COLORS[ticket.status] || STATUS_COLORS.Open;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          boxShadow: '0 20px 45px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: '#14286D',
          color: '#ffffff',
          py: 2.2,
          px: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.4 }}>
          <Box
            sx={{
              p: 0.8,
              bgcolor: 'rgba(255, 255, 255, 0.16)',
              borderRadius: '10px',
              display: 'flex',
            }}
          >
            <HiOutlineLifebuoy size={24} color="#ffffff" />
          </Box>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '18px', color: '#ffffff' }}>
                #{ticket.ticketNumber}
              </Typography>
              <Chip
                label={ticket.priority}
                size="small"
                sx={{
                  bgcolor: priorityStyle.bg,
                  color: priorityStyle.text,
                  fontWeight: 700,
                  fontSize: '11px',
                  height: '22px',
                }}
              />
            </Box>
            <Typography sx={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.8)' }}>
              {ticket.category.replace(/_/g, ' ')} · {ticket.subCategory || 'General'}
            </Typography>
          </Box>
        </Box>
        <Button onClick={onClose} sx={{ minWidth: 'auto', p: 0.6, color: '#ffffff', borderRadius: '50%' }}>
          <HiOutlineXMark size={22} />
        </Button>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2.5, borderRadius: '8px' }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2.5, borderRadius: '8px' }}>
            {success}
          </Alert>
        )}

        {/* 1. Header Information Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' },
            gap: 2,
            p: 2,
            bgcolor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            mb: 3,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Requester
            </Typography>
            <Typography sx={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b', mt: 0.3 }}>
              {ticket.employeeName}
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: '#475569' }}>
              ID: {ticket.employeeId} · {ticket.department}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Current Status
            </Typography>
            <Box sx={{ mt: 0.4 }}>
              <Chip
                label={ticket.status}
                size="small"
                sx={{
                  bgcolor: statusStyle.bg,
                  color: statusStyle.text,
                  fontWeight: 700,
                  fontSize: '12px',
                  border: `1px solid ${statusStyle.border}`,
                }}
              />
            </Box>
            <Typography sx={{ fontSize: '11.5px', color: '#64748b', mt: 0.4 }}>
              Logged: {new Date(ticket.created_at || ticket.createdAt).toLocaleDateString()}
            </Typography>
          </Box>

          <Box>
            <Typography sx={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
              Assigned Resolver
            </Typography>
            <Typography sx={{ fontSize: '13.5px', fontWeight: 700, color: '#1e293b', mt: 0.3 }}>
              {ticket.assignedToName || 'Unassigned Queue'}
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: '#64748b' }}>
              {ticket.assignee?.email || 'Awaiting IT/Staff triage'}
            </Typography>
          </Box>
        </Box>

        {/* 2. Title & Description */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', mb: 1 }}>
            {ticket.title}
          </Typography>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              whiteSpace: 'pre-wrap',
              fontSize: '13.5px',
              color: '#334155',
              lineHeight: 1.6,
            }}
          >
            {ticket.description}
          </Paper>
        </Box>

        {/* 3. Allocated Asset Details (If applicable) */}
        {ticket.allocatedAsset && (
          <Box sx={{ mb: 3, p: 2, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <HiOutlineCheckCircle size={20} color="#16a34a" />
              <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#15803d' }}>
                Allocated Company Device
              </Typography>
            </Box>
            <Typography sx={{ fontSize: '13px', color: '#1e293b', fontWeight: 600 }}>
              {ticket.allocatedAsset.name} ({ticket.allocatedAsset.assetTag})
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#4b5563', mt: 0.3 }}>
              Category: {ticket.allocatedAsset.category} · Brand: {ticket.allocatedAsset.brand || 'N/A'} · Model:{' '}
              {ticket.allocatedAsset.model || 'N/A'} · S/N: {ticket.allocatedAsset.serialNumber || 'N/A'}
            </Typography>
          </Box>
        )}

        {/* 4. Staff Actions: Asset Allocation Workflow */}
        {isStaff && ticket.category === 'ASSET_REQUEST' && !ticket.allocatedAsset && ticket.status !== 'Closed' && (
          <Paper
            elevation={0}
            sx={{
              p: 2.2,
              bgcolor: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: '12px',
              mb: 3,
            }}
          >
            <Typography sx={{ fontSize: '13.5px', fontWeight: 700, color: '#1d4ed8', mb: 0.5 }}>
              📦 Fulfill Asset Requisition from Inventory
            </Typography>
            <Typography sx={{ fontSize: '12px', color: '#3b82f6', mb: 1.8 }}>
              Select an available device from the company inventory to allocate directly to {ticket.employeeName}.
            </Typography>

            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <FormControl fullWidth size="small" sx={{ bgcolor: '#ffffff' }}>
                <InputLabel id="asset-select-label">Available Inventory Devices</InputLabel>
                <Select
                  labelId="asset-select-label"
                  value={selectedAssetId}
                  label="Available Inventory Devices"
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  disabled={assetLoading}
                >
                  {availableAssets.length === 0 ? (
                    <MenuItem disabled value="">
                      <em>No available devices in inventory</em>
                    </MenuItem>
                  ) : (
                    availableAssets.map((ast) => (
                      <MenuItem key={ast.id} value={ast.id}>
                        {ast.name} [{ast.assetTag}] - {ast.category} ({ast.brand} {ast.model || ''})
                      </MenuItem>
                    ))
                  )}
                </Select>
              </FormControl>

              <Button
                variant="contained"
                onClick={handleAllocateAsset}
                disabled={loading || !selectedAssetId}
                startIcon={<HiOutlineCheckCircle size={17} />}
                sx={{
                  bgcolor: '#059669',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  whiteSpace: 'nowrap',
                  px: 2.2,
                  py: 0.9,
                  '&:hover': { bgcolor: '#047857' },
                }}
              >
                Approve & Allocate
              </Button>
            </Box>
          </Paper>
        )}

        {/* 5. Resolution Notes & Staff Actions */}
        <Box sx={{ mb: 2 }}>
          <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#334155', mb: 1 }}>
            Resolution Notes & Activity Logs:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={2.5}
            size="small"
            placeholder={
              isStaff
                ? 'Enter diagnostic findings, fix applied, or handover notes for the employee...'
                : 'No resolution notes logged yet.'
            }
            value={resolutionNotes}
            onChange={(e) => setResolutionNotes(e.target.value)}
            disabled={!isStaff && ticket.status === 'Closed'}
          />
        </Box>

        {/* Quick Transition Action Bar for Staff / Admin */}
        {isStaff && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px dashed #cbd5e1' }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#64748b', mb: 1.2 }}>
              Quick Status Transitions:
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {ticket.status === 'Open' && (
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleStatusUpdate('In Progress')}
                  disabled={loading}
                  sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px' }}
                >
                  Start Work (In Progress)
                </Button>
              )}
              {ticket.status !== 'Resolved' && ticket.status !== 'Closed' && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleStatusUpdate('Resolved')}
                  disabled={loading}
                  sx={{
                    bgcolor: '#059669',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    '&:hover': { bgcolor: '#047857' },
                  }}
                >
                  Mark as Resolved
                </Button>
              )}
              {ticket.status === 'Resolved' && (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleStatusUpdate('Closed')}
                  disabled={loading}
                  sx={{
                    bgcolor: '#475569',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: '8px',
                    '&:hover': { bgcolor: '#334155' },
                  }}
                >
                  Close Ticket
                </Button>
              )}
              {ticket.status !== 'Rejected' && ticket.status !== 'Closed' && (
                <Button
                  size="small"
                  color="error"
                  variant="text"
                  onClick={() => handleStatusUpdate('Rejected')}
                  disabled={loading}
                  sx={{ textTransform: 'none', fontWeight: 600 }}
                >
                  Reject Request
                </Button>
              )}
            </Stack>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} sx={{ textTransform: 'none', color: '#64748b', fontWeight: 600 }}>
          Close
        </Button>
        {isStaff && (
          <Button
            variant="contained"
            onClick={() => handleStatusUpdate()}
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#14286D',
              borderRadius: '8px',
              px: 2.5,
              '&:hover': { bgcolor: '#0f1e54' },
            }}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default TicketDetailDialog;
