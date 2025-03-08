const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const Personnel = require("./models/Personnel");

// Charger les variables d'environnement
dotenv.config();

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("✅ Connexion réussie à MongoDB !");

    // Vérifier si un Super-Admin existe déjà
    const existingSuperAdmin = await Personnel.findOne({ PERS_role_acces: "SUPER_ADMIN" });
    if (existingSuperAdmin) {
      console.log("🔹 Un Super-Admin existe déjà.");
      return process.exit();
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash("SuperAdmin123", 10);

    // Créer un Super-Admin
    const superAdmin = new Personnel({
      PERS_nom_prenom: "Jerbi Wajih",
      PERS_email: "wajihjerbi4@gmail.com",
      PERS_mot_passe: hashedPassword,
      PERS_telephone: "+21629057400",
      PERS_role_acces: "SUPER_ADMIN",
      PERS_fonction: "CHEF_SERVICE"
    });

    await superAdmin.save();
    console.log("✅ Super-Admin créé avec succès !");
    process.exit();
  })
  .catch(err => {
    console.error("❌ Erreur lors de la connexion :", err);
    process.exit(1);
  });
