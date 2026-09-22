import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineSquares2X2,
  HiOutlineClipboardDocumentCheck,
  HiOutlineUsers,
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
  HiOutlineCalendarDays,
  HiOutlineChartBar,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBriefcase,
  HiOutlineClock,
} from 'react-icons/hi2';
import AppShell from './AppShell';
import Dashboard from '../dashboard/Dashboard';
import TasksProjects from '../tasks/TasksProjects';
import EmployeesList from '../employees/EmployeesList';
import CompanyStructure from '../company/CompanyStructure';
import Workgroups from '../workgroups/Workgroups';
import ManageLeaves from '../leaves/ManageLeaves';
import Reports from '../reports/Reports';
import Attendance from '../attendance/Attendance';
import UserProfile from '../profile/UserProfile';
import Messenger from '../messenger/Messenger';
import Crm from '../crm/Crm';

const Sidebar = () => {
  const [selectedComponent, setSelectedComponent] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [userPhoto, setUserPhoto] = useState('');
  const [userName, setUserName] = useState('');
  const [companyName, setCompanyName] = useState('');

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
      case 'Dashboard': return <Dashboard />;
      case 'Tasks and Projects': return <TasksProjects />;
      case 'Employees List': return <EmployeesList />;
      case 'Company Structure': return <CompanyStructure />;
      case 'Work Groups': return <Workgroups />;
      case 'Messenger': return <Messenger />;
      case 'CRM': return <Crm />;
      case 'Manage Leaves': return <ManageLeaves />;
      case 'Time & Attendance':
      case 'Attendance': return <Attendance />;
      case 'Work Reports':
      case 'Reports': return <Reports />;
      default: return <UserProfile />;
    }
  };

  const iconStyle = (active) => ({ size: 22, color: active ? '#fff' : undefined });

  const navItems = [
    {
      text: 'Dashboard',
      icon: <HiOutlineSquares2X2 {...iconStyle(selectedComponent === 'Dashboard')} />,
    },
    {
      text: 'Tasks and Projects',
      icon: <HiOutlineClipboardDocumentCheck {...iconStyle(selectedComponent === 'Tasks and Projects')} />,
    },
    {
      text: 'Employees List',
      icon: <HiOutlineUsers {...iconStyle(selectedComponent === 'Employees List')} />,
    },
    {
      text: 'Company Structure',
      icon: <HiOutlineBuildingOffice2 {...iconStyle(selectedComponent === 'Company Structure')} />,
    },
    {
      text: 'Work Groups',
      icon: <HiOutlineUserGroup {...iconStyle(selectedComponent === 'Work Groups')} />,
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
      text: 'Manage Leaves',
      icon: <HiOutlineCalendarDays {...iconStyle(selectedComponent === 'Manage Leaves')} />,
    },
    {
      text: 'Time & Attendance',
      icon: <HiOutlineClock {...iconStyle(selectedComponent === 'Time & Attendance' || selectedComponent === 'Attendance')} />,
    },
    {
      text: 'Work Reports',
      icon: <HiOutlineChartBar {...iconStyle(selectedComponent === 'Work Reports' || selectedComponent === 'Reports')} />,
    },
  ];

  return (
    <AppShell
      navItems={navItems}
      active={selectedComponent}
      onNavigate={handleListItemOnClick}
      userPhoto={userPhoto}
      userName={userName}
      userRole={localStorage.getItem('userRole') || 'Member'}
      userCompany={companyName}
      onLogout={handleLogout}
      onProfile={() => handleListItemOnClick('Profile')}
      loading={loading}
    >
      {renderComponent()}
    </AppShell>
  );
};

export default Sidebar;