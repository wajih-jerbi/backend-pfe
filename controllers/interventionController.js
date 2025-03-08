const Intervention = require("../models/Intervention");
const Ticket = require("../models/Ticket");
const Technicien = require("../models/Technicien");
const Client = require("../models/Client");
const { sendEmail } = require("../services/emailService");

// ✅ Créer une intervention (par un technicien)
const createIntervention = async (req, res) => {
  try {
    const { INTR_ticket, INTR_techniciens, INTR_description_panne, INTR_cause_panne } = req.body;

    // Vérifier si le ticket existe
    const ticket = await Ticket.findById(INTR_ticket);
    if (!ticket) {
      return res.status(404).json({ message: "Ticket non trouvé" });
    }

    // Vérifier si les techniciens existent
    const techniciens = await Technicien.find({ _id: { $in: INTR_techniciens } });
    if (techniciens.length !== INTR_techniciens.length) {
      return res.status(400).json({ message: "Un ou plusieurs techniciens introuvables" });
    }

    // Définir la date de début de l'intervention
    const INTR_dt_debut = new Date();

    // Créer l'intervention
    const intervention = new Intervention({
      INTR_ticket,
      INTR_techniciens,
      INTR_description_panne,
      INTR_cause_panne,
      INTR_dt_debut,
    });
    await intervention.save();

    // Notifier le client et les techniciens
    const client = await Client.findById(ticket.TCKT_client);
    if (client) {
      await sendEmail(client.CLNT_email, "Nouvelle intervention sur votre ticket", `Votre ticket est en cours de traitement.`);
    }
    techniciens.forEach(async (tech) => {
      await sendEmail(tech.TECH_email, "Nouvelle intervention assignée", `Vous êtes assigné à une intervention.`);
    });

    res.status(201).json({ message: "Intervention créée avec succès", intervention });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Récupérer toutes les interventions
const getInterventions = async (req, res) => {
  try {
    const interventions = await Intervention.find()
      .populate("INTR_ticket")
      .populate("INTR_techniciens", "TECH_nom_prenom TECH_email");
    res.status(200).json(interventions);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Récupérer une intervention par ID
const getInterventionById = async (req, res) => {
  try {
    const intervention = await Intervention.findById(req.params.id)
      .populate("INTR_ticket")
      .populate("INTR_techniciens", "TECH_nom_prenom TECH_email");
    if (!intervention) {
      return res.status(404).json({ message: "Intervention non trouvée" });
    }
    res.status(200).json(intervention);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Mettre à jour une intervention (par le technicien assigné)
const updateIntervention = async (req, res) => {
  try {
    const { id } = req.params;
    const intervention = await Intervention.findById(id);
    if (!intervention) {
      return res.status(404).json({ message: "Intervention non trouvée" });
    }

    // Vérifier si l'utilisateur est un technicien assigné
    if (!intervention.INTR_techniciens.includes(req.user.id)) {
      return res.status(403).json({ message: "Accès interdit" });
    }

    // Mise à jour de l'intervention
    Object.assign(intervention, req.body);

    // Si le statut est "terminé", définir la date de fin et calculer la durée
    if (req.body.INTR_statut === "terminé") {
      intervention.INTR_dt_fin = new Date();
      intervention.INTR_durée = Math.round(
        (new Date(intervention.INTR_dt_fin) - new Date(intervention.INTR_dt_debut)) / (1000 * 60) // Convertir en minutes
      );

      // Envoyer une notification au client
      const ticket = await Ticket.findById(intervention.INTR_ticket);
      const client = await Client.findById(ticket.TCKT_client);
      if (client) {
        await sendEmail(client.CLNT_email, "Intervention terminée", `Votre intervention a été complétée.`);
      }
    }

    await intervention.save();
    res.status(200).json({ message: "Intervention mise à jour", intervention });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Supprimer une intervention (ADMIN ou SUPER_ADMIN uniquement)
const deleteIntervention = async (req, res) => {
  try {
    const { id } = req.params;
    const intervention = await Intervention.findById(id);
    if (!intervention) {
      return res.status(404).json({ message: "Intervention non trouvée" });
    }
    
    await Intervention.findByIdAndDelete(id);
    res.status(200).json({ message: "Intervention supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = {
  createIntervention,
  getInterventions,
  getInterventionById,
  updateIntervention,
  deleteIntervention,
};