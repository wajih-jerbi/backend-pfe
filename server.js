const express = require("express");
const connectDB = require("./config/db");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const cron = require("node-cron");
const moment = require("moment");
const Technicien = require("./models/Technicien");
const { updateTechnicianAvailability, rotateTechnicianShifts } = require("./services/technicienServices");

// 🔥 Configurer Moment.js en français
moment.locale("fr");

// 🔹 Charger les variables d'environnement
dotenv.config();

// 🔹 Connexion à la base de données
connectDB();

// 🔹 Initialiser Express
const app = express();

// 🔹 Middleware
app.use(express.json()); 
app.use(cors()); 
app.use(morgan("dev")); 
app.use(express.urlencoded({ extended: true }));

// 🔹 Importation des routes
const clientRoutes = require("./routes/clientRoutes");
const technicienRoutes = require("./routes/technicienRoutes");
const personnelRoutes = require("./routes/personnelRoutes");
const equipmentRoutes = require("./routes/equipmentRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const interventionRoutes = require("./routes/interventionRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const commentaireRoutes = require("./routes/commentaireRoutes");
const authRoutes = require("./routes/authRoutes");
const typePanneRoutes = require("./routes/typePanneRoutes");
const typeEquipmentRoutes = require("./routes/typeEquipmentRoutes"); // ✅ Importer les routes TypeEquipment
const statsRoutes=require("./routes/statsRoutes")

// 🔹 Définition des routes API
app.get("/", (req, res) => {
  res.send("Bienvenue sur l'API de gestion de tickets !");
});

app.use("/api/clients", clientRoutes);
app.use("/api/techniciens", technicienRoutes);
app.use("/api/personnel", personnelRoutes);
app.use("/api/equipments", equipmentRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/interventions", interventionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/commentaires", commentaireRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/types-pannes", typePanneRoutes);
app.use("/api/type-equipments", typeEquipmentRoutes); // ✅ Ajouter la route API
app.use("/api/stats", statsRoutes);


// ✅ **Mise à jour automatique de la disponibilité des techniciens**
cron.schedule("*/5 * * * *", async () => {
  console.log("⏳ Vérification et mise à jour de la disponibilité des techniciens...");
  await updateTechnicianAvailability();
  console.log("✅ Disponibilités mises à jour !");
});


// ✅ **Rotation automatique des équipes chaque semaine**
cron.schedule("0 0 * * 0", async () => { 
  console.log("🔄 Rotation automatique des shifts des techniciens...");
  await rotateTechnicianShifts();
  console.log("✅ Rotation des shifts effectuée !");
});


//Créer une tâche cron pour la maintenance automatique
cron.schedule("0 0 * * *", async () => {
  console.log("🔍 Vérification des équipements nécessitant une maintenance...");

  const today = new Date();
  const équipements = await Equipment.find();

  équipements.forEach(async (equip) => {
    const prochainEntretien = new Date(equip.EQPT_derniere_date_Maintenance);
    prochainEntretien.setMonth(prochainEntretien.getMonth() + 6);

    if (prochainEntretien <= today) {
      await sendEmail(equip.EQPT_client_email, "Maintenance Préventive", "Votre équipement nécessite une maintenance.");
    }
  });

  console.log("✅ Vérification de maintenance terminée.");
});


// 🚀 **Démarrer le serveur**

app.listen(5000, () => {
  console.log(`✅ Serveur démarré sur le port 5000`);
});




