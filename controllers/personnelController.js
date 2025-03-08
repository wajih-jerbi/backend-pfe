const Personnel = require("../models/Personnel");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../services/emailService");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

// ✅ Créer un personnel (SUPER_ADMIN gère tout, ADMIN gère NORMAL)
const createPersonnel = async (req, res) => {
  try {
    const { PERS_nom_prenom, PERS_email, PERS_mot_passe, PERS_telephone, PERS_role_acces, PERS_fonction } = req.body;

    if (!PERS_nom_prenom || !PERS_email || !PERS_mot_passe || !PERS_fonction) {
      return res.status(400).json({ message: "Tous les champs requis doivent être fournis." });
    }

    const existingPersonnel = await Personnel.findOne({ PERS_email });
    if (existingPersonnel) {
      return res.status(400).json({ message: "Cet email est déjà utilisé par un personnel." });
    }

    if (req.user.PERS_role_acces === "ADMIN" && PERS_role_acces !== "NORMAL") {
      return res.status(403).json({ message: "Un admin ne peut créer que des personnels de type NORMAL." });
    }

    const hashedPassword = await bcrypt.hash(PERS_mot_passe, 10);
    const PERS_code = await generateUniqueCode("Personnel", "PERS");

    const newPersonnel = new Personnel({
      PERS_code,
      PERS_nom_prenom,
      PERS_email,
      PERS_mot_passe: hashedPassword,
      PERS_telephone,
      PERS_role_acces: PERS_role_acces || "NORMAL",
      PERS_fonction,
    });

    await newPersonnel.save();

    // ✅ Envoi de l'email au personnel créé
    await sendEmail(
      PERS_email,
      "Création de votre compte",
      `Bonjour ${PERS_nom_prenom},\n\nVotre compte a été créé avec succès.\n\n🔹 Email : ${PERS_email}\n🔹 Mot de passe : ${PERS_mot_passe}\n\nVeuillez modifier votre mot de passe après la première connexion.`
    );

    // ✅ Notifier tous les Admins et Super-Admins
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");
    admins.forEach(async (admin) => {
      await sendEmail(admin.PERS_email, "Nouveau personnel ajouté", `Un nouveau personnel (${PERS_nom_prenom}) a été ajouté.`);
    });

    res.status(201).json({ message: "Personnel créé avec succès !" });
  } catch (error) {
    console.error("❌ Erreur lors de la création du personnel :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};



// ✅ Récupérer tous les personnels
const getPersonnels = async (req, res) => {
  try {
    const personnels = await Personnel.find().select("-PERS_mot_passe");
    res.status(200).json(personnels);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// ✅ Récupérer tous les personnels
//recuperer un client par son id
const getPersonnelById = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le client existe
    const personnel = await Personnel.findById(id).select("-PERS_password");
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    res.status(200).json(personnel);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du personnel :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};



// ✅ Modifier un personnel (SUPER_ADMIN gère tout, ADMIN gère NORMAL)
const updatePersonnel = async (req, res) => {
  try {
    const { id } = req.params;
    let personnel = await Personnel.findById(id);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    if (req.user.PERS_role_acces === "ADMIN" && personnel.PERS_role_acces !== "NORMAL") {
      return res.status(403).json({ message: "Un admin ne peut modifier que des personnels de type NORMAL." });
    }

    const { PERS_email, PERS_mot_passe, ...updateFields } = req.body;
    if (PERS_email || PERS_mot_passe) {
      return res.status(403).json({ message: "Modification de l'email ou du mot de passe interdite ici." });
    }

    const updatedPersonnel = await Personnel.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    // ✅ Envoi d'un email au personnel concerné
    await sendEmail(updatedPersonnel.PERS_email, "Mise à jour de votre compte", `Votre profil a été mis à jour.`);

    // ✅ Notifier tous les Admins et Super-Admins
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");
    admins.forEach(async (admin) => {
      await sendEmail(admin.PERS_email, "Mise à jour d'un personnel", `Le personnel ${updatedPersonnel.PERS_nom_prenom} a été modifié.`);
    });

    res.status(200).json({ message: "Personnel mis à jour avec succès.", updatedPersonnel });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


//un personnel  modifie sauf son profil (specifique pour le personnel seul)

const updatePersonnelProfile = async (req, res) => {
  try {
    const { PERS_nom_prenom, PERS_telephone, PERS_email, oldPassword, newPassword } = req.body;
    let personnel = await Personnel.findById(req.user.id);

    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    // 🔹 Mise à jour des champs standards
    if (PERS_nom_prenom) personnel.PERS_nom_prenom = PERS_nom_prenom;
    if (PERS_telephone) personnel.PERS_telephone = PERS_telephone;

    // 🔹 Vérification et mise à jour de l'email
    if (PERS_email && PERS_email !== personnel.PERS_email) {
      const existingPersonnel = await Personnel.findOne({ PERS_email });
      if (existingPersonnel) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }
      personnel.PERS_email = PERS_email;
    }

    // 🔹 Mise à jour sécurisée du mot de passe
    if (oldPassword && newPassword) {
      const isMatch = await bcrypt.compare(oldPassword, personnel.PERS_mot_passe);
      if (!isMatch) {
        return res.status(400).json({ message: "Ancien mot de passe incorrect" });
      }
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
      }
      personnel.PERS_mot_passe = await bcrypt.hash(newPassword, 10);
    }

    await personnel.save();

    // 📧 Notification par email
    await sendEmail(
      personnel.PERS_email,
      "Mise à jour de votre compte",
      `Bonjour ${personnel.PERS_nom_prenom},\n\nVotre profil a été mis à jour avec succès.\n\nMerci !`
    );

    res.status(200).json({ message: "Profil mis à jour avec succès", personnel });

  } catch (error) {
    console.error("❌ Erreur mise à jour personnel :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


/// ✅ Supprimer un personnel (seulement par SUPER_ADMIN ou ADMIN selon les rôles)
const deletePersonnel = async (req, res) => {
  try {
    const personnel = await Personnel.findById(req.params.id);
    if (!personnel) {
      return res.status(404).json({ message: "Personnel non trouvé" });
    }

    if (req.user.PERS_role_acces === "ADMIN" && personnel.PERS_role_acces !== "NORMAL") {
      return res.status(403).json({ message: "Un admin ne peut supprimer que des personnels de type NORMAL." });
    }

    await Personnel.findByIdAndDelete(req.params.id);

    // ✅ Notifier tous les Admins et Super-Admins
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");
    admins.forEach(async (admin) => {
      await sendEmail(admin.PERS_email, "Suppression d'un personnel", `Le personnel ${personnel.PERS_nom_prenom} a été supprimé.`);
    });

    res.status(200).json({ message: "Personnel supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = { createPersonnel, getPersonnels, getPersonnelById,updatePersonnel,updatePersonnelProfile, deletePersonnel };
