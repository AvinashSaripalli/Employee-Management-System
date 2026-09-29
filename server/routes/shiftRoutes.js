const express = require("express");
const router = express.Router();
const shiftController = require("../controllers/shiftController");

// Shift definitions
router.get("/", shiftController.getShifts);
router.post("/", shiftController.createShift);
router.put("/:id", shiftController.updateShift);
router.delete("/:id", shiftController.deleteShift);

// Roster scheduling
router.get("/roster", shiftController.getRoster);
router.get("/my-schedule", shiftController.getMySchedule);
router.post("/assign-roster", shiftController.assignRoster);
router.post("/bulk-roster", shiftController.bulkRosterAssign);

module.exports = router;
