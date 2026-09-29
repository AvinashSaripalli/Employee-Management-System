const { Shift, ShiftSchedule, User } = require("../models");
const { logAuditEvent } = require("../utils/auditLogger");
const { Op } = require("sequelize");

const DEFAULT_SHIFTS = [
  {
    name: "General Shift",
    code: "GS",
    startTime: "09:00",
    endTime: "18:00",
    graceMinutes: 15,
    halfDayHours: 4.0,
    fullDayHours: 8.0,
    color: "#14286D",
    isDefault: true,
  },
  {
    name: "Morning Shift",
    code: "MS",
    startTime: "07:00",
    endTime: "16:00",
    graceMinutes: 15,
    halfDayHours: 4.0,
    fullDayHours: 8.0,
    color: "#059669",
    isDefault: false,
  },
  {
    name: "Evening Shift",
    code: "ES",
    startTime: "14:00",
    endTime: "23:00",
    graceMinutes: 15,
    halfDayHours: 4.0,
    fullDayHours: 8.0,
    color: "#7C3AED",
    isDefault: false,
  },
  {
    name: "Night Shift",
    code: "NS",
    startTime: "22:00",
    endTime: "07:00",
    graceMinutes: 15,
    halfDayHours: 4.0,
    fullDayHours: 8.0,
    color: "#D97706",
    isDefault: false,
  },
];

// Helper to auto-seed default shifts if none exist
const ensureDefaultShifts = async (companyName) => {
  const count = await Shift.count({ where: { companyName } });
  if (count === 0) {
    for (const s of DEFAULT_SHIFTS) {
      await Shift.create({ ...s, companyName });
    }
  }
};

// 1. Get all shifts for company
exports.getShifts = async (req, res) => {
  try {
    const companyName = req.query.companyName || req.user?.companyName || "KN Advisors";
    await ensureDefaultShifts(companyName);

    const shifts = await Shift.findAll({
      where: { companyName },
      order: [["isDefault", "DESC"], ["startTime", "ASC"]],
    });

    return res.status(200).json({ shifts });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return res.status(500).json({ error: "Failed to fetch shifts", details: error.message });
  }
};

// 2. Create shift
exports.createShift = async (req, res) => {
  try {
    const companyName = req.user?.companyName || req.body.companyName || "KN Advisors";
    const { name, code, startTime, endTime, graceMinutes, halfDayHours, fullDayHours, color, isDefault } = req.body;

    if (!name || !startTime || !endTime) {
      return res.status(400).json({ error: "Name, start time, and end time are required." });
    }

    if (isDefault) {
      await Shift.update({ isDefault: false }, { where: { companyName } });
    }

    const shift = await Shift.create({
      name: name.trim(),
      code: (code || name.slice(0, 2)).toUpperCase().trim(),
      startTime,
      endTime,
      graceMinutes: graceMinutes !== undefined ? parseInt(graceMinutes, 10) : 15,
      halfDayHours: halfDayHours ? parseFloat(halfDayHours) : 4.0,
      fullDayHours: fullDayHours ? parseFloat(fullDayHours) : 8.0,
      color: color || "#14286D",
      isDefault: !!isDefault,
      companyName,
    });

    await logAuditEvent({
      req,
      action: "SHIFT_CREATED",
      targetType: "SHIFT",
      targetId: shift.id,
      targetName: `${shift.name} (${shift.code})`,
      details: { startTime, endTime, graceMinutes: shift.graceMinutes },
      companyName,
    });

    return res.status(201).json({ message: "Shift created successfully", shift });
  } catch (error) {
    console.error("Error creating shift:", error);
    return res.status(500).json({ error: "Failed to create shift", details: error.message });
  }
};

// 3. Update shift
exports.updateShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await Shift.findByPk(id);
    if (!shift) {
      return res.status(404).json({ error: "Shift not found" });
    }

    const { name, code, startTime, endTime, graceMinutes, halfDayHours, fullDayHours, color, isDefault } = req.body;

    if (isDefault && !shift.isDefault) {
      await Shift.update({ isDefault: false }, { where: { companyName: shift.companyName } });
    }

    if (name) shift.name = name.trim();
    if (code) shift.code = code.toUpperCase().trim();
    if (startTime) shift.startTime = startTime;
    if (endTime) shift.endTime = endTime;
    if (graceMinutes !== undefined) shift.graceMinutes = parseInt(graceMinutes, 10);
    if (halfDayHours !== undefined) shift.halfDayHours = parseFloat(halfDayHours);
    if (fullDayHours !== undefined) shift.fullDayHours = parseFloat(fullDayHours);
    if (color) shift.color = color;
    if (isDefault !== undefined) shift.isDefault = !!isDefault;

    await shift.save();

    await logAuditEvent({
      req,
      action: "SHIFT_UPDATED",
      targetType: "SHIFT",
      targetId: shift.id,
      targetName: `${shift.name} (${shift.code})`,
      details: { startTime: shift.startTime, endTime: shift.endTime },
      companyName: shift.companyName,
    });

    return res.status(200).json({ message: "Shift updated successfully", shift });
  } catch (error) {
    console.error("Error updating shift:", error);
    return res.status(500).json({ error: "Failed to update shift", details: error.message });
  }
};

// 4. Delete shift
exports.deleteShift = async (req, res) => {
  try {
    const { id } = req.params;
    const shift = await Shift.findByPk(id);
    if (!shift) {
      return res.status(404).json({ error: "Shift not found" });
    }

    const activeAssignments = await ShiftSchedule.count({ where: { shiftId: id } });
    if (activeAssignments > 0) {
      return res.status(400).json({
        error: `Cannot delete shift '${shift.name}'. It is currently assigned in ${activeAssignments} roster schedule(s).`,
      });
    }

    const shiftName = shift.name;
    const company = shift.companyName;
    await shift.destroy();

    await logAuditEvent({
      req,
      action: "SHIFT_DELETED",
      targetType: "SHIFT",
      targetId: id,
      targetName: shiftName,
      companyName: company,
    });

    return res.status(200).json({ message: `Shift '${shiftName}' deleted successfully.` });
  } catch (error) {
    console.error("Error deleting shift:", error);
    return res.status(500).json({ error: "Failed to delete shift", details: error.message });
  }
};

// 5. Get Roster Matrix for date range
exports.getRoster = async (req, res) => {
  try {
    const companyName = req.query.companyName || req.user?.companyName || "KN Advisors";
    const { from, to, department, employeeId } = req.query;

    if (!from || !to) {
      return res.status(400).json({ error: "From and To dates (YYYY-MM-DD) are required." });
    }

    const where = {
      companyName,
      date: {
        [Op.between]: [from, to],
      },
    };

    if (department && department !== "all") where.department = department;
    if (employeeId) where.employeeId = employeeId;

    const schedules = await ShiftSchedule.findAll({
      where,
      include: [
        {
          model: Shift,
          as: "shift",
          attributes: ["id", "name", "code", "startTime", "endTime", "color", "graceMinutes"],
        },
      ],
      order: [["date", "ASC"]],
    });

    // Build structured lookup map: { [employeeId]: { [date]: schedule } }
    const rosterMap = {};
    for (const s of schedules) {
      if (!rosterMap[s.employeeId]) {
        rosterMap[s.employeeId] = {};
      }
      rosterMap[s.employeeId][s.date] = {
        id: s.id,
        shiftId: s.shiftId,
        shift: s.shift,
        isWeeklyOff: s.isWeeklyOff,
        notes: s.notes,
      };
    }

    return res.status(200).json({
      from,
      to,
      schedules,
      rosterMap,
    });
  } catch (error) {
    console.error("Error fetching roster:", error);
    return res.status(500).json({ error: "Failed to fetch roster", details: error.message });
  }
};

// 6. Get my schedule
exports.getMySchedule = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId || req.query.employeeId;
    const companyName = req.user?.companyName || req.query.companyName || "KN Advisors";
    const { from, to } = req.query;

    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required." });
    }

    const today = new Date();
    const defaultFrom = from || new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
    const defaultTo = to || new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

    const schedules = await ShiftSchedule.findAll({
      where: {
        employeeId,
        companyName,
        date: {
          [Op.between]: [defaultFrom, defaultTo],
        },
      },
      include: [
        {
          model: Shift,
          as: "shift",
          attributes: ["id", "name", "code", "startTime", "endTime", "color", "graceMinutes"],
        },
      ],
      order: [["date", "ASC"]],
    });

    return res.status(200).json({
      employeeId,
      from: defaultFrom,
      to: defaultTo,
      schedules,
    });
  } catch (error) {
    console.error("Error fetching my schedule:", error);
    return res.status(500).json({ error: "Failed to fetch schedule", details: error.message });
  }
};

// 7. Assign single or multi-date roster
exports.assignRoster = async (req, res) => {
  try {
    const companyName = req.user?.companyName || req.body.companyName || "KN Advisors";
    const { employeeId, dates, shiftId, isWeeklyOff, notes } = req.body;

    if (!employeeId || !dates || !Array.isArray(dates) || dates.length === 0) {
      return res.status(400).json({ error: "employeeId and a non-empty dates array are required." });
    }

    const user = await User.findOne({ where: { employeeId } });
    const employeeName = user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : employeeId;
    const department = user?.department || "General";

    const results = [];
    for (const date of dates) {
      let schedule = await ShiftSchedule.findOne({
        where: { employeeId, date, companyName },
      });

      if (schedule) {
        schedule.shiftId = isWeeklyOff ? null : shiftId;
        schedule.isWeeklyOff = !!isWeeklyOff;
        if (notes !== undefined) schedule.notes = notes;
        await schedule.save();
      } else {
        schedule = await ShiftSchedule.create({
          employeeId,
          employeeName,
          department,
          companyName,
          shiftId: isWeeklyOff ? null : shiftId,
          date,
          isWeeklyOff: !!isWeeklyOff,
          notes,
        });
      }
      results.push(schedule);
    }

    await logAuditEvent({
      req,
      action: "ROSTER_ASSIGNED",
      targetType: "SHIFT_SCHEDULE",
      targetEmployeeId: employeeId,
      targetName: employeeName,
      details: { datesCount: dates.length, shiftId, isWeeklyOff },
      companyName,
    });

    return res.status(200).json({
      message: `Roster updated for ${dates.length} date(s).`,
      count: results.length,
    });
  } catch (error) {
    console.error("Error assigning roster:", error);
    return res.status(500).json({ error: "Failed to assign roster", details: error.message });
  }
};

// 8. Bulk recurring roster assignment (e.g. Mon-Fri General Shift, Sat-Sun Weekly Off)
exports.bulkRosterAssign = async (req, res) => {
  try {
    const companyName = req.user?.companyName || req.body.companyName || "KN Advisors";
    const { department, employeeIds, startDate, endDate, weekdayShiftId, weeklyOffDays = [0, 6] } = req.body;

    if (!startDate || !endDate || !weekdayShiftId) {
      return res.status(400).json({ error: "startDate, endDate, and weekdayShiftId are required." });
    }

    let targetUsers = [];
    if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
      targetUsers = await User.findAll({ where: { employeeId: { [Op.in]: employeeIds }, companyName, exists: 1 } });
    } else if (department && department !== "all") {
      targetUsers = await User.findAll({ where: { department, companyName, exists: 1 } });
    } else {
      targetUsers = await User.findAll({ where: { companyName, exists: 1 } });
    }

    if (targetUsers.length === 0) {
      return res.status(400).json({ error: "No matching employees found for roster assignment." });
    }

    // Build dates array
    const dates = [];
    const curr = new Date(startDate);
    const last = new Date(endDate);
    while (curr <= last) {
      dates.push(new Date(curr));
      curr.setDate(curr.getDate() + 1);
    }

    let totalUpdated = 0;
    for (const u of targetUsers) {
      const empName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
      const empDept = u.department || "General";

      for (const d of dates) {
        const dateStr = d.toISOString().split("T")[0];
        const dayOfWeek = d.getDay(); // 0 = Sunday, 6 = Saturday
        const isOff = weeklyOffDays.includes(dayOfWeek);

        let schedule = await ShiftSchedule.findOne({
          where: { employeeId: u.employeeId, date: dateStr, companyName },
        });

        if (schedule) {
          schedule.shiftId = isOff ? null : weekdayShiftId;
          schedule.isWeeklyOff = isOff;
          await schedule.save();
        } else {
          await ShiftSchedule.create({
            employeeId: u.employeeId,
            employeeName: empName,
            department: empDept,
            companyName,
            shiftId: isOff ? null : weekdayShiftId,
            date: dateStr,
            isWeeklyOff: isOff,
          });
        }
        totalUpdated++;
      }
    }

    await logAuditEvent({
      req,
      action: "BULK_ROSTER_ASSIGNED",
      targetType: "SHIFT_SCHEDULE",
      details: {
        employeesCount: targetUsers.length,
        startDate,
        endDate,
        weekdayShiftId,
        weeklyOffDays,
        totalDaysPerEmployee: dates.length,
      },
      companyName,
    });

    return res.status(200).json({
      message: `Bulk roster successfully assigned to ${targetUsers.length} employee(s) across ${dates.length} days (${totalUpdated} total shift allocations).`,
      employeesCount: targetUsers.length,
      totalUpdated,
    });
  } catch (error) {
    console.error("Error bulk assigning roster:", error);
    return res.status(500).json({ error: "Failed to bulk assign roster", details: error.message });
  }
};
