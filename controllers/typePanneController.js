const TypePanne = require("../models/TypePanne");
const TypeEquipment = require("../models/TypeEquipment");
const { sendEmail } = require("../services/emailService");

const createTypePanne = async (req, res) => {
  try {
    const { PANN_libelle, PANN_TPEQ_code } = req.body;

    // Vérifier si le type d'équipement existe
    const typeEquipExists = await TypeEquipment.findOne({ TPEQ_code: PANN_TPEQ_code });
    if (!typeEquipExists) {
      return res.status(400).json({ message: "Le type d'équipement spécifié n'existe pas." });
    }

    // Vérifier si le type de panne existe déjà
    const existingTypePanne = await TypePanne.findOne({ PANN_libelle });
    if (existingTypePanne) {
      return res.status(400).json({ message: "Ce type de panne existe déjà." });
    }

    const newTypePanne = new TypePanne({
      PANN_libelle,
      PANN_TPEQ_code
    });

    await newTypePanne.save();

    // ✅ Envoyer une notification aux admins
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } }, "PERS_email");
    admins.forEach(async (admin) => {
      await sendEmail(
        admin.PERS_email,
        "Nouveau type de panne ajouté",
        `🔧 Un nouveau type de panne "${PANN_libelle}" a été ajouté pour les équipements de type "${typeEquipExists.TPEQ_libelle}".`
      );
    });

    res.status(201).json({ message: "Type de panne créé avec succès", newTypePanne });

  } catch (error) {
    console.error("❌ Erreur lors de la création du type de panne :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// ✅ Récupérer tous les types de pannes
const getTypePannes = async (req, res) => {
  try {
    console.log("🔍 Récupération des types de pannes...");

    // Récupérer les types de pannes
    let typePannes = await TypePanne.find();

    // Récupérer les équipements correspondants
    const typeEquipmentMap = {};
    const typeEquipments = await TypeEquipment.find({}, "TPEQ_code TPEQ_libelle");

    typeEquipments.forEach((eq) => {
      typeEquipmentMap[eq.TPEQ_code] = eq.TPEQ_libelle;
    });

    // Ajouter les libellés d'équipement aux types de pannes
    typePannes = typePannes.map((panne) => ({
      ...panne._doc,
      PANN_TPEQ_libelle: typeEquipmentMap[panne.PANN_TPEQ_code] || "Inconnu"
    }));

    console.log("✅ Types de pannes récupérés :", typePannes);
    res.status(200).json(typePannes);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des types de pannes :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


// ✅ Récupérer un type de panne par ID
const getTypePanneById = async (req, res) => {
  try {
    const typePanne = await TypePanne.findById(req.params.id).populate("PANN_TPEQ_code", "TPEQ_libelle");
    if (!typePanne) {
      return res.status(404).json({ message: "Type de panne non trouvé" });
    }
    res.status(200).json(typePanne);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Mettre à jour un type de panne
const updateTypePanne = async (req, res) => {
  try {
    const { id } = req.params;
    const { PANN_libelle, PANN_TPEQ_code } = req.body;

    // Vérifier si le type de panne existe
    let typePanne = await TypePanne.findById(id);
    if (!typePanne) {
      return res.status(404).json({ message: "Type de panne non trouvé" });
    }

    // Vérifier si le code d'équipement existe
    if (PANN_TPEQ_code) {
      const equipmentExists = await TypeEquipment.findOne({ TPEQ_code: PANN_TPEQ_code });
      if (!equipmentExists) {
        return res.status(400).json({ message: "Le code d'équipement spécifié n'existe pas." });
      }
      typePanne.PANN_TPEQ_code = PANN_TPEQ_code;
    }

    if (PANN_libelle) typePanne.PANN_libelle = PANN_libelle;

    await typePanne.save();
    res.status(200).json({ message: "Type de panne mis à jour avec succès.", typePanne });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Supprimer un type de panne
const deleteTypePanne = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si le type de panne existe
    const typePanne = await TypePanne.findById(id);
    if (!typePanne) {
      return res.status(404).json({ message: "Type de panne non trouvé" });
    }

    await TypePanne.findByIdAndDelete(id);
    res.status(200).json({ message: "Type de panne supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = {
  createTypePanne,
  getTypePannes,
  getTypePanneById,
  updateTypePanne,
  deleteTypePanne
};