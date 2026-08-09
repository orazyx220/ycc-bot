import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';

/**
 * Contrat commun à toutes nos commandes slash.
 * - `data` : la "définition" de la commande (nom, description, options)
 *   qu'on enverra à Discord.
 * - `execute` : la fonction appelée quand un membre utilise la commande.
 *
 * Typer les commandes ainsi garantit que chaque fichier de commande
 * a bien la même forme — le compilateur nous avertit si on oublie un morceau.
 */
export interface Command {
  data:
    | SlashCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  /** Optionnel : réponses d'autocomplétion (liste dynamique selon l'utilisateur). */
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}
