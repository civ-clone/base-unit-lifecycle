"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.treatyPartner = void 0;
const InteractionRegistry_1 = require("@civ-clone/core-diplomacy/InteractionRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const WorkedTileRegistry_1 = require("@civ-clone/core-city/WorkedTileRegistry");
const Land_1 = require("@civ-clone/base-unit-type-land/Land");
const NonCombatant_1 = require("@civ-clone/base-unit-trait-non-combatant/NonCombatant");
const Declarations_1 = require("@civ-clone/library-diplomacy/Declarations");
const traits_1 = require("@civ-clone/core-unit/traits");
/**
 * Whose land a tile is, among a unit's treaty partners, or `null`: a tile that one of the partner's cities is working
 * and that has one of `improvements` on it, for a land unit that isn't a `NonCombatant`. Moving onto or pillaging such
 * a tile breaks the treaty. A tile counts as land while it's worked (Civ1's territory model, simplified).
 */
const treatyPartner = (improvements, { interactionRegistry = InteractionRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, workedTileRegistry = WorkedTileRegistry_1.instance, } = {}) => (unit, tile) => {
    if (!(0, traits_1.isA)(unit, Land_1.default) || unit.hasTrait(NonCombatant_1.default)) {
        return null;
    }
    const workedTile = workedTileRegistry.getByTile(tile);
    if (workedTile === null) {
        return null;
    }
    const partner = workedTile.city().player();
    if (partner === unit.player() ||
        !interactionRegistry
            .getByPlayers(unit.player(), partner)
            .some((interaction) => interaction instanceof Declarations_1.Peace && interaction.active()) ||
        !tileImprovementRegistry
            .getByTile(tile)
            .some((improvement) => improvements.some((Improvement) => improvement instanceof Improvement))) {
        return null;
    }
    return partner;
};
exports.treatyPartner = treatyPartner;
exports.default = exports.treatyPartner;
//# sourceMappingURL=treatyPartner.js.map