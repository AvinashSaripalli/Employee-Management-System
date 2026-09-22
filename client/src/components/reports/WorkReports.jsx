import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Box, Typography, Paper, TableContainer, Table, TableHead, TableBody, TableRow,
  TableCell, TablePagination, IconButton, Button, TextField, MenuItem, Chip,
  Collapse, CircularProgress, Alert, Tooltip, Stack, Avatar, InputAdornment,
  Divider, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import RefreshIcon from '@mui/icons-material/Refresh';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import TodayIcon from '@mui/icons-material/Today';
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import axios from '../../api/axios';
import WorkReportFormDialog from './WorkReportFormDialog';
import {
  formatDate, formatHours, parseWorkDescription, downloadCSV, timeToHours,
} from '../../utils/reportUtils';
import dayjs from 'dayjs';

const WorkReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'reviewed', 'pending'
  const [viewMode, setViewMode] = useState('table'); // 'table', 'calendar'
  const [expandedId, setExpandedId] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [notice, setNotice] = useState('');

  const employeeId = localStorage.getItem('userEmployeeId');
  const companyName = localStorage.getItem('companyName');
  const userFirstName = localStorage.getItem('userFirstName') || '';
  const userLastName = localStorage.getItem('userLastName') || '';
  const userFullName = `${userFirstName} ${userLastName}`.trim() || 'Employee';

  const fetchReports = useCallback(() => {
    if (!employeeId) return;
    setLoading(true);
    axios
      .get('/reports/getAll', { params: { employeeId, companyName } })
      .then((res) => setReports(res.data || []))
      .catch((err) => console.error('Failed to load reports:', err))
      .finally(() => setLoading(false));
  }, [employeeId, companyName]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Selected Month Key (YYYY-MM)
  const monthKey = selectedMonth.format('YYYY-MM');

  // Month-level statistics for this employee
  const monthStats = useMemo(() => {
    const currentMonthReports = reports.filter((r) => dayjs(r.date).format('YYYY-MM') === monthKey);
    const totalCount = currentMonthReports.length;
    const totalHoursNum = currentMonthReports.reduce((s, r) => s + timeToHours(r.hoursWorked), 0);
    const reviewedCount = currentMonthReports.filter((r) => r.feedback && r.feedback !== 'Pending').length;
    const reviewRate = totalCount > 0 ? Math.round((reviewedCount / totalCount) * 100) : 0;
    const avgDailyHours = totalCount > 0 ? (totalHoursNum / totalCount).toFixed(1) : '0';

    return {
      totalCount,
      totalHours: formatHours(totalHoursNum),
      reviewRate: `${reviewRate}%`,
      reviewedCount,
      avgDailyHours: `${avgDailyHours}h`,
    };
  }, [reports, monthKey]);

  // Days in month for calendar strip view
  const daysInMonth = useMemo(() => {
    const total = selectedMonth.daysInMonth();
    const list = [];
    for (let d = 1; d <= total; d++) {
      const dateObj = selectedMonth.date(d);
      const dateKey = dateObj.format('YYYY-MM-DD');
      const dayReports = reports.filter((r) => dayjs(r.date).format('YYYY-MM-DD') === dateKey);
      list.push({
        dayNumber: d,
        weekday: dateObj.format('dd'),
        dateKey,
        isWeekend: dateObj.day() === 0 || dateObj.day() === 6,
        isToday: dateObj.isSame(dayjs(), 'day'),
        reports: dayReports,
      });
    }
    return list;
  }, [selectedMonth, reports]);

  // Filtered reports for the list/table
  const filtered = useMemo(() => {
    return reports
      .filter((r) => dayjs(r.date).format('YYYY-MM') === monthKey)
      .filter((r) => {
        if (statusFilter === 'reviewed') {
          return r.feedback && r.feedback !== 'Pending';
        }
        if (statusFilter === 'pending') {
          return !r.feedback || r.feedback === 'Pending';
        }
        return true;
      })
      .filter((r) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
          (r.taskName || '').toLowerCase().includes(q) ||
          parseWorkDescription(r.workDescription).some((line) => line.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [reports, monthKey, statusFilter, searchTerm]);

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleDeleted = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await axios.delete(`/reports/${id}`);
      setReports((prev) => prev.filter((r) => r.id !== id));
      setNotice('Report deleted successfully');
      setTimeout(() => setNotice(''), 2500);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete report');
    }
  };

  const handleExport = () => {
    const rows = [
      ['Date', 'Department', 'Task Name', 'Hours Worked', 'Work Description', 'Feedback', 'Status'],
      ...filtered.map((r) => [
        r.date,
        r.department || '',
        r.taskName || '',
        formatHours(r.hoursWorked),
        parseWorkDescription(r.workDescription).join(' | '),
        r.feedback || 'Pending',
        r.status || 'Submitted',
      ]),
    ];
    downloadCSV(`my-work-reports-${monthKey}.csv`, rows);
  };

  const handleAddForDate = (dateStr) => {
    setEditingReport({ date: dateStr, taskName: '', workDescription: '', hoursWorked: '' });
    setOpenForm(true);
  };

  if (loading && !reports.length) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 14 }}>
        <CircularProgress size={42} thickness={4} sx={{ color: '#0284c7', mb: 2 }} />
        <Typography variant="body2" color="text.secondary">Loading your work reports...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: '#f4f7f9', minHeight: '100vh' }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px' }}>
            My Work Reports
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px', mt: 0.25 }}>
            Log your daily achievements, track working hours, and review feedback.
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.25, alignItems: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
            onClick={fetchReports}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '7px',
              borderColor: '#cbd5e1',
              color: '#475569',
              bgcolor: '#ffffff',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
            }}
          >
            Refresh
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleExport}
            disabled={!filtered.length}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '7px',
              borderColor: '#cbd5e1',
              color: '#475569',
              bgcolor: '#ffffff',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
            }}
          >
            Export CSV
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<AddCircleOutlineIcon sx={{ fontSize: 18 }} />}
            onClick={() => { setEditingReport(null); setOpenForm(true); }}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '7px',
              bgcolor: '#0284c7',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
              '&:hover': { bgcolor: '#0369a1' },
            }}
          >
            Add Report
          </Button>
        </Box>
      </Box>

      {notice && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}

      {/* Main Container */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '10px',
          border: '1px solid #dcdfe4',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
          mb: 2,
        }}
      >
        {/* Toolbar: Month Picker, Search, Status, View Mode */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            px: 2,
            py: 1.25,
            borderBottom: '1px solid #edf1f5',
            gap: 1.5,
          }}
        >
          {/* Month Navigation */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setSelectedMonth((prev) => prev.subtract(1, 'month'))}
              sx={{
                p: 0.6,
                color: '#475569',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                '&:hover': { bgcolor: '#f1f5f9' },
              }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>

            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '15px',
                color: '#1e293b',
                px: 1,
                minWidth: 140,
                textAlign: 'center',
                userSelect: 'none',
              }}
            >
              {selectedMonth.format('MMMM YYYY')}
            </Typography>

            <IconButton
              size="small"
              onClick={() => setSelectedMonth((prev) => prev.add(1, 'month'))}
              sx={{
                p: 0.6,
                color: '#475569',
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                '&:hover': { bgcolor: '#f1f5f9' },
              }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>

            <Tooltip title="Jump to Current Month">
              <IconButton
                size="small"
                onClick={() => setSelectedMonth(dayjs())}
                sx={{
                  ml: 0.5,
                  p: 0.6,
                  color: selectedMonth.isSame(dayjs(), 'month') ? '#0284c7' : '#94a3b8',
                  borderRadius: '6px',
                  border: '1px solid #e2e8f0',
                  '&:hover': { bgcolor: '#f1f5f9', color: '#0284c7' },
                }}
              >
                <CalendarMonthIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Search Field */}
          <Box sx={{ flex: 1, maxWidth: 300, minWidth: 180 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search task or description..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(0); }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#94a3b8', fontSize: 18 }} />
                  </InputAdornment>
                ),
                sx: {
                  fontSize: '13px',
                  height: 33,
                  bgcolor: '#f8fafc',
                  borderRadius: '6px',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#cbd5e1' },
                },
              }}
            />
          </Box>

          {/* Status Filter Chips & View Mode */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {[
                { id: 'all', label: 'All' },
                { id: 'reviewed', label: 'Reviewed' },
                { id: 'pending', label: 'Pending' },
              ].map((tab) => (
                <Chip
                  key={tab.id}
                  label={tab.label}
                  size="small"
                  onClick={() => { setStatusFilter(tab.id); setPage(0); }}
                  sx={{
                    fontWeight: 600,
                    fontSize: '12px',
                    cursor: 'pointer',
                    bgcolor: statusFilter === tab.id ? '#0284c7' : '#f1f5f9',
                    color: statusFilter === tab.id ? '#ffffff' : '#475569',
                    '&:hover': {
                      bgcolor: statusFilter === tab.id ? '#0369a1' : '#e2e8f0',
                    },
                  }}
                />
              ))}
            </Box>

            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, next) => next && setViewMode(next)}
              size="small"
              sx={{ height: 32 }}
            >
              <ToggleButton value="table" title="Table View" sx={{ px: 1 }}>
                <ViewListIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
              <ToggleButton value="calendar" title="Monthly Calendar Strip" sx={{ px: 1 }}>
                <ViewModuleIcon sx={{ fontSize: 18 }} />
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Monthly Calendar Strip View */}
        {viewMode === 'calendar' && (
          <Box sx={{ p: 2, bgcolor: '#ffffff' }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
              {selectedMonth.format('MMMM YYYY')} Daily Overview
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: { xs: 'repeat(7, 1fr)', md: 'repeat(14, 1fr)', lg: 'repeat(16, 1fr)' },
                gap: 1,
              }}
            >
              {daysInMonth.map((day) => {
                const hasReport = day.reports.length > 0;
                const isReviewed = hasReport && day.reports.some((r) => r.feedback && r.feedback !== 'Pending');

                return (
                  <Paper
                    key={day.dateKey}
                    variant="outlined"
                    onClick={() => {
                      if (hasReport) {
                        setEditingReport(day.reports[0]);
                        setOpenForm(true);
                      } else {
                        handleAddForDate(day.dateKey);
                      }
                    }}
                    sx={{
                      p: 1,
                      textAlign: 'center',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      bgcolor: day.isToday
                        ? '#e0f2fe'
                        : hasReport
                        ? (isReviewed ? '#ecfdf5' : '#fffbeb')
                        : day.isWeekend
                        ? '#f8fafc'
                        : '#ffffff',
                      borderColor: day.isToday
                        ? '#0284c7'
                        : hasReport
                        ? (isReviewed ? '#a7f3d0' : '#fde68a')
                        : '#e2e8f0',
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.06)',
                      },
                    }}
                  >
                    <Box sx={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>{day.weekday}</Box>
                    <Box sx={{ fontSize: '14px', fontWeight: 800, color: day.isToday ? '#0284c7' : '#0f172a', my: 0.3 }}>
                      {day.dayNumber}
                    </Box>
                    <Box sx={{ height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {hasReport ? (
                        <Chip
                          label={formatHours(day.reports[0].hoursWorked)}
                          size="small"
                          sx={{
                            height: 16,
                            fontSize: '9px',
                            fontWeight: 700,
                            bgcolor: isReviewed ? '#059669' : '#d97706',
                            color: '#ffffff',
                          }}
                        />
                      ) : (
                        <Typography sx={{ fontSize: '10px', color: '#cbd5e1' }}>—</Typography>
                      )}
                    </Box>
                  </Paper>
                );
              })}
            </Box>
          </Box>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <TableContainer sx={{ maxHeight: 'calc(100vh - 360px)' }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 44, bgcolor: '#f8fafc', py: 1 }} />
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b', bgcolor: '#f8fafc', fontSize: '13px' }}>
                    Date
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, color: '#1e293b', bgcolor: '#f8fafc', fontSize: '13px' }}>
                    Task Name
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#1e293b', bgcolor: '#f8fafc', fontSize: '13px' }}>
                    Hours
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: '#1e293b', bgcolor: '#f8fafc', fontSize: '13px' }}>
                    Feedback Status
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: '#1e293b', bgcolor: '#f8fafc', fontSize: '13px' }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5 }}>
                        <AssignmentTurnedInIcon sx={{ fontSize: 42, color: '#cbd5e1' }} />
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#475569' }}>
                          No reports logged for {selectedMonth.format('MMMM YYYY')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, fontSize: '13px' }}>
                          Submit your daily tasks and activities to keep your manager and team in sync.
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<AddCircleOutlineIcon />}
                          onClick={() => { setEditingReport(null); setOpenForm(true); }}
                          sx={{
                            mt: 1,
                            textTransform: 'none',
                            bgcolor: '#0284c7',
                            fontWeight: 700,
                            borderRadius: '7px',
                            '&:hover': { bgcolor: '#0369a1' },
                          }}
                        >
                          Submit Today&apos;s Report
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((report) => {
                    const lines = parseWorkDescription(report.workDescription);
                    const expanded = expandedId === report.id;
                    const isReviewed = report.feedback && report.feedback !== 'Pending';

                    return (
                      <React.Fragment key={report.id}>
                        <TableRow
                          sx={{
                            '&:hover': { bgcolor: '#f8fafc' },
                            transition: 'background-color 0.15s',
                          }}
                        >
                          <TableCell sx={{ py: 1 }}>
                            <IconButton size="small" onClick={() => setExpandedId(expanded ? null : report.id)}>
                              {expanded ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
                            </IconButton>
                          </TableCell>

                          <TableCell sx={{ py: 1 }}>
                            <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                              {formatDate(report.date)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', fontSize: '11px' }}>
                              {dayjs(report.date).format('dddd')}
                            </Typography>
                          </TableCell>

                          <TableCell sx={{ py: 1 }}>
                            <Typography sx={{ fontWeight: 600, fontSize: '13.5px', color: '#0f172a' }}>
                              {report.taskName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '11.5px' }}>
                              {lines.length} task item{lines.length === 1 ? '' : 's'}
                            </Typography>
                          </TableCell>

                          <TableCell align="center" sx={{ py: 1 }}>
                            <Chip
                              icon={<AccessTimeIcon sx={{ fontSize: '14px !important', color: '#0369a1 !important' }} />}
                              label={formatHours(report.hoursWorked)}
                              size="small"
                              sx={{
                                fontWeight: 600,
                                fontSize: '11.5px',
                                bgcolor: '#f0f9ff',
                                color: '#0369a1',
                                border: '1px solid #bae6fd',
                              }}
                            />
                          </TableCell>

                          <TableCell align="center" sx={{ py: 1 }}>
                            <Chip
                              label={isReviewed ? 'Reviewed' : 'Pending Feedback'}
                              size="small"
                              icon={isReviewed ? <CheckCircleIcon sx={{ fontSize: '14px !important', color: '#059669 !important' }} /> : undefined}
                              sx={{
                                fontWeight: 600,
                                fontSize: '11px',
                                bgcolor: isReviewed ? '#ecfdf5' : '#fffbeb',
                                color: isReviewed ? '#059669' : '#b45309',
                                border: '1px solid',
                                borderColor: isReviewed ? '#a7f3d0' : '#fde68a',
                              }}
                            />
                          </TableCell>

                          <TableCell align="right" sx={{ py: 1 }}>
                            <Tooltip title="Edit Report">
                              <IconButton
                                size="small"
                                onClick={() => { setEditingReport(report); setOpenForm(true); }}
                                sx={{ color: '#0284c7', '&:hover': { bgcolor: '#f0f9ff' } }}
                              >
                                <EditOutlinedIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Report">
                              <IconButton
                                size="small"
                                onClick={() => handleDeleted(report.id)}
                                sx={{ color: '#ef4444', '&:hover': { bgcolor: '#fef2f2' } }}
                              >
                                <DeleteOutlineIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>

                        {/* Collapsible Details Row */}
                        <TableRow>
                          <TableCell colSpan={6} sx={{ py: 0, borderBottom: expanded ? '1px solid #e2e8f0' : 0 }}>
                            <Collapse in={expanded} timeout="auto" unmountOnExit>
                              <Box sx={{ py: 2, px: 3, bgcolor: '#f8fafc', borderTop: '1px solid #edf2f7' }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '11px' }}>
                                  Work Breakdown
                                </Typography>
                                <Paper variant="outlined" sx={{ p: 2, mt: 0.75, bgcolor: '#ffffff', borderRadius: '8px', borderColor: '#e2e8f0' }}>
                                  {lines.length ? (
                                    lines.map((line, idx) => (
                                      <Typography key={idx} variant="body2" sx={{ py: 0.35, display: 'flex', gap: 1.25, color: '#334155', fontSize: '13px' }}>
                                        <Box component="span" sx={{ color: '#0284c7', fontWeight: 700, minWidth: 16 }}>{idx + 1}.</Box>
                                        <Box sx={{ flex: 1 }}>{line}</Box>
                                      </Typography>
                                    ))
                                  ) : (
                                    <Typography variant="body2" color="text.secondary">No detailed items recorded.</Typography>
                                  )}
                                </Paper>

                                {/* Manager Feedback Card */}
                                {report.feedback && report.feedback !== 'Pending' ? (
                                  <Box sx={{ mt: 1.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                      <ChatBubbleOutlineIcon sx={{ fontSize: 14 }} /> Manager Feedback
                                    </Typography>
                                    <Box
                                      sx={{
                                        mt: 0.5,
                                        p: 1.75,
                                        borderRadius: '8px',
                                        bgcolor: '#f0fdf4',
                                        border: '1px solid #bbf7d0',
                                        color: '#166534',
                                        fontSize: '13.5px',
                                        lineHeight: 1.5,
                                      }}
                                    >
                                      {report.feedback}
                                    </Box>
                                  </Box>
                                ) : (
                                  <Box sx={{ mt: 1.5, p: 1.25, borderRadius: '6px', bgcolor: '#fffbeb', border: '1px dashed #fde68a' }}>
                                    <Typography variant="caption" sx={{ color: '#92400e', fontStyle: 'italic' }}>
                                      ⏳ Feedback has not yet been submitted by your manager for this report.
                                    </Typography>
                                  </Box>
                                )}
                              </Box>
                            </Collapse>
                          </TableCell>
                        </TableRow>
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Pagination Footer */}
        {viewMode === 'table' && filtered.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 20]}
            component="div"
            count={filtered.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            sx={{ borderTop: '1px solid #edf1f5' }}
          />
        )}
      </Paper>

      {/* Form Dialog for Creating or Editing Report */}
      <WorkReportFormDialog
        open={openForm}
        onClose={() => setOpenForm(false)}
        initialData={editingReport}
        dialogTitle={editingReport?.id ? 'Edit Work Report' : 'Submit Work Report'}
        onSubmitted={() => {
          fetchReports();
          setNotice(editingReport?.id ? 'Report updated successfully' : 'Report submitted successfully');
          setTimeout(() => setNotice(''), 2500);
        }}
      />
    </Box>
  );
};

export default WorkReports;