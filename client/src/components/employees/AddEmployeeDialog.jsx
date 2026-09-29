import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel, Select, MenuItem, Typography, Box,
  Snackbar, Alert, CircularProgress, IconButton, Grid, Divider
} from "@mui/material";
import { HiOutlineUserPlus, HiOutlineXMark, HiOutlineBriefcase, HiOutlineUser, HiOutlineIdentification } from "react-icons/hi2";
import axios from "../../api/axios";
import useDepartments from "../../hooks/useDepartments";

const ensureDepartment = async (name, parentId, companyName) => {
  try {
    await axios.post("/departments", { name, parentId: parentId || null, companyName });
  } catch (e) {
    if (e.response?.status !== 409) throw e;
  }
};

const AddEmployeeDialog = ({ open, onClose, onSave, employeeId, initialDepartment = "" }) => {
  const getInitialState = (empId, dept) => ({
    employeeId: empId || "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    department: dept || "",
    role: "Employee",
    designation: "",
    jobLocation: "",
  });

  const [form, setForm] = useState(getInitialState(employeeId, initialDepartment));
  const [errors, setErrors] = useState({});
  const [customDept, setCustomDept] = useState("");
  const [customParent, setCustomParent] = useState("");
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const companyName = localStorage.getItem("companyName") || "KN Advisors";
  const { departmentOptions, refresh: refreshDepartments } = useDepartments();

  useEffect(() => {
    if (open) {
      setForm(getInitialState(employeeId, initialDepartment));
      setCustomDept("");
      setCustomParent("");
      setErrors({});
      refreshDepartments();
    }
  }, [open, employeeId, initialDepartment, refreshDepartments]);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) {
      e.firstName = "First name is required.";
    } else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(form.firstName.trim())) {
      e.firstName = "First name should only contain letters and single spaces.";
    }

    if (form.lastName.trim() && !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(form.lastName.trim())) {
      e.lastName = "Last name should only contain letters and single spaces.";
    }

    if (!form.email.trim()) {
      e.email = "Corporate email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      e.email = "Please enter a valid email address.";
    }

    // Optional phone validation: only check if entered
    if (form.phoneNumber.trim()) {
      if (!/^\d{10}$/.test(form.phoneNumber.trim())) {
        e.phoneNumber = "Phone number must be exactly 10 digits.";
      }
    }

    if (!form.department) {
      e.department = "Department is required.";
    }
    if (form.department === "__custom__" && !customDept.trim()) {
      e.department = "Enter a name for the new department.";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      if (value && next[name]) delete next[name];
      if (name === "firstName" || name === "lastName" || name === "designation") {
        if (value && !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value.trim())) next[name] = "Only letters and single spaces.";
        else if (value) delete next[name];
      }
      if (name === "phoneNumber") {
        if (value && !/^\d{0,10}$/.test(value)) next.phoneNumber = "10 digits only.";
        else if (/^\d{10}$/.test(value)) delete next.phoneNumber;
      }
      if (name === "email" && value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) delete next.email;
      return next;
    });
  };

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      let finalDept = form.department;
      if (finalDept === "__custom__") {
        const name = customDept.trim();
        await ensureDepartment(name, customParent || null, companyName);
        finalDept = name;
      }

      const payload = new FormData();
      payload.append("employeeId", form.employeeId);
      payload.append("firstName", form.firstName.trim());
      payload.append("lastName", form.lastName.trim());
      payload.append("email", form.email.trim());
      payload.append("phoneNumber", form.phoneNumber.trim());
      payload.append("department", finalDept);
      payload.append("designation", form.designation.trim());
      payload.append("jobLocation", form.jobLocation || "");
      payload.append("companyName", companyName);
      payload.append("role", form.role || "Employee");

      const res = await axios.post("/users/registers", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 201) {
        setSnackbar({ open: true, message: "Employee registered successfully!", severity: "success" });
        setTimeout(() => {
          onSave();
          onClose();
        }, 600);
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to add employee.";
      const details = err.response?.data?.details ? `: ${err.response.data.details}` : "";
      setSnackbar({ open: true, message: `${msg}${details}`, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setForm(getInitialState(employeeId, initialDepartment));
    setCustomDept("");
    setCustomParent("");
    setErrors({});
    onClose();
  };

  const renderDeptOptions = (includeCustom = true, options) => (
    <>
      {options.length === 0 ? (
        <MenuItem disabled value="">
          No departments yet — create one below or in Company Structure
        </MenuItem>
      ) : (
        options.map((opt) => (
          <MenuItem key={opt.id} value={opt.name} sx={{ pl: 1.5 + opt.depth * 2 }}>
            {opt.depth > 0 && <Typography component="span" sx={{ color: "#94A3B8", mr: 0.6 }}>└─</Typography>}
            {opt.name}
          </MenuItem>
        ))
      )}
      {includeCustom && (
        <MenuItem value="__custom__">
          <em>+ New Department...</em>
        </MenuItem>
      )}
    </>
  );

  const showNewDeptFields = form.department === "__custom__";

  return (
    <>
      <Dialog
        open={open}
        onClose={saving ? undefined : handleClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08)",
              bgcolor: "#FFFFFF",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            py: 2,
            px: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #F1F5F9",
            bgcolor: "#FAFCFF",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: "10px",
                bgcolor: "#EEF2FF",
                color: "#14286D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <HiOutlineUserPlus size={20} />
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 800, fontSize: "16.5px", color: "#0F172A", lineHeight: 1.2 }}>
                Add New Employee
              </Typography>
              <Typography variant="caption" sx={{ color: "#64748B", fontSize: "11.5px" }}>
                Create a corporate account and assign organizational placement
              </Typography>
            </Box>
          </Box>

          <IconButton
            onClick={handleClose}
            disabled={saving}
            size="small"
            sx={{
              color: "#64748B",
              borderRadius: "10px",
              p: 0.8,
              "&:hover": { bgcolor: "#F1F5F9", color: "#0F172A" },
            }}
          >
            <HiOutlineXMark size={20} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: { xs: 2.5, sm: 3.5 }, bgcolor: "#FFFFFF" }}>
          {/* System Locked Identifiers Banner */}
          <Box
            sx={{
              p: 2,
              mb: 3,
              borderRadius: "12px",
              bgcolor: "#F8FAFC",
              border: "1px solid #E2E8F0",
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Assigned Employee ID"
              value={form.employeeId}
              InputProps={{ readOnly: true }}
              size="small"
              fullWidth
              helperText="Auto-generated sequential identifier"
              sx={{ bgcolor: "#FFFFFF" }}
            />
            <TextField
              label="Company Tenant"
              value={companyName}
              InputProps={{ readOnly: true }}
              disabled
              size="small"
              fullWidth
              helperText="Managed organization tenant"
              sx={{ bgcolor: "#FFFFFF" }}
            />
          </Box>

          {/* Section 1: Identity & Personal Details */}
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#14286D",
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 0.8,
            }}
          >
            <HiOutlineUser size={15} />
            Personal & Identity Details
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 3 }}>
            <TextField
              label="First Name"
              name="firstName"
              required
              value={form.firstName}
              onChange={handleChange}
              size="small"
              fullWidth
              inputProps={{ maxLength: 30 }}
              error={!!errors.firstName}
              helperText={errors.firstName || "Required legal first name"}
            />
            <TextField
              label="Last Name (Optional)"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              size="small"
              fullWidth
              inputProps={{ maxLength: 30 }}
              error={!!errors.lastName}
              helperText={errors.lastName}
            />

            <TextField
              label="Corporate Email"
              name="email"
              required
              value={form.email}
              onChange={handleChange}
              size="small"
              fullWidth
              inputProps={{ maxLength: 50 }}
              error={!!errors.email}
              helperText={errors.email || "Used for system authentication & invitations"}
            />
            <TextField
              label="Phone Number (Optional)"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              size="small"
              fullWidth
              inputProps={{ maxLength: 10 }}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber || "10 digits e.g. 9876543210"}
            />
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {/* Section 2: Department & Role */}
          <Typography
            sx={{
              fontSize: "12px",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#14286D",
              mb: 1.5,
              display: "flex",
              alignItems: "center",
              gap: 0.8,
            }}
          >
            <HiOutlineBriefcase size={15} />
            Placement & System Role
          </Typography>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <FormControl size="small" fullWidth required error={!!errors.department}>
              <InputLabel>Department</InputLabel>
              <Select name="department" value={form.department} onChange={handleChange} label="Department">
                {renderDeptOptions(true, departmentOptions)}
              </Select>
              {errors.department && (
                <Typography color="error" sx={{ fontSize: "0.75rem", mt: 0.5, ml: 1.5 }}>
                  {errors.department}
                </Typography>
              )}
            </FormControl>

            <FormControl size="small" fullWidth>
              <InputLabel>System Role</InputLabel>
              <Select name="role" value={form.role} onChange={handleChange} label="System Role">
                <MenuItem value="Employee">Employee</MenuItem>
                <MenuItem value="Manager">Manager</MenuItem>
                <MenuItem value="Admin">Admin</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Designation (Optional)"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              size="small"
              fullWidth
              placeholder="e.g. Accounts Associate / Software Engineer"
            />

            <FormControl size="small" fullWidth>
              <InputLabel>Job Location (Optional)</InputLabel>
              <Select name="jobLocation" value={form.jobLocation} onChange={handleChange} label="Job Location (Optional)">
                <MenuItem value=""><em>None / Remote</em></MenuItem>
                <MenuItem value="Hyderabad">Hyderabad</MenuItem>
                <MenuItem value="Bangalore">Bangalore</MenuItem>
                <MenuItem value="Chennai">Chennai</MenuItem>
                <MenuItem value="Kerala">Kerala</MenuItem>
                <MenuItem value="Amaravati">Amaravati</MenuItem>
                <MenuItem value="Delhi">Delhi</MenuItem>
                <MenuItem value="Mumbai">Mumbai</MenuItem>
                <MenuItem value="Kolkata">Kolkata</MenuItem>
                <MenuItem value="Remote">Remote</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Inline creation of new department if selected */}
          {showNewDeptFields && (
            <Box
              sx={{
                p: 2,
                mt: 2,
                borderRadius: "12px",
                bgcolor: "#EEF2FF",
                border: "1px dashed #A5B4FC",
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
              }}
            >
              <TextField
                label="New Department Name *"
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                size="small"
                fullWidth
                sx={{ bgcolor: "#FFFFFF" }}
              />
              <FormControl size="small" fullWidth sx={{ bgcolor: "#FFFFFF" }}>
                <InputLabel>Parent Department</InputLabel>
                <Select
                  value={customParent}
                  onChange={(e) => setCustomParent(e.target.value)}
                  label="Parent Department"
                >
                  <MenuItem value=""><em>None (Top Level)</em></MenuItem>
                  {departmentOptions.map((opt) => (
                    <MenuItem key={opt.id} value={opt.id}>
                      {opt.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            py: 2,
            px: 3,
            bgcolor: "#FAFCFF",
            borderTop: "1px solid #F1F5F9",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <Button
            onClick={handleClose}
            disabled={saving}
            variant="outlined"
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "13px",
              color: "#475569",
              borderColor: "#CBD5E1",
              px: 2.5,
              "&:hover": { bgcolor: "#F1F5F9", borderColor: "#94A3B8" },
            }}
          >
            Cancel
          </Button>

          <Button
            onClick={handleSave}
            disabled={saving}
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <HiOutlineUserPlus size={16} />}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              fontSize: "13px",
              bgcolor: "#14286D",
              color: "#FFFFFF",
              px: 3,
              boxShadow: "0 4px 12px rgba(20, 40, 109, 0.25)",
              "&:hover": { bgcolor: "#0B1745" },
            }}
          >
            {saving ? "Adding Employee..." : "Create Employee Account"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} sx={{ borderRadius: "10px", fontWeight: 600 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddEmployeeDialog;