const nodemailer = require("nodemailer");
require("dotenv").config();

// Vérification rapide des variables d'environnement
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("TWILIO_ACCOUNT_SID:", process.env.TWILIO_ACCOUNT_SID);



const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


// Vérifier la connexion SMTP
transporter.verify(function (error, success) {
  if (error) {
    console.error("Erreur de connexion SMTP :", error);
  } else {
    console.log("Serveur SMTP prêt à envoyer des emails !");
  }
});



// Fonction pour envoyer un email
const sendEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(` Email envoyé à ${to}`);
  } catch (error) {
    console.error(" Erreur envoi email:", error);
  }
};

module.exports = { sendEmail };

