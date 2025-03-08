const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const personnelSchema = new mongoose.Schema({
  PERS_code: { type: String, unique: true }, // Code unique du personnel
  PERS_nom_prenom: { type: String, required: true }, // Nom complet
  PERS_email: { type: String, required: true, unique: true }, // Email
  PERS_mot_passe: { type: String, required: true, select: false }, // Mot de passe
  PERS_telephone: { type: String }, // Téléphone
  PERS_role_acces: { 
    type: String, 
    enum: ["ADMIN", "SUPER_ADMIN", "NORMAL"], 
    default: "NORMAL" 
  }, // Rôle d'accès
  PERS_fonction: { 
    type: String, 
    enum: [
      "CHEF_SERVICE", 
      "RESPONSABLE_MAINTENANCE", 
      "GESTIONNAIRE_TICKETS", 
      "SECRÉTAIRE", 
      "COMPTABLE", 
      "RH", // Ressources humaines
      "SUPPORT_CLIENT"
    ], 
    default: "GESTIONNAIRE_TICKETS" 
  }, // Fonction du personnel
  Date_creation: { type: Date, default: Date.now }
});

// 🔹 Génération du code unique + Hashage du mot de passe
personnelSchema.pre("save", async function (next) {
  if (!this.PERS_code) {
    this.PERS_code = await generateUniqueCode("Personnel", "PERS");
  }

  // ✅ Vérifier si le mot de passe est déjà haché pour éviter un double hashage
  if (this.isModified("PERS_mot_passe") && !this.PERS_mot_passe.startsWith("$2b$")) {
    this.PERS_mot_passe = await bcrypt.hash(this.PERS_mot_passe, 10);
  }

  next();
});

module.exports = mongoose.model("Personnel", personnelSchema);


