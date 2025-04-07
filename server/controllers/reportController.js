// const db = require("../db");
// require("dotenv").config(); 

// exports.getReports = (req, res) => {
//   const sql = "SELECT * FROM reports ORDER BY date DESC";
//   db.query(sql, (err, results) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json(results);
//   });
// };

// exports.createReport = (req, res) => {
//   const { employeeId, date, tasks, hoursWorked, status } = req.body;
//   const sql = "INSERT INTO reports (employeeId, date, tasks, hoursWorked, status) VALUES (?, ?, ?, ?, ?)";
//   db.query(sql, [employeeId, date, tasks, hoursWorked, status], (err, result) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ message: "Report added successfully", id: result.insertId });
//   });
// };

// exports.updateReport = (req, res) => {
//   const { id } = req.params;
//   const { date, tasks, hoursWorked, status } = req.body;
//   const sql = "UPDATE reports SET date=?, tasks=?, hoursWorked=?, status=? WHERE id=?";
//   db.query(sql, [date, tasks, hoursWorked, status, id], (err) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ message: "Report updated successfully" });
//   });
// };

// exports.deleteReport = (req, res) => {
//   const { id } = req.params;
//   const sql = "DELETE FROM reports WHERE id=?";
//   db.query(sql, [id], (err) => {
//     if (err) return res.status(500).json({ error: err });
//     res.json({ message: "Report deleted successfully" });
//   });
// };

const db = require("../db");
require("dotenv").config();

exports.getReports = (req, res) => {
  const { employeeId } = req.query; 
  const sql = "SELECT * FROM reports WHERE employeeId = ? ORDER BY date DESC";
  db.query(sql, [employeeId], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
    res.json(results);
  });
};

exports.createReport = (req, res) => {
  const { employeeId, date, tasks, hoursWorked, status } = req.body;
  if (!employeeId || !date || !tasks || !hoursWorked) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const sql = "INSERT INTO reports (employeeId, date, tasks, hoursWorked, status) VALUES (?, ?, ?, ?, ?)";
  db.query(sql, [employeeId, date, tasks, hoursWorked, status], (err, result) => {
    if (err) {
      console.error("Insert error:", err);
      return res.status(500).json({ error: "Failed to add report" });
    }
    res.json({ message: "Report added successfully", id: result.insertId });
  });
};

exports.updateReport = (req, res) => {
  const { id } = req.params;
  const { date, tasks, hoursWorked, status } = req.body;
  if (!date || !tasks || !hoursWorked) {
    return res.status(400).json({ error: "Missing required fields" });
  }
  const sql = "UPDATE reports SET date=?, tasks=?, hoursWorked=?, status=? WHERE id=?";
  db.query(sql, [date, tasks, hoursWorked, status, id], (err) => {
    if (err) {
      console.error("Update error:", err);
      return res.status(500).json({ error: "Failed to update report" });
    }
    res.json({ message: "Report updated successfully" });
  });
};

exports.deleteReport = (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM reports WHERE id=?";
  db.query(sql, [id], (err) => {
    if (err) {
      console.error("Delete error:", err);
      return res.status(500).json({ error: "Failed to delete report" });
    }
    res.json({ message: "Report deleted successfully" });
  });
};
