const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get("/getAll", reportController.getTheReports);
router.get("/", reportController.getReports);
router.post("/", reportController.createReport);
router.put("/feedback/:id", reportController.updateFeedbackByEmployeeId);
router.put("/:id", reportController.updateReport);
router.delete("/:id", reportController.deleteReport);

module.exports = router;