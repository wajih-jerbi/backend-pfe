const Equipment = require("../models/Equipment");
const TypeEquipment = require("../models/TypeEquipment");
const Client = require("../models/Client");
const Personnel = require("../models/Personnel"); // ✅ Ajout pour notification aux admins
const { sendEmail } = require("../services/emailService");

// ✅ Créer un équipement (par un client, technicien, admin ou super-admin)
const createEquipment = async (req, res) => {
  try {
    const { EQPT_CLNT_code, EQPT_CLNT_adresse, EQPT_marque, EQPT_libelle, EQPT_num_serie, EQPT_type, 
            EQPT_premiere_date_installation, EQPT_derniere_date_Maintenance, EQPT_date_debut_validite, 
            EQPT_date_fin_validite } = req.body;

    // 🔎 Vérifier le code client reçu
    console.log("🔎 Code client reçu :", EQPT_CLNT_code);
    const client = await Client.findOne({ CLNT_code: EQPT_CLNT_code });
    
    
    if (!client) {
      console.log("❌ Client introuvable dans la base !");
      return res.status(404).json({ message: "Client non trouvé" });
    }
    
    console.log("✅ Client trouvé :", client);


    // 🔍 Vérifier si le type d'équipement existe
    console.log("🔎 Type d'équipement reçu :", EQPT_type);
    const typeExists = await TypeEquipment.findOne({ TPEQ_code: EQPT_type });
    
    if (!typeExists) {
      console.log("❌ Type d'équipement introuvable !");
      return res.status(400).json({ message: "Le type d'équipement spécifié n'existe pas." });
    }
    
    console.log("✅ Type d'équipement trouvé :", typeExists);



    // 🔍 Vérifier si le numéro de série est unique
    const existingEquipment = await Equipment.findOne({ EQPT_num_serie });
    if (existingEquipment) {
      console.log("❌ Numéro de série déjà utilisé !");
      return res.status(400).json({ message: "Un équipement avec ce numéro de série existe déjà." });
    }

    // ✅ Créer l'équipement
    const newEquipment = new Equipment({
      EQPT_CLNT_code,
      EQPT_CLNT_adresse,
      EQPT_marque,
      EQPT_libelle,
      EQPT_num_serie,
      EQPT_type,
      EQPT_premiere_date_installation,
      EQPT_derniere_date_Maintenance,
      EQPT_date_debut_validite,
      EQPT_date_fin_validite
    });

    await newEquipment.save();
    console.log("✅ Équipement enregistré :", newEquipment);

    res.status(201).json({ message: "Équipement créé avec succès", newEquipment });

  } catch (error) {
    console.error("❌ Erreur lors de la création de l'équipement :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Récupérer tous les équipements
const getEquipments = async (req, res) => {
  try {
    const equipments = await Equipment.find().populate("EQPT_type", "TPEQ_libelle");
    res.status(200).json(equipments);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};


const getEquipmentsByClient = async (req, res) => {
  try {
    const clientId = req.user.id;

    // Trouver tous les équipements du client et ne retourner que `EQPT_code`
    const equipments = await Equipment.find({ EQPT_CLNT_code: clientId })
      .select("EQPT_code EQPT_libelle EQPT_marque EQPT_type");

    if (!equipments.length) {
      return res.status(404).json({ message: "Aucun équipement trouvé pour ce client." });
    }

    res.status(200).json(equipments);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des équipements :", error);
    res.status(500).json({ message: "Erreur serveur", error });
  }
};




// ✅ Mettre à jour un équipement (UNIQUEMENT ADMIN et SUPER_ADMIN)
const updateEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'équipement existe
    let equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.status(404).json({ message: "Équipement non trouvé" });
    }

    // Vérifier si un nouveau type d'équipement est spécifié
    if (req.body.EQPT_type) {
      const typeExists = await TypeEquipment.findOne({ TPEQ_code: req.body.EQPT_type });
      if (!typeExists) {
        return res.status(400).json({ message: "Le type d'équipement spécifié n'existe pas." });
      }
    }

    Object.assign(equipment, req.body);
    await equipment.save();

    // ✅ Notification par email aux admins
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } });
    admins.forEach(async (admin) => {
      await sendEmail(admin.PERS_email, "Équipement mis à jour", 
        `L'équipement ${equipment.EQPT_libelle} a été mis à jour.`);
    });

    res.status(200).json({ message: "Équipement mis à jour avec succès", equipment });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

// ✅ Supprimer un équipement (UNIQUEMENT ADMIN et SUPER_ADMIN)
const deleteEquipment = async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier si l'équipement existe
    const equipment = await Equipment.findById(id);
    if (!equipment) {
      return res.status(404).json({ message: "Équipement non trouvé" });
    }

    await Equipment.findByIdAndDelete(id);

    // ✅ Notification par email aux admins
    const admins = await Personnel.find({ PERS_role_acces: { $in: ["ADMIN", "SUPER_ADMIN"] } });
    admins.forEach(async (admin) => {
      await sendEmail(admin.PERS_email, "Équipement supprimé", 
        `L'équipement ${equipment.EQPT_libelle} a été supprimé.`);
    });

    res.status(200).json({ message: "Équipement supprimé avec succès" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error });
  }
};

module.exports = { 
  createEquipment, 
  getEquipments, 
  getEquipmentsByClient, 
  updateEquipment, 
  deleteEquipment 
};

