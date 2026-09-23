import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Chip, TablePagination, Grid, Card, CardContent, TextField, MenuItem,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
  Stack, Avatar, InputAdornment, Divider, IconButton, ToggleButtonGroup, ToggleButton,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import CloseIcon from '@mui/icons-material/Close';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import axios from '../../api/axios';
import dayjs from 'dayjs';
import { FiSearch } from 'react-icons/fi';
import { durationLabel, formatLeaveDate, LEAVE_TYPE_META, statusColor, leaveIdentityParams } from '../../utils/leaveConfig';

const employeeName = (leave) =>
  leave.employee_name ||
  `${leave.employee?.firstName || ''} ${leave.employee?.lastName || ''}`.trim() ||
  leave.employee?.email ||
  'Employee';

const LeaveApprovals = () => {
  const [leaves, setLeaves] = useState([]);
  const [counts, setCounts] = useState({ total: 0, approved: 0, pending: 0, rejected: 0, cancelled: 0, onLeaveToday: 0 });
  const [todayList, setTodayList] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const [tab, setTab] = useState('Pending');
  const [viewMode, setViewMode] = useState('cards');
  const [search, setSearch] = useState('');
  const [leaveType, setLeaveType] = useState('All');
  const [review, setReview] = useState(null);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [workflowSaving, setWorkflowSaving] = useState(false);
  const [workflowUsers, setWorkflowUsers] = useState([]);
  const [workflowForm, setWorkflowForm] = useState({ finalApproverId: '', processorId: '' });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [policies, setPolicies] = useState({ types: {} });
  const userRole = String(localStorage.getItem('userRole') || '').toLowerCase();
  const departmentRole = String(localStorage.getItem('departmentRole') || '').toLowerCase();
  const isSupervisor = departmentRole === 'supervisor' || userRole === 'manager';
  const isAdmin = userRole === 'admin' || userRole === 'hr' || userRole === 'manager';
  const currentUserId = Number(localStorage.getItem('userId')) || 0;

  const fetchLeaves = useCallback(async () => {
    const identity = leaveIdentityParams();
    try {
      const [listRes, countRes, todayRes, policyRes] = await Promise.allSettled([
        axios.get('/leaves/leave', {
          params: {
            ...identity,
            status: tab === 'All' || tab === 'Today' ? 'All' : tab,
            leaveType,
            search,
          },
        }),
        axios.get('/leaves/leave-counts', { params: identity }),
        axios.get('/leaves/approved-leaves-today', { params: identity }),
        axios.get('/leaves/policies'),
      ]);
      if (listRes.status === 'fulfilled') setLeaves(listRes.value.data || []);
      if (countRes.status === 'fulfilled') setCounts(countRes.value.data || {});
      if (todayRes.status === 'fulfilled') setTodayList(todayRes.value.data?.employees || []);
      if (policyRes.status === 'fulfilled') setPolicies(policyRes.value.data || { types: {} });
      const failed = [listRes, countRes, todayRes].find((result) => result.status === 'rejected');
      if (failed) console.error('Error fetching leave data:', failed.reason);
    } catch (error) {
      console.error('Error fetching leave data:', error);
    }
  }, [tab, leaveType, search]);

  useEffect(() => {
    const timer = setTimeout(fetchLeaves, 200);
    return () => clearTimeout(timer);
  }, [fetchLeaves]);

  const fetchWorkflowSettings = useCallback(async () => {
    try {
      const { data } = await axios.get('/leaves/approval-settings', { params: leaveIdentityParams() });
      if (Array.isArray(data.users)) {
        setWorkflowUsers(data.users);
      }
      if (data.finalApproverId || data.processorId) {
        setWorkflowForm({
          finalApproverId: data.finalApproverId ? String(data.finalApproverId) : '',
          processorId: data.processorId ? String(data.processorId) : '',
        });
      }
    } catch (error) {
      console.error('Error fetching leave workflow settings:', error);
    }
  }, []);

  useEffect(() => {
    fetchWorkflowSettings();
  }, [fetchWorkflowSettings]);

  useEffect(() => {
    if (settingsOpen) {
      fetchWorkflowSettings();
    }
  }, [settingsOpen, fetchWorkflowSettings]);

  const saveWorkflow = async () => {
    setWorkflowSaving(true);
    try {
      await axios.put('/leaves/approval-settings', workflowForm, { params: leaveIdentityParams() });
      setSnackbar({ open: true, message: 'Leave approval flow saved successfully', severity: 'success' });
      setSettingsOpen(false);
    } catch (error) {
      setSnackbar({ open: true, message: error.response?.data?.error || 'Could not save leave approval flow', severity: 'error' });
    } finally {
      setWorkflowSaving(false);
    }
  };

  const visibleLeaves = useMemo(() => {
    if (tab !== 'Today') return leaves;
    const today = dayjs().format('YYYY-MM-DD');
    return leaves.filter(
      (leave) => leave.status === 'Approved' && leave.start_date <= today && leave.end_date >= today
    );
  }, [leaves, tab]);

  const openReview = (leave, action) => {
    setReview({ leave, action });
    setComment('');
  };

  const canReview = (leave) => {
    if (leave.status !== 'Pending') return false;
    const currentEmpId = localStorage.getItem('userEmployeeId');
    if (currentEmpId && leave.employeeId === currentEmpId) return false;
    if (isAdmin || !leave.approval_stage) return true;
    if (leave.approval_stage === 'Supervisor') {
      const userDept = String(localStorage.getItem('userDepartment') || '').trim().toLowerCase();
      const leaveDept = String(leave.employee?.department || leave.department || '').trim().toLowerCase();
      return Number(leave.supervisor_id) === currentUserId || (isSupervisor && userDept && leaveDept === userDept);
    }
    if (leave.approval_stage === 'FinalApprover') return Number(leave.final_approver_id) === currentUserId;
    if (leave.approval_stage === 'Processor') return Number(leave.processor_id) === currentUserId;
    return false;
  };

  const submitReview = async () => {
    if (!review) return;
    if (review.action === 'Rejected' && comment.trim().length < 4) {
      setSnackbar({ open: true, message: 'Please add a short rejection reason', severity: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const identity = leaveIdentityParams();
      await axios.put('/leaves/update-status', {
        ...identity,
        leaveId: review.leave.id,
        status: review.action,
        comment,
      }, { params: identity });
      setSnackbar({
        open: true,
        message: `Leave ${review.action.toLowerCase()}`,
        severity: review.action === 'Approved' ? 'success' : 'info',
      });
      setReview(null);
      await fetchLeaves();
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Could not update leave status',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  const typeOptions = ['All', ...Object.keys(policies.types || {})];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ width: '100%' }}>
        <Box sx={{ mb: 2.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1B2A5B', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: 1 }}>
              Leave Approvals
              {isAdmin ? (
                <Chip
                  label="Admin View"
                  size="small"
                  sx={{ bgcolor: '#EEF2FF', color: '#14286D', border: '1px solid #DDE4FF', fontWeight: 700, fontSize: '11px' }}
                />
              ) : isSupervisor ? (
                <Chip
                  label={`${localStorage.getItem('userDepartment') || 'Department'} Supervisor View`}
                  size="small"
                  sx={{ bgcolor: '#EEF2FF', color: '#14286D', border: '1px solid #DDE4FF', fontWeight: 700, fontSize: '11px' }}
                />
              ) : null}
            </Typography>
            <Typography variant="body2" sx={{ color: '#66708C', fontSize: '13px', mt: 0.25 }}>
              Review overlapping dates, remaining quota impact, and record a decision with comments
            </Typography>
          </Box>

          {isAdmin && (
            <Button
              variant="outlined"
              startIcon={<SettingsIcon sx={{ fontSize: 18 }} />}
              onClick={() => setSettingsOpen(true)}
              sx={{
                borderRadius: '8px',
                borderColor: '#DDE4FF',
                color: '#14286D',
                bgcolor: '#ffffff',
                fontWeight: 700,
                fontSize: '13px',
                textTransform: 'none',
                height: 35,
                px: 1.8,
                boxShadow: '0 1px 3px rgba(20, 40, 109, 0.05)',
                '&:hover': { bgcolor: '#EEF2FF', borderColor: '#14286D' },
              }}
            >
              Approval Settings
            </Button>
          )}
        </Box>

        {/* Filter & View Mode Controls */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Search name, ID, department or reason"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            fullWidth
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <FiSearch size={16} />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            select
            size="small"
            label="Type"
            value={leaveType}
            onChange={(e) => { setLeaveType(e.target.value); setPage(0); }}
            sx={{ minWidth: 170 }}
          >
            {typeOptions.map((type) => (
              <MenuItem key={type} value={type}>{type}</MenuItem>
            ))}
          </TextField>

          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, next) => next && setViewMode(next)}
            size="small"
            sx={{
              bgcolor: '#FFFFFF',
              borderRadius: '8px',
              height: 40,
              border: '1px solid #DDE4FF',
              flexShrink: 0,
              '& .MuiToggleButton-root': {
                border: 'none',
                px: 1.75,
                fontWeight: 600,
                fontSize: '12px',
                textTransform: 'none',
                color: '#64748B',
                '&.Mui-selected': {
                  bgcolor: '#EEF2FF',
                  color: '#14286D',
                  fontWeight: 700,
                },
              },
            }}
          >
            <ToggleButton value="cards" aria-label="cards view">
              <ViewModuleIcon sx={{ fontSize: 18, mr: 0.75 }} />
              Cards
            </ToggleButton>
            <ToggleButton value="table" aria-label="table view">
              <ViewListIcon sx={{ fontSize: 18, mr: 0.75 }} />
              Table
            </ToggleButton>
          </ToggleButtonGroup>
        </Stack>

        {/* Status Navigation Tabs */}
        <Tabs
          value={tab}
          onChange={(_, value) => { setTab(value); setPage(0); }}
          sx={{
            mb: 2.5,
            borderBottom: '1px solid #E2E8F0',
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13.5px',
              minWidth: 100,
              color: '#64748B',
              '&.Mui-selected': {
                color: '#14286D',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: '#14286D',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          <Tab value="Pending" label={`Pending (${counts.pending || 0})`} />
          <Tab value="Approved" label={`Approved (${counts.approved || 0})`} />
          <Tab value="Rejected" label={`Rejected (${counts.rejected || 0})`} />
          <Tab value="Today" label={`On leave today (${counts.onLeaveToday || 0})`} />
          <Tab value="All" label={`All (${counts.total || 0})`} />
        </Tabs>

        {/* Content View: Cards View (Default) vs Table View */}
        {viewMode === 'cards' ? (
          visibleLeaves.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {visibleLeaves
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((leave) => {
                  const meta = LEAVE_TYPE_META[leave.leave_type] || { color: '#2563EB', bg: '#EFF6FF' };
                  const name = employeeName(leave);
                  const fromSession = leave.half_day
                    ? (leave.half_day_session === 'FirstHalf' || leave.half_day_session === 'Morning' ? 'First Half' : 'Second Half')
                    : 'Full day';
                  const toSession = leave.half_day
                    ? (leave.half_day_session === 'FirstHalf' || leave.half_day_session === 'Morning' ? 'First Half' : 'Second Half')
                    : 'Full day';
                  const dept = leave.department || leave.employee?.department || 'KN Advisors';
                  const desig = leave.employee?.designation;

                  return (
                    <Paper
                      key={leave.id}
                      elevation={0}
                      sx={{
                        p: { xs: 2.25, sm: 3 },
                        borderRadius: '16px',
                        bgcolor: '#FFFFFF',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 2px 8px rgba(20, 40, 109, 0.04)',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          boxShadow: '0 6px 20px rgba(20, 40, 109, 0.08)',
                          borderColor: '#CBD5E1',
                        },
                      }}
                    >
                      {/* Top Row: Employee Profile, Leave Type, Status Title */}
                      <Grid container spacing={2} alignItems="center">
                        {/* Employee Avatar & Identity */}
                        <Grid item xs={12} sm={5} md={4.5}>
                          <Stack direction="row" spacing={1.75} alignItems="center">
                            <Avatar
                              src={leave.employee?.photo || undefined}
                              sx={{
                                width: 46,
                                height: 46,
                                bgcolor: '#14286D',
                                fontWeight: 700,
                                fontSize: 16,
                                boxShadow: '0 2px 6px rgba(20,40,109,0.2)',
                              }}
                            >
                              {name.slice(0, 1)}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 800, fontSize: '15.5px', color: '#1B2A5B', lineHeight: 1.25 }}>
                                {name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.35, fontSize: '12px' }}>
                                {dept}{desig ? ` · ${desig}` : ''}
                                {leave.employeeId ? ` · ID: ${leave.employeeId}` : ''}
                              </Typography>
                            </Box>
                          </Stack>
                        </Grid>

                        {/* Leave Type with colored bullet indicator */}
                        <Grid item xs={6} sm={3.5} md={4}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Leave Type
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.35 }}>
                            <Box sx={{ width: 9, height: 9, borderRadius: '50%', bgcolor: meta.color || '#2563EB', flexShrink: 0 }} />
                            <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1E293B' }}>
                              {leave.leave_type}
                            </Typography>
                          </Box>
                        </Grid>

                        {/* Leave Request Title & Current Status Badge */}
                        <Grid item xs={6} sm={3.5} md={3.5} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
                          <Typography sx={{ fontWeight: 800, fontSize: '13.5px', color: '#1B2A5B', letterSpacing: '-0.2px' }}>
                            Leave Request
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: { xs: 'flex-start', sm: 'flex-end' }, gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip
                              size="small"
                              label={leave.status}
                              color={statusColor(leave.status)}
                              sx={{ fontWeight: 700, fontSize: '11px', height: 22 }}
                            />
                            {leave.status === 'Pending' && leave.approval_stage && (
                              <Chip
                                size="small"
                                label={`Stage: ${leave.approval_stage === 'FinalApprover' ? 'Final Approver' : leave.approval_stage}`}
                                sx={{
                                  bgcolor: '#FEF3C7',
                                  color: '#92400E',
                                  fontWeight: 700,
                                  fontSize: '10.5px',
                                  height: 22,
                                  border: '1px solid #FDE68A',
                                }}
                              />
                            )}
                          </Box>
                        </Grid>
                      </Grid>

                      <Divider sx={{ my: 2, borderColor: '#F1F5F9' }} />

                      {/* Middle Row: From / To / Duration */}
                      <Grid container spacing={2} sx={{ mb: leave.reason ? 1.75 : 2 }}>
                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            From
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#1E293B', mt: 0.25 }}>
                            {formatLeaveDate(leave.start_date)}{' '}
                            <Typography component="span" sx={{ color: '#64748B', fontWeight: 500, fontSize: '12px' }}>
                              / {fromSession}
                            </Typography>
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            To
                          </Typography>
                          <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#1E293B', mt: 0.25 }}>
                            {formatLeaveDate(leave.end_date)}{' '}
                            <Typography component="span" sx={{ color: '#64748B', fontWeight: 500, fontSize: '12px' }}>
                              / {toSession}
                            </Typography>
                          </Typography>
                        </Grid>

                        <Grid item xs={12} sm={4}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            Duration
                          </Typography>
                          <Box sx={{ mt: 0.25 }}>
                            <Chip
                              size="small"
                              label={durationLabel(leave)}
                              sx={{
                                bgcolor: '#EEF2FF',
                                color: '#14286D',
                                fontWeight: 700,
                                fontSize: '11.5px',
                                border: '1px solid #DDE4FF',
                              }}
                            />
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Reason & Contact Box */}
                      {leave.reason && (
                        <Box sx={{ bgcolor: '#F8FAFC', p: 1.75, borderRadius: '8px', border: '1px solid #EEF2F6', mb: 2 }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.25 }}>
                            Reason:
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#334155', fontSize: '13px', lineHeight: 1.5 }}>
                            {leave.reason}
                          </Typography>
                          {leave.contact_number && (
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.75 }}>
                              Contact while on leave: <strong>{leave.contact_number}</strong>
                            </Typography>
                          )}
                        </Box>
                      )}

                      {/* Bottom Action Section: Authorization & Action Buttons */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, pt: 0.5 }}>
                        <Box>
                          {leave.status === 'Pending' ? (
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {canReview(leave) ? (
                                <span style={{ color: '#059669', fontWeight: 600 }}>Action required: You are authorized to review this request</span>
                              ) : (
                                `Waiting for review by ${leave.approval_stage === 'FinalApprover' ? 'final approver' : (leave.approval_stage || 'reviewer')}`
                              )}
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: '#64748B' }}>
                              Decision recorded by <strong>{leave.reviewer_name || 'Approver'}</strong>
                              {leave.reviewed_at ? ` on ${dayjs(leave.reviewed_at).format('DD MMM YYYY, hh:mm A')}` : ''}
                              {leave.review_comment ? ` — "${leave.review_comment}"` : ''}
                            </Typography>
                          )}
                        </Box>

                        {canReview(leave) && (
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Button
                              variant="contained"
                              onClick={() => openReview(leave, 'Approved')}
                              sx={{
                                bgcolor: '#14286D',
                                color: '#FFFFFF',
                                fontWeight: 700,
                                fontSize: '13px',
                                textTransform: 'none',
                                borderRadius: '8px',
                                px: 3.5,
                                py: 0.8,
                                boxShadow: '0 2px 6px rgba(20, 40, 109, 0.25)',
                                '&:hover': {
                                  bgcolor: '#0E1E4F',
                                },
                              }}
                            >
                              {leave.approval_stage === 'Processor' ? 'Process Leave' : 'Approve'}
                            </Button>
                            <Button
                              variant="text"
                              color="error"
                              onClick={() => openReview(leave, 'Rejected')}
                              sx={{
                                fontWeight: 700,
                                fontSize: '13px',
                                textTransform: 'none',
                                px: 2.5,
                                py: 0.8,
                                '&:hover': {
                                  bgcolor: '#FEE2E2',
                                },
                              }}
                            >
                              Reject
                            </Button>
                          </Stack>
                        )}
                      </Box>
                    </Paper>
                  );
                })}
            </Box>
          ) : (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: 'center',
                borderRadius: '16px',
                border: '1px dashed #CBD5E1',
                bgcolor: '#FFFFFF',
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1B2A5B', mb: 0.5 }}>
                No leave records in this view
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tab === 'Pending'
                  ? 'There are currently no pending leave requests awaiting approval.'
                  : `No ${tab.toLowerCase()} leave applications match your search criteria.`}
              </Typography>
            </Paper>
          )
        ) : (
          /* Table View */
          <TableContainer component={Paper} sx={{ maxHeight: 560, borderRadius: 3 }}>
            <Table stickyHeader sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
              <TableHead>
                <TableRow>
                  <TableCell align="left" sx={{ py: 1.5 }}>Employee</TableCell>
                  <TableCell align="center" sx={{ py: 1.5, width: 140 }}>Type</TableCell>
                  <TableCell align="left" sx={{ py: 1.5, width: 190 }}>Dates</TableCell>
                  <TableCell align="center" sx={{ py: 1.5, width: 110 }}>Duration</TableCell>
                  <TableCell align="left" sx={{ py: 1.5 }}>Reason</TableCell>
                  <TableCell align="center" sx={{ py: 1.5, width: 170 }}>Status</TableCell>
                  <TableCell align="right" sx={{ py: 1.5, width: 180 }}>Decision</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {visibleLeaves.length > 0 ? (
                  visibleLeaves
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((leave) => {
                      const meta = LEAVE_TYPE_META[leave.leave_type] || {};
                      const name = employeeName(leave);
                      return (
                        <TableRow key={leave.id} hover>
                          <TableCell align="left">
                            <Stack direction="row" spacing={1.25} alignItems="center">
                              <Avatar src={leave.employee?.photo || undefined} sx={{ width: 34, height: 34, bgcolor: '#14286D', fontWeight: 700, fontSize: 13 }}>
                                {name.slice(0, 1)}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '13.5px', color: '#1B2A5B' }}>{name}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '11px' }}>
                                  {leave.department || leave.employee?.department || leave.employee?.designation || ''}
                                </Typography>
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell align="center">
                            <Chip size="small" label={leave.leave_type} sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '11px' }} />
                          </TableCell>
                          <TableCell align="left" sx={{ fontSize: '13px', fontWeight: 500, color: '#1B2A5B' }}>
                            {formatLeaveDate(leave.start_date)} – {formatLeaveDate(leave.end_date)}
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '13px', color: '#1B2A5B' }}>
                              {durationLabel(leave)}
                            </Typography>
                          </TableCell>
                          <TableCell align="left" sx={{ maxWidth: 220 }}>
                            <Typography variant="body2" noWrap title={leave.reason} sx={{ fontSize: '13px', color: 'text.secondary' }}>
                              {leave.reason || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                              <Chip size="small" label={leave.status} color={statusColor(leave.status)} sx={{ fontWeight: 700, fontSize: '11px' }} />
                              {leave.status === 'Pending' && leave.approval_stage && (
                                <Typography display="block" variant="caption" color="text.secondary" sx={{ mt: 0.5, fontSize: '10.5px' }}>
                                  Waiting for {leave.approval_stage === 'FinalApprover' ? 'final approver' : leave.approval_stage.toLowerCase()}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell align="right">
                            {canReview(leave) ? (
                              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center">
                                <Button size="small" variant="contained" color="success" onClick={() => openReview(leave, 'Approved')} sx={{ fontWeight: 700, px: 1.5, py: 0.4 }}>
                                  {leave.approval_stage === 'Processor' ? 'Process' : 'Approve'}
                                </Button>
                                <Button size="small" variant="outlined" color="error" onClick={() => openReview(leave, 'Rejected')} sx={{ fontWeight: 700, px: 1.5, py: 0.4 }}>
                                  Reject
                                </Button>
                              </Stack>
                            ) : (
                              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                                {leave.status === 'Pending' ? 'Waiting for assigned reviewer' : (leave.reviewer_name || '—')}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      No leave records in this view
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component="div"
          count={visibleLeaves.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(+event.target.value);
            setPage(0);
          }}
          rowsPerPageOptions={[6, 10, 20]}
        />
      </Box>

      <Dialog open={!!review} onClose={() => setReview(null)} fullWidth maxWidth="sm">
        <DialogTitle>
          {review?.action === 'Approved' ? 'Approve leave' : 'Reject leave'}
        </DialogTitle>
        <DialogContent>
          {review?.leave && (
            <Stack spacing={1} sx={{ mb: 2, mt: 0.5 }}>
              <Typography variant="body2">
                <strong>{employeeName(review.leave)}</strong> · {review.leave.leave_type}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {formatLeaveDate(review.leave.start_date)} – {formatLeaveDate(review.leave.end_date)} · {durationLabel(review.leave)}
              </Typography>
              <Typography variant="body2">{review.leave.reason}</Typography>
            </Stack>
          )}
          <TextField
            label={review?.action === 'Rejected' ? 'Rejection reason (required)' : 'Comment (optional)'}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            fullWidth
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReview(null)}>Back</Button>
          <Button
            variant="contained"
            color={review?.action === 'Rejected' ? 'error' : 'success'}
            onClick={submitReview}
            disabled={saving}
          >
            {saving ? 'Saving…' : `Confirm ${review?.action?.toLowerCase() || ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Leave Approval Flow Settings Dialog (Admin / HR) */}
      <Dialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: '12px', p: 1 }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
            <Box sx={{ p: 0.8, borderRadius: '8px', bgcolor: '#EEF2FF', color: '#14286D', display: 'flex' }}>
              <SettingsIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1B2A5B', fontSize: '16px' }}>
                Leave Approval Flow Settings
              </Typography>
              <Typography variant="caption" sx={{ color: '#66708C', display: 'block' }}>
                Multi-step hierarchy for employee leave requests
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setSettingsOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2.5 }}>
          <Stack spacing={2.5}>
            {/* Visual Workflow Steps */}
            <Paper variant="outlined" sx={{ p: 1.75, borderRadius: '8px', bgcolor: '#F8FAFD', borderColor: '#EDF0F7' }}>
              <Typography variant="caption" sx={{ color: '#66708C', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.4px', display: 'block', mb: 1 }}>
                Sequential Approval Pipeline
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label="1. Department Supervisor"
                  size="small"
                  sx={{ bgcolor: '#EEF2FF', color: '#14286D', border: '1px solid #DDE4FF', fontWeight: 700, fontSize: '11.5px' }}
                />
                <Typography sx={{ color: '#94A3B8', fontWeight: 800, fontSize: '14px' }}>→</Typography>
                <Chip
                  label="2. Final Approver"
                  size="small"
                  sx={{ bgcolor: '#EEF2FF', color: '#14286D', border: '1px solid #DDE4FF', fontWeight: 700, fontSize: '11.5px' }}
                />
                <Typography sx={{ color: '#94A3B8', fontWeight: 800, fontSize: '14px' }}>→</Typography>
                <Chip
                  label="3. Processor (HR)"
                  size="small"
                  sx={{ bgcolor: '#EEF2FF', color: '#14286D', border: '1px solid #DDE4FF', fontWeight: 700, fontSize: '11.5px' }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: '#66708C', display: 'block', mt: 1, lineHeight: 1.4 }}>
                Department supervisors review first automatically based on employee department. Configure the designated Final Approver and Processor below.
              </Typography>
            </Paper>

            {/* Form Fields */}
            <Stack spacing={2}>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1B2A5B', mb: 0.75 }}>
                  Final Approver
                </Typography>
                <TextField
                  select
                  size="small"
                  value={workflowForm.finalApproverId}
                  onChange={(event) => setWorkflowForm((prev) => ({ ...prev, finalApproverId: event.target.value }))}
                  fullWidth
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) => {
                      if (!selected) {
                        return <span style={{ color: '#94a3b8' }}>Select final approver</span>;
                      }
                      const user = workflowUsers.find((u) => String(u.id) === String(selected));
                      return user
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() + ` · ${user.employeeId}`
                        : selected;
                    },
                  }}
                  sx={{
                    bgcolor: '#ffffff',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#14286D' },
                  }}
                >
                  <MenuItem value="" disabled>Select employee / manager</MenuItem>
                  {workflowUsers.length === 0 ? (
                    <MenuItem value="" disabled>Loading users...</MenuItem>
                  ) : (
                    workflowUsers.map((user) => (
                      <MenuItem key={user.id} value={String(user.id)}>
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim()} · {user.employeeId} ({user.department || user.role || 'Member'})
                      </MenuItem>
                    ))
                  )}
                </TextField>
                <Typography variant="caption" sx={{ color: '#66708C', mt: 0.5, display: 'block' }}>
                  Responsible for reviewing after supervisor approval.
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#1B2A5B', mb: 0.75 }}>
                  Processor (HR / Admin)
                </Typography>
                <TextField
                  select
                  size="small"
                  value={workflowForm.processorId}
                  onChange={(event) => setWorkflowForm((prev) => ({ ...prev, processorId: event.target.value }))}
                  fullWidth
                  SelectProps={{
                    displayEmpty: true,
                    renderValue: (selected) => {
                      if (!selected) {
                        return <span style={{ color: '#94a3b8' }}>Select processor</span>;
                      }
                      const user = workflowUsers.find((u) => String(u.id) === String(selected));
                      return user
                        ? `${user.firstName || ''} ${user.lastName || ''}`.trim() + ` · ${user.employeeId}`
                        : selected;
                    },
                  }}
                  sx={{
                    bgcolor: '#ffffff',
                    borderRadius: '8px',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#E2E8F0' },
                    '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#14286D' },
                  }}
                >
                  <MenuItem value="" disabled>Select employee / HR</MenuItem>
                  {workflowUsers.length === 0 ? (
                    <MenuItem value="" disabled>Loading users...</MenuItem>
                  ) : (
                    workflowUsers.map((user) => (
                      <MenuItem key={user.id} value={String(user.id)}>
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim()} · {user.employeeId} ({user.department || user.role || 'Member'})
                      </MenuItem>
                    ))
                  )}
                </TextField>
                <Typography variant="caption" sx={{ color: '#66708C', mt: 0.5, display: 'block' }}>
                  Responsible for final processing, records, and payroll deduction checks.
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button
            onClick={() => setSettingsOpen(false)}
            sx={{ textTransform: 'none', fontWeight: 600, color: '#66708C' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveWorkflow}
            disabled={workflowSaving || !workflowForm.finalApproverId || !workflowForm.processorId}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#14286D',
              borderRadius: '8px',
              px: 2.5,
              boxShadow: '0 2px 6px rgba(20, 40, 109, 0.25)',
              '&:hover': { bgcolor: '#0F1F58' },
            }}
          >
            {workflowSaving ? 'Saving…' : 'Save Flow'}
          </Button>
        </DialogActions>
      </Dialog>

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

export default LeaveApprovals;
