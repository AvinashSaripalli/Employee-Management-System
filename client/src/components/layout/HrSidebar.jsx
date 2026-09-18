import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Box, Divider, Avatar, Menu, MenuItem, IconButton, Collapse, Tooltip
} from '@mui/material';
import {  ExitToApp as ExitToAppIcon, List as ListIcon,  Person as PersonIcon } from '@mui/icons-material';
import Dashboard from '../dashboard/Dashboard';
import { useNavigate } from 'react-router-dom';
import { ArrowCircleLeft, ArrowCircleRight, ChartSquare, Element4, LogoutCurve,Notepad2,Profile2User,ArchiveBook, Activity} from "iconsax-react";
import { ThreeDot } from 'react-loading-indicators';
import EmployeeManagement from '../employees/EmployeeManagement';
import Attendance from '../attendance/Attendance';
import LeaveManagement from '../leaves/LeaveManagement';
import EmployeesReports from '../reports/EmployeesReports';
import HrDashboard from '../dashboard/HrDashboard';

const HrSidebar = () => {
  const [selectedComponent, setSelectedComponent] = useState('EmployeesList');
  const [loading, setLoading] = useState(false);
  const [userPhoto, setUserPhoto] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    setUserPhoto(localStorage.getItem('userPhoto') || '');
    setCompanyName(localStorage.getItem('companyName') || '');
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
    }, 1000);
  };

  const renderComponent = () => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <ThreeDot variant="bob" color="#14286d" size="small" text="" textColor="" />
      </Box>;
    }
    switch (selectedComponent) {
      case 'Dashboard': return <HrDashboard />;
      case 'Employee': return <EmployeeManagement />;
      case 'Attendance': return <Attendance />;
      case 'Leaves': return <LeaveManagement />;
      case 'Employees Reports': return <EmployeesReports />;
      default: return <Dashboard />;
    }
  };

  const handleAvatarClick = (event) => {
    setMenuAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ background: '#fff', boxShadow: 'none', borderBottom: '1px solid #e0e0e0', zIndex: 1201 }}>
        <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
        </Box>
          <Tooltip title="Profile">
            <Avatar src={userPhoto} sx={{ cursor: 'pointer' }} onClick={handleAvatarClick} />
          </Tooltip>
          <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={handleMenuClose}>
            <MenuItem onClick={() => { handleListItemOnClick('Profile'); handleMenuClose(); }}>Profile</MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" sx={{
       // mt:'64px',
        '& .MuiDrawer-paper': {
          //mt:'56px',
          width: sidebarOpen ? 220 : 60,
          transition: 'width 0.3s',
          overflowX: 'hidden',
          boxSizing: 'border-box',
          background: '#ffffff',
          color: '#14286D',
          zIndex: 1300, 
        },
      }}>
        <List>
        <ListItem disablePadding onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ mt:1.8,mb:1.8, justifyContent:'center'}}>
          <img 
            src={sidebarOpen ? '/image 25.png' : '/image 26.png'} 
            alt="Company Logo" 
            style={{ height: '26px', width: 'auto', cursor: 'pointer', objectFit: 'contain' }} 
          />
        </ListItem>
        <Divider/>
          {[
            
            { 
              text: 'Dashboard', 
              icon: selectedComponent === 'Dashboard' 
                ? <Element4 size="25" color="#14286d" variant="Bold"/>  
                : <Element4 size="25" color="#14286d" variant="Outline"/> 
            },
            { text: 'Employee', icon: selectedComponent === 'Employee'
                ?  <Profile2User size="24" variant="Bold"/>
                :  <Profile2User size="24" variant="Outline"/>
            },
            { text: 'Attendance', icon:  selectedComponent === 'Attendance' 
                ?  <ArchiveBook size="25" variant="Bold"/>
                :   <ArchiveBook size="25" variant="Outline"/> 
            },
            { text: 'Leaves', icon: selectedComponent === 'Leaves' 
                ? <Notepad2 size="25" color="#14286d" variant="Bold"/>  
                : <Notepad2 size="25" color="#14286d" variant="Outline"/> 
            },
            { text: 'Employees Reports', icon: selectedComponent === 'Employees Reports' 
              ? <Activity size="25" color="#14286d" variant="Bold"/>
              : <Activity size="25" color="#14286d" variant="Outline"/>
            }
          ].map(({ text, icon }) => (
            <ListItem sx={{ justifyContent: 'center',height:'50px' }} disablePadding key={text}>
              <ListItemButton onClick={() => handleListItemOnClick(text)}>
                <ListItemIcon sx={{ color: '#14286D' }}>{icon}</ListItemIcon>
                <Collapse in={sidebarOpen} orientation="horizontal">
                  <ListItemText primary={text} />
                </Collapse>
              </ListItemButton>
            </ListItem>
          ))}


          <ListItem sx={{justifyContent:'center'}} disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon sx={{ color: '#14286D' }}><LogoutCurve size="25" /></ListItemIcon>
              <Collapse in={sidebarOpen} orientation="horizontal"><ListItemText primary="Logout" /></Collapse>
            </ListItemButton>
          </ListItem>
          {/* <ListItem sx={{ justifyContent: sidebarOpen ? 'flex-end' : 'center', mt: '360px' }}>
            <IconButton onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ color: '#000' }}>
              {sidebarOpen ?  <ArrowCircleLeft size="22" color="#14286d"/> : <ArrowCircleRight size="24" color="#14286d"/>}
            </IconButton>
          </ListItem> */}
          <ListItem sx={{ justifyContent: sidebarOpen ? 'flex-end' : 'center', mt: '220px' }}>
            <IconButton onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ color: '#000' }}>
              {sidebarOpen ? <ArrowCircleLeft size="22" color="#14286d"/> : <ArrowCircleRight size="24" color="#14286d"/>}
            </IconButton>
          </ListItem>
        </List>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, mt:"64px",  ml: sidebarOpen ? '60px' : '60px',backgroundColor:'#f4f7fe',minHeight: "calc(100vh - 64px)",width: "100vh",   }}>
        {renderComponent()}
      </Box>
    </Box>
  );
};

export default HrSidebar;