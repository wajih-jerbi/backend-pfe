const express = require("express");
const router = express.Router();
const { 
  createCommentaire, 
  getCommentairesByTicket, 
  updateCommentaire, 
  deleteCommentaire 
} = require("../controllers/commentaireController");

const { protect, authorize } = require("../middleware/authMiddleware");

router.post("/", protect,authorize("technicien,client"),createCommentaire); // Seuls les utilisateurs authentifiés peuvent ajouter un commentaire
router.get("/:ticketId", protect, getCommentairesByTicket); // Tous les utilisateurs authentifiés peuvent voir les commentaires d'un ticket
router.put("/:id", protect, authorize("admin","client","technicien"),updateCommentaire); // Seul l'auteur(client) ou un admin peut modifier
router.delete("/:id", protect, deleteCommentaire); 
// a revenir qui supprime le commentaire kol wahd connecté ynjem yfassekh ken commentaire mta3o wla ymodifih ila l'admin ynjem yamel il yheb)
module.exports = router;
