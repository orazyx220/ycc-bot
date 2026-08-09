# 🎴 Guide du bot YCC

Bienvenue sur **YCC**, le bot de **collection de cartes** et d'**économie Yumz** de ton serveur !
Gagne des **Yumz** (la monnaie du serveur) en étant actif, dépense-les pour **collectionner des cartes** de différentes raretés, joue à des **mini-jeux**, échange avec les autres membres, et tente ta chance à la **roue de la fortune** !

---

## 🪙 C'est quoi les Yumz ?

Les **Yumz** sont la monnaie virtuelle du serveur. Tu t'en sers pour **acheter des cartes**, **ouvrir des boosters** et **parier** dans les mini-jeux.

### Comment en gagner ?

| Source | Gain | Détail |
|---|---|---|
| 💬 **Écrire des messages** | 25–35 Yumz | Automatique ! Cooldown de 30 s entre deux gains |
| 📏 **Messages longs** | jusqu'à 100 | Un long message rapporte plus (plafond 100/message) |
| ✨ **Salons & rôles bonus** | ×1,5 à ×3 | Certains salons/rôles multiplient tes gains (voir plus bas) |
| 🎁 **`/daily`** | 550 + streak | +10 par jour consécutif, jusqu'à 1000/jour |
| 💼 **`/travailler`** | 50–150 | Toutes les heures |
| 🎡 **`/roue`** | variable | Une fois par semaine, gros lots rares |
| 📈 **Bump du serveur** | 500 | Automatique quand tu fais `/bump` (max 3/jour) |

### ✨ Les multiplicateurs de messages
Quand tu écris dans certains salons ou avec certains rôles, tes gains sont multipliés :
- **Rôle Server Booster** : ×2
- **Rôle Anniversaire** : ×3
- **Salon général** : ×2,5 · **Gaming / Média / Animaux / Lecture** : ×2 · **Art / Nature / Recette / Cuisine / Haut achat** : ×1,5

> On garde **le meilleur rôle × le salon**. Le bonus de longueur, lui, n'est pas multiplié (anti-abus). Total plafonné à **100/message**.

### 🔥 Le streak de `/daily`
- Base : **550 Yumz**
- **+10** par jour consécutif (jour 2 = 560, jour 3 = 570…)
- Plafonné à **1000/jour**
- ⚠️ Si tu rates un jour, ton streak repart à **0** !

---

## 🎴 Les cartes

Chaque carte a une **rareté** (qui définit sa couleur) :

| Rareté | Couleur |
|---|---|
| Commune | Gris |
| Rare | Bleu |
| Épique | Violet |
| Légendaire | Or (jaune) |
| Mystère | Turquoise |
| Evil | Rouge sombre |

### Comment obtenir des cartes ?
- 🛒 **`/boutique`** — achète directement la carte que tu veux avec tes Yumz.
- 🎴 **`/ouvrir`** — ouvre un booster (1000 Yumz) et tire une carte **au hasard** selon les probabilités de rareté.
- 🎁 **Drops** — le bot fait tomber des cartes dans un salon (à acheter ou gratuites, premier arrivé premier servi).
- 🤝 **`/donner`** / **`/echange`** — reçois des cartes d'autres membres.
- 🎡 **`/roue`** — une carte fait partie des lots possibles.

### 🎴 Probabilités d'un booster (`/ouvrir`)
Commune 55% · Rare 28% · Épique 12% · Légendaire 4% · Mystère 0,9% · Evil 0,1%
*(Les tirages ne consomment pas le stock : tu peux tomber plusieurs fois sur la même carte.)*

---

## 📜 Toutes les commandes

> Astuce : dans Discord, tape `/help commande:<nom>` pour la fiche détaillée d'une commande.

### 👤 Commandes pour tout le monde

| Commande | Description | Exemple |
|---|---|---|
| `/help` | Affiche l'aide (ou le détail d'une commande) | `/help commande:daily` |
| `/ping` | Vérifie que le bot répond | `/ping` |
| `/daily` | Réclame tes Yumz du jour (avec bonus de streak) | `/daily` |
| `/travailler` | Gagne quelques Yumz (toutes les heures) | `/travailler` |
| `/solde` | Voir ton solde (ou celui d'un membre) | `/solde membre:@Ami` |
| `/classement` | Top des membres les plus riches | `/classement` |
| `/catalogue` | Feuillette toutes les cartes existantes | `/catalogue` |
| `/carte` | Détail d'une carte précise | `/carte id:dragon-epique` |
| `/boutique` | Achète directement des cartes | `/boutique` |
| `/ouvrir` | Ouvre un booster (carte aléatoire) | `/ouvrir` |
| `/inventaire` | Voir tes cartes (ou celles d'un membre) | `/inventaire membre:@Ami` |
| `/donner` | Offre une de tes cartes à un membre | `/donner membre:@Ami id:yumz-bleu` |
| `/echange` | Propose un troc de cartes et/ou Yumz | `/echange membre:@Ami ma_carte:yumz-bleu sa_carte:carte-neon` |
| `/parier` | Mini-jeux de pari | `/parier machine mise:100` |
| `/roue` | Roue de la fortune (1×/semaine) | `/roue` |

### 🛡️ Commandes administrateur

| Commande | Description | Exemple |
|---|---|---|
| `/drop` | Poste une carte à acheter/gagner | `/drop id:ycc-originel` |
| `/give_yumz` | Donne ou retire des Yumz à un membre | `/give_yumz membre:@Ami montant:1000` |
| `/give_all` | Donne des Yumz à **tous** les membres | `/give_all montant:10000` |
| `/reward` | Récompense du barème (bump/boost/voice/level) | `/reward level membre:@Ami niveau:50` |
| `/addcard` | Crée une nouvelle carte | `/addcard nom:… rarete:… description:… lien_image:…` |
| `/editcard` | Modifie une carte existante | `/editcard id:dragon-epique prix:3000` |
| `/delcard` | Supprime une carte | `/delcard id:dragon-epique` |
| `/givecard` | Offre une carte à un membre | `/givecard membre:@Ami id:dragon-epique` |
| `/reserve` | Gère la réserve des drops automatiques | `/reserve list` |
| `/reset` | Remet à zéro l'économie (⚠️ irréversible) | `/reset cible:tout` |

---

## 🎲 Les mini-jeux (`/parier`)

Mise tes Yumz et tente ta chance ! Mise entre **10** et **10 000** Yumz.

### 🪙 Pile ou face — `/parier pileouface mise:<X> choix:<pile|face>`
50/50. Si tu gagnes, tu **doubles ta mise** ; sinon tu la perds.

### 🎲 Dés — `/parier des mise:<X>`
Ton dé contre celui du bot. Le plus haut gagne (double la mise), égalité = mise remboursée.

### 🎰 Machine à sous — `/parier machine mise:<X>`
Trois symboles sont tirés parmi 5 : **cerise 🍒, citron 🍋, cloche 🔔, étoile ⭐, diamant 💎**.
- **3 identiques = JACKPOT** → gain net = **mise × multiplicateur** du symbole (cerise ×3, citron ×4, cloche ×5, étoile ×8, diamant ×15)
- **2 identiques** → mise **remboursée** (±0)
- **Tout différent** → mise perdue

---

## 🎡 La roue de la fortune (`/roue`)

**Gratuite, une fois par semaine.** Style loterie : petites sommes fréquentes, gros lots très rares.

| Lot | Chance |
|---|---|
| 🎯 Rien | 25% |
| 🪙 10 Yumz | 25% |
| 💵 100 Yumz | 20% |
| 💶 500 Yumz | 12% |
| 🎴 Une carte | 8% |
| 🎁 Tour gratuit (relance) | 4% |
| 💰 5 000 Yumz | 4% |
| 💎 50 000 Yumz | 1,5% |
| 🏆 100 000 Yumz | 0,5% |

---

## 🤝 Échanger avec les autres

- **`/donner membre:@X id:carte`** — donne une de tes cartes à quelqu'un (sens unique, gratuit).
- **`/echange membre:@X ...`** — propose un vrai troc : tu offres des cartes et/ou des Yumz, tu demandes des cartes et/ou des Yumz. L'échange ne se fait **que si l'autre accepte** (bouton). Tout est revérifié au moment de l'acceptation.

---

## ❓ Questions fréquentes

**Je ne gagne pas de Yumz en écrivant ?**
Il y a un cooldown de **30 secondes** entre deux gains. Écris, attends 30 s, réécris.

**Pourquoi je ne peux pas refaire `/daily` ?**
Il est utilisable **une fois toutes les 24 h**. Le bot t'indique le temps restant.

**J'ai raté un jour de `/daily`, j'ai perdu mon bonus ?**
Oui, le streak repart à 0 — mais tu regagnes +10 par jour en recommençant.

**La roue dit que je dois attendre ?**
Elle est **hebdomadaire** (1×/semaine).

---

🎴 **Bonne collection sur YCC !** Pour toute question, demande à un administrateur du serveur.
