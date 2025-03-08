const Notification = require("../models/Notification");
const mongoose = require("mongoose");

// Créer une notification
const createNotification = async (req, res) => {
  try {
    const { NOTF_user, NOTF_userType, NOTF_ticket, NOTF_type,NOTF_message } = req.body;

    if (!NOTF_user || !NOTF_userType || !NOTF_type || !NOTF_message) {
      return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis !" });
    }

    const newNotification = new Notification({
      NOTF_user,
      NOTF_userType,
      NOTF_ticket,
      NOTF_type,
      NOTF_message,
    });

    await newNotification.save();
    res.status(201).json({ message: "Notification créée avec succès !", notification: newNotification });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Récupérer les notifications d'un utilisateur (authentifié uniquement)
const getUserNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ NOTF_user: req.user._id })
      .sort({ NOTF_sentAt: -1 });

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// Supprimer une notification (seul un admin peut le faire)
const deleteNotification = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res.status(404).json({ message: "Notification non trouvée" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Seuls les admins peuvent supprimer une notification !" });
    }

    await notification.deleteOne();
    res.status(200).json({ message: "Notification supprimée avec succès !" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  deleteNotification,
};

