const Technicien = require("../models/Technicien");
const Personnel = require("../models/Personnel"); 
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../services/emailService");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

// ✅ Récupérer le profil du technicien connecté
const getTechnicianProfile = async (req, res) => {
  try {
    const technician = await Technicien.findById(req.user.id).select("-TECH_mot_passe");
    if (!technician) {
      return res.status(404).json({ message: "Technicien non trouvé" });
    }
    res.status(200).json(technician);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Mise à jour du profil (uniquement par le technicien)
const updateTechnicianProfile = async (req, res) => {
  try {
    const { TECH_nom_prenom, TECH_telephone, TECH_specialite, TECH_email, oldPassword, newPassword } = req.body;
    const technician = await Technicien.findById(req.user.id);

    if (!technician) {
      return res.status(404).json({ message: "Technicien non trouvé" });
    }

    // 🔹 Mise à jour des champs standards
    if (TECH_nom_prenom) technician.TECH_nom_prenom = TECH_nom_prenom;
    if (TECH_telephone) technician.TECH_telephone = TECH_telephone;
    if (TECH_specialite) technician.TECH_specialite = TECH_specialite;

    // 🔹 Mise à jour de l'email (avec vérification d'unicité)
    if (TECH_email && TECH_email !== technician.TECH_email) {
      const existingTechnician = await Technicien.findOne({ TECH_email });
      if (existingTechnician) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }
      technician.TECH_email = TECH_email;
    }

    // 🔹 Mise à jour du mot de passe (avec validation de l'ancien mot de passe)
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, technician.TECH_mot_passe);
      if (!isMatch) {
        return res.status(400).json({ message: "Ancien mot de passe incorrect" });
      }
      technician.TECH_mot_passe = await bcrypt.hash(newPassword, 10);
    }

    await technician.save();

    res.status(200).json({ message: "Profil mis à jour avec succès", technician });

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Récupérer tous les techniciens
const getTechniciens = async (req, res) => {
  try {
    const techniciens = await Technicien.find().select("-TECH_mot_passe");
    res.status(200).json(techniciens);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Récupérer un technicien par ID
const getTechnicienById = async (req, res) => {
  try {
    const { id } = req.params;
    const technicien = await Technicien.findById(id).select("-TECH_mot_passe");
    if (!technicien) {
      return res.status(404).json({ message: "Technicien non trouvé" });
    }
    res.status(200).json(technicien);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Mise à jour d'un technicien (par un admin ou super-admin)
const updateTechnician = async (req, res) => {
  try {
    const { id } = req.params;
    let technician = await Technicien.findById(id);
    if (!technician) {
      return res.status(404).json({ message: "Technicien non trouvé" });
    }

    // ✅ Bloquer la modification de TECH_disponibilite
    const { TECH_disponibilite, TECH_email, TECH_mot_passe, ...updateFields } = req.body;
    if (TECH_disponibilite !== undefined) {
      return res.status(403).json({ message: "La disponibilité du technicien est gérée automatiquement." });
    }
    if (TECH_email || TECH_mot_passe) {
      return res.status(403).json({ message: "Modification de l'email ou du mot de passe interdite." });
    }

    // ✅ Mettre à jour uniquement les champs autorisés
    const updatedTechnician = await Technicien.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    console.log("✅ Technicien mis à jour :", updatedTechnician);

    // 📩 **Notification au technicien**
    await sendEmail(updatedTechnician.TECH_email, "Mise à jour de votre compte",
      `Bonjour ${updatedTechnician.TECH_nom_prenom},\n\nVotre profil a été mis à jour par un administrateur.\n\nMerci.`
    );

    // 📩 **Notifier les admins et super-admins**
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");
    admins.forEach(async (admin) => {
      await sendEmail(admin.PERS_email, "Mise à jour d'un technicien",
        `Le profil du technicien ${updatedTechnician.TECH_nom_prenom} a été modifié.`
      );
    });

    res.status(200).json({ message: "Technicien mis à jour avec succès.", updatedTechnician });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du technicien :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};



// ✅ Création d'un technicien (par un admin/super-admin)
const createTechnician = async (req, res) => {
  try {
    const { TECH_nom_prenom, TECH_email, TECH_mot_passe, TECH_telephone, TECH_specialite } = req.body;

    console.log("📩 Création du technicien :", req.body);

    if (!TECH_nom_prenom?.trim() || !TECH_email?.trim() || !TECH_mot_passe?.trim() || !TECH_specialite?.trim()) {
      return res.status(400).json({ message: "Tous les champs obligatoires doivent être remplis." });
    }

    const existingTechnician = await Technicien.findOne({ TECH_email });
    if (existingTechnician) {
      return res.status(400).json({ message: "Ce technicien existe déjà !" });
    }

    const hashedPassword = await bcrypt.hash(TECH_mot_passe, 10);

    const newTechnician = new Technicien({
      TECH_nom_prenom,
      TECH_email,
      TECH_mot_passe: hashedPassword,
      TECH_telephone,
      TECH_specialite
    });

    await newTechnician.save();
    const technicianWithoutPassword = await Technicien.findById(newTechnician._id).select("-TECH_mot_passe");

    // 📩 **Notification au technicien**
    await sendEmail(TECH_email, "Création de votre compte", `
      Bonjour ${TECH_nom_prenom},

      Votre compte technicien a été créé avec succès ! 🎉

      ✅ **Identifiants de connexion** :
      - ✉️ Email : ${TECH_email}
      - 🔑 Mot de passe : ${TECH_mot_passe}

      📌 Veuillez changer votre mot de passe après votre première connexion.

      Cordialement,
      L'équipe de support.
    `);

    // 📩 **Notifier les admins et super-admins**
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");
    admins.forEach(async (admin) => {
      await sendEmail(admin.PERS_email, "Nouveau technicien ajouté",
        `Un nouveau technicien, ${TECH_nom_prenom}, a été ajouté au système.`
      );
    });

    res.status(201).json({ message: "Technicien créé avec succès !", newTechnician: technicianWithoutPassword });

  } catch (error) {
    console.error("❌ Erreur lors de la création du technicien :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// ✅ Suppression d'un technicien
const deleteTechnician = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le technicien existe
    const technician = await Technicien.findById(id);
    if (!technician) {
      return res.status(404).json({ message: "Technicien non trouvé" });
    }

    // Supprimer le technicien
    await Technicien.findByIdAndDelete(id);

    console.log("✅ Technicien supprimé :", technician);

    // 📩 **Notifier le technicien supprimé**
    await sendEmail(
      technician.TECH_email,
      "Suppression de votre compte",
      `Bonjour ${technician.TECH_nom_prenom},\n\nVotre compte a été supprimé par l'administration.`
    );

    // 📩 **Notifier les admins et super-admins**
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");
    admins.forEach(async (admin) => {
      await sendEmail(admin.PERS_email, "Suppression d'un technicien",
        `Le technicien ${technician.TECH_nom_prenom} a été supprimé du système.`
      );
    });

    res.status(200).json({ message: "Technicien supprimé avec succès." });

  } catch (error) {
    console.error("❌ Erreur lors de la suppression du technicien :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


module.exports = {
  getTechnicianProfile,
  updateTechnicianProfile,
  getTechniciens,
  getTechnicienById,
  updateTechnician,
  createTechnician,
  deleteTechnician,
};