const Commentaire = require("../models/Commentaire");
const mongoose = require("mongoose");

// Ajouter un commentaire (uniquement pour les utilisateurs authentifiés)
const createCommentaire = async (req, res) => {
  try {
    const { CMMT_ticket, CMMT_message } = req.body;

    if (!CMMT_ticket || !CMMT_message) {
      return res.status(400).json({ message: "Tous les champs sont requis !" });
    }

    const newCommentaire = new Commentaire({
      CMMT_ticket,
      CMMT_user: req.user._id, // Associer l'utilisateur connecté
      CMMT_user_Type: req.user.role, // Le type d'utilisateur (Client ou Technicien)
      CMMT_message
    });

    await newCommentaire.save();
    res.status(201).json({ message: "Commentaire ajouté avec succès !", commentaire: newCommentaire });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Récupérer tous les commentaires liés à un ticket (accessible à tous les utilisateurs authentifiés)
const getCommentairesByTicket = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.ticketId)) {
      return res.status(400).json({ message: "ID de ticket invalide" });
    }

    const commentaires = await Commentaire.find({ CMMT_ticket: req.params.ticketId })
      .populate("COM_user", "nom prenom userType")
      .sort({ CMMT_date: -1 });

    res.status(200).json(commentaires);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Mettre à jour un commentaire (seul l’auteur ou un admin peut le faire)
const updateCommentaire = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    const { CMMT_message } = req.body;
    if (!CMMT_message) {
      return res.status(400).json({ message: "Le contenu ne peut pas être vide !" });
    }

    const commentaire = await Commentaire.findById(req.params.id);
    if (!commentaire) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }

    // Vérifier si l'utilisateur est l'auteur ou un admin
    if (commentaire.CMMT_user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Action non autorisée !" });
    }

    commentaire.CMMT_message = CMMT_message;
    await commentaire.save();

    res.status(200).json({ message: "Commentaire mis à jour avec succès !", commentaire });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Supprimer un commentaire (seul l’auteur ou un admin peut le faire)
const deleteCommentaire = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    const commentaire = await Commentaire.findById(req.params.id);
    if (!commentaire) {
      return res.status(404).json({ message: "Commentaire non trouvé" });
    }

    // Vérifier si l'utilisateur est l'auteur ou un admin
    if (commentaire.CMMT_user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Action non autorisée !" });
    }

    await commentaire.deleteOne();
    res.status(200).json({ message: "Commentaire supprimé avec succès !" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = {
  createCommentaire,
  getCommentairesByTicket,
  updateCommentaire,
  deleteCommentaire
};

