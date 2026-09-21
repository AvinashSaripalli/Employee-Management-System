import React, { useState } from 'react';
import {
  AppBar, Toolbar, Box, Drawer, Typography, List, ListItem,
  ListItemButton, ListItemIcon, IconButton, Menu, MenuItem, Divider,
  Avatar, Badge, Chip, CircularProgress, Tooltip,
} from '@mui/material';
import { HiOutlineMagnifyingGlass, HiOutlineBell, HiOutlineArrowPath, HiOutlineArrowRightOnRectangle, HiOutlineChevronDown, HiOutlineInformationCircle, HiOutlineClipboardDocumentCheck, HiOutlineCalendarDays, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineBars3, HiOutlineChevronDoubleLeft, HiOutlineChevronDoubleRight } from 'react-icons/hi2';
import axios from '../../api/axios';

const OPEN_WIDTH = 256;
const CLOSED_WIDTH = 82;
const TOPBAR_HEIGHT = 68;

// Corner radius shared by the selected and hover states of sidebar items.
// Use '0px' for perfectly square, '4px' for slight, '12px' for softer.
const NAV_ITEM_RADIUS = '8px';

const getInitials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

const AppShell = ({
  navItems,
  active,
  onNavigate,
  userPhoto = '',
  userName = 'User',
  userRole = '',
  userCompany = '',
  onLogout,
  onProfile,
  topbarRight,
  loading,
  loadingComponent,
  children,
}) => {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState(() => {
    const key = `readNotifications:${localStorage.getItem('userId') || 'guest'}`;
    try {
      return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      return [];
    }
  });

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const readNotificationsKey = `readNotifications:${localStorage.getItem('userId') || 'guest'}`;

  const persistReadNotificationIds = (ids) => {
    setReadNotificationIds(ids);
    localStorage.setItem(readNotificationsKey, JSON.stringify(ids.slice(-100)));
  };

  const fetchNotifications = async () => {
    const companyName = localStorage.getItem('companyName');
    const role = localStorage.getItem('userRole');
    const department = localStorage.getItem('userDepartment');
    if (!companyName) return;

    setNotificationsLoading(true);
    try {
      const requests = [
        axios.get('/tasks', { params: { companyName, myTasks: 'true' } }),
        axios.get('/leaves/recent'),
      ];
      const canReviewLeaves = ['Admin', 'Manager'].includes(role);
      if (canReviewLeaves) {
        requests.push(axios.get('/leaves/leave', { params: { companyName, status: 'Pending' } }));
      }

      const results = await Promise.allSettled(requests);
      const taskResult = results[0];
      const now = new Date();
      const taskNotifications = taskResult.status === 'fulfilled'
        ? (Array.isArray(taskResult.value.data) ? taskResult.value.data : [])
            .filter((task) => task.status !== 5 && task.status !== 7)
            .slice(0, 5)
            .map((task) => {
              const deadline = task.deadline ? new Date(task.deadline) : null;
              const overdue = deadline && deadline < now;
              return {
                id: `task-${task.id}`,
                category: overdue ? 'urgent' : 'task',
                title: overdue ? 'Task overdue' : 'Task assigned to you',
                detail: `${task.title || 'Untitled task'}${task.status === 3 ? ' · In progress' : ''}`,
                createdAt: task.updatedAt || task.createdAt,
                target: currentRoleIsManager(role) ? 'Tasks and Projects' : 'Tasks',
              };
            })
        : [];
      const recentLeaveResult = results[1];
      const leaveNotifications = recentLeaveResult?.status === 'fulfilled'
        ? (Array.isArray(recentLeaveResult.value.data) ? recentLeaveResult.value.data : [])
          .filter((leave) => ['Approved', 'Rejected'].includes(leave.status))
          .slice(0, 5).map((leave) => ({
            id: `leave-${leave.id}`,
            category: leave.status === 'Approved' ? 'success' : 'leave',
            title: `Leave request ${String(leave.status).toLowerCase()}`,
            detail: `${leave.leave_type || 'Leave'} · ${leave.start_date || 'Date pending'}`,
            createdAt: leave.updated_at || leave.created_at,
            target: currentRoleIsManager(role) ? 'Manage Leaves' : 'My Leaves',
          }))
        : [];
      const pendingLeaveResult = results[2];
      const pendingLeaveNotifications = pendingLeaveResult?.status === 'fulfilled'
        ? (Array.isArray(pendingLeaveResult.value.data) ? pendingLeaveResult.value.data : [])
          .slice(0, 5).map((leave) => ({
            id: `pending-leave-${leave.id}`,
            category: 'leave',
            title: 'Leave request needs review',
            detail: `${leave.employee_name || 'Employee'} · ${leave.leave_type || 'Leave'}`,
            createdAt: leave.created_at,
            target: 'Manage Leaves',
          }))
        : [];
      const nextNotifications = [...pendingLeaveNotifications, ...leaveNotifications, ...taskNotifications]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setNotifications(nextNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setNotificationsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchNotifications();
    const interval = window.setInterval(fetchNotifications, 60000);
    return () => window.clearInterval(interval);
  }, []);

  const currentRoleIsManager = (role) => ['Admin', 'Manager'].includes(role);
  const unreadNotifications = notifications.filter((notification) => !readNotificationIds.includes(notification.id));

  const formatNotificationTime = (value) => {
    if (!value) return 'Now';
    const timestamp = new Date(value).getTime();
    if (Number.isNaN(timestamp)) return 'Now';
    const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const handleNotificationClick = (notification) => {
    persistReadNotificationIds([...new Set([...readNotificationIds, notification.id])]);
    setNotificationAnchor(null);
    if (notification.target && onNavigate) onNavigate(notification.target);
  };

  const drawerWidth = open ? OPEN_WIDTH : CLOSED_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Full-height sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            overflow: 'hidden',
            boxSizing: 'border-box',
            bgcolor: '#FFFFFF',
            borderRight: '1px solid #E8ECF5',
            transition: 'width 240ms cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
      >
        {/* Brand */}
        <Box sx={{ px: open ? 1.6 : 0, pt: 2.2, pb: 1.6, display: 'flex', alignItems: 'center', justifyContent: open ? 'flex-start' : 'center', gap: open ? 1.2 : 0 }}>
          {open ? (
            <>
              <img
                src="/KN Advisors.png"
                alt="KN Advisors Logo"
                style={{ height: 40, width: 'auto', objectFit: 'contain', maxWidth: 210 }}
              />
              <Typography sx={{ color: '#14286D', fontSize: '1.15rem', fontWeight: 800, whiteSpace: 'nowrap' }}>
                KN Advisors
              </Typography>
            </>
          ) : (
            <img
              src="/KN Advisors.png"
              alt="KN Advisors Logo"
              style={{ height: 32, width: 'auto', objectFit: 'contain' }}
            />
          )}
        </Box>
        <Divider sx={{ mx: 2 }} />

        {/* Nav */}
        <List sx={{ px: open ? 1.2 : 0, pt: 1.5 }}>
          {navItems.map((item) => {
            const isActive = active === item.text;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => onNavigate(item.text)}
                  sx={{
                    height: 46,
                    borderRadius: open ? NAV_ITEM_RADIUS : 0,
                    px: open ? 2 : 0,
                    justifyContent: open ? 'flex-start' : 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': { bgcolor: isActive ? 'transparent' : '#F1F5FF' },
                  }}
                >
                  {isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: open ? NAV_ITEM_RADIUS : 0,
                        background: 'linear-gradient(135deg, #14286D 0%, #1E3AA8 100%)',
                        boxShadow: open ? '0 6px 16px rgba(20, 40, 109, 0.28)' : 'none',
                        zIndex: 0,
                      }}
                    />
                  )}
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      width: 22,
                      flexShrink: 0,
                      mr: open ? 1.6 : 0,
                      color: isActive ? '#FFFFFF' : '#5B6B99',
                      zIndex: 1,
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <Box
                    sx={{
                      opacity: open ? 1 : 0,
                      width: open ? 'auto' : 0,
                      overflow: 'hidden',
                      transition: 'opacity 200ms',
                      zIndex: 1,
                      color: isActive ? '#FFFFFF' : '#344067',
                      fontWeight: isActive ? 700 : 600,
                      fontSize: '0.9rem',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.text}
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ flexGrow: 1 }} />

        {/* Collapse toggle */}
        <Box sx={{ px: open ? 1.2 : 0, pt: 1.2, pb: 1.6, display: 'flex', justifyContent: 'center' }}>
          <IconButton
            onClick={() => setOpen(!open)}
            sx={{
              bgcolor: '#F3F6FB',
              color: 'primary.main',
              width: 38,
              height: 38,
              '&:hover': { bgcolor: '#E9EEFA' },
            }}
          >
            {open ? <HiOutlineChevronDoubleLeft size={22} /> : <HiOutlineChevronDoubleRight size={22} />}
          </IconButton>
        </Box>
      </Drawer>

      {/* Topbar (only over the content area) */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          left: drawerWidth,
          width: `calc(100% - ${drawerWidth}px)`,
          zIndex: (theme) => theme.zIndex.drawer + 2,
          bgcolor: '#FFFFFF',
          borderBottom: '1px solid #E8ECF5',
          height: TOPBAR_HEIGHT,
          transition: 'left 240ms cubic-bezier(0.4, 0, 0.2, 1), width 240ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <Toolbar sx={{ height: TOPBAR_HEIGHT, minHeight: `${TOPBAR_HEIGHT}px !important`, gap: 1, px: { xs: 1, md: 2 } }}>

          <Box sx={{ lineHeight: 1.1, display: { xs: 'none', sm: 'block' }, minWidth: 0 }}>
            <Typography variant="h6" sx={{ mb: 0.25, fontSize: { sm: '1.05rem' }, color: 'primary.main' }} noWrap>
              {active}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block' }}>
              {userCompany}
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {topbarRight}

          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              alignItems: 'center',
              gap: 1,
              bgcolor: 'background.default',
              borderRadius: 3,
              px: 1.5,
              py: 0.5,
              color: 'text.disabled',
            }}
          >
            <HiOutlineMagnifyingGlass size={16} />
            <Typography variant="caption" color="text.secondary">
              Search…
            </Typography>
          </Box>

          <IconButton
            onClick={(event) => { setNotificationAnchor(event.currentTarget); fetchNotifications(); }}
            sx={{ color: 'text.primary', display: { xs: 'none', sm: 'inline-flex' } }}
            aria-label="Notifications"
          >
            <Badge badgeContent={unreadNotifications.length || null} color="secondary" max={9}>
              <HiOutlineBell size={20} />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={notificationAnchor}
            open={Boolean(notificationAnchor)}
            onClose={() => setNotificationAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{ paper: { sx: { width: 330, maxWidth: 'calc(100vw - 32px)' } } }}
          >
            <Box sx={{ px: 2, py: 1.2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Notifications</Typography>
                <Typography variant="caption" color="text.secondary">
                  {unreadNotifications.length ? `${unreadNotifications.length} unread` : 'All caught up'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.25 }}>
                {unreadNotifications.length > 0 && (
                  <Tooltip title="Mark all as read">
                    <IconButton
                      size="small"
                      onClick={() => persistReadNotificationIds(notifications.map((notification) => notification.id))}
                      aria-label="Mark all notifications as read"
                    >
                      <HiOutlineCheckCircle size={17} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Refresh notifications">
                  <IconButton size="small" onClick={fetchNotifications} aria-label="Refresh notifications">
                    <HiOutlineArrowPath size={17} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
            <Divider />
            {notificationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}><CircularProgress size={22} /></Box>
            ) : notifications.length > 0 ? (
              notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 1.2,
                    whiteSpace: 'normal',
                    bgcolor: readNotificationIds.includes(notification.id) ? 'transparent' : '#F6F8FE',
                    '&:hover': { bgcolor: '#EEF2FF' },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 34, color: notification.category === 'urgent' ? 'error.main' : notification.category === 'leave' ? 'warning.main' : notification.category === 'success' ? 'success.main' : 'primary.main' }}>
                    {notification.category === 'urgent' ? <HiOutlineExclamationTriangle size={18} /> : notification.category === 'leave' ? <HiOutlineInformationCircle size={18} /> : notification.category === 'success' ? <HiOutlineCheckCircle size={18} /> : <HiOutlineClipboardDocumentCheck size={18} />}
                  </ListItemIcon>
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>{notification.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>{notification.detail}</Typography>
                    <Typography variant="caption" color="text.disabled">{formatNotificationTime(notification.createdAt)}</Typography>
                  </Box>
                </MenuItem>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3, textAlign: 'center' }}>
                You are all caught up.
              </Typography>
            )}
          </Menu>

          <Divider orientation="vertical" flexItem sx={{ my: 1.5, display: { xs: 'none', sm: 'block' } }} />

          <Chip
            avatar={<Avatar alt={userName} src={userPhoto || undefined}>{getInitials(userName)}</Avatar>}
            label={<Typography sx={{ display: { xs: 'none', md: 'block' } }}>{userName}</Typography>}
            onClick={handleMenu}
            deleteIcon={<HiOutlineChevronDown size={16} />}
            onDelete={handleMenu}
            sx={{
              bgcolor: 'background.default',
              fontWeight: 600,
              color: 'text.primary',
              borderRadius: 12,
              px: 0.5,
              '& .MuiChip-deleteIcon': { fontSize: 16, color: 'text.secondary' },
            }}
          />
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle1" sx={{ lineHeight: 1.2 }}>{userName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {userRole}{userRole && userCompany ? ' • ' : ''}{userCompany}
              </Typography>
            </Box>
            <Divider sx={{ m: 1 }} />
            {onProfile && (
              <MenuItem onClick={() => { handleMenuClose(); onProfile(); }}>
                <ListItemIcon><HiOutlineInformationCircle size={18} /></ListItemIcon>
                Profile
              </MenuItem>
            )}
            <MenuItem onClick={() => { handleMenuClose(); onLogout && onLogout(); }}>
              <ListItemIcon><HiOutlineArrowRightOnRectangle size={18} /></ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          mt: `${TOPBAR_HEIGHT}px`,
          minHeight: `calc(100vh - ${TOPBAR_HEIGHT}px)`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          {loading ? (
            loadingComponent || (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress size={34} thickness={4} sx={{ color: 'primary.main' }} />
              </Box>
            )
          ) : (
            children
          )}
        </Box>
      </Box>
    </Box>
  );
};

export default AppShell;