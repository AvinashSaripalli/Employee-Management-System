import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  InputAdornment,
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
  Tabs,
  Tab,
  Stack,
  Divider,
  TablePagination,
} from '@mui/material';
import {
  HiOutlineLifebuoy,
  HiOutlineCpuChip,
  HiOutlineCube,
  HiOutlineDocumentText,
  HiOutlineBuildingOffice2,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlinePlus,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationTriangle,
  HiOutlineEye,
  HiOutlineAdjustmentsHorizontal,
} from 'react-icons/hi2';
import axios from '../../api/axios';
import { useAuth } from '../../redux/hooks';
import RaiseRequestDialog from './RaiseRequestDialog';
import TicketDetailDialog from './TicketDetailDialog';
import HelpdeskSettingsDialog from './HelpdeskSettingsDialog';

const STATUS_PILLS = {
  Open: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
  'In Progress': { bg: '#EDE9FE', text: '#6D28D9', border: '#DDD6FE' },
  'Waiting on Employee': { bg: '#E0F2FE', text: '#0369A1', border: '#BAE6FD' },
  Resolved: { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0' },
  Closed: { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' },
  Rejected: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA' },
};

const PRIORITY_PILLS = {
  Critical: { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' },
  High: { bg: '#FFEDD5', text: '#EA580C', border: '#FED7AA' },
  Medium: { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' },
  Low: { bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' },
};

const CATEGORY_META = {
  IT_SUPPORT: { label: 'IT Support', icon: <HiOutlineCpuChip size={15} color="#4F46E5" />, color: '#4F46E5', bg: '#EEF2FF' },
  ASSET_REQUEST: { label: 'Asset Request', icon: <HiOutlineCube size={15} color="#059669" />, color: '#059669', bg: '#ECFDF5' },
  HR_REQUEST: { label: 'HR & Letters', icon: <HiOutlineDocumentText size={15} color="#D97706" />, color: '#D97706', bg: '#FFFBEB' },
  FACILITY: { label: 'Facilities', icon: <HiOutlineBuildingOffice2 size={15} color="#0284C7" />, color: '#0284C7', bg: '#F0F9FF' },
};

const HelpdeskHub = () => {
  const [tickets, setTickets] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0); // 0: All, 1: Asset Requests, 2: IT Support, 3: HR Inquiries
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [openRaiseDialog, setOpenRaiseDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { user, role: reduxRole, departmentRole: reduxDeptRole, companyName: reduxCompanyName } = useAuth();

  const userRole = (
    reduxRole ||
    user?.role ||
    localStorage.getItem('userRole') ||
    localStorage.getItem('role') ||
    'Employee'
  ).toLowerCase();
  const userDeptRole = (reduxDeptRole || user?.departmentRole || localStorage.getItem('departmentRole') || '').toLowerCase();
  const userDept = (
    user?.department ||
    localStorage.getItem('userDepartment') ||
    localStorage.getItem('department') ||
    ''
  ).toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'hr';
  const isSupervisor = userDeptRole === 'supervisor' || userRole === 'manager';
  const isITStaff = userDept.includes('it') || userDept.includes('tech');
  const isStaff = isAdmin || isSupervisor || isITStaff;
  const canManageSettings = isAdmin || isSupervisor || userRole === 'manager';

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const companyName = reduxCompanyName || user?.companyName || localStorage.getItem('companyName') || 'KN Advisors';
      const [ticketsRes, metricsRes] = await Promise.all([
        axios.get('/support-tickets', {
          params: {
            companyName,
            scope: isStaff ? 'all' : 'my',
          },
        }),
        axios.get('/support-tickets/metrics', {
          params: { companyName },
        }),
      ]);

      setTickets(ticketsRes.data?.tickets || []);
      setMetrics(metricsRes.data || null);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    } finally {
      setLoading(false);
    }
  }, [isStaff]);

  useEffect(() => {
    fetchTickets();
    window.addEventListener('requestCountsUpdated', fetchTickets);
    return () => window.removeEventListener('requestCountsUpdated', fetchTickets);
  }, [fetchTickets]);

  // Tab Filtering
  const filteredByCategory = useMemo(() => {
    if (activeTab === 1) return tickets.filter((t) => t.category === 'ASSET_REQUEST');
    if (activeTab === 2) return tickets.filter((t) => t.category === 'IT_SUPPORT');
    if (activeTab === 3) return tickets.filter((t) => t.category === 'HR_REQUEST' || t.category === 'FACILITY');
    return tickets;
  }, [tickets, activeTab]);

  // Status, Priority & Search Filtering
  const displayTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return filteredByCategory.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) return false;

      if (q) {
        const matchesNumber = (item.ticketNumber || '').toLowerCase().includes(q);
        const matchesTitle = (item.title || '').toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesRequester = (item.employeeName || '').toLowerCase().includes(q);
        const matchesDept = (item.department || '').toLowerCase().includes(q);
        const matchesSub = (item.subCategory || '').toLowerCase().includes(q);
        if (!matchesNumber && !matchesTitle && !matchesDesc && !matchesRequester && !matchesDept && !matchesSub) {
          return false;
        }
      }
      return true;
    });
  }, [filteredByCategory, statusFilter, priorityFilter, search]);

  const totalOpen = (metrics?.openCount || 0) + (metrics?.inProgressCount || 0);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: '#F8FAFC', minHeight: '100vh' }}>
      {/* 1. Header Banner */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', md: 'center' },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                p: 1.2,
                borderRadius: '12px',
                bgcolor: '#14286D',
                color: '#ffffff',
                display: 'flex',
                boxShadow: '0 4px 12px rgba(20, 40, 109, 0.25)',
              }}
            >
              <HiOutlineLifebuoy size={26} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.3px' }}>
                Helpdesk & Service Requests
              </Typography>
              <Typography sx={{ fontSize: '13px', color: '#64748B' }}>
                Centralized portal for IT support tickets, company equipment requisitions, and HR document requests
              </Typography>
            </Box>
          </Box>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', sm: 'auto' } }}>
          <Button
            variant="outlined"
            onClick={fetchTickets}
            startIcon={<HiOutlineArrowPath size={16} />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '9px',
              borderColor: '#CBD5E1',
              color: '#334155',
              bgcolor: '#ffffff',
              '&:hover': { bgcolor: '#F1F5F9', borderColor: '#94A3B8' },
            }}
          >
            Refresh
          </Button>

          {canManageSettings && (
            <Button
              variant="outlined"
              onClick={() => setOpenSettingsDialog(true)}
              startIcon={<HiOutlineAdjustmentsHorizontal size={17} />}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '13px',
                borderRadius: '9px',
                borderColor: '#CBD5E1',
                color: '#1E293B',
                bgcolor: '#ffffff',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                '&:hover': { bgcolor: '#F8FAFC', borderColor: '#4F46E5', color: '#4F46E5' },
              }}
            >
              Approver Settings
            </Button>
          )}

          <Button
            variant="contained"
            onClick={() => setOpenRaiseDialog(true)}
            startIcon={<HiOutlinePlus size={18} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13.5px',
              borderRadius: '9px',
              bgcolor: '#14286D',
              px: 2.4,
              boxShadow: '0 4px 12px rgba(20, 40, 109, 0.25)',
              '&:hover': { bgcolor: '#0F1E54' },
            }}
          >
            Raise Request
          </Button>
        </Stack>
      </Box>

      {/* 2. Executive KPI Cards */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: '14px',
            bgcolor: '#ffffff',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Active / Open Tickets
            </Typography>
            <Typography sx={{ fontSize: '26px', fontWeight: 800, color: '#1E293B', mt: 0.2 }}>
              {totalOpen}
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: '#B45309', mt: 0.3, fontWeight: 600 }}>
              {metrics?.inProgressCount || 0} In Progress · {metrics?.openCount || 0} Unassigned
            </Typography>
          </Box>
          <Box sx={{ p: 1.4, borderRadius: '12px', bgcolor: '#FEF3C7', color: '#B45309' }}>
            <HiOutlineClock size={26} />
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: '14px',
            bgcolor: '#ffffff',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Asset Requisitions
            </Typography>
            <Typography sx={{ fontSize: '26px', fontWeight: 800, color: '#1E293B', mt: 0.2 }}>
              {metrics?.assetRequestCount || 0}
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: '#059669', mt: 0.3, fontWeight: 600 }}>
              Equipment & Peripherals
            </Typography>
          </Box>
          <Box sx={{ p: 1.4, borderRadius: '12px', bgcolor: '#ECFDF5', color: '#059669' }}>
            <HiOutlineCube size={26} />
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: '14px',
            bgcolor: '#ffffff',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Critical / Urgent Issues
            </Typography>
            <Typography sx={{ fontSize: '26px', fontWeight: 800, color: '#DC2626', mt: 0.2 }}>
              {metrics?.criticalCount || 0}
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: '#DC2626', mt: 0.3, fontWeight: 600 }}>
              High-priority blockers
            </Typography>
          </Box>
          <Box sx={{ p: 1.4, borderRadius: '12px', bgcolor: '#FEE2E2', color: '#DC2626' }}>
            <HiOutlineExclamationTriangle size={26} />
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: '14px',
            bgcolor: '#ffffff',
            border: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
              Resolved / Closed
            </Typography>
            <Typography sx={{ fontSize: '26px', fontWeight: 800, color: '#059669', mt: 0.2 }}>
              {metrics?.resolvedCount || 0}
            </Typography>
            <Typography sx={{ fontSize: '11.5px', color: '#475569', mt: 0.3, fontWeight: 600 }}>
              Out of {metrics?.total || 0} total requests
            </Typography>
          </Box>
          <Box sx={{ p: 1.4, borderRadius: '12px', bgcolor: '#F1F5F9', color: '#475569' }}>
            <HiOutlineCheckCircle size={26} />
          </Box>
        </Paper>
      </Box>

      {/* 3. Main Data Paper & Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '16px',
          border: '1px solid #E2E8F0',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Tabs Bar */}
        <Box sx={{ borderBottom: '1px solid #E2E8F0', bgcolor: '#ffffff', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '13.5px',
                py: 2,
                color: '#64748B',
                '&.Mui-selected': { color: '#14286D' },
              },
              '& .MuiTabs-indicator': { bgcolor: '#14286D', height: 3 },
            }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{isStaff ? 'All Requests & Resolver Queue' : 'My Requests'}</span>
                  <Chip
                    label={tickets.length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 700,
                      bgcolor: activeTab === 0 ? '#14286D' : '#F1F5F9',
                      color: activeTab === 0 ? '#ffffff' : '#475569',
                    }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Asset Requisitions</span>
                  <Chip
                    label={tickets.filter((t) => t.category === 'ASSET_REQUEST').length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 700,
                      bgcolor: activeTab === 1 ? '#059669' : '#ECFDF5',
                      color: activeTab === 1 ? '#ffffff' : '#059669',
                    }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>IT Support Tickets</span>
                  <Chip
                    label={tickets.filter((t) => t.category === 'IT_SUPPORT').length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 700,
                      bgcolor: activeTab === 2 ? '#4F46E5' : '#EEF2FF',
                      color: activeTab === 2 ? '#ffffff' : '#4F46E5',
                    }}
                  />
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>HR & Document Requests</span>
                  <Chip
                    label={tickets.filter((t) => t.category === 'HR_REQUEST' || t.category === 'FACILITY').length}
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 700,
                      bgcolor: activeTab === 3 ? '#D97706' : '#FFFBEB',
                      color: activeTab === 3 ? '#ffffff' : '#D97706',
                    }}
                  />
                </Box>
              }
            />
          </Tabs>
        </Box>

        {/* Filter Controls Bar */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'stretch', md: 'center' },
            justifyContent: 'space-between',
            gap: 1.5,
            bgcolor: '#FAFAFA',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <TextField
            size="small"
            placeholder="Search by ticket #, title, requester, or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HiOutlineMagnifyingGlass size={17} color="#94A3B8" />
                </InputAdornment>
              ),
            }}
            sx={{ width: { xs: '100%', md: 360 }, bgcolor: '#ffffff' }}
          />

          <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
            {/* Quick Status Filters */}
            {['all', 'Open', 'In Progress', 'Resolved', 'Closed'].map((st) => {
              const isSelected = statusFilter === st;
              return (
                <Chip
                  key={st}
                  label={st === 'all' ? 'All Status' : st}
                  size="small"
                  onClick={() => setStatusFilter(st)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    bgcolor: isSelected ? '#14286D' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#64748B',
                    border: '1px solid',
                    borderColor: isSelected ? '#14286D' : '#CBD5E1',
                    '&:hover': { bgcolor: isSelected ? '#0F1E54' : '#F1F5F9' },
                  }}
                />
              );
            })}

            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

            {/* Quick Priority Filter */}
            {['all', 'Critical', 'High'].map((pr) => {
              const isSelected = priorityFilter === pr;
              return (
                <Chip
                  key={pr}
                  label={pr === 'all' ? 'All Priorities' : pr}
                  size="small"
                  onClick={() => setPriorityFilter(pr)}
                  sx={{
                    fontWeight: 700,
                    fontSize: '12px',
                    cursor: 'pointer',
                    bgcolor: isSelected ? (pr === 'Critical' ? '#DC2626' : '#EA580C') : '#ffffff',
                    color: isSelected ? '#ffffff' : pr === 'Critical' ? '#DC2626' : pr === 'High' ? '#EA580C' : '#64748B',
                    border: '1px solid',
                    borderColor: isSelected
                      ? pr === 'Critical'
                        ? '#DC2626'
                        : '#EA580C'
                      : '#CBD5E1',
                    '&:hover': { opacity: 0.9 },
                  }}
                />
              );
            })}
          </Stack>
        </Box>

        {/* Data Table */}
        <TableContainer>
          <Table size="medium">
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>TICKET #</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>CATEGORY</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>REQUEST / SUBJECT</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>REQUESTER</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>PRIORITY</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>SUBMITTED</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, fontSize: '12px', color: '#475569' }}>ACTION</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={32} sx={{ color: '#14286D' }} />
                    <Typography sx={{ mt: 1.5, fontSize: '13px', color: '#64748B' }}>
                      Loading service requests...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : displayTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                    <Box sx={{ p: 2, display: 'inline-flex', borderRadius: '50%', bgcolor: '#F1F5F9', color: '#94A3B8', mb: 1 }}>
                      <HiOutlineLifebuoy size={36} />
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#334155' }}>
                      No service requests found
                    </Typography>
                    <Typography sx={{ fontSize: '12.5px', color: '#64748B', maxWidth: 400, mx: 'auto', mt: 0.5 }}>
                      {search || statusFilter !== 'all' || priorityFilter !== 'all'
                        ? 'No tickets match the current filter criteria. Try clearing filters.'
                        : 'No requests have been submitted in this category yet. Click "Raise Request" to submit one.'}
                    </Typography>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => setOpenRaiseDialog(true)}
                      startIcon={<HiOutlinePlus size={16} />}
                      sx={{
                        mt: 2,
                        textTransform: 'none',
                        fontWeight: 700,
                        bgcolor: '#14286D',
                        borderRadius: '8px',
                        '&:hover': { bgcolor: '#0F1E54' },
                      }}
                    >
                      Raise Request
                    </Button>
                  </TableCell>
                </TableRow>
              ) : (
                displayTickets
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((t) => {
                    const catMeta = CATEGORY_META[t.category] || CATEGORY_META.IT_SUPPORT;
                    const statusMeta = STATUS_PILLS[t.status] || STATUS_PILLS.Open;
                    const priorityMeta = PRIORITY_PILLS[t.priority] || PRIORITY_PILLS.Medium;

                    return (
                      <TableRow
                        key={t.id}
                        hover
                        sx={{
                          cursor: 'pointer',
                          '&:hover': { bgcolor: '#F8FAFC' },
                        }}
                        onClick={() => setSelectedTicket(t)}
                      >
                        {/* Ticket Number */}
                        <TableCell>
                          <Typography
                            sx={{
                              fontWeight: 800,
                              fontSize: '13px',
                              color: '#14286D',
                              fontFamily: 'monospace',
                            }}
                          >
                            #{t.ticketNumber}
                          </Typography>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.8,
                              px: 1,
                              py: 0.3,
                              borderRadius: '6px',
                              bgcolor: catMeta.bg,
                              border: `1px solid ${catMeta.color}30`,
                            }}
                          >
                            {catMeta.icon}
                            <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: catMeta.color }}>
                              {catMeta.label}
                            </Typography>
                          </Box>
                        </TableCell>

                        {/* Subject & Subcategory */}
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Typography
                            sx={{
                              fontWeight: 700,
                              fontSize: '13.5px',
                              color: '#1E293B',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {t.title}
                          </Typography>
                          <Typography sx={{ fontSize: '11.5px', color: '#64748B', mt: 0.2 }}>
                            {t.subCategory || 'General'}
                            {t.allocatedAsset && (
                              <span style={{ color: '#059669', fontWeight: 600 }}>
                                {' '}· Allocated: {t.allocatedAsset.name} ({t.allocatedAsset.assetTag})
                              </span>
                            )}
                          </Typography>
                        </TableCell>

                        {/* Requester */}
                        <TableCell>
                          <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#1E293B' }}>
                            {t.employeeName}
                          </Typography>
                          <Typography sx={{ fontSize: '11.5px', color: '#64748B' }}>
                            {t.employeeId} · {t.department}
                          </Typography>
                        </TableCell>

                        {/* Priority */}
                        <TableCell>
                          <Chip
                            label={t.priority}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '11px',
                              height: 22,
                              bgcolor: priorityMeta.bg,
                              color: priorityMeta.text,
                              border: `1px solid ${priorityMeta.border}`,
                            }}
                          />
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <Chip
                            label={t.status}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              fontSize: '11.5px',
                              height: 24,
                              bgcolor: statusMeta.bg,
                              color: statusMeta.text,
                              border: `1px solid ${statusMeta.border}`,
                            }}
                          />
                        </TableCell>

                        {/* Date */}
                        <TableCell>
                          <Typography sx={{ fontSize: '12px', color: '#475569', fontWeight: 500 }}>
                            {new Date(t.created_at || t.createdAt).toLocaleDateString()}
                          </Typography>
                          <Typography sx={{ fontSize: '11px', color: '#94A3B8' }}>
                            {new Date(t.created_at || t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Typography>
                        </TableCell>

                        {/* Action */}
                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<HiOutlineEye size={15} />}
                            onClick={() => setSelectedTicket(t)}
                            sx={{
                              textTransform: 'none',
                              fontWeight: 700,
                              fontSize: '11.5px',
                              borderRadius: '7px',
                              borderColor: '#CBD5E1',
                              color: '#14286D',
                              bgcolor: '#ffffff',
                              '&:hover': { bgcolor: '#F1F5F9', borderColor: '#14286D' },
                            }}
                          >
                            {isStaff ? 'Manage' : 'View'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={displayTickets.length}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          sx={{ borderTop: '1px solid #E2E8F0', bgcolor: '#FAFAFA' }}
        />
      </Paper>

      {/* Raise Request Dialog Modal */}
      <RaiseRequestDialog
        open={openRaiseDialog}
        onClose={() => setOpenRaiseDialog(false)}
        onSuccess={() => fetchTickets()}
      />

      {/* Ticket Details & Action Dialog Modal */}
      <TicketDetailDialog
        open={Boolean(selectedTicket)}
        ticket={selectedTicket}
        isStaff={isStaff}
        onClose={() => setSelectedTicket(null)}
        onUpdated={() => {
          fetchTickets();
          setSelectedTicket(null);
        }}
      />

      {/* Helpdesk Workflow & Approver Settings Dialog Modal */}
      <HelpdeskSettingsDialog
        open={openSettingsDialog}
        onClose={() => setOpenSettingsDialog(false)}
        onSaved={() => fetchTickets()}
      />
    </Box>
  );
};

export default HelpdeskHub;
