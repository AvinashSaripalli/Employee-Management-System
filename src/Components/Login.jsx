import { useState } from "react";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import {
  TextField, Button, IconButton, InputAdornment,
  Box, Typography, Container, Snackbar, Alert, Grid
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { keyframes } from '@emotion/react';
import { useLoginMutation } from "../redux/slice/apiSlice";

function Login() {
  const [loginValues, setLoginValues] = useState({ email: "", password: "" });
  const [login, { isLoading }] = useLoginMutation();
  const navigate = useNavigate();
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });

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

  const [showPassword, setShowPassword] = useState(false);
  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLoginValues({ ...loginValues, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await login(loginValues);
      if (response.data.statusCode == 201) {

        const role = response.data.response.roleName
        const department = null

        localStorage.setItem("userRole", role);

        setSnackbar({ open: true, message: "Login successful!", severity: "success" });

        setTimeout(() => {
          if (role === "manager") {
            navigate("/sidebar");
          } else if (department === "Human Resources") {
            navigate("/hrsidebar");
          } else if (role === "employee") {
            navigate("/employeesidebar");
          } else {
            navigate("/");
          }
        }, 1000);
      } else {
        setSnackbar({ open: true, message: "Incorrect email or password.", severity: "error" });
      }
    } catch (error) {
      console.error("Login Failed", error);
      setSnackbar({ open: true, message: "Login failed. Please try again.", severity: "error" });
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
        {/* Left Side - Welcome Message */}
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
                onChange={handleChange}
                fullWidth
                required
                margin="normal"
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
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={togglePasswordVisibility} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 4 }}
                disabled={isLoading} // Optional: disable button while loading
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