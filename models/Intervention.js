const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const interventionSchema = new mongoose.Schema({
  INTR_code: { type: String, unique: true }, // ✅ Code unique
  INTR_ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
  INTR_techniciens: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technicien", required: true }], // ✅ Plusieurs techniciens peuvent intervenir
  INTR_description_panne: { type: String, required: true },
  INTR_cause_panne: { type: String }, // ✅ Cause identifiée
  INTR_solution_apportée: { type: String }, // ✅ Solution appliquée
  INTR_statut: { type: String, enum: ["en attente", "en cours", "terminé"], default: "en attente" }, // ✅ Ajout de "en attente"
  INTR_durée: { type: Number, default: 0 }, // ✅ Durée en minutes
  INTR_dt_debut: { type: Date }, // ✅ Début de l'intervention
  INTR_dt_fin: { type: Date }, // ✅ Fin de l'intervention
  Date_creation: { type: Date, default: Date.now } // ✅ Date de création
});

// 🔹 Génération automatique du code unique avant l'enregistrement
interventionSchema.pre("save", async function (next) {
  if (!this.INTR_code) {
    this.INTR_code = await generateUniqueCode("Intervention", "INTR");
  }
  next();
});

module.exports = mongoose.model("Intervention", interventionSchema);


