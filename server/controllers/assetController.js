const { Asset, User, Notification } = require("../models");
const { logAuditEvent } = require("../utils/auditLogger");
const { Op } = require("sequelize");

// 1. Create a new asset
exports.createAsset = async (req, res) => {
  try {
    const {
      assetTag,
      name,
      category,
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchaseCost,
      warrantyExpiry,
      condition,
      status,
      notes,
    } = req.body;

    const companyName = req.user?.companyName || req.body.companyName || "KN Advisors";

    if (!assetTag || !name) {
      return res.status(400).json({ error: "Asset Tag and Asset Name are required." });
    }

    const existing = await Asset.findOne({ where: { assetTag } });
    if (existing) {
      return res.status(400).json({ error: `Asset with tag '${assetTag}' already exists.` });
    }

    const asset = await Asset.create({
      assetTag: assetTag.trim(),
      name: name.trim(),
      category: category || "Laptop",
      brand: brand?.trim() || null,
      model: model?.trim() || null,
      serialNumber: serialNumber?.trim() || null,
      purchaseDate: purchaseDate || null,
      purchaseCost: purchaseCost ? parseFloat(purchaseCost) : 0,
      warrantyExpiry: warrantyExpiry || null,
      condition: condition || "Good",
      status: status || "Available",
      notes: notes?.trim() || null,
      companyName,
    });

    await logAuditEvent({
      req,
      action: "ASSET_CREATED",
      targetType: "ASSET",
      targetId: asset.id,
      targetName: `${asset.name} (${asset.assetTag})`,
      details: {
        category: asset.category,
        brand: asset.brand,
        model: asset.model,
        serialNumber: asset.serialNumber,
      },
      companyName,
    });

    return res.status(201).json({
      message: "Asset registered successfully",
      asset,
    });
  } catch (error) {
    console.error("Error creating asset:", error);
    return res.status(500).json({ error: "Failed to create asset", details: error.message });
  }
};

// 2. Get list of assets with metrics and filtering
exports.getAssets = async (req, res) => {
  try {
    const { companyName, status, category, condition, employeeId, search } = req.query;
    const effectiveCompany = companyName || req.user?.companyName || "KN Advisors";

    const where = {};
    if (effectiveCompany) where.companyName = effectiveCompany;
    if (status) where.status = status;
    if (category) where.category = category;
    if (condition) where.condition = condition;
    if (employeeId) where.assignedToEmployeeId = employeeId;

    if (search) {
      where[Op.or] = [
        { assetTag: { [Op.iLike]: `%${search}%` } },
        { name: { [Op.iLike]: `%${search}%` } },
        { brand: { [Op.iLike]: `%${search}%` } },
        { model: { [Op.iLike]: `%${search}%` } },
        { serialNumber: { [Op.iLike]: `%${search}%` } },
        { assignedToName: { [Op.iLike]: `%${search}%` } },
        { assignedToEmployeeId: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const assets = await Asset.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });

    // Compute inventory stats
    const allCompanyAssets = await Asset.findAll({
      where: effectiveCompany ? { companyName: effectiveCompany } : {},
      attributes: ["id", "status", "category", "purchaseCost"],
    });

    const metrics = {
      total: allCompanyAssets.length,
      available: allCompanyAssets.filter((a) => a.status === "Available").length,
      assigned: allCompanyAssets.filter((a) => a.status === "Assigned").length,
      maintenance: allCompanyAssets.filter((a) => a.status === "Under Repair").length,
      retired: allCompanyAssets.filter((a) => a.status === "Retired" || a.status === "Lost").length,
      totalValuation: allCompanyAssets.reduce((sum, a) => sum + (parseFloat(a.purchaseCost) || 0), 0),
    };

    return res.status(200).json({
      metrics,
      assets,
    });
  } catch (error) {
    console.error("Error fetching assets:", error);
    return res.status(500).json({ error: "Failed to fetch assets", details: error.message });
  }
};

// 3. Get my assigned assets (Employee Self-Service)
exports.getMyAssets = async (req, res) => {
  try {
    const employeeId = req.user?.employeeId || req.query.employeeId;
    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required." });
    }

    const assets = await Asset.findAll({
      where: {
        assignedToEmployeeId: employeeId,
        status: "Assigned",
      },
      order: [["assignedDate", "DESC"]],
    });

    return res.status(200).json({ assets });
  } catch (error) {
    console.error("Error fetching employee assets:", error);
    return res.status(500).json({ error: "Failed to fetch assigned assets", details: error.message });
  }
};

// 4. Get asset by ID
exports.getAssetById = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findByPk(id);
    if (!asset) {
      return res.status(400).json({ error: "Asset not found" });
    }
    return res.status(200).json({ asset });
  } catch (error) {
    console.error("Error fetching asset:", error);
    return res.status(500).json({ error: "Failed to fetch asset", details: error.message });
  }
};

// 5. Assign asset to employee
exports.assignAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId, assignedDate, expectedReturnDate, condition, notes } = req.body;

    if (!employeeId) {
      return res.status(400).json({ error: "Employee ID is required to assign an asset." });
    }

    const asset = await Asset.findByPk(id);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found." });
    }

    if (asset.status === "Assigned") {
      return res.status(400).json({
        error: `Asset is already assigned to ${asset.assignedToName} (${asset.assignedToEmployeeId}). Please return it first.`,
      });
    }

    // Lookup employee
    const targetUser = await User.findOne({ where: { employeeId } });
    const empName = targetUser
      ? `${targetUser.firstName || ""} ${targetUser.lastName || ""}`.trim()
      : req.body.employeeName || employeeId;
    const empDept = targetUser?.department || req.body.department || "";

    const todayStr = new Date().toISOString().split("T")[0];

    asset.assignedToEmployeeId = employeeId;
    asset.assignedToName = empName;
    asset.assignedToDepartment = empDept;
    asset.assignedDate = assignedDate || todayStr;
    asset.expectedReturnDate = expectedReturnDate || null;
    asset.returnedDate = null;
    asset.status = "Assigned";
    if (condition) asset.condition = condition;
    if (notes) asset.notes = notes;

    await asset.save();

    // Audit log
    await logAuditEvent({
      req,
      action: "ASSET_ASSIGNED",
      targetType: "ASSET",
      targetId: asset.id,
      targetEmployeeId: employeeId,
      targetName: `${asset.name} (${asset.assetTag})`,
      details: {
        assignedTo: empName,
        assignedToEmployeeId: employeeId,
        assignedDate: asset.assignedDate,
        expectedReturnDate: asset.expectedReturnDate,
      },
      companyName: asset.companyName,
    });

    // Notify employee
    try {
      await Notification.create({
        recipientId: employeeId,
        title: "Company Asset Assigned",
        message: `You have been assigned ${asset.name} (Tag: ${asset.assetTag}, Serial: ${asset.serialNumber || "N/A"}). Please handle with care.`,
        type: "ASSET",
        priority: "medium",
        companyName: asset.companyName,
      });
    } catch (notifErr) {
      console.warn("Could not dispatch asset assignment notification:", notifErr.message);
    }

    return res.status(200).json({
      message: `Asset ${asset.assetTag} successfully assigned to ${empName}`,
      asset,
    });
  } catch (error) {
    console.error("Error assigning asset:", error);
    return res.status(500).json({ error: "Failed to assign asset", details: error.message });
  }
};

// 6. Return asset / exit clearance return
exports.returnAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const { returnedDate, condition, status, notes } = req.body;

    const asset = await Asset.findByPk(id);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found." });
    }

    const previousEmployeeId = asset.assignedToEmployeeId;
    const previousEmployeeName = asset.assignedToName;

    const todayStr = new Date().toISOString().split("T")[0];
    asset.returnedDate = returnedDate || todayStr;
    asset.condition = condition || asset.condition;
    asset.status = status || (condition === "Damaged" || condition === "Needs Repair" ? "Under Repair" : "Available");
    if (notes) {
      asset.notes = asset.notes ? `${asset.notes}\n[Return Note]: ${notes}` : notes;
    }

    asset.assignedToEmployeeId = null;
    asset.assignedToName = null;
    asset.assignedToDepartment = null;
    asset.assignedDate = null;
    asset.expectedReturnDate = null;

    await asset.save();

    // Audit log
    await logAuditEvent({
      req,
      action: "ASSET_RETURNED",
      targetType: "ASSET",
      targetId: asset.id,
      targetEmployeeId: previousEmployeeId,
      targetName: `${asset.name} (${asset.assetTag})`,
      details: {
        returnedBy: previousEmployeeName,
        returnedDate: asset.returnedDate,
        returnCondition: asset.condition,
        newStatus: asset.status,
      },
      companyName: asset.companyName,
    });

    if (previousEmployeeId) {
      try {
        await Notification.create({
          recipientId: previousEmployeeId,
          title: "Asset Return Recorded",
          message: `The return of ${asset.name} (${asset.assetTag}) has been verified and cleared by the IT team.`,
          type: "ASSET",
          priority: "low",
          companyName: asset.companyName,
        });
      } catch (notifErr) {
        console.warn("Could not dispatch asset return notification:", notifErr.message);
      }
    }

    return res.status(200).json({
      message: `Asset ${asset.assetTag} returned and marked as ${asset.status}`,
      asset,
    });
  } catch (error) {
    console.error("Error returning asset:", error);
    return res.status(500).json({ error: "Failed to return asset", details: error.message });
  }
};

// 7. Update asset
exports.updateAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findByPk(id);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found." });
    }

    const {
      name,
      category,
      brand,
      model,
      serialNumber,
      purchaseDate,
      purchaseCost,
      warrantyExpiry,
      condition,
      status,
      notes,
    } = req.body;

    if (name) asset.name = name.trim();
    if (category) asset.category = category;
    if (brand !== undefined) asset.brand = brand?.trim() || null;
    if (model !== undefined) asset.model = model?.trim() || null;
    if (serialNumber !== undefined) asset.serialNumber = serialNumber?.trim() || null;
    if (purchaseDate !== undefined) asset.purchaseDate = purchaseDate || null;
    if (purchaseCost !== undefined) asset.purchaseCost = parseFloat(purchaseCost) || 0;
    if (warrantyExpiry !== undefined) asset.warrantyExpiry = warrantyExpiry || null;
    if (condition) asset.condition = condition;
    if (status) asset.status = status;
    if (notes !== undefined) asset.notes = notes;

    await asset.save();

    await logAuditEvent({
      req,
      action: "ASSET_UPDATED",
      targetType: "ASSET",
      targetId: asset.id,
      targetName: `${asset.name} (${asset.assetTag})`,
      details: { condition: asset.condition, status: asset.status },
      companyName: asset.companyName,
    });

    return res.status(200).json({ message: "Asset updated successfully", asset });
  } catch (error) {
    console.error("Error updating asset:", error);
    return res.status(500).json({ error: "Failed to update asset", details: error.message });
  }
};

// 8. Delete asset (Admin only)
exports.deleteAsset = async (req, res) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findByPk(id);
    if (!asset) {
      return res.status(404).json({ error: "Asset not found." });
    }

    if (asset.status === "Assigned") {
      return res.status(400).json({
        error: "Cannot delete an asset currently assigned to an employee. Return it first.",
      });
    }

    const assetTag = asset.assetTag;
    const assetName = asset.name;
    const company = asset.companyName;

    await asset.destroy();

    await logAuditEvent({
      req,
      action: "ASSET_DELETED",
      targetType: "ASSET",
      targetId: id,
      targetName: `${assetName} (${assetTag})`,
      details: { assetTag, assetName },
      companyName: company,
    });

    return res.status(200).json({ message: `Asset ${assetTag} deleted successfully.` });
  } catch (error) {
    console.error("Error deleting asset:", error);
    return res.status(500).json({ error: "Failed to delete asset", details: error.message });
  }
};
