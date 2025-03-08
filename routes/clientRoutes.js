
const express = require("express");
const router = express.Router();
const { 
  createClient, 
  upload, 
  getClientProfile, 
  updateClientProfile, 
  getClients,
  updateClient,
  updateClientStatus,
  deleteClient 
} = require("../controllers/clientController");

const { protect, authorize,protectClient } = require("../middleware/authMiddleware");

// ✅ Créer un client (seulement par un ADMIN ou SUPER_ADMIN)
router.post("/", protect, authorize("ADMIN", "SUPER_ADMIN"), upload.single("CLNT_contract"), createClient);

// ✅ Récupérer le profil du client connecté
router.get("/me", protect,protectClient, getClientProfile);

// ✅ Modifier son propre profil (Client)
router.put("/me", protect,protectClient,  updateClientProfile);

// ✅ Récupérer tous les clients (accessible par ADMIN/SUPER_ADMIN)
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN"), getClients);

// ✅ Mettre à jour un client (ADMIN ou SUPER_ADMIN)
router.put("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), upload.single("CLNT_contract"), updateClient);
//mettre a jour le statut du client (ADMIN OU SUPER-ADMIN)
router.put("/:id/status", protect, authorize("ADMIN", "SUPER_ADMIN"), updateClientStatus);

// ✅ Supprimer un client (ADMIN/SUPER_ADMIN)
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), deleteClient);

module.exports = router;




