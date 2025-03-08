const bcrypt = require("bcryptjs");

const plainPassword = "sagem123";
const hashedPassword = "$2b$10$D6XXdg8epj7iIxDAR/H3ke8m4Tx/ihcfWzlnVGMxcZ2WcUlr614xO"; // Ton hash

bcrypt.compare(plainPassword, hashedPassword).then(result => {
  console.log("✅ Résultat de la comparaison :", result);
});
bcrypt.hash("sagem123", 10).then(hash => console.log(hash));
