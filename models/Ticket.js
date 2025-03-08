const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const ticketSchema = new mongoose.Schema({
  TCKT_code: { type: String, unique: true }, // ✅ Code unique
  TCKT_client: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true },
  TCKT_equipment: { type: mongoose.Schema.Types.ObjectId, ref: "Equipment", required: true },
  TCKT_cree_par: { type: mongoose.Schema.Types.ObjectId, ref: "Client", required: true }, // ✅ Qui a créé le ticket
  TCKT_assignee_a: [{ type: mongoose.Schema.Types.ObjectId, ref: "Technicien" }], // ✅ Plusieurs techniciens peuvent être assignés
  TCKT_description: { type: String, required: true },
  TCKT_type_panne: { type: String, required: true },
  TCKT_degre_urgence: { type: String, enum: ["faible", "moyenne", "élevée"], default: "moyenne" },
  TCKT_statut: { type: String, enum: ["ouvert", "en cours", "résolu", "fermé"], default: "ouvert" },
  TCKT_backlog: { type: Boolean, default: true }, // ✅ Ticket en attente
  TCKT_sprint: { type: Boolean, default: false }, // ✅ Indique si le ticket est dans un sprint
  TCKT_sprint_id: { type: mongoose.Schema.Types.ObjectId, ref: "Sprint" }, // ✅ Associer à un sprint spécifique
  TCKT_DT_resolution_demandee: { type: Date }, // ✅ Date demandée par le client
  TCKT_DT_resolution_confirmee: { type: Date }, // ✅ Date confirmée par un technicien
  Date_creation: { type: Date, default: Date.now }
});

// 🔹 Génération du code unique avant la sauvegarde
ticketSchema.pre("save", async function (next) {
  if (!this.TCKT_code) {
    this.TCKT_code = await generateUniqueCode("Ticket", "TCKT");
  }
  next();
});

module.exports = mongoose.model("Ticket", ticketSchema);





