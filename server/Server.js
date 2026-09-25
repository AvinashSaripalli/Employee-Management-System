const path = require('path');
const fs = require('fs');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config({ override: true });
// Reloaded with active MAIL_PASS

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
const { initAutoClockOutScheduler } = require('./utils/autoClockOut');

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

const messageRoutes = require('./routes/messageRoutes');
app.use('/api/messages', messageRoutes);

const crmRoutes = require('./routes/crmRoutes');
app.use('/api/crm', crmRoutes);

const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api/notifications', verifyToken, notificationRoutes);

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

// --- Socket.IO ---
const server = http.createServer(app);
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'DELETE'] },
});
app.set('io', io);

const onlineUsers = new Map(); // employeeId -> socketId

io.on('connection', (socket) => {
  // auth via token in handshake auth or query
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  let user = null;
  if (token) {
    try { user = jwt.verify(token, process.env.JWT_SECRET); } catch {}
  }
  if (user?.employeeId) {
    onlineUsers.set(user.employeeId, socket.id);
    socket.employeeId = user.employeeId;
    socket.companyName = user.companyName;
    socket.join(`company:${user.companyName}`);
    io.to(`company:${user.companyName}`).emit('presence:update', { online: Array.from(onlineUsers.keys()).filter((id) => {
      // only those in same company (approx)
      return true;
    })});
  }

  socket.on('join:conversation', (conversationId) => {
    if (conversationId) socket.join(conversationId);
  });
  socket.on('leave:conversation', (conversationId) => {
    if (conversationId) socket.leave(conversationId);
  });
  socket.on('typing:start', (payload) => {
    const { conversationId, senderName } = payload || {};
    if (conversationId) socket.to(conversationId).emit('typing:start', { conversationId, senderName, employeeId: socket.employeeId });
  });
  socket.on('typing:stop', (payload) => {
    const { conversationId } = payload || {};
    if (conversationId) socket.to(conversationId).emit('typing:stop', { conversationId, employeeId: socket.employeeId });
  });
  socket.on('disconnect', () => {
    if (socket.employeeId) {
      onlineUsers.delete(socket.employeeId);
      if (socket.companyName) io.to(`company:${socket.companyName}`).emit('presence:update', { online: Array.from(onlineUsers.keys()) });
    }
  });
});

ensureLeaveSchema()
  .then(() => backfillCompanyMembership())
  .then(() => require('./models').Department.sync())
  .then(() => require('./models').LeaveApprovalSetting.sync({ alter: true }))
  .then(() => require('./models').Report.sync({ alter: true }))
  .then(() => require('./models').Message.sync())
  .then(() => require('./models').Workgroup.sync({ alter: true }))
  .then(() => require('./models').CrmLead.sync({ alter: true }))
  .then(() => require('./models').CrmAccount.sync())
  .then(() => require('./models').CrmOpportunity.sync({ alter: true }))
  .then(() => require('./models').CrmActivity.sync())
  .then(() => require('./models').CrmContact.sync())
  .then(() => require('./models').CrmProduct.sync())
  .then(() => require('./models').CrmQuote.sync())
  .then(() => require('./models').AttendancePermission.sync({ alter: true }))
  .then(() => require('./utils/seedCrm').seedCrm())
  .catch((err) => {
    console.error('Startup data sync failed:', err.message);
  })
  .finally(() => {
    initAutoClockOutScheduler();
    server.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  });
