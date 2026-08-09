import mongoose from 'mongoose';

/**
 * Ouvre la connexion à MongoDB.
 * On appelle cette fonction UNE fois, au démarrage du bot, AVANT de se
 * connecter à Discord : si la base n'est pas joignable, inutile de lancer
 * le bot (il ne pourrait rien enregistrer).
 */
export async function connectDatabase(): Promise<void> {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '' || uri.includes('colle_')) {
    throw new Error(
      'MONGODB_URI manquant ou non renseigné dans le fichier .env.',
    );
  }

  // `strictQuery` évite d'envoyer par erreur des filtres sur des champs
  // non déclarés dans nos modèles — utile pour l'anti-triche.
  mongoose.set('strictQuery', true);

  await mongoose.connect(uri);
  console.log('✅ Connecté à MongoDB !');

  // Petits messages si la connexion tombe/repart pendant que le bot tourne.
  mongoose.connection.on('error', (err) => {
    console.error('❌ Erreur MongoDB :', err);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️ Connexion MongoDB perdue.');
  });
}
