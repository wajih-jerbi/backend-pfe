const mongoose = require("mongoose");
const { generateUniqueCode } = require("../utils/generateUniqueCode");
const bcrypt = require("bcryptjs");

const clientSchema = new mongoose.Schema({
  CLNT_code: { type: String, unique: true }, // ✅ Code unique

  CLNT_raison_sociale: { 
    type: String, 
    required: true, 
    trim: true 
  }, 

  CLNT_email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ // ✅ Vérification du format email
  }, 

  CLNT_mot_passe: { 
    type: String, 
    required: true 
  }, 

  CLNT_telephone: { 
    type: String, 
    trim: true,
    match: /^[0-9\-\+\s]+$/, // ✅ Validation du format téléphone
    minlength: 8, // ✅ Minimum 8 chiffres (Tunisie : 8 chiffres, international : +216..)
    maxlength: 15 // ✅ Maximum 15 chiffres
  },

  CLNT_statut: { 
    type: String, 
    enum: ["actif", "bloqué"], // ✅ Un client peut être actif ou bloqué
    default: "actif" 
  },

  CLNT_MF: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true
  },  

  CLNT_addresses: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, auto: true }, // ID unique MongoDB
      address: { type: String, required: true, trim: true },
    }
  ],

  CLNT_contract: { type: String }, // ✅ Chemin du fichier du contrat de maintenance

  Date_creation: { type: Date, default: Date.now }
});

// 🔹 Avant de sauvegarder un client, générer son code unique et hasher le mot de passe
clientSchema.pre("save", async function (next) {
  if (!this.CLNT_code) {
    this.CLNT_code = await generateUniqueCode("Client", "CLNT");
  }

  // ✅ Vérifier si le mot de passe est déjà haché pour éviter un double hashage
  if (this.isModified("CLNT_mot_passe") && !this.CLNT_mot_passe.startsWith("$2b$")) {
    this.CLNT_mot_passe = await bcrypt.hash(this.CLNT_mot_passe, 10);
  }

  next();
});
module.exports = mongoose.model("Client", clientSchema);







