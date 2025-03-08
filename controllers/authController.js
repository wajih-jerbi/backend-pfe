const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Client = require("../models/Client");
const Technicien = require("../models/Technicien");
const Personnel = require("../models/Personnel");

// ✅ Fonction de connexion (Login)
// @route POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, mot_passe } = req.body;

    if (!email || !mot_passe) {
      return res.status(400).json({ message: "Veuillez fournir un email et un mot de passe" });
    }

    // 🔹 Vérifier si l'utilisateur existe (dans Personnel, Technicien ou Client)
    let user = await Personnel.findOne({ PERS_email: email }).select("+PERS_mot_passe") ||
               await Technicien.findOne({ TECH_email: email }).select("+TECH_mot_passe") ||
               await Client.findOne({ CLNT_email: email }).select("+CLNT_mot_passe");

    if (!user) {
      return res.status(401).json({ message: "Email ou mot de passe incorrect" });
    }

    // 🔹 Comparaison du mot de passe
    const isMatch = await bcrypt.compare(mot_passe, user.PERS_mot_passe || user.TECH_mot_passe || user.CLNT_mot_passe);

    console.log("🔍 Mot de passe entré :", mot_passe);
    console.log("🔑 Mot de passe haché en base :", user.PERS_mot_passe || user.TECH_mot_passe || user.CLNT_mot_passe);
    console.log("✅ Comparaison des mots de passe :", isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: "Mot de passe incorrect !" });
    }

    // 🔹 Génération du token
    const token = jwt.sign(
      { id: user._id, role: user.PERS_role_acces || "CLIENT" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({ message: "Connexion réussie", token });

  } catch (error) {
    console.error("❌ Erreur lors de la connexion :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
};


// ✅ Récupérer les informations de l'utilisateur connecté
// @route GET /api/auth/me
const getProfile = async (req, res) => {
  try {
    console.log("🔍 User from token:", req.user);
    const { id, role } = req.user;
    let user;

    if (["ADMIN", "SUPER_ADMIN", "NORMAL"].includes(role)) {
      user = await Personnel.findById(id).select("-PERS_mot_passe");
    } else if (role === "TECHNICIEN") {
      user = await Technicien.findById(id).select("-TECH_mot_passe");
    } else if (role === "CLIENT") {
      user = await Client.findById(id).select("-CLNT_mot_passe");
    }

    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération du profil :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = { login, getProfile };
