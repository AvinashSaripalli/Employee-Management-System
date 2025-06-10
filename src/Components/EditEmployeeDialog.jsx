// import React, { useState, useEffect } from 'react';
// import { Dialog, DialogActions, DialogContent, DialogTitle,Alert, Button, TextField,  FormControl, InputLabel, Select, MenuItem, Chip, Autocomplete, Typography } from '@mui/material';
// import axios from 'axios';
// import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import dayjs from 'dayjs';

// const EditEmployeeDialog = ({ open, onClose, user, onSave }) => {
//   const [formData, setFormData] = useState({
//     firstName: '',
//     lastName: '',
//     companyName:'',
//     userId:'',
//     roleName:'',
//     designationName: '',
//     email: '',
//     phoneNumber: '',
//     genderName: '',
//     departmentName:'',
//     cityName:'',
//     bloodGroupName:'',
//     skills:[],
//     dateOfBirth:null,
//     photo: null, 
//   });

//   const [errors, setErrors] = useState({});
//   const [skillsOption, setSkillsOption] = useState([]);

//   useEffect(() => {
//     if (user) {
//       setFormData({
//         firstName: user.firstName,
//         lastName: user.lastName,
//         companyName: user.companyName,
//         userId: user.userId,
//         roleName: user.roleName,
//         designationName: user.designationName,
//         email: user.email,
//         phoneNumber: user.phoneNumber,
//         genderName: user.genderName,
//         departmentName: user.departmentName,
//         cityName: user.cityName,
//         bloodGroupName: user.bloodGroupName,
//         skills: user.skills? user.skills : [],
//         dateOfBirth:dayjs(user.dateOfBirth),
//         photo: user.photo,
//       });
//       setErrors({});
//     }
    
//   }, [user]);

//   useEffect(() => {
//     setSkillsOption([
//       'JavaScript',
//       'Python',
//       'Java',
//       'React',
//       'Node.js',
//       'HTML',
//       'CSS',
//       'Spring MVC',
//       'JDBC',
//       'Angular',
//       'C++',
//       'C#',
//       'Ruby',
//       'Django',
//       'Flask',
//       'SQL',
//       'MongoDB',
//       'AWS',
//     ]);
//   }, []);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     if (name === "firstName" && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
//       setErrors((prev) => ({ ...prev, firstName: "Only letters and space allowed" }));
//     } else if (name === "lastName" && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
//       setErrors((prev) => ({ ...prev, lastName: "Only letters and space allowed" }));
//     } else if (name === "phoneNumber" && !/^\d{0,10}$/.test(value)) {
//       setErrors((prev) => ({ ...prev, phoneNumber: "Must be 10 digits" }));
//     } else if (name === "designation" && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
//       setErrors((prev) => ({ ...prev, designation: "Only letters and space allowed" }));
//     } else {
//       setErrors((prev) => {
//         const { [name]: removed, ...rest } = prev;
//         return rest;
//       });
//     }
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e) => {
//     setFormData((prev) => ({ ...prev, photo: e.target.files[0] }));
//   };
//   const handleSkillsChange = (e, value) => {
//        setFormData((prev) => ({ ...prev, technicalSkills: value }));
//   };

//   const handleDateChange = (date) => {
//     setFormData((prev) => ({ ...prev, dateOfBirth: date }));
//   };  

//   const validate = () => {
//     let tempErrors = {};
  
//     if (!formData.firstName) {
//       tempErrors.firstName = "Please enter your first name.";
//     } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.firstName)) {
//       tempErrors.firstName = "First name should only contain letters and single spaces.";
//     }
  
//     if (!formData.lastName) {
//       tempErrors.lastName = "Please enter your last name.";
//     } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.lastName)) {
//       tempErrors.lastName = "Last name should only contain letters and single spaces.";
//     }
  
//     if (!formData.designation) {
//       tempErrors.designation = "Please enter your designation.";
//     } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.designation)) {
//       tempErrors.designation = "Designation should only contain letters and single spaces.";
//     }
  
//     if (!formData.phoneNumber) {
//       tempErrors.phoneNumber = "Please enter your phone number.";
//     } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
//       tempErrors.phoneNumber = "Phone number must be exactly 10 digits.";
//     }
  
//     if (!formData.dateOfBirth) {
//       tempErrors.dateOfBirth = "Please select your date of birth.";
//     } else {
//       const dob = new Date(formData.dateOfBirth);
//       const today = new Date();
//       const age = today.getFullYear() - dob.getFullYear() -
//         (today.getMonth() < dob.getMonth() ||
//           (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0);
  
//       if (dob > today) {
//         tempErrors.dateOfBirth = "Date of birth cannot be in the future.";
//       } else if (age < 18) {
//         tempErrors.dateOfBirth = "You must be at least 18 years old.";
//       }
//     }
  
//     setErrors(tempErrors);
//     return Object.keys(tempErrors).length === 0;
//   };  

//   const handleSave = async () => {
//     if (!validate()) return;

//     const data = new FormData();
//     data.append('firstName', formData.firstName);
//     data.append('lastName', formData.lastName);
//     data.append('companyName',formData.companyName);
//     data.append('role',formData.role);
//     data.append('designation', formData.designation);
//     data.append('employeeId', formData.employeeId);
//     data.append('email', formData.email);
//     data.append('phoneNumber', formData.phoneNumber);
//     data.append('gender', formData.gender);
//     //data.append('password', formData.password);
//     data.append('department',formData.department);
//     data.append('jobLocation',formData.jobLocation);
//     data.append('technicalSkills',formData.technicalSkills);
//     data.append('dateOfBirth',formData.dateOfBirth.format("YYYY-MM-DD"));
//     data.append('bloodGroup',formData.bloodGroupName);
//     if (formData.photo instanceof File) {
//       data.append('photo', formData.photo);
//     }

//     try {
//       const token = localStorage.getItem("token");
//       await axios.put(`http://localhost:5000/api/users/${user.id}`, data, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//           Authorization: `Bearer ${token}`,
//         }, 
//       });
//       onSave();
//       <Alert variant="filled" severity="success">
//       This is a filled success Alert.
//       </Alert>
//       onClose();
//       console.log("User Details Updated Successfully");

//     } catch (error) {
//       console.error('Error updating user:', error);
//     }
//   };

//   const handleClose = () => {
//     setErrors({}); 
//     onClose(); 
//   };
//   return (
//     <Dialog open={open} onClose={onClose} >
//       <DialogTitle fontWeight='bold'>Update Employee Details</DialogTitle>
//       <DialogContent>
       
//         <TextField 
//           fullWidth
//           margin="dense" 
//           label="First Name" 
//           name="firstName" 
//           value={formData.firstName} 
//           onChange={handleChange} 
//           error={!!errors.firstName} 
//           helperText={errors.firstName} 
//         />
//         <TextField
//           fullWidth  
//           margin="dense"
//           label="Last Name" 
//           name="lastName"
//           value={formData.lastName} 
//           onChange={handleChange} 
//           error={!!errors.lastName} 
//           helperText={errors.lastName} 
//         />
        
//         <TextField
//           fullWidth
//           margin="dense"
//           label="Email"
//           //name='email'
//           value={formData.email}
//           InputProps={{
//             readOnly: true,
//           }}
//           //onChange={handleChange}
//           variant="outlined"
//           disabled
//         />
//         <TextField
//           fullWidth
//           margin="dense"
//           //name='employeeId'
//           label="Employee Id" 
//           disabled
//           value={formData.userId}
//           inputProps={{
//             readOnly:true,
//           }}
//           //onChange={handleChange}
//         />
        
//         <TextField
//           fullWidth
//           label="Company Name"
//           value={formData.companyName}
//           InputProps={{
//             readOnly: true,
//           }}
//           variant="outlined"
//           margin="dense"  disabled
//         />
//          <FormControl margin="dense"  variant="outlined" fullWidth >
//               <InputLabel>Department</InputLabel>
//               <Select
//                 sx={{width :535.2}}
//                 fullWidth
//                 name="department"
//                 onChange={handleChange}
//                 label="Department"
//                 value={formData.departmentName}
//               >
//                 <MenuItem value="Software Development">Software Development</MenuItem>
//                 <MenuItem value="Human Resources">Human Resources</MenuItem>
//                 <MenuItem value="Design">Design</MenuItem>
//                 <MenuItem value="Testing">Testing</MenuItem>
//                 <MenuItem value="Accounting">Accounting</MenuItem>
//               </Select> 
                
//         </FormControl>
//          <FormControl margin="dense"  variant="outlined" fullWidth>
//               <InputLabel>Gender</InputLabel>
//               <Select
//                 sx={{width :535.2}}
//                 fullWidth
//                 name="gender"
//                 onChange={handleChange}
//                 label="Gender"
//                 value={formData.genderName}
//               >
//                 <MenuItem value="Male">Male</MenuItem>
//                 <MenuItem value="Female">Female</MenuItem>

//               </Select>
//           </FormControl>
//           <FormControl margin="dense"  variant="outlined" fullWidth>
//               <InputLabel>Role</InputLabel>
//               <Select
//                 sx={{width :535.2}}
//                 fullWidth
//                 name="role"
//                 onChange={handleChange}
//                 label="Role"
//                 value={formData.roleName}
//               >
//                 <MenuItem value="Manager">Manager</MenuItem>
//                 <MenuItem value="Employee">Employee</MenuItem>
//               </Select>
//           </FormControl>
//         <TextField
//           fullWidth 
//           margin="dense" 
//           label="Designation" 
//           name="designation" 
//           value={formData.designationName} 
//           onChange={handleChange} 
//           error={!!errors.designation} 
//           helperText={errors.designation}
//         />
//         <FormControl margin="dense"  variant="outlined" fullWidth>
//               <InputLabel>Job Location</InputLabel>
//               <Select
//                 sx={{width :535.2}}
//                 fullWidth
//                 name="jobLocation"
//                 onChange={handleChange}
//                 label="Job Location"
//                 value={formData.cityName}
//               >
//                 <MenuItem value="Hyderabad">Hyderabad</MenuItem>
//                 <MenuItem value="Chennai">Chennai</MenuItem>
//                 <MenuItem value="Kerala">Kerala</MenuItem>
//                 <MenuItem value="Amaravati">Amaravati</MenuItem>
//                 <MenuItem value="Delhi">Delhi</MenuItem>
//                 <MenuItem value="Mumbai">Mumbai</MenuItem>
//                 <MenuItem value="Kolkata">Kolkata</MenuItem>             
//               </Select>
              
//         </FormControl> 
               
//         <LocalizationProvider dateAdapter={AdapterDayjs}>
//           <DemoContainer components={['DatePicker']}>
//             <DatePicker label="Date of Birth"
//             name="dateOfBirth" 
//             sx={{width :535.2}}
//             format="DD-MM-YYYY" 
//             value={formData.dateOfBirth ?dayjs (formData.dateOfBirth):null}
//             onChange={handleDateChange} margin='dense' fullWidth 
//             maxDate={dayjs()}
//             slotProps={{
//               textField: {
//                 error: !!errors.dateOfBirth,
//                 helperText: errors.dateOfBirth,
//               },
//             }}
//             />
//           </DemoContainer>
//         </LocalizationProvider> 
        
//         <TextField
//           fullWidth 
//           margin="dense" 
//           label="Phone Number" 
//           name="phoneNumber" 
//           value={formData.phoneNumber} 
//           onChange={handleChange} 
//           error={!!errors.phoneNumber} 
//           helperText={errors.phoneNumber} 
//         />
//         <TextField
//           fullWidth 
//           margin="dense" 
//           label="Password" 
//           name="password" 
//           type="password"
//           value={formData.password}
//           InputProps={{
//             readOnly: true,
//           }} 
//           disabled
//           // onChange={handleChange} 
//           // error={!!errors.password} 
//           // helperText={errors.password}
//           sx={{display: "none"}} 
//         />
       
//         <FormControl  margin="dense"  variant="outlined" fullWidth>
//               <InputLabel>Blood Group</InputLabel>
//               <Select
//                 name="bloodGroup"
//                 onChange={handleChange}
//                 label="Blood Group"
//                 value={formData.bloodGroupName}
//                 sx={{width :535.2}}
//               >
//                 <MenuItem value="A +ve">A +</MenuItem>
//                 <MenuItem value="A -ve">A -</MenuItem>
//                 <MenuItem value="B +ve">B +</MenuItem>
//                 <MenuItem value="B -ve">B -</MenuItem>
//                 <MenuItem value="O +ve">O +</MenuItem>
//                 <MenuItem value="O -ve">O -</MenuItem>
//                 <MenuItem value="AB +ve">AB +</MenuItem>
//                 <MenuItem value="AB -ve">AB -</MenuItem>
//               </Select>
             
//         </FormControl>
//         <Typography>Upload Photo</Typography>
//         <Button
//           variant="outlined"
//           component="label"
//           fullWidth
//           sx={{
//             display: 'flex',
//             justifyContent: 'flex-start', 
//             height:56,mt:1
//           }}  
//         >  
//           <input
//             type="file"
//             name="photo" 
//             onChange={handleFileChange} 
            
//           />
          
//         </Button>
//         <Autocomplete
//           multiple
//           freeSolo
//           sx={{mt:0.5,width:535.2}}
//           options={skillsOption}
//           value={formData?.skills}
//           onChange={handleSkillsChange}
          
//           renderTags={(value, getTagProps) =>
//             value?.map((option, index) => {
//               const { key, ...tagProps } = getTagProps({ index });
//               return (
//                 <Chip variant="contained" label={option} key={key} {...tagProps} />
//               );
//             })
//           }
//           renderInput={(params) => (
//             <TextField {...params} label="Technical Skills" sx={{width:535.2}}margin="dense" fullWidth/>
//           )}
//         />    
            
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={handleClose} color="error" variant="contained">Cancel</Button>
//         <Button onClick={handleSave} color="primary" variant="contained">Save</Button>
//       </DialogActions>
//     </Dialog>
//   );
// };

// export default EditEmployeeDialog;

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Alert,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
  Typography,
} from '@mui/material';
import { useDropdownsQuery, useUpdateUserMutation } from '../redux/slice/apiSlice';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const EditEmployeeDialog = ({ open, onClose, user, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    companyId: '',
    userId: '',
    roleId: '',
    designationId: '',
    email: '',
    phoneNumber: '',
    genderId: '',
    departmentId: '',
    cityId: '',
    bloodGroupId: '',
    skills: [],
    dateOfBirth: null,
    photo: null,
    //password: '', // Included but hidden as per original
  });

  const [errors, setErrors] = useState({});
  const { data: dropdownData, isLoading: isDropdownLoading } = useDropdownsQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  useEffect(() => {
    if (user && dropdownData) {
      // Map names to IDs using dropdownData
      const company = dropdownData.response.company.find(c => c.companyName === user.companyName);
      const role = dropdownData.response.role.find(r => r.roleName === user.roleName);
      const designation = dropdownData.response.designation.find(d => d.designationName === user.designationName);
      const department = dropdownData.response.department.find(d => d.departmentName === user.departmentName);
      const city = dropdownData.response.city.find(c => c.cityName === user.cityName);
      const gender = dropdownData.response.gender.find(g => g.genderName === user.genderName);
      const bloodGroup = dropdownData.response.bloodGroup.find(b => b.bloodGroupName === user.bloodGroupName);
      const skillIds = user.skills
        ? user.skills.map(skillName =>
            dropdownData.response.skill.find(s => s.skillName === skillName)?.skillId
          ).filter(id => id)
        : [];

      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        companyId: company?.companyId || '',
        userId: user.userId || '',
        roleId: role?.roleId || '',
        designationId: designation?.designationId || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        genderId: gender?.genderId || '',
        departmentId: department?.departmentId || '',
        cityId: city?.cityId || '',
        bloodGroupId: bloodGroup?.bloodGroupId || '',
        skills: skillIds,
        dateOfBirth: user.dateOfBirth ? dayjs(user.dateOfBirth) : null,
        photo: user.photo || null,
        //password: '', // Password is not editable
      });
      setErrors({});
    }
  }, [user, dropdownData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'firstName' && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
      setErrors((prev) => ({ ...prev, firstName: 'Only letters and space allowed' }));
    } else if (name === 'lastName' && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
      setErrors((prev) => ({ ...prev, lastName: 'Only letters and space allowed' }));
    } else if (name === 'phoneNumber' && !/^\d{0,10}$/.test(value)) {
      setErrors((prev) => ({ ...prev, phoneNumber: 'Must be 10 digits' }));
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
    // Map skill names to skillIds
    const skillIds = value
      .map(skillName =>
        dropdownData.response.skill.find(s => s.skillName === skillName)?.skillId
      )
      .filter(id => id);
    setFormData((prev) => ({ ...prev, skills: skillIds }));
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({ ...prev, dateOfBirth: date }));
  };

  const validate = () => {
    let tempErrors = {};

    if (!formData.firstName) {
      tempErrors.firstName = 'Please enter your first name.';
    } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.firstName)) {
      tempErrors.firstName = 'First name should only contain letters and single spaces.';
    }

    if (!formData.lastName) {
      tempErrors.lastName = 'Please enter your last name.';
    } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formData.lastName)) {
      tempErrors.lastName = 'Last name should only contain letters and single spaces.';
    }

    if (!formData.phoneNumber) {
      tempErrors.phoneNumber = 'Please enter your phone number.';
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      tempErrors.phoneNumber = 'Phone number must be exactly 10 digits.';
    }

    if (!formData.dateOfBirth) {
      tempErrors.dateOfBirth = 'Please select your date of birth.';
    } else {
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      const age =
        today.getFullYear() -
        dob.getFullYear() -
        (today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
          ? 1
          : 0);

      if (dob > today) {
        tempErrors.dateOfBirth = 'Date of birth cannot be in the future.';
      } else if (age < 18) {
        tempErrors.dateOfBirth = 'You must be at least 18 years old.';
      }
    }

    if (!formData.companyId) tempErrors.companyId = 'Please select a company.';
    if (!formData.roleId) tempErrors.roleId = 'Please select a role.';
    if (!formData.designationId) tempErrors.designationId = 'Please select a designation.';
    if (!formData.departmentId) tempErrors.departmentId = 'Please select a department.';
    if (!formData.cityId) tempErrors.cityId = 'Please select a city.';
    if (!formData.genderId) tempErrors.genderId = 'Please select a gender.';
    if (!formData.bloodGroupId) tempErrors.bloodGroupId = 'Please select a blood group.';

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    const data = new FormData();
    data.append('firstName', formData.firstName);
    data.append('lastName', formData.lastName);
    data.append('companyId', formData.companyId);
    data.append('roleId', formData.roleId);
    data.append('designationId', formData.designationId);
    data.append('email', formData.email);
    data.append('phoneNumber', formData.phoneNumber);
    data.append('genderId', formData.genderId);
    data.append('departmentId', formData.departmentId);
    data.append('cityId', formData.cityId);
    data.append('bloodGroupId', formData.bloodGroupId);
    data.append('skills', JSON.stringify(formData.skills)); // Send skills as JSON array
    data.append('dateOfBirth', formData.dateOfBirth ? formData.dateOfBirth.format('YYYY-MM-DD') : '');
    if (formData.photo instanceof File) {
      data.append('photo', formData.photo);
    }
    // Password is not editable, but include it if required by backend
    //data.append('password', formData.password || 'placeholder'); // Adjust as needed

    try {
      await updateUser(data).unwrap();
      onSave();
      onClose();
      console.log('User Details Updated Successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      setErrors({ api: error?.data?.error || 'Failed to update user' });
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  if (isDropdownLoading) {
    return <Typography>Loading dropdowns...</Typography>;
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle fontWeight="bold">Update Employee Details</DialogTitle>
      <DialogContent>
        {errors.api && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errors.api}
          </Alert>
        )}
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
          value={formData.email}
          InputProps={{ readOnly: true }}
          variant="outlined"
          disabled
        />
        <TextField
          fullWidth
          margin="dense"
          label="Employee Id"
          value={formData.userId}
          InputProps={{ readOnly: true }}
          disabled
        />
        <FormControl margin="dense" variant="outlined" fullWidth>
          <InputLabel>Company</InputLabel>
          <Select
            name="companyId"
            value={formData.companyId}
            onChange={handleChange}
            label="Company"
            error={!!errors.companyId}
          >
            {dropdownData?.response.company.map((company) => (
              <MenuItem key={company.companyId} value={company.companyId}>
                {company.companyName}
              </MenuItem>
            ))}
          </Select>
          {errors.companyId && <Typography color="error">{errors.companyId}</Typography>}
        </FormControl>
        <FormControl margin="dense" variant="outlined" fullWidth>
          <InputLabel>Department</InputLabel>
          <Select
            name="departmentId"
            value={formData.departmentId}
            onChange={handleChange}
            label="Department"
            error={!!errors.departmentId}
          >
            {dropdownData?.response.department.map((dept) => (
              <MenuItem key={dept.departmentId} value={dept.departmentId}>
                {dept.departmentName}
              </MenuItem>
            ))}
          </Select>
          {errors.departmentId && <Typography color="error">{errors.departmentId}</Typography>}
        </FormControl>
        <FormControl margin="dense" variant="outlined" fullWidth>
          <InputLabel>Gender</InputLabel>
          <Select
            name="genderId"
            value={formData.genderId}
            onChange={handleChange}
            label="Gender"
            error={!!errors.genderId}
          >
            {dropdownData?.response.gender.map((gender) => (
              <MenuItem key={gender.genderId} value={gender.genderId}>
                {gender.genderName}
              </MenuItem>
            ))}
          </Select>
          {errors.genderId && <Typography color="error">{errors.genderId}</Typography>}
        </FormControl>
        <FormControl margin="dense" variant="outlined" fullWidth>
          <InputLabel>Role</InputLabel>
          <Select
            name="roleId"
            value={formData.roleId}
            onChange={handleChange}
            label="Role"
            error={!!errors.roleId}
          >
            {dropdownData?.response.role.map((role) => (
              <MenuItem key={role.roleId} value={role.roleId}>
                {role.roleName}
              </MenuItem>
            ))}
          </Select>
          {errors.roleId && <Typography color="error">{errors.roleId}</Typography>}
        </FormControl>
        <FormControl margin="dense" variant="outlined" fullWidth>
          <InputLabel>Designation</InputLabel>
          <Select
            name="designationId"
            value={formData.designationId}
            onChange={handleChange}
            label="Designation"
            error={!!errors.designationId}
          >
            {dropdownData?.response.designation.map((designation) => (
              <MenuItem key={designation.designationId} value={designation.designationId}>
                {designation.designationName}
              </MenuItem>
            ))}
          </Select>
          {errors.designationId && <Typography color="error">{errors.designationId}</Typography>}
        </FormControl>
        <FormControl margin="dense" variant="outlined" fullWidth>
          <InputLabel>Job Location</InputLabel>
          <Select
            name="cityId"
            value={formData.cityId}
            onChange={handleChange}
            label="Job Location"
            error={!!errors.cityId}
          >
            {dropdownData?.response.city.map((city) => (
              <MenuItem key={city.cityId} value={city.cityId}>
                {city.cityName}
              </MenuItem>
            ))}
          </Select>
          {errors.cityId && <Typography color="error">{errors.cityId}</Typography>}
        </FormControl>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DatePicker
            label="Date of Birth"
            format="DD-MM-YYYY"
            value={formData.dateOfBirth}
            onChange={handleDateChange}
            maxDate={dayjs()}
            slotProps={{
              textField: {
                error: !!errors.dateOfBirth,
                helperText: errors.dateOfBirth,
                fullWidth: true,
                margin: 'dense',
              },
            }}
          />
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
        <FormControl margin="dense" variant="outlined" fullWidth>
          <InputLabel>Blood Group</InputLabel>
          <Select
            name="bloodGroupId"
            value={formData.bloodGroupId}
            onChange={handleChange}
            label="Blood Group"
            error={!!errors.bloodGroupId}
          >
            {dropdownData?.response.bloodGroup.map((bg) => (
              <MenuItem key={bg.bloodGroupId} value={bg.bloodGroupId}>
                {bg.bloodGroupName}
              </MenuItem>
            ))}
          </Select>
          {errors.bloodGroupId && <Typography color="error">{errors.bloodGroupId}</Typography>}
        </FormControl>
        <Typography>Upload Photo</Typography>
        <Button
          variant="outlined"
          component="label"
          fullWidth
          sx={{
            display: 'flex',
            justifyContent: 'flex-start',
            height: 56,
            mt: 1,
          }}
        >
          <input type="file" name="photo" onChange={handleFileChange} hidden />
        </Button>
        <Autocomplete
          multiple
          freeSolo
          options={dropdownData?.response.skill.map((s) => s.skillName) || []}
          value={
            formData.skills.map(
              (skillId) => dropdownData?.response.skill.find((s) => s.skillId === skillId)?.skillName || ''
            ) || []
          }
          onChange={handleSkillsChange}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return <Chip variant="outlined" label={option} key={key} {...tagProps} />;
            })
          }
          renderInput={(params) => (
            <TextField {...params} label="Technical Skills" margin="dense" fullWidth />
          )}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="error" variant="contained">
          Cancel
        </Button>
        <Button onClick={handleSave} color="primary" variant="contained" disabled={isUpdating}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EditEmployeeDialog;