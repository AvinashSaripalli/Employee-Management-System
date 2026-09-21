const { Op } = require('sequelize');
const { Workgroup, User, sequelize } = require('../models');

const normalizeEmployeeIds = (employeeIds) => [...new Set(
  (Array.isArray(employeeIds) ? employeeIds : [])
    .map((employeeId) => String(employeeId || '').trim())
    .filter(Boolean)
)];

const validDate = (value) => {
  if (!value) return new Date();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const verifyMembers = async (companyName, employeeIds) => {
  const users = await User.findAll({
    where: { companyName, employeeId: employeeIds, exists: 1 },
    attributes: ['employeeId'],
  });
  const validIds = new Set(users.map((user) => user.employeeId));
  return employeeIds.filter((employeeId) => validIds.has(employeeId));
};

const groupWhere = (companyName, partnerCompanyName) => ({
  companyName,
  partnerCompanyName,
});

const safeJsonParse = (raw, fallback = []) => {
  if (!raw) return fallback;
  if (typeof raw !== 'string') return raw;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
};

exports.createWorkGroup = async (req, res) => {
  const {
    groupName,
    partnerCompanyName,
    description,
    category,
    status,
    createdOn,
    privacyType,
    leaderId,
    tags,
    employeers,
  } = req.body;

  const companyName = req.user?.companyName;
  const partnerName = String(partnerCompanyName || groupName || '').trim();
  const displayName = String(groupName || partnerName).trim();
  let employeeIds = normalizeEmployeeIds(employeers);
  const workgroupDate = validDate(createdOn);

  if (!companyName) {
    return res.status(400).json({ error: 'Company is required' });
  }
  if (!partnerName) {
    return res.status(400).json({ error: 'Group name or partner company is required' });
  }

  // If leaderId is specified, ensure leader is among the members
  const designatedLeader = leaderId ? String(leaderId).trim() : null;
  if (designatedLeader && !employeeIds.includes(designatedLeader)) {
    employeeIds.push(designatedLeader);
  }

  if (!employeeIds.length) {
    return res.status(400).json({ error: 'At least one employee is required' });
  }
  if (!workgroupDate) {
    return res.status(400).json({ error: 'createdOn must be a valid date' });
  }

  try {
    const validEmployeeIds = await verifyMembers(companyName, employeeIds);
    if (validEmployeeIds.length !== employeeIds.length) {
      return res.status(400).json({ error: 'One or more employees do not belong to this company' });
    }

    const existingGroup = await Workgroup.findOne({ where: groupWhere(companyName, partnerName) });
    if (existingGroup) {
      return res.status(409).json({ error: 'A workgroup with this identifier already exists' });
    }

    const finalLeader = designatedLeader || validEmployeeIds[0];

    const rows = await sequelize.transaction((transaction) => Promise.all(
      validEmployeeIds.map((employeeId) => Workgroup.create({
        companyName,
        groupName: displayName,
        partnerCompanyName: partnerName,
        description: description || '',
        category: category || 'Project Pod',
        status: status || 'Active',
        leaderId: finalLeader,
        memberRole: employeeId === finalLeader ? 'Leader' : 'Member',
        tags: Array.isArray(tags) ? tags.join(', ') : (tags || ''),
        resources: JSON.stringify([]),
        announcements: JSON.stringify([]),
        createdOn: workgroupDate,
        privacyType: privacyType || 'Private',
        employeeId,
      }, { transaction }))
    ));

    return res.status(201).json({ message: 'Workgroup created successfully', count: rows.length, data: rows });
  } catch (error) {
    console.error('Error creating workgroup:', error);
    return res.status(500).json({ error: 'Database error creating workgroup' });
  }
};

exports.updateWorkGroup = async (req, res) => {
  const { id } = req.params;
  const {
    groupName,
    partnerCompanyName,
    description,
    category,
    status,
    createdOn,
    privacyType,
    leaderId,
    tags,
    employeers,
  } = req.body;

  const companyName = req.user?.companyName;
  const nextDate = createdOn ? validDate(createdOn) : null;
  let employeeIds = Array.isArray(employeers) ? normalizeEmployeeIds(employeers) : null;

  try {
    const existing = await Workgroup.findByPk(id);
    if (!existing || existing.companyName !== companyName) {
      return res.status(404).json({ error: 'Workgroup not found' });
    }
    if (createdOn && !nextDate) {
      return res.status(400).json({ error: 'createdOn must be a valid date' });
    }

    const oldPartner = existing.partnerCompanyName;
    const nextPartner = String(partnerCompanyName || existing.partnerCompanyName).trim();
    const nextGroupName = String(groupName || existing.groupName || nextPartner).trim();

    if (!nextPartner) return res.status(400).json({ error: 'Partner identifier is required' });

    if (nextPartner !== oldPartner) {
      const duplicate = await Workgroup.findOne({ where: groupWhere(companyName, nextPartner) });
      if (duplicate) return res.status(409).json({ error: 'A workgroup with this name already exists' });
    }

    const nextLeader = leaderId !== undefined ? (leaderId ? String(leaderId).trim() : null) : existing.leaderId;
    if (nextLeader && employeeIds && !employeeIds.includes(nextLeader)) {
      employeeIds.push(nextLeader);
    }

    if (employeeIds) {
      if (!employeeIds.length) {
        return res.status(400).json({ error: 'At least one employee is required' });
      }
      const validEmployeeIds = await verifyMembers(companyName, employeeIds);
      if (validEmployeeIds.length !== employeeIds.length) {
        return res.status(400).json({ error: 'One or more employees do not belong to this company' });
      }
    }

    await sequelize.transaction(async (transaction) => {
      const where = groupWhere(companyName, oldPartner);
      const updatedWhere = groupWhere(companyName, nextPartner);

      const metadata = {};
      if (nextPartner !== oldPartner) metadata.partnerCompanyName = nextPartner;
      if (groupName !== undefined) metadata.groupName = nextGroupName;
      if (description !== undefined) metadata.description = description;
      if (category !== undefined) metadata.category = category;
      if (status !== undefined) metadata.status = status;
      if (nextDate) metadata.createdOn = nextDate;
      if (privacyType) metadata.privacyType = privacyType;
      if (nextLeader !== undefined) metadata.leaderId = nextLeader;
      if (tags !== undefined) metadata.tags = Array.isArray(tags) ? tags.join(', ') : (tags || '');

      if (Object.keys(metadata).length) {
        await Workgroup.update(metadata, { where, transaction });
      }

      if (employeeIds) {
        const currentRows = await Workgroup.findAll({ where: updatedWhere, transaction });
        const currentIds = currentRows.map((row) => row.employeeId);
        const toAdd = employeeIds.filter((empId) => !currentIds.includes(empId));
        const toRemove = currentIds.filter((empId) => !employeeIds.includes(empId));

        if (toRemove.length) {
          await Workgroup.destroy({ where: { ...updatedWhere, employeeId: toRemove }, transaction });
        }

        if (toAdd.length) {
          const sampleRow = currentRows[0] || existing;
          await Promise.all(toAdd.map((empId) => Workgroup.create({
            companyName,
            groupName: nextGroupName,
            partnerCompanyName: nextPartner,
            description: metadata.description !== undefined ? metadata.description : sampleRow.description,
            category: metadata.category !== undefined ? metadata.category : sampleRow.category,
            status: metadata.status !== undefined ? metadata.status : sampleRow.status,
            leaderId: nextLeader,
            memberRole: empId === nextLeader ? 'Leader' : 'Member',
            tags: metadata.tags !== undefined ? metadata.tags : sampleRow.tags,
            resources: sampleRow.resources || JSON.stringify([]),
            announcements: sampleRow.announcements || JSON.stringify([]),
            createdOn: nextDate || sampleRow.createdOn || new Date(),
            privacyType: privacyType || sampleRow.privacyType || 'Private',
            employeeId: empId,
          }, { transaction })));
        }

        // Ensure leader has Leader role
        if (nextLeader) {
          await Workgroup.update(
            { memberRole: 'Leader' },
            { where: { ...updatedWhere, employeeId: nextLeader }, transaction }
          );
        }
      }
    });

    return res.json({ message: 'Workgroup updated successfully' });
  } catch (error) {
    console.error('Error updating workgroup:', error);
    return res.status(500).json({ error: 'Database error updating workgroup' });
  }
};

exports.deleteWorkGroup = async (req, res) => {
  const { id } = req.params;
  const companyName = req.user?.companyName;

  try {
    const existing = await Workgroup.findByPk(id);
    if (!existing || existing.companyName !== companyName) {
      return res.status(404).json({ error: 'Workgroup not found' });
    }

    const deleted = await Workgroup.destroy({
      where: groupWhere(existing.companyName, existing.partnerCompanyName),
    });

    return res.json({ message: 'Workgroup deleted successfully', count: deleted });
  } catch (error) {
    console.error('Error deleting workgroup:', error);
    return res.status(500).json({ error: 'Database error deleting workgroup' });
  }
};

exports.getWorkGroups = async (req, res) => {
  const companyName = req.user?.companyName || req.query.companyName;
  const currentEmployeeId = req.user?.employeeId;
  const { search, category, status, privacyType, myGroups } = req.query;

  if (!companyName) {
    return res.status(400).json({ error: 'Company is required' });
  }

  try {
    const where = { companyName };
    if (status) where.status = status;
    if (privacyType) where.privacyType = privacyType;
    if (category && category !== 'All') where.category = category;

    if (search) {
      where[Op.or] = [
        { groupName: { [Op.iLike ? Op.iLike : Op.like]: `%${search}%` } },
        { partnerCompanyName: { [Op.iLike ? Op.iLike : Op.like]: `%${search}%` } },
        { tags: { [Op.iLike ? Op.iLike : Op.like]: `%${search}%` } },
      ];
    }

    const results = await Workgroup.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: [
            'firstName', 'lastName', 'email', 'phoneNumber', 'role',
            'designation', 'department', 'jobLocation', 'technicalSkills',
            'gender', 'photo', 'employeeId',
          ],
          where: { exists: 1 },
          required: false,
        },
        {
          model: User,
          as: 'leader',
          attributes: [
            'firstName', 'lastName', 'email', 'designation', 'department',
            'photo', 'employeeId',
          ],
          required: false,
        },
      ],
      order: [['createdOn', 'DESC'], ['id', 'ASC']],
    });

    const workgroups = results.map((wg) => ({
      id: wg.id,
      companyName: wg.companyName,
      groupName: wg.groupName || wg.partnerCompanyName,
      partnerCompanyName: wg.partnerCompanyName,
      description: wg.description || '',
      category: wg.category || 'Project Pod',
      status: wg.status || 'Active',
      leaderId: wg.leaderId || null,
      memberRole: wg.memberRole || (wg.employeeId === wg.leaderId ? 'Leader' : 'Member'),
      tags: wg.tags || '',
      resources: safeJsonParse(wg.resources, []),
      announcements: safeJsonParse(wg.announcements, []),
      createdOn: wg.createdOn,
      privacyType: wg.privacyType || 'Private',
      employeeId: wg.employeeId,
      isCurrentUser: currentEmployeeId ? wg.employeeId === currentEmployeeId : false,
      isLeader: currentEmployeeId ? wg.leaderId === currentEmployeeId : false,
      leader: wg.leader ? wg.leader.toJSON() : null,
      ...(wg.user ? wg.user.toJSON() : {}),
    }));

    if (myGroups === 'true' && currentEmployeeId) {
      // Filter only groups where current employee is a member
      const memberGroupPartners = new Set(
        workgroups
          .filter((w) => w.employeeId === currentEmployeeId)
          .map((w) => w.partnerCompanyName)
      );
      return res.json(workgroups.filter((w) => memberGroupPartners.has(w.partnerCompanyName)));
    }

    return res.json(workgroups);
  } catch (error) {
    console.error('Error fetching workgroups:', error);
    return res.status(500).json({ error: 'Database error fetching workgroups' });
  }
};

// Self-service join for public workgroups
exports.joinWorkGroup = async (req, res) => {
  const { id } = req.params;
  const companyName = req.user?.companyName;
  const employeeId = req.user?.employeeId;

  if (!employeeId || !companyName) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const targetGroup = await Workgroup.findByPk(id);
    if (!targetGroup || targetGroup.companyName !== companyName) {
      return res.status(404).json({ error: 'Workgroup not found' });
    }

    const isAdmin = ['Admin', 'Manager'].includes(req.user.role);
    if (targetGroup.privacyType !== 'Public' && !isAdmin) {
      return res.status(403).json({ error: 'Cannot join private workgroup without invitation' });
    }

    const existingMember = await Workgroup.findOne({
      where: {
        companyName,
        partnerCompanyName: targetGroup.partnerCompanyName,
        employeeId,
      },
    });

    if (existingMember) {
      return res.status(400).json({ error: 'You are already a member of this workgroup' });
    }

    const newMemberRow = await Workgroup.create({
      companyName,
      groupName: targetGroup.groupName || targetGroup.partnerCompanyName,
      partnerCompanyName: targetGroup.partnerCompanyName,
      description: targetGroup.description,
      category: targetGroup.category,
      status: targetGroup.status,
      leaderId: targetGroup.leaderId,
      memberRole: 'Member',
      tags: targetGroup.tags,
      resources: targetGroup.resources,
      announcements: targetGroup.announcements,
      createdOn: targetGroup.createdOn,
      privacyType: targetGroup.privacyType,
      employeeId,
    });

    return res.status(201).json({ message: 'Successfully joined workgroup', data: newMemberRow });
  } catch (error) {
    console.error('Error joining workgroup:', error);
    return res.status(500).json({ error: 'Database error joining workgroup' });
  }
};

// Self-service leave workgroup
exports.leaveWorkGroup = async (req, res) => {
  const { id } = req.params;
  const companyName = req.user?.companyName;
  const employeeId = req.user?.employeeId;

  if (!employeeId || !companyName) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const targetGroup = await Workgroup.findByPk(id);
    if (!targetGroup || targetGroup.companyName !== companyName) {
      return res.status(404).json({ error: 'Workgroup not found' });
    }

    const membership = await Workgroup.findOne({
      where: {
        companyName,
        partnerCompanyName: targetGroup.partnerCompanyName,
        employeeId,
      },
    });

    if (!membership) {
      return res.status(400).json({ error: 'You are not a member of this workgroup' });
    }

    const totalMembers = await Workgroup.count({
      where: { companyName, partnerCompanyName: targetGroup.partnerCompanyName },
    });

    if (totalMembers <= 1) {
      return res.status(400).json({ error: 'Cannot leave as the only member. Delete the workgroup instead.' });
    }

    if (targetGroup.leaderId === employeeId) {
      // Reassign leader to another member if leader leaves
      const otherMember = await Workgroup.findOne({
        where: {
          companyName,
          partnerCompanyName: targetGroup.partnerCompanyName,
          employeeId: { [Op.ne]: employeeId },
        },
      });

      if (otherMember) {
        await Workgroup.update(
          { leaderId: otherMember.employeeId },
          { where: { companyName, partnerCompanyName: targetGroup.partnerCompanyName } }
        );
        await Workgroup.update(
          { memberRole: 'Leader' },
          { where: { companyName, partnerCompanyName: targetGroup.partnerCompanyName, employeeId: otherMember.employeeId } }
        );
      }
    }

    await membership.destroy();
    return res.json({ message: 'Successfully left workgroup' });
  } catch (error) {
    console.error('Error leaving workgroup:', error);
    return res.status(500).json({ error: 'Database error leaving workgroup' });
  }
};

// Update member role (Leader, Co-Lead, Moderator, Member)
exports.updateMemberRole = async (req, res) => {
  const { id } = req.params;
  const { targetEmployeeId, role } = req.body;
  const companyName = req.user?.companyName;
  const currentUserRole = req.user?.role;
  const currentEmployeeId = req.user?.employeeId;

  if (!targetEmployeeId || !role) {
    return res.status(400).json({ error: 'targetEmployeeId and role are required' });
  }

  try {
    const targetGroup = await Workgroup.findByPk(id);
    if (!targetGroup || targetGroup.companyName !== companyName) {
      return res.status(404).json({ error: 'Workgroup not found' });
    }

    const isAuthorized =
      ['Admin', 'Manager'].includes(currentUserRole) ||
      targetGroup.leaderId === currentEmployeeId;

    if (!isAuthorized) {
      return res.status(403).json({ error: 'Only admins, managers, or workgroup leaders can change roles' });
    }

    const memberRow = await Workgroup.findOne({
      where: {
        companyName,
        partnerCompanyName: targetGroup.partnerCompanyName,
        employeeId: targetEmployeeId,
      },
    });

    if (!memberRow) {
      return res.status(404).json({ error: 'Member not found in this workgroup' });
    }

    await memberRow.update({ memberRole: role });

    // If promoted to Leader, also update leaderId across all rows for this group
    if (role === 'Leader') {
      await Workgroup.update(
        { leaderId: targetEmployeeId },
        { where: { companyName, partnerCompanyName: targetGroup.partnerCompanyName } }
      );
    }

    return res.json({ message: 'Member role updated successfully', role });
  } catch (error) {
    console.error('Error updating member role:', error);
    return res.status(500).json({ error: 'Database error updating role' });
  }
};

// Add announcement to workgroup noticeboard
exports.addAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, content, pinned } = req.body;
  const companyName = req.user?.companyName;
  const employeeId = req.user?.employeeId;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  try {
    const targetGroup = await Workgroup.findByPk(id);
    if (!targetGroup || targetGroup.companyName !== companyName) {
      return res.status(404).json({ error: 'Workgroup not found' });
    }

    const author = await User.findOne({ where: { employeeId, companyName } });
    const authorName = author ? `${author.firstName} ${author.lastName}` : (req.user.firstName || 'Member');
    const authorPhoto = author?.photo || null;

    const currentAnnouncements = safeJsonParse(targetGroup.announcements, []);
    const newAnnouncement = {
      id: Date.now().toString(),
      title: title.trim(),
      content: content.trim(),
      authorName,
      authorPhoto,
      authorId: employeeId,
      createdAt: new Date().toISOString(),
      pinned: Boolean(pinned),
    };

    const updated = [newAnnouncement, ...currentAnnouncements];

    await Workgroup.update(
      { announcements: JSON.stringify(updated) },
      { where: { companyName, partnerCompanyName: targetGroup.partnerCompanyName } }
    );

    return res.status(201).json({ message: 'Announcement posted', data: newAnnouncement, announcements: updated });
  } catch (error) {
    console.error('Error adding announcement:', error);
    return res.status(500).json({ error: 'Database error adding announcement' });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  const { id, announcementId } = req.params;
  const companyName = req.user?.companyName;

  try {
    const targetGroup = await Workgroup.findByPk(id);
    if (!targetGroup || targetGroup.companyName !== companyName) {
      return res.status(404).json({ error: 'Workgroup not found' });
    }

    const current = safeJsonParse(targetGroup.announcements, []);
    const updated = current.filter((item) => String(item.id) !== String(announcementId));

    await Workgroup.update(
      { announcements: JSON.stringify(updated) },
      { where: { companyName, partnerCompanyName: targetGroup.partnerCompanyName } }
    );

    return res.json({ message: 'Announcement removed', announcements: updated });
  } catch (error) {
    console.error('Error deleting announcement:', error);
    return res.status(500).json({ error: 'Database error deleting announcement' });
  }
};

// Add shared resource / link
exports.addResource = async (req, res) => {
  const { id } = req.params;
  const { title, url, type, description } = req.body;
  const companyName = req.user?.companyName;
  const employeeId = req.user?.employeeId;

  if (!title || !url) {
    return res.status(400).json({ error: 'Title and URL are required' });
  }

  try {
    const targetGroup = await Workgroup.findByPk(id);
    if (!targetGroup || targetGroup.companyName !== companyName) {
      return res.status(404).json({ error: 'Workgroup not found' });
    }

    const author = await User.findOne({ where: { employeeId, companyName } });
    const authorName = author ? `${author.firstName} ${author.lastName}` : 'Team Member';

    const currentResources = safeJsonParse(targetGroup.resources, []);
    const newResource = {
      id: Date.now().toString(),
      title: title.trim(),
      url: url.trim(),
      type: type || 'link',
      description: description ? description.trim() : '',
      addedBy: employeeId,
      addedByName: authorName,
      addedAt: new Date().toISOString(),
    };

    const updated = [newResource, ...currentResources];

    await Workgroup.update(
      { resources: JSON.stringify(updated) },
      { where: { companyName, partnerCompanyName: targetGroup.partnerCompanyName } }
    );

    return res.status(201).json({ message: 'Resource added', data: newResource, resources: updated });
  } catch (error) {
    console.error('Error adding resource:', error);
    return res.status(500).json({ error: 'Database error adding resource' });
  }
};

// Delete shared resource
exports.deleteResource = async (req, res) => {
  const { id, resourceId } = req.params;
  const companyName = req.user?.companyName;

  try {
    const targetGroup = await Workgroup.findByPk(id);
    if (!targetGroup || targetGroup.companyName !== companyName) {
      return res.status(404).json({ error: 'Workgroup not found' });
    }

    const current = safeJsonParse(targetGroup.resources, []);
    const updated = current.filter((item) => String(item.id) !== String(resourceId));

    await Workgroup.update(
      { resources: JSON.stringify(updated) },
      { where: { companyName, partnerCompanyName: targetGroup.partnerCompanyName } }
    );

    return res.json({ message: 'Resource removed', resources: updated });
  } catch (error) {
    console.error('Error deleting resource:', error);
    return res.status(500).json({ error: 'Database error deleting resource' });
  }
};
