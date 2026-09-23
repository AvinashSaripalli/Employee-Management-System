const { Op } = require("sequelize");
const { Department, User } = require("../models");

// Promote a selected user to department supervisor (head) and demote the
// previous recorded supervisor so each department keeps exactly one head.
async function reconcileSupervisor(department, supervisorId) {
  const nextId = supervisorId ? Number(supervisorId) : null;

  // Demote the previously recorded supervisor's department role to Member
  const prevId = department.supervisorId ? Number(department.supervisorId) : null;
  if (prevId && prevId !== nextId) {
    const previous = await User.findByPk(prevId);
    if (previous) {
      await previous.update({ departmentRole: "Member" });
    }
  }

  department.supervisorId = supervisorId || null;

  // Promote the newly selected supervisor to departmentRole = 'Supervisor'
  if (nextId) {
    const supervisor = await User.findByPk(nextId);
    if (supervisor) {
      await supervisor.update({ department: department.name, departmentRole: "Supervisor" });
    }
  }
}

exports.getDepartments = async (req, res) => {
  const companyName = req.query.companyName || req.user.companyName;
  if (!companyName) return res.status(400).json({ error: "Company name is required" });

  try {
    // Sync free-text department names found on user records into the structure,
    // but ONLY if the name does not already exist anywhere for this company.
    // (Previously this created duplicate TOP-LEVEL records for sub-department
    // names, which broke the org chart hierarchy.)
    const users = await User.findAll({ where: { companyName, exists: 1 }, attributes: ["department"], raw: true });
    const existingNames = [...new Set(users.map((user) => String(user.department || "").trim()).filter(Boolean))]
      .filter((name) => name && name !== "Management");

    for (const name of existingNames) {
      const exists = await Department.findOne({ where: { name, companyName } });
      if (!exists) {
        await Department.create({ name, companyName, parentId: null });
      }
    }

    const departments = await Department.findAll({
      where: { companyName },
      order: [["name", "ASC"]],
    });

    const hasCompanyDept = departments.some((d) => d.name.toLowerCase() === companyName.toLowerCase());
    if (!hasCompanyDept) {
      departments.unshift({
        id: -1,
        name: companyName,
        companyName,
        parentId: null,
        supervisorId: null,
      });
    }

    return res.json(departments);
  } catch (error) {
    console.error("Error fetching departments:", error);
    return res.status(500).json({ error: "Failed to fetch departments" });
  }
};

exports.createDepartment = async (req, res) => {
  const { name, parentId, supervisorId, companyName } = req.body;
  const trimmedName = String(name || "").trim();
  const company = companyName || req.user.companyName;
  if (!trimmedName || !company) return res.status(400).json({ error: "Department name and company are required" });

  try {
    // Departments are referenced by name across the app (User.department is a
    // plain string), so names must be unique within a company to keep the
    // hierarchy unambiguous.
    const duplicate = await Department.findOne({ where: { name: trimmedName, companyName: company } });
    if (duplicate) return res.status(409).json({ error: `Department '${trimmedName}' already exists` });

    const department = await Department.create({
      name: trimmedName,
      parentId: parentId || null,
      supervisorId: supervisorId || null,
      companyName: company,
    });

    if (supervisorId) {
      await reconcileSupervisor(department, supervisorId);
    }

    return res.status(201).json(department);
  } catch (error) {
    console.error("Error creating department:", error);
    return res.status(500).json({ error: "Failed to create department" });
  }
};

exports.updateDepartment = async (req, res) => {
  const { name, parentId, supervisorId } = req.body;
  const trimmedName = String(name || "").trim();
  if (!trimmedName) return res.status(400).json({ error: "Department name is required" });

  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ error: "Department not found" });
    if (parentId && Number(parentId) === department.id) {
      return res.status(400).json({ error: "A department cannot be its own parent" });
    }

    let ancestorId = parentId || null;
    while (ancestorId) {
      if (Number(ancestorId) === department.id) {
        return res.status(400).json({ error: "A department cannot be placed under its own child" });
      }
      const ancestor = await Department.findByPk(ancestorId, { attributes: ["parentId"] });
      ancestorId = ancestor?.parentId || null;
    }

    const duplicate = await Department.findOne({
      where: { name: trimmedName, companyName: department.companyName, id: { [Op.ne]: department.id } },
    });
    if (duplicate) return res.status(409).json({ error: `Department '${trimmedName}' already exists` });

    const prevName = department.name;
    const prevSupervisorId = department.supervisorId;

    await department.update({ name: trimmedName, parentId: parentId || null, supervisorId: supervisorId || null });

    // Keep employees in sync when the department is renamed
    if (prevName !== trimmedName) {
      await User.update({ department: trimmedName }, { where: { companyName: department.companyName, department: prevName } });
    }

    // Single-supervisor consistency (promote new head, demote previous one)
    if (supervisorId !== undefined || prevSupervisorId) {
      await reconcileSupervisor(department, supervisorId || null);
    }

    return res.json(department);
  } catch (error) {
    console.error("Error updating department:", error);
    return res.status(500).json({ error: "Failed to update department" });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ error: "Department not found" });

    const children = await Department.findAll({ where: { parentId: department.id } });
    if (children.length > 0) {
      return res.status(400).json({ error: `Cannot delete "${department.name}" — delete its sub-departments first` });
    }

    // Demote the head of the removed department
    if (department.supervisorId) {
      const supervisor = await User.findByPk(department.supervisorId);
      if (supervisor) {
        await supervisor.update({ departmentRole: "Member" });
      }
    }

    // Move remaining members up to the parent department (or leave unassigned for top-level)
    const parent = department.parentId ? await Department.findByPk(department.parentId) : null;
    const targetName = parent ? parent.name : "";
    await User.update(
      { department: targetName },
      { where: { companyName: department.companyName, department: department.name } }
    );

    await department.destroy();
    return res.json({ message: "Department deleted successfully" });
  } catch (error) {
    console.error("Error deleting department:", error);
    return res.status(500).json({ error: "Failed to delete department" });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const department = await Department.findByPk(req.params.id);
    if (!department) return res.status(404).json({ error: "Department not found" });

    const user = await User.findByPk(req.params.userId);
    if (!user || user.companyName !== department.companyName) {
      return res.status(404).json({ error: "Employee not found in this company" });
    }
    if (String(user.department || '').trim() !== department.name) {
      return res.status(400).json({ error: "Employee is not assigned to this department" });
    }

    const updates = { department: '', departmentRole: 'Member' };
    await user.update(updates);

    if (Number(department.supervisorId) === user.id) {
      await department.update({ supervisorId: null });
    }

    return res.json({ message: "Employee removed from department", userId: user.id });
  } catch (error) {
    console.error("Error removing department member:", error);
    return res.status(500).json({ error: "Failed to remove employee from department" });
  }
};