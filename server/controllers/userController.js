const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../models");
const sequelize = require("../config/database");
const { Op, fn, col, literal } = require("sequelize");
const { DEFAULT_COMPANY, generateEmployeeId, ensureCompanyMembership } = require("../utils/companyMembership");
require("dotenv").config();

exports.registerUsers = async (req, res) => {
  const {
    firstName, lastName, email, phoneNumber, password, companyName, role,
    designation, department, jobLocation, dateOfBirth, bloodGroup,
    technicalSkills, employeeId, gender, confirmPassword
  } = req.body;

  // Basic-fields mode: password/photo are optional for admin-created employees
  // Default password if not supplied, and photo is nullable
  const effectivePassword = password || "Welcome@123";
  const effectiveConfirm = confirmPassword || effectivePassword;
  if (effectivePassword !== effectiveConfirm) {
    return res.status(400).json({ error: "Passwords do not match" });
  }
  if (password && !confirmPassword) {
    return res.status(400).json({ error: "Confirm password is required" });
  }

  const photo = req.file ? `/uploads/${req.file.filename}` : null;
  const effectiveCompany = String(companyName || "").trim() || DEFAULT_COMPANY;

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(effectivePassword, 10);
    const assignedEmployeeId = employeeId || await generateEmployeeId(effectiveCompany);

    await User.create({
      firstName, lastName, email, phoneNumber, password: hashedPassword, companyName: effectiveCompany,
      role: role || "Employee", designation, department, jobLocation, dateOfBirth, bloodGroup,
      photo, technicalSkills, employeeId: assignedEmployeeId, gender,
    });

    return res.status(201).json({ message: "User added successfully", employeeId: assignedEmployeeId, companyName: effectiveCompany });
  } catch (error) {
    console.error("Server error:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.registerUser = async (req, res) => {
  const { firstName, lastName, email, password, confirmPassword } = req.body;

  if (!firstName || !firstName.trim()) {
    return res.status(400).json({ error: "First name is required" });
  }
  if (!lastName || !lastName.trim()) {
    return res.status(400).json({ error: "Last name is required" });
  }
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  if (!confirmPassword) {
    return res.status(400).json({ error: "Confirm password is required" });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match" });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const employeeId = await generateEmployeeId(DEFAULT_COMPANY);

    await User.create({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email,
      password: hashedPassword,
      role: "Employee",
      companyName: DEFAULT_COMPANY,
      employeeId,
    });

    return res.status(201).json({
      message: "Registered successfully",
      employeeId,
      companyName: DEFAULT_COMPANY,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getUserByEmail = async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const user = await User.findOne({ where: { email, exists: 1 } });
    if (!user) {
      return res.status(404).json({ error: "No registered user found with this email" });
    }

    return res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      companyName: user.companyName || null,
      role: user.role,
    });
  } catch (error) {
    console.error("Error finding user by email:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getUnassignedUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { companyName: null, exists: 1 },
      order: [["id", "ASC"]],
    });

    const result = users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
    }));

    return res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching unassigned users:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email, exists: 1 } });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }
    await ensureCompanyMembership(user);
    const token = jwt.sign(
      {
        id: user.id,
        role: user.role,
        companyName: user.companyName,
        department: user.department,
        employeeId: user.employeeId,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    const photoUrl = user.photo ? `${req.protocol}://${req.get("host")}${user.photo}` : null;
    res.status(200).json({
      success: true,
      token,
      role: user.role,
      photo: photoUrl,
      companyName: user.companyName,
      designation: user.designation,
      phoneNumber: user.phoneNumber,
      jobLocation: user.jobLocation,
      email: user.email,
      id: user.id,
      department: user.department,
      employeeId: user.employeeId,
      firstName: user.firstName,
      lastName: user.lastName,
      technicalSkills: user.technicalSkills,
      dateOfBirth: user.dateOfBirth,
      bloodGroup: user.bloodGroup,
      gender: user.gender,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.updateUser = async (req, res) => {
  const { id, designation, department, role, jobLocation, technicalSkills, phoneNumber, dateOfBirth, bloodGroup, gender } = req.body;
  const skillsString = technicalSkills ? (Array.isArray(technicalSkills) ? technicalSkills.join(",") : technicalSkills) : null;
  const normalizedDateOfBirth = /^\d{4}-\d{2}-\d{2}$/.test(String(dateOfBirth || ''))
    ? dateOfBirth
    : null;

  try {
    const updatePayload = { designation, department, jobLocation, phoneNumber, dateOfBirth: normalizedDateOfBirth, bloodGroup, gender };
    if (skillsString !== null) updatePayload.technicalSkills = skillsString;
    if (role) updatePayload.role = role;

    const result = await User.update(updatePayload, { where: { id } });
    if (result[0] === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({ success: false, message: "Update failed" });
  }
};

exports.updateUserPhoto = async (req, res) => {
  const { id } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  if (!id || !photo) {
    return res.status(400).json({ success: false, message: "Invalid request." });
  }

  try {
    const result = await User.update({ photo }, { where: { id } });
    if (result[0] === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.status(200).json({
      success: true,
      message: "Photo updated successfully.",
      photoUrl: `${req.protocol}://${req.get("host")}${photo}`,
    });
  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).json({ success: false, message: "Failed to update photo." });
  }
};

exports.getUsers = async (req, res) => {
  const { companyName, role } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    let where = { companyName, exists: 1 };
    if (role !== 'Manager') {
      where.role = { [Op.in]: ['Employee', 'Manager', 'Admin'] };
    }

    const results = await User.findAll({ where, order: [['id', 'ASC']] });

    const users = results.map(user => ({
      ...user.toJSON(),
      photo: user.photo ? `${req.protocol}://${req.get('host')}${user.photo}` : null,
      technicalSkills: user.technicalSkills ? user.technicalSkills.split(",") : null
    }));

    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Error fetching users' });
  }
};

exports.getUsersByMonth = async (req, res) => {
  const { companyName, year } = req.query;

  if (!companyName || !year) {
    return res.status(400).json({ error: 'Company name and year are required' });
  }

  try {
    const results = await User.findAll({
      attributes: [
        [fn('EXTRACT', literal('MONTH FROM "created_at"')), 'month'],
        [fn('SUM', literal('CASE WHEN "exists" = 1 THEN 1 ELSE 0 END')), 'employees'],
        [fn('SUM', literal('CASE WHEN "exists" = 0 THEN 1 ELSE 0 END')), 'deletedemployees'],
      ],
      where: {
        companyName,
        [Op.and]: sequelize.where(fn('EXTRACT', literal('YEAR FROM "created_at"')), year),
      },
      group: [literal('EXTRACT(MONTH FROM "created_at")')],
      raw: true,
    });
    const stats = results.map(row => ({
      month: Number(row.month) || 0,
      employees: Number(row.employees) || 0,
      deletedemployees: Number(row.deletedemployees) || 0,
    }));
    res.json(stats);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getUsersByLocation = async (req, res) => {
  const { companyName, year } = req.query;

  if (!companyName || !year) {
    return res.status(400).json({ error: 'Company name and year are required' });
  }

  try {
    const results = await User.findAll({
      attributes: [
        [literal('"job_location"'), 'locationName'],
        [fn('COUNT', literal('*')), 'locations'],
      ],
      where: {
        companyName,
        exists: 1,
        [Op.and]: sequelize.where(fn('EXTRACT', literal('YEAR FROM "created_at"')), year),
      },
      group: [literal('"job_location"')],
      raw: true,
    });
    const stats = results.map(row => ({
      locationName: row.locationName,
      locations: Number(row.locations) || 0,
    }));
    res.json(stats);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getUsersByGenders = async (req, res) => {
  const { companyName, year } = req.query;

  if (!companyName || !year) {
    return res.status(400).json({ error: 'Company name and year are required' });
  }

  try {
    const results = await User.findAll({
      attributes: [
        [literal('"gender"'), 'genderName'],
        [fn('COUNT', literal('*')), 'genders'],
      ],
      where: {
        companyName,
        exists: 1,
        [Op.and]: sequelize.where(fn('EXTRACT', literal('YEAR FROM "created_at"')), year),
      },
      group: ['gender'],
      raw: true,
    });
    const stats = results.map(row => ({
      genderName: row.genderName,
      genders: Number(row.genders) || 0,
    }));
    res.json(stats);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getUsersByDepartments = async (req, res) => {
  const { companyName, year } = req.query;

  if (!companyName || !year) {
    return res.status(400).json({ error: 'Company name and year are required' });
  }

  try {
    const results = await User.findAll({
      attributes: [
        [literal('"department"'), 'departmentName'],
        [fn('COUNT', literal('*')), 'indepartment'],
      ],
      where: {
        companyName,
        exists: 1,
        [Op.and]: sequelize.where(fn('EXTRACT', literal('YEAR FROM "created_at"')), year),
      },
      group: ['department'],
      raw: true,
    });
    const stats = results.map(row => ({
      departmentName: row.departmentName,
      indepartment: Number(row.indepartment) || 0,
    }));
    res.json(stats);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.updateUserDetails = async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, companyName, role, gender, designation, email, phoneNumber, department, bloodGroup, technicalSkills, dateOfBirth, jobLocation } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const values = {
      firstName, lastName, companyName, role, gender, designation, email, phoneNumber,
      department, bloodGroup, technicalSkills, dateOfBirth, jobLocation,
    };
    if (photo) {
      values.photo = photo;
    }

    const result = await User.update(values, { where: { id } });
    if (result[0] === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ message: 'User updated successfully!' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.toggleUserExists = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.update({ exists: user.exists ? 0 : 1 });
    res.json({ success: true, message: 'User status updated successfully' });
  } catch (error) {
    console.error('Error toggling user:', error);
    res.status(500).json({ success: false, message: 'Failed to update user status' });
  }
};

exports.getNextEmployeeId = async (req, res) => {
  const { companyName } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const newEmployeeId = await generateEmployeeId(companyName);
    res.status(200).json({ employeeId: newEmployeeId });
  } catch (error) {
    console.error('Error fetching last employee ID:', error);
    res.status(500).json({ error: 'Error fetching last employee ID' });
  }
};

exports.getUsersList = async (req, res) => {
  const { companyName } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const results = await User.findAll({
      where: { companyName, exists: 1 },
      order: [['id', 'ASC']],
    });

    const users = results.map(user => ({
      ...user.toJSON(),
      photo: user.photo ? `${req.protocol}://${req.get('host')}${user.photo}` : null,
      technicalSkills: user.technicalSkills ? user.technicalSkills.split(",") : null
    }));

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};