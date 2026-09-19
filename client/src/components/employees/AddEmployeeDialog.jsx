import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel, Select, MenuItem, Typography, Box,
  Snackbar, Alert, CircularProgress
} from "@mui/material";
import axios from "../../api/axios";
import useDepartments from "../../hooks/useDepartments";

const ensureDepartment = async (name, parentId, companyName) => {
  try {
    await axios.post("/departments", { name, parentId: parentId || null, companyName });
  } catch (e) {
    // 409 = already exists at that level — fine
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
    designation: "",
    jobLocation: "",
  });

  const [form, setForm] = useState(getInitialState(employeeId, initialDepartment));
  const [errors, setErrors] = useState({});
  const [customDept, setCustomDept] = useState("");
  const [customParent, setCustomParent] = useState("");
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const companyName = localStorage.getItem("companyName") || "";
  const { departmentOptions, refresh: refreshDepartments } = useDepartments();

  useEffect(() => {
    if (open) {
      setForm(getInitialState(employeeId, initialDepartment));
      setCustomDept("");
      setCustomParent("");
      setErrors({});
      refreshDepartments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employeeId, initialDepartment]);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(form.firstName.trim())) e.firstName = "Only letters and single spaces.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(form.lastName.trim())) e.lastName = "Only letters and single spaces.";
    if (!form.email.trim()) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Invalid email address.";
    if (!form.phoneNumber) e.phoneNumber = "Phone number is required.";
    else if (!/^\d{10}$/.test(form.phoneNumber)) e.phoneNumber = "Must be 10 digits.";
    if (!form.department) e.department = "Department is required.";
    if (form.department === "__custom__" && !customDept.trim()) e.department = "Enter a name for the new department.";
    if (!form.designation.trim()) e.designation = "Designation is required.";
    else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(form.designation.trim())) e.designation = "Only letters and single spaces.";
    if (!form.jobLocation) e.jobLocation = "Job location is required.";
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
      payload.append("phoneNumber", form.phoneNumber);
      payload.append("department", finalDept);
      payload.append("designation", form.designation.trim());
      payload.append("jobLocation", form.jobLocation);
      payload.append("companyName", companyName);
      payload.append("role", "Employee");

      const res = await axios.post("/users/registers", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 201) {
        setSnackbar({ open: true, message: "Employee added successfully!", severity: "success" });
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
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#14286D", pb: 1 }}>
          Add New Employee
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2 }}>
          {/* Read-only meta row — full width */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 0.5 }}>
            <TextField label="Employee ID" value={form.employeeId} InputProps={{ readOnly: true }} size="small" fullWidth />
            <TextField label="Company" value={companyName} InputProps={{ readOnly: true }} disabled size="small" fullWidth />
          </Box>

          {/* Basic fields — strict 2-column aligned grid */}
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mt: 1 }}>
            <TextField
              label="First Name"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              size="small"
              fullWidth
              inputProps={{ maxLength: 30 }}
              error={!!errors.firstName}
              helperText={errors.firstName}
            />
            <TextField
              label="Last Name"
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
              label="Email"
              name="email"
              value={form.email}
              onChange={handleChange}
              size="small"
              fullWidth
              inputProps={{ maxLength: 50 }}
              error={!!errors.email}
              helperText={errors.email}
            />
            <TextField
              label="Phone Number"
              name="phoneNumber"
              value={form.phoneNumber}
              onChange={handleChange}
              size="small"
              fullWidth
              inputProps={{ maxLength: 10 }}
              error={!!errors.phoneNumber}
              helperText={errors.phoneNumber}
            />

            <FormControl size="small" fullWidth error={!!errors.department}>
              <InputLabel>Department</InputLabel>
              <Select name="department" value={form.department} onChange={handleChange} label="Department">
                {renderDeptOptions(true, departmentOptions)}
              </Select>
              {errors.department && <Typography color="error" sx={{ fontSize: "0.7rem", mt: 0.5, ml: 1.5 }}>{errors.department}</Typography>}
            </FormControl>

            <TextField
              label="Designation"
              name="designation"
              value={form.designation}
              onChange={handleChange}
              size="small"
              fullWidth
              inputProps={{ maxLength: 30 }}
              error={!!errors.designation}
              helperText={errors.designation}
            />

            <FormControl size="small" fullWidth error={!!errors.jobLocation} sx={{ gridColumn: { sm: "1 / span 1" } }}>
              <InputLabel>Job Location</InputLabel>
              <Select name="jobLocation" value={form.jobLocation} onChange={handleChange} label="Job Location">
                <MenuItem value="Hyderabad">Hyderabad</MenuItem>
                <MenuItem value="Chennai">Chennai</MenuItem>
                <MenuItem value="Kerala">Kerala</MenuItem>
                <MenuItem value="Amaravati">Amaravati</MenuItem>
                <MenuItem value="Delhi">Delhi</MenuItem>
                <MenuItem value="Mumbai">Mumbai</MenuItem>
                <MenuItem value="Kolkata">Kolkata</MenuItem>
              </Select>
              {errors.jobLocation && <Typography color="error" sx={{ fontSize: "0.7rem", mt: 0.5, ml: 1.5 }}>{errors.jobLocation}</Typography>}
            </FormControl>
          </Box>

          {/* New department helper fields */}
          {showNewDeptFields && (
            <Box sx={{ mt: 2, p: 1.5, bgcolor: "#F8FAFD", border: "1px dashed #C7D2DD", borderRadius: 2, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              <TextField
                label="New Department Name"
                size="small"
                fullWidth
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                placeholder="e.g. Risk Assessment"
                autoFocus
              />
              <FormControl size="small" fullWidth>
                <InputLabel>Parent (optional)</InputLabel>
                <Select label="Parent (optional)" value={customParent} onChange={(e) => setCustomParent(e.target.value)}>
                  <MenuItem value="">
                    <em>Top-level department</em>
                  </MenuItem>
                  {renderDeptOptions(false, departmentOptions)}
                </Select>
              </FormControl>
            </Box>
          )}

          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, lineHeight: 1.5 }}>
            Only basic details are collected here. Additional details (photo, DOB, blood group, skills, etc.) can be updated later from Edit Employee.
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} variant="outlined" color="inherit" sx={{ textTransform: "none", fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            startIcon={saving && <CircularProgress size={16} color="inherit" />}
            sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#14286D", "&:hover": { bgcolor: "#0F1F57" } }}
          >
            {saving ? "Adding..." : "Add Employee"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={2600}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={snackbar.severity} variant="filled" sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddEmployeeDialog;