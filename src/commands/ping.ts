import { SlashCommandBuilder, type ChatInputCommandInteraction } from 'discord.js';
import type { Command } from '../types';

/**
 * /ping — la commande de test la plus simple.
 * Sert à vérifier que le bot reçoit bien les interactions et répond.
 */
export const ping: Command = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Vérifie que le bot répond bien.'),

  async execute(interaction: ChatInputCommandInteraction) {
    // interaction.client.ws.ping = latence (en ms) entre le bot et Discord.
    const latence = Math.max(interaction.client.ws.ping, 0);
    await interaction.reply(`🏓 Pong ! Latence du bot : ${latence} ms.`);
  },
};
