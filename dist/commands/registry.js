"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commandsByName = exports.commands = void 0;
const discord_js_1 = require("discord.js");
const ping_1 = require("./ping");
const help_1 = require("./help");
const daily_1 = require("./daily");
const solde_1 = require("./solde");
const catalogue_1 = require("./catalogue");
const carte_1 = require("./carte");
const drop_1 = require("./drop");
const inventaire_1 = require("./inventaire");
const give_yumz_1 = require("./give_yumz");
const reward_1 = require("./reward");
const boutique_1 = require("./boutique");
const reserve_1 = require("./reserve");
const addcard_1 = require("./addcard");
const editcard_1 = require("./editcard");
const delcard_1 = require("./delcard");
const givecard_1 = require("./givecard");
const donner_1 = require("./donner");
const echange_1 = require("./echange");
const classement_1 = require("./classement");
/**
 * Liste centrale de toutes les commandes du bot.
 * Pour ajouter une commande plus tard : on l'importe puis on l'ajoute ici.
 * (C'est le seul endroit à modifier — pratique et sans surprise.)
 */
exports.commands = [
    ping_1.ping,
    help_1.help,
    daily_1.daily,
    solde_1.solde,
    catalogue_1.catalogue,
    carte_1.carte,
    drop_1.drop,
    inventaire_1.inventaire,
    give_yumz_1.giveYumz,
    reward_1.reward,
    boutique_1.boutique,
    reserve_1.reserve,
    addcard_1.addcard,
    editcard_1.editcard,
    delcard_1.delcard,
    givecard_1.givecard,
    donner_1.donner,
    echange_1.echange,
    classement_1.classement,
];
/**
 * Même liste, mais indexée par nom pour retrouver instantanément
 * la bonne commande quand un membre l'utilise.
 */
exports.commandsByName = new discord_js_1.Collection(exports.commands.map((command) => [command.data.name, command]));
