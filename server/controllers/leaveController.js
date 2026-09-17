const { Leave } = require('../models');
const sequelize = require('../config/database');
const { Op, fn, literal } = require('sequelize');

exports.leaveApply = async (req, res) => {
  const { employeeId, companyName, leaveType, startDate, endDate, reason, onlyTomorrow, halfDay } = req.body;

  try {
    const leave = await Leave.create({
      employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
      only_tomorrow: onlyTomorrow || false,
      half_day: halfDay || false,
      status: 'Pending',
      companyName,
    });
    res.status(201).json({ message: "Leave applied successfully", leaveId: leave.id });
  } catch (error) {
    console.error('Error applying leave:', error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
};

exports.getAllLeaves = async (req, res) => {
  const { companyName } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const results = await Leave.findAll({
      where: { companyName },
      order: [['created_at', 'DESC']],
    });
    res.json(results);
  } catch (error) {
    console.error('Error fetching leave records:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getRecentLeaves = async (req, res) => {
  const { employeeId, companyName } = req.query;

  if (!employeeId || !companyName) {
    return res.status(400).json({ error: "Employee ID and Company Name are required" });
  }

  try {
    const results = await Leave.findAll({
      where: {
        employeeId,
        companyName,
        [Op.and]: literal('("start_date" < NOW() OR "start_date" > NOW())'),
      },
      order: [['start_date', 'DESC']],
      limit: 4,
    });
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching recent leaves:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getLeaveCounts = async (req, res) => {
  const { companyName } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const results = await Leave.findAll({
      attributes: [
        [fn('COUNT', literal('*')), 'total'],
        [fn('SUM', literal(`CASE WHEN "status" = 'Approved' THEN 1 ELSE 0 END`)), 'approved'],
        [fn('SUM', literal(`CASE WHEN "status" = 'Pending' THEN 1 ELSE 0 END`)), 'pending'],
        [fn('SUM', literal(`CASE WHEN "status" = 'Rejected' THEN 1 ELSE 0 END`)), 'rejected'],
      ],
      where: { companyName },
      raw: true,
    });
    const counts = results[0] || {};
    res.json({
      total: Number(counts.total) || 0,
      approved: Number(counts.approved) || 0,
      pending: Number(counts.pending) || 0,
      rejected: Number(counts.rejected) || 0,
    });
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.updateLeaveStatus = async (req, res) => {
  const { leaveId, status } = req.body;

  if (!leaveId || !status) {
    return res.status(400).json({ error: 'Leave ID and status are required' });
  }

  try {
    const result = await Leave.update({ status }, { where: { id: leaveId } });
    if (result[0] === 0) {
      return res.status(404).json({ error: 'Leave record not found' });
    }
    res.json({ message: `Leave ${status} successfully!` });
  } catch (error) {
    console.error('Error updating leave status:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

exports.getLeavesByEmployee = async (req, res) => {
  const { employeeId, companyName } = req.query;

  if (!employeeId) {
    return res.status(400).json({ message: "Employee ID is required" });
  }

  try {
    const results = await Leave.findAll({
      where: { employeeId, companyName },
      order: [['created_at', 'DESC']],
    });
    res.status(200).json(results);
  } catch (error) {
    console.error("Error fetching leaves:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.getApprovedLeavesToday = async (req, res) => {
  const { companyName, year } = req.query;

  if (!companyName || !year) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  const today = new Date();
  const currentDate = today.getDate();
  const currentMonth = today.getMonth() + 1;

  try {
    const result = await Leave.findAll({
      attributes: [[fn('COUNT', literal('*')), 'leaveCount']],
      where: {
        companyName,
        status: 'approved',
        [Op.and]: [
          literal(`EXTRACT(YEAR FROM "start_date") = ${parseInt(year)}`),
          literal(`EXTRACT(MONTH FROM "start_date") = ${currentMonth}`),
          literal(`EXTRACT(DAY FROM "start_date") = ${currentDate}`),
        ],
      },
      raw: true,
    });
    res.json({ leaveCount: Number(result[0].leaveCount) || 0 });
  } catch (error) {
    console.error('Error fetching approved leaves:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};