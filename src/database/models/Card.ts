import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';
import { RARITIES } from '../../config/rarities';

/**
 * Une "Card" = le MODÈLE d'une carte (ses métadonnées), pas un exemplaire précis.
 * Ex. : "Dragon Épique", rareté epic, prix 2000, 10 exemplaires au total.
 *
 * - maxSupply       = nombre total d'exemplaires jamais mis en vente (1 = unique).
 * - remainingSupply = combien il en reste à acheter (diminue à chaque achat).
 */
const cardSchema = new Schema(
  {
    // Identifiant lisible et unique (ex: "dragon-epique"). Sert dans /carte <id>.
    cardId: { type: String, required: true, unique: true, index: true },

    name: { type: String, required: true },

    // Petit texte d'ambiance affiché sur la fiche de la carte.
    description: { type: String, default: '' },

    // Rareté limitée aux valeurs autorisées (garde-fou côté base).
    rarity: { type: String, required: true, enum: [...RARITIES] },

    price: { type: Number, required: true, min: 0 },

    imageUrl: { type: String, required: true },

    // Couleur de bordure personnalisée (facultatif). Si absent, on prend
    // la couleur par défaut de la rareté.
    borderColor: { type: Number, default: null },

    maxSupply: { type: Number, required: true, min: 1, default: 1 },
    remainingSupply: { type: Number, required: true, min: 0 },

    // Fait partie de la réserve des drops automatiques ?
    autoDrop: { type: Boolean, required: true, default: false },

    // Comment on l'obtient lors d'un drop : 'buy' (payante) ou 'gift' (gratuite).
    dropMode: { type: String, required: true, enum: ['buy', 'gift'], default: 'buy' },
  },
  { timestamps: true },
);

export type CardData = InferSchemaType<typeof cardSchema>;
export type CardDoc = HydratedDocument<CardData>;

export const Card = model('Card', cardSchema);
