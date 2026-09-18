const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const controller = require("../controllers/departmentController");

router.get("/", verifyToken, controller.getDepartments);
router.post("/", verifyToken, controller.createDepartment);
router.put("/:id", verifyToken, controller.updateDepartment);

module.exports = router;