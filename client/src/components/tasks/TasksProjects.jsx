// import React, { useState } from 'react';
// import {
//   Box, Button, TextField, MenuItem, Select, InputLabel, FormControl, Table, TableBody, TableCell,
//   TableContainer, TableHead, TableRow, Paper, Typography, Dialog, DialogTitle, DialogContent,
//   DialogActions
// } from '@mui/material';
// import { Add as AddIcon } from '@mui/icons-material';

// // Sample data for employees (mocked from users table)
// const sampleEmployees = [
//   { id: 1, name: 'John Doe', email: 'john.doe@example.com' },
//   { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com' },
//   { id: 3, name: 'Alice Johnson', email: 'alice.johnson@example.com' },
// ];

// // Sample data for tasks
// const initialTasks = [
//   {
//     id: 1,
//     name: 'Develop Login Page',
//     description: 'Create a responsive login page with authentication.',
//     dueDate: '2025-06-05',
//     assignedEmployee: 'John Doe',
//     status: 'In Progress',
//   },
//   {
//     id: 2,
//     name: 'Database Optimization',
//     description: 'Optimize database queries for better performance.',
//     dueDate: '2025-06-10',
//     assignedEmployee: 'Jane Smith',
//     status: 'Pending',
//   },
//   {
//     id: 3,
//     name: 'UI Design Review',
//     description: 'Review and finalize UI designs for the dashboard.',
//     dueDate: '2025-06-03',
//     assignedEmployee: 'Alice Johnson',
//     status: 'Completed',
//   },
// ];

// const TasksProjects = () => {
//   const [tasks, setTasks] = useState(initialTasks);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [newTask, setNewTask] = useState({
//     name: '',
//     description: '',
//     dueDate: '',
//     assignedEmployee: '',
//     status: 'Pending',
//   });

//   // Handle form input changes
//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setNewTask((prev) => ({ ...prev, [name]: value }));
//   };

//   // Handle form submission to create a new task
//   const handleCreateTask = () => {
//     if (newTask.name && newTask.description && newTask.dueDate && newTask.assignedEmployee) {
//       const newTaskData = {
//         id: tasks.length + 1,
//         ...newTask,
//       };
//       setTasks([...tasks, newTaskData]);
//       setNewTask({
//         name: '',
//         description: '',
//         dueDate: '',
//         assignedEmployee: '',
//         status: 'Pending',
//       });
//       setOpenDialog(false);
//     } else {
//       alert('Please fill in all required fields.');
//     }
//   };

//   // Open and close dialog
//   const handleOpenDialog = () => setOpenDialog(true);
//   const handleCloseDialog = () => setOpenDialog(false);

//   return (
//     <Box sx={{ p: 3 }}>
//       <Typography variant="h4" gutterBottom>
//         Tasks and Projects
//       </Typography>
//       <Button
//         variant="contained"
//         startIcon={<AddIcon />}
//         sx={{ mb: 2, backgroundColor: '#14286D', '&:hover': { backgroundColor: '#0f1e4b' } }}
//         onClick={handleOpenDialog}
//       >
//         Create Task
//       </Button>

//       {/* Create Task Dialog */}
//       <Dialog open={openDialog} onClose={handleCloseDialog}>
//         <DialogTitle>Create New Task</DialogTitle>
//         <DialogContent>
//           <TextField
//             fullWidth
//             label="Task Name"
//             name="name"
//             value={newTask.name}
//             onChange={handleInputChange}
//             margin="normal"
//             required
//           />
//           <TextField
//             fullWidth
//             label="Description"
//             name="description"
//             value={newTask.description}
//             onChange={handleInputChange}
//             margin="normal"
//             multiline
//             rows={4}
//             required
//           />
//           <TextField
//             fullWidth
//             label="Due Date"
//             name="dueDate"
//             type="date"
//             value={newTask.dueDate}
//             onChange={handleInputChange}
//             margin="normal"
//             InputLabelProps={{ shrink: true }}
//             required
//           />
//           <FormControl fullWidth margin="normal" required>
//             <InputLabel>Assign Employee</InputLabel>
//             <Select
//               name="assignedEmployee"
//               value={newTask.assignedEmployee}
//               onChange={handleInputChange}
//               label="Assign Employee"
//             >
//               {sampleEmployees.map((employee) => (
//                 <MenuItem key={employee.id} value={employee.name}>
//                   {employee.name}
//                 </MenuItem>
//               ))}
//             </Select>
//           </FormControl>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCloseDialog}>Cancel</Button>
//           <Button onClick={handleCreateTask} variant="contained" color="primary">
//             Create
//           </Button>
//         </DialogActions>
//       </Dialog>

//       {/* Tasks Table */}
//       <TableContainer component={Paper}>
//         <Table>
//           <TableHead>
//             <TableRow>
//               <TableCell><strong>Task Name</strong></TableCell>
//               <TableCell><strong>Description</strong></TableCell>
//               <TableCell><strong>Due Date</strong></TableCell>
//               <TableCell><strong>Assigned Employee</strong></TableCell>
//               <TableCell><strong>Status</strong></TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {tasks.map((task) => (
//               <TableRow key={task.id}>
//                 <TableCell>{task.name}</TableCell>
//                 <TableCell>{task.description}</TableCell>
//                 <TableCell>{task.dueDate}</TableCell>
//                 <TableCell>{task.assignedEmployee}</TableCell>
//                 <TableCell>{task.status}</TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </TableContainer>
//     </Box>
//   );
// };

// export default TasksProjects;