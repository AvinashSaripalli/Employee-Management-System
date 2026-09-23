import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  AvatarGroup,
  IconButton,
  Tooltip,
  Typography,
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  DeleteOutline as DeleteIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  FolderOpen as OpenFolderIcon,
  ChatBubbleOutline as ChatIcon,
  Login as JoinIcon,
  Logout as LeaveIcon,
  Person as PersonIcon,
} from '@mui/icons-material';

const WorkgroupTable = ({
  workgroups = [],
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
  const [selectedGroup, setSelectedGroup] = useState(null);

  const isAdminOrManager = ['Admin', 'Manager'].includes(userRole);

  const handleMenuOpen = (e, group) => {
    e.stopPropagation();
    setMenuAnchor(e.currentTarget);
    setSelectedGroup(group);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
    setSelectedGroup(null);
  };

  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid #E2E8F0',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
        overflowX: 'auto',
      }}
    >
      <Table stickyHeader aria-label="workgroups table" sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
        <TableHead>
          <TableRow sx={{ '& th': { bgcolor: '#F8FAFC', fontWeight: 700, color: '#334155', fontSize: '0.85rem' } }}>
            <TableCell align="left">Workgroup</TableCell>
            <TableCell align="center">Category</TableCell>
            <TableCell align="center">Privacy</TableCell>
            <TableCell align="left">Leader</TableCell>
            <TableCell align="center">Members</TableCell>
            <TableCell align="center">Created</TableCell>
            <TableCell align="center">Status</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {workgroups.map((group) => {
            const isMember = (group.employees || []).some((e) => e.employeeId === currentEmployeeId);
            const isLeader = group.leaderId === currentEmployeeId;
            const canModify = isAdminOrManager || isLeader;

            const leaderObj =
              group.leader ||
              (group.employees || []).find((e) => e.employeeId === group.leaderId) ||
              group.employees?.[0];

            return (
              <TableRow
                key={group.id}
                hover
                sx={{
                  cursor: 'pointer',
                  '&:last-child td, &:last-child th': { border: 0 },
                }}
                onClick={() => onOpenWorkspace(group)}
              >
                {/* Workgroup Name & Partner */}
                <TableCell sx={{ minWidth: 200 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: '#0F172A' }}>
                    {group.groupName || group.partnerCompanyName}
                  </Typography>
                  {group.partnerCompanyName && group.partnerCompanyName !== group.groupName && (
                    <Typography variant="caption" sx={{ color: '#64748B' }}>
                      Partner: {group.partnerCompanyName}
                    </Typography>
                  )}
                </TableCell>

                {/* Category */}
                <TableCell align="center">
                  <Chip
                    label={group.category || 'Project Pod'}
                    size="small"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      bgcolor: '#F1F5F9',
                      color: '#475569',
                      borderRadius: 1.5,
                    }}
                  />
                </TableCell>

                {/* Privacy */}
                <TableCell align="center">
                  <Chip
                    icon={
                      group.privacyType === 'Public' ? (
                        <PublicIcon sx={{ fontSize: '13px !important' }} />
                      ) : (
                        <LockIcon sx={{ fontSize: '13px !important' }} />
                      )
                    }
                    label={group.privacyType}
                    size="small"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      bgcolor: group.privacyType === 'Public' ? '#ECFDF5' : '#EEF2FF',
                      color: group.privacyType === 'Public' ? '#065F46' : '#3730A3',
                      borderRadius: 1.5,
                    }}
                  />
                </TableCell>

                {/* Leader */}
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar
                      src={leaderObj?.photo ? `${leaderObj.photo}` : undefined}
                      sx={{ width: 26, height: 26, fontSize: '0.75rem', bgcolor: '#4F46E5' }}
                    >
                      {leaderObj?.firstName ? leaderObj.firstName[0] : <PersonIcon sx={{ fontSize: 14 }} />}
                    </Avatar>
                    <Typography variant="body2" sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155' }}>
                      {leaderObj ? `${leaderObj.firstName} ${leaderObj.lastName}` : 'Unassigned'}
                    </Typography>
                  </Box>
                </TableCell>

                {/* Members */}
                <TableCell align="center">
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <AvatarGroup
                      max={3}
                      sx={{
                        '& .MuiAvatar-root': {
                          width: 26,
                          height: 26,
                          fontSize: '0.7rem',
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
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#64748B' }}>
                      ({group.employees?.length || 0})
                    </Typography>
                  </Box>
                </TableCell>

                {/* Created Date */}
                <TableCell align="center" sx={{ color: '#64748B', fontSize: '0.82rem' }}>
                  {group.createdOn ? new Date(group.createdOn).toLocaleDateString('en-GB') : '-'}
                </TableCell>

                {/* Status */}
                <TableCell align="center">
                  <Chip
                    label={group.status || 'Active'}
                    size="small"
                    color={group.status === 'Archived' ? 'default' : 'success'}
                    variant={group.status === 'Archived' ? 'filled' : 'outlined'}
                    sx={{ fontSize: '0.72rem', fontWeight: 600, borderRadius: 1.5 }}
                  />
                </TableCell>

                {/* Actions */}
                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    <Button
                      size="small"
                      variant="text"
                      startIcon={<OpenFolderIcon sx={{ fontSize: 16 }} />}
                      onClick={() => onOpenWorkspace(group)}
                      sx={{ textTransform: 'none', fontWeight: 600, fontSize: '0.78rem' }}
                    >
                      Hub
                    </Button>
                    <IconButton
                      size="small"
                      onClick={(e) => handleMenuOpen(e, group)}
                      aria-label="Workgroup actions"
                    >
                      <MoreVertIcon fontSize="small" sx={{ color: '#64748B' }} />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Action Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          elevation: 3,
          sx: { borderRadius: 2.5, minWidth: 160, py: 0.5 },
        }}
      >
        {selectedGroup && (
          <>
            <MenuItem
              onClick={() => {
                handleMenuClose();
                onOpenWorkspace(selectedGroup);
              }}
            >
              <ListItemIcon>
                <OpenFolderIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Open Workspace" />
            </MenuItem>

            {onChat && (
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  onChat(selectedGroup);
                }}
              >
                <ListItemIcon>
                  <ChatIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Group Chat" />
              </MenuItem>
            )}

            {(isAdminOrManager || selectedGroup.leaderId === currentEmployeeId) && (
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  onEdit(selectedGroup);
                }}
              >
                <ListItemIcon>
                  <EditIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Edit Settings" />
              </MenuItem>
            )}

            {(selectedGroup.employees || []).some((e) => e.employeeId === currentEmployeeId) ? (
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  onLeave(selectedGroup);
                }}
                sx={{ color: '#EF4444' }}
              >
                <ListItemIcon>
                  <LeaveIcon fontSize="small" sx={{ color: '#EF4444' }} />
                </ListItemIcon>
                <ListItemText primary="Leave Group" />
              </MenuItem>
            ) : selectedGroup.privacyType === 'Public' ? (
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  onJoin(selectedGroup);
                }}
                sx={{ color: '#10B981' }}
              >
                <ListItemIcon>
                  <JoinIcon fontSize="small" sx={{ color: '#10B981' }} />
                </ListItemIcon>
                <ListItemText primary="Join Group" />
              </MenuItem>
            ) : null}

            {(isAdminOrManager || selectedGroup.leaderId === currentEmployeeId) && (
              <MenuItem
                onClick={() => {
                  handleMenuClose();
                  onDelete(selectedGroup);
                }}
                sx={{ color: '#EF4444' }}
              >
                <ListItemIcon>
                  <DeleteIcon fontSize="small" sx={{ color: '#EF4444' }} />
                </ListItemIcon>
                <ListItemText primary="Delete Group" />
              </MenuItem>
            )}
          </>
        )}
      </Menu>
    </TableContainer>
  );
};

export default WorkgroupTable;
