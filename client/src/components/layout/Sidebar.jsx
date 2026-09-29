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
  HiOutlineCube,
  HiOutlineArrowRightOnRectangle,
} from 'react-icons/hi2';
import axios from '../../api/axios';
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
import AssetManagementHub from '../assets/AssetManagementHub';
import OffboardingHub from '../offboarding/OffboardingHub';

const sanitizePhoto = (val) => {
  if (!val || val === 'null' || val === 'undefined') return '';
  return String(val).trim();
};

const Sidebar = () => {
  const [selectedComponent, setSelectedComponent] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [userPhoto, setUserPhoto] = useState(() => sanitizePhoto(localStorage.getItem('userPhoto')));
  const [userName, setUserName] = useState(() =>
    `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim() || 'User'
  );
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('companyName') || '');
  const [deptRole, setDeptRole] = useState(() => localStorage.getItem('departmentRole') || 'Member');

  useEffect(() => {
    // 1. Initial sync from local storage
    const currentStoredPhoto = sanitizePhoto(localStorage.getItem('userPhoto'));
    setUserPhoto(currentStoredPhoto);
    setCompanyName(localStorage.getItem('companyName') || '');
    setDeptRole(localStorage.getItem('departmentRole') || 'Member');
    setUserName(
      `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim() || 'User'
    );

    // 2. Fetch authoritative profile from /users/me so photo and identity always stay in sync
    const fetchCurrentProfile = async () => {
      try {
        const res = await axios.get('/users/me');
        if (res.data) {
          const u = res.data;
          const cleanPhoto = sanitizePhoto(u.photo);
          setUserPhoto(cleanPhoto);
          if (cleanPhoto) {
            localStorage.setItem('userPhoto', cleanPhoto);
          } else {
            localStorage.removeItem('userPhoto');
          }
          if (u.firstName) localStorage.setItem('userFirstName', u.firstName);
          if (u.lastName) localStorage.setItem('userLastName', u.lastName);
          if (u.companyName) {
            setCompanyName(u.companyName);
            localStorage.setItem('companyName', u.companyName);
          }
          if (u.departmentRole) {
            setDeptRole(u.departmentRole);
            localStorage.setItem('departmentRole', u.departmentRole);
          }
          setUserName(`${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User');
        }
      } catch (err) {
        const email = localStorage.getItem('userEmail');
        if (email) {
          try {
            const res = await axios.get('/users/by-email', { params: { email } });
            if (res.data) {
              const cleanPhoto = sanitizePhoto(res.data.photo);
              setUserPhoto(cleanPhoto);
              if (cleanPhoto) localStorage.setItem('userPhoto', cleanPhoto);
            }
          } catch (_) {}
        }
      }
    };

    fetchCurrentProfile();

    // 3. Real-time sync on photo update
    const handleProfileUpdate = (e) => {
      const updatedPhoto = sanitizePhoto(e.detail?.photo || localStorage.getItem('userPhoto'));
      setUserPhoto(updatedPhoto);
      if (updatedPhoto) localStorage.setItem('userPhoto', updatedPhoto);
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
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
      case 'Asset Management':
      case 'Assets': return <AssetManagementHub />;
      case 'Resignation & Offboarding':
      case 'Offboarding': return <OffboardingHub />;
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
      text: 'Messenger',
      icon: <HiOutlineChatBubbleLeftRight {...iconStyle(selectedComponent === 'Messenger')} />,
    },
    {
      text: 'Tasks and Projects',
      icon: <HiOutlineClipboardDocumentCheck {...iconStyle(selectedComponent === 'Tasks and Projects')} />,
    },
    {
      text: 'Work Groups',
      icon: <HiOutlineUserGroup {...iconStyle(selectedComponent === 'Work Groups')} />,
    },
    {
      text: 'CRM',
      icon: <HiOutlineBriefcase {...iconStyle(selectedComponent === 'CRM')} />,
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
      text: 'Time & Attendance',
      icon: <HiOutlineClock {...iconStyle(selectedComponent === 'Time & Attendance' || selectedComponent === 'Attendance')} />,
    },
    {
      text: 'Work Reports',
      icon: <HiOutlineChartBar {...iconStyle(selectedComponent === 'Work Reports' || selectedComponent === 'Reports')} />,
    },
    {
      text: 'Manage Leaves',
      icon: <HiOutlineCalendarDays {...iconStyle(selectedComponent === 'Manage Leaves')} />,
    },
    {
      text: 'Asset Management',
      icon: <HiOutlineCube {...iconStyle(selectedComponent === 'Asset Management' || selectedComponent === 'Assets')} />,
    },
    {
      text: 'Resignation & Offboarding',
      icon: <HiOutlineArrowRightOnRectangle {...iconStyle(selectedComponent === 'Resignation & Offboarding' || selectedComponent === 'Offboarding')} />,
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
      departmentRole={deptRole}
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