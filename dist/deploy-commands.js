"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const discord_js_1 = require("discord.js");
const registry_1 = require("./commands/registry");
/**
 * Ce script ENREGISTRE nos commandes slash auprès de Discord.
 * À lancer avec :  npm run deploy
 *
 * Pourquoi un script séparé ?
 * On n'a pas besoin d'enregistrer les commandes à chaque démarrage du bot :
 * seulement quand on en ajoute/modifie une. On les enregistre au niveau du
 * SERVEUR (guild) car c'est INSTANTANÉ (les commandes "globales" peuvent
 * mettre jusqu'à 1h à apparaître).
 */
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
if (!token || token === 'colle_ton_token_ici' ||
    !clientId || clientId === 'colle_ton_application_id_ici' ||
    !guildId || guildId === 'colle_l_id_de_ton_serveur_ici') {
    console.error('❌ DISCORD_TOKEN, CLIENT_ID ou GUILD_ID manquant/non renseigné dans .env.');
    process.exit(1);
}
const rest = new discord_js_1.REST().setToken(token);
// On transforme chaque commande en format JSON attendu par Discord.
const body = registry_1.commands.map((command) => command.data.toJSON());
async function main() {
    try {
        console.log(`⏳ Enregistrement de ${body.length} commande(s) sur le serveur...`);
        await rest.put(discord_js_1.Routes.applicationGuildCommands(clientId, guildId), { body });
        console.log('✅ Commandes enregistrées ! Elles sont dispo immédiatement sur ton serveur.');
    }
    catch (error) {
        console.error('❌ Échec de l’enregistrement des commandes :', error);
        process.exit(1);
    }
}
main();
