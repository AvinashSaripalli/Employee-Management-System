const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { User } = require("../models");
const sequelize = require("../config/database");
const { Op, fn, col, literal } = require("sequelize");
const { DEFAULT_COMPANY, generateEmployeeId, ensureCompanyMembership } = require("../utils/companyMembership");
const { sendInvitationEmail } = require("../utils/mailer");
const { logAuditEvent } = require("../utils/auditLogger");
require("dotenv").config();

exports.registerUsers = async (req, res) => {
  const actorRole = (req.user?.role || '').toLowerCase();
  if (actorRole !== 'admin' && actorRole !== 'hr') {
    return res.status(403).json({ error: "Access denied. Only Administrators and HR can register employees." });
  }

  const {
    firstName, lastName, email, phoneNumber, password, companyName, role,
    designation, department, jobLocation, dateOfBirth, bloodGroup,
    technicalSkills, employeeId, gender, confirmPassword
  } = req.body;

  // Basic-fields mode: password/photo are optional for admin-created employees
  // Default password if not supplied, and photo is nullable
  const effectivePassword = password || "Password@123";
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

    await logAuditEvent({
      req,
      action: 'USER_CREATED',
      targetType: 'User',
      targetEmployeeId: assignedEmployeeId,
      targetName: `${firstName} ${lastName}`.trim(),
      newValues: { firstName, lastName, email, role: role || 'Employee', department, designation, employeeId: assignedEmployeeId },
      details: `Created new employee account for ${firstName} ${lastName} (${assignedEmployeeId}) with role ${role || 'Employee'} in ${department || 'Unassigned'}`,
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

    const photoUrl = user.photo ? `${req.protocol}://${req.get("host")}${user.photo}` : null;

    return res.status(200).json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      companyName: user.companyName || null,
      role: user.role,
      departmentRole: user.departmentRole || 'Member',
      department: user.department,
      employeeId: user.employeeId,
      designation: user.designation,
      photo: photoUrl,
      phoneNumber: user.phoneNumber,
      jobLocation: user.jobLocation,
      dateOfBirth: user.dateOfBirth,
      bloodGroup: user.bloodGroup,
      gender: user.gender,
      technicalSkills: user.technicalSkills,
    });
  } catch (error) {
    console.error("Error finding user by email:", error);
    return res.status(500).json({ error: "Server error", details: error.message });
  }
};

exports.getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const user = await User.findByPk(userId);
    if (!user || user.exists !== 1) {
      return res.status(404).json({ error: "User not found" });
    }
    const photoUrl = user.photo ? `${req.protocol}://${req.get("host")}${user.photo}` : null;
    return res.json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      companyName: user.companyName,
      role: user.role,
      departmentRole: user.departmentRole || 'Member',
      department: user.department,
      employeeId: user.employeeId,
      designation: user.designation,
      photo: photoUrl,
      phoneNumber: user.phoneNumber,
      jobLocation: user.jobLocation,
      dateOfBirth: user.dateOfBirth,
      bloodGroup: user.bloodGroup,
      gender: user.gender,
      technicalSkills: user.technicalSkills,
      delegatedToId: user.delegatedToId,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res.status(500).json({ error: "Server error" });
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
  const email = String(req.body.email || "").trim();
  const password = String(req.body.password || "");
  try {
    const user = await User.findOne({
      where: {
        email: { [Op.iLike]: email },
        exists: 1,
      },
    });
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
        departmentRole: user.departmentRole || 'Member',
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
      departmentRole: user.departmentRole || 'Member',
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
  const actorRole = (req.user?.role || '').toLowerCase();
  const isPrivileged = actorRole === 'admin' || actorRole === 'hr';
  const targetId = Number(id || req.user?.id);
  const isSelf = Number(req.user?.id) === targetId;

  if (!isPrivileged && !isSelf) {
    return res.status(403).json({ success: false, message: "Access denied. You do not have permission to modify this profile." });
  }

  const skillsString = technicalSkills ? (Array.isArray(technicalSkills) ? technicalSkills.join(",") : technicalSkills) : null;
  const normalizedDateOfBirth = /^\d{4}-\d{2}-\d{2}$/.test(String(dateOfBirth || ''))
    ? dateOfBirth
    : null;

  try {
    const updatePayload = { designation, jobLocation, phoneNumber, dateOfBirth: normalizedDateOfBirth, bloodGroup, gender };
    if (skillsString !== null) updatePayload.technicalSkills = skillsString;

    // Only Admin/HR can modify role and department
    if (isPrivileged) {
      if (role) updatePayload.role = role;
      if (department) updatePayload.department = department;
    }

    const result = await User.update(updatePayload, { where: { id: targetId } });
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

  const rawCompany = String(companyName || "").trim();
  const effectiveCompany =
    !rawCompany || rawCompany === "null" || rawCompany === "undefined"
      ? "KN Advisors"
      : rawCompany;

  try {
    let where = { exists: 1 };
    if (effectiveCompany) {
      where.companyName = { [Op.iLike]: effectiveCompany };
    }
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
  const actorRole = (req.user?.role || '').toLowerCase();
  const isPrivileged = actorRole === 'admin' || actorRole === 'hr';
  const targetId = Number(id);
  const isSelf = Number(req.user?.id) === targetId;

  if (!isPrivileged && !isSelf) {
    return res.status(403).json({ error: "Access denied. You do not have permission to modify this profile." });
  }

  const { firstName, lastName, companyName, role, gender, designation, email, phoneNumber, department, bloodGroup, technicalSkills, dateOfBirth, jobLocation } = req.body;
  const photo = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const targetUser = await User.findByPk(targetId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Tenant isolation check
    if (req.user?.companyName && targetUser.companyName && targetUser.companyName.toLowerCase() !== req.user.companyName.toLowerCase()) {
      return res.status(403).json({ error: "Access denied across company tenants." });
    }

    const normalizedDob = dateOfBirth && /^\d{4}-\d{2}-\d{2}$/.test(String(dateOfBirth).trim())
      ? String(dateOfBirth).trim()
      : null;

    let skillsFormatted = null;
    if (Array.isArray(technicalSkills)) {
      skillsFormatted = technicalSkills.filter(Boolean).join(', ');
    } else if (typeof technicalSkills === 'string') {
      skillsFormatted = technicalSkills.trim() || null;
    }

    const values = {
      firstName: firstName ? String(firstName).trim() : undefined,
      lastName: lastName !== undefined ? String(lastName).trim() : undefined,
      companyName: isPrivileged && companyName !== undefined ? String(companyName).trim() : undefined,
      role: isPrivileged && role !== undefined ? role : undefined,
      gender: gender !== undefined ? gender : undefined,
      designation: designation !== undefined ? String(designation).trim() : undefined,
      email: email !== undefined ? String(email).trim() : undefined,
      phoneNumber: phoneNumber !== undefined ? String(phoneNumber).trim() : undefined,
      department: isPrivileged && department !== undefined ? department : undefined,
      bloodGroup: bloodGroup !== undefined ? bloodGroup : undefined,
      technicalSkills: skillsFormatted,
      dateOfBirth: normalizedDob,
      jobLocation: jobLocation !== undefined ? jobLocation : undefined,
    };

    // Remove undefined values
    Object.keys(values).forEach((key) => values[key] === undefined && delete values[key]);

    if (photo) {
      values.photo = photo;
    }

    const previousSnapshot = {
      firstName: targetUser.firstName,
      lastName: targetUser.lastName,
      role: targetUser.role,
      department: targetUser.department,
      designation: targetUser.designation,
      jobLocation: targetUser.jobLocation,
      phoneNumber: targetUser.phoneNumber,
    };

    await targetUser.update(values);

    await logAuditEvent({
      req,
      action: 'USER_UPDATED',
      targetType: 'User',
      targetId: String(targetId),
      targetEmployeeId: targetUser.employeeId,
      targetName: `${targetUser.firstName} ${targetUser.lastName}`.trim(),
      previousValues: previousSnapshot,
      newValues: values,
      details: `Updated employee profile for ${targetUser.firstName} ${targetUser.lastName} (${targetUser.employeeId})`,
    });

    res.status(200).json({ message: 'User updated successfully!' });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.toggleUserExists = async (req, res) => {
  const { id } = req.params;
  const actorRole = (req.user?.role || '').toLowerCase();

  // Only Admin and HR can activate/deactivate accounts
  if (actorRole !== 'admin' && actorRole !== 'hr') {
    return res.status(403).json({ success: false, message: "Access denied. Only Administrators and HR can modify account status." });
  }

  // Prevent users from deactivating their own account
  if (Number(req.user?.id) === Number(id)) {
    return res.status(400).json({ success: false, message: "You cannot deactivate your own administrative account." });
  }

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Tenant isolation check
    if (req.user?.companyName && user.companyName && user.companyName.toLowerCase() !== req.user.companyName.toLowerCase()) {
      return res.status(403).json({ success: false, message: "Access denied across company tenants." });
    }

    const previousExists = user.exists;
    const nextExists = previousExists ? 0 : 1;
    await user.update({ exists: nextExists });

    await logAuditEvent({
      req,
      action: nextExists === 1 ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      targetType: 'User',
      targetId: String(id),
      targetEmployeeId: user.employeeId,
      targetName: `${user.firstName} ${user.lastName}`.trim(),
      previousValues: { exists: previousExists },
      newValues: { exists: nextExists },
      details: `${nextExists === 1 ? 'Activated' : 'Deactivated'} employee account for ${user.firstName} ${user.lastName} (${user.employeeId})`,
    });

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
  const { companyName, department } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const where = { companyName, exists: 1 };
    if (department && department !== 'all') {
      where.department = department;
    }

    const results = await User.findAll({
      where,
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

exports.inviteUsers = async (req, res) => {
  const {
    users: rawUsers,
    email,
    emails,
    firstName,
    lastName,
    role = "Employee",
    department = DEFAULT_COMPANY,
    designation = "Associate",
    customMessage = "",
    companyName: reqCompanyName,
  } = req.body;

  const companyName = reqCompanyName || req.user?.companyName || DEFAULT_COMPANY;
  const portalUrl = req.headers.origin || process.env.CLIENT_URL || "http://localhost:3000";
  const inviterName = req.user ? `${req.user.firstName || ''} (${req.user.role || 'Admin'})`.trim() : "Management";

  let inviteList = [];

  if (Array.isArray(rawUsers) && rawUsers.length > 0) {
    inviteList = rawUsers.map((u) => ({
      email: String(u.email || "").trim(),
      firstName: String(u.firstName || "").trim(),
      lastName: String(u.lastName || "").trim(),
      role: u.role || role,
      department: u.department || department,
      designation: u.designation || designation,
    }));
  } else if (emails) {
    const emailArray = Array.isArray(emails)
      ? emails
      : String(emails).split(/[\n,;]+/).map((e) => e.trim()).filter(Boolean);
    inviteList = emailArray.map((e) => ({
      email: e,
      firstName: firstName || "",
      lastName: lastName || "",
      role,
      department,
      designation,
    }));
  } else if (email) {
    inviteList = [{
      email: String(email).trim(),
      firstName: firstName || "",
      lastName: lastName || "",
      role,
      department,
      designation,
    }];
  }

  if (inviteList.length === 0) {
    return res.status(400).json({ success: false, error: "No recipient emails provided" });
  }

  const results = [];
  let createdCount = 0;
  let existingCount = 0;
  let emailSentCount = 0;

  for (const item of inviteList) {
    if (!item.email || !item.email.includes("@")) {
      results.push({ email: item.email, status: "error", error: "Invalid email address" });
      continue;
    }

    try {
      let user = await User.findOne({ where: { email: item.email } });
      let tempPassword = null;
      let isExisting = false;

      if (user) {
        isExisting = true;
        existingCount++;
        if (user.exists === 0) {
          await user.update({ exists: 1 });
        }
        const updates = {};
        if (item.department) updates.department = item.department;
        if (item.designation) updates.designation = item.designation;
        if (item.role && item.role !== user.role) updates.role = item.role;
        if (Object.keys(updates).length) await user.update(updates);
      } else {
        const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
        tempPassword = `KN@${randomPart}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        const assignedEmployeeId = await generateEmployeeId(companyName);

        let fName = item.firstName;
        let lName = item.lastName;
        if (!fName) {
          const namePart = item.email.split("@")[0].replace(/[._-]/g, " ");
          const nameTokens = namePart.split(" ");
          fName = nameTokens[0] ? (nameTokens[0].charAt(0).toUpperCase() + nameTokens[0].slice(1)) : "Team";
          lName = nameTokens[1] ? (nameTokens[1].charAt(0).toUpperCase() + nameTokens[1].slice(1)) : "Member";
        }

        user = await User.create({
          firstName: fName,
          lastName: lName || "Member",
          email: item.email,
          password: hashedPassword,
          companyName,
          role: item.role || "Employee",
          department: item.department || companyName,
          designation: item.designation || "Associate",
          employeeId: assignedEmployeeId,
          exists: 1,
        });
        createdCount++;
      }

      const mailResult = await sendInvitationEmail({
        recipientEmail: item.email,
        recipientName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Team Member",
        companyName,
        role: user.role,
        department: user.department,
        designation: user.designation,
        employeeId: user.employeeId,
        tempPassword,
        portalUrl,
        customMessage,
        isExistingUser: isExisting,
        inviterName,
      });

      if (mailResult.success) {
        emailSentCount++;
      }

      results.push({
        email: item.email,
        status: mailResult.success ? "sent" : "smtp_fallback",
        userId: user.id,
        employeeId: user.employeeId,
        tempPassword,
        isExisting,
        mailError: mailResult.error || null,
        inviteLink: portalUrl,
      });
    } catch (err) {
      console.error(`Error processing invite for ${item.email}:`, err);
      results.push({ email: item.email, status: "error", error: err.message });
    }
  }

  res.status(200).json({
    success: true,
    message: `Processed ${inviteList.length} invitation(s): ${createdCount} created, ${existingCount} existing, ${emailSentCount} emails sent successfully.`,
    createdCount,
    existingCount,
    emailSentCount,
    results,
  });
};

exports.resendInvite = async (req, res) => {
  const { id } = req.params;
  const { resetPassword = false, customMessage = "" } = req.body;
  const portalUrl = req.headers.origin || process.env.CLIENT_URL || "http://localhost:3000";
  const inviterName = req.user ? `${req.user.firstName || ''} (${req.user.role || 'Admin'})`.trim() : "Management";

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    let tempPassword = null;
    if (resetPassword) {
      const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
      tempPassword = `KN@${randomPart}`;
      const hashedPassword = await bcrypt.hash(tempPassword, 10);
      await user.update({ password: hashedPassword });
    }

    const mailResult = await sendInvitationEmail({
      recipientEmail: user.email,
      recipientName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Team Member",
      companyName: user.companyName || DEFAULT_COMPANY,
      role: user.role,
      department: user.department,
      designation: user.designation,
      employeeId: user.employeeId,
      tempPassword,
      portalUrl,
      customMessage,
      isExistingUser: !resetPassword,
      inviterName,
    });

    res.status(200).json({
      success: true,
      message: mailResult.success
        ? `Invitation email sent successfully to ${user.email}`
        : `Email dispatched (fallback details generated: ${mailResult.error || 'SMTP issue'})`,
      emailStatus: mailResult.success ? "sent" : "smtp_fallback",
      mailError: mailResult.error || null,
      tempPassword,
      employeeId: user.employeeId,
      inviteLink: portalUrl,
    });
  } catch (error) {
    console.error("Error resending invite:", error);
    res.status(500).json({ success: false, message: "Failed to resend invite", error: error.message });
  }
};

exports.bulkSendInvites = async (req, res) => {
  const { userIds, customMessage = "", resetPassword = false } = req.body;
  const portalUrl = req.headers.origin || process.env.CLIENT_URL || "http://localhost:3000";
  const inviterName = req.user ? `${req.user.firstName || ''} (${req.user.role || 'Admin'})`.trim() : "Management";

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ success: false, message: "No user IDs provided" });
  }

  try {
    const users = await User.findAll({
      where: {
        id: { [Op.in]: userIds },
        exists: 1,
      },
    });

    const results = [];
    let sentCount = 0;

    for (const user of users) {
      let tempPassword = null;
      if (resetPassword) {
        const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
        tempPassword = `KN@${randomPart}`;
        const hashedPassword = await bcrypt.hash(tempPassword, 10);
        await user.update({ password: hashedPassword });
      }

      const mailResult = await sendInvitationEmail({
        recipientEmail: user.email,
        recipientName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || "Team Member",
        companyName: user.companyName || DEFAULT_COMPANY,
        role: user.role,
        department: user.department,
        designation: user.designation,
        employeeId: user.employeeId,
        tempPassword,
        portalUrl,
        customMessage,
        isExistingUser: !resetPassword,
        inviterName,
      });

      if (mailResult.success) sentCount++;

      results.push({
        userId: user.id,
        email: user.email,
        status: mailResult.success ? "sent" : "smtp_fallback",
        mailError: mailResult.error || null,
      });
    }

    res.status(200).json({
      success: true,
      message: `Sent invitations to ${sentCount} of ${users.length} selected employees.`,
      sentCount,
      total: users.length,
      results,
    });
  } catch (error) {
    console.error("Error sending bulk invites:", error);
    res.status(500).json({ success: false, message: "Failed to send bulk invites", error: error.message });
  }
};

exports.setUserDelegation = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { delegatedToId } = req.body;
    const actorId = req.user?.id;
    const actorRole = String(req.user?.role || '').toLowerCase();

    // User can set their own delegation (e.g. going on leave), or Admin/HR can set it
    if (Number(targetUserId) !== Number(actorId) && actorRole !== 'admin' && actorRole !== 'hr') {
      return res.status(403).json({ error: "You can only configure your own approval delegation" });
    }

    const user = await User.findByPk(targetUserId);
    if (!user || user.exists !== 1) return res.status(404).json({ error: "User not found" });

    if (delegatedToId) {
      if (Number(delegatedToId) === Number(targetUserId)) {
        return res.status(400).json({ error: "Cannot delegate approval authority to yourself" });
      }
      const delegate = await User.findByPk(delegatedToId);
      if (!delegate || delegate.companyName !== user.companyName || delegate.exists !== 1) {
        return res.status(400).json({ error: "Delegated user must be an active employee in your company" });
      }
    }

    const previousDelegatedToId = user.delegatedToId;
    await user.update({ delegatedToId: delegatedToId ? Number(delegatedToId) : null });

    await logAuditEvent({
      req,
      action: 'USER_DELEGATION_UPDATED',
      targetType: 'User',
      targetId: String(targetUserId),
      targetEmployeeId: user.employeeId,
      targetName: `${user.firstName} ${user.lastName}`.trim(),
      previousValues: { delegatedToId: previousDelegatedToId },
      newValues: { delegatedToId: user.delegatedToId },
      details: delegatedToId
        ? `Delegated approval duties for ${user.firstName} ${user.lastName} to employee ID ${delegatedToId}`
        : `Cleared approval delegation for ${user.firstName} ${user.lastName}`,
    });

    return res.json({
      message: delegatedToId ? "Supervisor delegation assigned successfully" : "Supervisor delegation cleared",
      delegatedToId: user.delegatedToId,
    });
  } catch (error) {
    console.error("Error updating user delegation:", error);
    return res.status(500).json({ error: "Failed to configure supervisor delegation" });
  }
};