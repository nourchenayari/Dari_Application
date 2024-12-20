require('dotenv').config();
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Récupérer le token de l'en-tête Authorization
  const token = req.headers['authorization']?.replace('Bearer ', '').trim();
  
  console.log("Token reçu :", token);
  console.log("JWT_SECRET : ", process.env.JWT_SECRET);

  // Si le token est manquant
  if (!token) {
    return res.status(401).json({ msg: "Accès refusé, pas de token d'authentification" });
  }

  // Décoder les parties du token JWT (Header, Payload, Signature)
  const [header, payload, signature] = token.split('.');

  // Afficher les parties du token (pour débogage)
  console.log("Header (Base64) :", header);
  console.log("Payload (Base64) :", payload);
  console.log("Signature (Base64) :", signature);

  // Décoder le Header et le Payload pour afficher leur contenu
  try {
    const decodedHeader = JSON.parse(Buffer.from(header, 'base64').toString('utf8'));
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf8'));

    console.log("Header décodé :", decodedHeader);
    console.log("Payload décodé :", decodedPayload);
  } catch (error) {
    console.log("Erreur lors du décodage :", error.message);
    return res.status(400).json({ msg: "Erreur lors du décodage du token", error: error.message });
  }

  // Vérification du token avec la clé secrète
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);  // Vérifier la signature du token avec la clé secrète
    req.user = { userId: decoded.userId, role: decoded.role };  // Ajouter les informations utilisateur dans la requête
    next();  
  } catch (error) {
    console.log("Erreur lors de la vérification du token:", error.message);
    res.status(401).json({ msg: "Token invalide", error: error.message });
  }
};
module.exports.verifyAdmin = (req, res, next) => {
  console.log('req.user:', req.user);
  if (req.user && req.user.role === 'admin') {
    return next(); 
  } else {
    return res.status(403).json({ message: 'Accès refusé : privilèges d\'administrateur requis.' });
  }
};