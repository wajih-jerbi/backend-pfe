const Client = require("../models/Client");
const Ticket = require("../models/Ticket");
const Technicien = require("../models/Technicien");
const Equipment = require("../models/Equipment");
const Intervention = require("../models/Intervention");

// ✅ 1. Récupérer les statistiques globales
const getStats = async (req, res) => {
  try {
    const totalClients = await Client.countDocuments();
    const totalTickets = await Ticket.countDocuments();
    const totalTechniciens = await Technicien.countDocuments();
    const totalEquipments = await Equipment.countDocuments();
    const totalInterventions = await Intervention.countDocuments();

    // 📌 Tickets par statut
    const ticketsByStatus = await Ticket.aggregate([
      { $group: { _id: "$TCKT_statut", count: { $sum: 1 } } }
    ]);

    // 📌 Équipements par type
    const equipmentsByType = await Equipment.aggregate([
      { $group: { _id: "$EQPT_type", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      totalClients,
      totalTickets,
      totalTechniciens,
      totalEquipments,
      totalInterventions,
      ticketsByStatus,
      equipmentsByType
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ 2. Suivi des tickets par technicien
const getTechnicianProgress = async (req, res) => {
  try {
    const { technicienId } = req.params;

    const tickets = await Ticket.find({ TCKT_assignee_a: technicienId })
      .populate("TCKT_client", "CLNT_raison_sociale CLNT_email")
      .select("TCKT_statut TCKT_description");

    res.status(200).json({ technicienId, tickets });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ 3. Performance du technicien (temps total passé sur des interventions)
const getTechnicianPerformance = async (req, res) => {
  try {
    const { technicienId } = req.params;

    const interventions = await Intervention.find({ INT_technicien: technicienId });

    let totalTime = 0;
    interventions.forEach(inter => {
      if (inter.INT_date_debut && inter.INT_date_fin) {
        totalTime += (new Date(inter.INT_date_fin) - new Date(inter.INT_date_debut)) / (1000 * 60 * 60); // en heures
      }
    });

    res.status(200).json({ technicienId, totalTime });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ 4. Récupérer les statistiques des tickets sur une période donnée
const getTicketStatsByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "Veuillez fournir une plage de dates valide." });
    }

    const ticketsInRange = await Ticket.countDocuments({
      Date_creation: { $gte: new Date(startDate), $lte: new Date(endDate) }
    });

    res.status(200).json({ totalTicketsInRange: ticketsInRange });

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ 5. Nombre de tickets par client
const getClientTicketStats = async (req, res) => {
  try {
    const clientStats = await Ticket.aggregate([
      { $group: { _id: "$TCKT_client", count: { $sum: 1 } } }
    ]);

    res.status(200).json(clientStats);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ 6. Indicateurs de performances
const getEfficiencyIndicators = async (req, res) => {
  try {
    const totalTickets = await Ticket.countDocuments();
    const totalInterventions = await Intervention.countDocuments();

    // 📌 Temps moyen de résolution des tickets
    const resolvedTickets = await Ticket.find({ TCKT_statut: "résolu" });
    let totalTime = 0;
    resolvedTickets.forEach(ticket => {
      if (ticket.TCKT_DT_resolution_demandee && ticket.TCKT_DT_resolution_confirmee) {
        totalTime += (new Date(ticket.TCKT_DT_resolution_confirmee) - new Date(ticket.TCKT_DT_resolution_demandee)) / (1000 * 60 * 60);
      }
    });
    const avgResolutionTime = resolvedTickets.length ? (totalTime / resolvedTickets.length) : 0;

    // 📌 Nombre moyen de tickets par technicien
    const totalTechniciens = await Technicien.countDocuments();
    const avgTicketsPerTechnician = totalTechniciens ? (totalTickets / totalTechniciens) : 0;

    res.status(200).json({
      avgResolutionTime,
      avgTicketsPerTechnician,
      totalTickets,
      totalInterventions
    });

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = { 
  getStats, 
  getTechnicianProgress, 
  getTechnicianPerformance, 
  getTicketStatsByDate, 
  getClientTicketStats, 
  getEfficiencyIndicators 
};
