import { Collection } from 'discord.js';
import type { Command } from '../types';
import { ping } from './ping';
import { help } from './help';
import { daily } from './daily';
import { solde } from './solde';
import { catalogue } from './catalogue';
import { carte } from './carte';
import { drop } from './drop';
import { inventaire } from './inventaire';
import { giveYumz } from './give_yumz';
import { giveAll } from './give_all';
import { reset } from './reset';
import { reward } from './reward';
import { boutique } from './boutique';
import { ouvrir } from './ouvrir';
import { parier } from './parier';
import { travailler } from './travailler';
import { roue } from './roue';
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
  help,
  daily,
  solde,
  catalogue,
  carte,
  drop,
  inventaire,
  giveYumz,
  giveAll,
  reset,
  reward,
  boutique,
  ouvrir,
  parier,
  travailler,
  roue,
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
