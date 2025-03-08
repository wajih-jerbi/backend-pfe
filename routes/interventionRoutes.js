const express = require("express");
const router = express.Router();
const { 
  createIntervention, 
  getInterventions, 
  getInterventionById, 
  updateIntervention, 
  deleteIntervention 
} = require("../controllers/interventionController");
const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Créer une intervention (uniquement les techniciens)
router.post("/", protect, authorize("technicien"), createIntervention);

// ✅ Récupérer toutes les interventions (admin, super-admin, techniciens)
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN", "technicien"), getInterventions);

// ✅ Récupérer une intervention par ID
router.get("/:id", protect, authorize("ADMIN", "SUPER_ADMIN", "technicien"), getInterventionById);

// ✅ Mettre à jour une intervention (seulement le technicien assigné)
router.put("/:id", protect, authorize("technicien"), updateIntervention);

// ✅ Supprimer une intervention (ADMIN et SUPER_ADMIN uniquement)
router.delete("/:id", protect, authorize("SUPER_ADMIN", "ADMIN"), deleteIntervention);

module.exports = router;



