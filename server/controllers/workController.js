const { Workgroup, User } = require('../models');

exports.createWorkGroup = async (req, res) => {
  const { partnerCompanyName, createdOn, privacyType, employeers } = req.body;
  const companyName = req.user?.companyName || req.body.companyName;
  if (!companyName || !partnerCompanyName) {
    return res.status(400).json({ error: 'companyName and partnerCompanyName are required' });
  }
  if (!Array.isArray(employeers) || employeers.length === 0) {
    return res.status(400).json({ error: 'At least one employee is required' });
  }
  try {
    const rows = await Promise.all(
      employeers.map((employeeId) =>
        Workgroup.create({
          companyName,
          partnerCompanyName,
          createdOn: createdOn ? new Date(createdOn) : new Date(),
          privacyType: privacyType || 'Private',
          employeeId,
        })
      )
    );
    return res.status(201).json({ message: 'Workgroup created', count: rows.length, data: rows });
  } catch (error) {
    console.error('Error creating workgroup:', error);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.updateWorkGroup = async (req, res) => {
  const { id } = req.params;
  const { partnerCompanyName, createdOn, privacyType, employeers } = req.body;
  const companyName = req.user?.companyName || req.body.companyName;
  try {
    // Find existing group by id to get old partner name
    const existing = await Workgroup.findByPk(id);
    if (!existing) return res.status(404).json({ error: 'Workgroup not found' });
    const oldPartner = existing.partnerCompanyName;
    const targetCompany = companyName || existing.companyName;
    // Update metadata for all rows with old partnerCompanyName + company
    if (partnerCompanyName && partnerCompanyName !== oldPartner) {
      await Workgroup.update(
        { partnerCompanyName },
        { where: { companyName: targetCompany, partnerCompanyName: oldPartner } }
      );
    }
    if (createdOn || privacyType) {
      const updates = {};
      if (createdOn) updates.createdOn = new Date(createdOn);
      if (privacyType) updates.privacyType = privacyType;
      await Workgroup.update(updates, { where: { companyName: targetCompany, partnerCompanyName: partnerCompanyName || oldPartner } });
    }
    // Sync members if provided
    if (Array.isArray(employeers)) {
      const currentRows = await Workgroup.findAll({ where: { companyName: targetCompany, partnerCompanyName: partnerCompanyName || oldPartner } });
      const currentIds = currentRows.map((r) => r.employeeId);
      const toAdd = employeers.filter((eid) => !currentIds.includes(eid));
      const toRemove = currentIds.filter((eid) => !employeers.includes(eid));
      if (toRemove.length) {
        await Workgroup.destroy({ where: { companyName: targetCompany, partnerCompanyName: partnerCompanyName || oldPartner, employeeId: toRemove } });
      }
      await Promise.all(
        toAdd.map((employeeId) =>
          Workgroup.create({
            companyName: targetCompany,
            partnerCompanyName: partnerCompanyName || oldPartner,
            createdOn: createdOn ? new Date(createdOn) : new Date(),
            privacyType: privacyType || existing.privacyType || 'Private',
            employeeId,
          })
        )
      );
    }
    return res.json({ message: 'Workgroup updated' });
  } catch (error) {
    console.error('Error updating workgroup:', error);
    return res.status(500).json({ error: 'Database error' });
  }
};

exports.getWorkGroups = async (req, res) => {
  const { companyName } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const results = await Workgroup.findAll({
      where: { companyName },
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'firstName', 'lastName', 'email', 'phoneNumber', 'role',
            'designation', 'department', 'jobLocation', 'technicalSkills',
            'gender', 'photo',
          ],
          where: { exists: 1 },
          required: true,
        },
      ],
      order: [['createdOn', 'DESC']],
    });

    const workgroups = results.map(wg => ({
      id: wg.id,
      companyName: wg.companyName,
      createdOn: wg.createdOn,
      privacyType: wg.privacyType,
      employeeId: wg.employeeId,
      partnerCompanyName: wg.partnerCompanyName,
      ...(wg.user ? {
        firstName: wg.user.firstName,
        lastName: wg.user.lastName,
        email: wg.user.email,
        phoneNumber: wg.user.phoneNumber,
        role: wg.user.role,
        designation: wg.user.designation,
        department: wg.user.department,
        jobLocation: wg.user.jobLocation,
        technicalSkills: wg.user.technicalSkills,
        gender: wg.user.gender,
        photo: wg.user.photo,
      } : {}),
    }));

    res.json(workgroups);
  } catch (error) {
    console.error('Error fetching workgroups:', error);
    res.status(500).json({ error: 'Database error' });
  }
};