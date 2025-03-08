const mongoose = require("mongoose");

const globalCounterSchema = new mongoose.Schema({
  model: { type: String, required: true, unique: true }, // Nom du modèle (Client, Technicien, etc.)
  count: { type: Number, default: 0 } // Compteur pour ce modèle
});

module.exports = mongoose.model("GlobalCounter", globalCounterSchema);
