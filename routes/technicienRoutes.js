const express = require("express");
const router = express.Router();
const {
  getTechnicianProfile,
  updateTechnicianProfile,
  getTechniciens,
  getTechnicienById,
  updateTechnician,
  createTechnician,
  deleteTechnician
} = require("../controllers/technicienController");

const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Routes accessibles uniquement par le technicien lui-même
router.get("/me", protect, authorize("TECHNICIEN"), getTechnicianProfile);
router.put("/me", protect, authorize("TECHNICIEN"), updateTechnicianProfile);

// ✅ Routes accessibles par un ADMIN ou SUPER_ADMIN
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN"), getTechniciens);
router.get("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), getTechnicienById);
router.put("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), updateTechnician);
router.post("/", protect, authorize("ADMIN", "SUPER_ADMIN"), createTechnician);
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), deleteTechnician);
module.exports = router;

