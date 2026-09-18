import React, { useEffect, useState } from "react";
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, FormControl,
  InputLabel, Select, MenuItem, Typography, Box, Autocomplete, Chip, CircularProgress, Alert
} from "@mui/material";
import axios from "../../api/axios";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

const AddEmployeeDialog = ({ open, onClose, onSave, employeeId }) => {
  const [emailSearch, setEmailSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [foundUser, setFoundUser] = useState(null);

  const getInitialAssignState = (empId) => ({
    employeeId: empId || "",
    department: "",
    designation: "",
    jobLocation: "",
    phoneNumber: "",
    bloodGroup: "",
    gender: "",
    dateOfBirth: null,
    technicalSkills: [],
    photo: null,
  });

  const [assign, setAssign] = useState(getInitialAssignState(employeeId));
  const [errors, setErrors] = useState({});
  const skillsOption = [
    "JavaScript", "Python", "Java", "React", "Node.js", "HTML", "CSS",
    "Spring MVC", "JDBC", "Angular", "C++", "C#", "Ruby", "Django",
    "Flask", "SQL", "MongoDB", "AWS",
  ];

  useEffect(() => {
    if (open) {
      setEmailSearch("");
      setSearchError("");
      setFoundUser(null);
      setErrors({});
      setAssign(getInitialAssignState(employeeId));
    }
  }, [open, employeeId]);

  const handleEmailSearch = async () => {
    if (!emailSearch.trim()) {
      setSearchError("Please enter an email address.");
      return;
    }
    setSearchLoading(true);
    setSearchError("");
    setFoundUser(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/users/by-email", {
        params: { email: emailSearch.trim() },
        headers: { Authorization: `Bearer ${token}` },
      });
      const user = response.data;
      if (user.companyName) {
        setSearchError(`This employee is already assigned to "${user.companyName}".`);
      } else {
        setFoundUser(user);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        setSearchError("No registered user found with this email. Ask them to register first.");
      } else {
        setSearchError(error.response?.data?.error || "Search failed. Please try again.");
      }
    } finally {
      setSearchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setAssign((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setAssign((prev) => ({ ...prev, [name]: value }));
    }
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (name === "phoneNumber") {
        if (!value) newErrors.phoneNumber = "Phone number is required.";
        else if (!/^\d{0,10}$/.test(value)) newErrors.phoneNumber = "Must be 10 digits.";
        else delete newErrors.phoneNumber;
      } else if (name === "designation") {
        if (!value) newErrors.designation = "Designation is required.";
        else if (!/^[a-zA-Z]+( [a-zA-Z]+)*$/.test(value)) newErrors.designation = "Only letters and spaces.";
        else delete newErrors.designation;
      } else {
        delete newErrors[name];
      }
      return newErrors;
    });
  };

  const handleSkillsChange = (e, value) =>
    setAssign((prev) => ({ ...prev, technicalSkills: value }));

  const handleDateChange = (date) => {
    const formattedDate = date ? dayjs(date).format("YYYY-MM-DD") : null;
    setAssign((prev) => ({ ...prev, dateOfBirth: formattedDate }));
    setErrors((prev) => {
      const newErrors = { ...prev };
      if (!formattedDate) {
        newErrors.dateOfBirth = "Date of birth is required.";
      } else {
        const dob = new Date(formattedDate);
        const today = new Date();
        const age =
          today.getFullYear() -
          dob.getFullYear() -
          (today.getMonth() < dob.getMonth() ||
          (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
            ? 1
            : 0);
        if (dob > today) newErrors.dateOfBirth = "Date of birth cannot be in the future.";
        else if (age < 18) newErrors.dateOfBirth = "Employee must be at least 18 years old.";
        else delete newErrors.dateOfBirth;
      }
      return newErrors;
    });
  };

  const validate = () => {
    const newErrors = {};
    if (!assign.department) newErrors.department = "Department is required.";
    if (!assign.designation) newErrors.designation = "Designation is required.";
    else if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(assign.designation.trim()))
      newErrors.designation = "Designation can only contain letters and single spaces.";
    if (!assign.jobLocation) newErrors.jobLocation = "Job location is required.";
    if (!assign.phoneNumber) newErrors.phoneNumber = "Phone number is required.";
    else if (!/^\d{10}$/.test(assign.phoneNumber))
      newErrors.phoneNumber = "Phone number must be 10 digits.";
    if (!assign.bloodGroup) newErrors.bloodGroup = "Blood group is required.";
    if (!assign.gender) newErrors.gender = "Gender is required.";
    if (!assign.dateOfBirth) {
      newErrors.dateOfBirth = "Date of birth is required.";
    } else {
      const dob = new Date(assign.dateOfBirth);
      const today = new Date();
      const age =
        today.getFullYear() -
        dob.getFullYear() -
        (today.getMonth() < dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())
          ? 1
          : 0);
      if (dob > today) newErrors.dateOfBirth = "Date of birth cannot be in the future.";
      else if (age < 18) newErrors.dateOfBirth = "Employee must be at least 18 years old.";
    }
    if (!assign.photo) newErrors.photo = "Photo is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!foundUser || !validate()) return;
    const companyName = localStorage.getItem("companyName");
    const formData = new FormData();
    formData.append("employeeId", assign.employeeId);
    formData.append("firstName", foundUser.firstName);
    formData.append("lastName", foundUser.lastName);
    formData.append("email", foundUser.email);
    formData.append("companyName", companyName);
    formData.append("department", assign.department);
    formData.append("role", "Employee");
    formData.append("designation", assign.designation);
    formData.append("jobLocation", assign.jobLocation);
    formData.append("phoneNumber", assign.phoneNumber);
    formData.append("technicalSkills", assign.technicalSkills.join(","));
    formData.append("dateOfBirth", assign.dateOfBirth);
    formData.append("bloodGroup", assign.bloodGroup);
    formData.append("gender", assign.gender);
    formData.append("photo", assign.photo);
    try {
      const token = localStorage.getItem("token");
      await axios.put(`/users/${foundUser.id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      alert("Employee assigned to company successfully!");
      onSave();
      onClose();
    } catch (error) {
      alert(error.response?.data?.error || "Failed to assign employee. Please try again.");
    }
  };

  const handleClose = () => {
    setEmailSearch("");
    setSearchError("");
    setFoundUser(null);
    setErrors({});
    setAssign(getInitialAssignState(employeeId));
    onClose();
  };

  const companyName = localStorage.getItem("companyName") || "";

  return (
    <Dialog open={open} onClose={handleClose} PaperProps={{ style: { width: "80%", maxWidth: "700px" } }}>
      <DialogTitle fontWeight="bold">Add Employee to Company</DialogTitle>
      <DialogContent>
        {/* Step 1 */}
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, mt: 1 }}>
          Step 1 — Find Registered Employee
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Enter the employee email. They must have already created an account via the Register page.
        </Typography>
        <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
          <TextField
            label="Employee Email"
            value={emailSearch}
            onChange={(e) => {
              setEmailSearch(e.target.value);
              setSearchError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && handleEmailSearch()}
            fullWidth
            margin="dense"
            inputProps={{ maxLength: 100 }}
          />
          <Button
            variant="contained"
            onClick={handleEmailSearch}
            disabled={searchLoading}
            sx={{ mt: 1, minWidth: 100, height: 56 }}
          >
            {searchLoading ? <CircularProgress size={22} color="inherit" /> : "Search"}
          </Button>
        </Box>

        {searchError && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {searchError}
          </Alert>
        )}
        {foundUser && (
          <Alert severity="success" sx={{ mt: 1 }}>
            Found: <strong>{foundUser.firstName} {foundUser.lastName}</strong> ({foundUser.email})
          </Alert>
        )}

        {/* Step 2 — shown only after a user is found */}
        {foundUser && (
          <>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
              Step 2 — Assign Work Details
            </Typography>

            {/* Read-only identity fields */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="First Name"
                value={foundUser.firstName}
                InputProps={{ readOnly: true }}
                disabled
                margin="dense"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Last Name"
                value={foundUser.lastName}
                InputProps={{ readOnly: true }}
                disabled
                margin="dense"
                sx={{ flex: 1 }}
              />
            </Box>
            <TextField
              label="Email"
              value={foundUser.email}
              InputProps={{ readOnly: true }}
              disabled
              fullWidth
              margin="dense"
            />
            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                label="Employee ID"
                value={assign.employeeId}
                InputProps={{ readOnly: true }}
                disabled
                margin="dense"
                sx={{ flex: 1 }}
              />
              <TextField
                label="Company Name"
                value={companyName}
                InputProps={{ readOnly: true }}
                disabled
                margin="dense"
                sx={{ flex: 1 }}
              />
            </Box>

            {/* Editable assignment fields */}
            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl margin="dense" variant="outlined" error={!!errors.department} sx={{ flex: 1 }}>
                <InputLabel>Department</InputLabel>
                <Select name="department" value={assign.department} onChange={handleChange} label="Department">
                  <MenuItem value="Software Development">Software Development</MenuItem>
                  <MenuItem value="Human Resources">Human Resources</MenuItem>
                  <MenuItem value="Design">Design</MenuItem>
                  <MenuItem value="Testing">Testing</MenuItem>
                  <MenuItem value="Accounting">Accounting</MenuItem>
                </Select>
                {errors.department && (
                  <Typography color="error" sx={{ fontSize: "0.75rem", mt: 0.5, ml: 1.5 }}>
                    {errors.department}
                  </Typography>
                )}
              </FormControl>
              <TextField
                label="Designation"
                name="designation"
                value={assign.designation}
                onChange={handleChange}
                inputProps={{ maxLength: 30 }}
                error={!!errors.designation}
                helperText={errors.designation}
                margin="dense"
                sx={{ flex: 1 }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl margin="dense" variant="outlined" error={!!errors.jobLocation} sx={{ flex: 1 }}>
                <InputLabel>Job Location</InputLabel>
                <Select name="jobLocation" value={assign.jobLocation} onChange={handleChange} label="Job Location">
                  <MenuItem value="Hyderabad">Hyderabad</MenuItem>
                  <MenuItem value="Chennai">Chennai</MenuItem>
                  <MenuItem value="Kerala">Kerala</MenuItem>
                  <MenuItem value="Amaravati">Amaravati</MenuItem>
                  <MenuItem value="Delhi">Delhi</MenuItem>
                  <MenuItem value="Mumbai">Mumbai</MenuItem>
                  <MenuItem value="Kolkata">Kolkata</MenuItem>
                </Select>
                {errors.jobLocation && (
                  <Typography color="error" sx={{ fontSize: "0.75rem", mt: 0.5, ml: 1.5 }}>
                    {errors.jobLocation}
                  </Typography>
                )}
              </FormControl>
              <TextField
                label="Phone Number"
                name="phoneNumber"
                value={assign.phoneNumber}
                onChange={handleChange}
                inputProps={{ maxLength: 10 }}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                margin="dense"
                sx={{ flex: 1 }}
              />
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <FormControl margin="dense" variant="outlined" error={!!errors.bloodGroup} sx={{ flex: 1 }}>
                <InputLabel>Blood Group</InputLabel>
                <Select name="bloodGroup" value={assign.bloodGroup} onChange={handleChange} label="Blood Group">
                  <MenuItem value="A +ve">A +</MenuItem>
                  <MenuItem value="A -ve">A -</MenuItem>
                  <MenuItem value="B +ve">B +</MenuItem>
                  <MenuItem value="B -ve">B -</MenuItem>
                  <MenuItem value="O +ve">O +</MenuItem>
                  <MenuItem value="O -ve">O -</MenuItem>
                  <MenuItem value="AB +ve">AB +</MenuItem>
                  <MenuItem value="AB -ve">AB -</MenuItem>
                </Select>
                {errors.bloodGroup && (
                  <Typography color="error" sx={{ fontSize: "0.75rem", mt: 0.5, ml: 1.5 }}>
                    {errors.bloodGroup}
                  </Typography>
                )}
              </FormControl>
              <FormControl margin="dense" variant="outlined" error={!!errors.gender} sx={{ flex: 1 }}>
                <InputLabel>Gender</InputLabel>
                <Select name="gender" value={assign.gender} onChange={handleChange} label="Gender">
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                </Select>
                {errors.gender && (
                  <Typography color="error" sx={{ fontSize: "0.75rem", mt: 0.5, ml: 1.5 }}>
                    {errors.gender}
                  </Typography>
                )}
              </FormControl>
            </Box>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date of Birth"
                sx={{ width: "100%", mt: 1 }}
                value={assign.dateOfBirth ? dayjs(assign.dateOfBirth) : null}
                onChange={handleDateChange}
                maxDate={dayjs()}
                slotProps={{
                  textField: {
                    error: !!errors.dateOfBirth,
                    helperText: errors.dateOfBirth,
                    margin: "dense",
                    fullWidth: true,
                  },
                }}
              />
            </LocalizationProvider>

            <Typography sx={{ mt: 1.5, mb: 0.5 }}>Upload Photo</Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              sx={{ display: "flex", justifyContent: "flex-start", height: 56 }}
            >
              <input type="file" name="photo" onChange={handleChange} />
            </Button>
            {errors.photo && (
              <Typography color="error" sx={{ fontSize: "0.75rem", mt: 0.5, ml: 1.5 }}>
                {errors.photo}
              </Typography>
            )}

            <Autocomplete
              multiple
              freeSolo
              sx={{ mt: 1.5 }}
              options={skillsOption}
              value={assign.technicalSkills}
              onChange={handleSkillsChange}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} {...getTagProps({ index })} key={index} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Technical Skills" margin="dense" fullWidth />
              )}
            />
          </>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" color="error">
          Cancel
        </Button>
        {foundUser && (
          <Button onClick={handleSave} variant="contained">
            Assign to Company
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AddEmployeeDialog;
