const express = require("express");
const { 
  getStats, 
  getTechnicianProgress, 
  getTechnicianPerformance, 
  getTicketStatsByDate, 
  getClientTicketStats, 
  getEfficiencyIndicators 
} = require("../controllers/statsController");

const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

// 📌 Route pour récupérer les statistiques globales (ADMIN & SUPER_ADMIN uniquement)
router.get("/", protect, authorize("ADMIN", "SUPER_ADMIN"), getStats);

// 📌 Route pour récupérer la progression d'un technicien (uniquement le technicien lui-même ou un admin)
router.get("/techniciens/:technicienId/progression", protect, (req, res, next) => {
  if (req.user.role === "ADMIN" || req.user.role === "SUPER_ADMIN" || req.user.id === req.params.technicienId) {
    return getTechnicianProgress(req, res);
  }
  return res.status(403).json({ message: "Accès interdit" });
});

// 📌 Route pour récupérer les performances d'un technicien (ADMIN & SUPER_ADMIN uniquement)
router.get("/techniciens/:technicienId/performance", protect, authorize("ADMIN", "SUPER_ADMIN"), getTechnicianPerformance);

// 📌 Route pour récupérer les statistiques des tickets sur une période donnée (ADMIN & SUPER_ADMIN uniquement)
router.get("/tickets/date-range", protect, authorize("ADMIN", "SUPER_ADMIN"), getTicketStatsByDate);

// 📌 Route pour récupérer les statistiques des tickets par client (ADMIN & SUPER_ADMIN uniquement)
router.get("/clients/tickets", protect, authorize("ADMIN", "SUPER_ADMIN"), getClientTicketStats);

// 📌 Route pour récupérer les indicateurs de performances (ADMIN & SUPER_ADMIN uniquement)
router.get("/indicateurs-performance", protect, authorize("ADMIN", "SUPER_ADMIN"), getEfficiencyIndicators);

module.exports = router;
