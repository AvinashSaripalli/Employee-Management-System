const { Task, TaskChecklistItem, User, TaskActivity, TaskMember } = require("../models");
const { Op } = require("sequelize");
const { ensureCompanyMembership, DEFAULT_COMPANY } = require("../utils/companyMembership");

const STATUS = {
  NEW: 1,
  PENDING: 2,
  IN_PROGRESS: 3,
  REVIEW: 4,
  COMPLETED: 5,
  DEFERRED: 6,
  DECLINED: 7,
};

const STATUS_NAMES = {
  1: "New",
  2: "Pending",
  3: "In Progress",
  4: "Pending Review",
  5: "Completed",
  6: "Deferred",
  7: "Declined",
};

const PRIORITY_NAMES = {
  0: "Low",
  1: "Normal",
  2: "High",
};

const userAttributes = [
  "firstName",
  "lastName",
  "email",
  "employeeId",
  "designation",
  "department",
  "photo",
];

const fmtDate = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");
const fmtPriority = (value) => PRIORITY_NAMES[Number(value)] || "Normal";
const fmtStatus = (value) => STATUS_NAMES[Number(value)] || "Pending";
const fmtBool = (value) => (value ? "Yes" : "No");

const logActivity = async (taskId, userId, action, field, oldValue, newValue) => {
  try {
    await TaskActivity.create({
      taskId,
      userId,
      action,
      field,
      oldValue: oldValue === undefined || oldValue === null ? null : String(oldValue),
      newValue: newValue === undefined || newValue === null ? null : String(newValue),
    });
  } catch (error) {
    console.error("Error logging task activity:", error);
  }
};

const taskInclude = (includeChecklist = true) => {
  const include = [
    {
      model: User,
      as: "responsible",
      attributes: userAttributes,
      required: false,
    },
    {
      model: User,
      as: "creator",
      attributes: userAttributes,
      required: false,
    },
    {
      model: TaskMember,
      as: "members",
      include: [
        {
          model: User,
          as: "user",
          attributes: userAttributes,
          required: false,
        },
      ],
      separate: true,
      required: false,
    },
  ];
  if (includeChecklist) {
    include.push({
      model: TaskChecklistItem,
      as: "checklist",
      order: [["sortIndex", "ASC"]],
      separate: true,
    });
  }
  return include;
};

const resolveUserContext = async (req) => {
  if (!req.user || !req.user.id) return null;
  const actor = await User.findByPk(req.user.id);
  if (!actor) return null;
  await ensureCompanyMembership(actor, DEFAULT_COMPANY);

  const employeeId = actor.employeeId || String(actor.id);
  const role = (actor.role || "").trim();
  const normalizedRole = role.toLowerCase();
  const departmentRole = (actor.departmentRole || "").trim();
  const userDepartment = actor.department || "";
  const companyName = req.query?.companyName || req.body?.companyName || actor.companyName || DEFAULT_COMPANY;

  const isAdmin = normalizedRole === "admin" || normalizedRole === "hr";
  const isSupervisor = !isAdmin && (departmentRole === "Supervisor" || normalizedRole === "manager");
  const isEmployee = !isAdmin && !isSupervisor;

  return {
    actor,
    employeeId,
    role,
    departmentRole,
    userDepartment,
    companyName,
    isAdmin,
    isSupervisor,
    isEmployee,
  };
};

const canUserAccessTask = (ctx, task) => {
  if (!ctx || !task) return { canView: false, canEdit: false, canDelete: false, canChangeStatus: false };

  if (ctx.isAdmin) {
    return { canView: true, canEdit: true, canDelete: true, canChangeStatus: true };
  }

  const isCreator = task.createdBy === ctx.employeeId;
  const isResponsible = task.responsibleId === ctx.employeeId;
  const isMember = (task.members || []).some(
    (m) => (m.userId || m.user?.employeeId) === ctx.employeeId
  );

  // If directly involved
  if (isCreator) {
    return { canView: true, canEdit: true, canDelete: true, canChangeStatus: true };
  }

  if (isResponsible) {
    return { canView: true, canEdit: true, canDelete: false, canChangeStatus: true };
  }

  if (isMember) {
    return { canView: true, canEdit: false, canDelete: false, canChangeStatus: false };
  }

  // If Supervisor, check if task belongs to a member of supervisor's department
  if (ctx.isSupervisor && ctx.userDepartment) {
    const respDept = task.responsible?.department;
    const creatDept = task.creator?.department;
    const hasDeptMember = (task.members || []).some(
      (m) => m.user?.department === ctx.userDepartment
    );

    if (respDept === ctx.userDepartment || creatDept === ctx.userDepartment || hasDeptMember) {
      return { canView: true, canEdit: true, canDelete: true, canChangeStatus: true };
    }
  }

  // Otherwise, no access
  return { canView: false, canEdit: false, canDelete: false, canChangeStatus: false };
};

const getEmployeeId = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return null;
  await ensureCompanyMembership(user, DEFAULT_COMPANY);
  return user.employeeId || String(user.id);
};

const isAdminOrManager = (role) => role === "Admin" || role === "Manager";

const formatTask = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  statusName: STATUS_NAMES[task.status] || "Pending",
  priority: task.priority,
  priorityName: PRIORITY_NAMES[task.priority] || "Normal",
  createdBy: task.createdBy,
  responsibleId: task.responsibleId,
  deadline: task.deadline,
  parentId: task.parentId,
  companyName: task.companyName,
  taskControl: task.taskControl,
  completedBy: task.completedBy,
  completedAt: task.completedAt,
  createdAt: task.created_at,
  updatedAt: task.updated_at,
  responsible: task.responsible
    ? {
        firstName: task.responsible.firstName,
        lastName: task.responsible.lastName,
        email: task.responsible.email,
        employeeId: task.responsible.employeeId,
        designation: task.responsible.designation,
        department: task.responsible.department,
        photo: task.responsible.photo
          ? `${task.responsible.photo}`
          : null,
      }
    : null,
  creator: task.creator
    ? {
        firstName: task.creator.firstName,
        lastName: task.creator.lastName,
        email: task.creator.email,
        employeeId: task.creator.employeeId,
        designation: task.creator.designation,
        department: task.creator.department,
        photo: task.creator.photo ? `${task.creator.photo}` : null,
      }
    : null,
  checklist: task.checklist
    ? task.checklist.map((item) => ({
        id: item.id,
        taskId: item.taskId,
        title: item.title,
        isComplete: item.isComplete,
        sortIndex: item.sortIndex,
      }))
    : [],
  members: task.members
    ? task.members.map((member) => ({
        id: member.id,
        type: member.type,
        userId: member.userId,
        user: member.user
          ? {
              firstName: member.user.firstName,
              lastName: member.user.lastName,
              email: member.user.email,
              employeeId: member.user.employeeId,
              designation: member.user.designation,
              department: member.user.department,
              photo: member.user.photo ? `${member.user.photo}` : null,
            }
          : null,
      }))
    : [],
  subtaskCount: task.subtasks ? task.subtasks.length : 0,
  subtasks: task.subtasks ? task.subtasks.map((s) => s.id) : [],
});

exports.getTasks = async (req, res) => {
  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { status, myTasks, scope, department, employeeId: filterEmpId } = req.query;
    const companyName = ctx.companyName;

    const where = { companyName };
    if (status && Number(status)) {
      where.status = Number(status);
    }

    // Role-Based Filtering
    if (ctx.isAdmin) {
      // 1. ADMIN: Can view all tasks in the company, with optional department & employee filters
      const andConditions = [];

      if (department && department !== "all") {
        const deptUsers = await User.findAll({
          where: { companyName, department },
          attributes: ["employeeId"],
        });
        const deptEmpIds = deptUsers.map((u) => u.employeeId).filter(Boolean);
        const deptMemberRows = await TaskMember.findAll({
          where: { userId: deptEmpIds },
          attributes: ["taskId"],
        });
        const deptMemberTaskIds = deptMemberRows.map((m) => m.taskId);

        andConditions.push({
          [Op.or]: [
            { responsibleId: deptEmpIds },
            { createdBy: deptEmpIds },
            { id: deptMemberTaskIds },
          ],
        });
      }

      if (filterEmpId && filterEmpId !== "all") {
        const empMemberRows = await TaskMember.findAll({
          where: { userId: filterEmpId },
          attributes: ["taskId"],
        });
        const empTaskIds = empMemberRows.map((m) => m.taskId);
        andConditions.push({
          [Op.or]: [
            { responsibleId: filterEmpId },
            { createdBy: filterEmpId },
            { id: empTaskIds },
          ],
        });
      } else if (myTasks === "true" || scope === "my") {
        const myMemberRows = await TaskMember.findAll({
          where: { userId: ctx.employeeId },
          attributes: ["taskId"],
        });
        const myTaskIds = myMemberRows.map((m) => m.taskId);
        andConditions.push({
          [Op.or]: [
            { responsibleId: ctx.employeeId },
            { createdBy: ctx.employeeId },
            { id: myTaskIds },
          ],
        });
      }

      if (andConditions.length > 0) {
        where[Op.and] = andConditions;
      }
    } else if (ctx.isSupervisor) {
      // 2. SUPERVISOR: Can view their own tasks + all department users' tasks
      const deptUsers = await User.findAll({
        where: { companyName, department: ctx.userDepartment },
        attributes: ["employeeId"],
      });
      const deptEmpIds = Array.from(
        new Set([...deptUsers.map((u) => u.employeeId).filter(Boolean), ctx.employeeId])
      );

      // If requested "My Tasks Only" (either scope=my or myTasks=true):
      if (myTasks === "true" || scope === "my") {
        const myMemberRows = await TaskMember.findAll({
          where: { userId: ctx.employeeId },
          attributes: ["taskId"],
        });
        const myTaskIds = myMemberRows.map((m) => m.taskId);
        where[Op.or] = [
          { responsibleId: ctx.employeeId },
          { createdBy: ctx.employeeId },
          { id: myTaskIds },
        ];
      } else {
        // All tasks for supervisor's department + supervisor's personal tasks
        const deptMemberRows = await TaskMember.findAll({
          where: { userId: deptEmpIds },
          attributes: ["taskId"],
        });
        const deptTaskIds = deptMemberRows.map((m) => m.taskId);

        // If filtering by a specific employee inside supervisor's department
        if (filterEmpId && filterEmpId !== "all" && deptEmpIds.includes(filterEmpId)) {
          const empMemberRows = await TaskMember.findAll({
            where: { userId: filterEmpId },
            attributes: ["taskId"],
          });
          const empTaskIds = empMemberRows.map((m) => m.taskId);
          where[Op.or] = [
            { responsibleId: filterEmpId },
            { createdBy: filterEmpId },
            { id: empTaskIds },
          ];
        } else {
          where[Op.or] = [
            { responsibleId: deptEmpIds },
            { createdBy: deptEmpIds },
            { id: deptTaskIds },
          ];
        }
      }
    } else {
      // 3. EMPLOYEE: Can view ONLY their own tasks (assigned, created, or member)
      const myMemberRows = await TaskMember.findAll({
        where: { userId: ctx.employeeId },
        attributes: ["taskId"],
      });
      const myTaskIds = myMemberRows.map((m) => m.taskId);

      if (scope === "assigned") {
        where.responsibleId = ctx.employeeId;
      } else if (scope === "created") {
        where.createdBy = ctx.employeeId;
      } else if (scope === "observing") {
        where.id = myTaskIds;
      } else {
        where[Op.or] = [
          { responsibleId: ctx.employeeId },
          { createdBy: ctx.employeeId },
          { id: myTaskIds },
        ];
      }
    }

    const results = await Task.findAll({
      where,
      include: [
        ...taskInclude(false),
        {
          model: Task,
          as: "subtasks",
          attributes: ["id", "title", "status"],
          required: false,
        },
        {
          model: TaskChecklistItem,
          as: "checklist",
          attributes: ["id", "title", "isComplete"],
          separate: true,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(results.map(formatTask));
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.getTask = async (req, res) => {
  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const task = await Task.findByPk(req.params.id, {
      include: taskInclude(true),
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const access = canUserAccessTask(ctx, task);
    if (!access.canView) {
      return res.status(403).json({ error: "You do not have permission to view this task" });
    }

    res.json({
      ...formatTask(task),
      permissions: {
        canEdit: access.canEdit,
        canDelete: access.canDelete,
        canChangeStatus: access.canChangeStatus,
      },
    });
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.createTask = async (req, res) => {
  const ctx = await resolveUserContext(req);
  if (!ctx) return res.status(401).json({ error: "Unauthorized" });

  const {
    title, description, responsibleId, deadline, priority, parentId,
    taskControl, checklist, members,
  } = req.body;
  const companyName = ctx.companyName;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Task title is required" });
  }
  if (!companyName) {
    return res.status(400).json({ error: "Company name is required" });
  }

  try {
    const creatorEmployeeId = ctx.employeeId;
    let assigneeId = responsibleId || creatorEmployeeId;

    // Validate that assignee is allowed based on requester role
    if (ctx.isEmployee) {
      // Regular employee assigns to self by default unless collaborating
      if (!assigneeId) assigneeId = creatorEmployeeId;
    } else if (ctx.isSupervisor) {
      // Supervisor can assign to department members or self
      if (assigneeId && assigneeId !== creatorEmployeeId) {
        const targetUser = await User.findOne({ where: { employeeId: assigneeId, companyName } });
        if (targetUser && targetUser.department !== ctx.userDepartment) {
          return res.status(403).json({ error: "Supervisors can only assign tasks to employees within their department" });
        }
      }
    }

    if (!assigneeId) {
      return res.status(400).json({ error: "Assign a responsible employee" });
    }

    const task = await Task.create({
      title: title.trim(),
      description: description || null,
      status: STATUS.PENDING,
      priority: priority !== undefined ? priority : 1,
      createdBy: creatorEmployeeId,
      responsibleId: assigneeId,
      deadline: deadline || null,
      parentId: parentId || null,
      companyName,
      taskControl: !!taskControl,
    });

    await logActivity(task.id, creatorEmployeeId, "create", "title", null, task.title);

    if (Array.isArray(checklist) && checklist.length > 0) {
      await TaskChecklistItem.bulkCreate(
        checklist
          .map((item, index) => ({ title: item.title, sortIndex: index }))
          .filter((item) => item.title && item.title.trim())
          .map((item) => ({ ...item, taskId: task.id }))
      );
      const createdItems = checklist
        .map((item) => (item.title || "").trim())
        .filter(Boolean);
      for (const itemTitle of createdItems) {
        await logActivity(task.id, creatorEmployeeId, "checklist_add", "title", null, itemTitle);
      }
    }

    if (Array.isArray(members) && members.length > 0) {
      for (const m of members) {
        if (m.userId && (m.type === "A" || m.type === "U")) {
          await TaskMember.create({ taskId: task.id, userId: m.userId, type: m.type });
          await logActivity(
            task.id, creatorEmployeeId, "member_add",
            m.type === "A" ? "Accomplisher" : "Observer", null, m.userId
          );
        }
      }
    }

    const created = await Task.findByPk(task.id, { include: taskInclude(true) });
    res.status(201).json(formatTask(created));
  } catch (error) {
    console.error("Error creating task:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
};

exports.updateTask = async (req, res) => {
  const {
    title, description, responsibleId, deadline, priority, parentId,
    taskControl, members,
  } = req.body;

  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const task = await Task.findByPk(req.params.id, {
      include: taskInclude(true),
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const access = canUserAccessTask(ctx, task);
    if (!access.canEdit) {
      return res.status(403).json({ error: "You do not have permission to edit this task" });
    }

    const employeeId = ctx.employeeId;

    const normalized = {
      title: title !== undefined ? (title || "").trim() : undefined,
      description: description !== undefined ? description : undefined,
      responsibleId: responsibleId !== undefined ? responsibleId : undefined,
      deadline: deadline !== undefined ? deadline : undefined,
      priority: priority !== undefined ? Number(priority) : undefined,
      parentId: parentId !== undefined ? (parentId || null) : undefined,
      taskControl: taskControl !== undefined ? !!taskControl : undefined,
    };

    const fieldLabels = {
      title: "Title",
      description: "Description",
      responsibleId: "Assignee",
      deadline: "Deadline",
      priority: "Priority",
      parentId: "Parent task",
      taskControl: "Creator approval",
    };

    const formatValue = (key, value) => {
      if (value === null || value === undefined) return "";
      switch (key) {
        case "deadline": return fmtDate(value);
        case "priority": return fmtPriority(value);
        case "taskControl": return fmtBool(value);
        case "parentId": return `#${value}`;
        default: return String(value);
      }
    };

    const updates = {};
    const changes = [];
    for (const key of Object.keys(normalized)) {
      const value = normalized[key];
      if (value === undefined) continue;
      if (String(task[key]) !== String(value)) {
        updates[key] = value;
        changes.push({
          field: key,
          label: fieldLabels[key] || key,
          oldValue: formatValue(key, task[key]),
          newValue: formatValue(key, value),
        });
      }
    }

    if (changes.length > 0) {
      await task.update(updates);
      for (const change of changes) {
        await logActivity(
          task.id, employeeId, "update", change.field,
          change.oldValue, change.newValue
        );
      }
    }

    if (Array.isArray(members)) {
      const currentMembers = await TaskMember.findAll({ where: { taskId: task.id } });
      const currentMap = new Map(currentMembers.map((m) => [`${m.type}:${m.userId}`, m]));
      const desired = members.filter((m) => m.userId && (m.type === "A" || m.type === "U"));
      const desiredSet = new Set(desired.map((m) => `${m.type}:${m.userId}`));

      for (const d of desired) {
        if (!currentMap.has(`${d.type}:${d.userId}`)) {
          await TaskMember.create({ taskId: task.id, userId: d.userId, type: d.type });
          await logActivity(
            task.id, employeeId, "member_add",
            d.type === "A" ? "Accomplisher" : "Observer", null, d.userId
          );
        }
      }

      for (const c of currentMembers) {
        if (!desiredSet.has(`${c.type}:${c.userId}`)) {
          await c.destroy();
          await logActivity(
            task.id, employeeId, "member_remove",
            c.type === "A" ? "Accomplisher" : "Observer", c.userId, null
          );
        }
      }
    }

    const updated = await Task.findByPk(task.id, { include: taskInclude(true) });
    res.json(formatTask(updated));
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const task = await Task.findByPk(req.params.id, {
      include: taskInclude(false),
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const access = canUserAccessTask(ctx, task);
    if (!access.canDelete) {
      return res.status(403).json({ error: "You do not have permission to delete this task" });
    }

    await task.destroy();
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.updateTaskStatus = async (req, res) => {
  const { action, status } = req.body;
  const taskId = req.params.id;

  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const task = await Task.findByPk(taskId, {
      include: taskInclude(true),
    });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const access = canUserAccessTask(ctx, task);
    if (!access.canChangeStatus) {
      return res.status(403).json({ error: "You are not allowed to change the status of this task" });
    }

    const employeeId = ctx.employeeId;
    const isCreator = task.createdBy === employeeId;
    const canApproveOrDisapprove = ctx.isAdmin || isCreator || (ctx.isSupervisor && access.canEdit);
    const current = task.status;

    const completeFlow = () => {
      const needsApproval = task.taskControl && !isCreator;
      const completedBy = employeeId;
      if (needsApproval) {
        return { status: STATUS.REVIEW, completedBy, completedAt: new Date() };
      }
      return { status: STATUS.COMPLETED, completedBy, completedAt: new Date() };
    };

    const transitions = {
      accept: { from: [STATUS.NEW], to: STATUS.PENDING },
      start: { from: [STATUS.NEW, STATUS.PENDING, STATUS.REVIEW, STATUS.DEFERRED], to: STATUS.IN_PROGRESS },
      pause: { from: [STATUS.IN_PROGRESS], to: STATUS.PENDING },
      complete: { from: [STATUS.PENDING, STATUS.IN_PROGRESS], to: null, flow: completeFlow },
      approve: { from: [STATUS.REVIEW], to: STATUS.COMPLETED, allowed: canApproveOrDisapprove },
      disapprove: { from: [STATUS.REVIEW], to: STATUS.PENDING, allowed: canApproveOrDisapprove },
      defer: { from: [STATUS.NEW, STATUS.PENDING, STATUS.IN_PROGRESS, STATUS.REVIEW], to: STATUS.DEFERRED },
      renew: { from: [STATUS.DEFERRED], to: STATUS.PENDING },
      deny: { from: [STATUS.NEW, STATUS.PENDING, STATUS.IN_PROGRESS, STATUS.REVIEW], to: STATUS.DECLINED },
    };

    let transition;
    if (action) {
      transition = transitions[action];
      if (!transition) {
        return res.status(400).json({ error: "Unknown action" });
      }
      if (transition.allowed === false) {
        return res.status(403).json({ error: "Only the supervisor, creator, or administrator can approve or reject this task" });
      }
      if (!transition.from.includes(current)) {
        return res.status(400).json({
          error: `Cannot "${action}" a task with status "${STATUS_NAMES[current]}"`,
        });
      }
    } else if (status) {
      const target = Number(status);
      if (!Object.values(STATUS).includes(target)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
      if (target === STATUS.COMPLETED && task.taskControl && !isCreator && !canApproveOrDisapprove) {
        return res.status(403).json({ error: "Task requires creator or supervisor approval" });
      }
      transition = { to: target };
    } else {
      return res.status(400).json({ error: "Action or status is required" });
    }

    const updates = transition.flow
      ? transition.flow()
      : { status: transition.to };

    if (updates.status === STATUS.COMPLETED) {
      updates.completedBy = employeeId;
      updates.completedAt = new Date();
    }
    if (updates.status !== STATUS.COMPLETED) {
      updates.completedBy = null;
      updates.completedAt = null;
    }

    await task.update(updates);
    await logActivity(
      task.id, employeeId, "status", "status",
      fmtStatus(current), fmtStatus(updates.status)
    );
    const updated = await Task.findByPk(task.id, { include: taskInclude(true) });
    res.json(formatTask(updated));
  } catch (error) {
    console.error("Error updating task status:", error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.addChecklistItem = async (req, res) => {
  const { title } = req.body;
  const taskId = req.params.id;

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Checklist item title is required" });
  }

  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const task = await Task.findByPk(taskId, { include: taskInclude(false) });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const access = canUserAccessTask(ctx, task);
    if (!access.canView) {
      return res.status(403).json({ error: "Access denied" });
    }

    const maxSort = await TaskChecklistItem.max("sortIndex", { where: { taskId } });
    const item = await TaskChecklistItem.create({
      taskId,
      title: title.trim(),
      sortIndex: (maxSort || 0) + 1,
    });

    const employeeId = ctx.employeeId;
    await logActivity(taskId, employeeId, "checklist_add", "title", null, item.title);

    res.status(201).json(item);
  } catch (error) {
    console.error("Error adding checklist item:", error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.updateChecklistItem = async (req, res) => {
  const { title } = req.body;

  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const item = await TaskChecklistItem.findByPk(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Checklist item not found" });
    }

    const task = await Task.findByPk(item.taskId, { include: taskInclude(false) });
    const access = canUserAccessTask(ctx, task);
    if (!access.canView) {
      return res.status(403).json({ error: "Access denied" });
    }

    if (title !== undefined && item.title !== title) {
      const employeeId = ctx.employeeId;
      await logActivity(item.taskId, employeeId, "checklist_update", "title", item.title, title);
    }
    await item.update({ title: title !== undefined ? title : item.title });
    res.json(item);
  } catch (error) {
    console.error("Error updating checklist item:", error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.toggleChecklistItem = async (req, res) => {
  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const item = await TaskChecklistItem.findByPk(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Checklist item not found" });
    }

    const task = await Task.findByPk(item.taskId, { include: taskInclude(false) });
    const access = canUserAccessTask(ctx, task);
    if (!access.canView) {
      return res.status(403).json({ error: "Access denied" });
    }

    const employeeId = ctx.employeeId;
    await logActivity(
      item.taskId, employeeId, "checklist_toggle", item.title,
      item.isComplete ? "Complete" : "Incomplete",
      item.isComplete ? "Incomplete" : "Complete"
    );
    await item.update({ isComplete: !item.isComplete });
    res.json(item);
  } catch (error) {
    console.error("Error toggling checklist item:", error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.deleteChecklistItem = async (req, res) => {
  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const item = await TaskChecklistItem.findByPk(req.params.itemId);
    if (!item) {
      return res.status(404).json({ error: "Checklist item not found" });
    }

    const task = await Task.findByPk(item.taskId, { include: taskInclude(false) });
    const access = canUserAccessTask(ctx, task);
    if (!access.canEdit) {
      return res.status(403).json({ error: "You do not have permission to delete checklist items from this task" });
    }

    const employeeId = ctx.employeeId;
    await logActivity(item.taskId, employeeId, "checklist_delete", "title", item.title, null);
    await item.destroy();
    res.json({ message: "Checklist item deleted" });
  } catch (error) {
    console.error("Error deleting checklist item:", error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.getTaskActivities = async (req, res) => {
  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const task = await Task.findByPk(req.params.id, { include: taskInclude(false) });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const access = canUserAccessTask(ctx, task);
    if (!access.canView) {
      return res.status(403).json({ error: "Access denied" });
    }

    const activities = await TaskActivity.findAll({
      where: { taskId: task.id },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["firstName", "lastName", "email", "employeeId", "photo"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    res.json(activities.map((a) => ({
      id: a.id,
      taskId: a.taskId,
      userId: a.userId,
      action: a.action,
      field: a.field,
      oldValue: a.oldValue,
      newValue: a.newValue,
      createdAt: a.created_at,
      user: a.user
        ? {
            firstName: a.user.firstName,
            lastName: a.user.lastName,
            email: a.user.email,
            employeeId: a.user.employeeId,
            photo: a.user.photo ? `${a.user.photo}` : null,
          }
        : null,
    })));
  } catch (error) {
    console.error("Error fetching task activities:", error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.getStatusOptions = (req, res) => {
  res.json(STATUS_NAMES);
};

exports.getPriorityOptions = (req, res) => {
  res.json(PRIORITY_NAMES);
};

exports.getTaskMembers = async (req, res) => {
  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const task = await Task.findByPk(req.params.id, { include: taskInclude(false) });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const access = canUserAccessTask(ctx, task);
    if (!access.canView) {
      return res.status(403).json({ error: "Access denied" });
    }

    const members = await TaskMember.findAll({
      where: { taskId: task.id },
      include: [
        {
          model: User,
          as: "user",
          attributes: userAttributes,
          required: false,
        },
      ],
      order: [["created_at", "ASC"]],
    });

    const format = (m) => ({
      id: m.id,
      type: m.type,
      userId: m.userId,
      user: m.user
        ? {
            firstName: m.user.firstName,
            lastName: m.user.lastName,
            email: m.user.email,
            employeeId: m.user.employeeId,
            designation: m.user.designation,
            department: m.user.department,
            photo: m.user.photo ? `${m.user.photo}` : null,
          }
        : null,
    });

    res.json({
      accomplishers: members.filter((m) => m.type === "A").map(format),
      observers: members.filter((m) => m.type === "U").map(format),
    });
  } catch (error) {
    console.error("Error fetching task members:", error);
    res.status(500).json({ error: "Database error" });
  }
};

exports.addTaskMember = async (req, res) => {
  const { type, userId } = req.body;

  if (!["A", "U"].includes(type)) {
    return res.status(400).json({ error: "Member type must be A or U" });
  }
  if (!userId) {
    return res.status(400).json({ error: "User is required" });
  }

  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const task = await Task.findByPk(req.params.id, { include: taskInclude(false) });
    if (!task) {
      return res.status(404).json({ error: "Task not found" });
    }

    const access = canUserAccessTask(ctx, task);
    if (!access.canEdit) {
      return res.status(403).json({ error: "You do not have permission to modify members for this task" });
    }

    const existing = await TaskMember.findOne({
      where: { taskId: task.id, userId, type },
    });
    if (existing) {
      return res.status(400).json({ error: "This member is already added" });
    }

    const member = await TaskMember.create({ taskId: task.id, userId, type });

    const employeeId = ctx.employeeId;
    await logActivity(
      task.id, employeeId, "member_add",
      type === "A" ? "Accomplisher" : "Observer", null, userId
    );

    const created = await TaskMember.findByPk(member.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: userAttributes,
          required: false,
        },
      ],
    });

    res.status(201).json({
      id: created.id,
      type: created.type,
      userId: created.userId,
      user: created.user
        ? {
            firstName: created.user.firstName,
            lastName: created.user.lastName,
            email: created.user.email,
            employeeId: created.user.employeeId,
            designation: created.user.designation,
            department: created.user.department,
            photo: created.user.photo ? `${created.user.photo}` : null,
          }
        : null,
    });
  } catch (error) {
    console.error("Error adding task member:", error);
    res.status(500).json({ error: "Database error", details: error.message });
  }
};

exports.removeTaskMember = async (req, res) => {
  try {
    const ctx = await resolveUserContext(req);
    if (!ctx) return res.status(401).json({ error: "Unauthorized" });

    const member = await TaskMember.findByPk(req.params.memberId);
    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const task = await Task.findByPk(member.taskId, { include: taskInclude(false) });
    const access = canUserAccessTask(ctx, task);
    if (!access.canEdit) {
      return res.status(403).json({ error: "You do not have permission to remove members from this task" });
    }

    const employeeId = ctx.employeeId;
    await logActivity(
      member.taskId, employeeId, "member_remove",
      member.type === "A" ? "Accomplisher" : "Observer", member.userId, null
    );

    await member.destroy();
    res.json({ message: "Member removed" });
  } catch (error) {
    console.error("Error removing task member:", error);
    res.status(500).json({ error: "Database error" });
  }
};