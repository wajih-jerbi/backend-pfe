const GlobalCounter = require("../models/GlobalCounter");

// 🔹 Fonction pour générer un code unique (ex: CLNT001, TCKT002, etc.)
const generateUniqueCode = async (modelName, prefix) => {
  try {
    let counter = await GlobalCounter.findOne({ model: modelName });

    if (!counter) {
      counter = new GlobalCounter({ model: modelName, count: 1 });
    } else {
      counter.count += 1;
    }

    await counter.save();

    // Format du code (ex: CLNT001, TCKT002)
    return `${prefix}${counter.count.toString().padStart(3, "0")}`;
  } catch (error) {
    console.error(`❌ Erreur génération code pour ${modelName}:`, error);
    throw new Error("Erreur de génération du code unique");
  }
};

module.exports = { generateUniqueCode };



