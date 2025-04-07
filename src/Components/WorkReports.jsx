// import React, { useState, useEffect } from "react";
// import {
//   Container, TextField, Button, Typography, Snackbar, Select, MenuItem,
//   Dialog, DialogActions, DialogContent, DialogTitle, InputLabel, FormControl,
//   Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
//   Grid, IconButton, Card, CardContent
// } from "@mui/material";
// import EditIcon from "@mui/icons-material/Edit";
// import DeleteIcon from "@mui/icons-material/Delete";
// import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

// const WorkReports = () => {
//   const [reports, setReports] = useState([]);
//   const [newReport, setNewReport] = useState({
//     date: "",
//     tasks: "",
//     hoursWorked: "",
//     status: "Pending",
//   });
//   const [openSnackbar, setOpenSnackbar] = useState(false);
//   const [filter, setFilter] = useState("All");
//   const [editIndex, setEditIndex] = useState(null);
//   const [openDialog, setOpenDialog] = useState(false);
//   const employeeId = localStorage.getItem("userEmployeeId");

//   useEffect(() => {
//     if (!employeeId) {
//       console.error("No employee ID found in localStorage");
//       return;
//     }

//     fetch(`http://localhost:5000/api/reports?employeeId=${employeeId}`, {
//       method: "GET",
//       headers: { "Content-Type": "application/json" },
//     })
//       .then((res) => {
//         if (!res.ok) throw new Error("Failed to fetch reports");
//         return res.json();
//       })
//       .then((data) => setReports(data))
//       .catch((err) => console.error("Fetch error:", err));
//   }, [employeeId]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!newReport.date || !newReport.tasks || !newReport.hoursWorked) {
//       console.error("All fields are required");
//       return;
//     }

//     const url =
//       editIndex !== null
//         ? `http://localhost:5000/api/reports/${reports[editIndex].id}`
//         : "http://localhost:5000/api/reports";
//     const method = editIndex !== null ? "PUT" : "POST";

//     try {
//       const res = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           ...newReport,
//           employeeId,
//         }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         if (editIndex !== null) {
//           const updatedReports = [...reports];
//           updatedReports[editIndex] = { ...newReport, id: reports[editIndex].id };
//           setReports(updatedReports);
//           setEditIndex(null);
//         } else {
//           setReports([...reports, { ...newReport, id: data.id }]);
//         }
//         setNewReport({ date: "", tasks: "", hoursWorked: "", status: "Pending" });
//         setOpenSnackbar(true);
//         setOpenDialog(false);
//       } else {
//         console.error("Server error:", data.error);
//       }
//     } catch (error) {
//       console.error("Submit error:", error);
//     }
//   };

//   const handleEdit = (index) => {
//     setNewReport(reports[index]);
//     setEditIndex(index);
//     setOpenDialog(true);
//   };

//   const handleDelete = async (index) => {
//     const id = reports[index].id;
//     try {
//       const res = await fetch(`http://localhost:5000/api/reports/${id}`, {
//         method: "DELETE",
//         headers: { "Content-Type": "application/json" },
//       });
//       if (res.ok) {
//         const updatedReports = reports.filter((_, i) => i !== index);
//         setReports(updatedReports);
//       } else {
//         throw new Error("Failed to delete report");
//       }
//     } catch (error) {
//       console.error("Delete error:", error);
//     }
//   };

//   const filteredReports = filter === "All" ? reports : reports.filter((r) => r.status === filter);

//   // Rest of your JSX remains the same
//   return (
//     <Container maxWidth="lg">
//       <Typography variant="h4" gutterBottom align="center">
//         My Work Reports
//       </Typography>
//       {/* ... rest of your JSX ... */}
//        <Card sx={{ mt: 4 }}>
//          <CardContent>
//            <Grid container spacing={2} justifyContent="space-between" alignItems="center">
//              <Grid item>
//                <Button
//                 variant="contained"
//                 color="primary"
//                 startIcon={<AddCircleOutlineIcon />}
//                 onClick={() => {
//                   setEditIndex(null);
//                   setNewReport({ date: "", tasks: "", hoursWorked: "", status: "Pending" });
//                   setOpenDialog(true);
//                 }}
//               >
//                 Add Report
//               </Button>
//             </Grid>
//             <Grid item xs={12} sm={4}>
//               <FormControl fullWidth>
//                 <InputLabel>Status Filter</InputLabel>
//                 <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
//                   <MenuItem value="All">All</MenuItem>
//                   <MenuItem value="Pending">Pending</MenuItem>
//                   <MenuItem value="In Progress">In Progress</MenuItem>
//                   <MenuItem value="Completed">Completed</MenuItem>
//                 </Select>
//               </FormControl>
//             </Grid>
//           </Grid>
//           <TableContainer component={Paper} sx={{ mt: 4 }}>
//             <Table>
//               <TableHead>
//                 <TableRow>
//                   <TableCell>Date</TableCell>
//                   <TableCell>Tasks</TableCell>
//                   <TableCell>Hours Worked</TableCell>
//                   <TableCell>Status</TableCell>
//                   <TableCell align="center">Actions</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {filteredReports.map((report, index) => (
//                   <TableRow key={report.id}>
//                     <TableCell>{report.date}</TableCell>
//                     <TableCell>{report.tasks}</TableCell>
//                     <TableCell>{report.hoursWorked}</TableCell>
//                     <TableCell>{report.status}</TableCell>
//                     <TableCell align="center">
//                       <IconButton color="primary" onClick={() => handleEdit(index)}>
//                         <EditIcon />
//                       </IconButton>
//                       <IconButton color="secondary" onClick={() => handleDelete(index)}>
//                         <DeleteIcon />
//                       </IconButton>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//                 {filteredReports.length === 0 && (
//                   <TableRow>
//                     <TableCell colSpan={5} align="center">
//                       No reports found.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         </CardContent>
//       </Card>

//       <Grid container spacing={2} sx={{ mt: 3 }}>
//   <Grid item xs={12} sm={4}>
//     <Card sx={{ height: "100%" }}>
//       <CardContent>
//         <Typography variant="h6" gutterBottom>
//           Total Reports
//         </Typography>
//         <Typography variant="h5">
//           {reports.length}
//         </Typography>
//       </CardContent>
//     </Card>
//   </Grid>
//   <Grid item xs={12} sm={4}>
//     <Card sx={{ height: "100%" }}>
//       <CardContent>
//         <Typography variant="h6" gutterBottom>
//           Completed Reports
//         </Typography>
//         <Typography variant="h5">
//           {reports.filter((r) => r.status === "Completed").length}
//         </Typography>
//       </CardContent>
//     </Card>
//   </Grid>
//   <Grid item xs={12} sm={4}>
//     <Card sx={{ height: "100%" }}>
//       <CardContent>
//         <Typography variant="h6" gutterBottom>
//           Pending/In Progress
//         </Typography>
//         <Typography variant="h5">
//           {reports.filter((r) => r.status !== "Completed").length}
//         </Typography>
//       </CardContent>
//     </Card>
//   </Grid>
// </Grid>


//       <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
//         <DialogTitle>{editIndex !== null ? "Edit Report" : "Add Report"}</DialogTitle>
//         <DialogContent>
//           <TextField
//             label="Date"
//             type="date"
//             fullWidth
//             margin="normal"
//             value={newReport.date}
//             onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
//             InputLabelProps={{ shrink: true }}
//             required
//           />
//           <TextField
//             label="Tasks Woked-on"
//             multiline
//             rows={3}
//             fullWidth
//             margin="normal"
//             value={newReport.tasks}
//             onChange={(e) => setNewReport({ ...newReport, tasks: e.target.value })}
//             required
//           />
//           <TextField
//             label="Hours Worked"
//             type="number"
//             fullWidth
//             margin="normal"
//             value={newReport.hoursWorked}
//             onChange={(e) => setNewReport({ ...newReport, hoursWorked: e.target.value })}
//             required
//           />
//           <FormControl fullWidth margin="normal">
//             <InputLabel>Status</InputLabel>
//             <Select
//               value={newReport.status}
//               onChange={(e) => setNewReport({ ...newReport, status: e.target.value })}
//             >
//               <MenuItem value="Pending">Pending</MenuItem>
//               <MenuItem value="In Progress">In Progress</MenuItem>
//               <MenuItem value="Completed">Completed</MenuItem>
//             </Select>
//           </FormControl>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpenDialog(false)} color="secondary">
//             Cancel
//           </Button>
//           <Button onClick={handleSubmit} color="primary">
//             {editIndex !== null ? "Update" : "Submit"}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Snackbar
//         open={openSnackbar}
//         autoHideDuration={3000}
//         onClose={() => setOpenSnackbar(false)}
//         message="Report saved successfully!"
//       />
//     </Container>
//   );
// };

// export default WorkReports;

// import React, { useState, useEffect } from "react";
// import {
//   Container, TextField, Button, Typography, Snackbar, Select, MenuItem,
//   Dialog, DialogActions, DialogContent, DialogTitle, InputLabel, FormControl,
//   Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
//   Grid, IconButton, Card, CardContent, Box, Chip
// } from "@mui/material";
// import EditIcon from "@mui/icons-material/Edit";
// import DeleteIcon from "@mui/icons-material/Delete";
// import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

// const WorkReports = () => {
//   const [reports, setReports] = useState([]);
//   const [newReport, setNewReport] = useState({
//     date: "",
//     tasks: "",
//     hoursWorked: "",
//     status: "Pending",
//   });
//   const [openSnackbar, setOpenSnackbar] = useState(false);
//   const [filter, setFilter] = useState("All");
//   const [editIndex, setEditIndex] = useState(null);
//   const [openDialog, setOpenDialog] = useState(false);
//   const employeeId = localStorage.getItem("userEmployeeId");

//   useEffect(() => {
//     if (!employeeId) return;

//     fetch(`http://localhost:5000/api/reports?employeeId=${employeeId}`)
//       .then((res) => res.json())
//       .then((data) => setReports(data))
//       .catch((err) => console.error(err));
//   }, [employeeId]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const url =
//       editIndex !== null
//         ? `http://localhost:5000/api/reports/${reports[editIndex].id}`
//         : "http://localhost:5000/api/reports";
//     const method = editIndex !== null ? "PUT" : "POST";

//     try {
//       const res = await fetch(url, {
//         method,
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ ...newReport, employeeId }),
//       });

//       const data = await res.json();

//       if (res.ok) {
//         if (editIndex !== null) {
//           const updated = [...reports];
//           updated[editIndex] = { ...newReport, id: reports[editIndex].id };
//           setReports(updated);
//         } else {
//           setReports([...reports, { ...newReport, id: data.id }]);
//         }
//         setNewReport({ date: "", tasks: "", hoursWorked: "", status: "Pending" });
//         setOpenSnackbar(true);
//         setOpenDialog(false);
//         setEditIndex(null);
//       } else {
//         console.error("Server error:", data.error);
//       }
//     } catch (err) {
//       console.error("Error submitting report:", err);
//     }
//   };

//   const handleEdit = (index) => {
//     setNewReport(reports[index]);
//     setEditIndex(index);
//     setOpenDialog(true);
//   };

//   const handleDelete = async (index) => {
//     const id = reports[index].id;
//     try {
//       const res = await fetch(`http://localhost:5000/api/reports/${id}`, {
//         method: "DELETE",
//       });
//       if (res.ok) {
//         setReports(reports.filter((_, i) => i !== index));
//       }
//     } catch (err) {
//       console.error("Error deleting report:", err);
//     }
//   };

//   const filteredReports =
//     filter === "All" ? reports : reports.filter((r) => r.status === filter);

//   const statusColor = (status) => {
//     switch (status) {
//       case "Completed":
//         return "success";
//       case "In Progress":
//         return "warning";
//       case "Pending":
//       default:
//         return "default";
//     }
//   };

//   return (
//     <Container maxWidth="lg" sx={{ mt: 5 }}>
//       <Typography variant="h4" gutterBottom align="center">
//         My Work Reports
//       </Typography>

//       <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
//         <Button
//           variant="contained"
//           startIcon={<AddCircleOutlineIcon />}
//           onClick={() => {
//             setNewReport({ date: "", tasks: "", hoursWorked: "", status: "Pending" });
//             setEditIndex(null);
//             setOpenDialog(true);
//           }}
//         >
//           Add Report
//         </Button>

//         <FormControl sx={{ minWidth: 200 }}>
//           <InputLabel>Status Filter</InputLabel>
//           <Select value={filter} onChange={(e) => setFilter(e.target.value)} label="Status Filter">
//             <MenuItem value="All">All</MenuItem>
//             <MenuItem value="Pending">Pending</MenuItem>
//             <MenuItem value="In Progress">In Progress</MenuItem>
//             <MenuItem value="Completed">Completed</MenuItem>
//           </Select>
//         </FormControl>
//       </Box>

//       <Grid container spacing={3} sx={{ mb: 4 }}>
//         <Grid item xs={12} sm={4}>
//           <Card>
//             <CardContent>
//               <Typography color="textSecondary" gutterBottom>
//                 Total Reports
//               </Typography>
//               <Typography variant="h5">{reports.length}</Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={4}>
//           <Card>
//             <CardContent>
//               <Typography color="textSecondary" gutterBottom>
//                 Completed Reports
//               </Typography>
//               <Typography variant="h5">
//                 {reports.filter((r) => r.status === "Completed").length}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//         <Grid item xs={12} sm={4}>
//           <Card>
//             <CardContent>
//               <Typography color="textSecondary" gutterBottom>
//                 Pending/In Progress
//               </Typography>
//               <Typography variant="h5">
//                 {reports.filter((r) => r.status !== "Completed").length}
//               </Typography>
//             </CardContent>
//           </Card>
//         </Grid>
//       </Grid>

//       <TableContainer component={Paper} elevation={3}>
//         <Table>
//           <TableHead>
//             <TableRow>
//               <TableCell>Date</TableCell>
//               <TableCell>Tasks</TableCell>
//               <TableCell>Hours Worked</TableCell>
//               <TableCell>Status</TableCell>
//               <TableCell align="center">Actions</TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {filteredReports.map((report, index) => (
//               <TableRow key={report.id}>
//                 <TableCell>{report.date}</TableCell>
//                 <TableCell>{report.tasks}</TableCell>
//                 <TableCell>{report.hoursWorked}</TableCell>
//                 <TableCell>
//                   <Chip label={report.status} color={statusColor(report.status)} />
//                 </TableCell>
//                 <TableCell align="center">
//                   <IconButton color="primary" onClick={() => handleEdit(index)}>
//                     <EditIcon />
//                   </IconButton>
//                   <IconButton color="error" onClick={() => handleDelete(index)}>
//                     <DeleteIcon />
//                   </IconButton>
//                 </TableCell>
//               </TableRow>
//             ))}
//             {filteredReports.length === 0 && (
//               <TableRow>
//                 <TableCell colSpan={5} align="center">
//                   No reports found.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
//         <DialogTitle>{editIndex !== null ? "Edit Report" : "Add Report"}</DialogTitle>
//         <DialogContent>
//           <TextField
//             label="Date"
//             type="date"
//             fullWidth
//             margin="normal"
//             value={newReport.date}
//             onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
//             InputLabelProps={{ shrink: true }}
//           />
//           <TextField
//             label="Tasks Worked On"
//             multiline
//             rows={3}
//             fullWidth
//             margin="normal"
//             value={newReport.tasks}
//             onChange={(e) => setNewReport({ ...newReport, tasks: e.target.value })}
//           />
//           <TextField
//             label="Hours Worked"
//             type="number"
//             fullWidth
//             margin="normal"
//             value={newReport.hoursWorked}
//             onChange={(e) => setNewReport({ ...newReport, hoursWorked: e.target.value })}
//           />
//           <FormControl fullWidth margin="normal">
//             <InputLabel>Status</InputLabel>
//             <Select
//               value={newReport.status}
//               onChange={(e) => setNewReport({ ...newReport, status: e.target.value })}
//               label="Status"
//             >
//               <MenuItem value="Pending">Pending</MenuItem>
//               <MenuItem value="In Progress">In Progress</MenuItem>
//               <MenuItem value="Completed">Completed</MenuItem>
//             </Select>
//           </FormControl>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setOpenDialog(false)} color="secondary">
//             Cancel
//           </Button>
//           <Button onClick={handleSubmit} variant="contained">
//             {editIndex !== null ? "Update" : "Submit"}
//           </Button>
//         </DialogActions>
//       </Dialog>

//       <Snackbar
//         open={openSnackbar}
//         autoHideDuration={3000}
//         onClose={() => setOpenSnackbar(false)}
//         message="Report saved successfully!"
//       />
//     </Container>
//   );
// };

// export default WorkReports;

import React, { useState, useEffect } from "react";
import {
  Container, TextField, Button, Typography, Snackbar, Select, MenuItem,
  Dialog, DialogActions, DialogContent, DialogTitle, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Grid, IconButton, Card, CardContent, Box
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

const WorkReports = () => {
  const [reports, setReports] = useState([]);
  const [newReport, setNewReport] = useState({
    date: "",
    tasks: "",
    hoursWorked: "",
    status: "Pending",
  });
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [filter, setFilter] = useState("All");
  const [editIndex, setEditIndex] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const employeeId = localStorage.getItem("userEmployeeId");

  useEffect(() => {
    if (!employeeId) {
      console.error("No employee ID found in localStorage");
      return;
    }

    fetch(`http://localhost:5000/api/reports?employeeId=${employeeId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch reports");
        return res.json();
      })
      .then((data) => setReports(data))
      .catch((err) => console.error("Fetch error:", err));
  }, [employeeId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newReport.date || !newReport.tasks || !newReport.hoursWorked) {
      console.error("All fields are required");
      return;
    }

    const url =
      editIndex !== null
        ? `http://localhost:5000/api/reports/${reports[editIndex].id}`
        : "http://localhost:5000/api/reports";
    const method = editIndex !== null ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newReport,
          employeeId,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        if (editIndex !== null) {
          const updatedReports = [...reports];
          updatedReports[editIndex] = { ...newReport, id: reports[editIndex].id };
          setReports(updatedReports);
          setEditIndex(null);
        } else {
          setReports([...reports, { ...newReport, id: data.id }]);
        }
        setNewReport({ date: "", tasks: "", hoursWorked: "", status: "Pending" });
        setOpenSnackbar(true);
        setOpenDialog(false);
      } else {
        console.error("Server error:", data.error);
      }
    } catch (error) {
      console.error("Submit error:", error);
    }
  };

  const handleEdit = (index) => {
    setNewReport(reports[index]);
    setEditIndex(index);
    setOpenDialog(true);
  };

  const handleDelete = async (index) => {
    const id = reports[index].id;
    try {
      const res = await fetch(`http://localhost:5000/api/reports/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (res.ok) {
        const updatedReports = reports.filter((_, i) => i !== index);
        setReports(updatedReports);
      } else {
        throw new Error("Failed to delete report");
      }
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const filteredReports = filter === "All" ? reports : reports.filter((r) => r.status === filter);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 600 }}>
        My Work Reports
      </Typography>

      <Grid container spacing={2} justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Grid item>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddCircleOutlineIcon />}
            onClick={() => {
              setEditIndex(null);
              setNewReport({ date: "", tasks: "", hoursWorked: "", status: "Pending" });
              setOpenDialog(true);
            }}
          >
            Add Report
          </Button>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth>
            <InputLabel>Status Filter</InputLabel>
            <Select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <MenuItem value="All">All</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      {/* <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">Total Reports</Typography>
              <Typography variant="h5">{reports.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">Completed Reports</Typography>
              <Typography variant="h5">{reports.filter((r) => r.status === "Completed").length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={4}>
            <CardContent>
              <Typography variant="subtitle1" color="text.secondary">Pending/In Progress</Typography>
              <Typography variant="h5">{reports.filter((r) => r.status !== "Completed").length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card elevation={3} sx={{ textAlign: 'center', py: 3 }}>
            <CardContent>
              <Typography variant="h4">{reports.length}</Typography>
              <Typography variant="subtitle1" color="text.secondary">Total Reports</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={3} sx={{ textAlign: 'center', py: 3 }}>
            <CardContent>
              <Typography variant="h4">
                {reports.filter((r) => r.status === "Completed").length}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">Completed Reports</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card elevation={3} sx={{ textAlign: 'center', py: 3 }}>
            <CardContent>
              <Typography variant="h4">
                {reports.filter((r) => r.status !== "Completed").length}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">Pending/In Progress</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>


      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell  sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Tasks</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Hours</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Status</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold', fontSize: '16px', color: 'black' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredReports.length > 0 ? (
              filteredReports.map((report, index) => (
                <TableRow key={report.id} hover>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>{report.tasks}</TableCell>
                  <TableCell>{report.hoursWorked}</TableCell>
                  <TableCell>{report.status}</TableCell>
                  <TableCell align="center">
                    <IconButton color="primary" onClick={() => handleEdit(index)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">No reports found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editIndex !== null ? "Edit Report" : "Add New Report"}</DialogTitle>
        <DialogContent>
          <TextField
            label="Date"
            type="date"
            fullWidth
            margin="dense"
            value={newReport.date}
            onChange={(e) => setNewReport({ ...newReport, date: e.target.value })}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Tasks Worked On"
            multiline
            rows={3}
            fullWidth
            margin="dense"
            value={newReport.tasks}
            onChange={(e) => setNewReport({ ...newReport, tasks: e.target.value })}
          />
          <TextField
            label="Hours Worked"
            type="number"
            fullWidth
            margin="dense"
            value={newReport.hoursWorked}
            onChange={(e) => setNewReport({ ...newReport, hoursWorked: e.target.value })}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>
            <Select
              value={newReport.status}
              onChange={(e) => setNewReport({ ...newReport, status: e.target.value })}
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="In Progress">In Progress</MenuItem>
              <MenuItem value="Completed">Completed</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editIndex !== null ? "Update" : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
        message="Report saved successfully!"
      />
    </Container>
  );
};

export default WorkReports;
