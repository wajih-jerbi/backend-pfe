const express = require("express");
const router = express.Router();
const {
  createTypePanne,
  getTypePannes,
  getTypePanneById,
  updateTypePanne,
  deleteTypePanne
} = require("../controllers/typePanneController");
const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Création d'un type de panne (ADMIN et SUPER_ADMIN uniquement)
router.post("/", protect, authorize("ADMIN", "SUPER_ADMIN"), createTypePanne);

// ✅ Récupérer tous les types de pannes
router.get("/", protect, getTypePannes);

// ✅ Récupérer un type de panne par ID
router.get("/:id", protect, getTypePanneById);

// ✅ Mise à jour d'un type de panne (ADMIN et SUPER_ADMIN uniquement)
router.put("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), updateTypePanne);

// ✅ Suppression d'un type de panne (ADMIN et SUPER_ADMIN uniquement)
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), deleteTypePanne);

module.exports = router;

