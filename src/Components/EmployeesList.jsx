import React, { useEffect, useState } from 'react';
import {
  Typography, Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, TablePagination,
  IconButton,Menu,MenuItem,
  Divider
} from '@mui/material';
import axios from '../api/axios';
import EditEmployeeDialog from './EditEmployeeDialog';
import AddEmployeeDialog from './AddEmployeeDialog';
import DeleteDialog from './DeleteDialog';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ViewEmployeeDialog from './ViewEmployeeDialog';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

const EmployeesList = ({ onClose }) => {
  const [openAddUser, setOpenAddUser] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [menuUser, setMenuUser] = useState(null);
  const [openDeleteUser, setOpenDeleteUser] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // const [page, setPage] = useState(0);
  // const [rowsPerPage, setRowsPerPage] = useState(5);
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
      console.log("Feteched Users");
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  }
  
  useEffect(() => {
    fetchUsers();
  }, []);

  const handleClickOpenDeleteUser = () => {
    setOpenDeleteUser(true);
  };

  const handleCloseDeleteUser = () => {
    setOpenDeleteUser(false);
  };

  const handleClickOpenAddUser = async () => {
  const companyName = localStorage.getItem('companyName');
  const token = localStorage.getItem('token');

  try {
    const response = await axios.get('/users/next-employee-id', {
      params: { companyName },
      headers: { Authorization: `Bearer ${token}` },
    });

    const nextEmployeeId = response.data.employeeId;
    console.log('Next Employee ID from backend:', nextEmployeeId);
    setOpenAddUser(true);
    setSelectedUser({ employeeId: nextEmployeeId });
  } catch (error) {
    console.error('Error fetching next employee ID:', error);
  }
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
    const token = localStorage.getItem("token");
    try {
      const response = await axios.patch(`/users/${user.id}`, 
      {exists: 0},
      {headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.status === 200) {
        setUsers((prevUsers) => prevUsers.filter((u) => u.id !== user.id)); 
        console.log('User deleted successfully');
      } else {
        console.error('Failed to delete user');
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
          axios.patch(`/users/${id}`, 
          {exists: 0},
            {headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
  
      setUsers((prevUsers) => prevUsers.filter((user) => !selectedUsers.includes(user.id))); 
      setSelectedUsers([]);
      handleCloseDeleteUser();
      console.log('Selected users deleted successfully');
    } catch (error) {
      console.error('Error deleting selected users:', error);
    }
  };
  

  const filteredUsers = users.filter((user) =>
    (user.firstName || "").toLowerCase().includes(searchValue.toLowerCase()) ||
    (user.lastName || "").toLowerCase().includes(searchValue.toLowerCase()) ||
    (user.companyName || "").toLowerCase().includes(searchValue.toLowerCase()) ||
    (user.designation || "").toLowerCase().includes(searchValue.toLowerCase()) ||
    (user.email || "").toLowerCase().includes(searchValue.toLowerCase())
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

  // const handleChangePage = (event, newPage) => {
  //   setPage(newPage);
  // };

  // const handleChangeRowsPerPage = (event) => {
  //   setRowsPerPage(parseInt(event.target.value, 10));
  //   setPage(0);
  // };

  const userRole = localStorage.getItem('userRole');

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

  return (
    <Box sx={{ pl: 6 ,pr:6,mt:'30px'}}>
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
        {/* <AddEmployeeDialog open={openAddUser} onClose={handleCloseAddUser} onSave={fetchUsers}  /> */}
        <AddEmployeeDialog open={openAddUser} onClose={handleCloseAddUser} onSave={fetchUsers} employeeId={selectedUser?.employeeId} />
      </Box>
      <TableContainer component={Paper} sx={{
        maxHeight: '462px',
        overflowY: 'auto',
        boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px",
      }}>
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
              <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Photo</TableCell>
              <TableCell align='center' sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' ,cursor: 'pointer', alignItems: 'center',justifyContent: 'center' }} onClick={handleSortByEmployeeId}>
                Employee ID  {sortOrder === 'asc' ? <ArrowDownwardIcon fontSize="small" /> : <ArrowUpwardIcon fontSize="small" />}
              </TableCell>
              <TableCell align='left' sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Name</TableCell>
              <TableCell align='left' sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Designation</TableCell>
              <TableCell align='left' sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Email</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Actions</TableCell>
              <TableCell align='center'>
                {/* <FilterListIcon/> */}
              </TableCell>
            </TableRow> 
          </TableHead>
          <TableBody>
            {/* {filteredUsers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => ( */}
            {filteredUsers.map((user)=>(
              <TableRow key={user.id} selected={selectedUsers.includes(user.id)}>

                  <TableCell align="center">
                    <Checkbox
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                    />
                  </TableCell>
                <TableCell align='center'>
                  <img src={user.photo} alt="User" width="40" height="40" style={{ borderRadius: '50%' }} />
                </TableCell>
                <TableCell align='center'>{user.employeeId}</TableCell>
                <TableCell align='left'>{user.lastName} {user.firstName}</TableCell>
                <TableCell align='left'>{user.designation}</TableCell>
                <TableCell align='left'>{user.email}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="outlined"
                      color="primary"
                      size='small'
                      onClick={() => handleViewUser(user)}
                      sx={{ mr: 1 }}
                    >
                      View
                    </Button>
                  </TableCell>
                <TableCell align='left'>  
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
                    backgroundColor:'#ffffff',
                  },
                }}
              >
                <MenuItem onClick={handleEditMenuClick}>Edit</MenuItem>
                <Divider/>
                <MenuItem onClick={handleDeleteMenuClick}>Delete</MenuItem>
              </Menu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <ViewEmployeeDialog
          open={viewDialogOpen}
          onClose={handleViewDialogClose}
          user={viewUser}
        />
      </TableContainer>

      {/* <TablePagination
        component="div"
        rowsPerPageOptions={[5, 10, 25]}
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      /> */}

      <EditEmployeeDialog
        open={editDialogOpen}
        onClose={handleEditDialogClose}
        user={selectedUser}
        onSave={fetchUsers}
      />
    </Box>
  );
};

export default EmployeesList;

