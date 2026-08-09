"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
const mongoose_1 = __importDefault(require("mongoose"));
/**
 * Ouvre la connexion à MongoDB.
 * On appelle cette fonction UNE fois, au démarrage du bot, AVANT de se
 * connecter à Discord : si la base n'est pas joignable, inutile de lancer
 * le bot (il ne pourrait rien enregistrer).
 */
async function connectDatabase() {
    const uri = process.env.MONGODB_URI;
    if (!uri || uri.trim() === '' || uri.includes('colle_')) {
        throw new Error('MONGODB_URI manquant ou non renseigné dans le fichier .env.');
    }
    // `strictQuery` évite d'envoyer par erreur des filtres sur des champs
    // non déclarés dans nos modèles — utile pour l'anti-triche.
    mongoose_1.default.set('strictQuery', true);
    await mongoose_1.default.connect(uri);
    console.log('✅ Connecté à MongoDB !');
    // Petits messages si la connexion tombe/repart pendant que le bot tourne.
    mongoose_1.default.connection.on('error', (err) => {
        console.error('❌ Erreur MongoDB :', err);
    });
    mongoose_1.default.connection.on('disconnected', () => {
        console.warn('⚠️ Connexion MongoDB perdue.');
    });
}
