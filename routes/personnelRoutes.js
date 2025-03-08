const express = require("express");
const router = express.Router();
const {
  createPersonnel,
  getPersonnels,
  getPersonnelById,
  updatePersonnel,
  updatePersonnelProfile,
  deletePersonnel
} = require("../controllers/personnelController");
const { protect, authorize } = require("../middleware/authMiddleware");

// ✅ Création d'un personnel (SUPER_ADMIN gère tout, ADMIN ne gère que NORMAL)
router.post("/", protect, authorize("SUPER_ADMIN", "ADMIN"), createPersonnel);

// ✅ Récupérer un personnel par son ID (seulement ADMIN et SUPER_ADMIN)
router.get("/", protect, authorize("SUPER_ADMIN", "ADMIN"), getPersonnels);

// ✅ Récupérer un personnel par son ID (seulement ADMIN et SUPER_ADMIN)
router.get("/:id", protect, authorize("SUPER_ADMIN", "ADMIN"), getPersonnelById);

// ✅ Modifier un personnel (SUPER_ADMIN gère tout, ADMIN ne modifie que NORMAL)
router.put("/:id", protect, authorize("SUPER_ADMIN", "ADMIN"), updatePersonnel);

// ✅ Modifier son propre profil (tous les personnels)
router.put("/profile", protect, updatePersonnelProfile);

// ✅ Supprimer un personnel (seulement SUPER_ADMIN)
router.delete("/:id", protect, authorize("SUPER_ADMIN"), deletePersonnel);

module.exports = router;


