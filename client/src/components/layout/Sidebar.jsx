import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Element4, RowVertical, HierarchySquare2, People, TaskSquare, Notepad2, Activity } from 'iconsax-react';
import AppShell from './AppShell';
import Dashboard from '../dashboard/Dashboard';
import TasksProjects from '../tasks/TasksProjects';
import EmployeesList from '../employees/EmployeesList';
import CompanyStructure from '../company/CompanyStructure';
import Workgroups from '../workgroups/Workgroups';
import ManageLeaves from '../leaves/ManageLeaves';
import Reports from '../reports/Reports';
import UserProfile from '../profile/UserProfile';

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
      case 'Manage Leaves': return <ManageLeaves />;
      case 'Reports': return <Reports />;
      default: return <UserProfile />;
    }
  };

  const iconProps = (size = 22) => ({ size, variant: 'Outline' });
  const activeProps = (size = 22) => ({ size, variant: 'Bold' });

  const navItems = [
    {
      text: 'Dashboard',
      icon: selectedComponent === 'Dashboard' ? <Element4 {...activeProps(22)} /> : <Element4 {...iconProps(22)} />,
    },
    {
      text: 'Tasks and Projects',
      icon: selectedComponent === 'Tasks and Projects' ? <TaskSquare {...activeProps(22)} /> : <TaskSquare {...iconProps(22)} />,
    },
    {
      text: 'Employees List',
      icon: selectedComponent === 'Employees List' ? <RowVertical {...activeProps(22)} /> : <RowVertical {...iconProps(22)} />,
    },
    {
      text: 'Company Structure',
      icon: selectedComponent === 'Company Structure' ? <HierarchySquare2 {...activeProps(22)} /> : <HierarchySquare2 {...iconProps(22)} />,
    },
    {
      text: 'Work Groups',
      icon: selectedComponent === 'Work Groups' ? <People {...activeProps(22)} /> : <People {...iconProps(22)} />,
    },
    {
      text: 'Manage Leaves',
      icon: selectedComponent === 'Manage Leaves' ? <Notepad2 {...activeProps(22)} /> : <Notepad2 {...iconProps(22)} />,
    },
    {
      text: 'Reports',
      icon: selectedComponent === 'Reports' ? <Activity {...activeProps(22)} /> : <Activity {...iconProps(22)} />,
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