import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox,
  IconButton, Menu, MenuItem, Divider
} from '@mui/material';
import { useGetUserDetailsQuery } from '../redux/slice/apiSlice'; 
import EditEmployeeDialog from './EditEmployeeDialog';
import AddEmployeeDialog from './AddEmployeeDialog';
import DeleteDialog from './DeleteDialog';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewEmployeeDialog from './ViewEmployeeDialog';


const EmployeesList = ({ onClose }) => {
  const [openAddUser, setOpenAddUser] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
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

  const { data: userData, isLoading, isError, error } = useGetUserDetailsQuery({
    companyName: localStorage.getItem('companyName'),
    role: localStorage.getItem('userRole'),
  });

  useEffect(() => {
    if (userData) {
      setUsers(userData.filter(user => user.isActive)); 
    }
  }, [userData]);



  const handleClickOpenDeleteUser = () => {
    setOpenDeleteUser(true);
  };

  const handleCloseDeleteUser = () => {
    setOpenDeleteUser(false);
  };

  const handleClickOpenAddUser = async () => {
    setOpenAddUser(true);
    setSelectedUser({ userId: 'USR' + Math.floor(Math.random() * 1000000) }); 
  };

  const handleCloseAddUser = () => {
    setOpenAddUser(false);
  };

  const handleViewUser = (user) => {
    setViewUser(user);
    setViewDialogOpen(true);
  };

  const handleViewDialogClose = () => {
    setViewDialogOpen(false);
    setViewUser(null);
  };

  const handleDelete = async (user) => {
    try {
      setUsers(prevUsers => prevUsers.filter(u => u.userId !== user.userId));
      console.log('User deleted successfully');
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleDeleteAllSelected = async () => {
    try {
      setUsers(prevUsers => prevUsers.filter(user => !selectedUsers.includes(user.userId)));
      setSelectedUsers([]);
      handleCloseDeleteUser();
      console.log('Selected users deleted successfully');
    } catch (error) {
      console.error('Error deleting selected users:', error);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.firstName.toLowerCase().includes(searchValue.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchValue.toLowerCase()) ||
    user.companyName.toLowerCase().includes(searchValue.toLowerCase()) ||
    user.designationName.toLowerCase().includes(searchValue.toLowerCase()) ||
    user.email.toLowerCase().includes(searchValue.toLowerCase())
  );

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers((prevSelected) =>
      prevSelected.includes(userId) ? prevSelected.filter((id) => id !== userId) : [...prevSelected, userId]
    );
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedUsers(users.map((user) => user.userId));
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

  if (isLoading) {
    return <Typography>Loading...</Typography>;
  }

  if (isError) {
    return <Typography>Error: {error?.data?.error || 'Failed to fetch users'}</Typography>;
  }

  return (
    <Box sx={{ pl: 6, pr: 6, mt: '30px' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Employees List</Typography>
        <TextField
          label="Search"
          variant="standard"
          size="small"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <Box>
          {selectedUsers.length > 0 && (
            <Button
              variant="contained"
              color="error"
              onClick={handleClickOpenDeleteUser}
              sx={{ mr: 2 }}
            >
              Delete Selected ({selectedUsers.length})
            </Button>
          )}
          <DeleteDialog
            open={openDeleteUser}
            onClose={handleCloseDeleteUser}
            onDeleteAll={handleDeleteAllSelected}
          />
          <Button variant="contained" onClick={handleClickOpenAddUser}>Add Employee</Button>
        </Box>
        <AddEmployeeDialog
          open={openAddUser}
          onClose={handleCloseAddUser}
          onSave={() => {}}
          employeeId={selectedUser?.userId}
        />
      </Box>
      <TableContainer
        component={Paper}
        sx={{
          maxHeight: '462px',
          overflowY: 'auto',
          boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 12px',
        }}
      >
        <Table stickyHeader aria-label="users table">
          <TableHead sx={{ backgroundColor: '#f4f7fe' }}>
            <TableRow>
              <TableCell align="center">
                <Checkbox
                  indeterminate={selectedUsers.length > 0 && selectedUsers.length < users.length}
                  checked={selectedUsers.length === users.length && users.length > 0}
                  onChange={handleSelectAll}
                />
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Photo
              </TableCell>
              <TableCell
                align="center"
                sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black'}}
              >
                Employee ID 
              </TableCell>
              <TableCell align="left" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Name
              </TableCell>
              <TableCell align="left" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Designation
              </TableCell>
              <TableCell align="left" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Email
              </TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.userId} selected={selectedUsers.includes(user.userId)}>
                <TableCell align="center">
                  <Checkbox
                    checked={selectedUsers.includes(user.userId)}
                    onChange={() => handleSelectUser(user.userId)}
                  />
                </TableCell>
                <TableCell align="center">
                  <img
                    src={user.photo || 'https://via.placeholder.com/40'}
                    alt="User"
                    width="40"
                    height="40"
                    style={{ borderRadius: '50%' }}
                  />
                </TableCell>
                <TableCell align="center">{user.userId}</TableCell>
                <TableCell align="left">{`${user.lastName} ${user.firstName}`}</TableCell>
                <TableCell align="left">{user.designationName}</TableCell>
                <TableCell align="left">{user.email}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="outlined"
                    color="primary"
                    size="small"
                    onClick={() => handleViewUser(user)}
                    sx={{ mr: 1 }}
                  >
                    View
                  </Button>
                </TableCell>
                <TableCell align="left">
                  <IconButton onClick={(event) => handleMenuOpen(event, user)}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                    elevation={0}
                    sx={{
                      '& .MuiPaper-root': {
                        border: '0.2px solid #ddd',
                        backgroundColor: '#ffffff',
                      },
                    }}
                  >
                    <MenuItem onClick={handleEditMenuClick}>Edit</MenuItem>
                    <Divider />
                    <MenuItem onClick={handleDeleteMenuClick}>Delete</MenuItem>
                  </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ViewEmployeeDialog open={viewDialogOpen} onClose={handleViewDialogClose} user={viewUser} />
      </TableContainer>
      <EditEmployeeDialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        user={selectedUser}
        onSave={() => {}} 
      />
    </Box>
  );
};

export default EmployeesList;