"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ping = void 0;
const discord_js_1 = require("discord.js");
/**
 * /ping — la commande de test la plus simple.
 * Sert à vérifier que le bot reçoit bien les interactions et répond.
 */
exports.ping = {
    data: new discord_js_1.SlashCommandBuilder()
        .setName('ping')
        .setDescription('Vérifie que le bot répond bien.'),
    async execute(interaction) {
        // interaction.client.ws.ping = latence (en ms) entre le bot et Discord.
        const latence = Math.max(interaction.client.ws.ping, 0);
        await interaction.reply(`🏓 Pong ! Latence du bot : ${latence} ms.`);
    },
};
