const express = require("express");
const router = express.Router();
const { login, getProfile } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

// ✅ Connexion utilisateur (Admin, Technicien, Client)
router.post("/login", login);

// ✅ Récupérer le profil de l'utilisateur connecté (Protégé par `protect`)
router.get("/me",protect,getProfile);

module.exports = router;
