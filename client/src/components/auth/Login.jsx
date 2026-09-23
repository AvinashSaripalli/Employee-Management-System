import React, { useState } from "react";
import {
  TextField, Button, IconButton, InputAdornment, Box, Typography,
  Snackbar, Alert, Stack, Divider, CircularProgress,
} from "@mui/material";
import { FiClipboard, FiUsers, FiActivity, FiUser, FiArrowRight, FiLock, FiMail, FiEye, FiEyeOff } from "react-icons/fi";
import axios from "../../api/axios";
import { useNavigate, Link } from "react-router-dom";

function Login() {
  const [loginValues, setLoginValues] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginValues({ ...loginValues, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await axios.post("/login", loginValues);
      if (response.data.success) {
        const {
          token, role, departmentRole, photo, companyName, designation, email, firstName,
          jobLocation, lastName, phoneNumber, department, id, employeeId,
          technicalSkills, dateOfBirth, bloodGroup, gender
        } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("userRole", role);
        localStorage.setItem("departmentRole", departmentRole || 'Member');
        localStorage.setItem("userPhoto", photo);
        localStorage.setItem("companyName", companyName);
        localStorage.setItem("userDesignation", designation);
        localStorage.setItem("userJobLocation", jobLocation);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userFirstName", firstName);
        localStorage.setItem("userLastName", lastName);
        localStorage.setItem("userPhoneNumber", phoneNumber);
        localStorage.setItem("userDepartment", department);
        localStorage.setItem("userId", id);
        localStorage.setItem("userEmployeeId", employeeId);
        localStorage.setItem("userTechnicalSkills", technicalSkills);
        localStorage.setItem("userDateofBirth", dateOfBirth);
        localStorage.setItem("userBloodGroup", bloodGroup);
        localStorage.setItem("userGender", gender);

        setSnackbar({ open: true, message: "Login successful!", severity: "success" });

        setTimeout(() => {
          if (role === "Admin") {
            navigate("/sidebar");
          } else {
            navigate("/employeesidebar");
          }
        }, 900);
      } else {
        setSnackbar({ open: true, message: "Incorrect email or password.", severity: "error" });
        setSubmitting(false);
      }
    } catch (error) {
      console.error("Login Failed", error);
      setSnackbar({ open: true, message: "Login failed. Please try again.", severity: "error" });
      setSubmitting(false);
    }
  };

  const features = [
    { icon: <FiClipboard size={20} />, text: "Tasks, projects & checklists with live activity" },
    { icon: <FiUsers size={20} />, text: "Workgroups, attendance & leave management" },
    { icon: <FiActivity size={20} />, text: "Reports and dashboards in one place" },
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
          <Box sx={{ width: "100%", maxWidth: 460, display: "flex", alignItems: "flex-start" }}>
            <Box
              component="img"
              src="/KN Advisors.png"
              alt="KN Advisors Logo"
              sx={{ display: "block", width: 64, height: 64, objectFit: "contain", objectPosition: "left center" }}
            />
          </Box>
          <Typography variant="h5" fontWeight={700} sx={{ color: "#FFE2C2" }}>
            Employee Management System
          </Typography>
        </Stack>

        <Stack spacing={3} sx={{ position: "relative", maxWidth: 460 }}>
          <Typography variant="h3" fontWeight={800} sx={{ letterSpacing: "-0.03em", lineHeight: 1.15 }}>
            Manage your team, all in one place.
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.75)", fontSize: 17 }}>
            A modern workspace for tasks, people, attendance and insightful reports.
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
        <Box sx={{ width: "100%", maxWidth: 430 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography variant="h4" sx={{ mb: 1 }}>Welcome back</Typography>
            <Typography color="text.secondary">Log in to continue to your workspace</Typography>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              bgcolor: "#fff",
              borderRadius: 4,
              p: 4,
              boxShadow: "0 12px 40px rgba(17,32,77,0.10)",
              border: "1px solid #EDF0F7",
            }}
          >
            <TextField
              label="Email address"
              name="email"
              type="email"
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><FiMail size={18} color="#8A94B0" /></InputAdornment>
                ),
              }}
            />
            <TextField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              onChange={handleChange}
              fullWidth
              required
              margin="normal"
              inputProps={{ maxLength: 16 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start"><FiLock size={18} color="#8A94B0" /></InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={togglePasswordVisibility} edge="end">
                      {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={submitting}
              sx={{ mt: 3, py: 1.4, fontSize: 15, borderRadius: 2.5 }}
            >
              {submitting ? <CircularProgress size={22} color="inherit" /> : (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Log in <FiArrowRight size={18} />
                </Box>
              )}
            </Button>

            <Divider sx={{ my: 3 }}>
              <Typography variant="caption" color="text.disabled">New here?</Typography>
            </Divider>

            <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
              <FiUser size={18} color="#8A94B0" />
              <Typography>
                Don&apos;t have an account? <Link to="/register" style={{ color: "#14286D", fontWeight: 700 }}>Register</Link>
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
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

export default Login;