import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDatabase } from './connect';
import { Card } from './models/Card';

/**
 * Script de "seed" : insère quelques cartes d'exemple pour pouvoir tester.
 * À lancer avec :  npm run seed
 *
 * On utilise `$setOnInsert` + `upsert` : si une carte existe déjà (même cardId),
 * on ne l'écrase PAS (on ne remet pas son stock à neuf). Relancer le seed est
 * donc sans danger.
 */
const SAMPLE_CARDS = [
  {
    cardId: 'yumz-bleu',
    name: 'Yumz Bleu',
    rarity: 'common',
    price: 300,
    imageUrl: 'https://placehold.co/400x560/95a5a6/FFFFFF.png?text=Yumz+Bleu',
    maxSupply: 100,
    remainingSupply: 100,
  },
  {
    cardId: 'carte-neon',
    name: 'Carte Néon',
    rarity: 'rare',
    price: 800,
    imageUrl: 'https://placehold.co/400x560/3498db/FFFFFF.png?text=Carte+Neon',
    maxSupply: 50,
    remainingSupply: 50,
  },
  {
    cardId: 'dragon-epique',
    name: 'Dragon Épique',
    rarity: 'epic',
    price: 2000,
    imageUrl: 'https://placehold.co/400x560/9b59b6/FFFFFF.png?text=Dragon+Epique',
    maxSupply: 10,
    remainingSupply: 10,
  },
  {
    cardId: 'ycc-originel',
    name: 'YCC Originel',
    rarity: 'legendary',
    price: 8000,
    imageUrl: 'https://placehold.co/400x560/f1c40f/000000.png?text=YCC+Originel',
    maxSupply: 1, // ⚠️ carte UNIQUE : un seul exemplaire au monde
    remainingSupply: 1,
  },
  {
    // Carte spéciale en réserve : apparaît seulement lors d'un drop AUTO, gratuite.
    cardId: 'carte-mystere',
    name: 'Carte Mystère',
    rarity: 'mystere',
    price: 3000,
    imageUrl: 'https://placehold.co/400x560/1abc9c/FFFFFF.png?text=Mystere',
    maxSupply: 5,
    remainingSupply: 5,
    autoDrop: true,
    dropMode: 'gift',
  },
  {
    // Carte spéciale en réserve : apparaît lors d'un drop AUTO, à acheter.
    cardId: 'evil-yumz',
    name: 'Evil Yumz',
    rarity: 'evil',
    price: 6000,
    imageUrl: 'https://placehold.co/400x560/c0392b/FFFFFF.png?text=Evil+Yumz',
    maxSupply: 3,
    remainingSupply: 3,
    autoDrop: true,
    dropMode: 'buy',
  },
] as const;

async function main() {
  await connectDatabase();

  for (const card of SAMPLE_CARDS) {
    await Card.updateOne(
      { cardId: card.cardId },
      { $setOnInsert: card },
      { upsert: true },
    );
    console.log(`  • ${card.name} (${card.cardId}) prêt.`);
  }

  console.log('✅ Seed terminé.');
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Erreur pendant le seed :', error);
  process.exit(1);
});
