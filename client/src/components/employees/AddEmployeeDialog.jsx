import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, FormControl, InputLabel, Select, MenuItem, Typography, Box
} from "@mui/material";
import axios from "../../api/axios";
import useDepartments from "../../hooks/useDepartments";

const AddEmployeeDialog = ({ open, onClose, onSave, employeeId }) => {
  const getInitialState = (empId) => ({
    employeeId: empId || "",
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    department: "",
    designation: "",
    jobLocation: "",
  });

  const [form, setForm] = useState(getInitialState(employeeId));
  const [errors, setErrors] = useState({});
  const companyName = localStorage.getItem("companyName") || "";
  const { departmentNames, refresh: refreshDepartments } = useDepartments();

  useEffect(() => {
    if (open) {
      setForm(getInitialState(employeeId));
      setErrors({});
      refreshDepartments();
    }
  }, [open, employeeId, refreshDepartments]);

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
    if (!form.designation.trim()) e.designation = "Designation is required.";
    else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(form.designation.trim())) e.designation = "Only letters and single spaces.";
    if (!form.jobLocation) e.jobLocation = "Job location is required.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // live clear
    setErrors((prev) => {
      const next = { ...prev };
      if (value && next[name]) delete next[name];
      // special live validation for phone / names
      if (name === "firstName" || name === "lastName" || name === "designation") {
        if (value && !/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value.trim())) next[name] = "Only letters and single spaces.";
        else if (value) delete next[name];
      }
      if (name === "phoneNumber") {
        if (value && !/^\d{0,10}$/.test(value)) next.phoneNumber = "10 digits only.";
        else if (/^\d{10}$/.test(value)) delete next.phoneNumber;
      }
      if (name === "email") {
        if (value && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) delete next.email;
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!validate()) return;
    const payload = new FormData();
    payload.append("employeeId", form.employeeId);
    payload.append("firstName", form.firstName.trim());
    payload.append("lastName", form.lastName.trim());
    payload.append("email", form.email.trim());
    payload.append("phoneNumber", form.phoneNumber);
    payload.append("department", form.department);
    payload.append("designation", form.designation.trim());
    payload.append("jobLocation", form.jobLocation);
    payload.append("companyName", companyName);
    payload.append("role", "Employee");
    // server will default password/photo if not supplied — keep dialog basic

    try {
      const res = await axios.post("/users/registers", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 201) {
        alert("Employee added successfully!");
        onSave();
        onClose();
      }
    } catch (err) {
      const msg = err.response?.data?.error || "Failed to add employee.";
      const details = err.response?.data?.details ? `: ${err.response.data.details}` : "";
      alert(`${msg}${details}`);
    }
  };

  const handleClose = () => {
    setForm(getInitialState(employeeId));
    setErrors({});
    onClose();
  };

  return (
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
              {departmentNames.length === 0 ? (
                <MenuItem disabled value="">
                  No departments — create in Company Structure
                </MenuItem>
              ) : (
                departmentNames.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))
              )}
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

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2, lineHeight: 1.5 }}>
          Only basic details are collected here. Additional details (photo, DOB, blood group, skills, etc.) can be updated later from Edit Employee.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="outlined" color="inherit" sx={{ textTransform: "none", fontWeight: 600 }}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" sx={{ textTransform: "none", fontWeight: 700, bgcolor: "#14286D", "&:hover": { bgcolor: "#0F1F57" } }}>
          Add Employee
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddEmployeeDialog;
