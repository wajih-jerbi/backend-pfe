const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const typePanneSchema = new mongoose.Schema({
  PANN_code: { type: String, unique: true }, 
  PANN_libelle: { type: String, required: true, unique: true }, 
  PANN_TPEQ_code: { 
    type: String, // ✅ Garder comme String
    required: true
  },
  PANN_date_creation: { type: Date, default: Date.now }
});

// 🔹 Vérification avant d'enregistrer une panne
typePanneSchema.pre("save", async function (next) {
  if (!this.PANN_code) {
    this.PANN_code = await generateUniqueCode("TypePanne", "PANN");
  }

  const TypeEquipment = mongoose.model("TypeEquipment");
  const typeEquipExists = await TypeEquipment.findOne({ TPEQ_code: this.PANN_TPEQ_code });

  if (!typeEquipExists) {
    return next(new Error("Le code de l'équipement spécifié n'existe pas."));
  }

  next();
});

module.exports = mongoose.model("TypePanne", typePanneSchema);
