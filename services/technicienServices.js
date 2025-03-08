const Technicien = require("../models/Technicien");

// Vérifie et met à jour la disponibilité des techniciens en fonction de leur shift
const updateTechnicianAvailability = async () => {
  try {
    const now = new Date();
    const currentHour = now.getHours();
    let activeShift = "";

    // Déterminer le shift actif en fonction de l'heure actuelle
    if (currentHour >= 8 && currentHour < 16) {
      activeShift = "MORNING";
    } else if (currentHour >= 16 && currentHour < 24) {
      activeShift = "AFTERNOON";
    } else {
      activeShift = "NIGHT";
    }

    // Mettre à jour la disponibilité des techniciens
    await Technicien.updateMany(
      {}, 
      [{ $set: { TECH_disponibilite: { $eq: ["$TECH_shift", activeShift] } } }]
    );

    console.log(`✅ Disponibilité mise à jour - Shift Actif: ${activeShift}`);

  } catch (error) {
    console.error("❌ Erreur mise à jour disponibilité :", error);
  }
};



const rotateTechnicianShifts = async () => {
    try {
      const techniciens = await Technicien.find();
  
      for (let tech of techniciens) {
        let newShift;
        if (tech.TECH_shift === "MORNING") {
          newShift = "AFTERNOON";
        } else if (tech.TECH_shift === "AFTERNOON") {
          newShift = "NIGHT";
        } else {
          newShift = "MORNING";
        }
  
        tech.TECH_shift = newShift;
        await tech.save();
      }
  
      console.log("🔄 Rotation des shifts des techniciens effectuée !");
    } catch (error) {
      console.error("❌ Erreur lors de la rotation des shifts :", error);
    }
  };
  
  module.exports = { updateTechnicianAvailability, rotateTechnicianShifts };