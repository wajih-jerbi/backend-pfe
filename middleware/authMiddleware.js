const jwt = require("jsonwebtoken");
const Personnel = require("../models/Personnel");
const Technicien = require("../models/Technicien");
const Client = require("../models/Client");

// ✅ Middleware pour vérifier le token JWT
const protect = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Accès non autorisé, token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id) {
      return res.status(401).json({ message: "Token invalide, ID utilisateur manquant." });
    }

    let user = await Personnel.findById(decoded.id).select("-PERS_mot_passe");

    if (!user) {
      user = await Technicien.findById(decoded.id).select("-TECH_mot_passe");
    }

    if (!user) {
      user = await Client.findById(decoded.id).select("-CLNT_mot_passe");
    }

    if (!user) {
      console.error(`❌ Aucun utilisateur trouvé pour l'ID : ${decoded.id}`);
      return res.status(401).json({ message: "Utilisateur non trouvé." });
    }

    req.user = {
      id: user._id,
      role: user.PERS_role_acces || (user.TECH_specialite ? "TECHNICIEN" : "CLIENT"), // ✅ Détecte personnel, technicien ou client
      fonction: user.PERS_fonction || null // Si c'est un personnel, stocker sa fonction
    };

    console.log("🔐 Utilisateur connecté :", req.user);

    next();
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du token :", error);
    res.status(401).json({ message: "Token invalide" });
  }
};

// ✅ Middleware pour restreindre l'accès à certains rôles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Accès interdit" });
    }
    next();
  };
};

// ✅ Vérifier si le client est bloqué
const protectClient = async (req, res, next) => {
  try {
    const client = await Client.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ message: "Client non trouvé" });
    }

    if (client.CLNT_statut === "bloqué") {
      return res.status(403).json({ message: "Accès interdit, votre compte est bloqué." });
    }

    next();
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du statut client :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = { protect, authorize, protectClient };