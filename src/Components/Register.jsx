import React, { useState } from "react";
import {
  TextField, Button, Box, Typography, Container,
  Snackbar, Alert, Grid, IconButton, InputAdornment
} from "@mui/material";
import axios from '../api/axios';
import { useNavigate, Link } from "react-router-dom";
import { keyframes } from '@emotion/react';
import { Visibility, VisibilityOff } from "@mui/icons-material";

function Register() {
  const [formValues, setFormValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const validate = () => {
    const newErrors = {};

    if (!formValues.firstName) newErrors.firstName = "Enter the First Name";
    else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formValues.firstName)) {
      newErrors.firstName = "First name should only contain letters and single spaces.";
    }

    if (!formValues.lastName) newErrors.lastName = "Enter the Last Name";
    else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(formValues.lastName)) {
      newErrors.lastName = "Last name should only contain letters and single spaces.";
    }

    if (!formValues.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formValues.password) newErrors.password = "Password is required";
    else if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/.test(formValues.password)) {
      newErrors.password = "Password must be 8-16 characters, include at least one letter, one number, and one special character";
    }

    if (!formValues.confirmPassword) newErrors.confirmPassword = "Confirm Password is required";
    else if (formValues.confirmPassword !== formValues.password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    setErrors((prev) => {
      let newErrors = { ...prev };
      if (name === "firstName") {
        if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)) {
          newErrors.firstName = "Only letters and a single space between words allowed";
        } else {
          delete newErrors.firstName;
        }
      } else if (name === "lastName") {
        if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)) {
          newErrors.lastName = "Only letters and a single space between words allowed";
        } else {
          delete newErrors.lastName;
        }
      } else if (name === "email") {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Invalid email address";
        } else {
          delete newErrors.email;
        }
      } else if (name === "password") {
        if (!/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,16}$/.test(value)) {
          newErrors.password = "Password must be 8-16 characters, include at least one letter, one number, and one special character";
        } else {
          newErrors.password = "";
        }
        if (formValues.confirmPassword && formValues.confirmPassword !== value) {
          newErrors.confirmPassword = "Passwords do not match";
        } else if (formValues.confirmPassword === value) {
          newErrors.confirmPassword = "";
        }
      } else if (name === "confirmPassword") {
        if (value !== formValues.password) {
          newErrors.confirmPassword = "Passwords do not match";
        } else {
          newErrors.confirmPassword = "";
        }
      }
      return newErrors;
    });
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await axios.post("/users/register", {
        firstName: formValues.firstName,
        lastName: formValues.lastName,
        email: formValues.email,
        password: formValues.password,
        confirmPassword: formValues.confirmPassword,
      });
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
      <Grid container sx={{ minHeight: "100vh", maxWidth: "1000px" }}>

        <Grid item xs={12} md={5} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', color: 'white', p: 5 }}>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Welcome!
            </Typography>
            <Typography variant="h6">
              Join our platform and get started with your account.
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={7} sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <Box maxWidth="500px" sx={{ p: 3, borderRadius: 2, boxShadow: 3, background: "white", width: "100%" }}>
            <Typography variant="h5" sx={{ textAlign: "center", fontWeight: "bold", mb: 2 }}>
              Register
            </Typography>

            <Box component="form" noValidate autoComplete="off">
              <TextField
                label="First Name"
                name="firstName"
                margin="dense"
                fullWidth
                value={formValues.firstName}
                inputProps={{ maxLength: 30 }}
                onChange={handleChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
              />
              <TextField
                label="Last Name"
                name="lastName"
                margin="dense"
                fullWidth
                value={formValues.lastName}
                inputProps={{ maxLength: 30 }}
                onChange={handleChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
              />
              <TextField
                label="Email"
                name="email"
                margin="dense"
                fullWidth
                value={formValues.email}
                inputProps={{ maxLength: 50 }}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
              />
              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                margin="dense"
                fullWidth
                value={formValues.password}
                inputProps={{ maxLength: 16 }}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword((prev) => !prev)}
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
                margin="dense"
                fullWidth
                value={formValues.confirmPassword}
                inputProps={{ maxLength: 16 }}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle confirm password visibility"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        edge="end"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                onClick={handleSubmit}
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                Register
              </Button>

              <Typography sx={{ textAlign: "center", mt: 2 }}>
                Already have an account? <Link to="/login">Login</Link>
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
