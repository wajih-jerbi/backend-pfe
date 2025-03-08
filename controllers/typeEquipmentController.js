const TypeEquipment = require("../models/TypeEquipment");
const { sendEmail } = require("../services/emailService");

// ✅ Créer un type d'équipement
const createTypeEquipment = async (req, res) => {
  try {
    const { TPEQ_libelle } = req.body;

    // Vérifier si le type d'équipement existe déjà
    const existingType = await TypeEquipment.findOne({ TPEQ_libelle });
    if (existingType) {
      return res.status(400).json({ message: "Ce type d'équipement existe déjà !" });
    }

    const newTypeEquipment = new TypeEquipment({ TPEQ_libelle });
    await newTypeEquipment.save();

    // ✅ Envoyer une notification aux admins
    const message = `Un nouveau type d'équipement a été ajouté : ${TPEQ_libelle}`;
    await sendEmail("admin@example.com", "Nouveau type d'équipement", message);

    res.status(201).json({ message: "Type d'équipement créé avec succès", newTypeEquipment });
  } catch (error) {
    console.error("❌ Erreur lors de la création du type d'équipement :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Récupérer tous les types d'équipements
const getTypeEquipments = async (req, res) => {
  try {
    const types = await TypeEquipment.find();
    res.status(200).json(types);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Mettre à jour un type d'équipement
const updateTypeEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const { TPEQ_libelle } = req.body;

    const updatedType = await TypeEquipment.findByIdAndUpdate(
      id,
      { TPEQ_libelle },
      { new: true, runValidators: true }
    );

    if (!updatedType) {
      return res.status(404).json({ message: "Type d'équipement non trouvé" });
    }

    res.status(200).json({ message: "Type d'équipement mis à jour avec succès", updatedType });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Supprimer un type d'équipement
const deleteTypeEquipment = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedType = await TypeEquipment.findByIdAndDelete(id);

    if (!deletedType) {
      return res.status(404).json({ message: "Type d'équipement non trouvé" });
    }

    res.status(200).json({ message: "Type d'équipement supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = {
  createTypeEquipment,
  getTypeEquipments,
  updateTypeEquipment,
  deleteTypeEquipment
};
