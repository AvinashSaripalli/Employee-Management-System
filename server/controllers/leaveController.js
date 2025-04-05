const db = require('../db');
require("dotenv").config(); 

exports.leaveApply = (req, res) => {
    console.log("Received leave application request:", req.body); // Debug log
    const { employeeId, leaveType, startDate, endDate, reason, onlyTomorrow, halfDay,companyName } = req.body;
    
    // Input validation
    if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
        console.log("Missing required fields");
        return res.status(400).json({ error: "Missing required fields" });
    }

    const sql = `INSERT INTO leaves (employeeId, leave_type, start_date, end_date, reason, only_tomorrow, half_day, status,companyName )
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending',?)`;
  
    db.query(sql, 
        [employeeId, leaveType, startDate, endDate, reason, onlyTomorrow || false, halfDay || false, companyName], 
        (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ 
                    error: "Database error",
                    details: err.message,
                    sqlMessage: err.sqlMessage 
                });
            }
            console.log("Leave application successful:", result);
            res.status(201).json({ 
                message: "Leave applied successfully", 
                leaveId: result.insertId 
            });
    });
};

exports.getAllLeaves = (req, res) => {
    const sql = 'SELECT * FROM leaves';
    db.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching leave records:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(results);
    });
};

exports.updateLeaveStatus = (req, res) => {
    const { leaveId, status } = req.body;

    if (!leaveId || !status) {
        return res.status(400).json({ error: 'Leave ID and status are required' });
    }

    const sql = 'UPDATE leaves SET status = ? WHERE id = ?';
    db.query(sql, [status, leaveId], (err, result) => {
        if (err) {
            console.error('Error updating leave status:', err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ message: `Leave ${status} successfully!` });
    });
};

exports.getLeavesByEmployee = (req, res) => {
    const { employeeId } = req.query;

    if (!employeeId) {
        return res.status(400).json({ message: "Employee ID is required" });
    }

    const query = "SELECT * FROM leaves WHERE employeeId = ?";
    db.query(query, [employeeId], (err, results) => {
        if (err) {
            console.error("Error fetching leaves:", err);
            return res.status(500).json({ message: "Internal Server Error" });
        }
        res.status(200).json(results);
    });
};

exports.getApprovedLeavesToday = (req, res) => {
    const { companyName, year } = req.query;

    if (!companyName || !year) {
        return res.status(400).json({ error: "Missing required parameters" });
    }

    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth() + 1; 

    const query = `
        SELECT COUNT(*) AS leaveCount 
        FROM leaves 
        WHERE companyName = ? 
        AND status = 'approved' 
        AND YEAR(start_date) = ? 
        AND MONTH(start_date) = ? 
        AND DAY(start_date) = ?
    `;

    db.query(query, [companyName, year, currentMonth, currentDate], (err, results) => {
        if (err) {
            console.error('Error fetching approved leaves:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.json({ leaveCount: results[0].leaveCount });
    });
};