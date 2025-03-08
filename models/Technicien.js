const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const technicienSchema = new mongoose.Schema({
  TECH_code: { type: String, unique: true },
  TECH_nom_prenom: { type: String, required: true },
  TECH_email: { type: String, required: true, unique: true },
  TECH_mot_passe: { type: String, required: true },
  TECH_telephone: { type: String },
  TECH_specialite: { type: String, required: true },
  TECH_disponibilite: { type: Boolean, default: true }, 
  TECH_tickets_assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }], // ✅ Liste des tickets assignés
  Date_creation: { type: Date, default: Date.now }
});

// Génération du code unique
technicienSchema.pre("save", async function (next) {
  if (!this.TECH_code) {
    this.TECH_code = await generateUniqueCode("Technicien", "TECH");
  }
  next();
});

module.exports = mongoose.model("Technicien", technicienSchema);
