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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import axios from '../../api/axios';
import dayjs from 'dayjs';
import { FiSearch } from 'react-icons/fi';
import { durationLabel, formatLeaveDate, LEAVE_TYPE_META, statusColor, leaveIdentityParams } from '../../utils/leaveConfig';

const stageLabel = (stage) => {
  switch (stage) {
    case 'Supervisor': return 'Department Supervisor';
    case 'FinalApprover': return 'Final Approver';
    case 'Processor': return 'HR Processor';
    case 'Completed': return 'Completed';
    default: return stage || 'Department Supervisor';
  }
};

const getApproveButtonText = (stage) => {
  switch (stage) {
    case 'Supervisor': return 'Approve as Supervisor';
    case 'FinalApprover': return 'Approve as Final Approver';
    case 'Processor': return 'Complete & Process Leave';
    default: return 'Approve Request';
  }
};

const getJourneyStages = (leave) => {
  const isRejected = leave.status === 'Rejected';
  const isApproved = leave.status === 'Approved';
  const currentStage = leave.approval_stage || 'Supervisor';

  let s1Status = 'upcoming';
  let s2Status = 'upcoming';
  let s3Status = 'upcoming';

  if (isRejected) {
    if (currentStage === 'Supervisor') {
      s1Status = 'rejected';
      s2Status = 'skipped';
      s3Status = 'skipped';
    } else if (currentStage === 'FinalApprover') {
      s1Status = 'completed';
      s2Status = 'rejected';
      s3Status = 'skipped';
    } else {
      s1Status = 'completed';
      s2Status = 'completed';
      s3Status = 'rejected';
    }
  } else if (isApproved || currentStage === 'Completed') {
    s1Status = 'completed';
    s2Status = 'completed';
    s3Status = 'completed';
  } else {
    // Pending
    if (currentStage === 'Supervisor') {
      s1Status = 'active';
      s2Status = 'upcoming';
      s3Status = 'upcoming';
    } else if (currentStage === 'FinalApprover') {
      s1Status = 'completed';
      s2Status = 'active';
      s3Status = 'upcoming';
    } else if (currentStage === 'Processor') {
      s1Status = 'completed';
      s2Status = 'completed';
      s3Status = 'active';
    }
  }

  return [
    {
      index: 1,
      key: 'Supervisor',
      title: 'Dept Supervisor',
      roleSubtitle: leave.department ? `${leave.department} Supervisor` : 'Supervisor',
      status: s1Status,
      reviewer: leave.supervisor_name || (s1Status === 'completed' ? (leave.reviewer_name || 'Supervisor') : null),
      comment: leave.supervisor_comment || (s1Status === 'rejected' ? leave.review_comment : null),
      date: leave.supervisor_reviewed_at || (s1Status === 'completed' && !leave.final_approved_at ? leave.reviewed_at : null),
    },
    {
      index: 2,
      key: 'FinalApprover',
      title: 'Final Approver',
      roleSubtitle: 'Designated Reviewer',
      status: s2Status,
      reviewer: leave.final_approver_name || (s2Status === 'completed' ? leave.reviewer_name : null),
      comment: leave.final_approver_comment || (s2Status === 'rejected' ? leave.review_comment : null),
      date: leave.final_approved_at || (s2Status === 'completed' && !leave.processed_at ? leave.reviewed_at : null),
    },
    {
      index: 3,
      key: 'Processor',
      title: 'HR Processor',
      roleSubtitle: 'HR / Admin Final Action',
      status: s3Status,
      reviewer: leave.processor_name || (s3Status === 'completed' ? leave.reviewer_name : null),
      comment: s3Status === 'rejected' ? leave.review_comment : (isApproved && leave.review_comment ? leave.review_comment : null),
      date: leave.processed_at || (s3Status === 'completed' ? leave.reviewed_at : null),
    },
  ];
};

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
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [search, setSearch] = useState('');
  const [leaveType, setLeaveType] = useState('All');
  const [departmentFilter, setDepartmentFilter] = useState('All');
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
  const isAdmin = userRole === 'admin' || userRole === 'hr';
  const isSupervisor = !isAdmin && (departmentRole === 'supervisor' || userRole === 'manager');
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

  const allDepartments = useMemo(() => {
    const set = new Set();
    leaves.forEach((l) => {
      const d = (l.department || l.employee?.department || '').trim();
      if (d) set.add(d);
    });
    return Array.from(set).sort();
  }, [leaves]);

  const visibleLeaves = useMemo(() => {
    let list = leaves;
    if (tab === 'Today') {
      const today = dayjs().format('YYYY-MM-DD');
      list = list.filter(
        (leave) => leave.status === 'Approved' && leave.start_date <= today && leave.end_date >= today
      );
    }
    if (departmentFilter !== 'All') {
      list = list.filter((leave) => {
        const d = (leave.department || leave.employee?.department || '').trim().toLowerCase();
        return d === departmentFilter.toLowerCase();
      });
    }
    return list;
  }, [leaves, tab, departmentFilter]);

  const activeLeave = useMemo(() => {
    if (!visibleLeaves || visibleLeaves.length === 0) return null;
    const found = visibleLeaves.find((l) => l.id === selectedLeaveId);
    return found || visibleLeaves[0];
  }, [visibleLeaves, selectedLeaveId]);

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
                  label="Admin View · All Departments"
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
          {isAdmin && allDepartments.length > 0 && (
            <TextField
              select
              size="small"
              label="Department"
              value={departmentFilter}
              onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}
              sx={{ minWidth: 170 }}
            >
              <MenuItem value="All">All Departments</MenuItem>
              {allDepartments.map((dept) => (
                <MenuItem key={dept} value={dept}>{dept}</MenuItem>
              ))}
            </TextField>
          )}
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
            <Grid container spacing={2.5} alignItems="flex-start">
              {/* LEFT PANE: Request Stream List */}
              <Grid item xs={12} md={5} lg={4.5}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5, px: 0.5 }}>
                  <Typography sx={{ fontSize: '12px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Requests ({visibleLeaves.length})
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '11px', fontWeight: 600 }}>
                    Page {page + 1} of {Math.max(1, Math.ceil(visibleLeaves.length / rowsPerPage))}
                  </Typography>
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    maxHeight: { md: 'calc(100vh - 260px)' },
                    overflowY: { md: 'auto' },
                    pr: { md: 1 },
                  }}
                >
                  {visibleLeaves
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((leave) => {
                      const meta = LEAVE_TYPE_META[leave.leave_type] || { color: '#2563EB', bg: '#EFF6FF' };
                      const name = employeeName(leave);
                      const isSelected = activeLeave && activeLeave.id === leave.id;
                      const hasAction = canReview(leave);

                      return (
                        <Paper
                          key={leave.id}
                          onClick={() => setSelectedLeaveId(leave.id)}
                          elevation={0}
                          sx={{
                            p: 2,
                            borderRadius: '14px',
                            bgcolor: isSelected ? '#F8FAFF' : '#FFFFFF',
                            border: isSelected ? '2px solid #14286D' : '1px solid #E2E8F0',
                            boxShadow: isSelected ? '0 4px 14px rgba(20, 40, 109, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease-in-out',
                            position: 'relative',
                            '&:hover': {
                              borderColor: isSelected ? '#14286D' : '#CBD5E1',
                              bgcolor: isSelected ? '#F8FAFF' : '#FAFBFC',
                              transform: 'translateY(-1px)',
                            },
                          }}
                        >
                          {/* Top: Avatar, Name, Status */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, pr: 1 }}>
                              <Avatar
                                src={leave.employee?.photo || undefined}
                                sx={{
                                  width: 38,
                                  height: 38,
                                  bgcolor: '#14286D',
                                  fontWeight: 700,
                                  fontSize: 14,
                                  flexShrink: 0,
                                }}
                              >
                                {name.slice(0, 1)}
                              </Avatar>
                              <Box sx={{ minWidth: 0 }}>
                                <Typography noWrap sx={{ fontWeight: 700, fontSize: '14px', color: '#1B2A5B', lineHeight: 1.25 }}>
                                  {name}
                                </Typography>
                                <Typography noWrap variant="caption" sx={{ color: '#64748B', fontSize: '11px', display: 'block', mt: 0.2 }}>
                                  {leave.department || leave.employee?.department || 'KN Advisors'}
                                  {leave.employeeId ? ` · ID: ${leave.employeeId}` : ''}
                                </Typography>
                              </Box>
                            </Stack>

                            <Chip
                              size="small"
                              label={leave.status}
                              color={statusColor(leave.status)}
                              sx={{ fontWeight: 700, fontSize: '10.5px', height: 20, flexShrink: 0 }}
                            />
                          </Box>

                          {/* Middle: Leave Type & Duration */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: meta.color || '#2563EB', flexShrink: 0 }} />
                              <Typography sx={{ fontWeight: 600, fontSize: '12.5px', color: '#334155' }}>
                                {leave.leave_type}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              label={durationLabel(leave)}
                              sx={{
                                bgcolor: '#EEF2FF',
                                color: '#14286D',
                                fontWeight: 700,
                                fontSize: '11px',
                                height: 20,
                              }}
                            />
                          </Box>

                          {/* Dates Line */}
                          <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11.5px', display: 'block', mb: 1 }}>
                            📅 {formatLeaveDate(leave.start_date)} – {formatLeaveDate(leave.end_date)}
                          </Typography>

                          {/* Bottom Row: Stage pill & Action required */}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 0.75, borderTop: '1px dashed #F1F5F9' }}>
                            <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11px', fontWeight: 600 }}>
                              Stage: {stageLabel(leave.approval_stage)}
                            </Typography>

                            {hasAction && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Box
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: '#10B981',
                                    boxShadow: '0 0 0 2.5px rgba(16,185,129,0.25)',
                                  }}
                                />
                                <Typography sx={{ fontSize: '10.5px', fontWeight: 700, color: '#047857' }}>
                                  Action required
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      );
                    })}
                </Box>
              </Grid>

              {/* RIGHT PANE: Dedicated Inspector & Approval Station */}
              <Grid item xs={12} md={7} lg={7.5} sx={{ position: { md: 'sticky' }, top: 20 }}>
                {activeLeave ? (
                  (() => {
                    const activeMeta = LEAVE_TYPE_META[activeLeave.leave_type] || { color: '#2563EB', bg: '#EFF6FF' };
                    const activeName = employeeName(activeLeave);
                    const activeFromSession = activeLeave.half_day
                      ? (activeLeave.half_day_session === 'FirstHalf' || activeLeave.half_day_session === 'Morning' ? 'First Half' : 'Second Half')
                      : 'Full day';
                    const activeToSession = activeLeave.half_day
                      ? (activeLeave.half_day_session === 'FirstHalf' || activeLeave.half_day_session === 'Morning' ? 'First Half' : 'Second Half')
                      : 'Full day';
                    const activeDept = activeLeave.department || activeLeave.employee?.department || 'KN Advisors';
                    const activeDesig = activeLeave.employee?.designation;
                    const journey = getJourneyStages(activeLeave);

                    return (
                      <Paper
                        elevation={0}
                        sx={{
                          p: { xs: 2.25, sm: 3 },
                          borderRadius: '16px',
                          bgcolor: '#FFFFFF',
                          border: '1px solid #E2E8F0',
                          boxShadow: '0 4px 16px rgba(20, 40, 109, 0.05)',
                        }}
                      >
                        {/* Header: Employee Profile & Status */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar
                              src={activeLeave.employee?.photo || undefined}
                              sx={{
                                width: 50,
                                height: 50,
                                bgcolor: '#14286D',
                                fontWeight: 800,
                                fontSize: 18,
                                boxShadow: '0 3px 10px rgba(20,40,109,0.2)',
                              }}
                            >
                              {activeName.slice(0, 1)}
                            </Avatar>
                            <Box>
                              <Typography sx={{ fontWeight: 800, fontSize: '17px', color: '#14286D', lineHeight: 1.25 }}>
                                {activeName}
                              </Typography>
                              <Typography variant="body2" sx={{ color: '#64748B', fontSize: '12.5px', mt: 0.25 }}>
                                {activeDept}{activeDesig ? ` · ${activeDesig}` : ''}{activeLeave.employeeId ? ` · ID: ${activeLeave.employeeId}` : ''}
                              </Typography>
                              {activeLeave.employee?.email && (
                                <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '11.5px', display: 'block' }}>
                                  {activeLeave.employee.email}
                                </Typography>
                              )}
                            </Box>
                          </Stack>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={activeLeave.status}
                              color={statusColor(activeLeave.status)}
                              sx={{ fontWeight: 800, fontSize: '11px', height: 24 }}
                            />
                            {activeLeave.status === 'Pending' && activeLeave.approval_stage && (
                              <Chip
                                label={`Stage: ${stageLabel(activeLeave.approval_stage)}`}
                                sx={{
                                  bgcolor: '#FEF3C7',
                                  color: '#92400E',
                                  fontWeight: 700,
                                  fontSize: '11px',
                                  height: 24,
                                  border: '1px solid #FDE68A',
                                }}
                              />
                            )}
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2.25, borderColor: '#F1F5F9' }} />

                        {/* 4 Metrics Grid */}
                        <Grid container spacing={1.5} sx={{ mb: 2.25 }}>
                          <Grid item xs={6} sm={3}>
                            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '10.5px', textTransform: 'uppercase' }}>
                                Leave Type
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.35 }}>
                                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: activeMeta.color || '#2563EB' }} />
                                <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>
                                  {activeLeave.leave_type}
                                </Typography>
                              </Box>
                            </Box>
                          </Grid>

                          <Grid item xs={6} sm={3}>
                            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '10.5px', textTransform: 'uppercase' }}>
                                Duration
                              </Typography>
                              <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1E293B', mt: 0.35 }}>
                                {durationLabel(activeLeave)}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={6} sm={3}>
                            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '10.5px', textTransform: 'uppercase' }}>
                                From Date
                              </Typography>
                              <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#1E293B', mt: 0.35 }}>
                                {formatLeaveDate(activeLeave.start_date)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11px', display: 'block' }}>
                                {activeFromSession}
                              </Typography>
                            </Box>
                          </Grid>

                          <Grid item xs={6} sm={3}>
                            <Box sx={{ p: 1.5, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid #EEF2F6' }}>
                              <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 700, fontSize: '10.5px', textTransform: 'uppercase' }}>
                                To Date
                              </Typography>
                              <Typography sx={{ fontWeight: 700, fontSize: '12px', color: '#1E293B', mt: 0.35 }}>
                                {formatLeaveDate(activeLeave.end_date)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11px', display: 'block' }}>
                                {activeToSession}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Reason Box */}
                        <Box sx={{ p: 1.75, borderRadius: '10px', bgcolor: '#F8FAFC', border: '1px solid #EEF2F6', mb: 2.5 }}>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, display: 'block', mb: 0.25 }}>
                            Reason for Leave
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#334155', fontSize: '13px', lineHeight: 1.5 }}>
                            {activeLeave.reason || 'No specific reason provided.'}
                          </Typography>
                          {activeLeave.contact_number && (
                            <Typography variant="caption" sx={{ color: '#64748B', display: 'block', mt: 0.75 }}>
                              Contact during leave: <strong>{activeLeave.contact_number}</strong>
                            </Typography>
                          )}
                        </Box>

                        {/* Approval Journey Pipeline Section (Vertical Stepper) */}
                        <Box sx={{ mb: 2.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.75 }}>
                            <Typography sx={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                              Approval Journey Pipeline
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '11.5px', color: '#94A3B8', fontWeight: 500 }}>
                              3-Tier Verification & Audit
                            </Typography>
                          </Box>

                          {/* Vertical Stepper Nodes */}
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0, px: 0.5 }}>
                            {journey.map((stage, idx) => {
                              const isCompleted = stage.status === 'completed';
                              const isActive = stage.status === 'active';
                              const isStageRejected = stage.status === 'rejected';
                              const isLast = idx === journey.length - 1;

                              return (
                                <Box key={stage.key} sx={{ display: 'flex', alignItems: 'flex-start', position: 'relative' }}>
                                  {/* Left: Milestone Circle & Connector Line */}
                                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 2 }}>
                                    <Box
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        bgcolor: isCompleted ? '#10B981' : isActive ? '#14286D' : isStageRejected ? '#EF4444' : '#F1F5F9',
                                        color: isCompleted || isActive || isStageRejected ? '#FFFFFF' : '#94A3B8',
                                        border: !isCompleted && !isActive && !isStageRejected ? '1.5px solid #CBD5E1' : 'none',
                                        boxShadow: isActive ? '0 0 0 3px rgba(20, 40, 109, 0.15)' : 'none',
                                        zIndex: 2,
                                      }}
                                    >
                                      {isCompleted ? (
                                        <CheckCircleIcon sx={{ fontSize: 16 }} />
                                      ) : isStageRejected ? (
                                        <CancelIcon sx={{ fontSize: 16 }} />
                                      ) : (
                                        <Typography sx={{ fontSize: 11, fontWeight: 800 }}>{stage.index}</Typography>
                                      )}
                                    </Box>

                                    {!isLast && (
                                      <Box
                                        sx={{
                                          width: 2,
                                          height: 36,
                                          bgcolor: isCompleted ? '#10B981' : '#E2E8F0',
                                          my: 0.5,
                                        }}
                                      />
                                    )}
                                  </Box>

                                  {/* Right: Milestone Info */}
                                  <Box sx={{ flex: 1, pb: isLast ? 0 : 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#1E293B' }}>
                                        {stage.title}
                                      </Typography>
                                      {isCompleted && (
                                        <Chip size="small" label="Approved" sx={{ height: 18, fontSize: '9.5px', fontWeight: 700, bgcolor: '#DCFCE7', color: '#15803D' }} />
                                      )}
                                      {isActive && (
                                        <Chip size="small" label="In Review" sx={{ height: 18, fontSize: '9.5px', fontWeight: 700, bgcolor: '#EFF6FF', color: '#1D4ED8' }} />
                                      )}
                                      {isStageRejected && (
                                        <Chip size="small" label="Rejected" sx={{ height: 18, fontSize: '9.5px', fontWeight: 700, bgcolor: '#FEE2E2', color: '#B91C1C' }} />
                                      )}
                                    </Box>

                                    <Typography variant="caption" sx={{ color: '#64748B', fontSize: '11.5px', display: 'block', mt: 0.25 }}>
                                      {stage.reviewer ? `Reviewed by ${stage.reviewer}` : stage.roleSubtitle}
                                      {stage.date ? ` · ${dayjs(stage.date).format('DD MMM YYYY, hh:mm A')}` : ''}
                                    </Typography>

                                    {stage.comment && (
                                      <Box
                                        sx={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 0.5,
                                          mt: 0.5,
                                          px: 1,
                                          py: 0.35,
                                          bgcolor: isStageRejected ? '#FEE2E2' : '#F8FAFC',
                                          border: `1px solid ${isStageRejected ? '#FECACA' : '#E2E8F0'}`,
                                          borderRadius: '6px',
                                        }}
                                      >
                                        <ChatBubbleOutlineIcon sx={{ fontSize: 11, color: isStageRejected ? '#DC2626' : '#64748B' }} />
                                        <Typography sx={{ fontSize: '11px', color: isStageRejected ? '#991B1B' : '#475569', fontStyle: 'italic' }}>
                                          "{stage.comment}"
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              );
                            })}
                          </Box>
                        </Box>

                        <Divider sx={{ my: 2.25, borderColor: '#F1F5F9' }} />

                        {/* Decision & Action Bar */}
                        {canReview(activeLeave) ? (
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: '12px',
                              bgcolor: '#F8FAFF',
                              border: '1.5px solid #C7D2FE',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              flexWrap: 'wrap',
                              gap: 1.5,
                            }}
                          >
                            <Box>
                              <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#14286D' }}>
                                Action required: You are authorized to review this stage ({stageLabel(activeLeave.approval_stage)})
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#4338CA', fontSize: '11px' }}>
                                Applicant leave quota will be updated upon finalization.
                              </Typography>
                            </Box>

                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Button
                                variant="contained"
                                onClick={() => openReview(activeLeave, 'Approved')}
                                sx={{
                                  bgcolor: '#14286D',
                                  color: '#FFFFFF',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  textTransform: 'none',
                                  borderRadius: '8px',
                                  px: 3,
                                  py: 0.85,
                                  boxShadow: '0 2px 6px rgba(20, 40, 109, 0.25)',
                                  '&:hover': { bgcolor: '#0E1E4F' },
                                }}
                              >
                                {getApproveButtonText(activeLeave.approval_stage)}
                              </Button>
                              <Button
                                variant="text"
                                color="error"
                                onClick={() => openReview(activeLeave, 'Rejected')}
                                sx={{
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  textTransform: 'none',
                                  px: 2,
                                  py: 0.85,
                                  '&:hover': { bgcolor: '#FEE2E2' },
                                }}
                              >
                                Reject
                              </Button>
                            </Stack>
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: '10px',
                              bgcolor: activeLeave.status === 'Approved' ? '#F0FDF4' : activeLeave.status === 'Rejected' ? '#FEF2F2' : '#F8FAFC',
                              border: `1px solid ${activeLeave.status === 'Approved' ? '#BBF7D0' : activeLeave.status === 'Rejected' ? '#FECACA' : '#E2E8F0'}`,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            {activeLeave.status === 'Approved' ? (
                              <CheckCircleIcon sx={{ fontSize: 18, color: '#10B981' }} />
                            ) : activeLeave.status === 'Rejected' ? (
                              <CancelIcon sx={{ fontSize: 18, color: '#DC2626' }} />
                            ) : (
                              <ScheduleIcon sx={{ fontSize: 18, color: '#64748B' }} />
                            )}
                            <Typography variant="body2" sx={{ fontSize: '12.5px', color: '#334155' }}>
                              {activeLeave.status === 'Pending' ? (
                                <>Waiting for review by <strong>{stageLabel(activeLeave.approval_stage)}</strong></>
                              ) : activeLeave.status === 'Approved' ? (
                                <>Leave fully approved & processed {activeLeave.reviewer_name ? `by ${activeLeave.reviewer_name}` : ''}{activeLeave.reviewed_at ? ` on ${dayjs(activeLeave.reviewed_at).format('DD MMM YYYY, hh:mm A')}` : ''}</>
                              ) : (
                                <>Leave request rejected {activeLeave.reviewer_name ? `by ${activeLeave.reviewer_name}` : ''}{activeLeave.reviewed_at ? ` on ${dayjs(activeLeave.reviewed_at).format('DD MMM YYYY, hh:mm A')}` : ''}</>
                              )}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    );
                  })()
                ) : (
                  <Paper elevation={0} sx={{ p: 4, textAlign: 'center', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                    <Typography variant="body1" sx={{ color: '#64748B' }}>
                      Select a leave request on the left to inspect its details and approval journey.
                    </Typography>
                  </Paper>
                )}
              </Grid>
            </Grid>
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
