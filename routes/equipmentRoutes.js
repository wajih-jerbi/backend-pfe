const express = require("express");
const router = express.Router();
const { 
  createEquipment, 
  getEquipments, 
 getEquipmentsByClient, 
  updateEquipment, 
  deleteEquipment 
} = require("../controllers/equipmentController");
const { protect, authorize,protectClient } = require("../middleware/authMiddleware");

// ✅ Création d'un équipement (autorisé pour CLIENT, TECHNICIEN, ADMIN, SUPER_ADMIN)
router.post("/", protect,authorize("ADMIN", "SUPER_ADMIN"), createEquipment);

// ✅ Récupérer tous les équipements (tout utilisateur authentifié peut voir les équipements)
router.get("/", protect,protectClient , getEquipments);

// ✅ Récupérer un équipement par son ID (tout utilisateur authentifié peut voir un équipement)
router.get("/:id", protect,protectClient , getEquipmentsByClient);

// ✅ Mise à jour d'un équipement (UNIQUEMENT ADMIN et SUPER_ADMIN)
router.put("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), updateEquipment);

// ✅ Suppression d'un équipement (UNIQUEMENT ADMIN et SUPER_ADMIN)
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), deleteEquipment);

module.exports = router;


