import { useState, useEffect } from "react";
import {
  TextField, Button, Box, Typography, FormControl, Container,
  MenuItem, Select, InputLabel, Tabs, Tab, Snackbar, Alert, Stepper, Step, StepLabel, Autocomplete, Chip, Grid, IconButton, InputAdornment
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { keyframes } from '@emotion/react';
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useDropdownsQuery } from '../redux/slice/apiSlice';

function Register() {
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    gender: "",
    role: "Manager",
    department: "",
    designation: "",
    jobLocation: "",
    photo: null,
    bloodGroup: "",
    dateOfBirth: "",
    technicalSkills: [],
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

  const { data, isLoading, error } = useDropdownsQuery();
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
      if (!formValues.gender) newErrors.gender = "Please select your Gender";
      if (!formValues.phoneNumber) newErrors.phoneNumber = "Please enter your Phone number";
      else if (!/^\d{10}$/.test(formValues.phoneNumber)) {
        newErrors.phoneNumber = "Phone number must be 10 digits";
      }
      if (!formValues.bloodGroup) newErrors.bloodGroup = "Please select your Blood Group";
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
      if (!formValues.companyName) newErrors.companyName = "Company Name is required";
      if (!formValues.department) newErrors.department = "Please select your Department";
      if (!formValues.jobLocation) newErrors.jobLocation = "Please select your Job Location";
      if (!formValues.designation) newErrors.designation = "Enter the First Name";
      else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formValues.designation)) {
        newErrors.designation = "Designation should only contain letters and single spaces.";
      }
      if (formValues.technicalSkills.length === 0) newErrors.technicalSkills = "Please enter your technical skills";
    }

    if (activeStep === 2) {
      if (!formValues.email) {
        newErrors.email = "Email is required";
      } else {
        const emailDomain = formValues.email.split("@")[1];
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
          newErrors.email = "Invalid email address";
        } else if (formValues.companyName === "Karncy" && emailDomain !== "karncy.com") {
          newErrors.email = "Email must end with @karncy.com";
        } else if (formValues.companyName === "Karnipuna" && emailDomain !== "karnipuna.com") {
          newErrors.email = "Email must end with @karnipuna.com";
        }
      }
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
    const { name, value } = e.target;
    if (name === "technicalSkills") {
      const skillsArray = value.split(",").map(skill => skill.trim()).filter(skill => skill);
      setFormValues((prev) => ({ ...prev, [name]: skillsArray }));
    } else {
      setFormValues((prev) => ({ ...prev, [name]: value }));
    }

    setErrors((prev) => {
      let newErrors = { ...prev };
      if (name === "firstName" && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
        newErrors.firstName = "Only letters and a single space between words allowed";
      } else if (name === "lastName" && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
        newErrors.lastName = "Only letters and a single space between words allowed";
      } else if (name === "phoneNumber" && !/^(\d{0,10})?$/.test(value)) {
        newErrors.phoneNumber = "Phone number must be 10 digits";
      } else if (name === "designation" && !/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) {
        newErrors.designation = "Only letters and a single space between words allowed";
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
      } else if (name === "technicalSkills" && value.trim() === "") {
        newErrors.technicalSkills = "Please enter your technical skills";
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  const handlePhotoChange = (e) => {
    setFormValues({ ...formValues, photo: e.target.files[0] });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setFormValues((prev) => ({
      ...prev,
      role: newValue === 0 ? "Manager" : "Employee",
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

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("firstName", formValues.firstName);
    formData.append("lastName", formValues.lastName);
    formData.append("email", formValues.email);
    formData.append("phoneNumber", formValues.phoneNumber);
    formData.append("password", formValues.password);
    formData.append("confirmPassword", formValues.confirmPassword);
    formData.append("companyName", formValues.companyName);
    formData.append("gender", formValues.gender);
    formData.append("role", formValues.role);
    formData.append("department", formValues.department);
    formData.append("designation", formValues.designation);
    formData.append("jobLocation", formValues.jobLocation);
    formData.append("photo", formValues.photo);
    formData.append("bloodGroup", formValues.bloodGroup);
    formData.append("dateOfBirth", formValues.dateOfBirth);
    formData.append("technicalSkills", formValues.technicalSkills.join(","));

    try {
      const response = await axios.post(
        "http://localhost:3000/api/users/register",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
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
              <Select name="gender" value={formValues.gender} onChange={handleChange} label="Gender">
                {/* <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem> */}
                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  dropdowns.gender?.map((group) => (
                    <MenuItem key={group.genderId} value={group.genderName}>
                      {group.genderName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.gender && <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>{errors.gender}</Typography>}
            </FormControl>
            <TextField label="Phone Number" name="phoneNumber" margin="dense" fullWidth inputProps={{ maxLength: 10 }} value={formValues.phoneNumber} onChange={handleChange} error={!!errors.phoneNumber} helperText={errors.phoneNumber} />

            <FormControl fullWidth margin="dense" error={!!errors.bloodGroup}>
              <InputLabel>Blood Group</InputLabel>
              <Select
                name="bloodGroup"
                value={formValues.bloodGroup}
                onChange={handleChange}
                label="Blood Group"
              >
                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  dropdowns.bloodGroup?.map((group) => (
                    <MenuItem key={group.bloodGroupId} value={group.bloodGroupName}>
                      {group.bloodGroupName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.bloodGroup && (
                <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>
                  {errors.bloodGroup}
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
                  color: 'grey',
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
              <Select name="companyName" value={formValues.companyName} onChange={handleChange} label="Company Name">
                {/* <MenuItem value="Karncy">Karncy</MenuItem>
                <MenuItem value="Karnipuna">Karnipuna</MenuItem> */}
                                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  dropdowns.company?.map((group) => (
                    <MenuItem key={group.companyId} value={group.companyName}>
                      {group.companyName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.companyName && <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>{errors.companyName}</Typography>}
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
              <Select name="designation" value={formValues.designation} onChange={handleChange} label="Gender">
                {/* <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem> */}
                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  dropdowns.designation?.map((group) => (
                    <MenuItem key={group.designationId} value={group.designationName}>
                      {group.designationName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.designation && <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>{errors.designation}</Typography>}
            </FormControl>
            <FormControl fullWidth margin="dense" error={!!errors.department}>
              <InputLabel>Department</InputLabel>
              <Select name="department" onChange={handleChange} label="Department" value={formValues.department}>
                {/* <MenuItem value="Software Development">Software Development</MenuItem>
                <MenuItem value="Human Resources"> Human Resources</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
                <MenuItem value="Testing">Testing</MenuItem>
                <MenuItem value="Accounting">Accounting</MenuItem> */}
                {isLoading ? (
                  <MenuItem disabled>Loading...</MenuItem>
                ) : (
                  dropdowns.department?.map((group) => (
                    <MenuItem key={group.departmentId} value={group.departmentName}>
                      {group.departmentName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.department && <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>{errors.department}</Typography>}
            </FormControl>
            <FormControl fullWidth margin="dense" error={!!errors.jobLocation}>
              <InputLabel>Job Location</InputLabel>
              <Select name="jobLocation" value={formValues.jobLocation} onChange={handleChange} label="Job Location">
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
                    <MenuItem key={group.cityId} value={group.cityName}>
                      {group.cityName}
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.jobLocation && <Typography color="error" sx={{ fontSize: '0.75rem', mt: 0.5, ml: 2 }}>{errors.jobLocation}</Typography>}
            </FormControl>
            <Autocomplete
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