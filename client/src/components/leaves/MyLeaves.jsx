import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from '../../api/axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, CircularProgress, Box,
  TablePagination, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Snackbar, Alert, Grid, IconButton,
  Tooltip, InputAdornment, MenuItem, Select,
  ToggleButtonGroup, ToggleButton
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import DateRangeIcon from '@mui/icons-material/DateRange';
import RefreshIcon from '@mui/icons-material/Refresh';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ApplyLeaveDialog from './ApplyLeaveDialog';

import {
  formatLeaveDate,
  durationLabel,
  LEAVE_TYPE_META,
  leaveIdentityParams
} from '../../utils/leaveConfig';

const MyLeaves = ({ onOpenApplyLeave }) => {
  const [leaves, setLeaves] = useState([]);
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);
  const [tab, setTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'cards'
  
  // Dialogs
  const [applyDialogOpen, setApplyDialogOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [detailsTarget, setDetailsTarget] = useState(null);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const params = leaveIdentityParams();
      const [leavesRes, balanceRes] = await Promise.allSettled([
        axios.get('/leaves', { params }),
        axios.get('/leaves/balance', { params })
      ]);

      if (leavesRes.status === 'fulfilled') {
        setLeaves(leavesRes.value.data || []);
      }
      if (balanceRes.status === 'fulfilled' && balanceRes.value.data) {
        setBalance(balanceRes.value.data);
      }
    } catch (error) {
      console.error('Error fetching my leaves data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Status counts
  const counts = useMemo(() => ({
    All: leaves.length,
    Pending: leaves.filter((row) => row.status === 'Pending').length,
    Approved: leaves.filter((row) => row.status === 'Approved').length,
    Rejected: leaves.filter((row) => row.status === 'Rejected').length,
    Cancelled: leaves.filter((row) => row.status === 'Cancelled').length,
  }), [leaves]);

  // Filtered leaves
  const filteredLeaves = useMemo(() => {
    return leaves.filter((item) => {
      // Status filter
      if (tab !== 'All' && item.status !== tab) return false;

      // Type filter
      if (selectedType !== 'All' && item.leave_type !== selectedType) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesReason = item.reason && item.reason.toLowerCase().includes(q);
        const matchesType = item.leave_type && item.leave_type.toLowerCase().includes(q);
        const matchesReviewer = item.reviewer_name && item.reviewer_name.toLowerCase().includes(q);
        const matchesComment = item.review_comment && item.review_comment.toLowerCase().includes(q);
        const matchesStart = item.start_date && item.start_date.includes(q);
        const matchesEnd = item.end_date && item.end_date.includes(q);
        if (!matchesReason && !matchesType && !matchesReviewer && !matchesComment && !matchesStart && !matchesEnd) {
          return false;
        }
      }

      return true;
    });
  }, [leaves, tab, selectedType, searchQuery]);

  const today = new Date().toISOString().slice(0, 10);

  const canCancel = (leave) => {
    if (!leave) return false;
    if (leave.status === 'Pending') return true;
    if (leave.status === 'Approved' && leave.start_date > today) return true;
    return false;
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setSaving(true);
    try {
      await axios.put(`/leaves/cancel/${cancelTarget.id}`, { comment: cancelReason });
      setSnackbar({ open: true, message: 'Leave request successfully cancelled', severity: 'success' });
      setCancelTarget(null);
      setCancelReason('');
      if (detailsTarget?.id === cancelTarget.id) {
        setDetailsTarget(null);
      }
      await fetchData(true);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || 'Could not cancel this request',
        severity: 'error',
      });
    } finally {
      setSaving(false);
    }
  };

  // Balance values
  const totalAllocated = balance?.allocated ?? 12;
  const totalUsed = balance?.used ?? counts.Approved;
  const totalPending = balance?.pending ?? counts.Pending;
  const totalAvailable = balance?.available ?? Math.max(0, totalAllocated - totalUsed - totalPending);
  const usedPercent = Math.min(100, Math.round(((totalUsed + totalPending) / totalAllocated) * 100));

  // Available leave types for filter
  const leaveTypesList = useMemo(() => {
    const set = new Set(leaves.map((l) => l.leave_type).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [leaves]);

  const getStatusBadge = (status, stage) => {
    switch (status) {
      case 'Approved':
        return (
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#16A34A !important' }} />}
            label="Approved"
            size="small"
            sx={{
              height: 24,
              bgcolor: '#DCFCE7',
              color: '#15803D',
              fontWeight: 700,
              fontSize: '11px',
              border: '1px solid #BBF7D0',
            }}
          />
        );
      case 'Pending':
        return (
          <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 0.25 }}>
            <Chip
              icon={<ScheduleIcon sx={{ fontSize: '14px !important', color: '#D97706 !important' }} />}
              label="Pending"
              size="small"
              sx={{
                height: 24,
                bgcolor: '#FEF3C7',
                color: '#B45309',
                fontWeight: 700,
                fontSize: '11px',
                border: '1px solid #FDE68A',
              }}
            />
            {stage && (
              <Typography sx={{ fontSize: '10px', color: '#B45309', fontWeight: 600, pl: 0.25 }}>
                {stage === 'FinalApprover' ? 'Final Approver' : stage}
              </Typography>
            )}
          </Box>
        );
      case 'Rejected':
        return (
          <Chip
            icon={<CancelIcon sx={{ fontSize: '14px !important', color: '#DC2626 !important' }} />}
            label="Rejected"
            size="small"
            sx={{
              height: 24,
              bgcolor: '#FEE2E2',
              color: '#B91C1C',
              fontWeight: 700,
              fontSize: '11px',
              border: '1px solid #FECACA',
            }}
          />
        );
      case 'Cancelled':
        return (
          <Chip
            icon={<EventBusyIcon sx={{ fontSize: '14px !important', color: '#64748B !important' }} />}
            label="Cancelled"
            size="small"
            sx={{
              height: 24,
              bgcolor: '#F1F5F9',
              color: '#475569',
              fontWeight: 700,
              fontSize: '11px',
              border: '1px solid #E2E8F0',
            }}
          />
        );
      default:
        return (
          <Chip
            label={status}
            size="small"
            sx={{ height: 24, bgcolor: '#F1F5F9', color: '#475569', fontWeight: 600, fontSize: '11px' }}
          />
        );
    }
  };

  return (
    <Box sx={{ width: '100%', pb: 2 }}>
      {/* 1. Header Bar: Clean single-line header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 1.5,
          mb: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 800, color: '#14286D', fontSize: '18px', letterSpacing: '-0.3px' }}>
            My Leave Overview
          </Typography>
          {balance?.period && (
            <Chip
              label={balance.period}
              size="small"
              sx={{
                height: 22,
                bgcolor: '#EFF6FF',
                color: '#1D4ED8',
                fontWeight: 700,
                fontSize: '11px',
                border: '1px solid #DBEAFE',
              }}
            />
          )}
          <Typography sx={{ color: '#64748B', fontSize: '12.5px', display: { xs: 'none', md: 'inline' } }}>
            • Annual quota, approvals and history
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Refresh records" arrow>
            <IconButton
              size="small"
              onClick={() => fetchData(true)}
              disabled={refreshing}
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                color: '#64748B',
                '&:hover': { bgcolor: '#F1F5F9', color: '#14286D' },
              }}
            >
              <RefreshIcon sx={{ fontSize: 16, animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
            onClick={() => setApplyDialogOpen(true)}
            sx={{
              height: 32,
              bgcolor: '#14286D',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '12px',
              textTransform: 'none',
              borderRadius: '6px',
              px: 1.75,
              boxShadow: '0 1px 4px rgba(20, 40, 109, 0.2)',
              '&:hover': { bgcolor: '#0D1B4A' },
            }}
          >
            Apply for Leave
          </Button>
        </Box>
      </Box>

      {/* 2. Executive 4 KPI Cards: Exact same dimensions, height (106px), and alignment */}
      <Grid container spacing={1.75} sx={{ mb: 2 }}>
        {/* Card 1: Available Days */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: '10px',
              border: '1px solid #BBF7D0',
              background: 'linear-gradient(145deg, #F0FDF4 0%, #DCFCE7 100%)',
              boxShadow: '0 1px 2px rgba(22, 163, 74, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 106,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Available Balance
              </Typography>
              <Box sx={{ width: 26, height: 26, borderRadius: '6px', bgcolor: 'rgba(22, 163, 74, 0.15)', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircleOutlineIcon sx={{ fontSize: 15 }} />
              </Box>
            </Box>
            <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#14532D', lineHeight: 1 }}>
              {totalAvailable} <span style={{ fontSize: '13px', fontWeight: 600, color: '#166534' }}>{totalAvailable === 1 ? 'Day' : 'Days'}</span>
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#15803D', fontWeight: 500 }}>
              Remaining from {totalAllocated} annual days
            </Typography>
          </Paper>
        </Grid>

        {/* Card 2: Used / Approved */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: '10px',
              border: '1px solid #BFDBFE',
              background: 'linear-gradient(145deg, #EFF6FF 0%, #DBEAFE 100%)',
              boxShadow: '0 1px 2px rgba(37, 99, 235, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 106,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#1D4ED8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Approved Taken
              </Typography>
              <Box sx={{ width: 26, height: 26, borderRadius: '6px', bgcolor: 'rgba(37, 99, 235, 0.15)', color: '#1D4ED8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DoneAllIcon sx={{ fontSize: 15 }} />
              </Box>
            </Box>
            <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#1E3A8A', lineHeight: 1 }}>
              {totalUsed} <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E40AF' }}>{totalUsed === 1 ? 'Day' : 'Days'}</span>
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#2563EB', fontWeight: 500 }}>
              {counts.Approved} approved application{counts.Approved === 1 ? '' : 's'}
            </Typography>
          </Paper>
        </Grid>

        {/* Card 3: In Review / Pending */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: '10px',
              border: '1px solid #FDE68A',
              background: 'linear-gradient(145deg, #FFFBEB 0%, #FEF3C7 100%)',
              boxShadow: '0 1px 2px rgba(217, 119, 6, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 106,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Pending Review
              </Typography>
              <Box sx={{ width: 26, height: 26, borderRadius: '6px', bgcolor: 'rgba(217, 119, 6, 0.15)', color: '#B45309', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HourglassEmptyIcon sx={{ fontSize: 15 }} />
              </Box>
            </Box>
            <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#78350F', lineHeight: 1 }}>
              {totalPending} <span style={{ fontSize: '13px', fontWeight: 600, color: '#92400E' }}>{totalPending === 1 ? 'Day' : 'Days'}</span>
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#B45309', fontWeight: 500 }}>
              {counts.Pending} request{counts.Pending === 1 ? '' : 's'} in review
            </Typography>
          </Paper>
        </Grid>

        {/* Card 4: Total Annual Quota */}
        <Grid item xs={12} sm={6} md={3}>
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: '10px',
              border: '1px solid #E2E8F0',
              background: 'linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)',
              boxShadow: '0 1px 2px rgba(20, 40, 109, 0.02)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: 106,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography sx={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Annual Quota
              </Typography>
              <Box sx={{ width: 26, height: 26, borderRadius: '6px', bgcolor: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EventAvailableIcon sx={{ fontSize: 15 }} />
              </Box>
            </Box>
            <Typography sx={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
              {totalAllocated} <span style={{ fontSize: '13px', fontWeight: 600, color: '#64748B' }}>Days</span>
            </Typography>
            <Typography sx={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>
              {usedPercent}% used ({totalUsed + totalPending} of {totalAllocated} days)
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* 3. Unified Table Card (Toolbar + Table + Pagination in ONE Container) */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          bgcolor: '#FFFFFF',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(20, 40, 109, 0.02)',
        }}
      >
        {/* Card Header Toolbar: Status pills + Search + Type Select + Toggle */}
        <Box
          sx={{
            p: 1.5,
            px: 2,
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 1.5,
            bgcolor: '#FFFFFF',
          }}
        >
          {/* Left: Status Filter Pills */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            {['All', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((statusKey) => {
              const isSelected = tab === statusKey;
              return (
                <Button
                  key={statusKey}
                  size="small"
                  onClick={() => { setTab(statusKey); setPage(0); }}
                  sx={{
                    height: 32,
                    borderRadius: '16px',
                    px: 1.35,
                    textTransform: 'none',
                    fontSize: '12px',
                    fontWeight: isSelected ? 750 : 600,
                    bgcolor: isSelected ? '#14286D' : '#F8FAFC',
                    color: isSelected ? '#FFFFFF' : '#64748B',
                    border: '1px solid',
                    borderColor: isSelected ? '#14286D' : '#E2E8F0',
                    '&:hover': {
                      bgcolor: isSelected ? '#0D1B4A' : '#F1F5F9',
                      borderColor: isSelected ? '#0D1B4A' : '#CBD5E1',
                    },
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.6,
                  }}
                >
                  <span>{statusKey}</span>
                  <Box
                    component="span"
                    sx={{
                      px: 0.6,
                      py: 0.05,
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontWeight: 800,
                      bgcolor: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#E2E8F0',
                      color: isSelected ? '#FFFFFF' : '#475569',
                    }}
                  >
                    {counts[statusKey] || 0}
                  </Box>
                </Button>
              );
            })}
          </Box>

          {/* Right: Search + Leave Type Select + View Toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search reason, type..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start" sx={{ mr: 0.5 }}>
                    <SearchIcon sx={{ color: '#94A3B8', fontSize: 16 }} />
                  </InputAdornment>
                ),
                sx: {
                  height: 32,
                  borderRadius: '6px',
                  fontSize: '12px',
                  bgcolor: '#F8FAFC',
                  width: { xs: '100%', sm: 190 },
                  '& fieldset': { borderColor: '#E2E8F0' },
                },
              }}
            />

            <Select
              size="small"
              value={selectedType}
              onChange={(e) => { setSelectedType(e.target.value); setPage(0); }}
              displayEmpty
              renderValue={(val) => (val === 'All' ? 'All Types' : val)}
              sx={{
                height: 32,
                minWidth: 120,
                borderRadius: '6px',
                fontSize: '12px',
                bgcolor: '#F8FAFC',
                '& fieldset': { borderColor: '#E2E8F0' },
              }}
            >
              {leaveTypesList.map((type) => (
                <MenuItem key={type} value={type} sx={{ fontSize: '12.5px' }}>
                  {type === 'All' ? 'All Types' : type}
                </MenuItem>
              ))}
            </Select>

            <ToggleButtonGroup
              size="small"
              value={viewMode}
              exclusive
              onChange={(_, val) => val && setViewMode(val)}
              sx={{
                height: 32,
                bgcolor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                '& .MuiToggleButton-root': {
                  border: 'none',
                  px: 1,
                  height: 30,
                  color: '#64748B',
                  '&.Mui-selected': {
                    bgcolor: '#14286D',
                    color: '#FFFFFF',
                    '&:hover': { bgcolor: '#0D1B4A' },
                  },
                },
              }}
            >
              <ToggleButton value="table" title="Table View">
                <ViewListIcon sx={{ fontSize: 17 }} />
              </ToggleButton>
              <ToggleButton value="cards" title="Cards View">
                <ViewModuleIcon sx={{ fontSize: 17 }} />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Content Section: Loading, Empty, Table, or Cards */}
        {loading ? (
          <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress size={30} sx={{ color: '#14286D', mb: 1.5 }} />
            <Typography sx={{ color: '#64748B', fontSize: '13px' }}>Loading leaves...</Typography>
          </Box>
        ) : filteredLeaves.length === 0 ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                bgcolor: '#F1F5FF',
                color: '#14286D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 12px auto',
              }}
            >
              <DateRangeIcon sx={{ fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: '#0F172A', mb: 0.5, fontSize: '15px' }}>
              No leave requests found
            </Typography>
            <Typography sx={{ color: '#64748B', maxWidth: 380, margin: '0 auto', fontSize: '12.5px' }}>
              {searchQuery || selectedType !== 'All' || tab !== 'All'
                ? 'No requests match your selected filters. Try clearing search or choosing another filter.'
                : "You haven't submitted any leave applications yet."}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
              onClick={() => setApplyDialogOpen(true)}
              sx={{
                mt: 1.5,
                bgcolor: '#14286D',
                fontWeight: 700,
                fontSize: '12px',
                textTransform: 'none',
                borderRadius: '6px',
                px: 2,
                '&:hover': { bgcolor: '#0D1B4A' },
              }}
            >
              Apply for Leave
            </Button>
          </Box>
        ) : viewMode === 'table' ? (
          /* Table View: All data columns left-aligned with headers, Actions right-aligned */
          <>
            <TableContainer>
              <Table sx={{ minWidth: 800 }}>
                <TableHead sx={{ bgcolor: '#F8FAFC' }}>
                  <TableRow>
                    <TableCell sx={{ py: 1.25, px: 2, fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', width: '18%' }}>
                      Leave Type
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 2, fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', width: '18%' }}>
                      Date Range
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 2, fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', width: '12%' }}>
                      Duration
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 2, fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', width: '20%' }}>
                      Reason
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 2, fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', width: '18%' }}>
                      Approver / Feedback
                    </TableCell>
                    <TableCell sx={{ py: 1.25, px: 2, fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', width: '12%' }}>
                      Status
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.25, px: 2, fontWeight: 700, fontSize: '11px', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', width: '12%' }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLeaves
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((leave) => {
                      const meta = LEAVE_TYPE_META[leave.leave_type] || { bg: '#EFF6FF', color: '#1E40AF', short: 'LV' };
                      const cancelAllowed = canCancel(leave);

                      return (
                        <TableRow
                          key={leave.id}
                          hover
                          sx={{
                            borderBottom: '1px solid #F1F5F9',
                            '&:last-child': { borderBottom: 'none' },
                            '&:hover': { bgcolor: '#F8FAFC' },
                          }}
                        >
                          {/* 1. Leave Type */}
                          <TableCell sx={{ py: 1.35, px: 2, verticalAlign: 'middle' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box
                                sx={{
                                  width: 26,
                                  height: 26,
                                  borderRadius: '6px',
                                  bgcolor: meta.bg,
                                  color: meta.color,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {meta.short || 'LV'}
                              </Box>
                              <Box>
                                <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                                  {leave.leave_type}
                                </Typography>
                                {leave.only_tomorrow && (
                                  <Typography sx={{ fontSize: '10px', color: '#0284C7', fontWeight: 600 }}>
                                    Emergency
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>

                          {/* 2. Date Range */}
                          <TableCell sx={{ py: 1.35, px: 2, verticalAlign: 'middle' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                              <DateRangeIcon sx={{ fontSize: 15, color: '#94A3B8', flexShrink: 0 }} />
                              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>
                                {formatLeaveDate(leave.start_date)}
                                {leave.start_date !== leave.end_date && ` – ${formatLeaveDate(leave.end_date)}`}
                              </Typography>
                            </Box>
                          </TableCell>

                          {/* 3. Duration */}
                          <TableCell sx={{ py: 1.35, px: 2, verticalAlign: 'middle' }}>
                            <Chip
                              label={durationLabel(leave)}
                              size="small"
                              sx={{
                                height: 22,
                                bgcolor: leave.half_day ? '#F1F5F9' : '#EFF6FF',
                                color: leave.half_day ? '#475569' : '#1D4ED8',
                                fontWeight: 700,
                                fontSize: '11px',
                                borderRadius: '4px',
                              }}
                            />
                          </TableCell>

                          {/* 4. Reason */}
                          <TableCell sx={{ py: 1.35, px: 2, verticalAlign: 'middle', maxWidth: 180 }}>
                            <Tooltip title={leave.reason || 'No description provided'} arrow>
                              <Typography
                                sx={{
                                  fontSize: '12px',
                                  color: '#475569',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {leave.reason || '—'}
                              </Typography>
                            </Tooltip>
                          </TableCell>

                          {/* 5. Approver / Feedback */}
                          <TableCell sx={{ py: 1.35, px: 2, verticalAlign: 'middle' }}>
                            {leave.reviewer_name || leave.supervisor_name || leave.review_comment ? (
                              <Box>
                                <Typography sx={{ fontSize: '12px', fontWeight: 650, color: '#0F172A', lineHeight: 1.2 }}>
                                  {leave.reviewer_name || leave.supervisor_name || 'Supervisor'}
                                </Typography>
                                {leave.review_comment && (
                                  <Box
                                    sx={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 0.5,
                                      mt: 0.25,
                                      px: 0.65,
                                      py: 0.15,
                                      borderRadius: '4px',
                                      bgcolor: '#F8FAFC',
                                      border: '1px solid #E2E8F0',
                                    }}
                                  >
                                    <ChatBubbleOutlineIcon sx={{ fontSize: 11, color: '#64748B' }} />
                                    <Typography sx={{ fontSize: '10.5px', color: '#475569', fontStyle: 'italic' }}>
                                      "{leave.review_comment}"
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            ) : (
                              <Typography sx={{ fontSize: '11.5px', color: '#94A3B8' }}>Awaiting review</Typography>
                            )}
                          </TableCell>

                          {/* 6. Status */}
                          <TableCell sx={{ py: 1.35, px: 2, verticalAlign: 'middle' }}>
                            {getStatusBadge(leave.status, leave.approval_stage)}
                          </TableCell>

                          {/* 7. Actions */}
                          <TableCell align="right" sx={{ py: 1.35, px: 2, verticalAlign: 'middle' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.75 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<VisibilityOutlinedIcon sx={{ fontSize: '13px !important' }} />}
                                onClick={() => setDetailsTarget(leave)}
                                sx={{
                                  height: 26,
                                  borderColor: '#E2E8F0',
                                  color: '#1E293B',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  textTransform: 'none',
                                  borderRadius: '5px',
                                  px: 1,
                                  '&:hover': { borderColor: '#14286D', color: '#14286D', bgcolor: '#F8FAFC' },
                                }}
                              >
                                Details
                              </Button>

                              {cancelAllowed && (
                                <Button
                                  size="small"
                                  color="error"
                                  variant="outlined"
                                  onClick={() => setCancelTarget(leave)}
                                  sx={{
                                    height: 26,
                                    borderColor: '#FECACA',
                                    color: '#DC2626',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    textTransform: 'none',
                                    borderRadius: '5px',
                                    px: 0.9,
                                    bgcolor: '#FEF2F2',
                                    '&:hover': { bgcolor: '#FEE2E2', borderColor: '#F87171' },
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[8, 15, 25]}
              component="div"
              count={filteredLeaves.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              sx={{ borderTop: '1px solid #E2E8F0' }}
            />
          </>
        ) : (
          /* Cards View */
          <Box sx={{ p: 2 }}>
            <Grid container spacing={2}>
              {filteredLeaves
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((leave) => {
                  const meta = LEAVE_TYPE_META[leave.leave_type] || { bg: '#EFF6FF', color: '#1E40AF', short: 'LV' };
                  const cancelAllowed = canCancel(leave);

                  return (
                    <Grid item xs={12} sm={6} md={4} key={leave.id}>
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.75,
                          borderRadius: '10px',
                          border: '1px solid #E2E8F0',
                          bgcolor: '#FFFFFF',
                          boxShadow: '0 1px 3px rgba(20, 40, 109, 0.02)',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          height: '100%',
                          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 10px rgba(20, 40, 109, 0.05)',
                            borderColor: '#CBD5E1',
                          },
                        }}
                      >
                        {/* Top: Leave Type + Status */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.25 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: '6px',
                                bgcolor: meta.bg,
                                color: meta.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '10.5px',
                                fontWeight: 800,
                              }}
                            >
                              {meta.short || 'LV'}
                            </Box>
                            <Box>
                              <Typography sx={{ fontSize: '13px', fontWeight: 750, color: '#0F172A' }}>
                                {leave.leave_type}
                              </Typography>
                              <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                                {durationLabel(leave)}
                              </Typography>
                            </Box>
                          </Box>
                          {getStatusBadge(leave.status, leave.approval_stage)}
                        </Box>

                        {/* Middle: Date Range */}
                        <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '6px', p: 1, mb: 1.25, border: '1px solid #F1F5F9' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, mb: 0.2 }}>
                            <DateRangeIcon sx={{ fontSize: 14, color: '#64748B' }} />
                            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#1E293B' }}>
                              {formatLeaveDate(leave.start_date)}
                              {leave.start_date !== leave.end_date && ` – ${formatLeaveDate(leave.end_date)}`}
                            </Typography>
                          </Box>
                          <Typography sx={{ fontSize: '10.5px', color: '#64748B', pl: 2.5 }}>
                            Applied on {formatLeaveDate(leave.created_at || leave.createdAt)}
                          </Typography>
                        </Box>

                        {/* Reason */}
                        <Box sx={{ mb: 1.25, flex: 1 }}>
                          <Typography sx={{ fontSize: '10px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase', mb: 0.2 }}>
                            Reason
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '11.5px',
                              color: '#334155',
                              lineHeight: 1.4,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {leave.reason || 'No description provided'}
                          </Typography>
                        </Box>

                        {/* Reviewer */}
                        {(leave.reviewer_name || leave.supervisor_name || leave.review_comment) && (
                          <Box sx={{ bgcolor: '#F8FAFC', borderRadius: '6px', p: 0.85, mb: 1.25 }}>
                            <Typography sx={{ fontSize: '10.5px', fontWeight: 700, color: '#475569' }}>
                              Reviewer: {leave.reviewer_name || leave.supervisor_name}
                            </Typography>
                            {leave.review_comment && (
                              <Typography sx={{ fontSize: '10px', color: '#64748B', fontStyle: 'italic', mt: 0.15 }}>
                                "{leave.review_comment}"
                              </Typography>
                            )}
                          </Box>
                        )}

                        <Divider sx={{ mb: 1 }} />

                        {/* Card Footer Actions */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Button
                            size="small"
                            startIcon={<VisibilityOutlinedIcon sx={{ fontSize: '13px !important' }} />}
                            onClick={() => setDetailsTarget(leave)}
                            sx={{
                              textTransform: 'none',
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#14286D',
                              p: 0,
                              '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' },
                            }}
                          >
                            View Details
                          </Button>

                          {cancelAllowed && (
                            <Button
                              size="small"
                              color="error"
                              variant="outlined"
                              onClick={() => setCancelTarget(leave)}
                              sx={{
                                height: 24,
                                textTransform: 'none',
                                fontSize: '10.5px',
                                fontWeight: 700,
                                borderRadius: '4px',
                                px: 0.8,
                                bgcolor: '#FEF2F2',
                                borderColor: '#FECACA',
                              }}
                            >
                              Cancel Request
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    </Grid>
                  );
                })}
            </Grid>

            <TablePagination
              rowsPerPageOptions={[8, 15, 25]}
              component="div"
              count={filteredLeaves.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
              sx={{ borderTop: '1px solid #E2E8F0', mt: 1.5 }}
            />
          </Box>
        )}
      </Paper>

      {/* 4. Detailed Leave Journey Modal */}
      <Dialog
        open={!!detailsTarget}
        onClose={() => setDetailsTarget(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: '12px', p: 0.5 },
        }}
      >
        {detailsTarget && (
          <>
            <DialogTitle sx={{ pb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 30,
                    height: 30,
                    borderRadius: '6px',
                    bgcolor: (LEAVE_TYPE_META[detailsTarget.leave_type] || {}).bg || '#EFF6FF',
                    color: (LEAVE_TYPE_META[detailsTarget.leave_type] || {}).color || '#1E40AF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 800,
                  }}
                >
                  {(LEAVE_TYPE_META[detailsTarget.leave_type] || {}).short || 'LV'}
                </Box>
                <Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>
                    {detailsTarget.leave_type}
                  </Typography>
                  <Typography sx={{ fontSize: '11px', color: '#64748B' }}>
                    Application ID: #{detailsTarget.id}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setDetailsTarget(null)} size="small">
                <CloseIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ pt: 2, pb: 2.5 }}>
              {/* Quick Info Grid */}
              <Grid container spacing={1.5} sx={{ mb: 2 }}>
                <Grid item xs={6} sm={4}>
                  <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <Typography sx={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>Duration</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                      {durationLabel(detailsTarget)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} sm={4}>
                  <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <Typography sx={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>Start Date</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                      {formatLeaveDate(detailsTarget.start_date)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <Typography sx={{ fontSize: '10.5px', color: '#64748B', fontWeight: 600 }}>End Date</Typography>
                    <Typography sx={{ fontSize: '13px', fontWeight: 800, color: '#0F172A' }}>
                      {formatLeaveDate(detailsTarget.end_date)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Status */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, p: 1.25, bgcolor: '#F1F5FF', borderRadius: '8px' }}>
                <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#14286D' }}>
                  Current Status
                </Typography>
                {getStatusBadge(detailsTarget.status, detailsTarget.approval_stage)}
              </Box>

              {/* Reason */}
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', mb: 0.5 }}>
                  Reason for Leave
                </Typography>
                <Paper elevation={0} sx={{ p: 1.25, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  <Typography sx={{ fontSize: '12.5px', color: '#1E293B', fontStyle: 'italic', lineHeight: 1.5 }}>
                    "{detailsTarget.reason || 'No description provided'}"
                  </Typography>
                </Paper>
              </Box>

              {/* Timeline */}
              <Box>
                <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', mb: 1 }}>
                  Approval Workflow Tracking
                </Typography>
                <Box sx={{ p: 1.75, bgcolor: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                  {/* Step 1 */}
                  <Box sx={{ display: 'flex', gap: 1.25, mb: 1.75 }}>
                    <Box sx={{ width: 22, height: 22, borderRadius: '50%', bgcolor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircleIcon sx={{ fontSize: 14 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                        Application Submitted
                      </Typography>
                      <Typography sx={{ fontSize: '10.5px', color: '#64748B' }}>
                        Filed on {formatLeaveDate(detailsTarget.created_at || detailsTarget.createdAt)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Step 2 */}
                  <Box sx={{ display: 'flex', gap: 1.25, mb: 1.75 }}>
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        bgcolor: detailsTarget.status === 'Approved' ? '#DCFCE7' : detailsTarget.status === 'Rejected' ? '#FEE2E2' : '#FEF3C7',
                        color: detailsTarget.status === 'Approved' ? '#16A34A' : detailsTarget.status === 'Rejected' ? '#DC2626' : '#D97706',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {detailsTarget.status === 'Approved' ? <CheckCircleIcon sx={{ fontSize: 14 }} /> : detailsTarget.status === 'Rejected' ? <CancelIcon sx={{ fontSize: 14 }} /> : <ScheduleIcon sx={{ fontSize: 14 }} />}
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                        Department Supervisor Review
                      </Typography>
                      <Typography sx={{ fontSize: '10.5px', color: '#64748B' }}>
                        Reviewer: {detailsTarget.reviewer_name || detailsTarget.supervisor_name || 'Designated Supervisor'}
                      </Typography>
                      {detailsTarget.review_comment && (
                        <Typography sx={{ fontSize: '11px', color: '#334155', bgcolor: '#FFFFFF', p: 0.75, borderRadius: '4px', mt: 0.4, border: '1px solid #E2E8F0' }}>
                          Comment: "{detailsTarget.review_comment}"
                        </Typography>
                      )}
                    </Box>
                  </Box>

                  {/* Step 3 */}
                  <Box sx={{ display: 'flex', gap: 1.25 }}>
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        bgcolor: detailsTarget.status === 'Approved' ? '#DCFCE7' : '#F1F5F9',
                        color: detailsTarget.status === 'Approved' ? '#16A34A' : '#94A3B8',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <DoneAllIcon sx={{ fontSize: 14 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '12.5px', fontWeight: 700, color: detailsTarget.status === 'Approved' ? '#0F172A' : '#64748B' }}>
                        HR Final Processing
                      </Typography>
                      <Typography sx={{ fontSize: '10.5px', color: '#64748B' }}>
                        {detailsTarget.status === 'Approved' ? 'Completed & recorded in attendance roster' : 'Pending prior stage completion'}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>
            </DialogContent>

            <DialogActions sx={{ p: 1.5 }}>
              {canCancel(detailsTarget) && (
                <Button
                  color="error"
                  variant="outlined"
                  size="small"
                  onClick={() => setCancelTarget(detailsTarget)}
                  sx={{ mr: 'auto', textTransform: 'none', fontWeight: 700, fontSize: '12px' }}
                >
                  Cancel Leave Request
                </Button>
              )}
              <Button
                variant="contained"
                size="small"
                onClick={() => setDetailsTarget(null)}
                sx={{
                  bgcolor: '#14286D',
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '12.5px',
                  '&:hover': { bgcolor: '#0D1B4A' },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* 5. Cancel Request Modal */}
      <Dialog
        open={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        fullWidth
        maxWidth="xs"
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: '#0F172A', pb: 1, fontSize: '16px' }}>
          Cancel Leave Request
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: '#64748B', mb: 2, fontSize: '13px' }}>
            Are you sure you want to cancel your{' '}
            <strong style={{ color: '#0F172A' }}>{cancelTarget?.leave_type}</strong> from{' '}
            <strong>{formatLeaveDate(cancelTarget?.start_date)}</strong> to{' '}
            <strong>{formatLeaveDate(cancelTarget?.end_date)}</strong>?
          </Typography>
          <TextField
            label="Cancellation reason (optional)"
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            fullWidth
            multiline
            rows={3}
            placeholder="e.g. Schedule changed, will be attending work as normal"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: '13px' } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2 }}>
          <Button
            size="small"
            onClick={() => setCancelTarget(null)}
            sx={{ textTransform: 'none', color: '#64748B', fontWeight: 600, fontSize: '12.5px' }}
          >
            Keep Request
          </Button>
          <Button
            size="small"
            color="error"
            variant="contained"
            onClick={handleCancel}
            disabled={saving}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              borderRadius: '8px',
              px: 2,
              bgcolor: '#DC2626',
              fontSize: '12.5px',
              '&:hover': { bgcolor: '#B91C1C' },
            }}
          >
            {saving ? 'Cancelling...' : 'Confirm Cancel'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 6. Apply Leave Modal Dialog */}
      <ApplyLeaveDialog
        open={applyDialogOpen}
        onClose={() => setApplyDialogOpen(false)}
        onSuccess={() => {
          fetchData(true);
          setSnackbar({ open: true, message: 'Leave request submitted successfully!', severity: 'success' });
        }}
        availableBalance={totalAvailable}
      />

      {/* 7. Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MyLeaves;
