"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.diplomatRules = void 0;
const Engine_1 = require("@civ-clone/core-engine/Engine");
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Turn_1 = require("@civ-clone/core-turn-based-game/Turn");
const CityInvestigated_1 = require("@civ-clone/base-unit-action-investigate-city/Rules/CityInvestigated");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Embassy_1 = require("@civ-clone/base-unit-action-establish-embassy/Embassy");
const EmbassyEstablished_1 = require("@civ-clone/base-unit-action-establish-embassy/Rules/EmbassyEstablished");
const LeaderMet_1 = require("@civ-clone/base-unit-action-meet-with-leader/Rules/LeaderMet");
/**
 * A ruleset's rules for the diplomatic missions that need no numbers of its own, with ids `<prefix>:unit/<event>/<name>`
 * as civ1-unit's are: an embassy is a one-way record for the Diplomat's player; an investigation is the client's to
 * show; meeting a leader ends the Diplomat's turn and opens talks, which are the client's.
 */
const diplomatRules = (prefix, { engine = Engine_1.instance, interactionRegistry = InteractionRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, turn = Turn_1.instance, }) => ({
    embassyEstablished: [
        new EmbassyEstablished_1.default(`${prefix}:unit/embassy-established/register`, new Effect_1.default((unit, city) => {
            interactionRegistry.register(new Embassy_1.default(unit.player(), city.player(), ruleRegistry, turn));
            engine.emit('player:embassy-established', unit.player(), city.player());
            return true;
        })),
    ],
    cityInvestigated: [
        new CityInvestigated_1.default(`${prefix}:unit/city-investigated/emit`, new Effect_1.default((unit, city) => {
            engine.emit('city:investigated', city, unit.player());
            return true;
        })),
    ],
    leaderMet: [
        new LeaderMet_1.default(`${prefix}:unit/leader-met/meet`, new Effect_1.default((unit, player) => {
            unit.moves().set(0);
            engine.emit('player:meet-with-leader', unit.player(), player);
        })),
    ],
});
exports.diplomatRules = diplomatRules;
exports.default = exports.diplomatRules;
//# sourceMappingURL=diplomatRules.js.map