import { Collection } from 'discord.js';
import type { Command } from '../types';
import { ping } from './ping';
import { daily } from './daily';
import { solde } from './solde';
import { catalogue } from './catalogue';
import { carte } from './carte';
import { drop } from './drop';
import { inventaire } from './inventaire';
import { giveYumz } from './give_yumz';
import { reward } from './reward';
import { boutique } from './boutique';
import { reserve } from './reserve';
import { addcard } from './addcard';
import { editcard } from './editcard';
import { delcard } from './delcard';
import { givecard } from './givecard';
import { donner } from './donner';
import { echange } from './echange';
import { classement } from './classement';

/**
 * Liste centrale de toutes les commandes du bot.
 * Pour ajouter une commande plus tard : on l'importe puis on l'ajoute ici.
 * (C'est le seul endroit à modifier — pratique et sans surprise.)
 */
export const commands: Command[] = [
  ping,
  daily,
  solde,
  catalogue,
  carte,
  drop,
  inventaire,
  giveYumz,
  reward,
  boutique,
  reserve,
  addcard,
  editcard,
  delcard,
  givecard,
  donner,
  echange,
  classement,
];

/**
 * Même liste, mais indexée par nom pour retrouver instantanément
 * la bonne commande quand un membre l'utilise.
 */
export const commandsByName = new Collection<string, Command>(
  commands.map((command) => [command.data.name, command]),
);
