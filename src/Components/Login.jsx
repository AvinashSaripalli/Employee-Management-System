import React, { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  TextField, Button, IconButton, InputAdornment,
  Box, Typography, Container, Snackbar, Alert, Grid, CircularProgress
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { keyframes } from '@emotion/react';
import { useLoginMutation } from "../redux/slice/apiSlice";

function Login() {
  const [loginValues, setLoginValues] = useState({ email: "", password: "" });
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  const [showPassword, setShowPassword] = useState(false);

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

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginValues({ ...loginValues, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(loginValues).unwrap();
      const { message, roleName } = response.response; 

      if (message === "Login Sucessful") { 
        setSnackbar({ open: true, message: "Login successful!", severity: "success" });
        setTimeout(() => {
          if (roleName.toLowerCase() === "manager") {
            navigate("/sidebar");
          } else if (roleName.toLowerCase() === "human resources") {
            navigate("/hrsidebar");
          } else if (roleName.toLowerCase() === "employee") {
            navigate("/employeesidebar");
          } else {
            navigate("/"); 
          }
        }, 100);
      } else {
        setSnackbar({ open: true, message: "Unexpected response from server.", severity: "error" });
      }
    } catch (error) {
      console.error("Login Failed:", error);
      const errorMsg = error?.data?.errorMsg || 
                       (error?.status === 401 ? "Invalid email or password" : "Login failed. Please try again.");
      setSnackbar({ open: true, message: errorMsg, severity: "error" });
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
        <Grid item xs={12} md={5} sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: 'white',
          p: 5,
        }}>
          <Box>
            <Typography variant="h3" fontWeight="bold" gutterBottom>
              Welcome Back!
            </Typography>
            <Typography variant="h6">
              Login to access your dashboard and continue managing your tasks.
            </Typography>
          </Box>
        </Grid>

        <Grid item xs={12} md={7} sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
        }}>
          <Box sx={{
            maxWidth: 500,
            width: "100%",
            p: 3,
            borderRadius: 2,
            boxShadow: 3,
            backgroundColor: "white"
          }}>
            <Typography variant="h5" sx={{ textAlign: "center", fontWeight: "bold" }}>
              Login
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                label="Email"
                name="email"
                value={loginValues.email}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                disabled={isLoading}
              />
              <TextField
                label="Password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={loginValues.password}
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
                inputProps={{ maxLength: 16 }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end" disabled={isLoading}>
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                disabled={isLoading}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 4 }}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>

              <Typography sx={{ textAlign: "center", mt: 2 }}>
                Don't have an account? <a href="/register">Register</a>
              </Typography>
            </form>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{
            width: "100%",
            bgcolor:
              snackbar.severity === "success" ? "#4caf50"
                : snackbar.severity === "error" ? "#f44336"
                  : snackbar.severity === "warning" ? "#ff9800"
                    : "#2196f3",
            color: "white",
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Login;