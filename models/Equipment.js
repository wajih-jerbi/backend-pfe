const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");
const TypeEquipment = require("./TypeEquipment");

const equipmentSchema = new mongoose.Schema({
  EQPT_code: { type: String, unique: true },
  EQPT_CLNT_code: { type: String, required: true },
  EQPT_CLNT_adresse: { type: String, required: true },
  EQPT_marque: { type: String, required: true },
  EQPT_libelle: { type: String, required: true },
  EQPT_num_serie: { type: String, unique: true, required: true },
  EQPT_type: { type: String, required: true },
  EQPT_premiere_date_installation: { type: Date, required: true },
  EQPT_derniere_date_Maintenance: { type: Date, required: true },
  EQPT_date_debut_validite: { type: Date, required: true },
  EQPT_date_fin_validite: { type: Date, required: true },
  EQPT_types_pannes: [{ type: mongoose.Schema.Types.ObjectId, ref: "TypePanne" }], // ✅ Ajout du champ
  EQPT_date_creation: { type: Date, default: Date.now }
});
// 🔹 Vérification que le type d'équipement existe avant d'enregistrer
equipmentSchema.pre("save", async function (next) {
  try {
    if (!this.EQPT_code) {
      const prefix = this.EQPT_type.substring(0, 2).toUpperCase(); // Ex: "PC", "IM"
      this.EQPT_code = await generateUniqueCode("Equipment", prefix);
    }

    // Vérifier que `EQPT_type` existe bien dans `TypeEquipment`
    const typeExists = await TypeEquipment.findOne({ TPEQ_code: this.EQPT_type });
    if (!typeExists) {
      return next(new Error(`Le type d'équipement '${this.EQPT_type}' n'existe pas dans TypeEquipment.`));
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Equipment", equipmentSchema);
