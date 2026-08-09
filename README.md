# 🎴 YCC — Bot Discord (gacha + économie Yumz)

Bot Discord où les membres gagnent des **Yumz** et achètent des **cartes** à collectionner.

> Stack : Node.js + TypeScript · discord.js v14 · MongoDB (Mongoose)

## 🚀 Lancer le bot en local

### 1. Installer les dépendances
```bash
npm install
```

### 2. Configurer les secrets
Copie `.env.example` en `.env`, puis remplis :
- `DISCORD_TOKEN` — Developer Portal → onglet **Bot** → *Reset Token*
- `CLIENT_ID` — Developer Portal → **General Information** → *Application ID*
- `GUILD_ID` — clic droit sur ton serveur → *Copier l'identifiant du serveur*
  (nécessite d'activer le **Mode développeur** dans Discord : Paramètres → Avancés)
- `MONGODB_URI` — MongoDB Atlas → *Connect* → *Drivers* → copie la chaîne de connexion

⚠️ Ne partage jamais ton `.env` et ne le mets jamais sur GitHub.

### 3. Insérer des cartes d'exemple (une fois)
```bash
npm run seed
```

### 4. Enregistrer les commandes slash (à refaire quand on en ajoute/modifie)
```bash
npm run deploy
```

### 5. Démarrer le bot
```bash
npm run dev
```
`dev` redémarre automatiquement le bot à chaque modification du code.

Puis, dans Discord, tape `/ping` → le bot doit répondre 🏓.

## 📜 Scripts disponibles
| Script | Rôle |
|---|---|
| `npm run dev` | Démarre le bot (redémarrage auto à chaque changement) |
| `npm start` | Démarre le bot une fois |
| `npm run deploy` | Enregistre/actualise les commandes slash sur le serveur |
| `npm run seed` | Insère les cartes d'exemple dans la base |
| `npm run typecheck` | Vérifie le typage TypeScript sans lancer le bot |

## 🎮 Commandes
### Membres
| Commande | Rôle |
|---|---|
| `/ping` | Vérifie que le bot répond |
| `/daily` | Réclame 550 Yumz (une fois par 24 h) |
| `/solde` | Affiche ton solde de Yumz |
| `/catalogue` | Feuillette toutes les cartes (paginé) |
| `/carte <id>` | Détail d'une carte précise |
| `/boutique` | Achète directement des cartes (navigation + bouton Acheter) |
| `/inventaire [membre]` | Feuillette tes cartes (ou celles d'un membre) |

### Admins
| Commande | Rôle |
|---|---|
| `/drop <id>` | Poste une carte achetable/gratuite (selon son mode) |
| `/give_yumz <membre> <montant> [raison]` | Donne/retire des Yumz |
| `/reward bump\|boost\|voice\|level <membre>` | Applique le barème des récompenses |
| `/reserve add\|remove\|list` | Gère la réserve des drops automatiques |

## 💬 Économie automatique par message
Configurée dans `src/config/activity.ts`. Gain par message :
`base(25–35) × (meilleur rôle × salon) + bonus_longueur`, plafonné à **100**
(le bonus de longueur n'est pas multiplié → anti-abus). Cooldown : 30 s/membre.
Renseigne les IDs de salons/rôles multiplicateurs dans ce fichier.

## 🎁 Drops automatiques
Configurés dans `src/config/drops.ts` (salon + intervalle aléatoire).
Le bot poste seul, à des moments aléatoires, une carte de la **réserve**
(gérée via `/reserve`). Chaque carte a un mode : **achat** ou **cadeau** (gratuit).
Tant que `channelId` vaut le placeholder, les drops auto sont désactivés.

## 💰 Barème des Yumz
- `/daily` : **550** · Bump : **500** (×3/jour) · Boost 1 mois : **5 000** · Succès vocal : **2 000**
- Niveaux (paliers de 10) : `niveau × 100 + 500` → L10 **1 500** … L100 **10 500**

## 🛡️ Anti-concurrence (carte unique)
L'achat repose sur des opérations **atomiques** MongoDB (`findOneAndUpdate` avec
condition `remainingSupply > 0`). Sur la dernière carte, un seul acheteur passe ;
les autres reçoivent « Trop tard ». Voir `src/services/purchase.ts`.

## 🗂️ Structure du projet
```
src/
├── index.ts              → point d'entrée : connecte le bot + routeur d'interactions
├── deploy-commands.ts    → enregistre les commandes slash auprès de Discord
├── types.ts              → types partagés (contrat des commandes)
├── config/
│   ├── rewards.ts        → barème des Yumz
│   └── rarities.ts       → raretés (couleur + emoji)
├── database/
│   ├── connect.ts        → connexion à MongoDB
│   ├── seed.ts           → cartes d'exemple
│   └── models/           → User, Card, Transaction
├── services/
│   ├── purchase.ts       → ⭐️ achat anti-concurrence
│   └── economy.ts        → donner/retirer des Yumz
├── interactions/
│   └── buyButton.ts      → clic sur « Acheter »
├── utils/
│   ├── cardEmbed.ts      → Embed d'une carte
│   ├── dropMessage.ts    → message de drop (embed + bouton)
│   ├── pagination.ts     → pagination ◀ / ▶ réutilisable
│   └── time.ts           → durées lisibles
└── commands/
    ├── registry.ts       → liste centrale des commandes
    ├── ping.ts · daily.ts · solde.ts
    ├── catalogue.ts · carte.ts · inventaire.ts
    └── drop.ts · give_yumz.ts · reward.ts
```
