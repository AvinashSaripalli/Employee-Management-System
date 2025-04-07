import React, { useState, useEffect } from 'react';
import { Dialog, DialogActions, DialogContent, DialogTitle,Alert, Button, TextField,  FormControl, InputLabel, Select, MenuItem, Chip, Autocomplete } from '@mui/material';
import axios from 'axios';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const EditEmployeeDialog = ({ open, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyName:'',
    employeeId:'',
    role:'',
    designation: '',
    email: '',
    phoneNumber: '',
    gender: '',
    department:'',
    jobLocation:'',
    bloodGroup:'',
    technicalSkills:[],
    dateOfBirth:null,
    photo: null, 
  });

  const [errors, setErrors] = useState({});
  const [skillsOption, setSkillsOption] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        companyName: user.companyName,
        employeeId: user.employeeId,
        role: user.role,
        designation: user.designation,
        email: user.email,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        department: user.department,
        jobLocation: user.jobLocation,
        bloodGroup: user.bloodGroup,
        technicalSkills: user.technicalSkills? user.technicalSkills : [],
        dateOfBirth:dayjs(user.dateOfBirth),
        photo: user.photo,
      });
    }
  }, [user]);

  useEffect(() => {
    setSkillsOption([
      'JavaScript',
      'Python',
      'Java',
      'React',
      'Node.js',
      'HTML',
      'CSS',
      'Spring MVC',
      'JDBC',
      'Angular',
      'C++',
      'C#',
      'Ruby',
      'Django',
      'Flask',
      'SQL',
      'MongoDB',
      'AWS',
    ]);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "firstName" && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
      setErrors((prev) => ({ ...prev, firstName: "Only letters and space allowed" }));
    } else if (name === "lastName" && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
      setErrors((prev) => ({ ...prev, lastName: "Only letters and space allowed" }));
    } else if (name === "phoneNumber" && !/^\d{0,10}$/.test(value)) {
      setErrors((prev) => ({ ...prev, phoneNumber: "Must be 10 digits" }));
    } else if (name === "designation" && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
      setErrors((prev) => ({ ...prev, designation: "Only letters and space allowed" }));
    } else {
      setErrors((prev) => {
        const { [name]: removed, ...rest } = prev;
        return rest;
      });
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFormData((prev) => ({ ...prev, photo: e.target.files[0] }));
  };
  const handleSkillsChange = (e, value) => {
       setFormData((prev) => ({ ...prev, technicalSkills: value }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: date }));
  };  

  const validate = () => {
    let tempErrors = {};
    if (!formData.firstName) {
      tempErrors.firstName = "First name is required.";
    }

    if (!formData.lastName) 
      {tempErrors.lastName = "Last name is required.";

    }if (!/^[a-zA-Z ]+$/.test(formData.firstName)) {
      tempErrors.firstName="Name must contain only letters and spaces";
    }
    if (!formData.designation) tempErrors.designation = "Designation is required.";
    

    if (!formData.phoneNumber) {
      tempErrors.phoneNumber = "Phone number is required.";
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      tempErrors.phoneNumber = "Phone number must be 10 digits.";
    }
     setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const data = new FormData();
    data.append('firstName', formData.firstName);
    data.append('lastName', formData.lastName);
    data.append('companyName',formData.companyName);
    data.append('role',formData.role);
    data.append('designation', formData.designation);
    data.append('employeeId', formData.employeeId);
    data.append('email', formData.email);
    data.append('phoneNumber', formData.phoneNumber);
    data.append('gender', formData.gender);
    //data.append('password', formData.password);
    data.append('department',formData.department);
    data.append('jobLocation',formData.jobLocation);
    data.append('technicalSkills',formData.technicalSkills);
    data.append('dateOfBirth',formData.dateOfBirth.format("YYYY-MM-DD"));
    data.append('bloodGroup',formData.bloodGroup);
    if (formData.photo instanceof File) {
      data.append('photo', formData.photo);
    }

    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/users/${user.id}`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        }, 
      });
      onSave();
      <Alert variant="filled" severity="success">
      This is a filled success Alert.
      </Alert>
      onClose();
      console.log("User Details Updated Successfully");

    } catch (error) {
      console.error('Error updating user:', error);
    }
  };
  return (
    <Dialog open={open} onClose={onClose} >
      <DialogTitle fontWeight='bold'>Update Employee Details</DialogTitle>
      <DialogContent>
       
        <TextField 
          fullWidth
          margin="dense" 
          label="First Name" 
          name="firstName" 
          value={formData.firstName} 
          onChange={handleChange} 
          error={!!errors.firstName} 
          helperText={errors.firstName} 
        />
        <TextField
          fullWidth  
          margin="dense"
          label="Last Name" 
          name="lastName"
          value={formData.lastName} 
          onChange={handleChange} 
          error={!!errors.lastName} 
          helperText={errors.lastName} 
        />
        
        <TextField
          fullWidth
          margin="dense"
          label="Email"
          //name='email'
          value={formData.email}
          InputProps={{
            readOnly: true,
          }}
          //onChange={handleChange}
          variant="outlined"
          disabled
        />
        <TextField
          fullWidth
          margin="dense"
          //name='employeeId'
          label="Employee Id" 
          disabled
          value={formData.employeeId}
          inputProps={{
            readOnly:true,
          }}
          //onChange={handleChange}
        />
        
        <TextField
          fullWidth
          label="Company Name"
          value={formData.companyName}
          InputProps={{
            readOnly: true,
          }}
          variant="outlined"
          margin="dense"  disabled
        />
         <FormControl margin="dense"  variant="outlined" fullWidth >
              <InputLabel>Department</InputLabel>
              <Select
                sx={{width :535.2}}
                fullWidth
                name="department"
                onChange={handleChange}
                label="Department"
                value={formData.department}
              >
                <MenuItem value="Software Development">Software Development</MenuItem>
                <MenuItem value="Human Resources">Human Resources</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Testing">Testing</MenuItem>
                <MenuItem value="Accounting">Accounting</MenuItem>
              </Select> 
                
        </FormControl>
         <FormControl margin="dense"  variant="outlined" fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                sx={{width :535.2}}
                fullWidth
                name="gender"
                onChange={handleChange}
                label="Gender"
                value={formData.gender}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>

              </Select>
          </FormControl>
          <FormControl margin="dense"  variant="outlined" fullWidth>
              <InputLabel>Role</InputLabel>
              <Select
                sx={{width :535.2}}
                fullWidth
                name="role"
                onChange={handleChange}
                label="Role"
                value={formData.role}
              >
                <MenuItem value="Manager">Manager</MenuItem>
                <MenuItem value="Employee">Employee</MenuItem>
              </Select>
          </FormControl>
        {/*<TextField
          fullWidth
          label="Role"
          name="role"
          value={formData.role}
          vatiant="outlined"
          onChange={handleChange}
          margin="dense" 
        /> */}
        
        <TextField
          fullWidth 
          margin="dense" 
          label="Designation" 
          name="designation" 
          value={formData.designation} 
          onChange={handleChange} 
          error={!!errors.designation} 
          helperText={errors.designation}
        />
        <FormControl margin="dense"  variant="outlined" fullWidth>
              <InputLabel>Job Location</InputLabel>
              <Select
                sx={{width :535.2}}
                fullWidth
                name="jobLocation"
                onChange={handleChange}
                label="Job Location"
                value={formData.jobLocation}
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
               
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DemoContainer components={['DatePicker']}>
            <DatePicker label="Date of Birth"
            name="dateOfBirth" 
            sx={{width :535.2}}
            format="DD-MM-YYYY" 
            value={formData.dateOfBirth ?dayjs (formData.dateOfBirth):null}
            onChange={handleDateChange} margin='dense' fullWidth 
            maxDate={dayjs()}
            />
          </DemoContainer>
        </LocalizationProvider> 
        
        <TextField
          fullWidth 
          margin="dense" 
          label="Phone Number" 
          name="phoneNumber" 
          value={formData.phoneNumber} 
          onChange={handleChange} 
          error={!!errors.phoneNumber} 
          helperText={errors.phoneNumber} 
        />
        <TextField
          fullWidth 
          margin="dense" 
          label="Password" 
          name="password" 
          type="password"
          value={formData.password}
          InputProps={{
            readOnly: true,
          }} 
          disabled
          // onChange={handleChange} 
          // error={!!errors.password} 
          // helperText={errors.password}
          sx={{display: "none"}} 
        />
       
        <FormControl  margin="dense"  variant="outlined" fullWidth>
              <InputLabel>Blood Group</InputLabel>
              <Select
                name="bloodGroup"
                onChange={handleChange}
                label="Blood Group"
                value={formData.bloodGroup}
                sx={{width :535.2}}
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
        <Button
          variant="outlined"
          component="label"
          fullWidth
          sx={{
            display: 'flex',
            justifyContent: 'flex-start', 
            height:56,mt:1
          }}  
        >  
          <input
            type="file"
            name="photo" 
            onChange={handleFileChange} 
            
          />
          
        </Button>
        <Autocomplete
          multiple
          freeSolo
          sx={{mt:0.5,width:535.2}}
          options={skillsOption}
          value={formData?.technicalSkills}
          onChange={handleSkillsChange}
          
          renderTags={(value, getTagProps) =>
            value?.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip variant="contained" label={option} key={key} {...tagProps} />
              );
            })
          }
          renderInput={(params) => (
            <TextField {...params} label="Technical Skills" sx={{width:535.2}}margin="dense" fullWidth/>
          )}
        />    
            
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="error" variant="contained">Cancel</Button>
        <Button onClick={handleSave} color="primary" variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditEmployeeDialog;