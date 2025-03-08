const Client = require("../models/Client");
const Personnel = require("../models/Personnel");
const bcrypt = require("bcryptjs");
const { sendEmail } = require("../services/emailService");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// ✅ Récupérer le profil du client connecté
const getClientProfile = async (req, res) => {
  try {
    const client = await Client.findById(req.user.id).select("-CLNT_mot_passe");
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }
    res.status(200).json(client);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Modifier son propre profil (Client)
const updateClientProfile = async (req, res) => {
  try {
    const { CLNT_raison_sociale, CLNT_telephone, CLNT_email, oldPassword, newPassword } = req.body;
    let client = await Client.findById(req.user.id);

    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    // 🔹 Mise à jour des champs standards
    if (CLNT_raison_sociale) client.CLNT_raison_sociale = CLNT_raison_sociale;
    if (CLNT_telephone) client.CLNT_telephone = CLNT_telephone;

    // 🔹 Vérification et mise à jour de l'email (avec contrôle d'unicité)
    if (CLNT_email && CLNT_email !== client.CLNT_email) {
      const existingClient = await Client.findOne({ CLNT_email });
      if (existingClient) {
        return res.status(400).json({ message: "Cet email est déjà utilisé" });
      }
      client.CLNT_email = CLNT_email;
    }

    // 🔹 Mise à jour du mot de passe (avec validation de l'ancien mot de passe)
    if (oldPassword && newPassword) {
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Le mot de passe doit contenir au moins 8 caractères." });
      }
      const isMatch = await bcrypt.compare(oldPassword, client.CLNT_mot_passe);
      if (!isMatch) {
        return res.status(400).json({ message: "Ancien mot de passe incorrect" });
      }
      client.CLNT_mot_passe = await bcrypt.hash(newPassword, 10);
    }

    await client.save();

    // ✅ Envoyer un email au client
    await sendEmail(
      client.CLNT_email,
      "Mise à jour de votre profil",
      `Bonjour ${client.CLNT_raison_sociale},\n\nVous avez mis à jour votre profil avec succès.\n\nMerci.`
    );

    // ✅ Récupérer uniquement les personnels ayant le rôle "ADMIN" ou "SUPER_ADMIN"
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");

    // ✅ Envoyer un email aux admins concernés
    admins.forEach(async (admin) => {
      await sendEmail(
        admin.PERS_email,
        "Mise à jour d'un client",
        `Le client ${client.CLNT_raison_sociale} a mis à jour son profil.`
      );
    });

    res.status(200).json({ message: "Profil mis à jour avec succès", client });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du profil client :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// 📌 Configuration du stockage Multer pour le contrat de maintenance
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../uploads/contrats/");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });


const createClient = async (req, res) => {
  try {
    let { CLNT_raison_sociale, CLNT_email, CLNT_mot_passe, CLNT_telephone, CLNT_MF, CLNT_addresses } = req.body;

    // Vérifier l'email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(CLNT_email)) {
      return res.status(400).json({ message: "Adresse email invalide." });
    }

    // Vérifier unicité email & matricule fiscal
    if (await Client.findOne({ CLNT_email })) return res.status(400).json({ message: "Ce client existe déjà !" });
    if (await Client.findOne({ CLNT_MF })) return res.status(400).json({ message: "Matricule fiscale déjà utilisé !" });

    // ✅ Vérifier et parser `CLNT_addresses` si c'est une chaîne JSON
    try {
      if (typeof CLNT_addresses === "string") {
        CLNT_addresses = JSON.parse(CLNT_addresses);
      }
      
      // Vérifier que c'est bien un tableau d'objets contenant "address"
      if (!Array.isArray(CLNT_addresses) || !CLNT_addresses.every(addr => addr.address)) {
        return res.status(400).json({ message: "Les adresses doivent être un tableau contenant des objets avec un champ 'address'." });
      }
    } catch (error) {
      return res.status(400).json({ message: "Format des adresses invalide." });
    }

    // ✅ Vérifier que le fichier contrat est présent
    if (!req.file) {
      return res.status(400).json({ message: "Le contrat est obligatoire pour créer un client." });
    }

    // ✅ Définir le chemin du contrat
    let contractPath = `uploads/contrats/${req.file.filename}`;

    // Hacher le mot de passe
    const hashedPassword = CLNT_mot_passe.startsWith("$2b$")
    ? CLNT_mot_passe
    : await bcrypt.hash(CLNT_mot_passe, 10);
  

    // ✅ Création du client
    const newClient = new Client({
      CLNT_raison_sociale,
      CLNT_email,
      CLNT_mot_passe: hashedPassword,
      CLNT_telephone,
      CLNT_MF,
      CLNT_addresses, // Insérer la version correcte du tableau
      CLNT_contract: contractPath // ✅ Enregistrement du contrat
    });

    await newClient.save();

    // ✅ Envoyer un email de bienvenue au client
    await sendEmail(CLNT_email, "Bienvenue !", `Bonjour ${CLNT_raison_sociale},\n\nVotre compte a été créé avec succès.\n\n🔹 Email : ${CLNT_email}\n🔹 Mot de passe : ${CLNT_mot_passe}\n\nVeuillez modifier votre mot de passe après connexion.`);

    res.status(201).json({ message: "Client créé avec succès !" });

  } catch (error) {
    console.error("❌ Erreur lors de la création du client :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// ✅ Récupérer tous les clients (pagination)
const getClients = async (req, res) => {
  try {
    let { page, limit } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    const clients = await Client.find().select("-CLNT_mot_passe")
      .skip((page - 1) * limit)
      .limit(limit);

    const totalClients = await Client.countDocuments();

    res.status(200).json({
      totalPages: Math.ceil(totalClients / limit),
      currentPage: page,
      clients
    });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Mettre à jour un client (ADMIN ou SUPER_ADMIN)
const updateClient = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Vérifier si le client existe
    let client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    // ✅ Bloquer la modification de l'email et du mot de passe
    const { CLNT_email, CLNT_mot_passe, ...updateFields } = req.body;

    if (CLNT_email || CLNT_mot_passe) {
      return res.status(403).json({ message: "Modification de l'email ou du mot de passe interdite." });
    }

    // ✅ Vérifier si un fichier contrat est fourni
    if (req.file) {
      // Supprimer l'ancien fichier s'il existe
      if (client.CLNT_contract) {
        const oldPath = path.join(__dirname, "../", client.CLNT_contract);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      updateFields.CLNT_contract = `uploads/contrats/${req.file.filename}`;
    }

    // ✅ Mettre à jour uniquement les champs autorisés
    const updatedClient = await Client.findByIdAndUpdate(id, { $set: updateFields }, { new: true });

    // ✅ Envoyer un email au client
    await sendEmail(
      updatedClient.CLNT_email,
      "Mise à jour de votre compte",
      `Bonjour ${updatedClient.CLNT_raison_sociale},\n\nVotre profil a été mis à jour par un administrateur.\n\nMerci.`
    );

    // ✅ Récupérer uniquement les personnels ayant le rôle "ADMIN" ou "SUPER_ADMIN"
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");

    // ✅ Envoyer un email aux personnels concernés
    admins.forEach(async (admin) => {
      await sendEmail(
        admin.PERS_email,
        "Mise à jour d'un client",
        `Le client ${updatedClient.CLNT_raison_sociale} a été mis à jour.`
      );
    });

    res.status(200).json({ message: "Client mis à jour avec succès.", updatedClient });

  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour du client :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// Mise à jour du statut d'un client (activation/blocage)
const updateClientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { statut } = req.body; // "actif" ou "bloqué"

    if (!["actif", "bloqué"].includes(statut)) {
      return res.status(400).json({ message: "Statut invalide." });
    }

    const client = await Client.findById(id);
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    client.CLNT_statut = statut;
    await client.save();

    // Envoi d'un email au client
    await sendEmail(
      client.CLNT_email,
      `Mise à jour de votre statut`,
      `Votre compte a été ${statut === "bloqué" ? "bloqué" : "réactivé"}.`
    );

    res.status(200).json({ message: `Client ${statut} avec succès.`, client });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// ✅ Supprimer un client
const deleteClient = async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    await sendEmail(client.CLNT_email, "Suppression de votre compte", `Votre compte a été supprimé par l'administration.`);

    await Client.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: "Client supprimé avec succès" });

  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = { createClient, upload, getClientProfile, updateClientProfile, getClients,updateClient,updateClientStatus, deleteClient };
