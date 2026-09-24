import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from '../../api/axios';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, Chip, CircularProgress, Box, TablePagination,
  FormControl, Select, MenuItem, TextField, InputAdornment, Button,
  Avatar, Tooltip, Stack, Alert, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, ToggleButtonGroup, ToggleButton, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TodayIcon from '@mui/icons-material/Today';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import ViewListIcon from '@mui/icons-material/ViewList';
import CloseIcon from '@mui/icons-material/Close';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import dayjs from 'dayjs';
import { downloadCSV, formatHours, formatDate } from '../../utils/reportUtils';

const Attendance = () => {
  const [attendances, setAttendances] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // View Controls
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' (Department Matrix like Work Reports) or 'list' (Chronological table)
  const [selectedMonth, setSelectedMonth] = useState(dayjs());
  const [deptFilter, setDeptFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedDepts, setCollapsedDepts] = useState({});
  const [detailModal, setDetailModal] = useState(null);
  const [leaves, setLeaves] = useState([]);

  // List View Pagination & Filters
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState('all'); // 'all', 'today', 'week', 'month'

  const tableContainerRef = useRef(null);

  // User Role & Context
  const userRole = localStorage.getItem('userRole') || 'Employee';
  const departmentRole = localStorage.getItem('departmentRole') || 'Member';
  const userDepartment = localStorage.getItem('userDepartment') || '';
  const userEmployeeId = localStorage.getItem('userEmployeeId') || '';
  const isAdmin = userRole.toLowerCase() === 'admin' || userRole.toLowerCase() === 'hr';
  const isSupervisor = !isAdmin && (departmentRole === 'Supervisor' || userRole === 'Manager');
  const isEmployee = !isAdmin && !isSupervisor;

  const storedCompany = localStorage.getItem('companyName');
  const companyName =
    !storedCompany || storedCompany === 'null' || storedCompany === 'undefined'
      ? 'KN Advisors'
      : storedCompany;

  // Fetch Attendance, Users, Reports, and Approved Leaves
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { companyName };
      if (isAdmin) {
        params.role = 'Admin';
      } else if (isSupervisor && userDepartment) {
        params.role = 'Manager';
        params.departmentRole = departmentRole;
        params.supervisorDepartment = userDepartment;
      } else if (isEmployee && userEmployeeId) {
        params.role = 'Employee';
        params.employeeId = userEmployeeId;
      }

      const from = selectedMonth.startOf('month').format('YYYY-MM-DD');
      const to = selectedMonth.endOf('month').format('YYYY-MM-DD');

      const [attRes, usersRes, reportsRes, leavesRes] = await Promise.all([
        axios.get('/attendance', { params }).catch((err) => {
          console.error('Error fetching attendance:', err);
          return { data: [] };
        }),
        axios.get('/users', { params }).catch((err) => {
          console.error('Error fetching users:', err);
          return { data: [] };
        }),
        axios.get('/reports', { params }).catch((err) => {
          console.error('Error fetching reports:', err);
          return { data: [] };
        }),
        axios.get('/leaves/calendar', { params: { companyName, from, to } }).catch((err) => {
          console.error('Error in /leaves/calendar:', err);
          return { data: [] };
        }),
      ]);

      setAttendances(attRes.data || []);
      const activeUsers = (usersRes.data || []).filter((u) => u.exists !== 0);
      setUsers(activeUsers);
      setReports(reportsRes.data || []);
      setLeaves(leavesRes.data || []);
    } catch (error) {
      console.error('Error loading attendance data:', error);
    } finally {
      setLoading(false);
    }
  }, [companyName, isAdmin, isSupervisor, departmentRole, userDepartment, isEmployee, userEmployeeId, selectedMonth]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Days in selected month
  const daysInMonth = useMemo(() => {
    const total = selectedMonth.daysInMonth();
    const days = [];
    for (let d = 1; d <= total; d++) {
      const dateObj = selectedMonth.date(d);
      days.push({
        dayNumber: d,
        weekday: dateObj.format('dd'), // 'Mo', 'Tu', 'We', etc.
        dateKey: dateObj.format('YYYY-MM-DD'),
        isWeekend: dateObj.day() === 0 || dateObj.day() === 6,
        isToday: dateObj.isSame(dayjs(), 'day'),
      });
    }
    return days;
  }, [selectedMonth]);

  // Unique departments for filter dropdown
  const departments = useMemo(() => {
    if (isSupervisor && userDepartment) return [userDepartment];
    const set = new Set();
    users.forEach((u) => {
      const d = (u.department || '').trim();
      if (d && d !== 'null' && d !== 'undefined') set.add(d);
    });
    attendances.forEach((a) => {
      const d = (a.department || '').trim();
      if (d && d !== 'null' && d !== 'undefined') set.add(d);
    });
    return Array.from(set).sort();
  }, [users, attendances, isSupervisor, userDepartment]);

  // Map attendances for O(1) instant cell lookup: key = `${empId}_${dateKey}` and `${name}_${dateKey}`
  const attendancesByEmpAndDate = useMemo(() => {
    const map = {};
    attendances.forEach((att) => {
      const dateKey = String(att.clockInDate || '').slice(0, 10);
      const empId = att.employeeId ? String(att.employeeId).trim().toLowerCase() : '';
      const fullName = `${att.firstName || ''} ${att.lastName || ''}`.trim().toLowerCase();

      if (empId && dateKey) {
        map[`${empId}_${dateKey}`] = att;
      }
      if (fullName && dateKey) {
        map[`${fullName}_${dateKey}`] = att;
      }
    });
    return map;
  }, [attendances]);

  // Map reports for O(1) instant lookup
  const reportsByEmpAndDate = useMemo(() => {
    const map = {};
    reports.forEach((rep) => {
      const dateKey = String(rep.date || '').slice(0, 10);
      const empId = rep.employeeId ? String(rep.employeeId).trim().toLowerCase() : '';
      const empName = `${rep.firstName || ''} ${rep.lastName || ''}`.trim().toLowerCase();

      if (empId && dateKey) {
        map[`${empId}_${dateKey}`] = rep;
      }
      if (empName && dateKey) {
        map[`${empName}_${dateKey}`] = rep;
      }
    });
    return map;
  }, [reports]);

  // Map approved leaves for O(1) instant lookup
  const leavesByEmpAndDate = useMemo(() => {
    const map = {};
    leaves.forEach((leave) => {
      const empId = leave.employeeId ? String(leave.employeeId).trim().toLowerCase() : '';
      const empName = (leave.employee_name || (leave.employee ? `${leave.employee.firstName || ''} ${leave.employee.lastName || ''}`.trim() : '')).trim().toLowerCase();
      const start = dayjs(leave.start_date);
      const end = dayjs(leave.end_date);
      let curr = start;
      while (curr.isBefore(end) || curr.isSame(end, 'day')) {
        const dateKey = curr.format('YYYY-MM-DD');
        if (empId) map[`${empId}_${dateKey}`] = leave;
        if (empName) map[`${empName}_${dateKey}`] = leave;
        curr = curr.add(1, 'day');
      }
    });
    return map;
  }, [leaves]);

  // Grouped employees by department for Matrix View
  const groupedDepartments = useMemo(() => {
    const map = {};
    const q = searchQuery.trim().toLowerCase();
    const seenEmpIds = new Set();

    // Group from users
    users.forEach((user) => {
      const dept = (user.department || '').trim() || 'General';

      // Role check: supervisor only sees their department
      if (isSupervisor && userDepartment) {
        if (dept.toLowerCase() !== userDepartment.toLowerCase()) return;
      } else if (deptFilter !== 'all' && dept.toLowerCase() !== deptFilter.toLowerCase()) {
        return;
      }

      // If employee, only include the logged-in employee
      if (isEmployee && userEmployeeId) {
        if (String(user.employeeId || '').toLowerCase() !== userEmployeeId.toLowerCase()) return;
      }

      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.employeeId || 'Employee';
      const empId = (user.employeeId || '').trim().toLowerCase();
      const desig = (user.designation || '').toLowerCase();

      if (q && !fullName.toLowerCase().includes(q) && !empId.includes(q) && !desig.includes(q)) {
        return;
      }

      if (empId) seenEmpIds.add(empId);

      if (!map[dept]) map[dept] = [];
      map[dept].push({
        id: user.id,
        employeeId: user.employeeId || String(user.id),
        name: fullName,
        designation: user.designation,
        department: dept,
        photo: user.photo,
        role: user.role,
        departmentRole: user.departmentRole || 'Member',
      });
    });

    // Also include any employees found in attendance who might not be in the users table
    attendances.forEach((att) => {
      const empId = (att.employeeId || '').trim().toLowerCase();
      // If employee is already grouped from users, never duplicate them into another department
      if (empId && seenEmpIds.has(empId)) return;

      const dept = (att.department || '').trim() || 'General';

      if (isSupervisor && userDepartment) {
        if (dept.toLowerCase() !== userDepartment.toLowerCase()) return;
      } else if (deptFilter !== 'all' && dept.toLowerCase() !== deptFilter.toLowerCase()) {
        return;
      }

      if (isEmployee && userEmployeeId) {
        if (String(att.employeeId || '').toLowerCase() !== userEmployeeId.toLowerCase()) return;
      }

      const fullName = `${att.firstName || ''} ${att.lastName || ''}`.trim() || att.employeeId || 'Employee';
      const desig = (att.designation || '').toLowerCase();

      if (q && !fullName.toLowerCase().includes(q) && !empId.includes(q) && !desig.includes(q)) {
        return;
      }

      if (empId) seenEmpIds.add(empId);

      if (!map[dept]) map[dept] = [];
      map[dept].push({
        id: att.id,
        employeeId: att.employeeId,
        name: fullName,
        designation: att.designation,
        department: dept,
        photo: null,
        role: 'Employee',
      });
    });

    // Sort employees alphabetically by name
    Object.keys(map).forEach((d) => {
      map[d].sort((a, b) => a.name.localeCompare(b.name));
    });

    return map;
  }, [users, attendances, isSupervisor, userDepartment, isEmployee, userEmployeeId, deptFilter, searchQuery]);

  // Horizontal scroll to a specific day number in Matrix View
  const scrollToDay = useCallback((dayNum) => {
    if (!tableContainerRef.current) return;
    const targetOffset = Math.max(0, (dayNum - 4) * 60);
    tableContainerRef.current.scrollTo({ left: targetOffset, behavior: 'smooth' });
  }, []);

  // Auto-scroll to today if current month is selected
  useEffect(() => {
    if (viewMode === 'matrix' && selectedMonth.isSame(dayjs(), 'month')) {
      const timer = setTimeout(() => {
        scrollToDay(dayjs().date());
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [viewMode, selectedMonth, scrollToDay]);

  // Calculate monthly stats for a specific employee
  const getEmployeeMonthStats = useCallback((emp) => {
    const monthKey = selectedMonth.format('YYYY-MM');
    const empId = emp.employeeId ? String(emp.employeeId).trim().toLowerCase() : '';
    const empName = emp.name ? emp.name.trim().toLowerCase() : '';

    const monthRecords = attendances.filter((a) => {
      const aDate = String(a.clockInDate || '').slice(0, 7);
      if (aDate !== monthKey) return false;
      const aId = String(a.employeeId || '').trim().toLowerCase();
      const aName = `${a.firstName || ''} ${a.lastName || ''}`.trim().toLowerCase();
      return empId ? aId === empId : (empName && aName === empName);
    });

    let totalSeconds = 0;
    monthRecords.forEach((a) => {
      if (a.workedTime && typeof a.workedTime === 'string') {
        const parts = a.workedTime.split(':').map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
          totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
    });

    const totalHoursNum = totalSeconds / 3600;
    const hrs = Math.floor(totalHoursNum);
    const mins = Math.round((totalHoursNum - hrs) * 60);
    const formattedHours = `${hrs}h ${mins}m`;

    return {
      totalShifts: monthRecords.length,
      totalHours: formattedHours,
    };
  }, [attendances, selectedMonth]);

  // Month-level High-level KPIs
  const monthKpis = useMemo(() => {
    const monthKey = selectedMonth.format('YYYY-MM');
    const monthRecords = attendances.filter((a) => {
      if (isSupervisor && userDepartment) {
        if ((a.department || '').trim().toLowerCase() !== userDepartment.toLowerCase()) return false;
      } else if (deptFilter !== 'all') {
        if ((a.department || '').trim().toLowerCase() !== deptFilter.toLowerCase()) return false;
      }
      if (isEmployee && userEmployeeId) {
        if ((a.employeeId || '').trim().toLowerCase() !== userEmployeeId.toLowerCase()) return false;
      }
      return String(a.clockInDate || '').slice(0, 7) === monthKey;
    });

    const totalClockIns = monthRecords.length;
    const currentlyActive = monthRecords.filter((a) => !a.clockOutTime).length;
    const completedSessions = monthRecords.filter((a) => a.clockOutTime).length;
    const uniqueEmployees = new Set(monthRecords.map((a) => a.employeeId || `${a.firstName}_${a.lastName}`)).size;

    let totalSeconds = 0;
    monthRecords.forEach((a) => {
      if (a.workedTime && typeof a.workedTime === 'string') {
        const parts = a.workedTime.split(':').map(Number);
        if (parts.length === 3 && !parts.some(isNaN)) {
          totalSeconds += parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      }
    });

    const totalHoursNum = totalSeconds / 3600;
    const hrs = Math.floor(totalHoursNum);
    const mins = Math.round((totalHoursNum - hrs) * 60);
    const formattedTotalHours = `${hrs}h ${mins}m`;
    const avgHoursPerDay = totalClockIns > 0 ? (totalHoursNum / totalClockIns).toFixed(1) + 'h' : '0h';

    return {
      totalClockIns,
      currentlyActive,
      completedSessions,
      uniqueEmployees,
      formattedTotalHours,
      avgHoursPerDay,
    };
  }, [attendances, selectedMonth, isSupervisor, userDepartment, deptFilter, isEmployee, userEmployeeId]);

  // Filtered records for List View
  const filteredList = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const q = searchQuery.trim().toLowerCase();

    return attendances
      .filter((item) => {
        if (isEmployee && userEmployeeId) {
          return (item.employeeId || '').toLowerCase() === userEmployeeId.toLowerCase();
        }
        if (isSupervisor && userDepartment) {
          return (item.department || '').trim().toLowerCase() === userDepartment.trim().toLowerCase();
        }
        if (deptFilter !== 'all') {
          return (item.department || '').trim().toLowerCase() === deptFilter.trim().toLowerCase();
        }
        return true;
      })
      .filter((item) => {
        if (!item.clockInDate) return true;
        const recordDate = new Date(item.clockInDate);

        if (dateFilter === 'today') {
          return (
            recordDate.getDate() === today.getDate() &&
            recordDate.getMonth() === today.getMonth() &&
            recordDate.getFullYear() === today.getFullYear()
          );
        } else if (dateFilter === 'week') {
          return recordDate >= startOfWeek && recordDate <= today;
        } else if (dateFilter === 'month') {
          return recordDate >= startOfMonth && recordDate <= today;
        }
        return true;
      })
      .filter((item) => {
        if (!q) return true;
        const fullName = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase();
        const empId = (item.employeeId || '').toLowerCase();
        const dept = (item.department || '').toLowerCase();
        const d = (item.clockInDate || '').toLowerCase();
        return fullName.includes(q) || empId.includes(q) || dept.includes(q) || d.includes(q);
      });
  }, [attendances, isEmployee, userEmployeeId, isSupervisor, userDepartment, deptFilter, dateFilter, searchQuery]);

  const paginatedList = filteredList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const toggleDeptCollapse = (dept) => {
    setCollapsedDepts((prev) => ({ ...prev, [dept]: !prev[dept] }));
  };

  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Employee ID', 'Employee Name', 'Department', 'Designation', 'Clock In Time', 'Clock Out Time', 'Worked Time', 'Status'],
      ...filteredList.map((a) => [
        a.clockInDate || '',
        a.employeeId || '',
        `${a.firstName || ''} ${a.lastName || ''}`.trim(),
        a.department || '',
        a.designation || '',
        a.clockInTime || '',
        a.clockOutTime || '',
        a.workedTime || (a.clockOutTime ? '-' : 'Active'),
        a.clockOutTime ? 'Completed' : 'Working',
      ]),
    ];
    const filename = isEmployee
      ? `my-attendance-${selectedMonth.format('YYYY-MM')}.csv`
      : `attendance-${selectedMonth.format('YYYY-MM')}.csv`;
    downloadCSV(filename, rows);
  };

  const todayDateStr = dayjs().format('YYYY-MM-DD');
  const myTodayRecord = useMemo(() => {
    const normId = userEmployeeId ? String(userEmployeeId).trim().toLowerCase() : '';
    const myEmail = (localStorage.getItem('userEmail') || '').toLowerCase();
    return attendances.find((a) => {
      const aDate = a.clockInDate || (a.date ? dayjs(a.date).format('YYYY-MM-DD') : '');
      if (aDate !== todayDateStr) return false;
      const aId = a.employeeId ? String(a.employeeId).trim().toLowerCase() : '';
      if (normId && aId && aId === normId) return true;
      const aEmail = a.employeeEmail ? a.employeeEmail.toLowerCase() : '';
      if (myEmail && aEmail && aEmail === myEmail) return true;
      return false;
    }) || null;
  }, [attendances, userEmployeeId, todayDateStr]);

  return (
    <Box sx={{ p: { xs: 1.5, md: 3 }, bgcolor: '#F3F6FB', minHeight: '100vh' }}>
      {/* Top Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5, flexWrap: 'wrap', gap: 1.5 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#1B2A5B', letterSpacing: '-0.4px', display: 'flex', alignItems: 'center', gap: 1 }}>
            Time & Attendance
            {isEmployee && (
              <Chip
                label={`My Records · ${userEmployeeId || 'Employee'}`}
                size="small"
                sx={{ bgcolor: '#EEF2FF', color: '#14286D', border: '1px solid #DDE4FF', fontWeight: 700, fontSize: '11px' }}
              />
            )}
            {isSupervisor && (
              <Chip
                label={`${userDepartment} Supervisor View`}
                size="small"
                sx={{ bgcolor: '#EEF2FF', color: '#14286D', border: '1px solid #DDE4FF', fontWeight: 700, fontSize: '11px' }}
              />
            )}
            {isAdmin && (
              <Chip
                label="Admin View · All Departments"
                size="small"
                sx={{ bgcolor: '#F6F8FE', color: '#14286D', border: '1px solid #DDE4FF', fontWeight: 700, fontSize: '11px' }}
              />
            )}
          </Typography>
          <Typography variant="body2" sx={{ color: '#66708C', fontSize: '13px', mt: 0.25 }}>
            {isEmployee
              ? 'View your daily clock-in, clock-out times, worked hours, and shift history.'
              : isSupervisor
              ? `Department matrix view of clock-in, clock-out, and daily work times for ${userDepartment} employees.`
              : "Organization-wide department matrix view of daily clock-in, clock-out, and work times across all teams."}
          </Typography>
        </Box>

        {/* Top Header Controls: Refresh, Export, View Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(_, next) => next && setViewMode(next)}
            size="small"
            sx={{
              bgcolor: '#ffffff',
              height: 33,
              border: '1px solid #DDE4FF',
              '& .Mui-selected': { bgcolor: '#14286D !important', color: '#ffffff !important' },
            }}
          >
            <ToggleButton value="matrix" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '12px', px: 1.2 }}>
              <CalendarViewMonthIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Matrix View
            </ToggleButton>
            <ToggleButton value="list" sx={{ textTransform: 'none', fontWeight: 600, fontSize: '12px', px: 1.2 }}>
              <ViewListIcon sx={{ fontSize: 16, mr: 0.5 }} />
              Detailed List
            </ToggleButton>
          </ToggleButtonGroup>

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
              borderColor: '#DDE4FF',
              color: '#14286D',
              bgcolor: '#ffffff',
              height: 33,
              '&:hover': { bgcolor: '#EEF2FF', borderColor: '#14286D' },
            }}
          >
            Refresh
          </Button>

          <Button
            size="small"
            variant="contained"
            startIcon={<DownloadIcon sx={{ fontSize: 16 }} />}
            onClick={handleExportCSV}
            disabled={!filteredList.length}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '7px',
              bgcolor: '#14286D',
              boxShadow: '0 2px 6px rgba(20, 40, 109, 0.25)',
              height: 33,
              '&:hover': { bgcolor: '#0F1F58' },
            }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Today's Shift Card */}
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          p: 2,
          borderRadius: '12px',
          border: '1px solid #E2E8F0',
          bgcolor: '#ffffff',
          boxShadow: '0 2px 8px rgba(20, 40, 109, 0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '10px',
              bgcolor: myTodayRecord
                ? myTodayRecord.clockOutTime
                  ? '#ecfdf5'
                  : '#f0fdf4'
                : '#f8fafc',
              border: `1px solid ${
                myTodayRecord
                  ? myTodayRecord.clockOutTime
                    ? '#a7f3d0'
                    : '#86efac'
                  : '#e2e8f0'
              }`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: myTodayRecord
                ? myTodayRecord.clockOutTime
                  ? '#059669'
                  : '#16a34a'
                : '#64748b',
            }}
          >
            {myTodayRecord && myTodayRecord.clockOutTime ? (
              <CheckCircleOutlineIcon sx={{ fontSize: 24 }} />
            ) : (
              <AccessTimeIcon sx={{ fontSize: 24 }} />
            )}
          </Box>

          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                Today's Shift: {dayjs().format('dddd, MMMM D, YYYY')}
              </Typography>
              <Chip
                label="Single Shift Mode"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '10.5px',
                  fontWeight: 700,
                  bgcolor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                }}
              />
              {myTodayRecord ? (
                myTodayRecord.clockOutTime ? (
                  <Chip
                    label="Shift Completed"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 700,
                      bgcolor: '#ecfdf5',
                      color: '#047857',
                      border: '1px solid #a7f3d0',
                    }}
                  />
                ) : (
                  <Chip
                    label="Shift In Progress"
                    size="small"
                    sx={{
                      height: 20,
                      fontSize: '11px',
                      fontWeight: 700,
                      bgcolor: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #86efac',
                    }}
                  />
                )
              ) : (
                <Chip
                  label="Not Clocked In"
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '11px',
                    fontWeight: 700,
                    bgcolor: '#f8fafc',
                    color: '#64748b',
                    border: '1px solid #e2e8f0',
                  }}
                />
              )}
            </Box>

            <Typography sx={{ fontSize: '12.5px', color: '#64748b', mt: 0.3 }}>
              {myTodayRecord ? (
                myTodayRecord.clockOutTime
                  ? `Shift recorded: Clocked in at ${myTodayRecord.clockInTime?.slice(0, 5)} · Clocked out at ${myTodayRecord.clockOutTime?.slice(0, 5)} · Total worked: ${myTodayRecord.workedTime || '—'}`
                  : `Currently working: Clocked in at ${myTodayRecord.clockInTime?.slice(0, 5)}. Use the top navigation bar to manage your active shift or clock out.`
              ) : (
                'You have not clocked in for today yet. Use the top navigation bar "Clock In" button to begin your single daily shift.'
              )}
            </Typography>
          </Box>
        </Box>

        {myTodayRecord && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography sx={{ fontSize: '11px', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                {myTodayRecord.clockOutTime ? 'Shift Duration' : 'Clock-In'}
              </Typography>
              <Typography sx={{ fontSize: '15px', fontWeight: 800, color: '#14286D' }}>
                {myTodayRecord.clockOutTime
                  ? myTodayRecord.workedTime || 'Completed'
                  : myTodayRecord.clockInTime?.slice(0, 5) || 'Active'}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Main Container Card */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '12px',
          border: '1px solid #EDF0F7',
          bgcolor: '#ffffff',
          overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(20, 40, 109, 0.04)',
        }}
      >
        {/* Toolbar: Month Navigation, Search, Department Filter */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            px: 2,
            py: 1.25,
            borderBottom: '1px solid #EDF0F7',
            gap: 1.5,
          }}
        >
          {/* Month Selector + Jump to Today (For Matrix View) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconButton
              size="small"
              onClick={() => setSelectedMonth((prev) => prev.subtract(1, 'month'))}
              sx={{ p: 0.6, color: '#14286D', borderRadius: '6px', border: '1px solid #DDE4FF', '&:hover': { bgcolor: '#EEF2FF' } }}
            >
              <ChevronLeftIcon fontSize="small" />
            </IconButton>

            <Typography sx={{ fontWeight: 700, fontSize: '14.5px', color: '#1B2A5B', px: 1, minWidth: 140, textAlign: 'center', userSelect: 'none' }}>
              {selectedMonth.format('MMMM YYYY')}
            </Typography>

            <IconButton
              size="small"
              onClick={() => setSelectedMonth((prev) => prev.add(1, 'month'))}
              sx={{ p: 0.6, color: '#14286D', borderRadius: '6px', border: '1px solid #DDE4FF', '&:hover': { bgcolor: '#EEF2FF' } }}
            >
              <ChevronRightIcon fontSize="small" />
            </IconButton>

            <Button
              size="small"
              variant="outlined"
              startIcon={<TodayIcon sx={{ fontSize: 16 }} />}
              onClick={() => {
                setSelectedMonth(dayjs());
                if (viewMode === 'matrix') scrollToDay(dayjs().date());
              }}
              sx={{
                ml: 1,
                fontSize: '12px',
                fontWeight: 700,
                textTransform: 'none',
                borderRadius: '6px',
                borderColor: '#DDE4FF',
                color: '#14286D',
                bgcolor: '#EEF2FF',
                py: 0.4,
                '&:hover': { bgcolor: '#DDE4FF', borderColor: '#14286D' },
              }}
            >
              Today ({dayjs().format('DD MMM')})
            </Button>
          </Box>

          {/* Search Field */}
          <Box sx={{ flex: 1, maxWidth: 300, minWidth: 180 }}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search employee, ID, or dept..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
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

          {/* Department selector (Admin only) / Supervisor Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {isAdmin && (
              <Select
                size="small"
                value={deptFilter}
                onChange={(e) => { setDeptFilter(e.target.value); setPage(0); }}
                displayEmpty
                startAdornment={<FilterAltOutlinedIcon sx={{ fontSize: 16, color: '#94a3b8', mr: 0.5 }} />}
                sx={{
                  fontSize: '13px',
                  height: 33,
                  minWidth: 160,
                  bgcolor: '#ffffff',
                  borderRadius: '6px',
                  '& .MuiSelect-select': { py: 0.5, px: 1 },
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '13px' }}>All Departments</MenuItem>
                {departments.map((d) => (
                  <MenuItem key={d} value={d} sx={{ fontSize: '13px' }}>{d}</MenuItem>
                ))}
              </Select>
            )}

            {isSupervisor && (
              <Chip
                label={`Department: ${userDepartment}`}
                size="small"
                sx={{ bgcolor: '#f1f5f9', color: '#0f172a', fontWeight: 700, fontSize: '12px', height: 33, px: 1, borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            )}

            {/* List View Date Quick Filter (only shown in List View) */}
            {viewMode === 'list' && (
              <Select
                size="small"
                value={dateFilter}
                onChange={(e) => { setDateFilter(e.target.value); setPage(0); }}
                sx={{
                  fontSize: '13px',
                  height: 33,
                  minWidth: 130,
                  bgcolor: '#ffffff',
                  borderRadius: '6px',
                  '& .MuiSelect-select': { py: 0.5, px: 1 },
                }}
              >
                <MenuItem value="all" sx={{ fontSize: '13px' }}>All Dates</MenuItem>
                <MenuItem value="today" sx={{ fontSize: '13px' }}>Today</MenuItem>
                <MenuItem value="week" sx={{ fontSize: '13px' }}>This Week</MenuItem>
                <MenuItem value="month" sx={{ fontSize: '13px' }}>This Month</MenuItem>
              </Select>
            )}
          </Box>
        </Box>

        {/* ======================================================= */}
        {/* VIEW 1: BITRIX24-STYLE DEPARTMENT MONTHLY MATRIX VIEW    */}
        {/* ======================================================= */}
        {viewMode === 'matrix' ? (
          <TableContainer
            ref={tableContainerRef}
            sx={{
              maxHeight: 'calc(100vh - 350px)',
              overflowX: 'auto',
              position: 'relative',
            }}
          >
            <Table stickyHeader size="small" sx={{ borderCollapse: 'separate', minWidth: '100%' }}>
              <TableHead>
                <TableRow>
                  {/* Sticky Employee Profile Column */}
                  <TableCell
                    sx={{
                      fontWeight: 700,
                      color: '#14286D',
                      bgcolor: '#F6F8FE',
                      fontSize: '13px',
                      py: 1,
                      px: 2,
                      width: 250,
                      minWidth: 250,
                      maxWidth: 250,
                      position: 'sticky',
                      left: 0,
                      zIndex: 4,
                      borderRight: '1.5px solid #E8ECF5',
                      borderBottom: '1.5px solid #E8ECF5',
                    }}
                  >
                    Employee
                  </TableCell>

                  {/* Monthly Summary Column */}
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: 700,
                      color: '#14286D',
                      bgcolor: '#F6F8FE',
                      fontSize: '12px',
                      py: 1,
                      px: 1,
                      width: 100,
                      minWidth: 100,
                      borderRight: '1.5px solid #E8ECF5',
                      borderBottom: '1.5px solid #E8ECF5',
                    }}
                  >
                    Month Total
                  </TableCell>

                  {/* Day Columns (1..31) */}
                  {daysInMonth.map((day) => (
                    <TableCell
                      key={day.dateKey}
                      align="center"
                      onClick={() => scrollToDay(day.dayNumber)}
                      sx={{
                        bgcolor: day.isToday ? '#EEF2FF' : '#F6F8FE',
                        color: '#14286D',
                        fontWeight: 600,
                        width: 58,
                        minWidth: 58,
                        maxWidth: 58,
                        borderRight: '1px solid #E8ECF5',
                        borderBottom: '1.5px solid #E8ECF5',
                        px: 0.2,
                        py: 0.6,
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background-color 0.15s',
                        '&:hover': { bgcolor: '#E0E7FF' },
                      }}
                    >
                      <Box
                        sx={{
                          fontSize: '13px',
                          fontWeight: 700,
                          lineHeight: 1.2,
                          color: day.isToday ? '#ffffff' : '#14286D',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 22,
                          height: 22,
                          borderRadius: day.isToday ? '12px' : 0,
                          bgcolor: day.isToday ? '#14286D' : 'transparent',
                          boxShadow: day.isToday ? '0 1px 3px rgba(20,40,109,0.3)' : 'none',
                        }}
                      >
                        {day.dayNumber}
                      </Box>
                      <Box sx={{ fontSize: '10px', fontWeight: 600, color: day.isWeekend ? '#94a3b8' : '#475569', mt: 0.2 }}>
                        {day.weekday}
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>

              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={2 + daysInMonth.length} align="center" sx={{ py: 8 }}>
                      <CircularProgress size={32} />
                    </TableCell>
                  </TableRow>
                ) : Object.keys(groupedDepartments).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2 + daysInMonth.length} align="center" sx={{ py: 8, color: '#64748b', fontSize: '14px' }}>
                      No employee attendance records found matching your selection.
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
                            bgcolor: '#F6F8FE',
                            cursor: 'pointer',
                            userSelect: 'none',
                            '&:hover': { bgcolor: '#EEF2FF' },
                          }}
                        >
                          <TableCell
                            colSpan={2 + daysInMonth.length}
                            sx={{
                              py: 0.8,
                              px: 1.5,
                              fontWeight: 700,
                              fontSize: '12px',
                              color: '#14286D',
                              textTransform: 'uppercase',
                              letterSpacing: '0.4px',
                              borderTop: '1px solid #E8ECF5',
                              borderBottom: '1px solid #E8ECF5',
                              position: 'sticky',
                              left: 0,
                              zIndex: 2,
                              bgcolor: 'inherit',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, position: 'sticky', left: 16 }}>
                              {isCollapsed ? (
                                <KeyboardArrowRightIcon sx={{ fontSize: 18, color: '#14286D' }} />
                              ) : (
                                <KeyboardArrowDownIcon sx={{ fontSize: 18, color: '#14286D' }} />
                              )}
                              <Typography sx={{ fontWeight: 800, fontSize: '12px', color: '#14286D', letterSpacing: '0.4px' }}>
                                DEPARTMENT: {departmentName.toUpperCase()}
                              </Typography>
                              <Chip
                                label={`${departmentEmployees.length} employees`}
                                size="small"
                                sx={{ height: 18, fontSize: '10px', fontWeight: 700, bgcolor: '#14286D', color: '#ffffff' }}
                              />
                            </Box>
                          </TableCell>
                        </TableRow>

                        {/* Employee Rows under this Department */}
                        {!isCollapsed &&
                          departmentEmployees.map((emp) => {
                            const stats = getEmployeeMonthStats(emp);
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
                                    bgcolor: '#F8FAFD',
                                    '& .sticky-emp-col': { bgcolor: '#F8FAFD' },
                                  },
                                }}
                              >
                                {/* Sticky Employee Name Column */}
                                <TableCell
                                  className="sticky-emp-col"
                                  sx={{
                                    py: 1,
                                    px: 1.75,
                                    width: 250,
                                    minWidth: 250,
                                    maxWidth: 250,
                                    position: 'sticky',
                                    left: 0,
                                    zIndex: 2,
                                    bgcolor: '#ffffff',
                                    borderRight: '1.5px solid #EDF0F7',
                                    borderBottom: '1px solid #EDF0F7',
                                    boxShadow: '2px 0 4px rgba(20,40,109,0.02)',
                                  }}
                                >
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                    <Avatar
                                      sx={{
                                        width: 28,
                                        height: 28,
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        bgcolor: '#14286D',
                                        color: '#ffffff',
                                        flexShrink: 0,
                                      }}
                                    >
                                      {initials}
                                    </Avatar>
                                    <Box sx={{ minWidth: 0, flex: 1 }}>
                                      <Typography
                                        sx={{
                                          fontSize: '13px',
                                          fontWeight: 600,
                                          color: '#1B2A5B',
                                          lineHeight: 1.2,
                                          whiteSpace: 'nowrap',
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                        }}
                                      >
                                        {emp.name}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, flexWrap: 'nowrap', mt: 0.35, minWidth: 0, overflow: 'hidden' }}>
                                        <Chip
                                          label={emp.department || 'General'}
                                          size="small"
                                          sx={{
                                            height: 18,
                                            fontSize: '9.5px',
                                            fontWeight: 700,
                                            bgcolor: '#EEF2FF',
                                            color: '#14286D',
                                            border: '1px solid #DDE4FF',
                                            borderRadius: '4px',
                                            flexShrink: 0,
                                            px: 0.5,
                                            '& .MuiChip-label': { px: 0.5 },
                                          }}
                                        />
                                        {emp.departmentRole === 'Supervisor' && (
                                          <Chip
                                            label="Supervisor"
                                            size="small"
                                            sx={{
                                              height: 18,
                                              fontSize: '9.5px',
                                              fontWeight: 700,
                                              bgcolor: '#ECFDF5',
                                              color: '#047857',
                                              border: '1px solid #A7F3D0',
                                              borderRadius: '4px',
                                              flexShrink: 0,
                                              px: 0.5,
                                              '& .MuiChip-label': { px: 0.5 },
                                            }}
                                          />
                                        )}
                                        <Typography
                                          variant="caption"
                                          sx={{
                                            fontSize: '11px',
                                            color: '#66708C',
                                            lineHeight: 1.1,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            minWidth: 0,
                                            flex: 1,
                                          }}
                                          title={emp.designation || ''}
                                        >
                                          {emp.designation || ''}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                </TableCell>

                                {/* Month Total Worked Time */}
                                <TableCell
                                  align="center"
                                  sx={{
                                    py: 1,
                                    px: 0.75,
                                    borderRight: '1.5px solid #EDF0F7',
                                    borderBottom: '1px solid #EDF0F7',
                                  }}
                                >
                                  <Chip
                                    label={stats.totalHours}
                                    size="small"
                                    sx={{
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      bgcolor: stats.totalShifts > 0 ? '#ecfdf5' : '#f1f5f9',
                                      color: stats.totalShifts > 0 ? '#047857' : '#94a3b8',
                                      height: 22,
                                    }}
                                  />
                                </TableCell>

                                {/* Date Cells: Daily Clock-In / Clock-Out Work Times */}
                                {daysInMonth.map((day) => {
                                  const eId = emp.employeeId ? String(emp.employeeId).trim().toLowerCase() : '';
                                  const eName = emp.name ? emp.name.trim().toLowerCase() : '';

                                  const idKey = eId ? `${eId}_${day.dateKey}` : null;
                                  const nameKey = eName ? `${eName}_${day.dateKey}` : null;

                                  const att =
                                    (idKey && attendancesByEmpAndDate[idKey]) ||
                                    (!eId && nameKey && attendancesByEmpAndDate[nameKey]) ||
                                    null;

                                  const report =
                                    (idKey && reportsByEmpAndDate[idKey]) ||
                                    (!eId && nameKey && reportsByEmpAndDate[nameKey]) ||
                                    null;

                                  const leave =
                                    (idKey && leavesByEmpAndDate[idKey]) ||
                                    (!eId && nameKey && leavesByEmpAndDate[nameKey]) ||
                                    null;

                                  const isCompleted = att && att.clockOutTime;
                                  const isActiveWorking = att && !att.clockOutTime;

                                  return (
                                    <TableCell
                                      key={day.dateKey}
                                      align="center"
                                      sx={{
                                        p: '3px',
                                        height: 42,
                                        width: 58,
                                        minWidth: 58,
                                        maxWidth: 58,
                                        verticalAlign: 'middle',
                                        borderRight: '1px solid #EDF0F7',
                                        borderBottom: '1px solid #EDF0F7',
                                        bgcolor: day.isToday
                                          ? '#EEF2FF'
                                          : day.isWeekend
                                          ? '#F9FAFB'
                                          : 'transparent',
                                      }}
                                    >
                                      {isCompleted ? (
                                        <Tooltip
                                          title={
                                            <Box sx={{ p: 0.5, fontSize: '11.5px' }}>
                                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#f8fafc', display: 'block' }}>
                                                {formatDate(day.dateKey)} · Completed Shift
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: '#86efac', display: 'block', mt: 0.3 }}>
                                                🟢 Clock In: <b>{att.clockInTime}</b>
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: '#fca5a5', display: 'block' }}>
                                                🔴 Clock Out: <b>{att.clockOutTime}</b>
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: '#93c5fd', display: 'block', mt: 0.2 }}>
                                                ⏱️ Worked: <b>{att.workedTime}</b>
                                              </Typography>
                                              {report ? (
                                                <Typography variant="caption" sx={{ color: '#86efac', display: 'block', mt: 0.3, fontWeight: 700 }}>
                                                  📝 Report: {report.taskName} ({formatHours(report.hoursWorked)})
                                                </Typography>
                                              ) : (
                                                <Typography variant="caption" sx={{ color: '#fca5a5', display: 'block', mt: 0.3, fontWeight: 700 }}>
                                                  ⚠️ Report Not Yet Submitted
                                                </Typography>
                                              )}
                                              <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', mt: 0.5, fontSize: '10px' }}>
                                                Click to view full shift details
                                              </Typography>
                                            </Box>
                                          }
                                          arrow
                                        >
                                          <Box
                                            onClick={() => setDetailModal({ attendance: att, employee: emp, date: day.dateKey, report })}
                                            sx={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              px: 0.5,
                                              py: 0.3,
                                              borderRadius: '4px',
                                              bgcolor: !report ? '#fffbeb' : '#EEF2FF',
                                              border: !report ? '1px solid #fde68a' : '1px solid #DDE4FF',
                                              cursor: 'pointer',
                                              transition: 'all 0.15s ease',
                                              '&:hover': {
                                                bgcolor: !report ? '#fef3c7' : '#E0E7FF',
                                                transform: 'scale(1.04)',
                                                boxShadow: '0 2px 5px rgba(20, 40, 109, 0.15)',
                                              },
                                            }}
                                          >
                                            <Typography sx={{ fontSize: '10px', fontWeight: 800, color: !report ? '#b45309' : '#14286D', lineHeight: 1.1 }}>
                                              {att.workedTime ? att.workedTime.slice(0, 5) : 'Done'}
                                            </Typography>
                                            {!report ? (
                                              <Typography
                                                sx={{
                                                  fontSize: '7.5px',
                                                  fontWeight: 800,
                                                  color: '#b45309',
                                                  bgcolor: '#fef3c7',
                                                  px: 0.3,
                                                  py: 0.1,
                                                  borderRadius: '2px',
                                                  border: '0.5px solid #fde68a',
                                                  mt: 0.2,
                                                  lineHeight: 1,
                                                  whiteSpace: 'nowrap',
                                                }}
                                              >
                                                No Report
                                              </Typography>
                                            ) : (
                                              <Typography sx={{ fontSize: '8.5px', color: '#14286D', lineHeight: 1.1, mt: 0.2 }}>
                                                {att.clockInTime ? att.clockInTime.slice(0, 5) : ''}
                                              </Typography>
                                            )}
                                          </Box>
                                        </Tooltip>
                                      ) : isActiveWorking ? (
                                        <Tooltip
                                          title={
                                            <Box sx={{ p: 0.5, fontSize: '11.5px' }}>
                                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#86efac', display: 'block' }}>
                                                Active Working Now
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: '#f8fafc', display: 'block', mt: 0.3 }}>
                                                🟢 Clock In: <b>{att.clockInTime}</b>
                                              </Typography>
                                              {!report && (
                                                <Typography variant="caption" sx={{ color: '#fca5a5', display: 'block', mt: 0.3, fontWeight: 700 }}>
                                                  ⚠️ Report Not Yet Submitted
                                                </Typography>
                                              )}
                                              <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', mt: 0.5, fontSize: '10px' }}>
                                                Click to view details
                                              </Typography>
                                            </Box>
                                          }
                                          arrow
                                        >
                                          <Box
                                            onClick={() => setDetailModal({ attendance: att, employee: emp, date: day.dateKey, report })}
                                            sx={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              px: 0.5,
                                              py: 0.3,
                                              borderRadius: '4px',
                                              bgcolor: '#ecfdf5',
                                              border: '1px solid #a7f3d0',
                                              cursor: 'pointer',
                                              transition: 'all 0.15s ease',
                                              '&:hover': {
                                                bgcolor: '#d1fae5',
                                                transform: 'scale(1.04)',
                                              },
                                            }}
                                          >
                                            <Typography sx={{ fontSize: '9.5px', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
                                              Active
                                            </Typography>
                                            <Typography sx={{ fontSize: '8.5px', color: '#047857', lineHeight: 1.1, mt: 0.2 }}>
                                              {att.clockInTime ? att.clockInTime.slice(0, 5) : ''}
                                            </Typography>
                                          </Box>
                                        </Tooltip>
                                      ) : leave ? (
                                        <Tooltip
                                          title={
                                            <Box sx={{ p: 0.5, fontSize: '11.5px' }}>
                                              <Typography variant="caption" sx={{ fontWeight: 800, color: '#fca5a5', display: 'block' }}>
                                                {formatDate(day.dateKey)} · On Leave (Approved)
                                              </Typography>
                                              <Typography variant="caption" sx={{ color: '#ffffff', display: 'block', mt: 0.2 }}>
                                                Leave Type: {leave.leave_type || 'Leave'} {leave.half_day ? `(${leave.half_day_session || 'Half Day'})` : ''}
                                              </Typography>
                                              {leave.reason && (
                                                <Typography variant="caption" sx={{ color: '#cbd5e1', display: 'block', mt: 0.2, fontStyle: 'italic' }}>
                                                  &ldquo;{leave.reason}&rdquo;
                                                </Typography>
                                              )}
                                              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 0.3, fontSize: '10px' }}>
                                                {formatDate(leave.start_date)} to {formatDate(leave.end_date)}
                                              </Typography>
                                            </Box>
                                          }
                                          arrow
                                        >
                                          <Box
                                            onClick={() => setDetailModal({ leave, employee: emp, date: day.dateKey, isLeave: true })}
                                            sx={{
                                              display: 'flex',
                                              flexDirection: 'column',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              px: 0.3,
                                              py: 0.3,
                                              borderRadius: '4px',
                                              bgcolor: '#fef2f2',
                                              border: '1px solid #fecaca',
                                              cursor: 'pointer',
                                              transition: 'all 0.15s ease',
                                              '&:hover': {
                                                bgcolor: '#fee2e2',
                                                borderColor: '#f87171',
                                                transform: 'scale(1.04)',
                                              },
                                            }}
                                          >
                                            <Typography sx={{ fontSize: '9px', fontWeight: 800, color: '#dc2626', lineHeight: 1.1 }}>
                                              On Leave
                                            </Typography>
                                            <Typography sx={{ fontSize: '7.5px', color: '#ef4444', lineHeight: 1.1, mt: 0.2 }}>
                                              {leave.leave_type ? leave.leave_type.slice(0, 7) : 'Approved'}
                                            </Typography>
                                          </Box>
                                        </Tooltip>
                                      ) : (
                                        <Typography sx={{ fontSize: '11px', color: day.isWeekend ? '#cbd5e1' : '#e2e8f0', userSelect: 'none' }}>
                                          —
                                        </Typography>
                                      )}
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
        ) : (
          /* ======================================================= */
          /* VIEW 2: DETAILED CHRONOLOGICAL LIST VIEW (TABLE)        */
          /* ======================================================= */
          <>
            <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
              <Table stickyHeader size="small" sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
                <TableHead>
                  <TableRow>
                    {!isEmployee && (
                      <>
                        <TableCell align="left" sx={{ fontWeight: 700, color: '#14286D', bgcolor: '#F6F8FE', fontSize: '13px', py: 1.25, borderBottom: '1.5px solid #E8ECF5' }}>
                          Employee
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: '#14286D', bgcolor: '#F6F8FE', fontSize: '13px', py: 1.25, width: 140, borderBottom: '1.5px solid #E8ECF5' }}>
                          Department
                        </TableCell>
                      </>
                    )}
                    <TableCell align={isEmployee ? 'left' : 'center'} sx={{ fontWeight: 700, color: '#14286D', bgcolor: '#F6F8FE', fontSize: '13px', py: 1.25, width: 140, borderBottom: '1.5px solid #E8ECF5' }}>
                      Date
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#14286D', bgcolor: '#F6F8FE', fontSize: '13px', py: 1.25, width: 130, borderBottom: '1.5px solid #E8ECF5' }}>
                      Clock In Time
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#14286D', bgcolor: '#F6F8FE', fontSize: '13px', py: 1.25, width: 130, borderBottom: '1.5px solid #E8ECF5' }}>
                      Clock Out Time
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#14286D', bgcolor: '#F6F8FE', fontSize: '13px', py: 1.25, width: 140, borderBottom: '1.5px solid #E8ECF5' }}>
                      Worked Duration
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#14286D', bgcolor: '#F6F8FE', fontSize: '13px', py: 1.25, width: 140, borderBottom: '1.5px solid #E8ECF5' }}>
                      Shift Status
                    </TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700, color: '#14286D', bgcolor: '#F6F8FE', fontSize: '13px', py: 1.25, width: 130, borderBottom: '1.5px solid #E8ECF5' }}>
                      Work Report
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={isEmployee ? 6 : 8} align="center" sx={{ py: 8 }}>
                        <CircularProgress size={32} />
                      </TableCell>
                    </TableRow>
                  ) : paginatedList.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isEmployee ? 6 : 8} align="center" sx={{ py: 8, color: '#64748b', fontSize: '14px' }}>
                        No attendance records found for this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedList.map((item) => {
                      const isActive = !item.clockOutTime;
                      const fullName = `${item.firstName || ''} ${item.lastName || ''}`.trim() || item.employeeId || 'Employee';
                      const initials = fullName
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .slice(0, 2)
                        .toUpperCase();
                      const itemDate = String(item.clockInDate || '').slice(0, 10);
                      const eId = item.employeeId ? String(item.employeeId).trim().toLowerCase() : '';
                      const eName = fullName.trim().toLowerCase();
                      const rep = (eId && reportsByEmpAndDate[`${eId}_${itemDate}`]) || (eName && reportsByEmpAndDate[`${eName}_${itemDate}`]) || null;

                      return (
                        <TableRow
                          key={item.id}
                          hover
                          onClick={() => setDetailModal({ attendance: item, employee: { name: fullName, employeeId: item.employeeId, department: item.department, designation: item.designation }, date: item.clockInDate, report: rep })}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#F8FAFD' } }}
                        >
                          {!isEmployee && (
                            <>
                              <TableCell align="left" sx={{ py: 1.25 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                                  <Avatar sx={{ width: 30, height: 30, fontSize: '11px', fontWeight: 700, bgcolor: '#14286D', color: '#ffffff' }}>
                                    {initials}
                                  </Avatar>
                                  <Box sx={{ minWidth: 0 }}>
                                    <Typography sx={{ fontSize: '13px', fontWeight: 600, color: '#1B2A5B' }}>
                                      {fullName}
                                    </Typography>
                                    {item.designation && (
                                      <Typography variant="caption" sx={{ fontSize: '11px', color: '#66708C', display: 'block' }}>
                                        {item.designation}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              </TableCell>

                              <TableCell align="center" sx={{ py: 1.25 }}>
                                <Chip
                                  label={item.department || 'General'}
                                  size="small"
                                  sx={{
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    bgcolor: '#EEF2FF',
                                    color: '#14286D',
                                    border: '1px solid #DDE4FF',
                                    borderRadius: '4px',
                                  }}
                                />
                              </TableCell>
                            </>
                          )}

                          <TableCell align={isEmployee ? 'left' : 'center'} sx={{ py: 1.25, fontSize: '13px', fontWeight: 600, color: '#1B2A5B' }}>
                            {item.clockInDate ? formatDate(item.clockInDate) : '—'}
                          </TableCell>

                          <TableCell align="center" sx={{ py: 1 }}>
                            <Chip
                              label={item.clockInTime || '—'}
                              size="small"
                              sx={{ fontSize: '12px', fontWeight: 700, bgcolor: '#ecfdf5', color: '#047857' }}
                            />
                          </TableCell>

                          <TableCell align="center" sx={{ py: 1 }}>
                            {item.clockOutTime ? (
                              <Chip
                                label={item.clockOutTime}
                                size="small"
                                sx={{ fontSize: '12px', fontWeight: 600, bgcolor: '#f1f5f9', color: '#475569' }}
                              />
                            ) : (
                              <Chip
                                label="Working Now"
                                size="small"
                                sx={{ fontSize: '11px', fontWeight: 700, bgcolor: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                              />
                            )}
                          </TableCell>

                          <TableCell align="center" sx={{ py: 1, fontSize: '13px', fontWeight: 700, color: '#1B2A5B' }}>
                            {item.workedTime || (isActive ? 'In session' : '—')}
                          </TableCell>

                          <TableCell align="center" sx={{ py: 1 }}>
                            <Chip
                              label={isActive ? 'Active Working' : 'Completed'}
                              size="small"
                              sx={{
                                height: 22,
                                fontSize: '11px',
                                fontWeight: 700,
                                bgcolor: isActive ? '#ecfdf5' : '#f8fafc',
                                color: isActive ? '#059669' : '#64748b',
                                border: '1px solid',
                                borderColor: isActive ? '#a7f3d0' : '#e2e8f0',
                              }}
                            />
                          </TableCell>

                          <TableCell align="center" sx={{ py: 1 }}>
                            {rep ? (
                              <Chip
                                label="Submitted"
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  bgcolor: '#ecfdf5',
                                  color: '#047857',
                                  border: '1px solid #a7f3d0',
                                }}
                              />
                            ) : (
                              <Chip
                                label="Not Yet Submitted"
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  bgcolor: '#fffbeb',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 20, 50]}
              component="div"
              count={filteredList.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
              sx={{ borderTop: '1px solid #EDF0F7' }}
            />
          </>
        )}
      </Paper>

      {/* ======================================================= */}
      {/* SHIFT & ATTENDANCE / LEAVE DETAIL DIALOG                */}
      {/* ======================================================= */}
      <Dialog
        open={Boolean(detailModal)}
        onClose={() => setDetailModal(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '12px', p: 1 } }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {detailModal?.isLeave ? (
              <>
                <EventBusyIcon sx={{ color: '#dc2626', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#dc2626' }}>
                  Approved Leave Details
                </Typography>
              </>
            ) : (
              <>
                <AccessTimeIcon sx={{ color: '#14286D', fontSize: 24 }} />
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1B2A5B' }}>
                  Attendance & Shift Details
                </Typography>
              </>
            )}
          </Box>
          <IconButton size="small" onClick={() => setDetailModal(null)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ py: 2 }}>
          {detailModal && (
            detailModal.isLeave ? (
              <Stack spacing={2}>
                {/* Employee Summary Card */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: '#fef2f2', borderColor: '#fecaca', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 44, height: 44, bgcolor: '#dc2626', fontWeight: 700, fontSize: '15px' }}>
                    {(detailModal.employee?.name || 'E')
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#1B2A5B' }}>
                      {detailModal.employee?.name}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#66708C', fontSize: '12px' }}>
                      ID: {detailModal.employee?.employeeId} · Department: {detailModal.employee?.department}
                    </Typography>
                    {detailModal.employee?.designation && (
                      <Typography variant="caption" sx={{ color: '#66708C', fontSize: '11px' }}>
                        Designation: {detailModal.employee.designation}
                      </Typography>
                    )}
                  </Box>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: '#ffffff' }}>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#66708C', fontWeight: 600 }}>
                        Leave Type:
                      </Typography>
                      <Chip
                        label={`${detailModal.leave?.leave_type || 'Leave'}${detailModal.leave?.half_day ? ` (${detailModal.leave?.half_day_session || 'Half Day'})` : ''}`}
                        color="error"
                        variant="outlined"
                        size="small"
                        sx={{ fontWeight: 700 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ color: '#66708C', fontWeight: 600 }}>
                        Period:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1B2A5B' }}>
                        {formatDate(detailModal.leave?.start_date)} to {formatDate(detailModal.leave?.end_date)}
                      </Typography>
                    </Box>

                    {detailModal.leave?.days && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#66708C', fontWeight: 600 }}>
                          Total Duration:
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1B2A5B' }}>
                          {detailModal.leave.days} day(s)
                        </Typography>
                      </Box>
                    )}

                    {detailModal.leave?.reason && (
                      <Box sx={{ pt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#66708C', fontWeight: 600, display: 'block', mb: 0.5 }}>
                          Reason:
                        </Typography>
                        <Typography variant="body2" sx={{ fontSize: '12.5px', color: '#334155', fontStyle: 'italic', bgcolor: '#f8fafc', p: 1.25, borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                          &ldquo;{detailModal.leave.reason}&rdquo;
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </Paper>

                <Alert severity="success" sx={{ fontSize: '12.5px' }}>
                  This leave request is approved. The employee is marked as <strong>On Leave</strong> for {formatDate(detailModal.date)}.
                </Alert>
              </Stack>
            ) : (
              <Stack spacing={2.5}>
                {/* Employee Summary Card */}
                <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: '#F8FAFD', borderColor: '#EDF0F7', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ width: 44, height: 44, bgcolor: '#14286D', color: '#ffffff', fontWeight: 700, fontSize: '15px' }}>
                    {(detailModal.employee?.name || detailModal.attendance?.firstName || 'E')
                      .split(' ')
                      .map((p) => p[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '15px', color: '#1B2A5B' }}>
                      {detailModal.employee?.name || `${detailModal.attendance?.firstName || ''} ${detailModal.attendance?.lastName || ''}`.trim()}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#66708C', fontSize: '12px' }}>
                      ID: {detailModal.attendance?.employeeId || detailModal.employee?.employeeId} · Department: {detailModal.attendance?.department || detailModal.employee?.department}
                    </Typography>
                    {detailModal.employee?.designation && (
                      <Typography variant="caption" sx={{ color: '#66708C', fontSize: '11px' }}>
                        Designation: {detailModal.employee.designation}
                      </Typography>
                    )}
                  </Box>
                </Paper>

                {/* Shift Timing Details */}
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5 }}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#ecfdf5', borderColor: '#a7f3d0' }}>
                    <Typography variant="caption" sx={{ color: '#065f46', fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>
                      Clock-In Time
                    </Typography>
                    <Typography variant="h6" sx={{ color: '#047857', fontWeight: 800, mt: 0.2 }}>
                      {detailModal.attendance?.clockInTime || '—'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#059669', fontSize: '11px' }}>
                      Date: {formatDate(detailModal.attendance?.clockInDate || detailModal.date)}
                    </Typography>
                  </Paper>

                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: '8px', bgcolor: detailModal.attendance?.clockOutTime ? '#f8fafc' : '#fef3c7', borderColor: detailModal.attendance?.clockOutTime ? '#e2e8f0' : '#fde68a' }}>
                    <Typography variant="caption" sx={{ color: detailModal.attendance?.clockOutTime ? '#475569' : '#92400e', fontWeight: 700, textTransform: 'uppercase', fontSize: '10.5px' }}>
                      Clock-Out Time
                    </Typography>
                    <Typography variant="h6" sx={{ color: detailModal.attendance?.clockOutTime ? '#1B2A5B' : '#d97706', fontWeight: 800, mt: 0.2 }}>
                      {detailModal.attendance?.clockOutTime || 'Active (Working)'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#66708C', fontSize: '11px' }}>
                      {detailModal.attendance?.clockOutTime ? 'Shift Completed' : 'Shift currently in progress'}
                    </Typography>
                  </Paper>
                </Box>

                {/* Work Duration & Status */}
                <Paper variant="outlined" sx={{ p: 1.75, borderRadius: '8px', bgcolor: '#ffffff', borderColor: '#EDF0F7' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#66708C', fontWeight: 600, textTransform: 'uppercase', fontSize: '11px' }}>
                        Total Worked Duration
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 800, color: '#1B2A5B', mt: 0.2 }}>
                        {detailModal.attendance?.workedTime || (detailModal.attendance?.clockOutTime ? '—' : 'In Session')}
                      </Typography>
                    </Box>
                    <Chip
                      label={detailModal.attendance?.clockOutTime ? 'Completed Shift' : 'Working Now'}
                      sx={{
                        fontWeight: 700,
                        bgcolor: detailModal.attendance?.clockOutTime ? '#F6F8FE' : '#ecfdf5',
                        color: detailModal.attendance?.clockOutTime ? '#14286D' : '#059669',
                        border: '1px solid',
                        borderColor: detailModal.attendance?.clockOutTime ? '#DDE4FF' : '#a7f3d0',
                      }}
                    />
                  </Box>
                </Paper>

                {/* Associated Work Report If Submitted */}
                {detailModal.report ? (
                  <Paper variant="outlined" sx={{ p: 2, borderRadius: '8px', bgcolor: '#EEF2FF', borderColor: '#DDE4FF' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AssignmentTurnedInIcon sx={{ color: '#14286D', fontSize: 20 }} />
                      <Typography sx={{ fontWeight: 700, fontSize: '13px', color: '#14286D' }}>
                        Associated Work Report
                      </Typography>
                    </Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1B2A5B' }}>
                      {detailModal.report.taskName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#66708C', display: 'block', mt: 0.2 }}>
                      Reported Hours: {formatHours(detailModal.report.hoursWorked)} · Feedback: {detailModal.report.feedback || 'Pending'}
                    </Typography>
                    {detailModal.report.workDescription && (
                      <Typography variant="body2" sx={{ fontSize: '12px', color: '#334155', mt: 1, whiteSpace: 'pre-wrap', bgcolor: '#ffffff', p: 1.25, borderRadius: '6px', border: '1px solid #DDE4FF' }}>
                        {detailModal.report.workDescription}
                      </Typography>
                    )}
                  </Paper>
                ) : (
                  <Alert severity="warning" sx={{ fontSize: '12.5px', bgcolor: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
                    <strong>Report Not Yet Submitted:</strong> The employee clocked in on this date, but has not yet submitted the daily work report.
                  </Alert>
                )}
              </Stack>
            )
          )}
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 1.5 }}>
          <Button onClick={() => setDetailModal(null)} sx={{ textTransform: 'none', fontWeight: 600, color: '#64748b' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Attendance;