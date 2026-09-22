const { Report, User, Attendance } = require("../models");
const { Op } = require("sequelize");

const employeeInclude = {
  model: User,
  as: "employee",
  attributes: ["firstName", "lastName", "email", "designation", "department", "photo"],
  required: false,
};

exports.getReports = async (req, res) => {
  const { companyName, date, from, to, department, search, role, supervisorDepartment } = req.query;

  const rawCompany = String(companyName || "").trim();
  const effectiveCompany =
    !rawCompany || rawCompany === "null" || rawCompany === "undefined"
      ? "KN Advisors"
      : rawCompany;

  try {
    const where = {};
    if (effectiveCompany) {
      where.companyName = { [Op.iLike]: effectiveCompany };
    }

    const dateFilter = {};
    if (date) dateFilter[Op.eq] = date;
    if (from) dateFilter[Op.gte] = from;
    if (to) dateFilter[Op.lte] = to;
    if (Object.keys(dateFilter).length) where.date = dateFilter;

    // Role-based visibility: Department Supervisor / Manager can only see their department!
    const targetDept = department || (role === "Manager" ? supervisorDepartment : null);
    if (targetDept && targetDept !== "all") {
      where.department = { [Op.iLike]: targetDept.trim() };
    }

    if (search) {
      where[Op.or] = [
        { taskName: { [Op.iLike]: `%${search}%` } },
        { employeeName: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const results = await Report.findAll({
      where,
      include: [employeeInclude],
      order: [
        ["date", "DESC"],
        ["id", "DESC"],
      ],
    });

    res.json(results);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTheReports = async (req, res) => {
  const { employeeId, companyName } = req.query;

  if (!employeeId) {
    return res.status(400).json({ error: "employeeId is required" });
  }

  const rawCompany = String(companyName || "").trim();
  const effectiveCompany =
    !rawCompany || rawCompany === "null" || rawCompany === "undefined"
      ? "KN Advisors"
      : rawCompany;

  try {
    const where = { employeeId };
    if (effectiveCompany) where.companyName = { [Op.iLike]: effectiveCompany };

    const results = await Report.findAll({
      where,
      include: [employeeInclude],
      order: [
        ["date", "DESC"],
        ["id", "DESC"],
      ],
    });
    res.json(results);
  } catch (error) {
    console.error("Error fetching reports:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.createReport = async (req, res) => {
  const {
    employeeId,
    employeeName,
    department,
    date,
    taskName,
    workDescription,
    hoursWorked,
    companyName,
    clockInTime,
    clockOutTime,
    feedback,
  } = req.body;

  const rawCompany = String(companyName || "").trim();
  const effectiveCompany =
    !rawCompany || rawCompany === "null" || rawCompany === "undefined"
      ? "KN Advisors"
      : rawCompany;

  if (!date || !taskName) {
    return res
      .status(400)
      .json({ error: "Date and task name are required" });
  }

  try {
    // Enforcement: Employee must have clocked in on that date to submit a work report!
    let attendanceRecord = null;
    if (employeeId) {
      attendanceRecord = await Attendance.findOne({
        where: {
          employeeId,
          companyName: { [Op.iLike]: effectiveCompany },
          clockInDate: date,
        },
        order: [["id", "DESC"]],
      });

      if (!attendanceRecord) {
        return res.status(400).json({
          error: `You can only submit a work report for days on which you have clocked in. Please clock in first for ${date}.`,
        });
      }
    }

    const report = await Report.create({
      employeeId,
      employeeName,
      department,
      date,
      taskName,
      workDescription,
      hoursWorked: hoursWorked || 0,
      companyName: effectiveCompany,
      clockInTime: clockInTime || attendanceRecord?.clockInTime || null,
      clockOutTime: clockOutTime || attendanceRecord?.clockOutTime || null,
      status: "Submitted",
      feedback: feedback || "Pending",
    });

    res.status(201).json({ message: "Report added successfully", id: report.id });
  } catch (error) {
    console.error("Error creating report:", error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateReport = async (req, res) => {
  const { id } = req.params;
  const { date, taskName, workDescription, hoursWorked, department, status } =
    req.body;

  try {
    const result = await Report.update(
      {
        date,
        taskName,
        workDescription,
        hoursWorked,
        department,
        status,
      },
      { where: { id } }
    );

    if (result[0] === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json({ message: "Report updated successfully" });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({ error: "Failed to update report" });
  }
};

exports.deleteReport = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Report.destroy({ where: { id } });

    if (result === 0) {
      return res.status(404).json({ error: "Report not found" });
    }

    res.status(200).json({ message: "Report deleted successfully" });
  } catch (error) {
    console.error("Error deleting report:", error);
    res.status(500).json({ error: "Failed to delete report" });
  }
};

exports.updateFeedbackByEmployeeId = async (req, res) => {
  const { id } = req.params;
  const { employeeId, feedback } = req.body;

  if (!feedback) {
    return res.status(400).json({ error: "Feedback is required" });
  }

  try {
    const where = { id };
    if (employeeId) where.employeeId = employeeId;

    const result = await Report.update(
      { feedback },
      { where }
    );

    if (result[0] === 0) {
      return res.status(404).json({ message: "Employee report not found" });
    }

    res.status(200).json({ message: "Feedback updated successfully" });
  } catch (error) {
    console.error("Error updating feedback:", error);
    res.status(500).json({ error: "Failed to update feedback" });
  }
};