"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sleepAboardWith = exports.sleepAboard = void 0;
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Sleep_1 = require("@civ-clone/base-unit-action-sleep/Sleep");
// A unit that has just boarded a transport sleeps aboard it. Returns what `unit.action` returns. Its `Sleeping` looks
//  for enemies in core-unit's instance: a ruleset registers `sleepAboardWith` its game's own registries instead.
const sleepAboard = (unit) => unit.action(new Sleep_1.default(unit.tile(), unit.tile(), unit));
exports.sleepAboard = sleepAboard;
/**
 * `sleepAboard` for a game's own rule registry, turn and unit registry, so its `Sleeping` looks for enemies among that
 *  game's units (civ-clone/web-renderer#1110). Takes the unit alone, so it can be a `Stowed` rule's effect, which is
 *  given the unit and its transport.
 */
const sleepAboardWith = (ruleRegistry = RuleRegistry_1.instance, turn = Turn_1.instance, unitRegistry = UnitRegistry_1.instance) => (unit) => unit.action(new Sleep_1.default(unit.tile(), unit.tile(), unit, ruleRegistry, turn, unitRegistry));
exports.sleepAboardWith = sleepAboardWith;
//# sourceMappingURL=stowed.js.map