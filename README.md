# 🎴 YCC — Bot Discord (gacha + économie Yumz)

Bot Discord de **collection de cartes** et d'**économie Yumz** : les membres gagnent des **Yumz** en étant actifs, les dépensent pour **collectionner des cartes**, jouent à des **mini-jeux**, s'échangent des cartes et tentent leur chance à la **roue de la fortune**.

> **Stack :** Node.js + TypeScript · discord.js v14 · MongoDB (Mongoose)
> **Guide utilisateur :** https://orazyx220.github.io/ycc-bot/ (aussi `GUIDE.md` / `GUIDE.pdf`)

---

## 🎮 Commandes

### 👤 Membres
| Commande | Rôle |
|---|---|
| `/help [commande]` | Liste des commandes (filtrée par rôle) ou détail d'une commande |
| `/ping` | Vérifie que le bot répond |
| `/daily` | Yumz journaliers avec **bonus de streak** (550 → 1000) |
| `/travailler` | Petit gain aléatoire (50–150), cooldown 1 h |
| `/solde [membre]` | Solde de Yumz (le tien ou celui d'un membre) |
| `/classement` | Top 10 des membres + ton rang |
| `/catalogue` | Feuillette toutes les cartes (paginé) |
| `/carte <id>` | Détail d'une carte |
| `/boutique` | Achète directement des cartes |
| `/ouvrir` | Ouvre un booster (carte aléatoire par rareté) |
| `/inventaire [membre]` | Feuillette tes cartes |
| `/donner <membre> <id>` | Offre une de tes cartes |
| `/echange <membre> …` | Troc de cartes et/ou Yumz (avec accord) |
| `/parier pileouface\|des\|machine` | Mini-jeux de pari |
| `/roue` | Roue de la fortune (1×/semaine) |

### 🛡️ Admins
| Commande | Rôle |
|---|---|
| `/drop <id>` | Poste une carte achetable/gratuite |
| `/give_yumz <membre> <montant> [raison]` | Donne/retire des Yumz |
| `/give_all <montant> [raison]` | Donne des Yumz à **tous** les membres (confirmation) |
| `/reward bump\|boost\|voice\|level` | Applique le barème des récompenses |
| `/addcard` · `/editcard` · `/delcard` | Créer / modifier / supprimer une carte |
| `/givecard <membre> <id> [bonus]` | Offre une carte à un membre |
| `/reserve add\|remove\|list` | Gère la réserve des drops automatiques |
| `/reset <cible>` | Remet à zéro l'économie ⚠️ *(irréversible)* |

---

## 🪙 Sources de Yumz
- **Messages** : 25–35 (auto, cooldown 30 s), bonus de longueur jusqu'à 100, × multiplicateurs de salon/rôle.
- **`/daily`** : 550 + streak (+10/jour consécutif, plafond 1000, reset si un jour est raté).
- **`/travailler`** : 50–150 toutes les heures.
- **`/roue`** : lots hebdomadaires (10 → 100 000 Yumz, cartes…).
- **Bumps Disboard** : +500 automatique (max 3/jour), annonce dans un salon dédié.
- **Barème admin** : bump 500 · boost 5 000 · vocal 2 000 · niveau `niveau×100+500`.

## 🎴 Cartes
- 6 raretés : commune, rare, épique, légendaire, mystère, evil.
- Obtention : `/boutique`, `/ouvrir` (boosters), drops (manuels & auto), `/donner`, `/echange`, `/roue`.
- **Boosters** (`/ouvrir`, 1000 Yumz) : génération **libre** (le stock n'est pas consommé).
- **Anti-concurrence** : l'achat/récupération d'un exemplaire limité repose sur une opération
  **atomique** (`findOneAndUpdate` avec `remainingSupply > 0`) → un seul gagnant. Voir `src/services/purchase.ts`.

## 🎲 Mini-jeux (`/parier`)
- **Pile ou face / Dés** : double ou rien (équitable).
- **Machine à sous** : 3 identiques = jackpot (mise × mult), 2 identiques = mise remboursée, sinon perdu.

---

## ⚙️ Configuration (fichiers `src/config/`)
| Fichier | Contenu |
|---|---|
| `activity.ts` | Multiplicateurs de messages (IDs salons/rôles) |
| `drops.ts` | Salon + intervalle des drops automatiques |
| `bump.ts` | ID Disboard + salon des récompenses de bump |
| `rewards.ts` | Barème des Yumz + streak |
| `booster.ts` | Prix + probabilités des boosters |
| `games.ts` · `work.ts` · `wheel.ts` | Réglages mini-jeux / travailler / roue |
| `rarities.ts` | Raretés (couleur + emoji) |

---

## 🚀 Développement en local

### 1. Installer
```bash
npm install
```

### 2. Secrets — copie `.env.example` en `.env`
- `DISCORD_TOKEN` — Developer Portal → **Bot** → *Reset Token*
- `CLIENT_ID` — Developer Portal → **General Information** → *Application ID*
- `GUILD_ID` — clic droit sur ton serveur → *Copier l'identifiant* (Mode développeur requis)
- `MONGODB_URI` — MongoDB Atlas → *Connect* → *Drivers*

⚠️ Ne partage **jamais** ton `.env` (il est ignoré par `.gitignore`).

### 3. Cartes d'exemple (une fois)
```bash
npm run seed
```

### 4. Enregistrer les commandes slash *(à refaire quand on ajoute/modifie une commande)*
```bash
npm run deploy
```

### 5. Lancer (rechargement auto)
```bash
npm run dev
```
Puis, dans Discord : `/ping`.

## 📜 Scripts
| Script | Rôle |
|---|---|
| `npm run dev` | Démarre le bot en local (auto-reload via `tsx`) |
| `npm run deploy` | Enregistre/actualise les commandes slash |
| `npm run seed` | Insère les cartes d'exemple |
| `npm run build` | Compile le TypeScript → `dist/` (JS) |
| `npm start` | Lance le JS compilé (`node dist/index.js`) — utilisé en production |
| `npm run typecheck` | Vérifie le typage sans compiler |

---

## ☁️ Hébergement (bot-hosting.net, 24/7)

Le bot tourne en production depuis le **JavaScript compilé** (`dist/`, versionné dans le dépôt),
lancé avec `node dist/index.js` — pas de `tsx` côté serveur (l'hébergeur bloque le postinstall
d'esbuild et manque de RAM pour compiler). Le serveur ne nécessite que 2 variables : `DISCORD_TOKEN`
et `MONGODB_URI`.

**Commande de démarrage** (bot-hosting → Startup) :
```bash
cd /home/container && git config --global --add safe.directory /home/container && git init -q && (git remote add origin https://github.com/orazyx220/ycc-bot.git 2>/dev/null || true) && git fetch origin main --depth 1 -q && git reset --hard origin/main -q && rm -rf node_modules && npm install --omit=dev --no-fund --no-audit && npm start
```

### 🔄 Mettre à jour le bot en ligne
1. `npm run build` — recompile `dist/`
2. `git add -A && git commit -m "…" && git push`
3. **Si tu as ajouté/modifié une commande** : `npm run deploy` (en local)
4. Sur bot-hosting → **Restart** (récupère le code et relance)

---

## 🗂️ Structure du projet
```
src/
├── index.ts                → point d'entrée + routeur d'interactions
├── deploy-commands.ts      → enregistre les commandes slash
├── types.ts                → contrat des commandes
├── config/                 → activity, drops, bump, rewards, booster, games, work, wheel, rarities, messages
├── database/
│   ├── connect.ts · seed.ts
│   └── models/             → User, Card, Transaction
├── services/               → purchase, booster, games, wheel, bump, cardGrant, trade, economy, autoDrop, messageReward
├── events/                 → messageEarn (gain par message), bumpDetect (bumps Disboard)
├── interactions/           → buyButton, giftButton
├── utils/                  → cardEmbed, dropMessage, pagination, imageUrl, time
└── commands/               → registry + toutes les commandes (voir tableau ci-dessus)
docs/index.html             → guide web (GitHub Pages)
GUIDE.md · GUIDE.pdf        → guide utilisateur
```
