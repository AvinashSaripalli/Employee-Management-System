import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Checkbox, IconButton, Menu, MenuItem, Divider, Avatar, InputAdornment,
  Chip, Tooltip, Snackbar, Alert, CircularProgress,
} from '@mui/material';
import axios from '../../api/axios';
import EditEmployeeDialog from './EditEmployeeDialog';
import AddEmployeeDialog from './AddEmployeeDialog';
import DeleteDialog from './DeleteDialog';
import ViewEmployeeDialog from './ViewEmployeeDialog';
import InviteEmployeesDialog from './InviteEmployeesDialog';
import { FiSearch, FiPlus, FiTrash2, FiEye, FiEdit2, FiUser, FiMoreHorizontal, FiChevronUp, FiChevronDown, FiMail } from 'react-icons/fi';

const EmployeesList = ({ onClose }) => {
  const [openAddUser, setOpenAddUser] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [menuUser, setMenuUser] = useState(null);
  const [openDeleteUser, setOpenDeleteUser] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewUser, setViewUser] = useState(null);
  const [sortOrder, setSortOrder] = useState('asc');
  const [openInviteDialog, setOpenInviteDialog] = useState(false);
  const [sendingInviteUserId, setSendingInviteUserId] = useState(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  const handleResendInvite = async (user, resetPassword = false) => {
    if (!user) return;
    setSendingInviteUserId(user.id);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post(`/users/${user.id}/send-invite`, { resetPassword }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({
        open: true,
        message: res.data?.message || `Invitation sent to ${user.email}`,
        severity: res.data?.emailStatus === 'sent' ? 'success' : 'info',
      });
    } catch (error) {
      console.error('Error sending invite:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || `Failed to send invite to ${user.email}`,
        severity: 'error',
      });
    } finally {
      setSendingInviteUserId(null);
    }
  };

  const handleBulkSendInvites = async () => {
    if (selectedUsers.length === 0) return;
    setBulkSending(true);
    const token = localStorage.getItem("token");
    try {
      const res = await axios.post('/users/bulk-send-invites', { userIds: selectedUsers }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({
        open: true,
        message: res.data?.message || `Invitations sent to ${selectedUsers.length} employees`,
        severity: 'success',
      });
    } catch (error) {
      console.error('Error sending bulk invites:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to dispatch bulk invitations',
        severity: 'error',
      });
    } finally {
      setBulkSending(false);
    }
  };

  const handleSortByEmployeeId = () => {
    const sortedUsers = [...filteredUsers].sort((a, b) => {
      const idA = parseInt(a.employeeId.replace(/\D/g, ''), 10);
      const idB = parseInt(b.employeeId.replace(/\D/g, ''), 10);
      return sortOrder === 'asc' ? idA - idB : idB - idA;
    });
    setUsers(sortedUsers);
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const fetchUsers = async () => {
    const companyName = localStorage.getItem('companyName');
    const token = localStorage.getItem("token");
    const role = localStorage.getItem('userRole');
    try {
      const response = await axios.get('/users', {
        params: { companyName, role },
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.filter(user => user.exists === 1));
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleClickOpenDeleteUser = () => setOpenDeleteUser(true);
  const handleCloseDeleteUser = () => setOpenDeleteUser(false);

  const handleClickOpenAddUser = async () => {
    const companyName = localStorage.getItem('companyName');
    const token = localStorage.getItem('token');
    try {
      const response = await axios.get('/users/next-employee-id', {
        params: { companyName },
        headers: { Authorization: `Bearer ${token}` },
      });
      const nextEmployeeId = response.data.employeeId;
      setOpenAddUser(true);
      setSelectedUser({ employeeId: nextEmployeeId });
    } catch (error) {
      console.error('Error fetching next employee ID:', error);
    }
  };

  const handleCloseAddUser = () => setOpenAddUser(false);

  const handleViewUser = (user) => {
    setViewUser(user);
    setViewDialogOpen(true);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setViewUser(null);
  };

  const handleDelete = async (user) => {
    const token = localStorage.getItem("token");
    try {
      const response = await axios.patch(`/users/${user.id}`, { exists: 0 }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id));
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteAllSelected = async () => {
    const token = localStorage.getItem('token');
    try {
      await Promise.all(
        selectedUsers.map((id) =>
          axios.patch(`/users/${id}`, { exists: 0 }, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setUsers((prevUsers) => prevUsers.filter((user) => !selectedUsers.includes(user.id)));
      setSelectedUsers([]);
      handleCloseDeleteUser();
    } catch (error) {
      console.error('Error deleting selected users:', error);
    }
  };

  const filteredUsers = users.filter((user) =>
    (user.firstName || "").toLowerCase().includes(searchValue.toLowerCase()) ||
    (user.lastName || "").toLowerCase().includes(searchValue.toLowerCase()) ||
    (user.companyName || "").toLowerCase().includes(searchValue.toLowerCase()) ||
    (user.designation || "").toLowerCase().includes(searchValue.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchValue.toLowerCase()) ||
    (user.employeeId || "").toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSelectUser = (id) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(id) ? prevSelected.filter((userId) => userId !== id) : [...prevSelected, id]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUsers(users.map((user) => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setMenuUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUser(null);
  };

  const handleEditMenuClick = () => {
    setSelectedUser(menuUser);
    setEditDialogOpen(true);
    handleMenuClose();
  };

  const handleDeleteMenuClick = () => {
    handleDelete(menuUser);
    handleMenuClose();
  };

  const getInitials = (user) => `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header card */}
      <Paper sx={{ p: { xs: 2, md: 3 }, mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2, alignItems: { xs: 'stretch', lg: 'center' }, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{
              width: 48, height: 48, borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center',
              bgcolor: '#EEF2FF', color: 'primary.main',
            }}>
              <FiUser size="22" />
            </Box>
            <Box>
              <Typography variant="h6">Employees List</Typography>
              <Typography color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                {users.length} employee{users.length === 1 ? '' : 's'} • {selectedUsers.length > 0 ? `${selectedUsers.length} selected` : 'manage your team'}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5, alignItems: { xs: 'stretch', sm: 'center' } }}>
            <TextField
              placeholder="Search employees…"
              size="small"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              sx={{ width: { xs: '100%', sm: 260 } }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><FiSearch size="18" color="#8A94B0" /></InputAdornment>
                ),
              }}
            />
            {selectedUsers.length > 0 && (
              <Button
                variant="outlined"
                color="primary"
                onClick={handleBulkSendInvites}
                disabled={bulkSending}
                startIcon={bulkSending ? <CircularProgress size={16} /> : <FiMail size={18} />}
                sx={{ textTransform: 'none', fontWeight: 600 }}
              >
                Send Invites ({selectedUsers.length})
              </Button>
            )}
            {selectedUsers.length > 0 && (
              <Button
                variant="contained"
                color="error"
                onClick={handleClickOpenDeleteUser}
                startIcon={<FiTrash2 size="18" />}
              >
                Delete ({selectedUsers.length})
              </Button>
            )}
            <Button
              variant="outlined"
              onClick={() => setOpenInviteDialog(true)}
              startIcon={<FiMail size={18} />}
              sx={{
                borderColor: '#14286D',
                color: '#14286D',
                fontWeight: 600,
                textTransform: 'none',
                '&:hover': { bgcolor: '#EEF2FF', borderColor: '#14286D' },
              }}
            >
              Invite Members
            </Button>
            <Button variant="contained" onClick={handleClickOpenAddUser} startIcon={<FiPlus size="18" />}>
              Add Employee
            </Button>
          </Box>
        </Box>
        <DeleteDialog open={openDeleteUser} onClose={handleCloseDeleteUser} onDeleteAll={handleDeleteAllSelected} />
        <AddEmployeeDialog open={openAddUser} onClose={handleCloseAddUser} onSave={fetchUsers} employeeId={selectedUser?.employeeId} />
        <InviteEmployeesDialog
          open={openInviteDialog}
          onClose={() => setOpenInviteDialog(false)}
          onInviteSuccess={() => {
            fetchUsers();
            setSnackbar({ open: true, message: 'Invitations processed successfully!', severity: 'success' });
          }}
        />
      </Paper>

      {/* Table card */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table stickyHeader aria-label="users table" sx={{ '& td, & th': { verticalAlign: 'middle' } }}>
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 56, py: 1.5 }}>
                <Checkbox
                  indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell align="center" sx={{ width: 68, py: 1.5 }}>Photo</TableCell>
              <TableCell align="center" sx={{ width: 140, cursor: 'pointer', whiteSpace: 'nowrap', py: 1.5 }} onClick={handleSortByEmployeeId}>
                <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                  <span>Employee ID</span>
                  {sortOrder === 'asc' ? <FiChevronDown size="16" /> : <FiChevronUp size="16" />}
                </Box>
              </TableCell>
              <TableCell align="left" sx={{ py: 1.5 }}>Name</TableCell>
              <TableCell align="left" sx={{ py: 1.5 }}>Designation</TableCell>
              <TableCell align="left" sx={{ py: 1.5 }}>Email</TableCell>
              <TableCell align="center" sx={{ width: 100, py: 1.5 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <TableRow key={user.id} selected={selectedUsers.includes(user.id)} hover>
                <TableCell align="center" sx={{ py: 1.25 }}>
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </TableCell>
                <TableCell align="center" sx={{ py: 1.25 }}>
                  <Avatar src={user.photo || undefined} sx={{ width: 38, height: 38, mx: 'auto', bgcolor: '#14286D', fontWeight: 700, fontSize: 13 }}>
                    {getInitials(user)}
                  </Avatar>
                </TableCell>
                <TableCell align="center" sx={{ py: 1.25 }}>
                  <Chip label={user.employeeId} size="small" sx={{ bgcolor: '#EEF2FF', color: 'primary.main', fontWeight: 700 }} />
                </TableCell>
                <TableCell align="left" sx={{ py: 1.25, fontWeight: 600 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '13.5px', color: '#1B2A5B' }}>
                      {user.lastName} {user.firstName}
                    </Typography>
                    <Chip
                      size="small"
                      label={user.departmentRole === 'Supervisor' ? 'Supervisor' : 'Member'}
                      sx={{
                        height: 18,
                        fontSize: '10px',
                        fontWeight: 700,
                        bgcolor: user.departmentRole === 'Supervisor' ? '#ECFDF5' : '#F8FAFC',
                        color: user.departmentRole === 'Supervisor' ? '#047857' : '#64748B',
                        border: user.departmentRole === 'Supervisor' ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                        borderRadius: '4px',
                        px: 0.5,
                        '& .MuiChip-label': { px: 0.5 },
                      }}
                    />
                  </Box>
                </TableCell>
                <TableCell align="left" sx={{ py: 1.25, color: 'text.secondary', fontSize: '13px' }}>{user.designation || '—'}</TableCell>
                <TableCell align="left" sx={{ py: 1.25, color: 'text.secondary', fontSize: '13px' }}>{user.email || '—'}</TableCell>
                <TableCell align="center" sx={{ py: 1.25 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
                    <Tooltip title="View profile">
                      <IconButton size="small" onClick={() => handleViewUser(user)} sx={{ color: 'primary.main' }}>
                        <FiEye size="19" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={(event) => handleMenuOpen(event, user)}>
                      <FiMoreHorizontal size="18" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography color="text.secondary">No employees found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <ViewEmployeeDialog open={viewDialogOpen} onClose={handleViewDialogClose} user={viewUser} />
      </TableContainer>

      {/* Row Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => { handleResendInvite(menuUser); handleMenuClose(); }}>
          <FiMail size={16} style={{ marginRight: 8 }} color="#14286D" /> Send Invite / Welcome Email
        </MenuItem>
        <MenuItem onClick={() => { handleResendInvite(menuUser, true); handleMenuClose(); }}>
          <FiMail size={16} style={{ marginRight: 8 }} color="#D97706" /> Reset Password & Re-invite
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleEditMenuClick}>
          <FiEdit2 size={16} style={{ marginRight: 8 }} color="#14286D" /> Edit
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteMenuClick} sx={{ color: 'error.main' }}>
          <FiTrash2 size="16" style={{ marginRight: 8 }} /> Delete
        </MenuItem>
      </Menu>

      <EditEmployeeDialog open={editDialogOpen} onClose={handleEditDialogClose} user={selectedUser} onSave={fetchUsers} />

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ borderRadius: 2, boxShadow: '0 4px 14px rgba(0,0,0,0.12)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmployeesList;