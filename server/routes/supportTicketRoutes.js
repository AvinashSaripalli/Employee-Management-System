const express = require("express");
const router = express.Router();
const supportTicketController = require("../controllers/supportTicketController");

router.get("/metrics", supportTicketController.getTicketMetrics);
router.get("/settings", supportTicketController.getHelpdeskSettings);
router.put("/settings", supportTicketController.updateHelpdeskSettings);
router.get("/", supportTicketController.getTickets);
router.post("/", supportTicketController.createTicket);
router.get("/:id", supportTicketController.getTicketById);
router.put("/:id", supportTicketController.updateTicket);
router.post("/:id/allocate-asset", supportTicketController.approveAssetAllocation);

module.exports = router;
