import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Avatar,
  AvatarGroup,
  IconButton,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  ChatBubbleOutline as ChatIcon,
  Login as JoinIcon,
  Logout as LeaveIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  FolderOpen as OpenFolderIcon,
} from '@mui/icons-material';

const getCategoryColor = (category) => {
  switch (category) {
    case 'Project Pod':
      return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
    case 'Client/Partner':
      return { bg: '#FDF4FF', text: '#C026D3', border: '#F5D0FE' };
    case 'Cross-Functional':
      return { bg: '#F0FDF4', text: '#16A34A', border: '#BBF7D0' };
    case 'Innovation Lab':
      return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
    case 'Department':
      return { bg: '#F8FAFC', text: '#475569', border: '#E2E8F0' };
    case 'Committee':
      return { bg: '#FAF5FF', text: '#9333EA', border: '#E9D5FF' };
    default:
      return { bg: '#F1F5F9', text: '#334155', border: '#CBD5E1' };
  }
};

const WorkgroupCard = ({
  group,
  currentEmployeeId,
  userRole,
  onOpenWorkspace,
  onEdit,
  onDelete,
  onJoin,
  onLeave,
  onChat,
}) => {
  const [menuAnchor, setMenuAnchor] = useState(null);

  const isMember = (group.employees || []).some((e) => e.employeeId === currentEmployeeId);
  const isLeader = group.leaderId === currentEmployeeId;
  const isAdminOrManager = ['Admin', 'Manager'].includes(userRole);
  const canModify = isAdminOrManager || isLeader;

  const categoryStyle = getCategoryColor(group.category);
  const tagsList = (group.tags || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const leaderObj =
    group.leader ||
    (group.employees || []).find((e) => e.employeeId === group.leaderId) ||
    group.employees?.[0];

  const handleMenuOpen = (e) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #E2E8F0',
        bgcolor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.08), 0 4px 10px -4px rgba(0, 0, 0, 0.04)',
          borderColor: '#CBD5E1',
        },
      }}
    >
      {/* Top accent border bar */}
      <Box
        sx={{
          height: 5,
          width: '100%',
          bgcolor: group.privacyType === 'Public' ? '#10B981' : '#6366F1',
        }}
      />

      <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header Badges & Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={group.category || 'Project Pod'}
              size="small"
              sx={{
                fontSize: '0.72rem',
                fontWeight: 600,
                bgcolor: categoryStyle.bg,
                color: categoryStyle.text,
                border: `1px solid ${categoryStyle.border}`,
                borderRadius: 1.5,
              }}
            />
            <Chip
              icon={
                group.privacyType === 'Public' ? (
                  <PublicIcon sx={{ fontSize: '13px !important', color: '#059669 !important' }} />
                ) : (
                  <LockIcon sx={{ fontSize: '13px !important', color: '#6366F1 !important' }} />
                )
              }
              label={group.privacyType}
              size="small"
              sx={{
                fontSize: '0.72rem',
                fontWeight: 600,
                bgcolor: group.privacyType === 'Public' ? '#ECFDF5' : '#EEF2FF',
                color: group.privacyType === 'Public' ? '#065F46' : '#3730A3',
                borderRadius: 1.5,
              }}
            />
            {group.status === 'Archived' && (
              <Chip
                label="Archived"
                size="small"
                sx={{ fontSize: '0.7rem', fontWeight: 600, bgcolor: '#F1F5F9', color: '#64748B', borderRadius: 1.5 }}
              />
            )}
          </Box>

          <IconButton size="small" onClick={handleMenuOpen} aria-label="Workgroup options">
            <MoreVertIcon fontSize="small" sx={{ color: '#64748B' }} />
          </IconButton>
        </Box>

        {/* Title & Organization */}
        <Box sx={{ mb: 1.5 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.05rem',
              color: '#0F172A',
              lineHeight: 1.3,
              cursor: 'pointer',
              '&:hover': { color: 'primary.main' },
            }}
            onClick={() => onOpenWorkspace(group)}
          >
            {group.groupName || group.partnerCompanyName}
          </Typography>

          {group.partnerCompanyName && group.partnerCompanyName !== group.groupName && (
            <Typography
              variant="caption"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748B', mt: 0.3 }}
            >
              <BusinessIcon sx={{ fontSize: 13 }} />
              {group.partnerCompanyName}
            </Typography>
          )}
        </Box>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: '#475569',
            fontSize: '0.85rem',
            lineHeight: 1.5,
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: '2.55rem',
          }}
        >
          {group.description || 'Collaborative workspace coordinating team members, initiatives, and resources.'}
        </Typography>

        {/* Tags */}
        {tagsList.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.6, flexWrap: 'wrap', mb: 2 }}>
            {tagsList.slice(0, 3).map((tag, idx) => (
              <Chip
                key={idx}
                label={`#${tag}`}
                size="small"
                sx={{
                  fontSize: '0.68rem',
                  height: 22,
                  bgcolor: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  color: '#475569',
                  borderRadius: 1,
                }}
              />
            ))}
            {tagsList.length > 3 && (
              <Typography variant="caption" sx={{ color: '#94A3B8', alignSelf: 'center', fontSize: '0.7rem' }}>
                +{tagsList.length - 3} more
              </Typography>
            )}
          </Box>
        )}

        {/* Divider */}
        <Divider sx={{ my: 'auto', mb: 1.5, borderColor: '#F1F5F9' }} />

        {/* Leader & Members Footer */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Leader info */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
            <Avatar
              src={leaderObj?.photo ? `${leaderObj.photo}` : undefined}
              sx={{ width: 28, height: 28, fontSize: '0.75rem', bgcolor: '#4F46E5' }}
            >
              {leaderObj?.firstName ? leaderObj.firstName[0] : <PersonIcon sx={{ fontSize: 16 }} />}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', lineHeight: 1, fontSize: '0.68rem' }}>
                Leader
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1E293B', lineHeight: 1.2 }}
                noWrap
              >
                {leaderObj ? `${leaderObj.firstName} ${leaderObj.lastName}` : 'Unassigned'}
              </Typography>
            </Box>
          </Box>

          {/* Members Avatar Group */}
          <Tooltip title={`${group.employees?.length || 0} members assigned`}>
            <AvatarGroup
              max={3}
              sx={{
                '& .MuiAvatar-root': {
                  width: 28,
                  height: 28,
                  fontSize: '0.72rem',
                  border: '2px solid #FFFFFF',
                },
              }}
            >
              {(group.employees || []).map((emp) => (
                <Avatar
                  key={emp.employeeId}
                  src={emp.photo ? `${emp.photo}` : undefined}
                  alt={`${emp.firstName} ${emp.lastName}`}
                >
                  {emp.firstName?.[0] || 'M'}
                </Avatar>
              ))}
            </AvatarGroup>
          </Tooltip>
        </Box>
      </CardContent>

      {/* Card Action Bar */}
      <Box
        sx={{
          px: 2.5,
          py: 1.5,
          bgcolor: '#FAFCFF',
          borderTop: '1px solid #F1F5F9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Button
          size="small"
          variant="contained"
          startIcon={<OpenFolderIcon sx={{ fontSize: 16 }} />}
          onClick={() => onOpenWorkspace(group)}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '0.8rem',
            px: 1.8,
            boxShadow: 'none',
            '&:hover': { boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)' },
          }}
        >
          Open Workspace
        </Button>

        {/* Self-service Join/Leave or Member badge */}
        {isMember ? (
          <Chip
            label="Joined"
            size="small"
            color="success"
            variant="outlined"
            sx={{ fontWeight: 600, fontSize: '0.72rem', borderRadius: 1.5, height: 24 }}
          />
        ) : group.privacyType === 'Public' ? (
          <Button
            size="small"
            variant="outlined"
            color="primary"
            startIcon={<JoinIcon sx={{ fontSize: 14 }} />}
            onClick={() => onJoin(group)}
            sx={{ borderRadius: 2, textTransform: 'none', fontSize: '0.75rem', height: 28, px: 1.2 }}
          >
            Join
          </Button>
        ) : null}
      </Box>

      {/* Options Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2.5, minWidth: 170, py: 0.5 },
        }}
      >
        <MenuItem
          onClick={() => {
            handleMenuClose();
            onOpenWorkspace(group);
          }}
        >
          <ListItemIcon>
            <OpenFolderIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Open Hub" />
        </MenuItem>

        {onChat && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onChat(group);
            }}
          >
            <ListItemIcon>
              <ChatIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Group Chat" />
          </MenuItem>
        )}

        {canModify && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onEdit(group);
            }}
          >
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Edit Settings" />
          </MenuItem>
        )}

        {isMember && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onLeave(group);
            }}
          >
            <ListItemIcon>
              <LeaveIcon fontSize="small" sx={{ color: '#EF4444' }} />
            </ListItemIcon>
            <ListItemText primary="Leave Group" sx={{ color: '#EF4444' }} />
          </MenuItem>
        )}

        {canModify && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onDelete(group);
            }}
            sx={{ color: '#EF4444' }}
          >
            <ListItemIcon>
              <DeleteIcon fontSize="small" sx={{ color: '#EF4444' }} />
            </ListItemIcon>
            <ListItemText primary="Delete Group" />
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

export default WorkgroupCard;
