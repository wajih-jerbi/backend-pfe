const twilio = require("twilio");
require("dotenv").config();

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);



 /*client.messages
  .create({
    from: process.env.TWILIO_WHATSAPP_NUMBER,
    to: "whatsapp:+21629057400", // Mets ton propre numéro ici pour tester
    body: "Test de message WhatsApp depuis Twilio 🚀",
  })
  .then((message) => console.log("Message WhatsApp envoyé avec succès :", message.sid))
  .catch((error) => console.error("Erreur lors de l'envoi du message WhatsApp :", error));
*/





// Fonction pour envoyer un message WhatsApp
const sendWhatsAppMessage = async (to, message) => {
  try {
    await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,
      to: `whatsapp:${to}`,
      body: message,
    });
    console.log(` WhatsApp message envoyé à ${to}`);
  } catch (error) {
    console.error("Erreur envoi WhatsApp:", error);
  }
};

module.exports = { sendWhatsAppMessage };

