import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Box, Typography, Paper, TableContainer, Table, TableHead, TableBody, TableRow,
  TableCell, IconButton, Button, MenuItem, Chip, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Alert, Tooltip, Avatar,
  Stack, Checkbox, FormControlLabel, Select, Menu, TextField, InputAdornment,
  Collapse, Fade, Divider, Badge
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SettingsIcon from '@mui/icons-material/Settings';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PushPinIcon from '@mui/icons-material/PushPin';
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import DownloadIcon from '@mui/icons-material/Download';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import TodayIcon from '@mui/icons-material/Today';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import dayjs from 'dayjs';
import axios from '../../api/axios';
import {
  formatDate, formatHours, parseWorkDescription, downloadCSV,
  getEmployeeName, timeToHours,
} from '../../utils/reportUtils';

const QUICK_FEEDBACK_OPTIONS = [
  'Excellent progress today! Keep it up. 👍',
  'All assigned tasks completed satisfactorily. ✅',
  'Great effort, deliverables look solid.',
  'Please provide more detailed breakdown on next report. 📝',
  'Reviewed and approved.',
];

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [attendances, setAttendances] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [showStatistics, setShowStatistics] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [settingsAnchor, setSettingsAnchor] = useState(null);
  const [viewReport, setViewReport] = useState(null);
  const [viewAttendanceOnly, setViewAttendanceOnly] = useState(null);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState('');
  const [savingFeedback, setSavingFeedback] = useState(false);
  const [notice, setNotice] = useState('');
  const [showDueBanner, setShowDueBanner] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [showKpiCards, setShowKpiCards] = useState(true);
  const [collapsedDepts, setCollapsedDepts] = useState({});

  const tableContainerRef = useRef(null);

  // Role detection: Admin sees all, Department Supervisor (Manager) sees only their department
  const userRole = localStorage.getItem('userRole') || 'Employee';
  const userDepartment = localStorage.getItem('userDepartment') || '';
  const isSupervisor = userRole === 'Manager';
  const isAdmin = userRole === 'Admin';

  // Read companyName safely, defaulting to KN Advisors if null or undefined string
  const storedCompany = localStorage.getItem('companyName');
  const companyName =
    !storedCompany || storedCompany === 'null' || storedCompany === 'undefined'
      ? 'KN Advisors'
      : storedCompany;

  // Fetch all reports, users, and attendances for company (and filtered by department for supervisor)
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { companyName };
      if (isSupervisor && userDepartment) {
        params.role = 'Manager';
        params.supervisorDepartment = userDepartment;
      }

      const [reportsRes, usersRes, attendanceRes] = await Promise.all([
        axios.get('/reports', { params }).catch((err) => {
          console.error('Error in /reports:', err);
          return { data: [] };
        }),
        axios.get('/users', { params }).catch((err) => {
          console.error('Error in /users:', err);
          return { data: [] };
        }),
        axios.get('/attendance', { params }).catch((err) => {
          console.error('Error in /attendance:', err);
          return { data: [] };
        }),
      ]);

      setReports(reportsRes.data || []);
      setAttendances(attendanceRes.data || []);
      const activeUsers = (usersRes.data || []).filter((u) => u.exists !== 0);
      setUsers(activeUsers);
    } catch (err) {
      console.error('Error loading reports data:', err);
      setError(err.response?.data?.error || 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, [companyName, isSupervisor, userDepartment]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Days in currently selected month
  const daysInMonth = useMemo(() => {
    const totalDays = selectedMonth.daysInMonth();
    const days = [];
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = selectedMonth.date(d);
      days.push({
        dayNumber: d,
        weekday: dateObj.format('dd'), // 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'
        dateKey: dateObj.format('YYYY-MM-DD'),
        isWeekend: dateObj.day() === 0 || dateObj.day() === 6,
        isToday: dateObj.isSame(dayjs(), 'day'),
      });
    }
    return days;
  }, [selectedMonth]);

  // Unique departments from users + reports + attendances
  const allDepartments = useMemo(() => {
    if (isSupervisor && userDepartment) {
      return [userDepartment];
    }
    const set = new Set();
    users.forEach((u) => {
      const dept = (u.department || '').trim();
      if (dept) set.add(dept);
    });
    reports.forEach((r) => {
      const dept = (r.department || '').trim();
      if (dept) set.add(dept);
    });
    attendances.forEach((a) => {
      const dept = (a.department || '').trim();
      if (dept) set.add(dept);
    });
    return Array.from(set).sort();
  }, [users, reports, attendances, isSupervisor, userDepartment]);

  // Map reports by employee & date for instant O(1) lookup
  const reportsByEmpAndDate = useMemo(() => {
    const map = {};
    reports.forEach((report) => {
      const dateKey = String(report.date || '').slice(0, 10);
      const empId = report.employeeId ? String(report.employeeId).trim().toLowerCase() : '';
      const empName = getEmployeeName(report).trim().toLowerCase();

      if (empId) {
        const key = `${empId}_${dateKey}`;
        if (!map[key]) map[key] = [];
        map[key].push(report);
      }
      if (empName) {
        const nameKey = `${empName}_${dateKey}`;
        if (!map[nameKey]) map[nameKey] = [];
        map[nameKey].push(report);
      }
      if (report.employee?.firstName) {
        const rawName = `${report.employee.firstName} ${report.employee.lastName || ''}`.trim().toLowerCase();
        const rawKey = `${rawName}_${dateKey}`;
        if (!map[rawKey]) map[rawKey] = [];
        map[rawKey].push(report);
      }
    });
    return map;
  }, [reports]);

  // Map attendances (clock in / clock out) by employee & date
  const attendancesByEmpAndDate = useMemo(() => {
    const map = {};
    attendances.forEach((att) => {
      const dateKey = String(att.clockInDate || '').slice(0, 10);
      const empId = att.employeeId ? String(att.employeeId).trim().toLowerCase() : '';
      const fullName = `${att.firstName || ''} ${att.lastName || ''}`.trim().toLowerCase();

      if (empId) {
        map[`${empId}_${dateKey}`] = att;
      }
      if (fullName) {
        map[`${fullName}_${dateKey}`] = att;
      }
    });
    return map;
  }, [attendances]);

  // Group employees by department with search and supervisor filtering
  const groupedDepartments = useMemo(() => {
    const map = {};
    const q = searchQuery.trim().toLowerCase();

    // First populate from users
    users.forEach((user) => {
      const dept = (user.department || '').trim() || 'General';

      // Role check: Department supervisor can only see their department
      if (isSupervisor && userDepartment) {
        if (dept.toLowerCase() !== userDepartment.toLowerCase()) return;
      } else if (departmentFilter !== 'all' && dept !== departmentFilter) {
        return;
      }

      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.employeeId || 'Employee';
      if (q && !fullName.toLowerCase().includes(q) && !(user.designation || '').toLowerCase().includes(q)) {
        return;
      }

      if (!map[dept]) map[dept] = [];
      map[dept].push({
        id: user.id,
        employeeId: user.employeeId || String(user.id),
        name: fullName,
        designation: user.designation,
        department: dept,
        photo: user.photo,
        role: user.role,
      });
    });

    // Also include any employees present in reports who may not be in users table
    reports.forEach((r) => {
      const dept = (r.department || '').trim() || 'General';
      if (isSupervisor && userDepartment) {
        if (dept.toLowerCase() !== userDepartment.toLowerCase()) return;
      } else if (departmentFilter !== 'all' && dept !== departmentFilter) {
        return;
      }

      const name = getEmployeeName(r);
      const empId = r.employeeId ? String(r.employeeId).trim() : name;
      if (q && !name.toLowerCase().includes(q) && !(r.taskName || '').toLowerCase().includes(q)) {
        return;
      }

      if (!map[dept]) map[dept] = [];
      const alreadyExists = map[dept].some(
        (e) => (empId && e.employeeId.toLowerCase() === empId.toLowerCase()) || (name && e.name.toLowerCase() === name.toLowerCase())
      );
      if (!alreadyExists) {
        map[dept].push({
          id: `r-${r.id}`,
          employeeId: empId,
          name,
          designation: r.employee?.designation || '',
          department: dept,
          photo: r.employee?.photo || '',
          role: 'Employee',
        });
      }
    });

    // Sort employees alphabetically
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => a.name.localeCompare(b.name));
    });

    return map;
  }, [users, reports, departmentFilter, searchQuery, isSupervisor, userDepartment]);

  // Month-level KPI metrics
  const monthKpis = useMemo(() => {
    const monthKey = selectedMonth.format('YYYY-MM');
    const monthReports = reports.filter((r) => {
      if (isSupervisor && userDepartment) {
        if ((r.department || '').trim().toLowerCase() !== userDepartment.toLowerCase()) return false;
      }
      return String(r.date || '').slice(0, 7) === monthKey;
    });

    const monthAttendances = attendances.filter((a) => {
      if (isSupervisor && userDepartment) {
        if ((a.department || '').trim().toLowerCase() !== userDepartment.toLowerCase()) return false;
      }
      return String(a.clockInDate || '').slice(0, 7) === monthKey;
    });

    const totalReports = monthReports.length;
    const totalHours = monthReports.reduce((s, r) => s + timeToHours(r.hoursWorked), 0);
    const reviewedCount = monthReports.filter((r) => r.feedback && r.feedback !== 'Pending').length;
    const reviewRate = totalReports > 0 ? Math.round((reviewedCount / totalReports) * 100) : 0;
    const activeContributors = new Set(monthReports.map((r) => r.employeeId || getEmployeeName(r))).size;
    const totalClockIns = monthAttendances.length;

    return {
      totalReports,
      totalHours: formatHours(totalHours),
      reviewRate: `${reviewRate}%`,
      reviewedCount,
      activeContributors,
      totalClockIns,
    };
  }, [reports, attendances, selectedMonth, isSupervisor, userDepartment]);

  // Latest report in current month (for quick banner notification)
  const latestReport = useMemo(() => {
    const monthKey = selectedMonth.format('YYYY-MM');
    const monthReports = reports
      .filter((r) => {
        if (isSupervisor && userDepartment) {
          if ((r.department || '').trim().toLowerCase() !== userDepartment.toLowerCase()) return false;
        }
        return String(r.date || '').slice(0, 7) === monthKey;
      })
      .sort((a, b) => (a.date < b.date ? 1 : -1));
    return monthReports[0] || null;
  }, [reports, selectedMonth, isSupervisor, userDepartment]);

  // Calculate stats for an individual employee
  const getEmployeeStats = useCallback((emp) => {
    const currentMonthKey = selectedMonth.format('YYYY-MM');
    const empReports = reports.filter((r) => {
      const matchId = emp.employeeId && String(r.employeeId).trim().toLowerCase() === String(emp.employeeId).trim().toLowerCase();
      const matchName = emp.name && getEmployeeName(r).toLowerCase() === emp.name.toLowerCase();
      const inMonth = String(r.date || '').slice(0, 7) === currentMonthKey;
      return (matchId || matchName) && inMonth;
    });

    if (empReports.length === 0) {
      return { reportsWithScores: '0%', positiveScores: '0%', count: 0, latestReport: null };
    }

    const withFeedback = empReports.filter((r) => r.feedback && r.feedback !== 'Pending');
    const rateWithScores = Math.round((withFeedback.length / empReports.length) * 100);

    return {
      reportsWithScores: `${rateWithScores}%`,
      positiveScores: `${rateWithScores}%`,
      count: empReports.length,
      latestReport: empReports[0],
    };
  }, [reports, selectedMonth]);

  // Scroll table horizontally to a specific day number
  const scrollToDay = useCallback((dayNum) => {
    if (!tableContainerRef.current) return;
    const targetOffset = Math.max(0, (dayNum - 5) * 52);
    tableContainerRef.current.scrollTo({ left: targetOffset, behavior: 'smooth' });
  }, []);

  // Auto-scroll to today if current month is active
  useEffect(() => {
    if (selectedMonth.isSame(dayjs(), 'month')) {
      const timer = setTimeout(() => {
        scrollToDay(dayjs().date());
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedMonth, scrollToDay]);

  const toggleDeptCollapse = (dept) => {
    setCollapsedDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  const handlePrevMonth = () => {
    setSelectedMonth((prev) => prev.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setSelectedMonth((prev) => prev.add(1, 'month'));
  };

  const openFeedbackDialog = (report) => {
    setFeedbackTarget(report);
    setFeedback(report.feedback && report.feedback !== 'Pending' ? report.feedback : '');
    setFeedbackError('');
  };

  const saveFeedback = async () => {
    if (!feedback.trim()) {
      setFeedbackError('Feedback cannot be empty');
      return;
    }
    setSavingFeedback(true);
    try {
      await axios.put(`/reports/feedback/${feedbackTarget.id}`, {
        employeeId: feedbackTarget.employeeId,
        feedback: feedback.trim(),
      });
      setFeedbackTarget(null);
      if (viewReport && viewReport.id === feedbackTarget.id) {
        setViewReport((prev) => ({ ...prev, feedback: feedback.trim() }));
      }
      fetchData();
      setNotice('Feedback submitted successfully');
      setTimeout(() => setNotice(''), 2500);
    } catch (err) {
      setFeedbackError(err.response?.data?.error || 'Failed to save feedback');
    } finally {
      setSavingFeedback(false);
    }
  };

  const handleExportCSV = () => {
    const monthKey = selectedMonth.format('YYYY-MM');
    const filteredReports = reports.filter((r) => {
      if (isSupervisor && userDepartment) {
        if ((r.department || '').trim().toLowerCase() !== userDepartment.toLowerCase()) return false;
      }
      return String(r.date || '').slice(0, 7) === monthKey;
    });

    const rows = [
      ['Date', 'Employee Name', 'Department', 'Task Name', 'Hours Worked', 'Clock In Time', 'Clock Out Time', 'Work Description', 'Feedback', 'Status'],
      ...filteredReports.map((r) => [
        r.date,
        getEmployeeName(r),
        r.department || '',
        r.taskName || '',
        formatHours(r.hoursWorked),
        r.clockInTime || '',
        r.clockOutTime || '',
        parseWorkDescription(r.workDescription).join(' | '),
        r.feedback && r.feedback !== 'Pending' ? r.feedback : 'Pending',
        r.status || 'Submitted',
      ]),
    ];
    downloadCSV(`work-reports-${monthKey}.csv`, rows);
    setSettingsAnchor(null);
  };

  if (loading && !reports.length && !users.length) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 14 }}>
        <CircularProgress size={44} thickness={4} sx={{ color: '#0284c7', mb: 2 }} />
        <Typography variant="body2" color="text.secondary">Loading work reports & attendance...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: '#f4f7f9', minHeight: '100vh' }}>
      {/* Top Header Section */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.4px',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            Work Reports & Attendance
          </Typography>

          {isSupervisor && (
            <Chip
              label={`${userDepartment} Supervisor View`}
              size="small"
              sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 700, fontSize: '11px' }}
            />
          )}

          {isAdmin && (
            <Chip
              label="Admin · All Departments"
              size="small"
              sx={{ bgcolor: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: '11px' }}
            />
          )}

          <Tooltip title={isPinned ? 'Unpin page' : 'Pin page'}>
            <IconButton
              size="small"
              onClick={() => setIsPinned(!isPinned)}
              sx={{
                p: 0.5,
                color: isPinned ? '#0284c7' : '#94a3b8',
                transform: isPinned ? 'rotate(0deg)' : 'rotate(45deg)',
                transition: 'all 0.2s',
                '&:hover': { color: '#0284c7' },
              }}
            >
              {isPinned ? <PushPinIcon sx={{ fontSize: 19 }} /> : <PushPinOutlinedIcon sx={{ fontSize: 19 }} />}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Header Action Buttons */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon sx={{ fontSize: 16 }} />}
            onClick={fetchData}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '7px',
              borderColor: '#cbd5e1',
              color: '#475569',
              bgcolor: '#ffffff',
              boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
              '&:hover': { bgcolor: '#f8fafc', borderColor: '#94a3b8' },
            }}
          >
            Refresh
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleExportCSV}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '13px',
              borderRadius: '7px',
              bgcolor: '#0284c7',
              boxShadow: '0 2px 6px rgba(2, 132, 199, 0.25)',
              '&:hover': { bgcolor: '#0369a1' },
            }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* KPI Metric Overview Cards */}
      {showKpiCards && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 1.5,
            mb: 2.5,
          }}
        >
          {/* Total Reports */}
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.75,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '8px',
                bgcolor: '#e0f2fe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
              }}
            >
              <AssignmentTurnedInIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '11px' }}>
                Total Reports
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {monthKpis.totalReports}
              </Typography>
            </Box>
          </Paper>

          {/* Clock-Ins Tracked */}
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.75,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '8px',
                bgcolor: '#ecfdf5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#059669',
              }}
            >
              <AccessTimeIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '11px' }}>
                Clock-In Sessions
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {monthKpis.totalClockIns}
              </Typography>
            </Box>
          </Paper>

          {/* Reviewed Rate */}
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.75,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '8px',
                bgcolor: '#fef3c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#d97706',
              }}
            >
              <RateReviewOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '11px' }}>
                Feedback Rate
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {monthKpis.reviewRate}
              </Typography>
            </Box>
          </Paper>

          {/* Active Contributors */}
          <Paper
            elevation={0}
            sx={{
              p: 1.75,
              borderRadius: '10px',
              border: '1px solid #e2e8f0',
              bgcolor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: 1.75,
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
            }}
          >
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: '8px',
                bgcolor: '#f3e8ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#7c3aed',
              }}
            >
              <PeopleAltOutlinedIcon sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px', fontSize: '11px' }}>
                Active Members
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                {monthKpis.activeContributors}
              </Typography>
            </Box>
          </Paper>
        </Box>
      )}

      {/* Latest Report Alert Strip */}
      {latestReport && (
        <Paper
          elevation={0}
          sx={{
            mb: 2,
            px: 2,
            py: 1,
            borderRadius: '8px',
            bgcolor: '#eff6ff',
            border: '1px solid #bfdbfe',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Chip
              label="Latest Submission"
              size="small"
              color="primary"
              sx={{ height: 20, fontSize: '10.5px', fontWeight: 700 }}
            />
            <Typography variant="body2" sx={{ color: '#1e3a8a', fontSize: '13px' }}>
              <strong>{getEmployeeName(latestReport)}</strong> submitted{' '}
              <strong>&ldquo;{latestReport.taskName}&rdquo;</strong> on {formatDate(latestReport.date)} ({formatHours(latestReport.hoursWorked)})
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Button
              size="small"
              variant="outlined"
              startIcon={<VisibilityOutlinedIcon sx={{ fontSize: 15 }} />}
              onClick={() => setViewReport(latestReport)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '12px',
                py: 0.25,
                px: 1.25,
                bgcolor: '#ffffff',
                borderColor: '#93c5fd',
                color: '#1d4ed8',
                '&:hover': { bgcolor: '#f0f9ff', borderColor: '#3b82f6' },
              }}
            >
              View Report
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={() => scrollToDay(parseInt(String(latestReport.date).slice(8, 10), 10) || 1)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '12px',
                py: 0.25,
                px: 1.25,
                bgcolor: '#2563eb',
                '&:hover': { bgcolor: '#1d4ed8' },
              }}
            >
              Scroll to Date ({String(latestReport.date).slice(8, 10)})
            </Button>
          </Box>
        </Paper>
      )}

      {notice && (
        <Alert severity="success" sx={{ mb: 2, borderRadius: '8px' }} onClose={() => setNotice('')}>
          {notice}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: '8px' }}>
          {error}
        </Alert>
      )}

      {/* Main Card Container */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '10px',
          border: '1px solid #dcdfe4',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        }}
      >
        {/* Top Control Bar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            px: 2,
            py: 1.2,
            borderBottom: '1px solid #edf1f5',
            gap: 1.5,
          }}
        >
          {/* Left Navigation: Month Selector + Jump to Today */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={handlePrevMonth}
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
              onClick={handleNextMonth}
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

            {/* Jump to Today Button */}
            <Button
              size="small"
              variant="outlined"
              startIcon={<TodayIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                setSelectedMonth(dayjs());
                scrollToDay(dayjs().date());
              }}
              sx={{
                ml: 1,
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '6px',
                borderColor: '#cbd5e1',
                color: '#0284c7',
                bgcolor: '#f0f9ff',
                py: 0.4,
                '&:hover': { bgcolor: '#e0f2fe', borderColor: '#0284c7' },
              }}
            >
              Today ({dayjs().format('DD MMM')})
            </Button>
          </Box>

          {/* Center Search Filter */}
          <Box sx={{ flex: 1, maxWidth: 280, minWidth: 160 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search employee or task..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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

          {/* Right Controls: Statistics Checkbox, Filter Dropdown, Settings */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={showStatistics}
                  onChange={(e) => setShowStatistics(e.target.checked)}
                  size="small"
                  sx={{
                    color: '#0284c7',
                    '&.Mui-checked': { color: '#0284c7' },
                    p: 0.5,
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: '13px', color: '#334155', fontWeight: 600 }}>
                  Statistics
                </Typography>
              }
              sx={{ mr: 0 }}
            />

            {/* Department selector / supervisor locked badge */}
            {isSupervisor ? (
              <Chip
                label={`Department: ${userDepartment}`}
                size="small"
                sx={{
                  bgcolor: '#f1f5f9',
                  color: '#0f172a',
                  fontWeight: 700,
                  fontSize: '12px',
                  height: 33,
                  px: 1,
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                }}
              />
            ) : (
              <Select
                size="small"
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                displayEmpty
                startAdornment={<FilterAltOutlinedIcon sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />}
                sx={{
                  fontSize: '13px',
                  height: 33,
                  minWidth: 160,
                  bgcolor: '#ffffff',
                  borderRadius: '6px',
                  '& .MuiSelect-select': { py: 0.5, px: 1 },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#dcdfe4' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#94a3b8' },
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '13px', color: '#64748b' }}>
                  not selected
                </MenuItem>
                {allDepartments.map((dept) => (
                  <MenuItem key={dept} value={dept} sx={{ fontSize: '13px' }}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            )}

            {/* Settings Button */}
            <Button
              size="small"
              startIcon={<SettingsIcon sx={{ fontSize: 16 }} />}
              onClick={(e) => setSettingsAnchor(e.currentTarget)}
              sx={{
                fontSize: '13px',
                textTransform: 'none',
                color: '#64748b',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #e2e8f0',
                px: 1.25,
                height: 33,
                '&:hover': { bgcolor: '#f1f5f9', color: '#1e293b' },
              }}
            >
              Settings
            </Button>

            <Menu
              anchorEl={settingsAnchor}
              open={Boolean(settingsAnchor)}
              onClose={() => setSettingsAnchor(null)}
              PaperProps={{ sx: { minWidth: 190, mt: 0.5, borderRadius: '8px', boxShadow: '0 4px 14px rgba(0,0,0,0.08)' } }}
            >
              <MenuItem onClick={handleExportCSV} sx={{ fontSize: '13px', gap: 1.5, py: 1 }}>
                <DownloadIcon fontSize="small" sx={{ color: '#0284c7' }} /> Export CSV
              </MenuItem>
              <MenuItem onClick={() => { setShowKpiCards(!showKpiCards); setSettingsAnchor(null); }} sx={{ fontSize: '13px', gap: 1.5, py: 1 }}>
                <CheckCircleOutlineIcon fontSize="small" sx={{ color: '#64748b' }} />
                {showKpiCards ? 'Hide Overview Cards' : 'Show Overview Cards'}
              </MenuItem>
              <Divider sx={{ my: 0.5 }} />
              <MenuItem onClick={() => { fetchData(); setSettingsAnchor(null); }} sx={{ fontSize: '13px', gap: 1.5, py: 1 }}>
                <RefreshIcon fontSize="small" sx={{ color: '#64748b' }} /> Refresh Data
              </MenuItem>
            </Menu>
          </Box>
        </Box>

        {/* Yellow Notice Banner */}
        {showDueBanner && (
          <Box
            sx={{
              bgcolor: '#fef9e7',
              borderBottom: '1px solid #fbe6a2',
              px: 2,
              py: 0.8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: '12.5px', color: '#856404' }}>
              <WarningAmberIcon sx={{ fontSize: 17, color: '#f59e0b' }} />
              <span>
                A report is due for the following time period:{' '}
                <span
                  style={{ textDecoration: 'underline', fontWeight: 700, cursor: 'pointer', color: '#78350f' }}
                  onClick={() => setSelectedMonth(dayjs())}
                >
                  {selectedMonth.format('MMMM 1')}
                </span>
              </span>
            </Box>

            <IconButton
              size="small"
              onClick={() => setShowDueBanner(false)}
              sx={{ p: 0.3, color: '#a18844' }}
            >
              <CloseIcon sx={{ fontSize: 15 }} />
            </IconButton>
          </Box>
        )}

        {/* Work Reports & Clock-In Matrix Table */}
        <TableContainer
          ref={tableContainerRef}
          sx={{
            maxHeight: 'calc(100vh - 280px)',
            overflowX: 'auto',
            scrollBehavior: 'smooth',
            '&::-webkit-scrollbar': { height: 8, width: 8 },
            '&::-webkit-scrollbar-track': { bgcolor: '#f8fafc' },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 4 },
          }}
        >
          <Table stickyHeader size="small" sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }}>
            <TableHead>
              <TableRow>
                {/* Employee Column Header */}
                <TableCell
                  sx={{
                    bgcolor: '#dff0f8',
                    color: '#1e3a5f',
                    fontWeight: 700,
                    fontSize: '13px',
                    width: 230,
                    minWidth: 230,
                    maxWidth: 230,
                    position: 'sticky',
                    left: 0,
                    zIndex: 4,
                    borderRight: '1.5px solid #cbdde9',
                    borderBottom: '1.5px solid #cbdde9',
                    py: 1,
                    px: 1.5,
                  }}
                >
                  Employee
                </TableCell>

                {/* Statistics Columns */}
                {showStatistics && (
                  <>
                    <TableCell
                      align="center"
                      sx={{
                        bgcolor: '#dff0f8',
                        color: '#1e3a5f',
                        fontWeight: 700,
                        fontSize: '11px',
                        lineHeight: 1.2,
                        width: 90,
                        minWidth: 90,
                        maxWidth: 90,
                        borderRight: '1px solid #cbdde9',
                        borderBottom: '1px solid #cbdde9',
                        px: 0.5,
                        py: 0.75,
                      }}
                    >
                      Rate of reports with scores
                    </TableCell>
                    <TableCell
                      align="center"
                      sx={{
                        bgcolor: '#dff0f8',
                        color: '#1e3a5f',
                        fontWeight: 700,
                        fontSize: '11px',
                        lineHeight: 1.2,
                        width: 90,
                        minWidth: 90,
                        maxWidth: 90,
                        borderRight: '1px solid #cbdde9',
                        borderBottom: '1px solid #cbdde9',
                        px: 0.5,
                        py: 0.75,
                        position: 'relative',
                      }}
                    >
                      Rate of positive scores
                      <IconButton
                        size="small"
                        onClick={() => setShowStatistics(false)}
                        title="Collapse statistics"
                        sx={{
                          position: 'absolute',
                          right: -1,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          p: 0.2,
                          color: '#64748b',
                        }}
                      >
                        <ChevronLeftIcon sx={{ fontSize: 15 }} />
                      </IconButton>
                    </TableCell>
                  </>
                )}

                {/* Date Columns */}
                {daysInMonth.map((day) => (
                  <TableCell
                    key={day.dateKey}
                    align="center"
                    onClick={() => scrollToDay(day.dayNumber)}
                    sx={{
                      bgcolor: day.isToday ? '#e0f2fe' : '#dff0f8',
                      color: '#1e3a5f',
                      fontWeight: 600,
                      width: 52,
                      minWidth: 52,
                      maxWidth: 52,
                      borderRight: '1px solid #cbdde9',
                      borderBottom: '1px solid #cbdde9',
                      px: 0.2,
                      py: 0.6,
                      cursor: 'pointer',
                      userSelect: 'none',
                      transition: 'background-color 0.15s',
                      '&:hover': { bgcolor: '#bae6fd' },
                    }}
                  >
                    <Box
                      sx={{
                        fontSize: '13px',
                        fontWeight: 700,
                        lineHeight: 1.2,
                        color: day.isToday ? '#0284c7' : '#1e3a5f',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 22,
                        height: 22,
                        borderRadius: day.isToday ? '12px' : 0,
                        bgcolor: day.isToday ? '#ffffff' : 'transparent',
                        boxShadow: day.isToday ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                      }}
                    >
                      {day.dayNumber}
                    </Box>
                    <Box
                      sx={{
                        fontSize: '10px',
                        fontWeight: 600,
                        color: day.isWeekend ? '#94a3b8' : '#475569',
                        mt: 0.2,
                      }}
                    >
                      {day.weekday}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {Object.keys(groupedDepartments).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={1 + (showStatistics ? 2 : 0) + daysInMonth.length}
                    align="center"
                    sx={{ py: 8, color: '#64748b', fontSize: '14px' }}
                  >
                    No employee reports or attendance records found matching your view.
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(groupedDepartments).map(([departmentName, departmentEmployees]) => {
                  const isCollapsed = Boolean(collapsedDepts[departmentName]);

                  return (
                    <React.Fragment key={departmentName}>
                      {/* Department Header Row */}
                      <TableRow
                        onClick={() => toggleDeptCollapse(departmentName)}
                        sx={{
                          bgcolor: '#f4f6f8',
                          cursor: 'pointer',
                          userSelect: 'none',
                          '&:hover': { bgcolor: '#edf0f3' },
                        }}
                      >
                        <TableCell
                          colSpan={1 + (showStatistics ? 2 : 0) + daysInMonth.length}
                          sx={{
                            py: 0.8,
                            px: 1.5,
                            fontWeight: 700,
                            fontSize: '11.5px',
                            color: '#334155',
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                            borderTop: '1px solid #e2e8f0',
                            borderBottom: '1px solid #e2e8f0',
                            position: 'sticky',
                            left: 0,
                            zIndex: 2,
                            bgcolor: 'inherit',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'sticky', left: 16 }}>
                            {isCollapsed ? (
                              <KeyboardArrowRightIcon sx={{ fontSize: 18, color: '#0284c7' }} />
                            ) : (
                              <KeyboardArrowDownIcon sx={{ fontSize: 18, color: '#0284c7' }} />
                            )}
                            <Typography sx={{ fontWeight: 800, fontSize: '12px', color: '#0f172a', letterSpacing: '0.4px' }}>
                              DEPARTMENT: {departmentName.toUpperCase()}
                            </Typography>
                            <Chip
                              label={`${departmentEmployees.length} employees`}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: '10px',
                                fontWeight: 700,
                                bgcolor: '#0284c7',
                                color: '#ffffff',
                              }}
                            />
                          </Box>
                        </TableCell>
                      </TableRow>

                      {/* Employee Rows under this Department */}
                      {!isCollapsed &&
                        departmentEmployees.map((emp) => {
                          const stats = showStatistics ? getEmployeeStats(emp) : null;
                          const initials = emp.name
                            .split(' ')
                            .map((p) => p[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase();

                          return (
                            <TableRow
                              key={emp.employeeId || emp.id}
                              sx={{
                                '&:hover': {
                                  bgcolor: '#f8fafc',
                                  '& .sticky-emp-col': { bgcolor: '#f8fafc' },
                                },
                              }}
                            >
                              {/* Sticky Employee Name Column */}
                              <TableCell
                                className="sticky-emp-col"
                                sx={{
                                  py: 1,
                                  px: 1.5,
                                  width: 240,
                                  minWidth: 240,
                                  maxWidth: 240,
                                  position: 'sticky',
                                  left: 0,
                                  zIndex: 2,
                                  bgcolor: '#ffffff',
                                  borderRight: '2px solid #e2e8f0',
                                  borderBottom: '1px solid #edf2f7',
                                  boxShadow: '2px 0 4px rgba(0,0,0,0.02)',
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                  <Avatar
                                    src={emp.photo || ''}
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      bgcolor: '#0284c7',
                                      color: '#ffffff',
                                      flexShrink: 0,
                                    }}
                                  >
                                    {initials}
                                  </Avatar>
                                  <Box sx={{ minWidth: 0, flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                                      <Typography
                                        sx={{
                                          fontSize: '12.5px',
                                          color: '#0b66c3',
                                          fontWeight: 600,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          cursor: 'pointer',
                                          '&:hover': { textDecoration: 'underline' },
                                        }}
                                        title={emp.name}
                                        onClick={() => {
                                          if (stats?.latestReport) {
                                            setViewReport(stats.latestReport);
                                          }
                                        }}
                                      >
                                        {emp.name}
                                      </Typography>

                                      {/* Report count pill if submitted */}
                                      {stats?.count > 0 && (
                                        <Chip
                                          label={`${stats.count} report`}
                                          size="small"
                                          onClick={() => {
                                            if (stats.latestReport) {
                                              const dayN = parseInt(String(stats.latestReport.date).slice(8, 10), 10);
                                              if (dayN) scrollToDay(dayN);
                                            }
                                          }}
                                          sx={{
                                            height: 16,
                                            fontSize: '9.5px',
                                            fontWeight: 700,
                                            bgcolor: '#e0f2fe',
                                            color: '#0369a1',
                                            cursor: 'pointer',
                                            '&:hover': { bgcolor: '#bae6fd' },
                                          }}
                                        />
                                      )}
                                    </Box>

                                    {/* Department & Designation Information */}
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'wrap', mt: 0.35 }}>
                                      <Chip
                                        label={emp.department || 'General'}
                                        size="small"
                                        sx={{
                                          height: 17,
                                          fontSize: '9.5px',
                                          fontWeight: 700,
                                          bgcolor: '#e0f2fe',
                                          color: '#0284c7',
                                          border: '1px solid #bae6fd',
                                          borderRadius: '4px',
                                          px: 0.5,
                                          '& .MuiChip-label': { px: 0.5 },
                                        }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontSize: '10.5px',
                                          color: '#64748b',
                                          display: 'block',
                                          lineHeight: 1.1,
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                        }}
                                      >
                                        {emp.employeeId ? `${emp.employeeId} · ` : ''}{emp.designation || ''}
                                      </Typography>
                                    </Box>
                                  </Box>
                                </Box>
                              </TableCell>

                              {/* Statistics Columns */}
                              {showStatistics && (
                                <>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      color: '#334155',
                                      borderRight: '1px solid #e2e8f0',
                                      borderBottom: '1px solid #edf2f7',
                                      py: 0.75,
                                      px: 0.5,
                                    }}
                                  >
                                    {stats.reportsWithScores}
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      fontSize: '12px',
                                      fontWeight: 500,
                                      color: '#334155',
                                      borderRight: '1px solid #e2e8f0',
                                      borderBottom: '1px solid #edf2f7',
                                      py: 0.75,
                                      px: 0.5,
                                    }}
                                  >
                                    {stats.positiveScores}
                                  </TableCell>
                                </>
                              )}

                              {/* Date Cells: Displays Report & Clock-in status */}
                              {daysInMonth.map((day) => {
                                const eId = emp.employeeId ? String(emp.employeeId).trim().toLowerCase() : '';
                                const eName = emp.name ? emp.name.trim().toLowerCase() : '';
                                const eNum = emp.id ? String(emp.id).trim().toLowerCase() : '';

                                const idKey = eId ? `${eId}_${day.dateKey}` : null;
                                const nameKey = eName ? `${eName}_${day.dateKey}` : null;
                                const numKey = eNum ? `${eNum}_${day.dateKey}` : null;

                                // Check for report
                                let dayReports =
                                  (idKey && reportsByEmpAndDate[idKey]) ||
                                  (nameKey && reportsByEmpAndDate[nameKey]) ||
                                  (numKey && reportsByEmpAndDate[numKey]) ||
                                  [];

                                if (dayReports.length === 0) {
                                  dayReports = reports.filter((r) => {
                                    const rDate = String(r.date || '').slice(0, 10);
                                    if (rDate !== day.dateKey) return false;
                                    const rId = String(r.employeeId || '').trim().toLowerCase();
                                    const rName = getEmployeeName(r).trim().toLowerCase();
                                    return (rId && (rId === eId || rId === eNum)) || (rName && rName === eName);
                                  });
                                }

                                const report = dayReports[0];

                                // Check for clock-in attendance
                                const attendance =
                                  (idKey && attendancesByEmpAndDate[idKey]) ||
                                  (nameKey && attendancesByEmpAndDate[nameKey]) ||
                                  null;

                                return (
                                  <TableCell
                                    key={day.dateKey}
                                    align="center"
                                    sx={{
                                      p: '2px',
                                      height: 38,
                                      borderRight: '1px solid #edf2f7',
                                      borderBottom: '1px solid #edf2f7',
                                      bgcolor: day.isToday
                                        ? '#f0f9ff'
                                        : day.isWeekend
                                        ? '#fafbfc'
                                        : 'transparent',
                                    }}
                                  >
                                    {report ? (
                                      <Tooltip
                                        title={
                                          <Box sx={{ p: 0.5 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                                              {report.taskName || 'Work Report'}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: '#bae6fd', display: 'block' }}>
                                              {formatHours(report.hoursWorked)} worked
                                            </Typography>
                                            {(report.clockInTime || attendance?.clockInTime) && (
                                              <Typography variant="caption" sx={{ color: '#a7f3d0', display: 'block', mt: 0.2 }}>
                                                🕒 In: {report.clockInTime || attendance.clockInTime}
                                                {(report.clockOutTime || attendance?.clockOutTime) ? ` · Out: ${report.clockOutTime || attendance.clockOutTime}` : ' (Active)'}
                                              </Typography>
                                            )}
                                            <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '10px' }}>
                                              Click to view details & feedback
                                            </Typography>
                                          </Box>
                                        }
                                        arrow
                                      >
                                        <Button
                                          size="small"
                                          onClick={() => setViewReport(report)}
                                          sx={{
                                            minWidth: 'auto',
                                            px: 0.75,
                                            py: 0.25,
                                            bgcolor: report.feedback && report.feedback !== 'Pending' ? '#94a3b8' : '#adb5bd',
                                            color: '#ffffff',
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            lineHeight: 1.15,
                                            textTransform: 'none',
                                            borderRadius: '3px',
                                            boxShadow: 'none',
                                            transition: 'all 0.15s ease',
                                            '&:hover': {
                                              bgcolor: '#64748b',
                                              transform: 'translateY(-1px)',
                                              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                                            },
                                          }}
                                        >
                                          Report
                                        </Button>
                                      </Tooltip>
                                    ) : attendance ? (
                                      <Tooltip
                                        title={
                                          <Box sx={{ p: 0.5 }}>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: '#fef08a', display: 'block' }}>
                                              Clocked In ({attendance.clockInTime})
                                            </Typography>
                                            {attendance.clockOutTime ? (
                                              <Typography variant="caption" sx={{ color: '#e2e8f0', display: 'block' }}>
                                                Clocked Out: {attendance.clockOutTime} (Worked: {attendance.workedTime || '—'})
                                              </Typography>
                                            ) : (
                                              <Typography variant="caption" sx={{ color: '#86efac', display: 'block' }}>
                                                Currently Active Shift
                                              </Typography>
                                            )}
                                            <Typography variant="caption" sx={{ color: '#cbd5e1', fontSize: '10px' }}>
                                              Work report not yet submitted
                                            </Typography>
                                          </Box>
                                        }
                                        arrow
                                      >
                                        <Box
                                          onClick={() => setViewAttendanceOnly({ attendance, emp, date: day.dateKey })}
                                          sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            px: 0.6,
                                            py: 0.2,
                                            borderRadius: '3px',
                                            bgcolor: '#fef3c7',
                                            color: '#92400e',
                                            fontSize: '10px',
                                            fontWeight: 700,
                                            border: '1px solid #fde68a',
                                            cursor: 'pointer',
                                            lineHeight: 1.1,
                                            '&:hover': { bgcolor: '#fde68a' },
                                          }}
                                        >
                                          🕒 {attendance.clockInTime ? attendance.clockInTime.slice(0, 5) : 'In'}
                                        </Box>
                                      </Tooltip>
                                    ) : null}
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Report Details Dialog */}
      <Dialog
        open={!!viewReport}
        onClose={() => setViewReport(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1.5,
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentTurnedInIcon sx={{ color: '#0284c7', fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '17px' }}>
              Work Report Details
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setViewReport(null)} sx={{ color: '#64748b' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 2.5 }}>
          {viewReport && (
            <Stack spacing={2.5}>
              {/* Employee Info Card */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  p: 1.75,
                  bgcolor: '#f8fafc',
                  borderRadius: '10px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Avatar
                  src={viewReport.employee?.photo || ''}
                  sx={{ width: 48, height: 48, bgcolor: '#0284c7', fontWeight: 800, fontSize: 17 }}
                >
                  {getEmployeeName(viewReport).split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>
                    {getEmployeeName(viewReport)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12.5px' }}>
                    {[viewReport.employee?.designation, viewReport.department].filter(Boolean).join(' · ')}
                  </Typography>
                </Box>
              </Box>

              {/* Quick Tags */}
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={formatDate(viewReport.date)}
                  size="small"
                  sx={{ fontWeight: 600, bgcolor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}
                />
                <Chip
                  icon={<AccessTimeIcon sx={{ fontSize: '15px !important', color: '#047857 !important' }} />}
                  label={`${formatHours(viewReport.hoursWorked)} worked`}
                  size="small"
                  sx={{ fontWeight: 600, bgcolor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}
                />
                <Chip
                  label={!viewReport.feedback || viewReport.feedback === 'Pending' ? 'Feedback Pending' : 'Reviewed'}
                  size="small"
                  sx={{
                    fontWeight: 600,
                    bgcolor: !viewReport.feedback || viewReport.feedback === 'Pending' ? '#fffbeb' : '#f0fdf4',
                    color: !viewReport.feedback || viewReport.feedback === 'Pending' ? '#b45309' : '#15803d',
                    border: '1px solid',
                    borderColor: !viewReport.feedback || viewReport.feedback === 'Pending' ? '#fde68a' : '#bbf7d0',
                  }}
                />
              </Box>

              {/* Clock In / Clock Out Attendance Details */}
              {(viewReport.clockInTime || viewReport.clockOutTime) && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: '8px',
                    bgcolor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>
                      Clock In
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                      {viewReport.clockInTime || '—'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>
                      Clock Out
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#0f172a' }}>
                      {viewReport.clockOutTime || 'Active session'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>
                      Recorded Duration
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#0284c7' }}>
                      {formatHours(viewReport.hoursWorked)}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Task Name */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.4px' }}>
                  Task Name
                </Typography>
                <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', mt: 0.25 }}>
                  {viewReport.taskName}
                </Typography>
              </Box>

              {/* Work Description List */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.4px' }}>
                  Work Description
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    mt: 0.75,
                    bgcolor: '#fafbfc',
                    borderRadius: '8px',
                    borderColor: '#e2e8f0',
                    maxHeight: 220,
                    overflowY: 'auto',
                  }}
                >
                  {parseWorkDescription(viewReport.workDescription).length === 0 ? (
                    <Typography variant="body2" color="text.secondary">No detailed items provided.</Typography>
                  ) : (
                    parseWorkDescription(viewReport.workDescription).map((line, i) => (
                      <Typography key={i} variant="body2" sx={{ py: 0.35, display: 'flex', gap: 1.25, color: '#334155', fontSize: '13px' }}>
                        <Box component="span" sx={{ color: '#0284c7', fontWeight: 700, minWidth: 16 }}>{i + 1}.</Box>
                        <Box sx={{ flex: 1 }}>{line}</Box>
                      </Typography>
                    ))
                  )}
                </Paper>
              </Box>

              {/* Feedback Section */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.4px' }}>
                    Manager Feedback
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<SendIcon sx={{ fontSize: 13 }} />}
                    onClick={() => openFeedbackDialog(viewReport)}
                    sx={{ textTransform: 'none', fontSize: '12px', fontWeight: 600, color: '#0284c7' }}
                  >
                    {viewReport.feedback && viewReport.feedback !== 'Pending' ? 'Edit Feedback' : 'Give Feedback'}
                  </Button>
                </Box>
                {viewReport.feedback && viewReport.feedback !== 'Pending' ? (
                  <Box
                    sx={{
                      bgcolor: '#f0fdf4',
                      color: '#166534',
                      p: 1.75,
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0',
                      fontSize: '13.5px',
                      lineHeight: 1.5,
                    }}
                  >
                    {viewReport.feedback}
                  </Box>
                ) : (
                  <Box
                    sx={{
                      p: 1.75,
                      borderRadius: '8px',
                      border: '1px dashed #cbd5e1',
                      bgcolor: '#f8fafc',
                      textAlign: 'center',
                    }}
                  >
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', fontSize: '13px' }}>
                      No feedback has been submitted for this report yet.
                    </Typography>
                  </Box>
                )}
              </Box>
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5, borderTop: '1px solid #e2e8f0' }}>
          <Button
            onClick={() => setViewReport(null)}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              color: '#475569',
              borderRadius: '6px',
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attendance Only Info Dialog (When clocked in but report not yet submitted) */}
      <Dialog
        open={!!viewAttendanceOnly}
        onClose={() => setViewAttendanceOnly(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px' } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>
            Attendance Record
          </Typography>
          <IconButton size="small" onClick={() => setViewAttendanceOnly(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ py: 2 }}>
          {viewAttendanceOnly && (
            <Stack spacing={1.5}>
              <Typography variant="body2" sx={{ color: '#334155' }}>
                Employee: <strong>{viewAttendanceOnly.emp?.name}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155' }}>
                Date: <strong>{formatDate(viewAttendanceOnly.date)}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155' }}>
                Clock In: <strong>{viewAttendanceOnly.attendance?.clockInTime || '—'}</strong>
              </Typography>
              <Typography variant="body2" sx={{ color: '#334155' }}>
                Clock Out: <strong>{viewAttendanceOnly.attendance?.clockOutTime || 'Active session'}</strong>
              </Typography>
              {viewAttendanceOnly.attendance?.workedTime && (
                <Typography variant="body2" sx={{ color: '#334155' }}>
                  Worked Time: <strong>{viewAttendanceOnly.attendance?.workedTime}</strong>
                </Typography>
              )}
              <Alert severity="info" sx={{ mt: 1, fontSize: '12.5px' }}>
                This employee clocked in on this date, but has not yet submitted their daily work report.
              </Alert>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 2.5, py: 1.5 }}>
          <Button onClick={() => setViewAttendanceOnly(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Give / Edit Feedback Dialog */}
      <Dialog
        open={!!feedbackTarget}
        onClose={() => setFeedbackTarget(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1.5,
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a', fontSize: '17px' }}>
            Provide Feedback
          </Typography>
          <IconButton size="small" onClick={() => setFeedbackTarget(null)} sx={{ color: '#64748b' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ py: 2.5 }}>
          {feedbackTarget && (
            <Stack spacing={2}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '13px' }}>
                Feedback for <strong>{getEmployeeName(feedbackTarget)}</strong> on {formatDate(feedbackTarget.date)} ({feedbackTarget.taskName})
              </Typography>

              {/* Quick Feedback Suggestions */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', mb: 0.5, display: 'block' }}>
                  Quick templates:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {QUICK_FEEDBACK_OPTIONS.map((tmpl, idx) => (
                    <Chip
                      key={idx}
                      label={tmpl}
                      size="small"
                      onClick={() => setFeedback(tmpl)}
                      sx={{
                        fontSize: '11px',
                        cursor: 'pointer',
                        bgcolor: '#f1f5f9',
                        '&:hover': { bgcolor: '#e2e8f0' },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <TextField
                label="Feedback Message"
                multiline
                rows={3}
                value={feedback}
                onChange={(e) => { setFeedback(e.target.value); setFeedbackError(''); }}
                placeholder="Write actionable comments or assessment..."
                error={!!feedbackError}
                helperText={feedbackError}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '8px',
                  },
                }}
              />
            </Stack>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.75, borderTop: '1px solid #e2e8f0' }}>
          <Button
            color="inherit"
            onClick={() => setFeedbackTarget(null)}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={saveFeedback}
            disabled={savingFeedback}
            startIcon={savingFeedback ? <CircularProgress size={16} color="inherit" /> : <SendIcon sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              bgcolor: '#0284c7',
              borderRadius: '7px',
              '&:hover': { bgcolor: '#0369a1' },
            }}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Reports;