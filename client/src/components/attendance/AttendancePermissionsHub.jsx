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
  Tabs,
  Tab,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditCalendarIcon from '@mui/icons-material/EditCalendar';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import LoginIcon from '@mui/icons-material/Login';
import CloseIcon from '@mui/icons-material/Close';
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import LaptopMacIcon from '@mui/icons-material/LaptopMac';
import BugReportIcon from '@mui/icons-material/BugReport';
import ApplyPermissionDialog from './ApplyPermissionDialog';
import ApplyRegularizationDialog from './ApplyRegularizationDialog';

const AttendancePermissionsHub = ({ isAdmin, isSupervisor, isEmployee, userDepartment, userEmployeeId }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'approvals'
  const [mySubTab, setMySubTab] = useState('regularizations'); // 'permissions' | 'regularizations'

  // Permissions State
  const [myPermissions, setMyPermissions] = useState([]);
  const [quota, setQuota] = useState({ monthlyLimit: 2, usedCount: 0, pendingCount: 0, remainingCount: 2, approvedCount: 0 });
  const [permissionApprovals, setPermissionApprovals] = useState([]);

  // Regularizations State
  const [myRegularizations, setMyRegularizations] = useState([]);
  const [regularizationApprovals, setRegularizationApprovals] = useState([]);

  // Modals & Dialogs
  const [applyPermissionOpen, setApplyPermissionOpen] = useState(false);
  const [applyRegularizationOpen, setApplyRegularizationOpen] = useState(false);

  // Review Dialog State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [reviewCategory, setReviewCategory] = useState('permission'); // 'permission' | 'regularization'
  const [reviewAction, setReviewAction] = useState('approve'); // 'approve' | 'reject'
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Filters for approvals
  const [statusFilter, setStatusFilter] = useState('Pending');
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'permission' | 'regularization'
  const [searchQuery, setSearchQuery] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Default active tab: Reviewers see Approvals first if any exist, else My Requests
  useEffect(() => {
    if (isAdmin || isSupervisor) {
      setActiveTab('approvals');
    } else {
      setActiveTab('my');
    }
  }, [isAdmin, isSupervisor]);

  // Fetch My Permissions
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

  // Fetch My Regularizations
  const fetchMyRegularizations = useCallback(async () => {
    if (!userEmployeeId) return;
    try {
      const res = await axios.get('/attendance/regularization/my', {
        params: { employeeId: userEmployeeId },
      });
      setMyRegularizations(res.data?.regularizations || []);
    } catch (err) {
      console.error('Error fetching my regularizations:', err);
    }
  }, [userEmployeeId]);

  // Fetch Permission Approvals
  const fetchPermissionApprovals = useCallback(async () => {
    if (!isAdmin && !isSupervisor) return;
    try {
      const res = await axios.get('/attendance/permissions/approvals', {
        params: {
          department: isSupervisor ? userDepartment : 'all',
          status: statusFilter,
        },
      });
      setPermissionApprovals(res.data?.permissions || []);
    } catch (err) {
      console.error('Error fetching permission approvals:', err);
    }
  }, [isAdmin, isSupervisor, userDepartment, statusFilter]);

  // Fetch Regularization Approvals
  const fetchRegularizationApprovals = useCallback(async () => {
    if (!isAdmin && !isSupervisor) return;
    try {
      const res = await axios.get('/attendance/regularization/approvals', {
        params: {
          department: isSupervisor ? userDepartment : 'all',
          status: statusFilter,
        },
      });
      setRegularizationApprovals(res.data?.regularizations || []);
    } catch (err) {
      console.error('Error fetching regularization approvals:', err);
    }
  }, [isAdmin, isSupervisor, userDepartment, statusFilter]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      fetchMyPermissions(),
      fetchMyRegularizations(),
      fetchPermissionApprovals(),
      fetchRegularizationApprovals(),
    ]);
    setRefreshing(false);
    setLoading(false);
  }, [fetchMyPermissions, fetchMyRegularizations, fetchPermissionApprovals, fetchRegularizationApprovals]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Open Review Dialog
  const handleOpenReview = (item, category, action) => {
    setSelectedItem(item);
    setReviewCategory(category);
    setReviewAction(action);
    setReviewComment('');
    setReviewModalOpen(true);
  };

  // Submit Review
  const handleConfirmReview = async () => {
    if (!selectedItem) return;
    setReviewSubmitting(true);
    try {
      const reviewerId = localStorage.getItem('userId') || localStorage.getItem('userEmployeeId');
      const reviewerName =
        `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim() ||
        localStorage.getItem('userName') ||
        'Supervisor';
      const reviewerRole = isAdmin ? 'Admin/HR' : (localStorage.getItem('departmentRole') || 'Supervisor');

      const endpoint = reviewCategory === 'permission'
        ? `/attendance/permissions/${selectedItem.id}/review`
        : `/attendance/regularization/${selectedItem.id}/review`;

      const res = await axios.patch(endpoint, {
        action: reviewAction,
        reviewerId,
        reviewerName,
        reviewerRole,
        reviewerComment: reviewComment,
      });

      setSnackbar({
        open: true,
        message: res.data?.message || `Request ${reviewAction === 'approve' ? 'approved' : 'rejected'} successfully`,
        severity: 'success',
      });
      setReviewModalOpen(false);
      refreshAll();
    } catch (err) {
      console.error('Error reviewing request:', err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to review request';
      setSnackbar({
        open: true,
        message: errMsg,
        severity: 'error',
      });
      if (err.response?.status === 400 || err.response?.status === 404) {
        setReviewModalOpen(false);
        refreshAll();
      }
    } finally {
      setReviewSubmitting(false);
    }
  };

  // Cancel Request by Employee
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

  const handleCancelRegularization = async (regId) => {
    if (!window.confirm('Are you sure you want to cancel this attendance regularization request?')) return;
    try {
      await axios.patch(`/attendance/regularization/${regId}/cancel`, { employeeId: userEmployeeId });
      setSnackbar({ open: true, message: 'Regularization request cancelled.', severity: 'info' });
      fetchMyRegularizations();
    } catch (err) {
      console.error('Error cancelling regularization:', err);
      setSnackbar({
        open: true,
        message: err.response?.data?.error || 'Failed to cancel regularization request.',
        severity: 'error',
      });
    }
  };

  // Badges & Helpers
  const PermissionTypeBadge = ({ type }) => {
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
          }}
        >
          {type}
        </Typography>
      </Box>
    );
  };

  const RegularizationTypeBadge = ({ type }) => {
    let icon = <AccessTimeIcon sx={{ fontSize: 15, color: '#0369A1' }} />;
    let bg = '#F0F9FF';
    let border = '#BAE6FD';
    let textCol = '#0369A1';

    if (type === 'On Duty / Client Visit') {
      icon = <BusinessCenterIcon sx={{ fontSize: 15, color: '#7C3AED' }} />;
      bg = '#F5F3FF';
      border = '#DDD6FE';
      textCol = '#6D28D9';
    } else if (type === 'Remote Work') {
      icon = <LaptopMacIcon sx={{ fontSize: 15, color: '#059669' }} />;
      bg = '#ECFDF5';
      border = '#A7F3D0';
      textCol = '#047857';
    } else if (type === 'Technical Glitch') {
      icon = <BugReportIcon sx={{ fontSize: 15, color: '#D97706' }} />;
      bg = '#FFFBEB';
      border = '#FDE68A';
      textCol = '#B45309';
    }

    return (
      <Box
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.2,
          py: 0.45,
          borderRadius: '20px',
          bgcolor: bg,
          border: `1px solid ${border}`,
        }}
      >
        {icon}
        <Typography sx={{ fontSize: '12px', fontWeight: 700, color: textCol }}>
          {type || 'Regularization'}
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
            }}
          />
        );
    }
  };

  // Combine approvals for unified review queue
  const combinedApprovals = React.useMemo(() => {
    const list = [];
    if (categoryFilter === 'all' || categoryFilter === 'permission') {
      permissionApprovals.forEach((item) => list.push({ ...item, requestCategory: 'permission' }));
    }
    if (categoryFilter === 'all' || categoryFilter === 'regularization') {
      regularizationApprovals.forEach((item) => list.push({ ...item, requestCategory: 'regularization' }));
    }
    // Filter by search query
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) =>
      (item.employeeName || '').toLowerCase().includes(q) ||
      (item.employeeId || '').toLowerCase().includes(q) ||
      (item.department || '').toLowerCase().includes(q) ||
      (item.reason || '').toLowerCase().includes(q)
    );
  }, [permissionApprovals, regularizationApprovals, categoryFilter, searchQuery]);

  const totalPendingReviews =
    permissionApprovals.filter((a) => a.status === 'Pending').length +
    regularizationApprovals.filter((a) => a.status === 'Pending').length;

  return (
    <Box sx={{ width: '100%' }}>
      {/* Top Bar with View Switcher & Action Buttons */}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
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
                Review Queue
                {totalPendingReviews > 0 && (
                  <Chip
                    label={totalPendingReviews}
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
                My Requests
              </Button>
            </Box>
          )}

          <Tooltip title="Refresh all records">
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

        {/* Action Buttons for Employees / All Users */}
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            onClick={() => setApplyPermissionOpen(true)}
            startIcon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
            sx={{
              borderColor: '#C7D2FE',
              color: '#3730A3',
              bgcolor: '#EEF2FF',
              '&:hover': { bgcolor: '#E0E7FF', borderColor: '#818CF8' },
              borderRadius: '9px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13px',
              px: 2,
              py: 0.8,
            }}
          >
            Apply Short Permission
          </Button>

          <Button
            variant="contained"
            onClick={() => setApplyRegularizationOpen(true)}
            startIcon={<AddCircleOutlineIcon />}
            sx={{
              background: 'linear-gradient(135deg, #14286D 0%, #0F1F58 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #0F1F58 0%, #091338 100%)' },
              borderRadius: '9px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13px',
              px: 2.2,
              py: 0.8,
              boxShadow: '0 4px 8px rgba(20, 40, 109, 0.25)',
            }}
          >
            Apply Regularization
          </Button>
        </Box>
      </Box>

      {/* ======================================================= */}
      {/* SECTION 1: MY REQUESTS VIEW (PERMISSIONS & REGULARIZATION) */}
      {/* ======================================================= */}
      {activeTab === 'my' && (
        <Box>
          {/* Sub Navigation Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={mySubTab}
              onChange={(_, val) => setMySubTab(val)}
              textColor="primary"
              indicatorColor="primary"
              sx={{
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '14px',
                  minHeight: 44,
                },
              }}
            >
              <Tab
                value="regularizations"
                icon={<EditCalendarIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Attendance Regularization (Missed Punches)</span>
                    {myRegularizations.length > 0 && (
                      <Chip label={myRegularizations.length} size="small" sx={{ height: 18, fontSize: '10px', fontWeight: 800 }} />
                    )}
                  </Box>
                }
              />
              <Tab
                value="permissions"
                icon={<AccessTimeIcon sx={{ fontSize: 18 }} />}
                iconPosition="start"
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>Short Permissions (Late / Early, Max 2h)</span>
                    {myPermissions.length > 0 && (
                      <Chip label={myPermissions.length} size="small" sx={{ height: 18, fontSize: '10px', fontWeight: 800 }} />
                    )}
                  </Box>
                }
              />
            </Tabs>
          </Box>

          {/* SUB-VIEW A: MY ATTENDANCE REGULARIZATIONS */}
          {mySubTab === 'regularizations' && (
            <Box>
              {/* Regularization Metric Cards */}
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
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography sx={{ fontSize: '11.5px', color: '#1E40AF', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Total Regularizations
                        </Typography>
                        <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#1E3A8A', mt: 0.5 }}>
                          {myRegularizations.length}
                        </Typography>
                      </Box>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563EB' }}>
                        <EditCalendarIcon sx={{ fontSize: 22 }} />
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '11.5px', color: '#1D4ED8', mt: 1, fontWeight: 500 }}>
                      Missed punch and shift correction requests
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
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography sx={{ fontSize: '11.5px', color: '#065F46', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Approved Shifts
                        </Typography>
                        <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#065F46', mt: 0.5 }}>
                          {myRegularizations.filter((r) => r.status === 'Approved').length}
                        </Typography>
                      </Box>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                        <CheckCircleIcon sx={{ fontSize: 22 }} />
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '11.5px', color: '#047857', mt: 1, fontWeight: 500 }}>
                      Attendance auto-updated in master database
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
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography sx={{ fontSize: '11.5px', color: '#92400E', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          Pending Verification
                        </Typography>
                        <Typography sx={{ fontSize: '28px', fontWeight: 800, color: '#92400E', mt: 0.5 }}>
                          {myRegularizations.filter((r) => r.status === 'Pending').length}
                        </Typography>
                      </Box>
                      <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
                        <HourglassEmptyIcon sx={{ fontSize: 22 }} />
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: '11.5px', color: '#B45309', mt: 1, fontWeight: 500 }}>
                      Awaiting supervisor / HR authorization
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Table */}
              <Paper elevation={0} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
                <Box sx={{ p: 2, bgcolor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                      My Attendance Regularization History
                    </Typography>
                    <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                      All missed punch and day correction requests submitted by you
                    </Typography>
                  </Box>
                </Box>

                {loading ? (
                  <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
                    <CircularProgress size={30} />
                  </Box>
                ) : myRegularizations.length === 0 ? (
                  <Box sx={{ p: 5, textAlign: 'center' }}>
                    <EditCalendarIcon sx={{ fontSize: 40, color: '#CBD5E1', mb: 1 }} />
                    <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: '15px' }}>
                      No regularization requests found
                    </Typography>
                    <Typography sx={{ fontSize: '12.5px', color: '#64748B', mt: 0.5 }}>
                      Forgot to clock in or out? Click "Apply Regularization" above to submit a request.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Type</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Target Date</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Requested Punches</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Justification</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Reviewer Remarks</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {myRegularizations.map((row) => (
                          <TableRow key={row.id} hover>
                            <TableCell>
                              <RegularizationTypeBadge type={row.regularizationType} />
                            </TableCell>
                            <TableCell sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                              {row.date}
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                                In: {row.requestedClockInTime} — Out: {row.requestedClockOutTime}
                              </Typography>
                              <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                                Shift correction
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
                                  onClick={() => handleCancelRegularization(row.id)}
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

          {/* SUB-VIEW B: MY SHORT PERMISSIONS */}
          {mySubTab === 'permissions' && (
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

              {/* Table */}
              <Paper elevation={0} sx={{ borderRadius: '14px', border: '1px solid #E2E8F0', overflow: 'hidden' }}>
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
                      Need to arrive late or leave early? Click "Apply Short Permission" above.
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
        </Box>
      )}

      {/* ======================================================= */}
      {/* SECTION 2: APPROVALS REVIEW VIEW (FOR SUPERVISORS/HR/ADMIN) */}
      {/* ======================================================= */}
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
                Attendance & Regularization Approvals
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#64748B' }}>
                Review, regularize, and approve missing punch & short permission requests
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel sx={{ fontSize: '12.5px' }}>Category</InputLabel>
                <Select
                  value={categoryFilter}
                  label="Category"
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  sx={{ borderRadius: '8px', fontSize: '12.5px' }}
                >
                  <MenuItem value="all">All Request Types</MenuItem>
                  <MenuItem value="regularization">Missed Punches Only</MenuItem>
                  <MenuItem value="permission">Short Permissions Only</MenuItem>
                </Select>
              </FormControl>

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
          ) : combinedApprovals.length === 0 ? (
            <Box sx={{ p: 5, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: '#10B981', mb: 1 }} />
              <Typography sx={{ fontWeight: 700, color: '#334155', fontSize: '15px' }}>
                All caught up!
              </Typography>
              <Typography sx={{ fontSize: '12.5px', color: '#64748B', mt: 0.5 }}>
                No attendance or regularization requests matching the selected filter.
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Employee</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Category / Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Target Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Time / Punch Details</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Reason</TableCell>
                    <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {combinedApprovals.map((row) => {
                    const isRegularization = row.requestCategory === 'regularization';
                    return (
                      <TableRow key={`${row.requestCategory}_${row.id}`} hover>
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#0F172A' }}>
                            {row.employeeName}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                            {row.employeeId} · {row.department}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          {isRegularization ? (
                            <RegularizationTypeBadge type={row.regularizationType} />
                          ) : (
                            <PermissionTypeBadge type={row.permissionType} />
                          )}
                        </TableCell>

                        <TableCell sx={{ fontSize: '12.5px', fontWeight: 600, color: '#334155' }}>
                          {row.date}
                        </TableCell>

                        <TableCell>
                          {isRegularization ? (
                            <Box>
                              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                                In: {row.requestedClockInTime} — Out: {row.requestedClockOutTime}
                              </Typography>
                              <Typography sx={{ fontSize: '11px', color: '#0369A1', fontWeight: 600 }}>
                                Attendance Regularization
                              </Typography>
                            </Box>
                          ) : (
                            <Box>
                              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
                                {row.expectedTime}
                              </Typography>
                              <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                                {row.durationHours} hr ({Number(row.durationHours) * 60} mins)
                              </Typography>
                            </Box>
                          )}
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
                                onClick={() => handleOpenReview(row, row.requestCategory, 'approve')}
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
                                onClick={() => handleOpenReview(row, row.requestCategory, 'reject')}
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
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* ======================================================= */}
      {/* MODAL 1: Apply Short Permission Dialog                 */}
      {/* ======================================================= */}
      <ApplyPermissionDialog
        open={applyPermissionOpen}
        onClose={() => setApplyPermissionOpen(false)}
        onSuccess={() => {
          setSnackbar({ open: true, message: 'Permission request submitted successfully', severity: 'success' });
          refreshAll();
        }}
        remainingQuota={quota.remainingCount}
      />

      {/* ======================================================= */}
      {/* MODAL 2: Apply Attendance Regularization Dialog          */}
      {/* ======================================================= */}
      <ApplyRegularizationDialog
        open={applyRegularizationOpen}
        onClose={() => setApplyRegularizationOpen(false)}
        onSuccess={() => {
          setSnackbar({ open: true, message: 'Attendance regularization request submitted successfully', severity: 'success' });
          refreshAll();
        }}
      />

      {/* ======================================================= */}
      {/* MODAL 3: Review Comment & Confirm Dialog                */}
      {/* ======================================================= */}
      <Dialog
        open={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '14px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#0F172A' }}>
            {reviewAction === 'approve'
              ? (reviewCategory === 'regularization' ? 'Approve Attendance Regularization' : 'Approve Short Permission')
              : (reviewCategory === 'regularization' ? 'Reject Regularization' : 'Reject Short Permission')}
          </Typography>
          <IconButton size="small" onClick={() => setReviewModalOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 1.5 }}>
          {selectedItem && (
            <Box
              sx={{
                mb: 2,
                p: 2,
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                bgcolor: '#F8FAFC',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                <Typography sx={{ fontSize: '13.5px', fontWeight: 800, color: '#0F172A' }}>
                  {selectedItem.employeeName}
                </Typography>
                {reviewCategory === 'regularization' ? (
                  <RegularizationTypeBadge type={selectedItem.regularizationType} />
                ) : (
                  <PermissionTypeBadge type={selectedItem.permissionType} />
                )}
              </Box>
              <Typography sx={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>
                Date: {selectedItem.date}
                {reviewCategory === 'regularization'
                  ? ` · In: ${selectedItem.requestedClockInTime} — Out: ${selectedItem.requestedClockOutTime}`
                  : ` · Expected: ${selectedItem.expectedTime} (${selectedItem.durationHours}h)`}
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#334155', mt: 0.75, fontStyle: 'italic', bgcolor: 'rgba(255, 255, 255, 0.8)', p: 1, borderRadius: '6px' }}>
                "{selectedItem.reason}"
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
                ? 'e.g. Verified with department supervisor. Approved.'
                : 'e.g. Attendance punch not substantiated by biometric logs.'
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
