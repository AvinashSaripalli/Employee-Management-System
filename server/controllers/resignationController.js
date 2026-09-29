const { Resignation, User, Notification, Asset } = require("../models");
const { logAuditEvent } = require("../utils/auditLogger");
const { Op } = require("sequelize");

// 1. Employee submits resignation
exports.submitResignation = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId || req.body.employeeId;
    const companyName = req.user?.companyName || req.body.companyName || "KN Advisors";
    const {
      resignationDate,
      requestedLastWorkingDay,
      reason,
      personalEmail,
      contactNumber,
      department,
      designation,
    } = req.body;

    if (!employeeId || !resignationDate || !requestedLastWorkingDay || !reason) {
      return res.status(400).json({
        error: "Employee ID, Resignation Date, Requested Last Working Day, and Reason are required.",
      });
    }

    // Check existing active resignation
    const existing = await Resignation.findOne({
      where: {
        employeeId,
        status: {
          [Op.in]: ["Submitted", "Under Review", "Approved", "Clearance in Progress"],
        },
      },
    });

    if (existing) {
      return res.status(400).json({
        error: "You already have an active resignation in progress. Contact HR if you need changes.",
      });
    }

    // Get user info
    const user = await User.findOne({ where: { employeeId } });
    const employeeName = user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim()
      : req.body.employeeName || employeeId;
    const empDept = department || user?.department || "General";
    const empDesig = designation || user?.designation || "Staff";

    // Calculate days between resignationDate and requestedLastWorkingDay
    const d1 = new Date(resignationDate);
    const d2 = new Date(requestedLastWorkingDay);
    const diffTime = d2.getTime() - d1.getTime();
    const noticePeriodDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    const record = await Resignation.create({
      employeeId,
      employeeName,
      department: empDept,
      designation: empDesig,
      companyName,
      resignationDate,
      requestedLastWorkingDay,
      approvedLastWorkingDay: requestedLastWorkingDay,
      noticePeriodDays,
      reason,
      personalEmail: personalEmail || user?.email || null,
      contactNumber: contactNumber || user?.phoneNumber || null,
      status: "Submitted",
      managerApprovalStatus: "Pending",
      hrApprovalStatus: "Pending",
      itClearance: "Pending",
      financeClearance: "Pending",
      adminClearance: "Pending",
    });

    await logAuditEvent({
      req,
      action: "RESIGNATION_SUBMITTED",
      targetType: "RESIGNATION",
      targetId: record.id,
      targetEmployeeId: employeeId,
      targetName: employeeName,
      details: {
        resignationDate,
        requestedLastWorkingDay,
        noticePeriodDays,
      },
      companyName,
    });

    return res.status(201).json({
      message: "Resignation submitted successfully. It has been routed to your reporting manager and HR.",
      resignation: record,
    });
  } catch (error) {
    console.error("Error submitting resignation:", error);
    return res.status(500).json({ error: "Failed to submit resignation", details: error.message });
  }
};

// 2. Get my resignation (Employee self-service)
exports.getMyResignation = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId || req.query.employeeId;
    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required." });
    }

    const record = await Resignation.findOne({
      where: { employeeId },
      order: [["createdAt", "DESC"]],
    });

    // Also fetch any currently assigned company assets to display return checklist
    const assignedAssets = await Asset.findAll({
      where: { assignedToEmployeeId: employeeId, status: "Assigned" },
      attributes: ["id", "assetTag", "name", "category", "serialNumber"],
    });

    return res.status(200).json({
      resignation: record,
      assignedAssets,
    });
  } catch (error) {
    console.error("Error fetching my resignation:", error);
    return res.status(500).json({ error: "Failed to fetch resignation details", details: error.message });
  }
};

// 3. Get all resignations (HR / Admin / Supervisor queue)
exports.getResignations = async (req, res) => {
  try {
    const { companyName, status, department, search } = req.query;
    const effectiveCompany = companyName || req.user?.companyName || "KN Advisors";

    const where = {};
    if (effectiveCompany) where.companyName = effectiveCompany;
    if (status) where.status = status;
    if (department) where.department = department;

    if (search) {
      where[Op.or] = [
        { employeeId: { [Op.like]: `%${search}%` } },
        { employeeName: { [Op.like]: `%${search}%` } },
        { department: { [Op.like]: `%${search}%` } },
      ];
    }

    const resignations = await Resignation.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    const metrics = {
      total: resignations.length,
      pendingApproval: resignations.filter(
        (r) => r.status === "Submitted" || r.status === "Under Review"
      ).length,
      clearanceInProgress: resignations.filter((r) => r.status === "Clearance in Progress").length,
      completed: resignations.filter((r) => r.status === "Completed").length,
    };

    return res.status(200).json({
      metrics,
      resignations,
    });
  } catch (error) {
    console.error("Error fetching resignations:", error);
    return res.status(500).json({ error: "Failed to fetch resignations", details: error.message });
  }
};

// 4. Manager review
exports.managerReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, comments, approvedLastWorkingDay } = req.body; // 'Approved' or 'Rejected'

    const record = await Resignation.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: "Resignation record not found." });
    }

    record.managerApprovalStatus = decision;
    record.managerComments = comments || null;
    record.managerDecisionDate = new Date();

    if (decision === "Approved") {
      record.status = "Under Review";
      if (approvedLastWorkingDay) record.approvedLastWorkingDay = approvedLastWorkingDay;
    } else {
      record.status = "Rejected";
    }

    await record.save();

    await logAuditEvent({
      req,
      action: `RESIGNATION_MANAGER_${decision.toUpperCase()}`,
      targetType: "RESIGNATION",
      targetId: record.id,
      targetEmployeeId: record.employeeId,
      targetName: record.employeeName,
      details: { decision, comments, approvedLastWorkingDay },
      companyName: record.companyName,
    });

    try {
      await Notification.create({
        recipientId: record.employeeId,
        title: `Resignation Manager Review: ${decision}`,
        message: `Your manager has marked your resignation as ${decision}. ${comments ? `Notes: ${comments}` : ""}`,
        type: "RESIGNATION",
        priority: "high",
        companyName: record.companyName,
      });
    } catch (e) {
      console.warn("Could not dispatch resignation review notification:", e.message);
    }

    return res.status(200).json({
      message: `Resignation ${decision.toLowerCase()} by manager`,
      resignation: record,
    });
  } catch (error) {
    console.error("Error in manager review:", error);
    return res.status(500).json({ error: "Failed to process manager review", details: error.message });
  }
};

// 5. HR final review
exports.hrReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, comments, approvedLastWorkingDay } = req.body; // 'Approved' or 'Rejected'

    const record = await Resignation.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: "Resignation record not found." });
    }

    record.hrApprovalStatus = decision;
    record.hrComments = comments || null;
    record.hrDecisionDate = new Date();

    if (decision === "Approved") {
      record.status = "Clearance in Progress";
      if (approvedLastWorkingDay) record.approvedLastWorkingDay = approvedLastWorkingDay;
    } else {
      record.status = "Rejected";
    }

    await record.save();

    await logAuditEvent({
      req,
      action: `RESIGNATION_HR_${decision.toUpperCase()}`,
      targetType: "RESIGNATION",
      targetId: record.id,
      targetEmployeeId: record.employeeId,
      targetName: record.employeeName,
      details: { decision, comments, approvedLastWorkingDay: record.approvedLastWorkingDay },
      companyName: record.companyName,
    });

    try {
      await Notification.create({
        recipientId: record.employeeId,
        title: `Resignation HR Approved`,
        message: `Your resignation has been approved. Your official last working day is ${record.approvedLastWorkingDay}. Please complete your clearance checklist.`,
        type: "RESIGNATION",
        priority: "high",
        companyName: record.companyName,
      });
    } catch (e) {
      console.warn("Could not dispatch resignation review notification:", e.message);
    }

    return res.status(200).json({
      message: `Resignation ${decision.toLowerCase()} by HR`,
      resignation: record,
    });
  } catch (error) {
    console.error("Error in HR review:", error);
    return res.status(500).json({ error: "Failed to process HR review", details: error.message });
  }
};

// 6. Update clearance item (IT, Finance, Admin, Exit Interview, Relieving Letter)
exports.updateClearance = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      clearanceType, // 'it', 'finance', 'admin', 'exitInterview', 'relievingLetter'
      status, // 'Cleared', 'Pending', true, false
      notes,
      feedback,
    } = req.body;

    const record = await Resignation.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: "Resignation record not found." });
    }

    const reviewerName = req.user
      ? `${req.user.firstName || ""} ${req.user.lastName || ""}`.trim()
      : "Admin / HR";

    if (clearanceType === "it") {
      record.itClearance = status;
      record.itClearedBy = reviewerName;
      if (notes !== undefined) record.itClearanceNotes = notes;
    } else if (clearanceType === "finance") {
      record.financeClearance = status;
      record.financeClearedBy = reviewerName;
      if (notes !== undefined) record.financeClearanceNotes = notes;
    } else if (clearanceType === "admin") {
      record.adminClearance = status;
      record.adminClearedBy = reviewerName;
      if (notes !== undefined) record.adminClearanceNotes = notes;
    } else if (clearanceType === "exitInterview") {
      record.exitInterviewDone = !!status;
      if (feedback !== undefined) record.exitInterviewFeedback = feedback;
    } else if (clearanceType === "relievingLetter") {
      record.relievingLetterIssued = !!status;
    }

    // Auto-complete check: if IT, Finance, Admin are Cleared
    if (
      record.itClearance === "Cleared" &&
      record.financeClearance === "Cleared" &&
      record.adminClearance === "Cleared" &&
      record.status === "Clearance in Progress"
    ) {
      record.status = "Completed";
    }

    await record.save();

    await logAuditEvent({
      req,
      action: "OFFBOARDING_CLEARANCE_UPDATED",
      targetType: "RESIGNATION",
      targetId: record.id,
      targetEmployeeId: record.employeeId,
      targetName: record.employeeName,
      details: { clearanceType, status, notes, updatedStatus: record.status },
      companyName: record.companyName,
    });

    return res.status(200).json({
      message: `Clearance for ${clearanceType.toUpperCase()} updated successfully.`,
      resignation: record,
    });
  } catch (error) {
    console.error("Error updating clearance:", error);
    return res.status(500).json({ error: "Failed to update clearance", details: error.message });
  }
};

// 7. Withdraw resignation (Employee)
exports.withdrawResignation = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user?.employeeId;

    const record = await Resignation.findByPk(id);
    if (!record) {
      return res.status(404).json({ error: "Resignation record not found." });
    }

    if (employeeId && record.employeeId !== employeeId && req.user.role !== "Admin") {
      return res.status(403).json({ error: "You can only withdraw your own resignation." });
    }

    if (record.status === "Completed") {
      return res.status(400).json({ error: "Cannot withdraw a completed resignation/offboarding." });
    }

    record.status = "Withdrawn";
    await record.save();

    await logAuditEvent({
      req,
      action: "RESIGNATION_WITHDRAWN",
      targetType: "RESIGNATION",
      targetId: record.id,
      targetEmployeeId: record.employeeId,
      targetName: record.employeeName,
      details: { reason: "Employee requested withdrawal" },
      companyName: record.companyName,
    });

    return res.status(200).json({
      message: "Resignation withdrawn successfully.",
      resignation: record,
    });
  } catch (error) {
    console.error("Error withdrawing resignation:", error);
    return res.status(500).json({ error: "Failed to withdraw resignation", details: error.message });
  }
};
