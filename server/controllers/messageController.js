const { Op } = require("sequelize");
const { Message, User } = require("../models");

const parseReactions = (raw) => {
  try { return raw ? JSON.parse(raw) : {}; } catch { return {}; }
};
const stringifyReactions = (obj) => JSON.stringify(obj);

exports.getDirectory = async (req, res) => {
  const companyName = req.query.companyName || req.user?.companyName;
  if (!companyName) return res.status(400).json({ error: "Company name required" });
  try {
    const users = await User.findAll({
      where: { companyName, exists: 1 },
      attributes: ["id", "firstName", "lastName", "email", "employeeId", "designation", "department", "photo", "role"],
      order: [["firstName", "ASC"]],
    });
    const mapped = users.map((u) => ({
      id: u.id,
      employeeId: u.employeeId,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      designation: u.designation,
      department: u.department,
      role: u.role,
      photo: u.photo ? `${req.protocol}://${req.get("host")}${u.photo}` : null,
    }));
    return res.json(mapped);
  } catch (e) {
    console.error("getDirectory", e);
    return res.status(500).json({ error: "Failed to fetch directory" });
  }
};

exports.getConversations = async (req, res) => {
  const companyName = req.query.companyName || req.user?.companyName;
  const employeeId = req.user?.employeeId || req.query.employeeId;
  if (!companyName || !employeeId) return res.status(400).json({ error: "companyName and employeeId required" });
  try {
    // distinct conversationIds where user participates (sender or conversationId contains them, or company-wide)
    const rows = await Message.findAll({
      where: { companyName, isDeleted: false },
      attributes: ["conversationId"],
      group: ["conversationId"],
      raw: true,
    });
    const participantConvs = rows
      .map((r) => r.conversationId)
      .filter((cid) => cid.includes(employeeId) || cid.startsWith("company:") || cid.startsWith("group:"));

    // also include workgroup ids where user is member? For now return participantConvs
    const result = [];
    for (const cid of participantConvs) {
      const last = await Message.findOne({
        where: { conversationId: cid, companyName, isDeleted: false },
        order: [["created_at", "DESC"]],
      });
      if (!last) continue;
      const count = await Message.count({ where: { conversationId: cid, companyName, isDeleted: false } });
      const unread = await Message.count({
        where: { conversationId: cid, companyName, isDeleted: false, senderEmployeeId: { [Op.ne]: employeeId } },
      });
      result.push({
        conversationId: cid,
        lastMessage: last ? { content: last.content, senderName: last.senderName, created_at: last.created_at, messageType: last.messageType } : null,
        count,
        unread,
      });
    }
    // sort by last message time desc
    result.sort((a, b) => new Date(b.lastMessage?.created_at || 0) - new Date(a.lastMessage?.created_at || 0));
    return res.json(result);
  } catch (e) {
    console.error("getConversations", e);
    return res.status(500).json({ error: "Failed" });
  }
};

exports.getMessages = async (req, res) => {
  const { conversationId, companyName, limit = 100, offset = 0 } = req.query;
  if (!conversationId || !companyName) return res.status(400).json({ error: "conversationId and companyName required" });
  try {
    const msgs = await Message.findAll({
      where: { conversationId, companyName },
      order: [["created_at", "ASC"]],
      limit: Math.min(parseInt(limit, 10) || 100, 200),
      offset: parseInt(offset, 10) || 0,
    });
    const mapped = msgs.map((m) => {
      const j = m.toJSON();
      return {
        ...j,
        senderPhoto: j.senderPhoto ? (j.senderPhoto.startsWith("http") ? j.senderPhoto : `${req.protocol}://${req.get("host")}${j.senderPhoto}`) : null,
        fileUrl: j.fileUrl ? (j.fileUrl.startsWith("http") ? j.fileUrl : `${req.protocol}://${req.get("host")}${j.fileUrl}`) : null,
        reactions: parseReactions(j.reactions),
      };
    });
    return res.json(mapped);
  } catch (e) {
    console.error("getMessages", e);
    return res.status(500).json({ error: "Failed" });
  }
};

exports.sendMessage = async (req, res) => {
  const { conversationId, content, messageType, replyToId } = req.body;
  const companyName = req.body.companyName || req.user?.companyName;
  if (!conversationId || !companyName) return res.status(400).json({ error: "conversationId and companyName required" });
  const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
  const fileName = req.file ? req.file.originalname : null;
  const text = (content || "").toString().trim();
  if (!text && !fileUrl) return res.status(400).json({ error: "Message content or file required" });
  try {
    const senderId = req.user?.id;
    const sender = await User.findByPk(senderId);
    if (!sender) return res.status(401).json({ error: "Sender not found" });
    const msg = await Message.create({
      conversationId,
      companyName,
      senderId: sender.id,
      senderEmployeeId: sender.employeeId,
      senderName: `${sender.firstName} ${sender.lastName}`.trim(),
      senderPhoto: sender.photo || null,
      content: text || (fileName || "Attachment"),
      messageType: messageType || (fileUrl ? (req.file.mimetype?.startsWith("image/") ? "image" : "file") : "text"),
      fileUrl,
      fileName,
      replyToId: replyToId || null,
    });
    const out = msg.toJSON();
    out.senderPhoto = out.senderPhoto ? (out.senderPhoto.startsWith("http") ? out.senderPhoto : `${req.protocol}://${req.get("host")}${out.senderPhoto}`) : null;
    out.fileUrl = out.fileUrl ? `${req.protocol}://${req.get("host")}${out.fileUrl}` : null;
    out.reactions = {};
    // broadcast via socket if available
    try {
      const io = req.app.get("io");
      if (io) {
        io.to(conversationId).emit("message:new", out);
        io.to(`company:${companyName}`).emit("message:new", out);
      }
    } catch {}
    return res.status(201).json(out);
  } catch (e) {
    console.error("sendMessage", e);
    return res.status(500).json({ error: "Failed to send" });
  }
};

exports.editMessage = async (req, res) => {
  const { content } = req.body;
  const id = req.params.id;
  if (!content?.trim()) return res.status(400).json({ error: "Content required" });
  try {
    const msg = await Message.findByPk(id);
    if (!msg) return res.status(404).json({ error: "Not found" });
    if (msg.senderId !== req.user.id && req.user.role !== "Admin") return res.status(403).json({ error: "Not allowed" });
    msg.content = content.trim();
    msg.isEdited = true;
    await msg.save();
    const io = req.app.get("io");
    if (io) io.to(msg.conversationId).emit("message:update", msg.toJSON());
    return res.json(msg);
  } catch (e) {
    console.error("edit", e);
    return res.status(500).json({ error: "Failed" });
  }
};

exports.deleteMessage = async (req, res) => {
  const id = req.params.id;
  try {
    const msg = await Message.findByPk(id);
    if (!msg) return res.status(404).json({ error: "Not found" });
    if (msg.senderId !== req.user.id && req.user.role !== "Admin") return res.status(403).json({ error: "Not allowed" });
    msg.isDeleted = true;
    msg.content = "This message was deleted";
    await msg.save();
    const io = req.app.get("io");
    if (io) io.to(msg.conversationId).emit("message:update", msg.toJSON());
    return res.json({ success: true });
  } catch (e) {
    console.error("delete", e);
    return res.status(500).json({ error: "Failed" });
  }
};

exports.toggleReaction = async (req, res) => {
  const id = req.params.id;
  const { emoji } = req.body;
  if (!emoji) return res.status(400).json({ error: "emoji required" });
  try {
    const msg = await Message.findByPk(id);
    if (!msg) return res.status(404).json({ error: "Not found" });
    const reactions = parseReactions(msg.reactions);
    const uid = String(req.user.id);
    if (!reactions[emoji]) reactions[emoji] = [];
    if (reactions[emoji].includes(uid)) {
      reactions[emoji] = reactions[emoji].filter((x) => x !== uid);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(uid);
    }
    msg.reactions = stringifyReactions(reactions);
    await msg.save();
    const out = msg.toJSON();
    out.reactions = reactions;
    const io = req.app.get("io");
    if (io) io.to(msg.conversationId).emit("message:update", out);
    return res.json(out);
  } catch (e) {
    console.error("reaction", e);
    return res.status(500).json({ error: "Failed" });
  }
};
