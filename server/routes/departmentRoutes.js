const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const controller = require("../controllers/departmentController");

router.get("/", verifyToken, controller.getDepartments);
router.post("/", verifyToken, controller.createDepartment);
router.put("/:id", verifyToken, controller.updateDepartment);
router.delete("/:id", verifyToken, controller.deleteDepartment);
router.delete("/:id/members/:userId", verifyToken, controller.removeMember);

module.exports = router;