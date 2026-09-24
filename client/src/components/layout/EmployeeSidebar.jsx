import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Box,
  Typography,
  Snackbar,
  Alert,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Popover,
  Chip,
  Divider,
} from '@mui/material';
import {
  HiOutlineClipboardDocumentCheck,
  HiOutlineChartBar,
  HiOutlineDocumentText,
  HiOutlineCalendarDays,
  HiOutlineUserCircle,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineStop,
  HiOutlineCheckCircle,
  HiOutlineArrowPath,
} from 'react-icons/hi2';
import AppShell from './AppShell';
import ManageLeaves from '../leaves/ManageLeaves';
import UserProfile from '../profile/UserProfile';
import WorkReports from '../reports/WorkReports';
import TasksProjects from '../tasks/TasksProjects';
import Messenger from '../messenger/Messenger';
import Workgroups from '../workgroups/Workgroups';
import Crm from '../crm/Crm';
import Attendance from '../attendance/Attendance';
import Reports from '../reports/Reports';
import WorkReportFormDialog from '../reports/WorkReportFormDialog';
import axios from '../../api/axios';

const Sidebar = () => {
  const storedCompany = localStorage.getItem('companyName');
  const companyAssigned = !!storedCompany && storedCompany !== 'null' && storedCompany !== 'undefined';
  const [selectedComponent, setSelectedComponent] = useState(companyAssigned ? 'Tasks' : 'Profile');
  const [loading, setLoading] = useState(false);
  const [userPhoto, setUserPhoto] = useState('');
  const [userName, setUserName] = useState('');
  const [clockedIn, setClockedIn] = useState(false);
  const [isCompletedToday, setIsCompletedToday] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [clockInterval, setClockInterval] = useState(null);
  const [confirmClockOutOpen, setConfirmClockOutOpen] = useState(false);
  const [detailsAnchor, setDetailsAnchor] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [canReviewLeaves, setCanReviewLeaves] = useState(false);
  const [openReportDialog, setOpenReportDialog] = useState(false);
  const [currentDeptRole, setCurrentDeptRole] = useState(
    localStorage.getItem('departmentRole') || 'Member'
  );

  const navigate = useNavigate();

  useEffect(() => {
    setUserPhoto(localStorage.getItem('userPhoto') || '');
    setUserName(
      `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim() || 'User'
    );
    const email = localStorage.getItem('userEmail');
    if (email) {
      axios.get('/users/by-email', { params: { email } })
        .then((res) => {
          if (res.data?.departmentRole) {
            localStorage.setItem('departmentRole', res.data.departmentRole);
            setCurrentDeptRole(res.data.departmentRole);
          }
          if (res.data?.department) {
            localStorage.setItem('userDepartment', res.data.department);
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const deptRole = localStorage.getItem('departmentRole');
    if (!['Admin', 'Manager'].includes(role) && deptRole !== 'Supervisor') {
      setCanReviewLeaves(false);
      return undefined;
    }

    axios.get('/leaves/leave', { params: {
      companyName: localStorage.getItem('companyName'),
      employeeId: localStorage.getItem('userEmployeeId'),
      departmentRole: deptRole,
      department: localStorage.getItem('userDepartment'),
      status: 'Pending',
    } }).then(() => setCanReviewLeaves(true)).catch(() => setCanReviewLeaves(false));
  }, []);

  const startTimer = () => {
    if (clockInterval) clearInterval(clockInterval);
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    setClockInterval(interval);
  };

  // Restore active clock-in session on mount
  useEffect(() => {
    const employeeId = localStorage.getItem('userEmployeeId');
    const storedCompany = localStorage.getItem('companyName');
    const companyName =
      !storedCompany || storedCompany === 'null' || storedCompany === 'undefined'
        ? 'KN Advisors'
        : storedCompany;

    if (!employeeId) return;

    axios
      .get('/attendance/status', { params: { employeeId, companyName } })
      .then((res) => {
        if (res.data?.clockedIn && res.data?.activeRecord) {
          const active = res.data.activeRecord;
          setClockedIn(true);
          setIsCompletedToday(false);
          setTodayRecord(active);

          if (active.clockInTime) {
            const [ch, cm, cs] = active.clockInTime.split(':').map(Number);
            const now = new Date();
            const startD = active.clockInDate ? new Date(`${active.clockInDate}T00:00:00`) : new Date();
            startD.setHours(ch || 0, cm || 0, cs || 0, 0);

            const diffSecs = Math.max(0, Math.floor((now.getTime() - startD.getTime()) / 1000));
            setElapsedSeconds(diffSecs);
          }
          startTimer();
        } else if (res.data?.todayRecord || (res.data?.dateRecords && res.data.dateRecords.length > 0)) {
          const record = res.data.todayRecord || res.data.dateRecords[res.data.dateRecords.length - 1];
          setTodayRecord(record);
          if (record.clockOutTime) {
            setClockedIn(false);
            setIsCompletedToday(true);
            if (record.workedTime) {
              const [wh, wm, ws] = record.workedTime.split(':').map(Number);
              setElapsedSeconds((wh || 0) * 3600 + (wm || 0) * 60 + (ws || 0));
            }
          }
        }
      })
      .catch((err) => console.error('Error checking active clock-in status:', err));

    return () => {
      if (clockInterval) clearInterval(clockInterval);
    };
  }, []);

  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getLocalTimeString = () => {
    const d = new Date();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const calculateExpectedEndTime = (inTime) => {
    if (!inTime) return '—';
    const [h, m] = inTime.split(':').map(Number);
    if (isNaN(h)) return '—';
    const totalMinutes = h * 60 + (m || 0) + 8 * 60; // 8h workday
    const endH = Math.floor(totalMinutes / 60) % 24;
    const endM = totalMinutes % 60;
    const period = endH >= 12 ? 'PM' : 'AM';
    const dispH = endH % 12 || 12;
    return `${String(dispH).padStart(2, '0')}:${String(endM).padStart(2, '0')} ${period}`;
  };

  const handleClockIn = (isResuming = false) => {
    setLoading(true);

    const storedCompany = localStorage.getItem('companyName');
    const effectiveCompany =
      !storedCompany || storedCompany === 'null' || storedCompany === 'undefined'
        ? 'KN Advisors'
        : storedCompany;

    const userDetails = {
      companyName: effectiveCompany,
      department: localStorage.getItem('userDepartment'),
      firstName: localStorage.getItem('userFirstName'),
      lastName: localStorage.getItem('userLastName'),
      email: localStorage.getItem('userEmail'),
      employeeId: localStorage.getItem('userEmployeeId'),
      designation: localStorage.getItem('userDesignation'),
      clockInDate: getLocalDateString(),
      clockInTime: getLocalTimeString(),
      ...(isResuming ? { action: 'resume' } : {}),
    };

    axios.post('/attendance/clock-in', userDetails)
      .then((res) => {
        setClockedIn(true);
        setIsCompletedToday(false);
        const record = res.data?.activeRecord || {
          clockInTime: userDetails.clockInTime,
          clockInDate: userDetails.clockInDate,
        };
        setTodayRecord(record);

        if (record.clockInTime) {
          const [ch, cm, cs] = record.clockInTime.split(':').map(Number);
          const now = new Date();
          const startD = record.clockInDate ? new Date(`${record.clockInDate}T00:00:00`) : new Date();
          startD.setHours(ch || 0, cm || 0, cs || 0, 0);
          const diffSecs = Math.max(0, Math.floor((now.getTime() - startD.getTime()) / 1000));
          setElapsedSeconds(diffSecs);
        } else {
          setElapsedSeconds(0);
        }

        startTimer();
        setLoading(false);
      })
      .catch((error) => {
        console.error('Clock-in failed:', error);
        alert(error.response?.data?.error || 'Failed to clock in. Please try again.');
        setClockedIn(false);
        setLoading(false);
      });
  };

  const handleClockOut = () => {
    setLoading(true);
    clearInterval(clockInterval);

    const totalWorkedTime = formatElapsedTime(elapsedSeconds);
    const storedCompany = localStorage.getItem('companyName');
    const effectiveCompany =
      !storedCompany || storedCompany === 'null' || storedCompany === 'undefined'
        ? 'KN Advisors'
        : storedCompany;

    const clockOutData = {
      employeeId: localStorage.getItem('userEmployeeId'),
      companyName: effectiveCompany,
      clockOutTime: getLocalTimeString(),
      workedTime: totalWorkedTime,
    };

    axios.patch('/attendance/clock-out', clockOutData)
      .then(() => {
        setClockedIn(false);
        setIsCompletedToday(true);
        setConfirmClockOutOpen(false);
        setSnackbarOpen(true);
        setTodayRecord((prev) => ({
          ...(prev || {}),
          clockOutTime: clockOutData.clockOutTime,
          workedTime: totalWorkedTime,
        }));
        localStorage.setItem('workedTime', totalWorkedTime);
        setClockInterval(null);
        setLoading(false);
        setOpenReportDialog(true);
      })
      .catch((error) => {
        console.error('Clock-out failed:', error);
        alert(error.response?.data?.error || 'Failed to clock out. Please try again.');
        setLoading(false);
      });
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleListItemOnClick = (component) => {
    setLoading(true);
    setTimeout(() => {
      setSelectedComponent(component);
      setLoading(false);
    }, 350);
  };

  const userRole = localStorage.getItem('userRole') || 'Employee';
  const departmentRole = currentDeptRole || localStorage.getItem('departmentRole') || 'Member';
  const isSupervisor = departmentRole === 'Supervisor' || userRole === 'Manager';

  const renderComponent = () => {
    switch (selectedComponent) {
      case 'Tasks':
      case 'Tasks and Projects': return <TasksProjects />;
      case 'Work Groups': return <Workgroups />;
      case 'Time & Attendance':
      case 'Attendance':
      case 'My Attendance':
      case 'My Work Time': return <Attendance />;
      case 'Work Reports': return isSupervisor ? <Reports /> : <WorkReports />;
      case 'Department Reports':
      case 'Reports': return <Reports />;
      case 'My Work Reports': return <WorkReports />;
      case 'Messenger': return <Messenger />;
      case 'CRM': return <Crm />;
      case 'Apply Leave':
      case 'My Leaves':
      case 'Manage Leaves': return <ManageLeaves initialTab={selectedComponent} />;
      case 'Profile': return <UserProfile />;
      default: return <ManageLeaves />;
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const formatElapsedTime = (seconds) => {
    const hrs = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const mins = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
  };

  const shiftProgressPercent = Math.min(100, Math.round((elapsedSeconds / 28800) * 100));

  const clockWidget = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
      {clockedIn ? (
        /* State 1: Shift In Progress */
        <>
          {/* Interactive Live Shift Pill */}
          <Tooltip title="Click to view today's shift details" arrow>
            <Box
              onClick={(e) => setDetailsAnchor(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 1.5,
                py: 0.6,
                bgcolor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 1px 3px rgba(16, 185, 129, 0.1)',
                '&:hover': {
                  bgcolor: '#d1fae5',
                  borderColor: '#6ee7b7',
                },
              }}
            >
              {/* Pulsing Green Indicator */}
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: '#10b981',
                  boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)',
                  animation: 'shiftPulse 2s infinite',
                  '@keyframes shiftPulse': {
                    '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)' },
                    '70%': { transform: 'scale(1)', boxShadow: '0 0 0 6px rgba(16, 185, 129, 0)' },
                    '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0)' },
                  },
                }}
              />

              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#065f46', display: { xs: 'none', md: 'block' } }}>
                In: {todayRecord?.clockInTime ? todayRecord.clockInTime.slice(0, 5) : '—'}
              </Typography>

              <Typography
                sx={{
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#047857',
                  fontVariantNumeric: 'tabular-nums',
                  letterSpacing: '0.2px',
                }}
              >
                {formatElapsedTime(elapsedSeconds)}
              </Typography>

              <Chip
                label={`${shiftProgressPercent}% (8h)`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '10.5px',
                  fontWeight: 700,
                  bgcolor: shiftProgressPercent >= 100 ? '#dbeafe' : '#dcfce7',
                  color: shiftProgressPercent >= 100 ? '#1e40af' : '#15803d',
                  border: 'none',
                  display: { xs: 'none', sm: 'inline-flex' },
                }}
              />
            </Box>
          </Tooltip>

          {/* Clock Out Button */}
          <Button
            size="small"
            variant="contained"
            color="error"
            startIcon={<HiOutlineStop size={15} />}
            onClick={() => setConfirmClockOutOpen(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '12.5px',
              borderRadius: '20px',
              px: 1.8,
              py: 0.6,
              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.25)',
              bgcolor: '#dc2626',
              '&:hover': { bgcolor: '#b91c1c' },
            }}
          >
            Clock Out
          </Button>
        </>
      ) : isCompletedToday ? (
        /* State 2: Shift Completed */
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Click to view completed shift details" arrow>
            <Box
              onClick={(e) => setDetailsAnchor(e.currentTarget)}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.8,
                px: 1.4,
                py: 0.6,
                bgcolor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': { bgcolor: '#f1f5f9', borderColor: '#94a3b8' },
              }}
            >
              <HiOutlineCheckCircle size={17} color="#059669" />
              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Shift Done · {todayRecord?.workedTime || formatElapsedTime(elapsedSeconds)}
              </Typography>
            </Box>
          </Tooltip>

          <Button
            size="small"
            variant="outlined"
            onClick={() => setOpenReportDialog(true)}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '12px',
              borderRadius: '20px',
              color: '#14286D',
              borderColor: '#cbd5e1',
              px: 1.5,
              py: 0.5,
              '&:hover': { borderColor: '#14286D', bgcolor: '#eef2ff' },
            }}
          >
            Work Report
          </Button>
        </Box>
      ) : (
        /* State 3: Not Clocked In (Start of Day) */
        <Button
          size="small"
          variant="contained"
          startIcon={<HiOutlineClock size={16} />}
          onClick={() => handleClockIn(false)}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '13px',
            borderRadius: '24px',
            bgcolor: '#14286D',
            color: '#ffffff',
            px: 2.2,
            py: 0.65,
            boxShadow: '0 2px 6px rgba(20, 40, 109, 0.25)',
            transition: 'all 0.2s ease',
            '&:hover': {
              bgcolor: '#0f1e54',
              transform: 'translateY(-1px)',
              boxShadow: '0 4px 10px rgba(20, 40, 109, 0.35)',
            },
          }}
        >
          Clock In
        </Button>
      )}

      {/* Popover Shift Details */}
      <Popover
        open={Boolean(detailsAnchor)}
        anchorEl={detailsAnchor}
        onClose={() => setDetailsAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            p: 2.25,
            borderRadius: '16px',
            width: 310,
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
          },
        }}
      >
        <Typography sx={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.5px', mb: 0.5 }}>
          Daily Shift Tracker
        </Typography>
        <Typography sx={{ fontSize: '14.5px', fontWeight: 800, color: '#0f172a', mb: 1.5 }}>
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Shift Target (8 hours)</Typography>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: shiftProgressPercent >= 100 ? '#1e40af' : '#047857' }}>
              {shiftProgressPercent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={shiftProgressPercent}
            sx={{
              height: 7,
              borderRadius: 4,
              bgcolor: '#f1f5f9',
              '& .MuiLinearProgress-bar': {
                bgcolor: shiftProgressPercent >= 100 ? '#3b82f6' : '#10b981',
                borderRadius: 4,
              },
            }}
          />
        </Box>

        <Box sx={{ bgcolor: '#f8fafc', borderRadius: '10px', p: 1.5, mb: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
          <Box>
            <Typography sx={{ fontSize: '11px', color: '#64748b' }}>Clock-In Time</Typography>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              {todayRecord?.clockInTime ? todayRecord.clockInTime.slice(0, 5) : '—'}
            </Typography>
          </Box>
          <Box>
            <Typography sx={{ fontSize: '11px', color: '#64748b' }}>
              {clockedIn ? 'Expected End' : 'Clock-Out Time'}
            </Typography>
            <Typography sx={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
              {clockedIn
                ? calculateExpectedEndTime(todayRecord?.clockInTime)
                : todayRecord?.clockOutTime ? todayRecord.clockOutTime.slice(0, 5) : '—'}
            </Typography>
          </Box>
        </Box>

        {isCompletedToday && (
          <Button
            size="small"
            variant="text"
            startIcon={<HiOutlineArrowPath size={14} />}
            onClick={() => { setDetailsAnchor(null); handleClockIn(true); }}
            sx={{ fontSize: '11.5px', textTransform: 'none', color: '#64748b', p: 0, '&:hover': { color: '#14286D' } }}
          >
            Clocked out by mistake? Resume Shift
          </Button>
        )}
      </Popover>
    </Box>
  );

  const iconStyle = (active) => ({ size: 22, color: active ? '#fff' : undefined });
  const navItems = isSupervisor
    ? [
        {
          text: 'Tasks',
          icon: <HiOutlineClipboardDocumentCheck {...iconStyle(selectedComponent === 'Tasks' || selectedComponent === 'Tasks and Projects')} />,
        },
        {
          text: 'Messenger',
          icon: <HiOutlineChatBubbleLeftRight {...iconStyle(selectedComponent === 'Messenger')} />,
        },
        {
          text: 'Work Groups',
          icon: <HiOutlineUserGroup {...iconStyle(selectedComponent === 'Work Groups')} />,
        },
        {
          text: 'Time & Attendance',
          icon: <HiOutlineClock {...iconStyle(selectedComponent === 'Time & Attendance' || selectedComponent === 'Attendance' || selectedComponent === 'My Work Time')} />,
        },
        {
          text: 'Work Reports',
          icon: <HiOutlineChartBar {...iconStyle(selectedComponent === 'Work Reports' || selectedComponent === 'Department Reports' || selectedComponent === 'Reports')} />,
        },
        {
          text: 'Manage Leaves',
          icon: <HiOutlineCalendarDays {...iconStyle(selectedComponent === 'Manage Leaves' || selectedComponent === 'My Leaves' || selectedComponent === 'Apply Leave')} />,
        },
        {
          text: 'CRM',
          icon: <HiOutlineBriefcase {...iconStyle(selectedComponent === 'CRM')} />,
        },
        {
          text: 'Profile',
          icon: <HiOutlineUserCircle {...iconStyle(selectedComponent === 'Profile')} />,
        },
      ]
    : [
        {
          text: 'Tasks',
          icon: <HiOutlineClipboardDocumentCheck {...iconStyle(selectedComponent === 'Tasks')} />,
        },
        {
          text: 'Messenger',
          icon: <HiOutlineChatBubbleLeftRight {...iconStyle(selectedComponent === 'Messenger')} />,
        },
        {
          text: 'Work Groups',
          icon: <HiOutlineUserGroup {...iconStyle(selectedComponent === 'Work Groups')} />,
        },
        {
          text: 'Time & Attendance',
          icon: <HiOutlineClock {...iconStyle(selectedComponent === 'Time & Attendance' || selectedComponent === 'My Work Time' || selectedComponent === 'My Attendance' || selectedComponent === 'Attendance')} />,
        },
        {
          text: 'Work Reports',
          icon: <HiOutlineChartBar {...iconStyle(selectedComponent === 'Work Reports')} />,
        },
        {
          text: 'Manage Leaves',
          icon: <HiOutlineCalendarDays {...iconStyle(selectedComponent === 'Manage Leaves' || selectedComponent === 'My Leaves' || selectedComponent === 'Apply Leave')} />,
        },
        {
          text: 'CRM',
          icon: <HiOutlineBriefcase {...iconStyle(selectedComponent === 'CRM')} />,
        },
        {
          text: 'Profile',
          icon: <HiOutlineUserCircle {...iconStyle(selectedComponent === 'Profile')} />,
        },
      ];

  return (
    <>
      <AppShell
        navItems={navItems}
        active={selectedComponent}
        onNavigate={handleListItemOnClick}
        userPhoto={userPhoto}
        userName={userName}
        userRole={departmentRole === 'Supervisor' ? `Supervisor (${localStorage.getItem('userDepartment') || 'Dept'})` : (localStorage.getItem('userRole') || 'Employee')}
        userCompany={localStorage.getItem('companyName') || 'Not assigned'}
        onLogout={handleLogout}
        onProfile={() => handleListItemOnClick('Profile')}
        topbarRight={clockWidget}
        loading={loading}
      >
        {renderComponent()}
      </AppShell>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity="success" sx={{ width: '100%' }}>
          Now you can submit your work report
        </Alert>
      </Snackbar>

      {/* Clock Out Confirmation Modal */}
      <Dialog
        open={confirmClockOutOpen}
        onClose={() => setConfirmClockOutOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            p: 1,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2, px: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '12px',
                bgcolor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626',
              }}
            >
              <HiOutlineStop size={22} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: '17px', color: '#0f172a' }}>
                End Daily Shift?
              </Typography>
              <Typography sx={{ fontSize: '12px', color: '#64748b' }}>
                Single-shift attendance record for today
              </Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 2.5, py: 1.5 }}>
          <Box sx={{ bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', p: 2, mb: 2 }}>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5, mb: 1.5 }}>
              <Box>
                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Clock-In Time
                </Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  {todayRecord?.clockInTime ? todayRecord.clockInTime.slice(0, 5) : '—'}
                </Typography>
              </Box>
              <Box>
                <Typography sx={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>
                  Clock-Out Time
                </Typography>
                <Typography sx={{ fontSize: '15px', fontWeight: 800, color: '#dc2626' }}>
                  {getLocalTimeString().slice(0, 5)}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1 }} />

            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pt: 0.5 }}>
              <Typography sx={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                Total Worked Today:
              </Typography>
              <Typography sx={{ fontSize: '15px', fontWeight: 800, color: '#047857' }}>
                {formatElapsedTime(elapsedSeconds)}
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
            Clocking out will conclude your shift for today. Next, you will immediately be prompted to submit your daily work report.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2, pt: 0.5, gap: 1 }}>
          <Button
            onClick={() => setConfirmClockOutOpen(false)}
            variant="outlined"
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '12px',
              color: '#64748b',
              borderColor: '#cbd5e1',
              flex: 1,
              '&:hover': { borderColor: '#94a3b8', bgcolor: '#f8fafc' },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleClockOut}
            variant="contained"
            color="error"
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 700,
              fontSize: '13px',
              borderRadius: '12px',
              flex: 1.4,
              bgcolor: '#dc2626',
              boxShadow: '0 2px 6px rgba(220, 38, 38, 0.25)',
              '&:hover': { bgcolor: '#b91c1c' },
            }}
          >
            {loading ? 'Clocking Out...' : 'Confirm Clock Out'}
          </Button>
        </DialogActions>
      </Dialog>

      <WorkReportFormDialog
        open={openReportDialog}
        onClose={() => setOpenReportDialog(false)}
        dialogTitle="Clock-Out Work Report"
        onSubmitted={() => {
          setOpenReportDialog(false);
          setSelectedComponent('Work Reports');
        }}
      />
    </>
  );
};

export default Sidebar;