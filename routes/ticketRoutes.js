const express = require("express");
const router = express.Router();
const {
  createTicket,
  addTicketToSprint,
  getTickets,
  updateTicket,
  assignTicketToTechnicians,
  updateTicketStatus,
  deleteTicket
} = require("../controllers/ticketController");

const { protect, authorize } = require("../middleware/authMiddleware");

// 📌 Création d'un ticket (par un client)
router.post("/", protect, authorize("CLIENT"), createTicket);

// 📌 Consulter tous les tickets (accessible aux admins, super-admins et techniciens)
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN"), getTickets);

// ajouter le ticket au sprint 
router.post("/addToSprint", addTicketToSprint);

// 📌 Mettre à jour un ticket (ADMIN, SUPER_ADMIN ou TECHNICIEN)
router.put("/:id", protect, authorize("ADMIN", "SUPER_ADMIN", "TECHNICIEN"), updateTicket);


// 📌 Assignation d'un ou plusieurs techniciens à un ticket (ADMIN ou SUPER_ADMIN)
router.put("/:id/assign", protect, authorize("ADMIN", "SUPER_ADMIN"), assignTicketToTechnicians);


// 📌 Modifier le statut d'un ticket (seulement le technicien peut changer le statut)
router.put("/:id/status", protect, authorize("TECHNICIEN"), updateTicketStatus);

// 📌 Suppression d’un ticket (ADMIN ou SUPER_ADMIN)
router.delete("/:id", protect, authorize("ADMIN", "SUPER_ADMIN"), deleteTicket);

module.exports = router;
