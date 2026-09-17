const { Report } = require("../models");

exports.getReports = async (req, res) => {
  const { companyName } = req.query;
  if (!companyName) {
    return res.status(400).json({ error: 'Company name is required' });
  }

  try {
    const results = await Report.findAll({
      where: { companyName },
      order: [['id', 'DESC']],
    });
    res.json(results);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.getTheReports = async (req, res) => {
  const { employeeId } = req.query;

  if (!employeeId) {
    return res.status(400).json({ error: "employeeId is required" });
  }

  try {
    const results = await Report.findAll({
      where: { employeeId },
      order: [['id', 'DESC']],
    });
    res.json(results);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: error.message });
  }
};

exports.updateFeedbackByEmployeeId = async (req, res) => {
  const { employeeId } = req.body;
  const { feedback } = req.body;
  const { id } = req.params;

  if (!feedback) {
    return res.status(400).json({ error: 'Feedback is required' });
  }

  try {
    const result = await Report.update(
      { feedback },
      { where: { id, employeeId } }
    );

    if (result[0] === 0) {
      return res.status(404).json({ message: 'Employee report not found' });
    }

    res.status(200).json({ message: 'Feedback updated successfully' });
  } catch (error) {
    console.error('Error updating feedback:', error);
    res.status(500).json({ error: 'Failed to update feedback' });
  }
};

exports.createReport = async (req, res) => {
  const { employeeId, department, date, taskName, workDescription, hoursWorked, companyName } = req.body;

  try {
    const report = await Report.create({
      employeeId, department, date, taskName, workDescription, hoursWorked, companyName,
    });
    res.json({ message: "Report added successfully", id: report.id });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ error: error.message });
  }
};