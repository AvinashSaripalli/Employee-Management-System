import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography, Snackbar, Alert, Tooltip } from '@mui/material';
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
} from 'react-icons/hi2';
import AppShell from './AppShell';
import ApplyLeave from '../leaves/ApplyLeave';
import MyLeaves from '../leaves/MyLeaves';
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
  const [selectedComponent, setSelectedComponent] = useState(companyAssigned ? 'My Leaves' : 'Profile');
  const [loading, setLoading] = useState(false);
  const [userPhoto, setUserPhoto] = useState('');
  const [userName, setUserName] = useState('');
  const [clockedIn, setClockedIn] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [clockInterval, setClockInterval] = useState(null);
  const [showContinueWorking, setShowContinueWorking] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [canReviewLeaves, setCanReviewLeaves] = useState(false);
  const [openReportDialog, setOpenReportDialog] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setUserPhoto(localStorage.getItem('userPhoto') || '');
    setUserName(
      `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim() || 'User'
    );
  }, []);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    if (!['Admin', 'Manager'].includes(role)) {
      setCanReviewLeaves(false);
      return undefined;
    }

    axios.get('/leaves/leave', { params: {
      companyName: localStorage.getItem('companyName'),
      employeeId: localStorage.getItem('userEmployeeId'),
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
          setTodayRecord(active);
          setShowContinueWorking(false);

          if (active.clockInTime) {
            const [ch, cm, cs] = active.clockInTime.split(':').map(Number);
            const now = new Date();
            const startD = active.clockInDate ? new Date(`${active.clockInDate}T00:00:00`) : new Date();
            startD.setHours(ch || 0, cm || 0, cs || 0, 0);

            const diffSecs = Math.max(0, Math.floor((now.getTime() - startD.getTime()) / 1000));
            setElapsedSeconds(diffSecs);
          }
          startTimer();
        } else if (res.data?.dateRecords && res.data.dateRecords.length > 0) {
          const lastRecord = res.data.dateRecords[res.data.dateRecords.length - 1];
          setTodayRecord(lastRecord);
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

  const handleClockIn = () => {
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
    };

    axios.post('/attendance/clock-in', userDetails)
      .then((res) => {
        setClockedIn(true);
        setShowContinueWorking(false);
        setElapsedSeconds(0);
        setTodayRecord(res.data?.activeRecord || {
          clockInTime: userDetails.clockInTime,
          clockInDate: userDetails.clockInDate,
        });
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
        setShowContinueWorking(true);
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

  const handleContinueWorking = () => {
    setLoading(true);
    setClockedIn(true);
    setShowContinueWorking(false);
    startTimer();
    setLoading(false);
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
  const isSupervisor = userRole === 'Manager';

  const renderComponent = () => {
    switch (selectedComponent) {
      case 'Tasks':
      case 'Tasks and Projects': return <TasksProjects />;
      case 'Work Groups': return <Workgroups />;
      case 'Time & Attendance':
      case 'Attendance':
      case 'My Attendance':
      case 'My Work Time': return <Attendance />;
      case 'Work Reports':
      case 'My Work Reports': return <WorkReports />;
      case 'Department Reports':
      case 'Reports': return <Reports />;
      case 'Messenger': return <Messenger />;
      case 'CRM': return <Crm />;
      case 'Apply Leave': return <ApplyLeave />;
      case 'My Leaves': return <MyLeaves />;
      case 'Manage Leaves': return <ManageLeaves />;
      case 'Profile': return <UserProfile />;
      default: return <MyLeaves />;
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

  const clockWidget = (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
      {todayRecord?.clockInTime && (
        <Tooltip title="Click to view all your clock-in & clock-out times">
          <Box
            onClick={() => handleListItemOnClick(isSupervisor ? 'Time & Attendance' : 'My Work Time')}
            sx={{
              display: { xs: 'none', sm: 'flex' },
              alignItems: 'center',
              gap: 0.75,
              px: 1.25,
              py: 0.5,
              bgcolor: clockedIn ? '#ecfdf5' : '#f8fafc',
              border: '1px solid',
              borderColor: clockedIn ? '#a7f3d0' : '#e2e8f0',
              borderRadius: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              '&:hover': {
                bgcolor: clockedIn ? '#d1fae5' : '#f1f5f9',
                borderColor: clockedIn ? '#6ee7b7' : '#cbd5e1',
              },
            }}
          >
            <Box
              sx={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                bgcolor: clockedIn ? '#10b981' : '#64748b',
              }}
            />
            <Typography sx={{ fontSize: '11.5px', fontWeight: 700, color: clockedIn ? '#065f46' : '#475569' }}>
              {clockedIn
                ? `In: ${todayRecord.clockInTime}`
                : todayRecord.clockOutTime
                ? `In: ${todayRecord.clockInTime} · Out: ${todayRecord.clockOutTime}`
                : `In: ${todayRecord.clockInTime}`}
            </Typography>
          </Box>
        </Tooltip>
      )}

      <Button
        size="small"
        variant={showContinueWorking ? 'contained' : clockedIn ? 'contained' : 'contained'}
        color={showContinueWorking ? 'success' : clockedIn ? 'error' : 'primary'}
        onClick={showContinueWorking ? handleContinueWorking : (clockedIn ? handleClockOut : handleClockIn)}
        sx={{ px: 2 }}
      >
        {showContinueWorking ? 'Continue Working' : (clockedIn ? 'Clock Out' : 'Clock In')}
      </Button>
      <Typography
        sx={{
          color: 'primary.main',
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
          bgcolor: 'background.default',
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
        }}
      >
        {formatElapsedTime(elapsedSeconds)}
      </Typography>
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
          text: 'Work Groups',
          icon: <HiOutlineUserGroup {...iconStyle(selectedComponent === 'Work Groups')} />,
        },
        {
          text: 'Time & Attendance',
          icon: <HiOutlineClock {...iconStyle(selectedComponent === 'Time & Attendance' || selectedComponent === 'Attendance' || selectedComponent === 'My Work Time')} />,
        },
        {
          text: 'Department Reports',
          icon: <HiOutlineChartBar {...iconStyle(selectedComponent === 'Department Reports' || selectedComponent === 'Reports')} />,
        },
        {
          text: 'My Work Reports',
          icon: <HiOutlineDocumentText {...iconStyle(selectedComponent === 'My Work Reports' || selectedComponent === 'Work Reports')} />,
        },
        {
          text: 'Messenger',
          icon: <HiOutlineChatBubbleLeftRight {...iconStyle(selectedComponent === 'Messenger')} />,
        },
        {
          text: 'CRM',
          icon: <HiOutlineBriefcase {...iconStyle(selectedComponent === 'CRM')} />,
        },
        {
          text: 'Apply Leave',
          icon: <HiOutlineDocumentText {...iconStyle(selectedComponent === 'Apply Leave')} />,
        },
        {
          text: 'My Leaves',
          icon: <HiOutlineCalendarDays {...iconStyle(selectedComponent === 'My Leaves')} />,
        },
        {
          text: 'Manage Leaves',
          icon: <HiOutlineCalendarDays {...iconStyle(selectedComponent === 'Manage Leaves')} />,
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
          text: 'Work Groups',
          icon: <HiOutlineUserGroup {...iconStyle(selectedComponent === 'Work Groups')} />,
        },
        {
          text: 'My Work Time',
          icon: <HiOutlineClock {...iconStyle(selectedComponent === 'My Work Time' || selectedComponent === 'My Attendance' || selectedComponent === 'Attendance')} />,
        },
        {
          text: 'Work Reports',
          icon: <HiOutlineChartBar {...iconStyle(selectedComponent === 'Work Reports')} />,
        },
        {
          text: 'Messenger',
          icon: <HiOutlineChatBubbleLeftRight {...iconStyle(selectedComponent === 'Messenger')} />,
        },
        {
          text: 'CRM',
          icon: <HiOutlineBriefcase {...iconStyle(selectedComponent === 'CRM')} />,
        },
        {
          text: 'Apply Leave',
          icon: <HiOutlineDocumentText {...iconStyle(selectedComponent === 'Apply Leave')} />,
        },
        {
          text: 'My Leaves',
          icon: <HiOutlineCalendarDays {...iconStyle(selectedComponent === 'My Leaves')} />,
        },
        ...(canReviewLeaves ? [{
          text: 'Manage Leaves',
          icon: <HiOutlineCalendarDays {...iconStyle(selectedComponent === 'Manage Leaves')} />,
        }] : []),
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
        userRole={localStorage.getItem('userRole') || 'Employee'}
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