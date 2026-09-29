const express = require("express");
const router = express.Router();
const assetController = require("../controllers/assetController");

// Employee Self-Service: view assigned equipment
router.get("/my-assets", assetController.getMyAssets);

// IT / Admin Inventory Management
router.get("/", assetController.getAssets);
router.post("/", assetController.createAsset);
router.get("/:id", assetController.getAssetById);
router.put("/:id", assetController.updateAsset);
router.post("/:id/assign", assetController.assignAsset);
router.post("/:id/return", assetController.returnAsset);
router.delete("/:id", assetController.deleteAsset);

module.exports = router;
