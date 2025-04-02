import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  Stack,Chip,
  Container,
  Snackbar, 
  Alert ,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  InputLabel,
  FormControl
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import PhotoCameraRoundedIcon from "@mui/icons-material/PhotoCameraRounded";
import { Edit} from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import axios from "axios";
import dayjs from "dayjs";

const UserProfile = () => {
  const [editMode, setEditMode] = useState({
    designation: false,
    //phoneNumber: false,
    department: false,
    jobLocation:false,
  });

  const [openSnackbar, setOpenSnackbar] = useState(false);

  const [userData, setUserData] = useState({
    userPhoto: localStorage.getItem("userPhoto") || "",
    userDesignation: localStorage.getItem("userDesignation") || "",
    userEmail: localStorage.getItem("userEmail") || "",
    userFirstName: localStorage.getItem("userFirstName") || "",
    userJobLocation: localStorage.getItem("userJobLocation"),
    userLastName: localStorage.getItem("userLastName") || "",
    userPhoneNumber: localStorage.getItem("userPhoneNumber") || "",
    userDepartment: localStorage.getItem("userDepartment"),
    userId: localStorage.getItem("userId") || "",
    userTechnicalSkills: localStorage.getItem("userTechnicalSkills")
    ? localStorage.getItem("userTechnicalSkills").split(",") 
    : [],
    userDateofBirth: localStorage.getItem("userDateofBirth"),
    userBloodGroup: localStorage.getItem("userBloodGroup"),
    userGender: localStorage.getItem("userGender"),
  });

  const [skillsList, setSkillsList] = useState(
    localStorage.getItem("userTechnicalSkills")
      ? localStorage.getItem("userTechnicalSkills").split(",")
      : []
  );

  const [openSkills, setOpenSkills] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const handleAddSkill = () => {
    if (newSkill.trim() !== "" && !skillsList.includes(newSkill)) {
      setSkillsList([...skillsList, newSkill]);
      setNewSkill("");
    }
  };


  const openSkillDialog=()=>{
    setOpenSkills(true);
  }

  const onClose=()=>{
    setUserData((prev) => ({
      ...prev,
      userTechnicalSkills: localStorage.getItem("userTechnicalSkills")? localStorage.getItem("userTechnicalSkills").split(",") : [],
    }));
    setOpenSkills(false);
  }
  
  const handleRemoveSkill = (index) => {
    const updatedSkills = [...skillsList];
    updatedSkills.splice(index, 1);
    setSkillsList(updatedSkills);
  };

  const [openEditDialog, setOpenEditDialog] = useState(false);
  
  
  const handleEditFieldsClick = () => {
    setOpenEditDialog(true);
  };

  // const handleCloseEditDialog = () => {
  //   setOpenEditDialog(false);
  // };

  const handleCloseEditDialog = () => {
    setUserData((prev) => ({
      ...prev,
      userDesignation: localStorage.getItem("userDesignation") || "",
      userDepartment: localStorage.getItem("userDepartment") || "",
      userJobLocation: localStorage.getItem("userJobLocation") || "",
    }));
    setOpenEditDialog(false);
  };
  

  const [openEditDetailsDialog, setOpenEditDetailsDialog] = useState(false);
  
  
  const handleEditDetails = () => {
    setOpenEditDetailsDialog(true);
  };

  // const handleCloseEditDetailsDialog = () => {
  //   setOpenEditDetailsDialog(false);
  // };

  const handleCloseEditDetailsDialog = () => {
    setUserData((prev) => ({
      ...prev,
      userPhoneNumber: localStorage.getItem("userPhoneNumber") || "",
      userDateofBirth: localStorage.getItem("userDateofBirth") || null,
      userBloodGroup: localStorage.getItem("userBloodGroup") || "",
      userGender: localStorage.getItem("userGender") || "",
    }));
    setOpenEditDetailsDialog(false);
  };  

  const handleSaveClick = async () => {
    const userId = userData.userId;
    const token = localStorage.getItem("token");
    const dataToUpdate = {
      id: userId,
      designation: userData.userDesignation,
      department: userData.userDepartment,
      jobLocation: userData.userJobLocation,
      technicalSkills: skillsList,
      phoneNumber: userData.userPhoneNumber,
      dateOfBirth: userData.userDateofBirth ? dayjs(userData.userDateofBirth).format("YYYY-MM-DD") : null, 
      bloodGroup: userData.userBloodGroup,
      gender: userData.userGender,
    };
  
    try {
      const response = await axios.patch("http://localhost:5000/api/users/update", dataToUpdate, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      if (response.data.success) {
        localStorage.setItem("userDesignation", userData.userDesignation);
        localStorage.setItem("userDepartment", userData.userDepartment);
        localStorage.setItem("userJobLocation", userData.userJobLocation);
        localStorage.setItem("userTechnicalSkills", skillsList.join(","));
        localStorage.setItem("userDateofBirth", dataToUpdate.dateOfBirth);
        localStorage.setItem("userPhoneNumber", dataToUpdate.phoneNumber);
        localStorage.setItem("userBloodGroup", dataToUpdate.bloodGroup);
        localStorage.setItem("userGender", dataToUpdate.gender);
        setUserData((prev) => ({
          ...prev,
          userTechnicalSkills: skillsList,
        }));
  
        setEditMode({
          designation: false,
          department: false,
          jobLocation: false,
        });
        setOpenSnackbar(true);
        setOpenSkills(false);
        setOpenEditDialog(false);
        setOpenEditDetailsDialog(false);
        console.log("Details Updated Successfully");
      } else {
        alert("Update failed.");
      }
    } catch (error) {
      console.error("Error updating data:", error);
      alert("Failed to update data.");
    }
  };
  
  
  const handleChange = (e, field) => {
    setUserData({ ...userData, [field]: e.target.value });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("id", userData.userId);

      try {
        const response = await axios.patch(
          "http://localhost:5000/api/users/update-photo",
          formData,
          {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`, // Send token
          },
        }
        );

        if (response.data.success) {
          const photoURL = response.data.photoUrl;
          setUserData((prevState) => ({ ...prevState, userPhoto: photoURL }));
          localStorage.setItem("userPhoto", photoURL);
          alert("Successfully Updated Photo");
        } else {
          alert("Failed to update photo.");
        }
      } catch (error) {
        console.error("Error uploading photo:", error);
        alert("Failed to upload photo.");
      }
    }
  };

  return (
    <Box sx={{ mt: 6, display: "flex", justifyContent: "center" }}>
      <Paper
        elevation={6}
          sx={{ 
          width: 250,
          height: '100%',
          borderRadius: 3,
          boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px", 
          p: 3,
          textAlign: "center",
        }}
      >
        <Box sx={{ position: "relative", display: "inline-block" }}>
          <Avatar
            src={userData.userPhoto}
            alt={`${userData.userFirstName} ${userData.userLastName}`}
            sx={{ width: 140, height: 140, mx: "auto", mb: 2, border: "4px solid white" }}
          />
          <IconButton
            component="label"
            sx={{
              position: "absolute",
              bottom: 8,
              right: 8,
              backgroundColor: "white",
              boxShadow: 1,
              "&:hover": { backgroundColor: "lightgray" }
            }}
          >
            <PhotoCameraRoundedIcon />
            <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
          </IconButton>
        </Box>
        <Typography variant="h6" sx={{ fontWeight: "bold", color: "#333" }}>
          {userData.userLastName} {userData.userFirstName}
        </Typography>
        <Typography variant="body1" sx={{ color: "#666" }}>
          {userData.userEmail}
        </Typography>
        
      <Paper
        elevation={6}
        sx={{
          mt: 1,
          p: 3,
          borderRadius: 3,
          backgroundColor:'#f4f7fe',
          // boxShadow: "rgba(0, 0, 0, 0.1) 0px 2px 12px", 
        }}
      > 
          <Stack direction="row" justifyContent="flex-end">
            <IconButton variant="outlined" size="small" onClick={handleEditFieldsClick}sx={{ p: 0.2, fontSize: 5, width: 5, height: 5 }}>
              <EditIcon />
            </IconButton>
          </Stack>
        <Stack spacing={1}>
          <Stack direction="row" >
            
              <Typography variant="body2" fontWeight="bold" fontSize={14}>
                Designation:
              </Typography>
          </Stack>
          <Stack direction="row">
              <Typography sx={{ml:3}} variant="body4" color="gray" >
                {userData.userDesignation}
              </Typography>
           
          </Stack>

          <Stack direction="row" >
            
              <Typography variant="body2" fontWeight="bold" fontSize={14}>
                Department:
              </Typography>
          </Stack>
          <Stack direction="row">
              <Typography sx={{ml:3}} variant="body4" color="gray" >
                {userData.userDepartment}
              </Typography>
           
          </Stack>

          <Stack direction="row"  >
            
              <Typography variant="body2" fontWeight="bold" fontSize={14}>
                Job Location:
              </Typography>
              </Stack>
              <Stack direction="row">
              <Typography sx={{ml:3}} variant="body4" color="gray" >
                {userData.userJobLocation}
              </Typography>
            
          </Stack>
        </Stack>
      </Paper>
      

      </Paper>
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle fontWeight="bold" sx={{ backgroundColor: '#8e44ad', color: '#ffffff' }}>
          Edit Information
          <IconButton
            color="inherit"
            onClick={handleCloseEditDialog}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Designation"
            fullWidth
            variant="outlined"
            value={userData.userDesignation}
            onChange={(e) => handleChange(e, "userDesignation")}
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              value={userData.userDepartment}
              onChange={(e) => handleChange(e, "userDepartment")}
            >
              <MenuItem value="Software Development">Software Development</MenuItem>
              <MenuItem value="Human Resources">Human Resources</MenuItem>
              <MenuItem value="Design">Design</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Job Location</InputLabel>
            <Select
              label="Job Location"
              value={userData.userJobLocation}
              onChange={(e) => handleChange(e, "userJobLocation")}
            >
              <MenuItem value="Hyderabad">Hyderabad</MenuItem>
              <MenuItem value="Chennai">Chennai</MenuItem>
              <MenuItem value="Kerala">Kerala</MenuItem>
              <MenuItem value="Amaravati">Amaravati</MenuItem>
              <MenuItem value="Delhi">Delhi</MenuItem>
              <MenuItem value="Mumbai">Mumbai</MenuItem>
              <MenuItem value="Kolkata">Kolkata</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          
          <Button onClick={handleSaveClick} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>
  <Box display="flex" flexDirection="column" gap={3} >
  <Paper
      elevation={6}
        sx={{
          ml:3,
          width: 400,
          borderRadius: 3,
          p: 3,
          boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px", 
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold" fontSize={18}>
            Personal Info
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
           
            <Button variant="outlined" startIcon={<Edit />} size="small" onClick={handleEditDetails}>
              Edit
            </Button>
          </Stack>
        </Stack>

        <Divider sx={{ my: 2 }} />
        <Stack spacing={2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight="bold" fontSize={14}>
                Phone Number:
              </Typography>
              <Typography variant="body4" color="gray" sx={{ml:3}}>
               {userData.userPhoneNumber}
              </Typography>
            </Box>
            <Stack >
              <Box>
                <Typography variant="body2" fontWeight="bold" fontSize={14} sx={{mr:9}}>
                  Blood Group:
                </Typography>
                <Typography variant="body4" color="gray"sx={{ml:3}}>
                {userData.userBloodGroup}
                </Typography>
              </Box>
            </Stack>
          </Stack>
          
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Box>
              <Typography variant="body2" fontWeight="bold" fontSize={14}>
                Date of Birth:
              </Typography>
              <Typography variant="body4" color="gray" sx={{ml:3}}>  
                {dayjs(userData.userDateofBirth).format("DD-MM-YYYY")}
              </Typography>
            </Box>
            <Stack >
              <Box>
                <Typography variant="body2" fontWeight="bold" fontSize={14} sx={{mr:13}}>
                  Gender:
                </Typography>
                <Typography variant="body4" color="gray"sx={{ml:3}}>
                  {userData.userGender}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Stack>
      </Paper>
      <Dialog open={openEditDetailsDialog} onClose={handleCloseEditDetailsDialog}>
        <DialogTitle fontWeight="bold" sx={{ backgroundColor: '#8e44ad', color: '#ffffff' }}>
          Edit Information
          <IconButton
            color="inherit"
            onClick={handleCloseEditDetailsDialog}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            label="Phone Number"
            fullWidth
            variant="outlined"
            value={userData.userPhoneNumber}
            onChange={(e) => handleChange(e, "userPhoneNumber")}
            sx={{ mt: 2 }}
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date of Birth"
              sx={{width :552, mt:2}}
              value={userData.userDateofBirth ? dayjs(userData.userDateofBirth) : null}
              onChange={(newValue) =>
                setUserData({ ...userData, userDateofBirth: newValue ? newValue.format("YYYY-MM-DD") : null })
              }
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mt: 2 }} />}
            />
          </LocalizationProvider>
          <FormControl sx={{ width:552,mt:2}} margin="dense"  variant="outlined">
            <InputLabel>Blood Group</InputLabel>
              <Select
                name="bloodGroup"
                onChange={(e) => handleChange(e, "userBloodGroup")}
                label="Blood Group"
                value={userData.userBloodGroup}
              >
                <MenuItem value="A +ve">A +</MenuItem>
                <MenuItem value="A -ve">A -</MenuItem>
                <MenuItem value="B +ve">B +</MenuItem>
                <MenuItem value="B -ve">B -</MenuItem>
                <MenuItem value="O +ve">O +</MenuItem>
                <MenuItem value="O -ve">O -</MenuItem>
                <MenuItem value="AB +ve">AB +</MenuItem>
                <MenuItem value="AB -ve">AB -</MenuItem>
              </Select>
          </FormControl>
          <FormControl sx={{ width:552,mt:2}} margin="dense"  variant="outlined">
            <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                onChange={(e) => handleChange(e, "userGender")}
                label="Gender"
                value={userData.userGender}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </Select>
          </FormControl>
          
        </DialogContent>
        <DialogActions>
          
          <Button onClick={handleSaveClick} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      
      <Paper
        elevation={6}
        sx={{
          ml:3,
          width: 400,
         height:210,
          borderRadius: 3,
          p: 3,
          boxShadow: "rgba(0, 0, 0, 0.1) 0px 4px 12px",
        }}
      >
       
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold" fontSize={18}>
            Technical Skills
          </Typography>
          <Button variant="outlined" size="small" startIcon={<Edit />} color="primary" onClick={openSkillDialog}>
            edit
          </Button>
        </Stack>

        <Divider sx={{ my: 2, flexGrow: 1 }} />

        <Stack sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)", 
        gap: 2.0, 
        justifyContent: "center",
        alignItems: "center",
        padding: 1,
        mt:2
      }}>
          {skillsList.map((skill, index) => (
              <Chip key={index} label={skill} color="primary" variant="outlined"   sx={{ height: 30, fontSize: '1rem', padding: '10px' }} />
            ))}
        </Stack>
      </Paper>  
      </Box>
      <Dialog open={openSkills} onClose={onClose}>
        <DialogTitle fontWeight="bold" sx={{ backgroundColor: '#8e44ad', color: '#ffffff' }}>Edit Technical Skills
        <IconButton
          color="inherit"
          onClick={onClose}
          aria-label="close"
          sx={{
            position: 'absolute',
            right: 8,
            top: 14,
          }}
        >
          <CloseIcon />
        </IconButton>
        </DialogTitle>
        <DialogContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={2} mt={4}>
          <TextField
            fullWidth
            label="Add a skill"
            variant="outlined"
            margin="dense"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
          />
          <Button variant="contained" size="medium" onClick={handleAddSkill} sx={{padding: '8px 16px',}}>
          
            Add
          </Button>
        </Stack>
         <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2.0, 
            justifyContent: "center",
            alignItems: "center",
            padding: 1,
          }}
        >
          {skillsList.map((skill, index) => (
            <Chip
              key={index}
              label={skill}
              onDelete={() => handleRemoveSkill(index)}
              color="primary"
              variant="outlined"
              
            />
          ))}
        </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" color="success" onClick={handleSaveClick}>Save</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={1000} 
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={() => setOpenSnackbar(false)} severity="success" 
          sx={{
            backgroundColor: "#4CAF50", 
            color: "#fff",   
          }}
          >
          Profile updated successfully!
        </Alert>
      </Snackbar>
   </Box>
  );
};
export default UserProfile; 