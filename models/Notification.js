const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");

const notificationSchema = new mongoose.Schema({
  NOTF_code: { type: String, unique: true }, // ✅ Code unique
  NOTF_user: { type: mongoose.Schema.Types.ObjectId, refPath: "userType", required: true },
  NOTF_userType: { type: String, enum: ["Client", "Technicien", "Admin"], required: true },
  NOTF_ticket: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket" }, // Optionnel
  NOTF_type: { type: String, enum: ["email", "whatsapp"], required: true },
  NOTF_message: { type: String, required: true },
  NOTF_sentAt: { type: Date, default: Date.now }
});

// 🔹 Génération du code unique avant la sauvegarde
notificationSchema.pre("save", async function (next) {
  if (!this.NOTF_code) {
    this.NOTF_code = await generateUniqueCode("Notification", "NOTF");
  }
  next();
});

module.exports = mongoose.model("Notification", notificationSchema);


