const { Op } = require("sequelize");
const { Department, User } = require("../models");

exports.getDepartments = async (req, res) => {
  const companyName = req.query.companyName || req.user.companyName;
  if (!companyName) return res.status(400).json({ error: "Company name is required" });

  try {
    const users = await User.findAll({ where: { companyName, exists: 1 }, attributes: ["department"], raw: true });
    const existingNames = [...new Set(users.map((user) => String(user.department || "").trim()).filter(Boolean))];
    for (const name of existingNames) {
      await Department.findOrCreate({ where: { name, companyName, parentId: null }, defaults: { name, companyName } });
    }
    const departments = await Department.findAll({
      where: { companyName },
      order: [["name", "ASC"]],
    });
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
    const duplicate = await Department.findOne({ where: { name: trimmedName, companyName: company, parentId: parentId || null } });
    if (duplicate) return res.status(409).json({ error: "Department already exists at this level" });
    const department = await Department.create({
      name: trimmedName,
      parentId: parentId || null,
      supervisorId: supervisorId || null,
      companyName: company,
    });
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
    await department.update({ name: trimmedName, parentId: parentId || null, supervisorId: supervisorId || null });
    return res.json(department);
  } catch (error) {
    console.error("Error updating department:", error);
    return res.status(500).json({ error: "Failed to update department" });
  }
};