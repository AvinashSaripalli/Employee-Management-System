const express = require("express");
const router = express.Router();
const resignationController = require("../controllers/resignationController");

// Employee Self-Service
router.post("/submit", resignationController.submitResignation);
router.get("/my-resignation", resignationController.getMyResignation);
router.post("/:id/withdraw", resignationController.withdrawResignation);

// Manager / HR / Admin Workflow
router.get("/", resignationController.getResignations);
router.post("/:id/manager-review", resignationController.managerReview);
router.post("/:id/hr-review", resignationController.hrReview);
router.post("/:id/clearance", resignationController.updateClearance);

module.exports = router;
