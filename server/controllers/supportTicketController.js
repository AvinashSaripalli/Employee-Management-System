const { SupportTicket, Asset, User, Notification, HelpdeskSetting } = require("../models");
const { Op } = require("sequelize");
const { logAuditEvent } = require("../utils/auditLogger");
const { dispatchNotification, notifyAdminsAndSupervisors } = require("../utils/notificationDispatcher");

// Helper to generate unique human-readable ticket number (e.g. REQ-2026-0001)
const generateTicketNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `REQ-${currentYear}-`;

  const latestTicket = await SupportTicket.findOne({
    where: {
      ticketNumber: { [Op.like]: `${prefix}%` },
    },
    order: [["id", "DESC"]],
    attributes: ["ticketNumber"],
  });

  let nextSeq = 1;
  if (latestTicket?.ticketNumber) {
    const parts = latestTicket.ticketNumber.split("-");
    const lastNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastNum)) {
      nextSeq = lastNum + 1;
    }
  }

  let candidate = `${prefix}${String(nextSeq).padStart(4, "0")}`;
  let exists = await SupportTicket.findOne({ where: { ticketNumber: candidate } });
  while (exists) {
    nextSeq++;
    candidate = `${prefix}${String(nextSeq).padStart(4, "0")}`;
    exists = await SupportTicket.findOne({ where: { ticketNumber: candidate } });
  }

  return candidate;
};

// 1. Submit a new support ticket / service request
exports.createTicket = async (req, res) => {
  try {
    const {
      category, // 'IT_SUPPORT', 'ASSET_REQUEST', 'HR_REQUEST', 'FACILITY'
      subCategory,
      title,
      description,
      priority, // 'Low', 'Medium', 'High', 'Critical'
      targetAssetCategory,
      employeeId: bodyEmployeeId,
      employeeName: bodyEmployeeName,
      department: bodyDepartment,
      companyName: bodyCompanyName,
    } = req.body;

    const actor = req.user;
    const effectiveEmployeeId = actor?.employeeId || bodyEmployeeId;
    const effectiveCompanyName = actor?.companyName || bodyCompanyName || "KN Advisors";
    const effectiveDepartment = actor?.department || bodyDepartment || "General";

    let effectiveName = bodyEmployeeName;
    if (!effectiveName && actor) {
      const actorFullName = `${actor.firstName || ""} ${actor.lastName || ""}`.trim();
      if (actorFullName) {
        effectiveName = actorFullName;
      } else if (actor.id || actor.employeeId) {
        const userRec = await User.findOne({
          where: actor.id ? { id: actor.id } : { employeeId: actor.employeeId },
          attributes: ["firstName", "lastName", "email"],
        });
        if (userRec) {
          effectiveName = `${userRec.firstName || ""} ${userRec.lastName || ""}`.trim() || userRec.email;
        }
      }
    }
    if (!effectiveName) {
      effectiveName = effectiveEmployeeId ? `Employee (${effectiveEmployeeId})` : "Employee";
    }

    if (!title || !description) {
      return res.status(400).json({ error: "Title and description are required." });
    }

    if (!effectiveEmployeeId) {
      return res.status(400).json({ error: "Employee ID is required." });
    }

    const ticketNumber = await generateTicketNumber(effectiveCompanyName);

    // Check configured approvers & routing settings
    let assignedApprover = null;
    let initialStatus = "Open";

    try {
      const setting = await HelpdeskSetting.findOne({
        where: { companyName: { [Op.iLike]: effectiveCompanyName } },
      });

      if (setting) {
        let approverId = null;
        const cat = category || "IT_SUPPORT";
        if (cat === "IT_SUPPORT") approverId = setting.itApproverId;
        else if (cat === "ASSET_REQUEST") approverId = setting.assetApproverId;
        else if (cat === "HR_REQUEST") approverId = setting.hrApproverId;
        else if (cat === "FACILITY") approverId = setting.facilityApproverId;

        if (approverId && setting.autoAssignEnabled) {
          const approverUser = await User.findByPk(approverId, {
            attributes: ["id", "employeeId", "firstName", "lastName", "email"],
          });
          if (approverUser) {
            assignedApprover = {
              id: approverUser.id,
              employeeId: approverUser.employeeId,
              name: `${approverUser.firstName || ""} ${approverUser.lastName || ""}`.trim() || approverUser.email,
            };
          }
        }

        if (setting.requireSupervisorApproval) {
          initialStatus = "Waiting on Supervisor";
        }
      }
    } catch (settingErr) {
      console.warn("Could not resolve HelpdeskSetting during createTicket:", settingErr.message);
    }

    const ticket = await SupportTicket.create({
      ticketNumber,
      category: category || "IT_SUPPORT",
      subCategory: subCategory || null,
      title: title.trim(),
      description: description.trim(),
      priority: priority || "Medium",
      status: initialStatus,
      employeeId: effectiveEmployeeId,
      employeeName: effectiveName,
      department: effectiveDepartment,
      companyName: effectiveCompanyName,
      targetAssetCategory: targetAssetCategory || null,
      assignedToId: assignedApprover ? assignedApprover.id : null,
      assignedToName: assignedApprover ? assignedApprover.name : null,
    });

    // Audit Logging
    await logAuditEvent({
      req,
      action: "TICKET_CREATED",
      targetType: "SupportTicket",
      targetId: String(ticket.id),
      targetEmployeeId: ticket.employeeId,
      targetName: ticket.employeeName,
      companyName: effectiveCompanyName,
      details: `Created ${ticket.category} ticket #${ticket.ticketNumber} [${ticket.priority}]: "${ticket.title}"${assignedApprover ? ` (Auto-assigned to ${assignedApprover.name})` : ""}`,
    });

    // If auto-assigned to designated category approver, dispatch direct notification
    if (assignedApprover?.employeeId) {
      dispatchNotification(req.app, {
        recipientId: assignedApprover.employeeId,
        senderId: effectiveEmployeeId,
        senderName: effectiveName,
        companyName: effectiveCompanyName,
        category: "helpdesk",
        type: "ticket_assigned",
        title: `Assigned: #${ticket.ticketNumber} [${ticket.priority}]`,
        message: `${effectiveName} (${effectiveDepartment}) submitted ${ticket.category.replace(/_/g, " ")}: "${ticket.title}". You are assigned as lead approver.`,
        severity: ticket.priority === "Critical" ? "urgent" : "action",
        target: "Helpdesk & Requests",
        targetId: ticket.id,
        actionLabel: "Review Request",
      });
    }

    // Dispatch broadcast notification to Admins, HR, and IT department staff
    notifyAdminsAndSupervisors(req.app, {
      department: ticket.category === "IT_SUPPORT" || ticket.category === "ASSET_REQUEST" ? "IT Department" : ticket.department,
      companyName: effectiveCompanyName,
      excludeEmployeeId: effectiveEmployeeId,
      senderId: effectiveEmployeeId,
      senderName: effectiveName,
      category: "helpdesk",
      type: "ticket_created",
      title: `New ${ticket.category.replace(/_/g, " ")}: #${ticket.ticketNumber}`,
      message: `${effectiveName} (${effectiveDepartment}) submitted #${ticket.ticketNumber}: "${ticket.title}" [${ticket.priority}].`,
      severity: ticket.priority === "Critical" ? "urgent" : "action",
      target: "Helpdesk & Requests",
      targetId: ticket.id,
      actionLabel: "View Ticket",
    });

    return res.status(201).json({
      message: `Request #${ticket.ticketNumber} submitted successfully.`,
      ticket,
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return res.status(500).json({ error: "Failed to create request.", details: error.message });
  }
};

// 2. Get list of tickets (role-filtered, status-filtered, search-filtered)
exports.getTickets = async (req, res) => {
  try {
    const {
      companyName,
      category,
      status,
      priority,
      scope, // 'my', 'all', 'assigned'
      search,
    } = req.query;

    const actor = req.user;
    const actorRole = String(actor?.role || "").toLowerCase();
    const actorDeptRole = String(actor?.departmentRole || "").toLowerCase();
    const actorDept = String(actor?.department || "").toLowerCase();
    const actorEmpId = actor?.employeeId;

    const isAdmin = actorRole === "admin" || actorRole === "hr";
    const isITStaff = actorDept.includes("it") || actorDept.includes("tech");
    const isSupervisor = actorDeptRole === "supervisor" || actorRole === "manager";

    const effectiveCompany = companyName || actor?.companyName || "KN Advisors";
    const where = {};

    if (effectiveCompany) {
      where.companyName = { [Op.iLike]: effectiveCompany };
    }

    // Role-based visibility logic:
    if (scope === "my" || (!isAdmin && !isITStaff && !isSupervisor)) {
      // Regular employees only see their own tickets
      where.employeeId = actorEmpId;
    } else if (scope === "assigned") {
      // Assigned to current actor
      where.assignedToId = actor?.id;
    } else if (!isAdmin && isSupervisor && !isITStaff) {
      // Supervisor sees their department's tickets + their own tickets
      where[Op.or] = [
        { department: { [Op.iLike]: actor?.department } },
        { employeeId: actorEmpId },
      ];
    }
    // (Admins & IT staff can see all company tickets by default)

    if (category && category !== "all") {
      where.category = category;
    }

    if (status && status !== "all") {
      where.status = status;
    }

    if (priority && priority !== "all") {
      where.priority = priority;
    }

    if (search) {
      const q = `%${search.trim()}%`;
      where[Op.and] = [
        ...(where[Op.and] || []),
        {
          [Op.or]: [
            { ticketNumber: { [Op.iLike]: q } },
            { title: { [Op.iLike]: q } },
            { description: { [Op.iLike]: q } },
            { employeeName: { [Op.iLike]: q } },
            { employeeId: { [Op.iLike]: q } },
            { subCategory: { [Op.iLike]: q } },
          ],
        },
      ];
    }

    const tickets = await SupportTicket.findAll({
      where,
      include: [
        {
          model: Asset,
          as: "allocatedAsset",
          attributes: ["id", "assetTag", "name", "category", "brand", "model", "serialNumber", "status"],
          required: false,
        },
        {
          model: User,
          as: "assignee",
          attributes: ["id", "firstName", "lastName", "email", "designation", "department"],
          required: false,
        },
      ],
      order: [
        [
          SupportTicket.sequelize.literal(`
            CASE 
              WHEN "SupportTicket"."status" = 'Open' THEN 1
              WHEN "SupportTicket"."status" = 'In Progress' THEN 2
              WHEN "SupportTicket"."status" = 'Waiting on Employee' THEN 3
              WHEN "SupportTicket"."status" = 'Resolved' THEN 4
              ELSE 5
            END
          `),
          "ASC",
        ],
        ["created_at", "DESC"],
      ],
    });

    return res.status(200).json({ tickets });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return res.status(500).json({ error: "Failed to fetch tickets.", details: error.message });
  }
};

// 3. Get single ticket by ID
exports.getTicketById = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await SupportTicket.findByPk(id, {
      include: [
        {
          model: Asset,
          as: "allocatedAsset",
          attributes: ["id", "assetTag", "name", "category", "brand", "model", "serialNumber", "status"],
          required: false,
        },
        {
          model: User,
          as: "assignee",
          attributes: ["id", "firstName", "lastName", "email", "designation", "department"],
          required: false,
        },
      ],
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    return res.status(200).json({ ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return res.status(500).json({ error: "Failed to load ticket details." });
  }
};

// 4. Update ticket status, technician assignment, and resolution notes
exports.updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedToId, resolutionNotes, priority } = req.body;

    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found." });
    }

    const updates = {};
    const now = new Date();

    if (priority) {
      updates.priority = priority;
    }

    if (assignedToId !== undefined) {
      if (assignedToId) {
        const technician = await User.findByPk(assignedToId);
        updates.assignedToId = assignedToId;
        updates.assignedToName = technician
          ? `${technician.firstName || ""} ${technician.lastName || ""}`.trim()
          : "Technician";
        if (ticket.status === "Open") {
          updates.status = "In Progress";
        }
      } else {
        updates.assignedToId = null;
        updates.assignedToName = null;
      }
    }

    if (status) {
      updates.status = status;
      if (status === "Resolved") {
        updates.resolvedAt = now;
      } else if (status === "Closed") {
        updates.closedAt = now;
      }
    }

    if (resolutionNotes !== undefined) {
      updates.resolutionNotes = resolutionNotes ? String(resolutionNotes).trim() : null;
    }

    await ticket.update(updates);

    // Audit Logging
    await logAuditEvent({
      req,
      action: "TICKET_UPDATED",
      targetType: "SupportTicket",
      targetId: String(ticket.id),
      targetEmployeeId: ticket.employeeId,
      targetName: ticket.employeeName,
      companyName: ticket.companyName,
      details: `Updated ticket #${ticket.ticketNumber} to status '${ticket.status}'${ticket.assignedToName ? ` (Assigned to: ${ticket.assignedToName})` : ""}${updates.resolutionNotes ? `. Notes: ${updates.resolutionNotes}` : ""}`,
    });

    // Notify ticket requester
    dispatchNotification(req.app, {
      recipientId: ticket.employeeId,
      senderId: req.user?.employeeId,
      senderName: req.user ? (`${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || req.user.email || req.user.employeeId || "Helpdesk") : "Helpdesk",
      companyName: ticket.companyName,
      category: "helpdesk",
      type: "ticket_updated",
      title: `Update on #${ticket.ticketNumber}`,
      message: `Your ticket #${ticket.ticketNumber} ("${ticket.title}") is now ${ticket.status}.${updates.resolutionNotes ? ` Resolution: "${updates.resolutionNotes}"` : ""}`,
      severity: ticket.status === "Resolved" ? "success" : "info",
      target: "Helpdesk & Requests",
      targetId: ticket.id,
      actionLabel: "View Details",
    });

    return res.status(200).json({
      message: `Ticket #${ticket.ticketNumber} updated successfully.`,
      ticket,
    });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return res.status(500).json({ error: "Failed to update ticket.", details: error.message });
  }
};

// 5. Approve & Allocate Company Asset to Employee
exports.approveAssetAllocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { assetId, notes } = req.body;

    const ticket = await SupportTicket.findByPk(id);
    if (!ticket) {
      return res.status(404).json({ error: "Request not found." });
    }

    if (ticket.category !== "ASSET_REQUEST") {
      return res.status(400).json({ error: "This request is not an asset requisition." });
    }

    if (!assetId) {
      return res.status(400).json({ error: "Please select an available asset to allocate." });
    }

    const asset = await Asset.findByPk(assetId);
    if (!asset) {
      return res.status(404).json({ error: "Selected asset does not exist." });
    }

    if (asset.status === "Assigned") {
      return res.status(400).json({
        error: `Asset '${asset.name}' (${asset.assetTag}) is already assigned to ${asset.assignedToName}.`,
      });
    }

    const todayStr = new Date().toISOString().slice(0, 10);

    // 1. Assign Asset in Asset Inventory
    await asset.update({
      status: "Assigned",
      assignedToEmployeeId: ticket.employeeId,
      assignedToName: ticket.employeeName,
      assignedToDepartment: ticket.department,
      assignedDate: todayStr,
      notes: notes ? `${asset.notes ? asset.notes + " | " : ""}${notes}` : asset.notes,
    });

    // 2. Mark Ticket as Resolved with Allocated Asset Link
    await ticket.update({
      allocatedAssetId: asset.id,
      status: "Resolved",
      resolutionNotes: notes || `Allocated asset ${asset.name} (${asset.assetTag}) to ${ticket.employeeName}.`,
      resolvedAt: new Date(),
    });

    // 3. Audit Logging
    await logAuditEvent({
      req,
      action: "ASSET_REQUEST_ALLOCATED",
      targetType: "SupportTicket",
      targetId: String(ticket.id),
      targetEmployeeId: ticket.employeeId,
      targetName: ticket.employeeName,
      companyName: ticket.companyName,
      details: `Approved asset requisition #${ticket.ticketNumber} and allocated ${asset.name} (${asset.assetTag}) to ${ticket.employeeName}`,
    });

    // 4. Notify Employee
    dispatchNotification(req.app, {
      recipientId: ticket.employeeId,
      senderId: req.user?.employeeId,
      senderName: req.user ? (`${req.user.firstName || ""} ${req.user.lastName || ""}`.trim() || req.user.email || req.user.employeeId || "IT Support") : "IT Support",
      companyName: ticket.companyName,
      category: "asset",
      type: "asset_allocated",
      title: "Asset Request Approved & Allocated",
      message: `Your asset request for ${ticket.targetAssetCategory || ticket.title} has been approved! Allocated device: ${asset.name} [Tag: ${asset.assetTag}].`,
      severity: "success",
      target: "Asset Management",
      targetId: asset.id,
      actionLabel: "View Asset",
    });

    return res.status(200).json({
      message: `Asset allocated and request #${ticket.ticketNumber} resolved.`,
      ticket,
      asset,
    });
  } catch (error) {
    console.error("Error allocating asset:", error);
    return res.status(500).json({ error: "Failed to allocate asset.", details: error.message });
  }
};

// 6. Get High-Level Metrics
exports.getTicketMetrics = async (req, res) => {
  try {
    const { companyName } = req.query;
    const effectiveCompany = companyName || req.user?.companyName || "KN Advisors";

    const where = { companyName: { [Op.iLike]: effectiveCompany } };

    const allTickets = await SupportTicket.findAll({ where, attributes: ["status", "category", "priority"] });

    const total = allTickets.length;
    const openCount = allTickets.filter((t) => t.status === "Open").length;
    const inProgressCount = allTickets.filter((t) => t.status === "In Progress").length;
    const waitingCount = allTickets.filter((t) => t.status === "Waiting on Employee").length;
    const resolvedCount = allTickets.filter((t) => t.status === "Resolved" || t.status === "Closed").length;
    const criticalCount = allTickets.filter((t) => t.priority === "Critical" && t.status !== "Closed" && t.status !== "Resolved").length;

    const itSupportCount = allTickets.filter((t) => t.category === "IT_SUPPORT").length;
    const assetRequestCount = allTickets.filter((t) => t.category === "ASSET_REQUEST").length;
    const hrRequestCount = allTickets.filter((t) => t.category === "HR_REQUEST").length;

    return res.status(200).json({
      total,
      openCount,
      inProgressCount,
      waitingCount,
      resolvedCount,
      criticalCount,
      itSupportCount,
      assetRequestCount,
      hrRequestCount,
    });
  } catch (error) {
    console.error("Error fetching ticket metrics:", error);
    return res.status(500).json({ error: "Failed to fetch metrics." });
  }
};

// 7. Get Helpdesk Approver & Workflow Settings
exports.getHelpdeskSettings = async (req, res) => {
  try {
    const companyName = req.query.companyName || req.user?.companyName || "KN Advisors";
    let setting = await HelpdeskSetting.findOne({
      where: { companyName: { [Op.iLike]: companyName } },
      include: [
        { model: User, as: "itApprover", attributes: ["id", "employeeId", "firstName", "lastName", "department", "role"] },
        { model: User, as: "assetApprover", attributes: ["id", "employeeId", "firstName", "lastName", "department", "role"] },
        { model: User, as: "hrApprover", attributes: ["id", "employeeId", "firstName", "lastName", "department", "role"] },
        { model: User, as: "facilityApprover", attributes: ["id", "employeeId", "firstName", "lastName", "department", "role"] },
      ],
    });

    if (!setting) {
      setting = {
        companyName,
        itApproverId: null,
        assetApproverId: null,
        hrApproverId: null,
        facilityApproverId: null,
        autoAssignEnabled: true,
        requireSupervisorApproval: false,
      };
    }

    // Fetch active users for approver selection
    const users = await User.findAll({
      where: {
        companyName: { [Op.iLike]: companyName },
        exists: 1,
      },
      attributes: ["id", "employeeId", "firstName", "lastName", "email", "role", "departmentRole", "department"],
      order: [["firstName", "ASC"], ["lastName", "ASC"]],
    });

    return res.status(200).json({ setting, users });
  } catch (error) {
    console.error("Error fetching helpdesk settings:", error);
    return res.status(500).json({ error: "Failed to load helpdesk settings.", details: error.message });
  }
};

// 8. Update Helpdesk Approver & Workflow Settings (Admin / HR only)
exports.updateHelpdeskSettings = async (req, res) => {
  try {
    const actorRole = String(req.user?.role || "").toLowerCase();
    if (!["admin", "hr", "manager"].includes(actorRole)) {
      return res.status(403).json({ error: "Only administrators can configure helpdesk approver settings." });
    }

    const {
      companyName: bodyCompany,
      itApproverId,
      assetApproverId,
      hrApproverId,
      facilityApproverId,
      autoAssignEnabled,
      requireSupervisorApproval,
    } = req.body;

    const effectiveCompany = bodyCompany || req.user?.companyName || "KN Advisors";

    let [setting] = await HelpdeskSetting.findOrCreate({
      where: { companyName: { [Op.iLike]: effectiveCompany } },
      defaults: { companyName: effectiveCompany },
    });

    setting.itApproverId = itApproverId ? Number(itApproverId) : null;
    setting.assetApproverId = assetApproverId ? Number(assetApproverId) : null;
    setting.hrApproverId = hrApproverId ? Number(hrApproverId) : null;
    setting.facilityApproverId = facilityApproverId ? Number(facilityApproverId) : null;
    setting.autoAssignEnabled = autoAssignEnabled !== undefined ? Boolean(autoAssignEnabled) : true;
    setting.requireSupervisorApproval = requireSupervisorApproval !== undefined ? Boolean(requireSupervisorApproval) : false;

    await setting.save();

    // Re-fetch with associations for clean response
    const refreshed = await HelpdeskSetting.findByPk(setting.id, {
      include: [
        { model: User, as: "itApprover", attributes: ["id", "employeeId", "firstName", "lastName", "department", "role"] },
        { model: User, as: "assetApprover", attributes: ["id", "employeeId", "firstName", "lastName", "department", "role"] },
        { model: User, as: "hrApprover", attributes: ["id", "employeeId", "firstName", "lastName", "department", "role"] },
        { model: User, as: "facilityApprover", attributes: ["id", "employeeId", "firstName", "lastName", "department", "role"] },
      ],
    });

    // Audit Logging
    await logAuditEvent({
      req,
      action: "HELPDESK_SETTINGS_UPDATED",
      targetType: "HelpdeskSetting",
      targetId: String(setting.id),
      companyName: effectiveCompany,
      details: `Updated Helpdesk approvers (IT: ${setting.itApproverId || 'None'}, Asset: ${setting.assetApproverId || 'None'}, HR: ${setting.hrApproverId || 'None'}). Auto-assign: ${setting.autoAssignEnabled}. Supervisor approval: ${setting.requireSupervisorApproval}.`,
    });

    return res.status(200).json({
      message: "Helpdesk approver settings updated successfully.",
      setting: refreshed,
    });
  } catch (error) {
    console.error("Error updating helpdesk settings:", error);
    return res.status(500).json({ error: "Failed to update helpdesk settings.", details: error.message });
  }
};

