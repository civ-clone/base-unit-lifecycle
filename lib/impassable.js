"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.impassable = exports.toPartnersLand = exports.fromLand = void 0;
// What a ruleset's `Impassable` rules ask, so that routes (a GoTo, a computer player's route) go round a treaty
//  partner's land and following one never breaks a treaty by accident.
// The step starts on land.
const fromLand = (unit, to, from) => from.isLand();
exports.fromLand = fromLand;
// `to` is a treaty partner's land: `partnerOf` is the ruleset's territory model.
const toPartnersLand = (partnerOf) => (unit, to) => partnerOf(unit, to) !== null;
exports.toPartnersLand = toPartnersLand;
// The tile is impassable.
const impassable = () => true;
exports.impassable = impassable;
//# sourceMappingURL=impassable.js.map