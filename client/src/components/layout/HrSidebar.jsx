import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Element4, Profile2User, ArchiveBook, Notepad2, Activity } from 'iconsax-react';
import AppShell from './AppShell';
import HrDashboard from '../dashboard/HrDashboard';
import EmployeeManagement from '../employees/EmployeeManagement';
import Attendance from '../attendance/Attendance';
import LeaveManagement from '../leaves/LeaveManagement';
import EmployeesReports from '../reports/EmployeesReports';

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
      case 'Employees Reports': return <EmployeesReports />;
      default: return <HrDashboard />;
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
      text: 'Employee',
      icon: selectedComponent === 'Employee' ? <Profile2User {...activeProps(22)} /> : <Profile2User {...iconProps(22)} />,
    },
    {
      text: 'Attendance',
      icon: selectedComponent === 'Attendance' ? <ArchiveBook {...activeProps(22)} /> : <ArchiveBook {...iconProps(22)} />,
    },
    {
      text: 'Leaves',
      icon: selectedComponent === 'Leaves' ? <Notepad2 {...activeProps(22)} /> : <Notepad2 {...iconProps(22)} />,
    },
    {
      text: 'Employees Reports',
      icon: selectedComponent === 'Employees Reports' ? <Activity {...activeProps(22)} /> : <Activity {...iconProps(22)} />,
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