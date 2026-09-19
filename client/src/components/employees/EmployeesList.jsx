import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Paper, Checkbox, IconButton, Menu, MenuItem, Divider, Avatar, InputAdornment,
  Chip, Tooltip,
} from '@mui/material';
import axios from '../../api/axios';
import EditEmployeeDialog from './EditEmployeeDialog';
import AddEmployeeDialog from './AddEmployeeDialog';
import DeleteDialog from './DeleteDialog';
import ViewEmployeeDialog from './ViewEmployeeDialog';
import { FiSearch, FiPlus, FiTrash2, FiEye, FiEdit2, FiUser, FiMoreHorizontal, FiChevronUp, FiChevronDown } from 'react-icons/fi';

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
                variant="contained"
                color="error"
                onClick={handleClickOpenDeleteUser}
                startIcon={<FiTrash2 size="18" />}
              >
                Delete ({selectedUsers.length})
              </Button>
            )}
            <Button variant="contained" onClick={handleClickOpenAddUser} startIcon={<FiPlus size="18" />}>
              Add Employee
            </Button>
          </Box>
        </Box>
        <DeleteDialog open={openDeleteUser} onClose={handleCloseDeleteUser} onDeleteAll={handleDeleteAllSelected} />
        <AddEmployeeDialog open={openAddUser} onClose={handleCloseAddUser} onSave={fetchUsers} employeeId={selectedUser?.employeeId} />
      </Paper>

      {/* Table card */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table stickyHeader aria-label="users table">
          <TableHead>
            <TableRow>
              <TableCell align="center" sx={{ width: 56 }}>
                <Checkbox
                  indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell align="center">Photo</TableCell>
              <TableCell align="center" sx={{ cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={handleSortByEmployeeId}>
                Employee ID {sortOrder === 'asc' ? <FiChevronDown size="16" /> : <FiChevronUp size="16" />}
              </TableCell>
              <TableCell align="left">Name</TableCell>
              <TableCell align="left">Designation</TableCell>
              <TableCell align="left">Email</TableCell>
              <TableCell align="center">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <TableRow key={user.id} selected={selectedUsers.includes(user.id)} hover>
                <TableCell align="center">
                  <Checkbox
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => handleSelectUser(user.id)}
                  />
                </TableCell>
                <TableCell align="center">
                  <Avatar src={user.photo || undefined} sx={{ width: 40, height: 40 }}>{getInitials(user)}</Avatar>
                </TableCell>
                <TableCell align="center">
                  <Chip label={user.employeeId} size="small" sx={{ bgcolor: '#EEF2FF', color: 'primary.main', fontWeight: 700 }} />
                </TableCell>
                <TableCell align="left" sx={{ fontWeight: 600 }}>{user.lastName} {user.firstName}</TableCell>
                <TableCell align="left" sx={{ color: 'text.secondary' }}>{user.designation}</TableCell>
                <TableCell align="left" sx={{ color: 'text.secondary' }}>{user.email}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Tooltip title="View profile">
                      <IconButton size="small" onClick={() => handleViewUser(user)} sx={{ color: 'primary.main' }}>
                        <FiEye size="19" />
                      </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={(event) => handleMenuOpen(event, user)}>
                      <FiMoreHorizontal size="18" />
                    </IconButton>
                  </Box>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                    anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                  >
                    <MenuItem onClick={handleEditMenuClick}>
                      <FiEdit2 size="16" style={{ marginRight: 8 }} color="#14286D" /> Edit
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleDeleteMenuClick} sx={{ color: 'error.main' }}>
                      <FiTrash2 size="16" style={{ marginRight: 8 }} /> Delete
                    </MenuItem>
                  </Menu>
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

      <EditEmployeeDialog open={editDialogOpen} onClose={handleEditDialogClose} user={selectedUser} onSave={fetchUsers} />
    </Box>
  );
};

export default EmployeesList;