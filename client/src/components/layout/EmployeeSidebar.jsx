import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography, Snackbar, Alert } from '@mui/material';
import { HiOutlineClipboardDocumentCheck, HiOutlineChartBar, HiOutlineDocumentText, HiOutlineCalendarDays, HiOutlineUserCircle, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2';
import AppShell from './AppShell';
import ApplyLeave from '../leaves/ApplyLeave';
import MyLeaves from '../leaves/MyLeaves';
import EmployeeProfile from '../employees/EmployeeProfile';
import WorkReports from '../reports/WorkReports';
import TasksProjects from '../tasks/TasksProjects';
import Messenger from '../messenger/Messenger';
import axios from '../../api/axios';

const Sidebar = () => {
  const storedCompany = localStorage.getItem('companyName');
  const companyAssigned = !!storedCompany && storedCompany !== 'null' && storedCompany !== 'undefined';
  const [selectedComponent, setSelectedComponent] = useState(companyAssigned ? 'My Leaves' : 'Profile');
  const [loading, setLoading] = useState(false);
  const [userPhoto, setUserPhoto] = useState('');
  const [userName, setUserName] = useState('');
  const [clockedIn, setClockedIn] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [clockInterval, setClockInterval] = useState(null);
  const [showContinueWorking, setShowContinueWorking] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    setUserPhoto(localStorage.getItem('userPhoto') || '');
    setUserName(
      `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim() || 'User'
    );
  }, []);

  const startTimer = () => {
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    setClockInterval(interval);
  };

  const handleClockIn = () => {
    setLoading(true);

    const formatDateForMySQL = (date) => {
      return date.toISOString().slice(0, 10);
    };

    const formatTimeForMySQL = (date) => {
      return date.toTimeString().split(' ')[0];
    };

    const userDetails = {
      companyName: localStorage.getItem('companyName'),
      department: localStorage.getItem('userDepartment'),
      firstName: localStorage.getItem('userFirstName'),
      lastName: localStorage.getItem('userLastName'),
      email: localStorage.getItem('userEmail'),
      employeeId: localStorage.getItem('userEmployeeId'),
      designation: localStorage.getItem('userDesignation'),
      clockInDate: formatDateForMySQL(new Date()),
      clockInTime: formatTimeForMySQL(new Date()),
    };

    axios.post('/attendance/clock-in', userDetails)
      .then(() => {
        setClockedIn(true);
        setShowContinueWorking(false);
        startTimer();
        setLoading(false);
      })
      .catch((error) => {
        console.error('Clock-in failed:', error);
        alert('Failed to clock in. Please try again.');
        setClockedIn(false);
        setLoading(false);
      });
  };

  const handleClockOut = () => {
    setLoading(true);
    clearInterval(clockInterval);

    const formatTimeForMySQL = (date) => {
      return date.toTimeString().split(' ')[0];
    };

    const totalWorkedTime = formatElapsedTime(elapsedSeconds);

    const clockOutData = {
      employeeId: localStorage.getItem('userEmployeeId'),
      companyName: localStorage.getItem('companyName'),
      clockOutTime: formatTimeForMySQL(new Date()),
      workedTime: totalWorkedTime,
    };

    axios.patch('/attendance/clock-out', clockOutData)
      .then(() => {
        setClockedIn(false);
        setShowContinueWorking(true);
        setSnackbarOpen(true);
        localStorage.setItem('workedTime', totalWorkedTime);
        console.log('Total Worked Time:', totalWorkedTime);
        setClockInterval(null);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Clock-out failed:', error);
        alert('Failed to clock out. Please try again.');
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

  const renderComponent = () => {
    switch (selectedComponent) {
      case 'Tasks': return <TasksProjects />;
      case 'Work Reports': return <WorkReports />;
      case 'Messenger': return <Messenger />;
      case 'Apply Leave': return <ApplyLeave />;
      case 'My Leaves': return <MyLeaves />;
      case 'Profile': return <EmployeeProfile />;
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
  const navItems = [
    {
      text: 'Tasks',
      icon: <HiOutlineClipboardDocumentCheck {...iconStyle(selectedComponent === 'Tasks')} />,
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
      text: 'Apply Leave',
      icon: <HiOutlineDocumentText {...iconStyle(selectedComponent === 'Apply Leave')} />,
    },
    {
      text: 'My Leaves',
      icon: <HiOutlineCalendarDays {...iconStyle(selectedComponent === 'My Leaves')} />,
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
    </>
  );
};

export default Sidebar;