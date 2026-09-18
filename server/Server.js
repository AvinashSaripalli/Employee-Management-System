const path = require('path');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const { verifyToken } = require('./middleware/authMiddleware');

const app = express();
const port = process.env.PORT || 5000;

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadsDir));

const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);

const { ensureLeaveSchema } = require('./utils/leaveSchema');
const { backfillCompanyMembership } = require('./utils/companyMembership');

const leaveRoutes = require('./routes/leaveRoutes');
app.use('/api/leaves', verifyToken, leaveRoutes);

const reportRoutes = require("./routes/reportRoutes");
app.use("/api/reports", verifyToken, reportRoutes);

const attendanceRoutes = require('./routes/attendanceRoutes');
app.use('/api/attendance', verifyToken, attendanceRoutes);

const workRoutes = require('./routes/workRoutes');
app.use('/api/workgroups', verifyToken, workRoutes);

const taskRoutes = require('./routes/taskRoutes');
app.use('/api/tasks', verifyToken, taskRoutes);

const departmentRoutes = require('./routes/departmentRoutes');
app.use('/api/departments', departmentRoutes);

const distPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

ensureLeaveSchema()
  .then(() => backfillCompanyMembership())
  .then(() => require('./models').Department.sync())
  .catch((err) => {
    console.error('Startup data sync failed:', err.message);
  })
  .finally(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  });