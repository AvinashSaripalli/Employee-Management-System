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
  HiOutlineLifebuoy,
} from 'react-icons/hi2';
import axios from '../../api/axios';
import { useAuth } from '../../redux/hooks';
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
import HelpdeskHub from '../helpdesk/HelpdeskHub';

const sanitizePhoto = (val) => {
  if (!val || val === 'null' || val === 'undefined') return '';
  return String(val).trim();
};

const Sidebar = () => {
  const [selectedComponent, setSelectedComponent] = useState('Dashboard');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, role, departmentRole, companyName, logout: reduxLogout, updateUser } = useAuth();
  
  const [userPhoto, setUserPhoto] = useState(() => sanitizePhoto(user?.photo || localStorage.getItem('userPhoto')));
  const [userName, setUserName] = useState(() => user?.name || `${localStorage.getItem('userFirstName') || ''} ${localStorage.getItem('userLastName') || ''}`.trim() || 'User');
  const [currentCompany, setCurrentCompany] = useState(() => companyName || localStorage.getItem('companyName') || '');
  const [deptRole, setDeptRole] = useState(() => departmentRole || localStorage.getItem('departmentRole') || 'Member');

  useEffect(() => {
    // 1. Initial sync from Redux user state
    if (user) {
      setUserPhoto(sanitizePhoto(user.photo));
      setCurrentCompany(user.companyName || '');
      setDeptRole(user.departmentRole || 'Member');
      setUserName(user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User');
    }

    // 2. Fetch authoritative profile from /users/me so photo and identity always stay in sync
    const fetchCurrentProfile = async () => {
      try {
        const res = await axios.get('/users/me');
        if (res.data) {
          const u = res.data;
          updateUser(u);
          const cleanPhoto = sanitizePhoto(u.photo);
          setUserPhoto(cleanPhoto);
          if (u.companyName) setCurrentCompany(u.companyName);
          if (u.departmentRole) setDeptRole(u.departmentRole);
          setUserName(`${u.firstName || ''} ${u.lastName || ''}`.trim() || 'User');
        }
      } catch (err) {
        const email = user?.email || localStorage.getItem('userEmail');
        if (email) {
          try {
            const res = await axios.get('/users/by-email', { params: { email } });
            if (res.data) {
              const cleanPhoto = sanitizePhoto(res.data.photo);
              setUserPhoto(cleanPhoto);
              updateUser({ photo: cleanPhoto });
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
      updateUser({ photo: updatedPhoto });
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, [user, updateUser]);

  const handleLogout = () => {
    reduxLogout();
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
      case 'Helpdesk & Requests':
      case 'Helpdesk': return <HelpdeskHub />;
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
      text: 'Helpdesk & Requests',
      icon: <HiOutlineLifebuoy {...iconStyle(selectedComponent === 'Helpdesk & Requests' || selectedComponent === 'Helpdesk')} />,
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
      userPhoto={user?.photo || userPhoto}
      userName={user?.name || userName}
      userRole={role || 'Member'}
      departmentRole={deptRole}
      userCompany={currentCompany || companyName}
      onLogout={handleLogout}
      onProfile={() => handleListItemOnClick('Profile')}
      loading={loading}
    >
      {renderComponent()}
    </AppShell>
  );
};

export default Sidebar;