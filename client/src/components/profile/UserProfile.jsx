import React, { useState, useEffect } from "react";
import { Box, Paper, Typography, Avatar, IconButton,TextField,Button,Stack,Chip,Container,
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
import axios from '../../api/axios';
import dayjs from "dayjs";
import useDepartments from '../../hooks/useDepartments';

const getStoredValue = (key) => {
  const value = localStorage.getItem(key);
  return value && value !== "null" && value !== "undefined" ? value : "";
};

const UserProfile = () => {
  const [editMode, setEditMode] = useState({
    designation: false,
    //phoneNumber: false,
    department: false,
    jobLocation:false,
  });

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});


  const [userData, setUserData] = useState({
    userPhoto: getStoredValue("userPhoto"),
    userDesignation: getStoredValue("userDesignation"),
    userEmail: getStoredValue("userEmail"),
    userFirstuserData: getStoredValue("userFirstName"),
    userJobLocation: getStoredValue("userJobLocation"),
    userLastuserData: getStoredValue("userLastName"),
    userPhoneNumber: getStoredValue("userPhoneNumber"),
    userDepartment: getStoredValue("userDepartment"),
    userId: getStoredValue("userId"),
    userTechnicalSkills: getStoredValue("userTechnicalSkills")
    ? getStoredValue("userTechnicalSkills").split(",") 
    : [],
    userDateofBirth: getStoredValue("userDateofBirth"),
    userBloodGroup: getStoredValue("userBloodGroup"),
    userGender: getStoredValue("userGender"),
  });

  const [skillsList, setSkillsList] = useState(
    getStoredValue("userTechnicalSkills")
      ? getStoredValue("userTechnicalSkills").split(",")
      : []
  );

  const [openSkills, setOpenSkills] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const { departmentNames } = useDepartments();
  const validateFields = (section = "all") => {
    const errors = {};
  
    if (section === "all" || section === "work") {
      if (!userData.userDesignation?.trim()) {
        errors.userDesignation = "Designation is required.";
      }

      if (!userData.userDepartment?.trim()) {
        errors.userDepartment = "Department is required.";
      }

      if (!userData.userJobLocation?.trim()) {
        errors.userJobLocation = "Job Location is required.";
      }
    }
  
    if (section === "all" || section === "personal") {
      if (!userData.userPhoneNumber?.trim()) {
        errors.userPhoneNumber = "Phone number is required.";
      } else if (!/^\d{10}$/.test(userData.userPhoneNumber)) {
        errors.userPhoneNumber = "Enter a valid 10-digit phone number.";
      }

      if (!userData.userDateofBirth) {
        errors.userDateofBirth = "Date of birth is required.";
      }

      if (!userData.userBloodGroup?.trim()) {
        errors.userBloodGroup = "Blood group is required.";
      }

      if (!userData.userGender?.trim()) {
        errors.userGender = "Gender is required.";
      }
    }
  
    setValidationErrors(errors);
  
    return Object.keys(errors).length === 0;
  };
  
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
      userTechnicalSkills: getStoredValue("userTechnicalSkills") ? getStoredValue("userTechnicalSkills").split(",") : [],
    }));
    setValidationErrors({});
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
      userDesignation: getStoredValue("userDesignation"),
      userDepartment: getStoredValue("userDepartment"),
      userJobLocation: getStoredValue("userJobLocation"),
    }));
    setValidationErrors({});
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
      userPhoneNumber: getStoredValue("userPhoneNumber"),
      userDateofBirth: getStoredValue("userDateofBirth"),
      userBloodGroup: getStoredValue("userBloodGroup"),
      userGender: getStoredValue("userGender"),
    }));
    setValidationErrors({});
    setOpenEditDetailsDialog(false);
  };  

  const handleSaveClick = async (section = "all") => {
    if (!userData.userId) {
      alert("Unable to save profile: user identity is missing. Please sign in again.");
      return;
    }

    if (!validateFields(section)) {
      return;
    }
    const userId = userData.userId;
    const token = localStorage.getItem("token");
    const dataToUpdate = {
      id: userId,
      designation: userData.userDesignation,
      department: userData.userDepartment,
      jobLocation: userData.userJobLocation,
      technicalSkills: skillsList,
      phoneNumber: userData.userPhoneNumber,
      dateOfBirth: userData.userDateofBirth && dayjs(userData.userDateofBirth).isValid()
        ? dayjs(userData.userDateofBirth).format("YYYY-MM-DD")
        : null,
      bloodGroup: userData.userBloodGroup,
      gender: userData.userGender,
    };
  
    try {
      const response = await axios.patch("/users/update", dataToUpdate, {
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
    const value = e.target.value;
    setUserData({ ...userData, [field]: value });
    setValidationErrors((prev) => {
      const newErrors = { ...prev };
  
      if (field === "userPhoneNumber") {
        if (!value) {
          newErrors.userPhoneNumber = "Phone number is required.";
        } else if (!/^\d{10}$/.test(value)) {
          newErrors.userPhoneNumber = "Phone Number must be in 10 digits.";
        } else {
          delete newErrors.userPhoneNumber;
        }
      } else if (field === "userDesignation") {
        if (!value.trim()) {
          newErrors.userDesignation = "Designation is required.";
        } else if (!/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
          newErrors.userDesignation = "Only letters and a single space between words allowed.";
        } else {
          delete newErrors.userDesignation;
        }
      } else if (field === "userDepartment") {
        if (!value.trim()) {
          newErrors.userDepartment = "Department is required.";
        } else {
          delete newErrors.userDepartment;
        }
      } else if (field === "userJobLocation") {
        if (!value.trim()) {
          newErrors.userJobLocation = "Job Location is required.";
        } else {
          delete newErrors.userJobLocation;
        }
      } else if (field === "userBloodGroup") {
        if (!value.trim()) {
          newErrors.userBloodGroup = "Blood group is required.";
        } else {
          delete newErrors.userBloodGroup;
        }
      } else if (field === "userGender") {
        if (!value.trim()) {
          newErrors.userGender = "Gender is required.";
        } else {
          delete newErrors.userGender;
        }
      }
  
      return newErrors;
    });
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("id", userData.userId);

      try {
        const response = await axios.patch(
          "/users/update-photo",
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

  const fullName = `${userData.userFirstuserData} ${userData.userLastuserData}`.trim() || "User";
  const formattedDateOfBirth = userData.userDateofBirth && dayjs(userData.userDateofBirth).isValid()
    ? dayjs(userData.userDateofBirth).format("DD MMM YYYY")
    : "Not added";
  const profileFields = [userData.userDesignation, userData.userDepartment, userData.userJobLocation, userData.userPhoneNumber, userData.userDateofBirth, userData.userBloodGroup, userData.userGender];
  const completedFields = profileFields.filter(Boolean).length;
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100);
  const detailValue = (value) => value || "Not added";

  return (
    <Box sx={{ maxWidth: 1240, mx: "auto", p: { xs: 2, md: 4 }, width: "100%", boxSizing: "border-box" }}>
      {!userData.userDepartment && (
        <Box sx={{ mb: 2.5, p: 2, bgcolor: "#FFF8E1", border: "1px solid #FFE082", borderRadius: 2 }}>
          <Typography variant="body2" sx={{ color: "#795548", fontWeight: 600 }}>
            Your account is waiting for company assignment. You can still complete your personal details below.
          </Typography>
        </Box>
      )}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ color: "primary.main", fontSize: { xs: "1.6rem", md: "2rem" } }}>My profile</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Keep your employee information accurate and up to date.</Typography>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "310px minmax(0, 1fr)" }, gap: 3, alignItems: "start" }}>
        <Box sx={{ bgcolor: "background.paper", borderRadius: 3, boxShadow: 2, overflow: "hidden" }}>
          <Box sx={{ height: 92, background: "linear-gradient(135deg, #14286D 0%, #2847B8 100%)" }} />
          <Box sx={{ px: 3, pb: 3, mt: -6, textAlign: "center" }}>
            <Box sx={{ position: "relative", display: "inline-block" }}>
              <Avatar src={userData.userPhoto || undefined} alt={fullName} sx={{ width: 112, height: 112, border: "5px solid #fff", bgcolor: "secondary.main", fontSize: "2rem", fontWeight: 700, boxShadow: 2 }}>
                {fullName.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase()}
              </Avatar>
              <IconButton component="label" aria-label="Change profile photo" sx={{ position: "absolute", bottom: 2, right: -4, bgcolor: "#fff", color: "primary.main", boxShadow: 2, "&:hover": { bgcolor: "#F1F5FF" } }}>
                <PhotoCameraRoundedIcon fontSize="small" />
                <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
              </IconButton>
            </Box>
            <Typography variant="h6" sx={{ mt: 1.5, fontWeight: 700 }}>{fullName}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: "break-word" }}>{detailValue(userData.userEmail)}</Typography>
            <Chip label={detailValue(userData.userDesignation)} color="primary" size="small" sx={{ mt: 1.5 }} />
            <Divider sx={{ my: 2.5 }} />
            <Stack spacing={1.5} sx={{ textAlign: "left" }}>
              <Box><Typography variant="caption" color="text.secondary">Department</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{detailValue(userData.userDepartment)}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Work location</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{detailValue(userData.userJobLocation)}</Typography></Box>
              <Box><Typography variant="caption" color="text.secondary">Employee ID</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{detailValue(localStorage.getItem("userEmployeeId"))}</Typography></Box>
            </Stack>
            <Button fullWidth variant="outlined" startIcon={<Edit />} onClick={handleEditFieldsClick} sx={{ mt: 2.5 }}>Edit work details</Button>
          </Box>
        </Box>

        <Stack spacing={3}>
          <Box sx={{ bgcolor: "background.paper", borderRadius: 3, boxShadow: 2, p: { xs: 2, md: 3 } }}>
            <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
              <Box><Typography variant="h6">Profile overview</Typography><Typography variant="body2" color="text.secondary">Your profile is {profileCompletion}% complete.</Typography></Box>
              <Button variant="contained" startIcon={<Edit />} onClick={handleEditDetails}>Edit personal info</Button>
            </Stack>
            <Box sx={{ height: 8, bgcolor: "#E8ECF5", borderRadius: 5, mt: 2 }}><Box sx={{ height: "100%", width: `${profileCompletion}%`, bgcolor: profileCompletion === 100 ? "success.main" : "secondary.main", borderRadius: 5, transition: "width 300ms ease" }} /></Box>
          </Box>

          <Box sx={{ bgcolor: "background.paper", borderRadius: 3, boxShadow: 2, p: { xs: 2, md: 3 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="h6">Personal information</Typography><Typography variant="body2" color="text.secondary">Private details used for employee records.</Typography></Box><IconButton aria-label="Edit personal information" onClick={handleEditDetails}><EditIcon /></IconButton></Stack>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
              {[["Phone number", userData.userPhoneNumber], ["Blood group", userData.userBloodGroup], ["Date of birth", formattedDateOfBirth], ["Gender", userData.userGender]].map(([label, value]) => <Box key={label}><Typography variant="caption" color="text.secondary">{label}</Typography><Typography variant="body1" sx={{ mt: 0.25, fontWeight: 600 }}>{detailValue(value)}</Typography></Box>)}
            </Box>
          </Box>

          <Box sx={{ bgcolor: "background.paper", borderRadius: 3, boxShadow: 2, p: { xs: 2, md: 3 } }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="h6">Technical skills</Typography><Typography variant="body2" color="text.secondary">Skills that represent your current capabilities.</Typography></Box><Button variant="outlined" startIcon={<Edit />} onClick={openSkillDialog}>Manage skills</Button></Stack>
            <Divider sx={{ my: 2 }} />
            {skillsList.length > 0 ? <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>{skillsList.map((skill, index) => <Chip key={`${skill}-${index}`} label={skill} color="primary" variant="outlined" />)}</Box> : <Typography variant="body2" color="text.secondary">No skills added yet.</Typography>}
          </Box>
        </Stack>
      </Box>
      <Dialog open={openEditDetailsDialog} onClose={handleCloseEditDetailsDialog}>
        <DialogTitle fontWeight="bold" >
          Edit Information
          <IconButton
            color="inherit"
            onClick={handleCloseEditDetailsDialog}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent 
        sx={{
          backgroundColor: '#fff',
          borderRadius: 2,
          p: 3,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        }}
        >
          
          <TextField
            label="Phone Number"
            fullWidth
            variant="outlined"
            value={userData.userPhoneNumber}
            onChange={(e) => handleChange(e, "userPhoneNumber")}
            sx={{ mt: 2 }}
            error={!!validationErrors.userPhoneNumber}
            helperText={validationErrors.userPhoneNumber}
          />

          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DatePicker
              label="Date of Birth"
              sx={{width :552, mt:2}}
              value={userData.userDateofBirth ? dayjs(userData.userDateofBirth) : null}
              onChange={(newValue) =>
                setUserData({ ...userData, userDateofBirth: newValue ? newValue.format("YYYY-MM-DD") : null })
              }
              renderInput={(params) => <TextField {...params} fullWidth sx={{ mt: 2 }} 
              error={!!validationErrors.userDateofBirth}
              helperText={validationErrors.userDateofBirth}
              />}
            />
          </LocalizationProvider>
          <FormControl sx={{ width:552,mt:2}} margin="dense"  variant="outlined" error={!!validationErrors.userBloodGroup}>
            <InputLabel>Blood Group</InputLabel>
              <Select
                userData="bloodGroup"
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
              {validationErrors.userGender && (
        <Typography variant="caption" color="error">{validationErrors.userBloodGroup}</Typography>
      )}
          </FormControl>
          <FormControl sx={{ width:552,mt:2}} margin="dense"  variant="outlined" error={!!validationErrors.userGender}>
            <InputLabel>Gender</InputLabel>
              <Select
                userData="gender"
                onChange={(e) => handleChange(e, "userGender")}
                label="Gender"
                value={userData.userGender}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
              </Select>
              {validationErrors.userGender && (
        <Typography variant="caption" color="error">{validationErrors.userGender}</Typography>
      )}
          </FormControl>
          <DialogActions>          
          <Button onClick={() => handleSaveClick("personal")} sx={{mt:2}}color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>          
        </DialogContent>
      </Dialog>
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog}>
        <DialogTitle fontWeight="bold">
          Edit Information
          <IconButton
            color="inherit"
            onClick={handleCloseEditDialog}
            sx={{ position: "absolute", right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
        sx={{
          backgroundColor: '#fff',
          borderRadius: 2,
          p: 3,
          boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
        }}        
        >
          <TextField
            label="Designation"
            fullWidth
            variant="outlined"
            value={userData.userDesignation}
            onChange={(e) => handleChange(e, "userDesignation")}
            sx={{ mt: 2 }}
            error={!!validationErrors.userDesignation}
            helperText={validationErrors.userDesignation}
          />
          <FormControl fullWidth sx={{ mt: 2 }} error={!!validationErrors.userDepartment}>
            <InputLabel>Department</InputLabel>
            <Select
              label="Department"
              value={userData.userDepartment}
              onChange={(e) => handleChange(e, "userDepartment")}
              disabled
            >
              {departmentNames.length === 0 ? (
                <MenuItem disabled value="">{userData.userDepartment || "No departments"}</MenuItem>
              ) : (
                departmentNames.map((name) => (
                  <MenuItem key={name} value={name}>{name}</MenuItem>
                ))
              )}
              {userData.userDepartment && !departmentNames.includes(userData.userDepartment) && (
                <MenuItem value={userData.userDepartment}>{userData.userDepartment} (legacy)</MenuItem>
              )}
            </Select>
            {validationErrors.userDepartment && (
        <Typography variant="caption" color="error">{validationErrors.userDepartment}</Typography>
      )}

          </FormControl>

          <FormControl fullWidth sx={{ mt: 2 }} error={!!validationErrors.userJobLocation}>
            <InputLabel>Job Location</InputLabel>
            <Select
              label="Job Location"
              value={userData.userJobLocation || ""}
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
            {validationErrors.userGender && (
        <Typography variant="caption" color="error">{validationErrors.userJobLocation}</Typography>
      )}

          </FormControl>
          <DialogActions>
          
          <Button onClick={() => handleSaveClick("work")} color="primary" variant="contained">
            Save
          </Button>
        </DialogActions>
        </DialogContent>
      </Dialog>      
      <Dialog open={openSkills} onClose={onClose}>
        <DialogTitle >Edit Technical Skills
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
        <DialogContent 
          sx={{
            backgroundColor: '#fff',
            borderRadius: 2,
            p: 3,
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
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
              sx={{
                borderRadius: 1,
                fontSize: '0.875rem',
                height: 32,
                '& .MuiChip-label': { fontWeight: 500 },
              }}
            />
          ))}
        </Box>
        <DialogActions>
          <Button variant="contained" color="success" onClick={() => handleSaveClick("skills")}>Save</Button>
        </DialogActions>
        </DialogContent>
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