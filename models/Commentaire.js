const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const commentSchema = new mongoose.Schema({
  CMMT_code: { type: String, unique: true }, // ✅ Code unique
  CMMT_ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
  CMMT_utilisateur: { type: mongoose.Schema.Types.ObjectId, refPath: "CMMT_user_Type", required: true },
  CMMT_utilisateur_Type: { type: String, enum: ["Client", "Technicien"], required: true },
  CMMT_message: { type: String, required: true },
  CMMT_Date_creation: { type: Date, default: Date.now }
});


// 🔹 Génération du code unique avant la sauvegarde
commentSchema.pre("save", async function (next) {
  if (!this.CMMT_code) {
    this.CMMT_code = await generateUniqueCode("Commentaire", "CMMT");
  }
  next();
});

module.exports = mongoose.model("Commentaire", commentSchema);


  
  

