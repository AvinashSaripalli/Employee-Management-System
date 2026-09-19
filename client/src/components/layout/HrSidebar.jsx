import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlineSquares2X2, HiOutlineUsers, HiOutlineClipboardDocumentList, HiOutlineCalendarDays, HiOutlineChartBar, HiOutlineChatBubbleLeftRight, HiOutlineBriefcase } from 'react-icons/hi2';
import AppShell from './AppShell';
import HrDashboard from '../dashboard/HrDashboard';
import EmployeeManagement from '../employees/EmployeeManagement';
import Attendance from '../attendance/Attendance';
import LeaveManagement from '../leaves/LeaveManagement';
import EmployeesReports from '../reports/EmployeesReports';
import Messenger from '../messenger/Messenger';
import Crm from '../crm/Crm';

const HrSidebar = () => {
  const [selectedComponent, setSelectedComponent] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [userPhoto, setUserPhoto] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    setUserPhoto(localStorage.getItem('userPhoto') || '');
    setCompanyName(localStorage.getItem('companyName') || '');
    setUserName(
      `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim() || 'User'
    );
  }, []);

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
      case 'Dashboard': return <HrDashboard />;
      case 'Employee': return <EmployeeManagement />;
      case 'Attendance': return <Attendance />;
      case 'Leaves': return <LeaveManagement />;
      case 'Messenger': return <Messenger />;
      case 'CRM': return <Crm />;
      case 'Employees Reports': return <EmployeesReports />;
      default: return <HrDashboard />;
    }
  };

  const iconStyle = (active) => ({ size: 22, color: active ? '#fff' : undefined });

  const navItems = [
    {
      text: 'Dashboard',
      icon: <HiOutlineSquares2X2 {...iconStyle(selectedComponent === 'Dashboard')} />,
    },
    {
      text: 'Employee',
      icon: <HiOutlineUsers {...iconStyle(selectedComponent === 'Employee')} />,
    },
    {
      text: 'Attendance',
      icon: <HiOutlineClipboardDocumentList {...iconStyle(selectedComponent === 'Attendance')} />,
    },
    {
      text: 'Leaves',
      icon: <HiOutlineCalendarDays {...iconStyle(selectedComponent === 'Leaves')} />,
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
      text: 'Employees Reports',
      icon: <HiOutlineChartBar {...iconStyle(selectedComponent === 'Employees Reports')} />,
    },
  ];

  return (
    <AppShell
      navItems={navItems}
      active={selectedComponent}
      onNavigate={handleListItemOnClick}
      userPhoto={userPhoto}
      userName={userName}
      userRole={localStorage.getItem('userRole') || 'HR'}
      userCompany={companyName}
      onLogout={handleLogout}
      loading={loading}
    >
      {renderComponent()}
    </AppShell>
  );
};

export default HrSidebar;