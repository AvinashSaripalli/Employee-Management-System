const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../middleware/upload");
const controller = require("../controllers/messageController");

router.get("/directory", verifyToken, controller.getDirectory);
router.get("/conversations", verifyToken, controller.getConversations);
router.get("/", verifyToken, controller.getMessages);
router.post("/", verifyToken, upload.single("file"), controller.sendMessage);
router.patch("/:id", verifyToken, controller.editMessage);
router.delete("/:id", verifyToken, controller.deleteMessage);
router.post("/:id/reaction", verifyToken, controller.toggleReaction);

module.exports = router;
