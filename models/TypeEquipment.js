const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const typeEquipmentSchema = new mongoose.Schema({
  TPEQ_code: { type: String, unique: true }, // ✅ Code unique
  TPEQ_libelle: { type: String, required: true } // ✅ Libellé (Nom du type d'équipement)
});

// 🔹 Génération du code unique avant la sauvegarde
typeEquipmentSchema.pre("save", async function (next) {
  if (!this.TPEQ_code) {
    this.TPEQ_code = await generateUniqueCode("TypeEquipment", "TPEQ");
  }
  next();
});

module.exports = mongoose.model("TypeEquipment", typeEquipmentSchema);
