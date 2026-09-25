const { Report, User, Attendance } = require("../models");
const { Op } = require("sequelize");

const employeeInclude = {
  model: User,
  as: "employee",
  attributes: ["firstName", "lastName", "email", "designation", "department", "photo"],
  required: false,
};

exports.getReports = async (req, res) => {
  const { companyName, date, from, to, department, search, role, supervisorDepartment, departmentRole } = req.query;

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

    // Role-based visibility: Admin/HR can see all departments; Department Supervisor / Manager can only see their department!
    const normalizedRole = String(role || "").toLowerCase();
    const isAdmin = normalizedRole === "admin" || normalizedRole === "hr";
    const isDeptSupervisor = !isAdmin && (departmentRole === "Supervisor" || normalizedRole === "manager");
    const targetDept = department || (isDeptSupervisor ? supervisorDepartment : null);
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

exports.getPendingReports = async (req, res) => {
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
    // 1. Fetch all attendance records for this employee
    const attendances = await Attendance.findAll({
      where: {
        employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
      },
      order: [["clockInDate", "ASC"], ["id", "ASC"]],
    });

    if (!attendances.length) {
      return res.json({ hasPending: false, pendingCount: 0, nextPending: null, allPending: [] });
    }

    // 2. Fetch all reports already submitted by this employee
    const reports = await Report.findAll({
      where: {
        employeeId,
        companyName: { [Op.iLike]: effectiveCompany },
      },
      attributes: ["id", "date"],
    });

    const submittedDates = new Set(
      reports.map((r) => (r.date ? String(r.date).slice(0, 10) : "")).filter(Boolean)
    );

    // Group attendances by date (since we enforce single shift per day)
    const dateAttendanceMap = new Map();
    for (const att of attendances) {
      const d = att.clockInDate ? String(att.clockInDate).slice(0, 10) : null;
      if (d && !dateAttendanceMap.has(d)) {
        dateAttendanceMap.set(d, att);
      }
    }

    // 3. Find pending dates that do not have a report
    const allPending = [];
    for (const [dateStr, att] of dateAttendanceMap.entries()) {
      if (!submittedDates.has(dateStr)) {
        let hours = 0;
        if (att.workedTime) {
          const parts = String(att.workedTime).split(":").map(Number);
          if (parts.length >= 2 && parts.every((n) => !isNaN(n))) {
            hours = Math.round((parts[0] + parts[1] / 60 + (parts[2] || 0) / 3600) * 100) / 100;
          }
        }

        allPending.push({
          date: dateStr,
          attendanceId: att.id,
          clockInTime: att.clockInTime,
          clockOutTime: att.clockOutTime,
          workedTime: att.workedTime,
          hoursWorked: hours,
          isCompletedShift: Boolean(att.clockOutTime),
        });
      }
    }

    // Sort ascending: oldest date first
    allPending.sort((a, b) => (a.date > b.date ? 1 : a.date < b.date ? -1 : 0));

    const hasPending = allPending.length > 0;
    const nextPending = hasPending ? allPending[0] : null;

    res.json({
      hasPending,
      pendingCount: allPending.length,
      nextPending,
      allPending,
    });
  } catch (error) {
    console.error("Error fetching pending reports:", error);
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

  if (!date) {
    return res
      .status(400)
      .json({ error: "Date is required" });
  }

  const effectiveTaskName = (taskName && String(taskName).trim()) || "Daily Work Report";

  try {
    // Enforcement 1: Employee must have clocked in on that date to submit a work report!
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

      // Enforcement 2: Sequential Report Submission.
      // If there are unsubmitted reports for older clocked-in dates, require submitting them first!
      const olderAttendances = await Attendance.findAll({
        where: {
          employeeId,
          companyName: { [Op.iLike]: effectiveCompany },
          clockInDate: { [Op.lt]: date },
        },
        order: [["clockInDate", "ASC"]],
      });

      if (olderAttendances.length > 0) {
        const olderDates = Array.from(
          new Set(olderAttendances.map((a) => String(a.clockInDate).slice(0, 10)))
        ).sort();

        const olderReports = await Report.findAll({
          where: {
            employeeId,
            companyName: { [Op.iLike]: effectiveCompany },
            date: { [Op.in]: olderDates },
          },
          attributes: ["date"],
        });

        const submittedOlderDates = new Set(
          olderReports.map((r) => String(r.date).slice(0, 10))
        );

        const firstUnsubmittedOlderDate = olderDates.find(
          (d) => !submittedOlderDates.has(d)
        );

        if (firstUnsubmittedOlderDate) {
          return res.status(400).json({
            error: `You have an unsubmitted work report for ${firstUnsubmittedOlderDate}. You must submit that earlier report first before submitting for ${date}.`,
            olderPendingDate: firstUnsubmittedOlderDate,
          });
        }
      }
    }

    let effectiveHoursWorked = Number(hoursWorked) || 0;
    if (!effectiveHoursWorked && attendanceRecord?.workedTime) {
      const parts = String(attendanceRecord.workedTime).split(":").map(Number);
      if (parts.length >= 2 && parts.every((n) => !isNaN(n))) {
        effectiveHoursWorked = Math.round((parts[0] + parts[1] / 60 + (parts[2] || 0) / 3600) * 100) / 100;
      }
    }

    const report = await Report.create({
      employeeId,
      employeeName,
      department,
      date,
      taskName: effectiveTaskName,
      workDescription,
      hoursWorked: effectiveHoursWorked,
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