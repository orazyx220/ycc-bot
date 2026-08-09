import { Schema, model, type InferSchemaType, type HydratedDocument } from 'mongoose';

/**
 * Un "User" = un membre Discord, avec son porte-monnaie et ses cartes.
 * On l'identifie par son `discordId` (l'ID unique donné par Discord).
 */
const userSchema = new Schema(
  {
    // ID Discord du membre — unique, et indexé pour des recherches rapides.
    discordId: { type: String, required: true, unique: true, index: true },

    // Solde de Yumz. Ne peut jamais descendre sous 0 (garde-fou anti-triche).
    yumz: { type: Number, required: true, default: 0, min: 0 },

    // IDs des cartes possédées (on remplira ça à l'étape "achat de cartes").
    cards: { type: [String], required: true, default: [] },

    // Dernière fois que le membre a fait /daily (null = jamais).
    dailyLastClaim: { type: Date, default: null },
    // Nombre de jours consécutifs de /daily (pour le bonus de streak).
    dailyStreak: { type: Number, required: true, default: 0 },

    // Compteur de bumps du jour + la date associée (pour le remettre à 0 chaque jour).
    bumpCountToday: { type: Number, required: true, default: 0 },
    bumpCountDate: { type: String, default: null }, // format 'AAAA-MM-JJ'

    // Cooldowns de /travailler et de la roue (null = jamais utilisé).
    workLastClaim: { type: Date, default: null },
    wheelLastSpin: { type: Date, default: null },
  },
  { timestamps: true }, // ajoute createdAt / updatedAt automatiquement
);

/** Type "données brutes" d'un user, déduit automatiquement du schéma. */
export type UserData = InferSchemaType<typeof userSchema>;
/** Type d'un document Mongoose complet (avec .save(), etc.). */
export type UserDoc = HydratedDocument<UserData>;

export const User = model('User', userSchema);

/**
 * Récupère le user, ou le crée s'il n'existe pas encore.
 * On utilise `upsert` (update-or-insert) : une seule opération atomique,
 * donc pas de risque de créer deux fois le même membre.
 */
export async function getOrCreateUser(discordId: string): Promise<UserDoc> {
  const user = await User.findOneAndUpdate(
    { discordId },
    { $setOnInsert: { discordId } },
    { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true },
  );
  // upsert:true + new:true garantit qu'on a toujours un document ici.
  return user as UserDoc;
}
