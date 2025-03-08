const Ticket = require("../models/Ticket");
const Client = require("../models/Client");
const Technicien = require("../models/Technicien");
const Personnel = require("../models/Personnel");
const Equipment = require("../models/Equipment");
const TypePanne = require("../models/TypePanne");
const { sendEmail } = require("../services/emailService");
const { sendWhatsAppMessage } = require("../services/whatsappService");


// ✅ Créer un ou plusieurs tickets (par un client)
const createTicket = async (req, res) => {
  
  try {
    console.log("Données reçues :", req.body); // Vérifier ce que Postman envoie

    const { clientId, tickets } = req.body;

    
    console.log("🔍 Client ID reçu :", clientId);
    console.log("🔍 Tickets reçus :", tickets);
    console.log("🔍 Type des tickets :", typeof tickets);

    if (!clientId) {
      return res.status(400).json({ message: "clientId est requis" });
    }

    const client = await Client.findOne({ CLNT_code: clientId });
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    console.log("Données reçues :", req.body); // ✅ Debugging
    if (!req.body || Object.keys(req.body).length === 0) {
      return res.status(400).json({ message: "Aucun ticket fourni" });
    }

    const createdTickets = [];
    
    
    console.log("Tickets reçus :", tickets);
    console.log("Type de tickets :", typeof tickets);

    for (const ticket of tickets) {
      console.log("🔍 Vérification de l'équipement :", ticket.TCKT_equipment);
      const equipment = await Equipment.findOne({ EQPT_code: ticket.TCKT_equipment });

      if (!equipment) {
        return res.status(400).json({ message: `Équipement non trouvé: ${ticket.TCKT_equipment}` });
      }

      // 🔹 Vérifier si le type de panne existe
      const typePanne = await TypePanne.findOne({ PANN_libelle: ticket.TCKT_type_panne });
      if (!typePanne) {
        return res.status(400).json({ message: `Le type de panne "${ticket.TCKT_type_panne}" n'existe pas.` });
      }
      


      const newTicket = new Ticket({
        TCKT_client: client._id,
        TCKT_cree_par: client._id,
        TCKT_equipment: equipment._id,
        TCKT_description: ticket.TCKT_description,
        TCKT_type_panne: typePanneExists.PANN_libelle, // ✅ On utilise le type de panne validé
        TCKT_degre_urgence: ticket.TCKT_degre_urgence || "moyenne",
        TCKT_DT_resolution_demandee: ticket.TCKT_DT_resolution_demandee || null
      });

      await newTicket.save();
      createdTickets.push(newTicket);
    }

    console.log("✅ Tickets enregistrés:", createdTickets);

    // ✅ Envoyer des notifications aux techniciens et admins
    const technicians = await Technicien.find();
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } });

    [...technicians, ...admins].forEach(async (recipient) => {
      await sendEmail(
        recipient.PERS_email || recipient.TECH_email,
        "Nouveau Ticket Créé",
        `🆕 Un nouveau ticket de type "${createdTickets[0].TCKT_type_panne}" a été créé par ${client.CLNT_raison_sociale}.`
      );
    });

    res.status(201).json({ message: "Tickets créés avec succès", createdTickets });

  } catch (error) {
    console.error("❌ Erreur lors de la création des tickets :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

const addTicketToSprint = async (req, res) => {
  try {
    const { ticketId, sprintId } = req.body;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: "Ticket introuvable" });

    ticket.TCKT_sprint = true;
    ticket.TCKT_sprint_id = sprintId;
    await ticket.save();

    res.status(200).json({ message: "Ticket ajouté au sprint", ticket });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// ✅ Récupérer tous les tickets
const getTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find()
      .populate("TCKT_client", "CLNT_raison_sociale CLNT_email")
      .populate("TCKT_equipment", "EQPT_libelle")
      .populate("TCKT_assignee_a", "TECH_nom_prenom TECH_email");

    res.status(200).json(tickets);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};



// ✅ Mettre à jour un ticket (ADMIN, SUPER_ADMIN, TECHNICIEN)
const updateTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findByIdAndUpdate(id, req.body, { new: true })
      .populate("TCKT_client", "CLNT_email CLNT_raison_sociale")
      .populate("TCKT_assignee_a", "TECH_email TECH_nom_prenom");

    if (!ticket) return res.status(404).json({ message: "Ticket non trouvé" });

    console.log("✅ Ticket mis à jour :", ticket);

    // 📩 **Notifier les techniciens assignés**
    if (ticket.TCKT_assignee_a.length > 0) {
      ticket.TCKT_assignee_a.forEach(async (tech) => {
        await sendEmail(tech.TECH_email, "Mise à jour d'un ticket", 
          `Le ticket auquel vous êtes assigné a été mis à jour.`
        );
      });
    }

    // 📩 **Notifier les Admins**
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");
    admins.forEach(async (admin) => {
      await sendEmail(admin.PERS_email, "Mise à jour d'un ticket", 
        `Un ticket vient d’être mis à jour.`
      );
    });

    res.status(200).json({ message: "Ticket mis à jour avec succès", ticket });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du ticket :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};



// ✅ Modifier le statut d'un ticket avec notification
const updateTicketStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;

    if (!["ouvert", "en cours", "résolu", "fermé"].includes(newStatus)) {
      return res.status(400).json({ message: "Statut invalide !" });
    }

    const ticket = await Ticket.findById(id)
      .populate("TCKT_client", "CLNT_email CLNT_raison_sociale")
      .populate("TCKT_assignee_a", "TECH_email TECH_nom_prenom");

    if (!ticket) return res.status(404).json({ message: "Ticket non trouvé" });

    ticket.TCKT_statut = newStatus;
    if (newStatus === "résolu" || newStatus === "fermé") {
      ticket.TCKT_DT_resolution_confirmee = new Date();
    }
    await ticket.save();

    console.log("✅ Statut du ticket mis à jour :", ticket);

    // 📩 **Notifier les techniciens assignés**
    ticket.TCKT_assignee_a.forEach(async (tech) => {
      await sendEmail(tech.TECH_email, "Changement de statut du ticket", 
        `Le ticket auquel vous êtes assigné a été marqué comme "${newStatus}".`
      );
    });

    // 📩 **Notifier les Admins**
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");
    admins.forEach(async (admin) => {
      await sendEmail(admin.PERS_email, "Changement de statut d'un ticket", 
        `Le ticket de ${ticket.TCKT_client.CLNT_raison_sociale} est maintenant "${newStatus}".`
      );
    });

    res.status(200).json({ message: "Statut mis à jour avec succès", ticket });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du statut :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// ✅ Assigner un technicien à un ticket avec notification
const assignTicketToTechnicians = async (req, res) => {
  try {
    const { id } = req.params;
    const { technicienId } = req.body;

    console.log("🔍 Ticket ID reçu :", id);
    console.log("🔍 Technicien ID reçu :", technicienId);

    if (!id) return res.status(400).json({ message: "L'ID du ticket est manquant dans l'URL." });
    if (!technicienId) return res.status(400).json({ message: "L'ID du technicien est manquant dans le corps de la requête." });

    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: "Ticket non trouvé" });

    const technicien = await Technicien.findById(technicienId);
    if (!technicien) return res.status(404).json({ message: "Technicien non trouvé" });

    if (!ticket.TCKT_assignee_a.includes(technicienId)) {
      ticket.TCKT_assignee_a.push(technicienId);
      await ticket.save();
    }

    if (!technicien.TECH_tickets_assignees.includes(id)) {
      technicien.TECH_tickets_assignees.push(id);
      await technicien.save();
    }

    console.log("✅ Technicien assigné au ticket !");

    // 📩 **Envoyer un email au technicien**
    await sendEmail(technicien.TECH_email, "Nouveau ticket assigné", `Vous avez été assigné au ticket : ${ticket.TCKT_description}.`);

    res.status(200).json({ message: "Technicien assigné avec succès", ticket, technicien });

  } catch (error) {
    console.error("❌ Erreur lors de l'assignation du technicien :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};;



// ✅ Supprimer un ticket avec notification
const deleteTicket = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id)
      .populate("TCKT_client", "CLNT_email CLNT_raison_sociale")
      .populate("TCKT_assignee_a", "TECH_email TECH_nom_prenom");

    if (!ticket) return res.status(404).json({ message: "Ticket non trouvé" });

    await Ticket.findByIdAndDelete(id);

    console.log("✅ Ticket supprimé :", ticket);

    // 📩 **Notifier les techniciens assignés**
    ticket.TCKT_assignee_a.forEach(async (tech) => {
      await sendEmail(tech.TECH_email, "Ticket supprimé", 
        `Le ticket auquel vous étiez assigné a été supprimé.`
      );
    });

    // 📩 **Notifier les Admins**
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");
    admins.forEach(async (admin) => {
      await sendEmail(admin.PERS_email, "Suppression d'un ticket", 
        `Le ticket de ${ticket.TCKT_client.CLNT_raison_sociale} a été supprimé.`
      );
    });

    res.status(200).json({ message: "Ticket supprimé avec succès" });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression du ticket :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = { createTicket, addTicketToSprint ,getTickets, updateTicket, updateTicketStatus, assignTicketToTechnicians, deleteTicket };
