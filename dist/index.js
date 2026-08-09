"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const registry_1 = require("./commands/registry");
const connect_1 = require("./database/connect");
const buyButton_1 = require("./interactions/buyButton");
const giftButton_1 = require("./interactions/giftButton");
const messageEarn_1 = require("./events/messageEarn");
const autoDrop_1 = require("./services/autoDrop");
// --- 1) On vérifie que le token est bien présent AVANT de démarrer ---
const token = process.env.DISCORD_TOKEN;
if (!token || token === 'colle_ton_token_ici') {
    console.error('❌ DISCORD_TOKEN manquant ou non renseigné dans le fichier .env.');
    process.exit(1); // On arrête proprement plutôt que de crasher plus loin.
}
// --- 2) On crée le client (notre "bot") ---
// Intents = les catégories d'événements qu'on veut recevoir :
//   Guilds        → commandes slash & boutons
//   GuildMessages → savoir qu'un message est envoyé (économie par message)
//   MessageContent→ lire le contenu du message (longueur → bonus)
//   GuildMembers  → accéder aux rôles du membre (multiplicateurs)
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
        discord_js_1.GatewayIntentBits.GuildMembers,
    ],
});
// --- 3) Événement : le bot est connecté et prêt ---
client.once(discord_js_1.Events.ClientReady, (readyClient) => {
    console.log(`✅ Connecté en tant que ${readyClient.user.tag} !`);
    // On lance la boucle de drops automatiques (si le salon est configuré).
    (0, autoDrop_1.startAutoDrops)(readyClient);
});
// --- 3bis) Économie automatique : gains de Yumz à chaque message ---
client.on(discord_js_1.Events.MessageCreate, async (message) => {
    try {
        await (0, messageEarn_1.handleMessageForYumz)(message);
    }
    catch (error) {
        console.error('Erreur lors du gain de Yumz par message :', error);
    }
});
// --- 4) Événement : une interaction arrive (commande slash OU bouton) ---
client.on(discord_js_1.Events.InteractionCreate, async (interaction) => {
    // 4z) Autocomplétion (suggestions dynamiques d'une option, ex: /help)
    if (interaction.isAutocomplete()) {
        const command = registry_1.commandsByName.get(interaction.commandName);
        if (command?.autocomplete) {
            try {
                await command.autocomplete(interaction);
            }
            catch (error) {
                console.error(`Erreur autocomplétion /${interaction.commandName} :`, error);
            }
        }
        return;
    }
    // 4a) Boutons "Acheter" et "Récupérer" (drops). Les boutons de pagination
    // (◀ / ▶) et de boutique (shop_*) sont gérés par leurs propres collectors,
    // donc on les laisse passer ici.
    if (interaction.isButton()) {
        const isBuy = (0, buyButton_1.isBuyButton)(interaction.customId);
        const isGift = (0, giftButton_1.isGiftButton)(interaction.customId);
        if (!isBuy && !isGift)
            return;
        try {
            if (isBuy)
                await (0, buyButton_1.handleBuyButton)(interaction);
            else
                await (0, giftButton_1.handleGiftButton)(interaction);
        }
        catch (error) {
            console.error('Erreur lors d’un drop (achat/cadeau) :', error);
            const contenu = '⚠️ Une erreur est survenue.';
            if (interaction.deferred || interaction.replied) {
                await interaction.editReply({ content: contenu }).catch(() => { });
            }
            else {
                await interaction.reply({ content: contenu, flags: discord_js_1.MessageFlags.Ephemeral }).catch(() => { });
            }
        }
        return;
    }
    // 4b) Commandes slash
    if (!interaction.isChatInputCommand())
        return;
    const command = registry_1.commandsByName.get(interaction.commandName);
    if (!command)
        return; // Commande inconnue : on ignore silencieusement.
    try {
        await command.execute(interaction);
    }
    catch (error) {
        // Gestion d'erreurs : jamais de crash silencieux, on prévient le membre.
        console.error(`Erreur dans /${interaction.commandName} :`, error);
        const contenu = "⚠️ Oups, une erreur est survenue. Réessaie plus tard.";
        if (interaction.replied || interaction.deferred) {
            await interaction.followUp({ content: contenu, flags: discord_js_1.MessageFlags.Ephemeral });
        }
        else {
            await interaction.reply({ content: contenu, flags: discord_js_1.MessageFlags.Ephemeral });
        }
    }
});
// --- Garde-fous globaux : on log au lieu de crasher silencieusement ---
client.on(discord_js_1.Events.Error, (error) => console.error('Erreur client Discord :', error));
process.on('unhandledRejection', (reason) => console.error('Promesse rejetée non gérée :', reason));
process.on('uncaughtException', (error) => console.error('Exception non capturée :', error));
// --- 5) Démarrage : on connecte d'abord la base, PUIS Discord ---
async function main() {
    try {
        await (0, connect_1.connectDatabase)(); // Si la base échoue, on n'ira pas plus loin.
        await client.login(token);
    }
    catch (error) {
        console.error('❌ Démarrage impossible :', error);
        process.exit(1);
    }
}
main();
