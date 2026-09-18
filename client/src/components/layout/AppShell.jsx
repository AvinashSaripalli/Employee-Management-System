import React, { useState } from 'react';
import {
  AppBar, Toolbar, Box, Drawer, Typography, List, ListItem,
  ListItemButton, ListItemIcon, IconButton, Menu, MenuItem, Divider,
  Avatar, Badge, Chip, CircularProgress, Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon, SearchNormal1, Notification, ArrowCircleLeft,
  ArrowCircleRight, LogoutCurve, ArrowDown2, InfoCircle,
} from 'iconsax-react';

const OPEN_WIDTH = 256;
const CLOSED_WIDTH = 82;
const TOPBAR_HEIGHT = 68;

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

  const handleMenu = (e) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

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
        <Box sx={{ px: open ? 1.6 : 0, pt: 2.2, pb: 1.6, display: 'flex', justifyContent: open ? 'flex-start' : 'center' }}>
          {open ? (
            <img
              src="/KN Advisors.png"
              alt="KN Advisors Logo"
              style={{ height: 38, width: 'auto', objectFit: 'contain', maxWidth: 210 }}
            />
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
                    borderRadius: open ? 3 : 0,
                    px: open ? 2 : 0,
                    justifyContent: open ? 'flex-start' : 'center',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': { bgcolor: isActive ? 'transparent' : open ? '#F1F5FF' : '#F1F5FF' },
                  }}
                >
                  {isActive && (
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: open ? 3 : 0,
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
            {open ? <ArrowCircleLeft size="22" /> : <ArrowCircleRight size="22" />}
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
          <Tooltip title={open ? 'Collapse menu' : 'Expand menu'}>
            <IconButton onClick={() => setOpen(!open)} sx={{ color: 'text.primary' }} aria-label="Toggle navigation">
              <MenuIcon size="22" variant="Outline" />
            </IconButton>
          </Tooltip>

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
            <SearchNormal1 size="16" variant="Outline" />
            <Typography variant="caption" color="text.secondary">
              Search…
            </Typography>
          </Box>

          <IconButton sx={{ color: 'text.primary', display: { xs: 'none', sm: 'inline-flex' } }} aria-label="Notifications">
            <Badge color="secondary" variant="dot" overlap="circular">
              <Notification size="20" variant="Outline" />
            </Badge>
          </IconButton>

          <Divider orientation="vertical" flexItem sx={{ my: 1.5, display: { xs: 'none', sm: 'block' } }} />

          <Chip
            avatar={<Avatar alt={userName} src={userPhoto || undefined}>{getInitials(userName)}</Avatar>}
            label={<Typography sx={{ display: { xs: 'none', md: 'block' } }}>{userName}</Typography>}
            onClick={handleMenu}
            deleteIcon={<ArrowDown2 size="16" />}
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
                <ListItemIcon><InfoCircle size="18" /></ListItemIcon>
                Profile
              </MenuItem>
            )}
            <MenuItem onClick={() => { handleMenuClose(); onLogout && onLogout(); }}>
              <ListItemIcon><LogoutCurve size="18" /></ListItemIcon>
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