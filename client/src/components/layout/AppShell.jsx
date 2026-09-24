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
  HiOutlineChatBubbleLeftRight, HiOutlineDocumentText, HiOutlineSparkles,
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

  const filteredNotifications = notifications.filter((n) => {
    if (notificationTab === 'unread') return !readNotificationIds.includes(n.id);
    if (notificationTab === 'tasks') return n.category === 'task';
    if (notificationTab === 'reports') return n.category === 'report' || n.category === 'shift';
    if (notificationTab === 'leaves') return n.category === 'leave';
    if (notificationTab === 'messages') return n.category === 'message';
    return true;
  });

  const tabCounts = {
    all: notifications.length,
    unread: unreadNotifications.length,
    tasks: notifications.filter((n) => n.category === 'task').length,
    reports: notifications.filter((n) => n.category === 'report' || n.category === 'shift').length,
    leaves: notifications.filter((n) => n.category === 'leave').length,
    messages: notifications.filter((n) => n.category === 'message').length,
  };

  const getNotificationIcon = (category, severity) => {
    if (severity === 'urgent') return <HiOutlineExclamationTriangle size={18} />;
    if (category === 'shift') return <HiOutlineClock size={18} />;
    if (category === 'report') return <HiOutlineDocumentText size={18} />;
    if (category === 'task') return <HiOutlineClipboardDocumentCheck size={18} />;
    if (category === 'leave') return <HiOutlineCalendarDays size={18} />;
    if (category === 'message') return <HiOutlineChatBubbleLeftRight size={18} />;
    return <HiOutlineInformationCircle size={18} />;
  };

  const getSeverityStyles = (severity, isUnread) => {
    switch (severity) {
      case 'urgent':
        return {
          borderLeft: '4px solid #EF4444',
          bg: isUnread ? '#FEF2F2' : '#FFFFFF',
          badgeBg: '#FEE2E2',
          badgeColor: '#B91C1C',
          iconColor: '#DC2626',
        };
      case 'action':
        return {
          borderLeft: '4px solid #F59E0B',
          bg: isUnread ? '#FFFBEB' : '#FFFFFF',
          badgeBg: '#FEF3C7',
          badgeColor: '#B45309',
          iconColor: '#D97706',
        };
      case 'success':
        return {
          borderLeft: '4px solid #10B981',
          bg: isUnread ? '#ECFDF5' : '#FFFFFF',
          badgeBg: '#D1FAE5',
          badgeColor: '#047857',
          iconColor: '#059669',
        };
      case 'info':
      default:
        return {
          borderLeft: '4px solid #14286D',
          bg: isUnread ? '#F6F8FE' : '#FFFFFF',
          badgeBg: '#EEF2FF',
          badgeColor: '#14286D',
          iconColor: '#14286D',
        };
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
                sx: {
                  width: { xs: 'calc(100vw - 32px)', sm: 440 },
                  maxHeight: 620,
                  borderRadius: 3,
                  boxShadow: '0 20px 45px -10px rgba(15, 23, 42, 0.2), 0 0 1px 1px rgba(15, 23, 42, 0.08)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  border: '1px solid #E2E8F0',
                },
              },
            }}
          >
            {/* Header */}
            <Box
              sx={{
                px: 2.5,
                pt: 2,
                pb: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #F1F5F9',
                bgcolor: '#FFFFFF',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.2 }}>
                <Box
                  sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 2,
                    bgcolor: '#EEF2FF',
                    color: '#14286D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HiOutlineBell size={19} />
                </Box>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', fontSize: '15px' }}>
                      Notification Center
                    </Typography>
                    {unreadNotifications.length > 0 && (
                      <Chip
                        size="small"
                        label={`${unreadNotifications.length} new`}
                        sx={{
                          height: 18,
                          fontSize: '11px',
                          fontWeight: 700,
                          bgcolor: '#EFF6FF',
                          color: '#2563EB',
                        }}
                      />
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: '#64748B', display: 'block', fontSize: '11.5px' }}>
                    {unreadNotifications.length > 0
                      ? `${unreadNotifications.length} item(s) requiring attention`
                      : 'All alerts & tasks are up to date'}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {unreadNotifications.length > 0 && (
                  <Tooltip title="Mark all as read">
                    <IconButton
                      size="small"
                      onClick={() => persistReadNotificationIds(notifications.map((n) => n.id))}
                      sx={{ color: '#64748B', '&:hover': { color: '#14286D', bgcolor: '#EEF2FF' } }}
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
                      '&:hover': { color: '#14286D', bgcolor: '#EEF2FF' },
                      animation: notificationsLoading ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
                    }}
                  >
                    <HiOutlineArrowPath size={17} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            {/* Filter Tabs */}
            <Box
              sx={{
                px: 2,
                py: 1,
                display: 'flex',
                gap: 0.75,
                bgcolor: '#F8FAFC',
                borderBottom: '1px solid #E2E8F0',
                overflowX: 'auto',
                scrollbarWidth: 'none',
                '&::-webkit-scrollbar': { display: 'none' },
              }}
            >
              {[
                { key: 'all', label: 'All', count: tabCounts.all },
                { key: 'unread', label: 'Unread', count: tabCounts.unread },
                { key: 'tasks', label: 'Tasks', count: tabCounts.tasks },
                { key: 'reports', label: 'Reports & Shifts', count: tabCounts.reports },
                { key: 'leaves', label: 'Leaves', count: tabCounts.leaves },
                { key: 'messages', label: 'Messages', count: tabCounts.messages },
              ].map((tab) => {
                const isSelected = notificationTab === tab.key;
                return (
                  <Chip
                    key={tab.key}
                    clickable
                    onClick={() => setNotificationTab(tab.key)}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6 }}>
                        <span>{tab.label}</span>
                        {tab.count > 0 && (
                          <Box
                            component="span"
                            sx={{
                              px: 0.6,
                              py: 0.1,
                              borderRadius: 1,
                              fontSize: '10px',
                              fontWeight: 700,
                              bgcolor: isSelected ? 'rgba(255,255,255,0.25)' : '#E2E8F0',
                              color: isSelected ? '#FFFFFF' : '#475569',
                            }}
                          >
                            {tab.count}
                          </Box>
                        )}
                      </Box>
                    }
                    size="small"
                    sx={{
                      height: 26,
                      fontSize: '11.5px',
                      fontWeight: isSelected ? 700 : 500,
                      bgcolor: isSelected ? '#14286D' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#475569',
                      border: isSelected ? 'none' : '1px solid #CBD5E1',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: isSelected ? '#0f1f54' : '#F1F5F9',
                      },
                    }}
                  />
                );
              })}
            </Box>

            {/* Notification List Body */}
            <Box
              sx={{
                flex: 1,
                overflowY: 'auto',
                maxHeight: 420,
                p: 1.5,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                bgcolor: '#F8FAFC',
              }}
            >
              {notificationsLoading ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 6, gap: 1.5 }}>
                  <CircularProgress size={24} sx={{ color: '#14286D' }} />
                  <Typography variant="caption" sx={{ color: '#64748B' }}>Syncing updates...</Typography>
                </Box>
              ) : filteredNotifications.length > 0 ? (
                filteredNotifications.map((item) => {
                  const isRead = readNotificationIds.includes(item.id);
                  const styles = getSeverityStyles(item.severity, !isRead);

                  return (
                    <Box
                      key={item.id}
                      onClick={() => handleNotificationClick(item)}
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: styles.bg,
                        borderLeft: styles.borderLeft,
                        borderTop: '1px solid #E2E8F0',
                        borderRight: '1px solid #E2E8F0',
                        borderBottom: '1px solid #E2E8F0',
                        boxShadow: isRead ? 'none' : '0 2px 6px rgba(0,0,0,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.18s ease',
                        position: 'relative',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                          bgcolor: isRead ? '#F8FAFC' : styles.bg,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.8 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                          <Box sx={{ color: styles.iconColor, display: 'flex', alignItems: 'center' }}>
                            {getNotificationIcon(item.category, item.severity)}
                          </Box>
                          {item.badge && (
                            <Chip
                              size="small"
                              label={item.badge}
                              sx={{
                                height: 18,
                                fontSize: '10px',
                                fontWeight: 700,
                                bgcolor: styles.badgeBg,
                                color: styles.badgeColor,
                                borderRadius: '4px',
                              }}
                            />
                          )}
                          {!isRead && (
                            <Box
                              sx={{
                                width: 7,
                                height: 7,
                                borderRadius: '50%',
                                bgcolor: item.severity === 'urgent' ? '#EF4444' : '#2563EB',
                              }}
                            />
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '11px', fontWeight: 500 }}>
                            {formatNotificationTime(item.createdAt)}
                          </Typography>
                          <Tooltip title={isRead ? 'Mark as unread' : 'Mark as read'}>
                            <IconButton
                              size="small"
                              onClick={(e) => toggleNotificationRead(item.id, e)}
                              sx={{
                                p: 0.3,
                                color: isRead ? '#CBD5E1' : '#64748B',
                                '&:hover': { color: '#14286D' },
                              }}
                            >
                              <HiOutlineCheck size={14} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Typography
                        sx={{
                          fontSize: '13px',
                          fontWeight: isRead ? 600 : 750,
                          color: isRead ? '#334155' : '#0F172A',
                          mb: 0.4,
                          lineHeight: 1.35,
                        }}
                      >
                        {item.title}
                      </Typography>

                      <Typography
                        variant="caption"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          color: isRead ? '#64748B' : '#475569',
                          lineHeight: 1.45,
                          fontSize: '11.5px',
                        }}
                      >
                        {item.detail}
                      </Typography>

                      {item.actionLabel && (
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.5,
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#14286D',
                              bgcolor: '#EEF2FF',
                              px: 1.2,
                              py: 0.35,
                              borderRadius: 1.5,
                              transition: 'all 0.15s',
                              '&:hover': {
                                bgcolor: '#14286D',
                                color: '#FFFFFF',
                              },
                            }}
                          >
                            <span>{item.actionLabel}</span>
                            <HiOutlineArrowRight size={12} />
                          </Box>
                        </Box>
                      )}
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
                    py: 6,
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
                  <Typography sx={{ fontWeight: 700, fontSize: '13.5px', color: '#1E293B', mb: 0.5 }}>
                    {notificationTab === 'unread' ? 'No unread notifications' : 'No notifications in this view'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#64748B', maxWidth: 260 }}>
                    {notificationTab === 'unread'
                      ? 'You have reviewed all urgent and informational alerts.'
                      : 'When new shifts, task updates, reports, or messages arrive, they will appear here.'}
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Footer */}
            <Box
              sx={{
                px: 2,
                py: 1,
                bgcolor: '#FFFFFF',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: '11px' }}>
                Showing {filteredNotifications.length} of {notifications.length} update(s)
              </Typography>
              {notifications.length > 0 && (
                <Button
                  size="small"
                  onClick={clearReadNotifications}
                  sx={{
                    fontSize: '11px',
                    textTransform: 'none',
                    color: '#64748B',
                    py: 0.2,
                    px: 0.8,
                    '&:hover': { color: '#14286D', bgcolor: '#F8FAFC' },
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