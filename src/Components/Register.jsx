import { useState, useEffect } from "react";
import {
  TextField, Button, Box, Typography, FormControl, Container,
  MenuItem, Select, InputLabel, Tabs, Tab, Snackbar, Alert, Stepper, Step, StepLabel, Autocomplete, Chip, Grid, IconButton, InputAdornment
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { keyframes } from '@emotion/react';
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useDropdownsQuery, useRegisterUserMutation } from '../redux/slice/apiSlice';

function Register() {
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    companyId: "",
    genderId: "",
    roleId: "ROL1000002",
    departmentId: "",
    designationId: "",
    cityId: "",
    photo: null,
    bloodGroupId: "",
    dateOfBirth: "",
    skills: [],
  });



  const [errors, setErrors] = useState({});
  const [tabValue, setTabValue] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const steps = ['Personal Info', 'Professional Info', 'Account Info'];

  const gradientAnimation = keyframes`
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

  const { data, isLoading } = useDropdownsQuery();
  const dropdowns = data?.response || {};

  useEffect(() => {
  }, []);

  const validateStep = () => {
    const newErrors = {};

    if (activeStep === 0) {
      if (!formValues.firstName) newErrors.firstName = "Enter the First Name";
      else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formValues.firstName)) {
        newErrors.firstName = "First name should only contain letters and single spaces.";
      }
      if (!formValues.lastName) newErrors.lastName = "Enter the Last Name";
      else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formValues.lastName)) {
        newErrors.lastName = "Last name should only contain letters and single spaces.";
      }
      if (!formValues.genderId) newErrors.genderId = "Please select your Gender";
      if (!formValues.phoneNumber) newErrors.phoneNumber = "Please enter your Phone number";
      else if (!/^\d{10}$/.test(formValues.phoneNumber)) {
        newErrors.phoneNumber = "Phone number must be 10 digits";
      }
      if (!formValues.bloodGroupId) newErrors.bloodGroupId = "Please select your Blood Group";
      if (!formValues.dateOfBirth) newErrors.dateOfBirth = "Please enter your Date of Birth";
      else {
        const dob = new Date(formValues.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear() -
          (today.getMonth() < dob.getMonth() ||
            (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0);
        if (dob > today) {
          newErrors.dateOfBirth = "Date of Birth cannot be in the future";
        } else if (age < 18) {
          newErrors.dateOfBirth = "You must be at least 18 years old";
        }
      }
    }

    if (activeStep === 1) {
      if (!formValues.companyId) newErrors.companyId = "Company Name is required";
      if (!formValues.departmentId) newErrors.departmentId = "Please select your Department";
      if (!formValues.cityId) newErrors.cityId = "Please select your Job Location";
      if (!formValues.designationId) newErrors.designationId = "Enter the Designation Name";
      if (formValues.skills.length === 0) newErrors.skills = "Please enter your technical skills";
    }

    if (activeStep === 2) {
      if (!formValues.email) {
        newErrors.email = "Email is required";
      }
      //  else {
      //   const emailDomain = formValues.email.split("@")[1];
      //   if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      //     newErrors.email = "Invalid email address";
      //   } else if (formValues.companyName === "Karncy" && emailDomain !== "karncy.com") {
      //     newErrors.email = "Email must end with @karncy.com";
      //   } else if (formValues.companyName === "Karnipuna" && emailDomain !== "karnipuna.com") {
      //     newErrors.email = "Email must end with @karnipuna.com";
      //   }
      // }
      if (!formValues.password) newErrors.password = "Password is required";
      else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/.test(formValues.password)) {
        newErrors.password = "Password must be 8-16 characters, include at least one letter, one number, and one special character";
      }
      if (!formValues.confirmPassword) newErrors.confirmPassword = "Confirm Password is required";
      else if (formValues.confirmPassword !== formValues.password) {
        newErrors.confirmPassword = "Passwords do not match";
      }
      if (!formValues.photo) newErrors.photo = "Please upload an image";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    // const { name, value } = e.target;
    // if (name === "technicalSkills") {
    //   const skillsArray = value.split(",").map(skill => skill.trim()).filter(skill => skill);
    //   setFormValues((prev) => ({ ...prev, [name]: skillsArray }));
    // } else {
    //   setFormValues((prev) => ({ ...prev, [name]: value }));
    // }
    const { name, value } = e.target;
    if (name === "skills") return; // Skip since Autocomplete handles this
    setFormValues((prev) => ({ ...prev, [name]: value }));

    setErrors((prev) => {
      let newErrors = { ...prev };
      if (name === "firstName" && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
        newErrors.firstName = "Only letters and a single space between words allowed";
      } else if (name === "lastName" && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
        newErrors.lastName = "Only letters and a single space between words allowed";
      } else if (name === "phoneNumber" && !/^(\d{0,10})?$/.test(value)) {
        newErrors.phoneNumber = "Phone number must be 10 digits";
      } else if (name === "password") {
        newErrors.password = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/.test(value)
          ? "" : "Password must be 8-16 characters, include at least one letter, one number, and one special character";
        newErrors.confirmPassword = formValues.confirmPassword === value ? "" : "Passwords do not match";
      } else if (name === "confirmPassword") {
        newErrors.confirmPassword = value === formValues.password ? "" : "Passwords do not match";
      } else if (name === "dateOfBirth") {
        const dob = new Date(value);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear() -
          (today.getMonth() < dob.getMonth() ||
            (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate()) ? 1 : 0);
        if (dob > today) {
          newErrors.dateOfBirth = "Date of Birth cannot be in the future";
        } else if (age < 18) {
          newErrors.dateOfBirth = "You must be at least 18 years old";
        } else {
          delete newErrors.dateOfBirth;
        }
      } else if (name === "skills" && value.trim() === "") {
        newErrors.skills = "Please enter your technical skills";
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  const handlePhotoChange = (e) => {
    setFormValues({ ...formValues, photo: e.target.files[0] });
  };

  // const handleTabChange = (event, newValue) => {
  //   setTabValue(newValue);
  //   setFormValues((prev) => ({
  //     ...prev,
  //     role: newValue === 0 ? "Manager" : "Employee",
  //   }));
  // };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFormValues((prev) => ({
      ...prev,
      roleId: newValue === 0 ? "ROL1000002" : "ROL1000003", // Manager: ROL1000002, Employee: ROL1000003
    }));
  };

  const handleShowPassword = () => {
    setShowPassword((prev) => !prev);
  };

  const handleShowConfirmPassword = () => {
    setShowConfirmPassword((prev) => !prev);
  };

  const handleNext = () => {
    if (validateStep()) {
      if (activeStep < steps.length - 1) {
        setActiveStep((prev) => prev + 1);
      } else {
        handleSubmit();
      }
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const [registerUser, { isLoading: isRegistering, error: registerError }] = useRegisterUserMutation();
  const handleSubmit = async () => {
    const payload = {
      firstName: formValues.firstName,
      lastName: formValues.lastName,
      email: formValues.email,
      phoneNumber: formValues.phoneNumber,
      password: formValues.password,
      companyId: formValues.companyId,
      genderId: formValues.genderId,
      roleId: formValues.roleId,
      departmentId: formValues.departmentId,
      designationId: formValues.designationId,
      cityId: formValues.cityId,
      bloodGroupId: formValues.bloodGroupId,
      dateOfBirth: formValues.dateOfBirth,
      skills: formValues.skills
    };
    try {
      await registerUser(payload);
      setSnackbar({ open: true, message: "Registered successfully!", severity: "success" });
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      setSnackbar({
        open: true,
        message: error.response?.data?.error || "Registration failed!",
        severity: "error"
      });
    }
  };

  const renderStepContent = (step) => {
    const today = new Date().toISOString().split("T")[0];
    switch (step) {
      case 0:
        return (
          <>
            <TextField label="First Name" name="firstName" margin="dense" fullWidth value={formValues.firstName} inputProps={{ maxLength: 30 }} onChange={handleChange} error={!!errors.firstName} helperText={errors.firstName} />
            <TextField label="Last Name" name="lastName" margin="dense" fullWidth value={formValues.lastName} inputProps={{ maxLength: 30 }} onChange={handleChange} error={!!errors.lastName} helperText={errors.lastName} />
            <FormControl fullWidth margin="dense" error={!!errors.gender}>
              <InputLabel>Gender</InputLabel>
              <Select name="genderId" value={formValues.genderId} onChange={handleChange} label="Gender">
                {/* <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem> */}
                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  dropdowns.gender?.map((group) => (
                    <MenuItem key={group.genderId} value={group.genderId}>
                      {group.genderName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.genderId && <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>{errors.genderId}</Typography>}
            </FormControl>
            <TextField label="Phone Number" name="phoneNumber" margin="dense" fullWidth inputProps={{ maxLength: 10 }} value={formValues.phoneNumber} onChange={handleChange} error={!!errors.phoneNumber} helperText={errors.phoneNumber} />

            <FormControl fullWidth margin="dense" error={!!errors.bloodGroupId}>
              <InputLabel>Blood Group</InputLabel>
              <Select
                name="bloodGroupId"
                value={formValues.bloodGroupId}
                onChange={handleChange}
                label="Blood Group"
              >
                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  dropdowns.bloodGroup?.map((group) => (
                    <MenuItem key={group.bloodGroupId} value={group.bloodGroupId}>
                      {group.bloodGroupName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.bloodGroupId && (
                <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>
                  {errors.bloodGroupId}
                </Typography>
              )}
            </FormControl>

            <TextField
              label="Date of Birth"
              name="dateOfBirth"
              type="date"
              margin="dense"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={formValues.dateOfBirth}
              inputProps={{ max: today }}
              onChange={handleChange}
              error={!!errors.dateOfBirth}
              helperText={errors.dateOfBirth}
              sx={{
                '& input': {
                  color: 'black',
                }
              }}
            />
          </>
        );
      case 1:
        return (
          <>
            <FormControl fullWidth margin="dense" error={!!errors.companyName}>
              <InputLabel>Company Name</InputLabel>
              <Select name="companyId" value={formValues.companyId} onChange={handleChange} label="Company Name">
                {/* <MenuItem value="Karncy">Karncy</MenuItem>
                <MenuItem value="Karnipuna">Karnipuna</MenuItem> */}
                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  dropdowns.company?.map((group) => (
                    <MenuItem key={group.companyId} value={group.companyId}>
                      {group.companyName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.companyId && <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>{errors.companyId}</Typography>}
            </FormControl>
            {/* <TextField
              label="Designation"
              name="designation"
              margin="dense" fullWidth
              value={formValues.designation}
              inputProps={{ maxLength: 50 }}
              onChange={handleChange}
              error={!!errors.designation}
              helperText={errors.designation}
              sx={{ width: '500px' }}
            /> */}
            <FormControl fullWidth margin="dense" error={!!errors.designation}>
              <InputLabel>designation</InputLabel>
              <Select name="designationId" value={formValues.designationId} onChange={handleChange} label="Gender">
                {/* <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem> */}
                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  dropdowns.designation?.map((group) => (
                    <MenuItem key={group.designationId} value={group.designationId}>
                      {group.designationName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.designationId && <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>{errors.designationId}</Typography>}
            </FormControl>
            <FormControl fullWidth margin="dense" error={!!errors.department}>
              <InputLabel>Department</InputLabel>
              <Select name="departmentId" onChange={handleChange} label="Department" value={formValues.departmentId}>
                {/* <MenuItem value="Software Development">Software Development</MenuItem>
                <MenuItem value="Human Resources"> Human Resources</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Testing">Testing</MenuItem>
                <MenuItem value="Accounting">Accounting</MenuItem> */}
                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  dropdowns.department?.map((group) => (
                    <MenuItem key={group.departmentId} value={group.departmentId}>
                      {group.departmentName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.departmentId && <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>{errors.departmentId}</Typography>}
            </FormControl>
            <FormControl fullWidth margin="dense" error={!!errors.jobLocation}>
              <InputLabel>Job Location</InputLabel>
              <Select name="cityId" value={formValues.cityId} onChange={handleChange} label="Job Location">
                {/* <MenuItem value="Hyderabad">Hyderabad</MenuItem>
                <MenuItem value="Chennai">Chennai</MenuItem>
                <MenuItem value="Kerala">Kerala</MenuItem>
                <MenuItem value="Amaravati">Amaravati</MenuItem>
                <MenuItem value="Delhi">Delhi</MenuItem>
                <MenuItem value="Mumbai">Mumbai</MenuItem>
                <MenuItem value="Kolkata">Kolkata</MenuItem> */}
                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  dropdowns.city?.map((group) => (
                    <MenuItem key={group.cityId} value={group.cityId}>
                      {group.cityName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.cityId && <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>{errors.cityId}</Typography>}
            </FormControl>
            {/* <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={formValues.technicalSkills}
              onChange={(event, newValue) => {
                setFormValues((prev) => ({ ...prev, technicalSkills: newValue }));
                if (newValue.length > 0) {
                  setErrors((prev) => ({ ...prev, technicalSkills: "" }));
                }
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Technical Skills"
                  margin="dense"
                  fullWidth
                  error={!!errors.technicalSkills}
                  helperText={errors.technicalSkills || "Type a skill and press Enter"}
                />
              )}
            /> */}
            <Autocomplete
              multiple
              options={dropdowns.skill || []}
              getOptionLabel={(option) => option.skillName}
              value={dropdowns.skill?.filter((skill) => formValues.skills.includes(skill.skillId)) || []}
              onChange={(event, newValue) => {
                const selectedSkillIds = newValue.map((skill) => skill.skillId);
                setFormValues((prev) => ({ ...prev, skills: selectedSkillIds }));
                if (selectedSkillIds.length > 0) {
                  setErrors((prev) => ({ ...prev, skills: "" }));
                }
              }}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option.skillName} {...getTagProps({ index })} />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Technical Skills"
                  margin="dense"
                  fullWidth
                  error={!!errors.skills}
                  helperText={errors.skills || "Select one or more skills"}
                />
              )}
            />
          </>
        );
      case 2:
        return (
          <>
            <TextField
              label="Email"
              name="email"
              margin="dense" fullWidth
              value={formValues.email}
              inputProps={{ maxLength: 50 }}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              margin="dense" fullWidth
              value={formValues.password}
              inputProps={{ maxLength: 10 }}
              onChange={handleChange}
              error={!!errors.password}
              helperText={errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              margin="dense" fullWidth
              value={formValues.confirmPassword}
              inputProps={{ maxLength: 10 }}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleShowConfirmPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Typography>Upload Photo</Typography>
            <Button variant="outlined" component="label" sx={{ mt: 1, height: 56, width: '100%' }}>
              <input type="file" name="photo" onChange={handlePhotoChange} />
            </Button>
            {errors.photo && <div style={{ color: "#d32f2f", fontSize: '0.8rem', mt: 0.5, marginLeft: '25px' }}>{errors.photo}</div>}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="100%" disableGutters sx={{
      minHeight: "100vh",
      background: "radial-gradient(circle, rgba(63,94,251,1) 0%, rgba(252,70,107,1) 100%)",
      backgroundSize: "200% 200%",
      animation: `${gradientAnimation} 6s ease infinite`,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    }}>
      <Grid container sx={{ minHeight: "100vh", maxWidth: "1000px", }}>

        <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', p: 5 }}>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Welcome!
            </Typography>
            <Typography variant="h6">
              Join our platform and explore all the features by registering as a Manager or Employee.
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={7} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <Box maxWidth="500px" sx={{ p: 3, borderRadius: 2, boxShadow: 3, background: "white", width: "100%" }}>
            <Typography variant="h5" sx={{ textAlign: "center", fontWeight: "bold" }}>
              Register
            </Typography>

            <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
              <Tab label="Manager" />
              <Tab label="Employee" />
            </Tabs>

            <Stepper activeStep={activeStep} sx={{ mb: 2 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Box component="form" noValidate autoComplete="off">
              {renderStepContent(activeStep)}

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: activeStep === 0 ? 'flex-end' : 'space-between',
                  mt: 2,
                }}
              >
                {activeStep !== 0 && (
                  <Button
                    onClick={handleBack}
                    variant="contained"
                  >
                    Back
                  </Button>
                )}
                <Button
                  onClick={handleNext}
                  variant="contained"
                  color="primary"
                >
                  {activeStep === steps.length - 1 ? 'Register' : 'Next'}
                </Button>
              </Box>

              <Typography sx={{ textAlign: "center", mt: 2 }}>
                Already have an account? <a href="/login">Login</a>
              </Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>

  );
}

export default Register; 