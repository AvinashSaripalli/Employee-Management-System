import React, { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axios';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Grid,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  InputAdornment,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LoginIcon from '@mui/icons-material/Login';
import CloseIcon from '@mui/icons-material/Close';
import ApplyPermissionDialog from './ApplyPermissionDialog';

const AttendancePermissionsHub = ({ isAdmin, isSupervisor, isEmployee, userDepartment, userEmployeeId }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'approvals'
  const [myPermissions, setMyPermissions] = useState([]);
  const [quota, setQuota] = useState({ monthlyLimit: 2, usedCount: 0, pendingCount: 0, remainingCount: 2 });
  const [approvals, setApprovals] = useState([]);

  // Modals & Forms
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve'); // 'approve' | 'reject'
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Filters for approvals
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Default active tab: Reviewers see Approvals first if any exist, else My Permissions
  useEffect(() => {
    if (isAdmin || isSupervisor) {
      setActiveTab('approvals');
    } else {
      setActiveTab('my');
    }
  }, [isAdmin, isSupervisor]);

  const fetchMyPermissions = useCallback(async () => {
    if (!userEmployeeId) return;
    try {
      const res = await axios.get('/attendance/permissions/my', {
        params: { employeeId: userEmployeeId },
      });
      setMyPermissions(res.data?.permissions || []);
      if (res.data?.quota) setQuota(res.data.quota);
    } catch (err) {
      console.error('Error fetching my permissions:', err);
    }
  }, [userEmployeeId]);

  const fetchApprovals = useCallback(async () => {
    if (!isAdmin && !isSupervisor) return;
    try {
      const res = await axios.get('/attendance/permissions/approvals', {
        params: {
          department: isSupervisor ? userDepartment : 'all',
          status: statusFilter,
        },
      });
      setApprovals(res.data?.permissions || []);
    } catch (err) {
      console.error('Error fetching permission approvals:', err);
    }
  }, [isAdmin, isSupervisor, userDepartment, statusFilter]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchMyPermissions(), fetchApprovals()]);
    setRefreshing(false);
    setLoading(false);
  }, [fetchMyPermissions, fetchApprovals]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Handle Review (Approve / Reject)
  const handleOpenReview = (permission, action) => {
    setSelectedPermission(permission);
    setReviewAction(action);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  const handleConfirmReview = async () => {
    if (!selectedPermission) return;
    setReviewSubmitting(true);
    try {
      const reviewerId = localStorage.getItem('userId') || localStorage.getItem('userEmployeeId');
      const reviewerName =
        `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim() ||
        localStorage.getItem('userName') ||
        'Supervisor';
      const reviewerRole = isAdmin ? 'Admin/HR' : (localStorage.getItem('departmentRole') || 'Supervisor');

      const res = await axios.patch(`/attendance/permissions/${selectedPermission.id}/review`, {
        action: reviewAction,
        reviewerId,
        reviewerName,
        reviewerRole,
        reviewerComment: reviewComment,
      });

      setSnackbar({
        open: true,
        message: res.data?.message || `Permission request ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`,
        severity: 'success',
      });
      setReviewModalOpen(false);
      refreshAll();
    } catch (err) {
      console.error('Error reviewing permission:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to review permission';
      setSnackbar({
        open: true,
        message: errMsg,
        severity: 'error',
      });
      // If already reviewed or stale, auto-close modal and refresh data
      if (err.response?.status === 400 || err.response?.status === 404) {
        setReviewModalOpen(false);
        refreshAll();
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Handle Employee Cancel Request
  const handleCancelPermission = async (permId) => {
    if (!window.confirm('Are you sure you want to cancel this permission request?')) return;
    try {
      await axios.patch(`/attendance/permissions/${permId}/cancel`, { employeeId: userEmployeeId });
      setSnackbar({ open: true, message: 'Permission request cancelled.', severity: 'info' });
      fetchMyPermissions();
    } catch (err) {
      console.error('Error cancelling permission:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to cancel request.',
        severity: 'error',
      });
    }
  };

  const PermissionTypeBadge = ({ type, duration }) => {
    const isEarlyOut = type === 'Early Sign-Out';
    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.2,
          py: 0.45,
          borderRadius: '20px',
          bgcolor: isEarlyOut ? '#FFF7ED' : '#EEF2FF',
          border: `1px solid ${isEarlyOut ? '#FED7AA' : '#C7D2FE'}`,
          boxShadow: isEarlyOut
            ? '0 1px 2px rgba(234, 88, 12, 0.08)'
            : '0 1px 2px rgba(79, 70, 229, 0.08)',
        }}
      >
        {isEarlyOut ? (
          <ExitToAppIcon sx={{ color: '#EA580C', fontSize: 16 }} />
        ) : (
          <LoginIcon sx={{ color: '#4F46E5', fontSize: 16 }} />
        )}
        <Typography
          sx={{
            fontSize: '12px',
            fontWeight: 700,
            color: isEarlyOut ? '#C2410C' : '#3730A3',
            letterSpacing: '0.2px',
          }}
        >
          {type}
        </Typography>
      </Box>
    );
  };

  const statusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <Chip
            size="small"
            icon={<CheckCircleIcon style={{ fontSize: 14, color: '#059669' }} />}
            label="Approved"
            sx={{
              bgcolor: '#ECFDF5',
              color: '#065F46',
              border: '1px solid #A7F3D0',
              fontWeight: 700,
              fontSize: '11px',
              borderRadius: '20px',
              boxShadow: '0 1px 2px rgba(5, 150, 105, 0.08)',
            }}
          />
        );
      case 'Rejected':
        return (
          <Chip
            size="small"
            icon={<CancelIcon style={{ fontSize: 14, color: '#DC2626' }} />}
            label="Rejected"
            sx={{
              bgcolor: '#FEF2F2',
              color: '#991B1B',
              border: '1px solid #FECACA',
              fontWeight: 700,
              fontSize: '11px',
              borderRadius: '20px',
              boxShadow: '0 1px 2px rgba(220, 38, 38, 0.08)',
            }}
          />
        );
      case 'Cancelled':
        return (
          <Chip
            size="small"
            label="Cancelled"
            sx={{
              bgcolor: '#F8FAFC',
              color: '#64748B',
              border: '1px solid #E2E8F0',
              fontWeight: 600,
              fontSize: '11px',
              borderRadius: '20px',
            }}
          />
        );
      default:
        return (
          <Chip
            size="small"
            icon={<HourglassEmptyIcon style={{ fontSize: 13, color: '#D97706' }} />}
            label="Pending Review"
            sx={{
              bgcolor: '#FFFBEB',
              color: '#92400E',
              border: '1px solid #FDE68A',
              fontWeight: 700,
              fontSize: '11px',
              borderRadius: '20px',
              boxShadow: '0 1px 2px rgba(217, 119, 6, 0.08)',
            }}
          />
        );
    }
  };

  // Filtered approvals list
  const filteredApprovals = approvals.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (item.employeeName || '').toLowerCase().includes(q) ||
      (item.employeeId || '').toLowerCase().includes(q) ||
      (item.department || '').toLowerCase().includes(q) ||
      (item.reason || '').toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ width: '100%' }}>
      {/* Top Bar with View Switcher (if Reviewer) & Action Button */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'stretch', sm: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {(isAdmin || isSupervisor) && (
            <Box
              sx={{
                display: 'inline-flex',
                bgcolor: '#F1F5F9',
                p: 0.5,
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
              }}
            >
              <Button
                size="small"
                onClick={() => setActiveTab('approvals')}
                sx={{
                  px: 2,
                  py: 0.6,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: activeTab === 'approvals' ? '#14286D' : 'transparent',
                  color: activeTab === 'approvals' ? '#FFFFFF' : '#475569',
                  '&:hover': {
                    bgcolor: activeTab === 'approvals' ? '#0E1D50' : '#E2E8F0',
                  },
                }}
              >
                Review Requests
                {approvals.filter((a) => a.status === 'Pending').length > 0 && (
                  <Chip
                    label={approvals.filter((a) => a.status === 'Pending').length}
                    size="small"
                    sx={{
                      ml: 1,
                      height: 18,
                      fontSize: '10px',
                      fontWeight: 800,
                      bgcolor: activeTab === 'approvals' ? '#EF4444' : '#DC2626',
                      color: '#FFF',
                    }}
                  />
                )}
              </Button>

              <Button
                size="small"
                onClick={() => setActiveTab('my')}
                sx={{
                  px: 2,
                  py: 0.6,
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textTransform: 'none',
                  bgcolor: activeTab === 'my' ? '#14286D' : 'transparent',
                  color: activeTab === 'my' ? '#FFFFFF' : '#475569',
                  '&:hover': {
                    bgcolor: activeTab === 'my' ? '#0E1D50' : '#E2E8F0',
                  },
                }}
              >
                My Permissions
              </Button>
            </Box>
          )}

          <Tooltip title="Refresh records">
            <IconButton
              size="small"
              onClick={refreshAll}
              disabled={refreshing}
              sx={{
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                bgcolor: '#FFFFFF',
                color: '#64748B',
              }}
            >
              <RefreshIcon
                fontSize="small"
                sx={{
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                }}
              />
            </IconButton>
          </Tooltip>
        </Box>

        <Button
          variant="contained"
          onClick={() => setApplyModalOpen(true)}
          startIcon={<AddCircleOutlineIcon />}
          sx={{
            bgcolor: '#14286D',
            '&:hover': { bgcolor: '#0E1D50' },
            borderRadius: '9px',
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '13.5px',
            px: 2.5,
            py: 0.9,
            boxShadow: '0 4px 6px -1px rgba(20, 40, 109, 0.2)',
          }}
        >
          Apply for Permission
        </Button>
      </Box>

      {/* SECTION 1: MY PERMISSIONS VIEW */}
      {activeTab === 'my' && (
        <Box>
          {/* Monthly Quota Metric Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.2,
                  borderRadius: '14px',
                  border: '1px solid #BFDBFE',
                  background: 'linear-gradient(135deg, #F0F7FF 0%, #E0EFFF 100%)',
                  boxShadow: '0 2px 6px rgba(37, 99, 235, 0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontSize: '11.5px', color: '#1E40AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Monthly Quota Available
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mt: 0.5 }}>
                      <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E3A8A' }}>
                        {quota.remainingCount}
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: '#3B82F6', fontWeight: 600 }}>
                        / {quota.monthlyLimit} requests
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                    <AccessTimeIcon sx={{ fontSize: 22 }} />
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '11.5px', color: '#1D4ED8', mt: 1, fontWeight: 500 }}>
                  Max 2 hours per occurrence · Resets 1st of month
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.2,
                  borderRadius: '14px',
                  border: '1px solid #A7F3D0',
                  background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
                  boxShadow: '0 2px 6px rgba(16, 185, 129, 0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontSize: '11.5px', color: '#065F46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Approved This Month
                    </Typography>
                    <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#065F46', mt: 0.5 }}>
                      {quota.approvedCount}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                    <CheckCircleIcon sx={{ fontSize: 22 }} />
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '11.5px', color: '#047857', mt: 1, fontWeight: 500 }}>
                  Regularized without salary or shift penalty
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Paper
                elevation={0}
                sx={{
                  p: 2.2,
                  borderRadius: '14px',
                  border: '1px solid #FDE68A',
                  background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                  boxShadow: '0 2px 6px rgba(245, 158, 11, 0.06)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography sx={{ fontSize: '11.5px', color: '#92400E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Pending Approval
                    </Typography>
                    <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#92400E', mt: 0.5 }}>
                      {quota.pendingCount}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                    <HourglassEmptyIcon sx={{ fontSize: 22 }} />
                  </Box>
                </Box>
                <Typography sx={{ fontSize: '11.5px', color: '#B45309', mt: 1, fontWeight: 500 }}>
                  Awaiting supervisor / management review
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* My Permission Records Table */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '14px',
              border: '1px solid #E2E8F0',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                My Permission History
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                All Late Sign-In and Early Sign-Out requests submitted by you
              </Typography>
            </Box>

            {loading ? (
              <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={30} />
              </Box>
            ) : myPermissions.length === 0 ? (
              <Box sx={{ p: 5, textAlign: 'center' }}>
                <AccessTimeIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
                <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: '15px' }}>
                  No permission requests found
                </Typography>
                <Typography sx={{ fontSize: '12.5px', color: '#64748B', mt: 0.5 }}>
                  Need to arrive late or leave early? Click "Apply for Permission" above.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Target Date</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Time & Duration</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Reason</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Reviewer Remarks</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myPermissions.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>
                          <PermissionTypeBadge type={row.permissionType} />
                        </TableCell>
                        <TableCell sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                          {row.date}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                            {row.expectedTime}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                            {row.durationHours} hr ({Number(row.durationHours) * 60} mins)
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ maxWidth: 220 }}>
                          <Tooltip title={row.reason || ''} arrow>
                            <Typography
                              sx={{
                                fontSize: '12px',
                                color: '#475569',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {row.reason}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{statusBadge(row.status)}</TableCell>
                        <TableCell sx={{ maxWidth: 180 }}>
                          {row.reviewerComment ? (
                            <Box>
                              <Typography sx={{ fontSize: '11.5px', color: '#334155', fontStyle: 'italic' }}>
                                "{row.reviewerComment}"
                              </Typography>
                              <Typography sx={{ fontSize: '10.5px', color: '#94A3B8' }}>
                                By {row.reviewerName || 'Reviewer'}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: '12px', color: '#94A3B8' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell align="right">
                          {row.status === 'Pending' && (
                            <Button
                              size="small"
                              onClick={() => handleCancelPermission(row.id)}
                              sx={{
                                color: '#EF4444',
                                fontSize: '11.5px',
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 1,
                                py: 0.2,
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      )}

      {/* SECTION 2: APPROVALS REVIEW VIEW (FOR SUPERVISORS / HR / ADMINS) */}
      {activeTab === 'approvals' && (
        <Paper
          elevation={0}
          sx={{
            borderRadius: '14px',
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
          }}
        >
          {/* Filter Bar */}
          <Box
            sx={{
              p: 2,
              bgcolor: '#FFFFFF',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'stretch', md: 'center' },
              gap: 2,
            }}
          >
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                Permission Approval Requests
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                Review and regularize late arrival and early departure requests
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel sx={{ fontSize: '12.5px' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ borderRadius: '8px', fontSize: '12.5px' }}
                >
                  <MenuItem value="Pending">Pending Only</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Rejected">Rejected</MenuItem>
                  <MenuItem value="all">All Statuses</MenuItem>
                </Select>
              </FormControl>

              <TextField
                size="small"
                placeholder="Search employee, dept, reason..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: '#94A3B8' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  minWidth: { xs: '100%', sm: 220 },
                  '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '12.5px' },
                }}
              />
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <CircularProgress size={30} />
            </Box>
          ) : filteredApprovals.length === 0 ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: '#10B981', mb: 1 }} />
              <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: '15px' }}>
                All caught up!
              </Typography>
              <Typography sx={{ fontSize: '12.5px', color: '#64748B', mt: 0.5 }}>
                No permission requests currently matching the selected filter.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Target Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Time & Duration</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredApprovals.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>
                        <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
                          {row.employeeName}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                          {row.employeeId} · {row.department}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <PermissionTypeBadge type={row.permissionType} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                        {row.date}
                      </TableCell>
                      <TableCell>
                        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                          {row.expectedTime}
                        </Typography>
                        <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                          {row.durationHours} hr ({Number(row.durationHours) * 60} mins)
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Tooltip title={row.reason || ''} arrow>
                          <Typography
                            sx={{
                              fontSize: '12px',
                              color: '#475569',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {row.reason}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell>{statusBadge(row.status)}</TableCell>
                      <TableCell align="right">
                        {row.status === 'Pending' ? (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleOpenReview(row, 'approve')}
                              sx={{
                                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                                '&:hover': { background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' },
                                color: '#FFFFFF',
                                fontSize: '11.5px',
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 1.8,
                                py: 0.4,
                                borderRadius: '8px',
                                boxShadow: '0 2px 5px rgba(16, 185, 129, 0.3)',
                              }}
                            >
                              Approve
                            </Button>
                            <Button
                              size="small"
                              onClick={() => handleOpenReview(row, 'reject')}
                              sx={{
                                bgcolor: '#FFF1F2',
                                border: '1px solid #FECDD3',
                                color: '#E11D48',
                                '&:hover': { bgcolor: '#FFE4E6', borderColor: '#FDA4AF', color: '#BE123C' },
                                fontSize: '11.5px',
                                textTransform: 'none',
                                fontWeight: 700,
                                px: 1.8,
                                py: 0.4,
                                borderRadius: '8px',
                              }}
                            >
                              Reject
                            </Button>
                          </Box>
                        ) : (
                          <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                            Reviewed by {row.reviewerName || 'Supervisor'}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* MODAL 1: Apply Permission Form Dialog */}
      <ApplyPermissionDialog
        open={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        onSuccess={() => {
          setSnackbar({ open: true, message: 'Permission request submitted successfully', severity: 'success' });
          refreshAll();
        }}
        remainingQuota={quota.remainingCount}
      />

      {/* MODAL 2: Review (Approve/Reject) Comment Dialog */}
      <Dialog
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#0F172A' }}>
            {reviewAction === 'approve' ? 'Approve Permission' : 'Reject Permission'}
          </Typography>
          <IconButton size="small" onClick={() => setReviewModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 1.5 }}>
          {selectedPermission && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: '12px',
                border: '1px solid',
                borderColor: selectedPermission.permissionType === 'Early Sign-Out' ? '#FDE68A' : '#C7D2FE',
                background: selectedPermission.permissionType === 'Early Sign-Out'
                  ? 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)'
                  : 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                  {selectedPermission.employeeName}
                </Typography>
                <PermissionTypeBadge type={selectedPermission.permissionType} />
              </Box>
              <Typography sx={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                Date: {selectedPermission.date} · Expected Punch: {selectedPermission.expectedTime} ({selectedPermission.durationHours}h)
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#334155', mt: 0.75, fontStyle: 'italic', bgcolor: 'rgba(255, 255, 255, 0.6)', p: 1, borderRadius: '6px' }}>
                "{selectedPermission.reason}"
              </Typography>
            </Box>
          )}

          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155', mb: 0.7 }}>
            Reviewer Remarks (Optional)
          </Typography>
          <TextField
            multiline
            rows={2}
            fullWidth
            size="small"
            placeholder={
              reviewAction === 'approve'
                ? 'e.g. Approved. Please ensure pending tasks are completed.'
                : 'e.g. Denied due to scheduled client demonstration.'
            }
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '12.5px', bgcolor: '#F8FAFC' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button onClick={() => setReviewModalOpen(false)} sx={{ color: '#64748B', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmReview}
            disabled={reviewSubmitting}
            variant="contained"
            sx={{
              background: reviewAction === 'approve'
                ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
                : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
              '&:hover': {
                background: reviewAction === 'approve'
                  ? 'linear-gradient(135deg, #059669 0%, #047857 100%)'
                  : 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)',
              },
              boxShadow: reviewAction === 'approve'
                ? '0 4px 10px rgba(16, 185, 129, 0.3)'
                : '0 4px 10px rgba(239, 68, 68, 0.3)',
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              px: 2.5,
              py: 0.6,
            }}
          >
            {reviewSubmitting ? 'Submitting...' : reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar alerts */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AttendancePermissionsHub;
