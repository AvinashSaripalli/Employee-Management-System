import React, { useState } from 'react';
import {
  AppBar, Toolbar, Box, Drawer, Typography, List, ListItem,
  ListItemButton, ListItemIcon, IconButton, Menu, MenuItem, Divider,
  Avatar, Badge, Chip, CircularProgress, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, Snackbar, Popover,
} from '@mui/material';
import {
  HiOutlineMagnifyingGlass, HiOutlineBell, HiOutlineArrowPath, HiOutlineArrowRightOnRectangle,
  HiOutlineChevronDown, HiOutlineInformationCircle, HiOutlineClipboardDocumentCheck,
  HiOutlineCalendarDays, HiOutlineExclamationTriangle, HiOutlineCheckCircle, HiOutlineBars3,
  HiOutlineChevronDoubleLeft, HiOutlineChevronDoubleRight, HiOutlineEnvelope, HiOutlineIdentification,
  HiOutlineShieldCheck, HiOutlineCheck, HiOutlineClock, HiOutlineArrowRight,
  HiOutlineChatBubbleLeftRight, HiOutlineDocumentText, HiOutlineSparkles, HiOutlineXMark,
} from 'react-icons/hi2';
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
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [notificationTab, setNotificationTab] = useState('all');
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

  const userEmail = localStorage.getItem('userEmail') || '';
  const employeeId = localStorage.getItem('userEmployeeId') || '';
  const departmentRole = localStorage.getItem('departmentRole') || 'Member';

  const handleCopyEmail = async () => {
    if (!userEmail || !navigator.clipboard) return;
    await navigator.clipboard.writeText(userEmail);
    setEmailCopied(true);
  };

  const requestLogout = () => {
    handleMenuClose();
    setLogoutDialogOpen(true);
  };

  const confirmLogout = () => {
    setLogoutDialogOpen(false);
    onLogout?.();
  };

  const readNotificationsKey = `readNotifications:${localStorage.getItem('userId') || 'guest'}`;

  const persistReadNotificationIds = (ids) => {
    setReadNotificationIds(ids);
    localStorage.setItem(readNotificationsKey, JSON.stringify(ids.slice(-100)));
  };

  const fetchNotifications = async () => {
    const empId = localStorage.getItem('userEmployeeId') || localStorage.getItem('employeeId') || localStorage.getItem('userId');
    const companyName = localStorage.getItem('companyName');
    const role = localStorage.getItem('userRole');
    const department = localStorage.getItem('userDepartment');
    const deptRole = localStorage.getItem('departmentRole') || 'Member';
    if (!companyName || !empId) return;

    setNotificationsLoading(true);
    try {
      const res = await axios.get('/notifications', {
        params: {
          employeeId: empId,
          companyName,
          role,
          department,
          departmentRole: deptRole,
        },
      });
      if (res.data?.notifications) {
        setNotifications(res.data.notifications);
      }
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

  const unreadNotifications = notifications.filter((notification) => !readNotificationIds.includes(notification.id));
  const actionNotifications = notifications.filter(
    (n) => n.severity === 'urgent' || n.severity === 'action' || n.badge === 'Pending Review'
  );
  const messageNotifications = notifications.filter((n) => n.category === 'message');

  const filteredNotifications = notifications.filter((n) => {
    if (notificationTab === 'unread') return !readNotificationIds.includes(n.id);
    if (notificationTab === 'actions') {
      return n.severity === 'urgent' || n.severity === 'action' || n.badge === 'Pending Review';
    }
    if (notificationTab === 'messages') return n.category === 'message';
    return true;
  });

  const tabCounts = {
    all: notifications.length,
    unread: unreadNotifications.length,
    actions: actionNotifications.length,
    messages: messageNotifications.length,
  };

  const getNotificationVisual = (item) => {
    if (item.category === 'message') {
      const initials = getInitials(item.actorName || 'Colleague');
      return (
        <Box sx={{ position: 'relative', width: 38, height: 38, flexShrink: 0 }}>
          <Avatar
            sx={{
              width: 38,
              height: 38,
              fontSize: '12.5px',
              fontWeight: 700,
              bgcolor: '#EEF2FF',
              color: '#3730A3',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            {initials}
          </Avatar>
          <Box
            sx={{
              position: 'absolute',
              bottom: -2,
              right: -2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: '#14286D',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #FFFFFF',
            }}
          >
            <HiOutlineChatBubbleLeftRight size={9} />
          </Box>
        </Box>
      );
    }

    if (item.category === 'leave') {
      const isApproval = item.severity === 'success';
      const isUrgent = item.severity === 'urgent';
      const bg = isApproval ? '#ECFDF5' : isUrgent ? '#FEF2F2' : '#FFFBEB';
      const color = isApproval ? '#059669' : isUrgent ? '#DC2626' : '#D97706';
      return (
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            bgcolor: bg,
            color: color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isApproval ? <HiOutlineCheckCircle size={20} /> : <HiOutlineCalendarDays size={20} />}
        </Box>
      );
    }

    if (item.category === 'report') {
      const isOverdue = item.severity === 'urgent';
      return (
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            bgcolor: isOverdue ? '#FEF2F2' : '#EFF6FF',
            color: isOverdue ? '#DC2626' : '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <HiOutlineDocumentText size={20} />
        </Box>
      );
    }

    if (item.category === 'task') {
      const isOverdue = item.severity === 'urgent';
      return (
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: '10px',
            bgcolor: isOverdue ? '#FEF2F2' : '#F5F3FF',
            color: isOverdue ? '#DC2626' : '#7C3AED',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {isOverdue ? <HiOutlineExclamationTriangle size={20} /> : <HiOutlineClipboardDocumentCheck size={20} />}
        </Box>
      );
    }

    return (
      <Box
        sx={{
          width: 38,
          height: 38,
          borderRadius: '10px',
          bgcolor: '#EEF2FF',
          color: '#14286D',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <HiOutlineClock size={20} />
      </Box>
    );
  };

  const getBadgeChipStyles = (badge) => {
    switch (badge) {
      case 'Pending Review':
        return { bg: '#FEF3C7', color: '#92400E' };
      case 'Overdue':
        return { bg: '#FEE2E2', color: '#991B1B' };
      case 'Due Soon':
      case 'Due Today':
        return { bg: '#FFEDD5', color: '#9A3412' };
      case 'Approved':
      case 'Submitted':
        return { bg: '#D1FAE5', color: '#065F46' };
      case 'In Progress':
        return { bg: '#E0E7FF', color: '#3730A3' };
      case 'Message':
        return { bg: '#E0F2FE', color: '#0369A1' };
      default:
        return { bg: '#F1F5F9', color: '#475569' };
    }
  };

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

  const toggleNotificationRead = (id, e) => {
    e.stopPropagation();
    if (readNotificationIds.includes(id)) {
      persistReadNotificationIds(readNotificationIds.filter((item) => item !== id));
    } else {
      persistReadNotificationIds([...readNotificationIds, id]);
    }
  };

  const clearReadNotifications = () => {
    setNotifications((prev) => prev.filter((n) => !readNotificationIds.includes(n.id)));
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
            sx={{
              color: 'text.primary',
              display: { xs: 'none', sm: 'inline-flex' },
              transition: 'all 0.15s ease',
              '&:hover': { bgcolor: '#EEF2FF', color: '#14286D' },
            }}
            aria-label="Notifications"
          >
            <Badge
              badgeContent={unreadNotifications.length || null}
              color="error"
              max={99}
              sx={{
                '& .MuiBadge-badge': {
                  fontSize: '10.5px',
                  height: 18,
                  minWidth: 18,
                  fontWeight: 700,
                  bgcolor: '#EF4444',
                },
              }}
            >
              <HiOutlineBell size={20} />
            </Badge>
          </IconButton>

          <Popover
            open={Boolean(notificationAnchor)}
            anchorEl={notificationAnchor}
            onClose={() => setNotificationAnchor(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            slotProps={{
              paper: {
                elevation: 0,
                sx: {
                  width: { xs: 'calc(100vw - 24px)', sm: 460 },
                  maxHeight: 580,
                  borderRadius: '16px',
                  boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.22), 0 0 0 1px rgba(15, 23, 42, 0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  mt: 1.2,
                  bgcolor: '#FFFFFF',
                },
              },
            }}
          >
            {/* Header */}
            <Box
              sx={{
                px: 2.5,
                pt: 2.2,
                pb: 1.6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #F1F5F9',
                bgcolor: '#FFFFFF',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography
                  sx={{
                    fontWeight: 800,
                    color: '#0F172A',
                    fontSize: '16px',
                    letterSpacing: '-0.02em',
                  }}
                >
                  Notifications
                </Typography>
                {unreadNotifications.length > 0 && (
                  <Box
                    sx={{
                      px: 0.9,
                      py: 0.2,
                      borderRadius: '10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      bgcolor: '#EEF2FF',
                      color: '#14286D',
                    }}
                  >
                    {unreadNotifications.length} unread
                  </Box>
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {unreadNotifications.length > 0 && (
                  <Tooltip title="Mark all as read">
                    <IconButton
                      size="small"
                      onClick={() => persistReadNotificationIds(notifications.map((n) => n.id))}
                      sx={{
                        color: '#64748B',
                        p: 0.7,
                        borderRadius: '8px',
                        '&:hover': { color: '#14286D', bgcolor: '#EEF2FF' },
                      }}
                    >
                      <HiOutlineCheckCircle size={18} />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Refresh updates">
                  <IconButton
                    size="small"
                    onClick={fetchNotifications}
                    sx={{
                      color: '#64748B',
                      p: 0.7,
                      borderRadius: '8px',
                      '&:hover': { color: '#14286D', bgcolor: '#EEF2FF' },
                      animation: notificationsLoading ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                    }}
                  >
                    <HiOutlineArrowPath size={17} />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Close">
                  <IconButton
                    size="small"
                    onClick={() => setNotificationAnchor(null)}
                    sx={{
                      color: '#94A3B8',
                      p: 0.7,
                      borderRadius: '8px',
                      '&:hover': { color: '#0F172A', bgcolor: '#F1F5F9' },
                    }}
                  >
                    <HiOutlineXMark size={18} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Seamless Segmented Control (No horizontal scrolling / No text clipping) */}
            <Box sx={{ px: 2, py: 1.2, bgcolor: '#FFFFFF', borderBottom: '1px solid #F1F5F9' }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  bgcolor: '#F1F5F9',
                  p: '3px',
                  borderRadius: '9px',
                  gap: '3px',
                }}
              >
                {[
                  { key: 'all', label: 'All', count: tabCounts.all },
                  { key: 'unread', label: 'Unread', count: tabCounts.unread },
                  { key: 'actions', label: 'Actions', count: tabCounts.actions },
                  { key: 'messages', label: 'Chat', count: tabCounts.messages },
                ].map((tab) => {
                  const isSelected = notificationTab === tab.key;
                  return (
                    <Box
                      key={tab.key}
                      component="button"
                      onClick={() => setNotificationTab(tab.key)}
                      sx={{
                        border: 'none',
                        outline: 'none',
                        cursor: 'pointer',
                        py: 0.6,
                        px: 0.5,
                        borderRadius: '6px',
                        bgcolor: isSelected ? '#FFFFFF' : 'transparent',
                        boxShadow: isSelected ? '0 1px 3px rgba(15, 23, 42, 0.08)' : 'none',
                        color: isSelected ? '#0F172A' : '#64748B',
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: '11.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          color: '#0F172A',
                        },
                      }}
                    >
                      <span>{tab.label}</span>
                      {tab.count > 0 && (
                        <Box
                          component="span"
                          sx={{
                            px: 0.55,
                            py: 0.05,
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 700,
                            bgcolor: isSelected ? '#14286D' : '#E2E8F0',
                            color: isSelected ? '#FFFFFF' : '#475569',
                          }}
                        >
                          {tab.count}
                        </Box>
                      )}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Notification Feed Body */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: 400,
                bgcolor: '#FFFFFF',
              }}
            >
              {notificationsLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8, gap: 1.5 }}>
                  <CircularProgress size={24} sx={{ color: '#14286D' }} />
                  <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 500 }}>
                    Syncing live notifications...
                  </Typography>
                </Box>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => {
                  const isUnread = !readNotificationIds.includes(item.id);
                  const badgeStyles = getBadgeChipStyles(item.badge);

                  return (
                    <Box
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      sx={{
                        p: 2,
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 1.75,
                        bgcolor: isUnread ? '#F8FAFF' : '#FFFFFF',
                        borderLeft: isUnread ? '3px solid #14286D' : '3px solid transparent',
                        borderBottom: '1px solid #F1F5F9',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          bgcolor: isUnread ? '#F0F4FF' : '#F8FAFC',
                        },
                      }}
                    >
                      {/* Left: Icon or Initials Avatar */}
                      {getNotificationVisual(item)}

                      {/* Middle: Content details */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Top Line: Actor Name + Badge + Relative Time + Unread Dot */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.4 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, minWidth: 0 }}>
                            <Typography
                              noWrap
                              sx={{
                                fontSize: '13px',
                                fontWeight: 700,
                                color: '#0F172A',
                              }}
                            >
                              {item.actorName || item.title}
                            </Typography>

                            {item.badge && (
                              <Box
                                component="span"
                                sx={{
                                  px: 0.8,
                                  py: 0.15,
                                  borderRadius: '5px',
                                  fontSize: '10.5px',
                                  fontWeight: 700,
                                  bgcolor: badgeStyles.bg,
                                  color: badgeStyles.color,
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {item.badge}
                              </Box>
                            )}
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexShrink: 0 }}>
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '11px', fontWeight: 500 }}>
                              {formatNotificationTime(item.createdAt)}
                            </Typography>
                            {isUnread && (
                              <Box
                                sx={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  bgcolor: item.severity === 'urgent' ? '#EF4444' : '#2563EB',
                                  boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
                                }}
                              />
                            )}
                          </Box>
                        </Box>

                        {/* Title Headline */}
                        <Typography
                          sx={{
                            fontSize: '13px',
                            fontWeight: isUnread ? 700 : 600,
                            color: isUnread ? '#0F172A' : '#334155',
                            mb: 0.3,
                            lineHeight: 1.35,
                          }}
                        >
                          {item.title}
                        </Typography>

                        {/* Body Details */}
                        <Typography
                          sx={{
                            fontSize: '12px',
                            color: '#64748B',
                            lineHeight: 1.45,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {item.detail}
                        </Typography>

                        {/* Action Button Row */}
                        {item.actionLabel && (
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1 }}>
                            <Box
                              component="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleNotificationClick(item);
                              }}
                              sx={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 0.6,
                                px: 1.4,
                                py: 0.45,
                                borderRadius: '6px',
                                bgcolor: '#14286D',
                                color: '#FFFFFF',
                                fontSize: '11.5px',
                                fontWeight: 650,
                                border: 'none',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                boxShadow: '0 1px 2px rgba(20, 40, 109, 0.15)',
                                '&:hover': {
                                  bgcolor: '#0B1745',
                                  transform: 'translateY(-0.5px)',
                                  boxShadow: '0 3px 6px rgba(20, 40, 109, 0.25)',
                                },
                              }}
                            >
                              <span>{item.actionLabel}</span>
                              <HiOutlineArrowRight size={12} />
                            </Box>

                            <Tooltip title={!isUnread ? 'Mark as unread' : 'Mark as read'}>
                              <IconButton
                                size="small"
                                onClick={(e) => toggleNotificationRead(item.id, e)}
                                sx={{
                                  p: 0.4,
                                  color: !isUnread ? '#CBD5E1' : '#94A3B8',
                                  '&:hover': { color: '#14286D', bgcolor: '#EEF2FF' },
                                }}
                              >
                                <HiOutlineCheck size={14} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  );
                })
              ) : (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    py: 8,
                    px: 3,
                    textAlign: 'center',
                  }}
                >
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      bgcolor: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94A3B8',
                      mb: 1.5,
                    }}
                  >
                    <HiOutlineSparkles size={24} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, fontSize: '14px', color: '#1E293B', mb: 0.5 }}>
                    {notificationTab === 'unread' ? 'No unread notifications' : 'All caught up!'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', maxWidth: 280 }}>
                    {notificationTab === 'unread'
                      ? 'You have reviewed all pending alerts.'
                      : 'No new updates right now. You are up to date with shifts, reports, tasks, and messages.'}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Footer */}
            <Box
              sx={{
                px: 2.2,
                py: 1.1,
                bgcolor: '#F8FAFC',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '11px', fontWeight: 500 }}>
                {filteredNotifications.length} of {notifications.length} update(s)
              </Typography>
              {readNotificationIds.length > 0 && (
                <Button
                  size="small"
                  onClick={clearReadNotifications}
                  sx={{
                    fontSize: '11px',
                    textTransform: 'none',
                    color: '#64748B',
                    py: 0.2,
                    px: 0.8,
                    fontWeight: 600,
                    '&:hover': { color: '#14286D', bgcolor: '#EEF2FF' },
                  }}
                >
                  Hide read
                </Button>
              )}
            </Box>
          </Popover>

          <Divider orientation="vertical" flexItem sx={{ my: 1.5, display: { xs: 'none', sm: 'block' } }} />

          <Chip
            avatar={<Avatar alt={userName} src={userPhoto || undefined}>{getInitials(userName)}</Avatar>}
            label={
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.75 }}>
                <Typography sx={{ fontWeight: 600, fontSize: 13 }}>{userName}</Typography>
                {departmentRole === 'Supervisor' && (
                  <Chip
                    size="small"
                    label="Supervisor"
                    sx={{
                      height: 18,
                      fontSize: '10px',
                      fontWeight: 700,
                      bgcolor: '#ECFDF5',
                      color: '#047857',
                      border: '1px solid #A7F3D0',
                      borderRadius: '4px',
                      px: 0.5,
                      '& .MuiChip-label': { px: 0.5 },
                    }}
                  />
                )}
              </Box>
            }
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
            slotProps={{ paper: { sx: { width: 320, maxWidth: 'calc(100vw - 24px)', mt: 1 } } }}
          >
            <Box sx={{ p: 1.5, background: 'linear-gradient(135deg, #14286D 0%, #2847B8 100%)', color: '#FFFFFF' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Avatar
                  alt={userName}
                  src={userPhoto || undefined}
                  sx={{ width: 48, height: 48, bgcolor: '#FE8600', fontWeight: 800, border: '2px solid rgba(255,255,255,0.7)' }}
                >
                  {getInitials(userName)}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
                    <Typography sx={{ fontWeight: 700, lineHeight: 1.2 }} noWrap>{userName}</Typography>
                    <Chip
                      size="small"
                      label={departmentRole === 'Supervisor' ? 'Supervisor' : 'Member'}
                      sx={{
                        height: 18,
                        fontSize: '10px',
                        fontWeight: 700,
                        bgcolor: departmentRole === 'Supervisor' ? '#ECFDF5' : 'rgba(255,255,255,0.2)',
                        color: departmentRole === 'Supervisor' ? '#047857' : '#FFFFFF',
                        border: departmentRole === 'Supervisor' ? '1px solid #A7F3D0' : '1px solid rgba(255,255,255,0.35)',
                        borderRadius: '4px',
                        px: 0.5,
                        '& .MuiChip-label': { px: 0.5 },
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }} noWrap>
                    {userRole || 'Team member'}{userCompany ? ` · ${userCompany}` : ''}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.25, opacity: 0.9 }}>
                <HiOutlineShieldCheck size={15} />
                <Typography variant="caption">Active account</Typography>
              </Box>
            </Box>
            <Box sx={{ px: 2, py: 1.25 }}>
              {userEmail && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                  <HiOutlineEnvelope size={17} color="#66708C" />
                  <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1 }}>{userEmail}</Typography>
                  <Tooltip title={emailCopied ? 'Copied' : 'Copy email'}>
                    <IconButton size="small" onClick={handleCopyEmail} aria-label="Copy email">
                      {emailCopied ? <HiOutlineCheck size={16} color="#16A34A" /> : <HiOutlineClipboardDocumentCheck size={16} />}
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
              {employeeId && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                  <HiOutlineIdentification size={17} color="#66708C" />
                  <Typography variant="caption" color="text.secondary">Employee ID: {employeeId}</Typography>
                </Box>
              )}
            </Box>
            <Divider />
            {onProfile && (
              <MenuItem onClick={() => { handleMenuClose(); onProfile(); }} sx={{ py: 1 }}>
                <ListItemIcon><HiOutlineInformationCircle size={18} /></ListItemIcon>
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>View profile</Typography>
                  <Typography variant="caption" color="text.secondary">Manage your personal details</Typography>
                </Box>
              </MenuItem>
            )}
            <MenuItem onClick={requestLogout} sx={{ py: 1, color: 'error.main' }}>
              <ListItemIcon sx={{ color: 'inherit' }}><HiOutlineArrowRightOnRectangle size={18} /></ListItemIcon>
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, color: 'inherit' }}>Sign out</Typography>
                <Typography variant="caption" color="text.secondary">End this session securely</Typography>
              </Box>
            </MenuItem>
          </Menu>

          <Dialog open={logoutDialogOpen} onClose={() => setLogoutDialogOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Sign out of your account?</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary">
                You will need to sign in again to access your employee workspace.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setLogoutDialogOpen(false)}>Cancel</Button>
              <Button color="error" variant="contained" onClick={confirmLogout}>Sign out</Button>
            </DialogActions>
          </Dialog>

          <Snackbar
            open={emailCopied}
            autoHideDuration={1800}
            onClose={() => setEmailCopied(false)}
            message="Email copied to clipboard"
          />
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