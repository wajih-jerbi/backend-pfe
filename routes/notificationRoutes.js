const express = require("express");
const router = express.Router();
const { 
  createNotification, 
  getUserNotifications, 
  deleteNotification 
} = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect, createNotification); // Seuls les utilisateurs authentifiés peuvent créer une notification
router.get("/", protect, getUserNotifications); // Récupérer les notifications de l'utilisateur connecté
router.delete("/:id", protect, authorize("admin"), deleteNotification); // Seul un admin peut supprimer une notification

module.exports = router;
