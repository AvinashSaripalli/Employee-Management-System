const db = require("../db");
require("dotenv").config(); 

exports.getReports = (req, res) => {
  const sql = "SELECT * FROM reports ORDER BY date DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
};

exports.createReport = (req, res) => {
  const { employeeId, date, tasks, hoursWorked, status } = req.body;
  const sql = "INSERT INTO reports (employeeId, date, tasks, hoursWorked, status) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [employeeId, date, tasks, hoursWorked, status], (err, result) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Report added successfully", id: result.insertId });
  });
};

exports.updateReport = (req, res) => {
  const { id } = req.params;
  const { date, tasks, hoursWorked, status } = req.body;
  const sql = "UPDATE reports SET date=?, tasks=?, hoursWorked=?, status=? WHERE id=?";
  db.query(sql, [date, tasks, hoursWorked, status, id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Report updated successfully" });
  });
};

exports.deleteReport = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM reports WHERE id=?";
  db.query(sql, [id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Report deleted successfully" });
  });
};
