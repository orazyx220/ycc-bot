import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ComponentType,
  MessageFlags,
  type ChatInputCommandInteraction,
  type EmbedBuilder,
} from 'discord.js';

/**
 * Affiche une liste d'Embeds "page par page", avec des boutons ◀ / ▶.
 * Réutilisable (ex: /inventaire). Seul l'auteur peut naviguer ; les boutons
 * sont désactivés après `timeoutMs` d'inactivité.
 */
export async function paginateEmbeds(
  interaction: ChatInputCommandInteraction,
  pages: EmbedBuilder[],
  { timeoutMs = 120_000 }: { timeoutMs?: number } = {},
): Promise<void> {
  if (pages.length <= 1) {
    await interaction.reply({ embeds: pages.length === 1 ? [pages[0]!] : [] });
    return;
  }

  let index = 0;
  const total = pages.length;

  const buildRow = (frozen: boolean) =>
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId('page_prev')
        .setLabel('◀ Précédent')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(frozen || index === 0),
      new ButtonBuilder()
        .setCustomId('page_next')
        .setLabel('Suivant ▶')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(frozen || index === total - 1),
    );

  await interaction.reply({ embeds: [pages[index]!], components: [buildRow(false)] });
  const message = await interaction.fetchReply();

  const collector = message.createMessageComponentCollector({
    componentType: ComponentType.Button,
    time: timeoutMs,
  });

  collector.on('collect', async (button) => {
    if (button.user.id !== interaction.user.id) {
      await button.reply({
        content: 'Ces boutons ne sont pas pour toi 🙂 Lance la commande toi-même !',
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    if (button.customId === 'page_prev') index = Math.max(0, index - 1);
    else if (button.customId === 'page_next') index = Math.min(total - 1, index + 1);

    await button.update({ embeds: [pages[index]!], components: [buildRow(false)] });
  });

  collector.on('end', async () => {
    await message.edit({ components: [buildRow(true)] }).catch(() => {});
  });
}
