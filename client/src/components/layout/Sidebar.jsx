import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Typography, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, Box, Divider, Avatar, Menu, MenuItem, IconButton, Collapse, Tooltip
} from '@mui/material';
import {  ExitToApp as ExitToAppIcon, List as ListIcon,  Person as PersonIcon } from '@mui/icons-material';
import Dashboard from '../dashboard/Dashboard';
import EmployeesList from '../employees/EmployeesList';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import UserProfile from '../profile/UserProfile';
import { useNavigate } from 'react-router-dom';
import { ArrowCircleLeft, ArrowCircleRight, ChartSquare, Element4, LogoutCurve,Notepad2,People,Profile,RowVertical,Activity, HierarchySquare2, TaskSquare} from "iconsax-react";
import ManageLeaves from '../leaves/ManageLeaves';
import Reports from '../reports/Reports';
import { ThreeDot } from 'react-loading-indicators';
import CompanyStructure from '../company/CompanyStructure';
import Workgroups from '../workgroups/Workgroups';
import TasksProjects from '../tasks/TasksProjects';

const Sidebar = () => {
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
          width: sidebarOpen ? 240 : 60,
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
            { text: 'Dashboard', icon: selectedComponent === 'Dashboard'
                ?  <Element4 size="24" variant="Bold"/>
                :  <Element4 size="24" variant="Outline"/>
            },
            { text: 'Tasks and Projects', icon: selectedComponent === 'Tasks and Projects'
                ? <TaskSquare size="25" color="#14286d" variant="Bold"/>  
                : <TaskSquare size="25" color="#14286d" variant="Outline"/> 
            },
            { text: 'Employees List', icon:  selectedComponent === 'Employees List' 
                ?  <RowVertical size="25" variant="Bold"/>
                :   <RowVertical size="25" variant="Outline"/> 
            },
            { text: 'Company Structure', icon:  selectedComponent === 'Company Structure' 
                ?  <HierarchySquare2 size="25" variant="Bold"/>
                :   <HierarchySquare2 size="25" variant="Outline"/> 
            },
            { text: 'Work Groups', icon:  selectedComponent === 'Work Groups' 
                ?  <People size="25" variant="Bold"/>
                :   <People size="25" variant="Outline"/> 
            },
            { text: 'Manage Leaves', icon: selectedComponent === 'Manage Leaves' 
                ? <Notepad2 size="25" color="#14286d" variant="Bold"/>  
                : <Notepad2 size="25" color="#14286d" variant="Outline"/> 
            },
            { text: 'Reports', icon: selectedComponent === 'Reports' 
              ? <Activity size="25" color="#14286d" variant="Bold"/>
              : <Activity size="25" color="#14286d" variant="Outline"/>
            },
            // { 
            //   text: 'Profile', 
            //   icon: selectedComponent === 'Profile' 
            //     ? <Profile size="25" color="#14286d" variant="Bold"/>  
            //     : <Profile size="25" color="#14286d" variant="Outline"/> 
            // }
          ].map(({ text, icon }) => (
            <ListItem sx={{ justifyContent: 'center',height:'45px' }} disablePadding key={text}>
              <ListItemButton onClick={() => handleListItemOnClick(text)}>
                <ListItemIcon sx={{ color: '#14286D' }}>{icon}</ListItemIcon>
                <Collapse in={sidebarOpen} orientation="horizontal">
                  <ListItemText primary={text} />
                </Collapse>
              </ListItemButton>
            </ListItem>
          ))}


          {/* <ListItem sx={{justifyContent:'center'}} disablePadding>
            <ListItemButton onClick={handleLogout}>
              <ListItemIcon sx={{ color: '#14286D' }}><LogoutCurve size="25" /></ListItemIcon>
              <Collapse in={sidebarOpen} orientation="horizontal"><ListItemText primary="Logout" /></Collapse>
            </ListItemButton>
          </ListItem> */}
          {/* <ListItem sx={{ justifyContent: sidebarOpen ? 'flex-end' : 'center', mt: '360px' }}>
            <IconButton onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ color: '#000' }}>
              {sidebarOpen ?  <ArrowCircleLeft size="22" color="#14286d"/> : <ArrowCircleRight size="24" color="#14286d"/>}
            </IconButton>
          </ListItem> */}
          <ListItem sx={{ justifyContent: sidebarOpen ? 'flex-end' : 'center', mt: '250px' }}>
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

export default Sidebar;

