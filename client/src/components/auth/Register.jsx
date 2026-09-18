import React, { useState } from "react";
import {
  TextField, Button, Box, Typography, Snackbar, Alert, Stack,
  IconButton, InputAdornment
} from "@mui/material";
import axios from '../../api/axios';
import { useNavigate, Link } from "react-router-dom";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { TaskSquare, People, Activity, ArrowLeft2, Lock, Sms, User } from "iconsax-react";

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

  const features = [
    { icon: <TaskSquare size="20" variant="Bold" />, text: "Tasks, projects & checklists with live activity" },
    { icon: <People size="20" variant="Bold" />, text: "Workgroups, attendance & leave management" },
    { icon: <Activity size="20" variant="Bold" />, text: "Reports and dashboards in one place" },
  ];

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "#F3F6FB" }}>
      {/* Left brand panel */}
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          width: "46%",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(150deg, #0B1844 0%, #14286D 55%, #1E3AA8 100%)",
          color: "#fff",
          p: 6,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(254,134,0,0.35) 0%, transparent 65%)",
            top: -120,
            right: -120,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 300,
            height: 300,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)",
            bottom: -60,
            left: -80,
          }}
        />

        <Stack spacing={1.5} sx={{ position: "relative" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <img src="/KN Advisors.png" alt="KN Advisors Logo" style={{ height: 42, width: "auto", objectFit: "contain" }} />
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#FFE2C2" }}>
            Employee Management System
          </Typography>
        </Stack>

        <Stack spacing={3} sx={{ position: "relative", maxWidth: 460 }}>
          <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Join your team, get started today.
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 17 }}>
            Create your account and step into a modern, connected workplace.
          </Typography>
          <Stack spacing={1.4}>
            {features.map((f, i) => (
              <Stack key={i} direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 38,
                    height: 38,
                    borderRadius: 2.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(255,255,255,0.12)",
                    backdropFilter: "blur(4px)",
                    color: "#FFAF5C",
                  }}
                >
                  {f.icon}
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: 15 }}>{f.text}</Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Typography sx={{ position: "relative", color: "rgba(255,255,255,0.5)", fontSize: 13 }}>
          © {new Date().getFullYear()} · Secure & role-based access
        </Typography>
      </Box>

      {/* Right form panel */}
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: { xs: 3, md: 5 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 470 }}>
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>Create your account</Typography>
            <Typography color="text.secondary">It only takes a minute to get started</Typography>
          </Box>

          <Box
            component="form"
            noValidate
            autoComplete="off"
            sx={{
              bgcolor: "#fff",
              borderRadius: 4,
              p: { xs: 3, md: 4 },
              boxShadow: "0 12px 40px rgba(17,32,77,0.10)",
              border: "1px solid #EDF0F7",
            }}
          >
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><User size="18" color="#8A94B0" /></InputAdornment>
                  ),
                }}
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start"><User size="18" color="#8A94B0" /></InputAdornment>
                  ),
                }}
              />
            </Stack>

            <TextField
              label="Email address"
              name="email"
              margin="dense"
              fullWidth
              value={formValues.email}
              inputProps={{ maxLength: 50 }}
              onChange={handleChange}
              error={!!errors.email}
              helperText={errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><Sms size="18" color="#8A94B0" /></InputAdornment>
                ),
              }}
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
                startAdornment: (
                  <InputAdornment position="start"><Lock size="18" color="#8A94B0" /></InputAdornment>
                ),
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
                startAdornment: (
                  <InputAdornment position="start"><Lock size="18" color="#8A94B0" /></InputAdornment>
                ),
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
              sx={{ mt: 3, py: 1.4, fontSize: 15, borderRadius: 2.5 }}
            >
              Create Account
            </Button>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mt: 3 }}>
              <ArrowLeft2 size="18" color="#8A94B0" />
              <Typography>
                Already have an account? <Link to="/login" style={{ color: "#14286D", fontWeight: 700 }}>Login</Link>
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled"
          sx={{ borderRadius: 2.5, fontWeight: 600 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Register;