"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detonatedRules = exports.halveCity = exports.HALVE_CITIES_PRIORITY = void 0;
const CityGrowthRegistry_1 = require("@civ-clone/core-city-growth/CityGrowthRegistry");
const CityRegistry_1 = require("@civ-clone/core-city/CityRegistry");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const TileImprovementRegistry_1 = require("@civ-clone/core-tile-improvement/TileImprovementRegistry");
const UnitRegistry_1 = require("@civ-clone/core-unit/UnitRegistry");
const Destroyed_1 = require("@civ-clone/core-unit/Rules/Destroyed");
const Detonated_1 = require("@civ-clone/base-unit-action-nuclear-attack/Rules/Detonated");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const High_1 = require("@civ-clone/core-rule/Priorities/High");
const Low_1 = require("@civ-clone/core-rule/Priorities/Low");
const Priority_1 = require("@civ-clone/core-rule/Priority");
const core_random_1 = require("@civ-clone/core-random");
/**
 * Where `unit/detonated/halve-cities` runs among the `Detonated` rules: after the `Normal` ones (the units destroyed)
 * and before `Low` (the fallout), so a rule that takes its place runs there too.
 */
exports.HALVE_CITIES_PRIORITY = 2500;
/** `city` loses half its size, rounded down, to `unit`'s detonation, so a city is never destroyed by it. */
const halveCity = (city, unit, cityGrowthRegistry = CityGrowthRegistry_1.instance) => {
    const cityGrowth = cityGrowthRegistry.getByCity(city), loss = Math.floor(cityGrowth.size() / 2);
    for (let i = 0; i < loss; i++) {
        cityGrowth.shrink(unit);
    }
};
exports.halveCity = halveCity;
/**
 * A ruleset's `Detonated` rules, with ids `<prefix>:unit/detonated/<name>` as civ1-unit's are, over the square a
 * nuclear weapon detonates over and the 8 around it: tell the client, destroy every unit (but those `sparesUnits`
 * keeps), halve every city, and fall out on the land.
 */
const detonatedRules = (prefix, { cityGrowthRegistry = CityGrowthRegistry_1.instance, cityRegistry = CityRegistry_1.instance, engine = Engine_1.instance, randomNumberGenerator = core_random_1.instance, ruleRegistry = RuleRegistry_1.instance, tileImprovementRegistry = TileImprovementRegistry_1.instance, unitRegistry = UnitRegistry_1.instance, }, { sparesUnits, Pollution, falloutChance }) => {
    const id = (name) => `${prefix}:unit/detonated/${name}`, area = (tile) => [tile, ...tile.getNeighbours()];
    return [
        new Detonated_1.default(
        // Before anything changes, so a client can see what's there to be hit.
        id('emit'), new High_1.default(), new Effect_1.default((unit, tile) => {
            engine.emit('unit:nuclear-detonation', unit, tile);
        })),
        new Detonated_1.default(id('destroy-units'), new Effect_1.default((unit, tile) => area(tile).forEach((areaTile) => {
            const city = cityRegistry.getByTile(areaTile);
            if (city !== null && sparesUnits(city)) {
                engine.emit('city:sdi-protected', city, unit);
                return;
            }
            unitRegistry.getByTile(areaTile).forEach((areaUnit) => {
                // Cargo is destroyed with its transport, earlier in this loop, if the transport is lost at sea.
                if (areaUnit.destroyed()) {
                    return;
                }
                ruleRegistry.process(Destroyed_1.default, areaUnit, unit.player());
            });
        }))),
        new Detonated_1.default(id('halve-cities'), new Priority_1.default(exports.HALVE_CITIES_PRIORITY), new Effect_1.default((unit, tile) => area(tile).forEach((areaTile) => {
            const city = cityRegistry.getByTile(areaTile);
            if (city === null) {
                return;
            }
            (0, exports.halveCity)(city, unit, cityGrowthRegistry);
        }))),
        new Detonated_1.default(id('fallout'), new Low_1.default(), new Effect_1.default((unit, tile) => area(tile)
            .filter((areaTile) => areaTile.isLand() &&
            cityRegistry.getByTile(areaTile) === null &&
            !tileImprovementRegistry
                .getByTile(areaTile)
                .some((improvement) => improvement instanceof Pollution))
            .forEach((areaTile) => {
            if (randomNumberGenerator() >= falloutChance) {
                return;
            }
            // Building it processes `Built`, which puts it on the tile.
            new Pollution(areaTile, ruleRegistry);
        }))),
    ];
};
exports.detonatedRules = detonatedRules;
exports.default = exports.detonatedRules;
//# sourceMappingURL=detonatedRules.js.map