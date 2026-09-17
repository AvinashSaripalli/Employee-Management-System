const { Workgroup, User } = require('../models');

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