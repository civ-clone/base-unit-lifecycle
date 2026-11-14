import { CityGrowthRegistry } from '@civ-clone/core-city-growth/CityGrowthRegistry';
import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TileImprovementRegistry } from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import City from '@civ-clone/core-city/City';
import Detonated from '@civ-clone/base-unit-action-nuclear-attack/Rules/Detonated';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
/**
 * Where `unit/detonated/halve-cities` runs among the `Detonated` rules: after the `Normal` ones (the units destroyed)
 * and before `Low` (the fallout), so a rule that takes its place runs there too.
 */
export declare const HALVE_CITIES_PRIORITY = 2500;
/** `city` loses half its size, rounded down, to `unit`'s detonation, so a city is never destroyed by it. */
export declare const halveCity: (
  city: City,
  unit: Unit,
  cityGrowthRegistry?: CityGrowthRegistry
) => void;
export interface DetonatedDependencies {
  cityGrowthRegistry?: CityGrowthRegistry;
  cityRegistry?: CityRegistry;
  engine?: Engine;
  randomNumberGenerator?: () => number;
  ruleRegistry?: RuleRegistry;
  tileImprovementRegistry?: TileImprovementRegistry;
  unitRegistry?: UnitRegistry;
}
export interface DetonatedOptions {
  sparesUnits: (city: City) => boolean;
  Pollution: new (tile: Tile, ruleRegistry: RuleRegistry) => TileImprovement;
  falloutChance: number;
}
/**
 * A ruleset's `Detonated` rules, with ids `<prefix>:unit/detonated/<name>` as civ1-unit's are, over the square a
 * nuclear weapon detonates over and the 8 around it: tell the client, destroy every unit (but those `sparesUnits`
 * keeps), halve every city, and fall out on the land.
 */
export declare const detonatedRules: (
  prefix: string,
  {
    cityGrowthRegistry,
    cityRegistry,
    engine,
    randomNumberGenerator,
    ruleRegistry,
    tileImprovementRegistry,
    unitRegistry,
  }: DetonatedDependencies,
  { sparesUnits, Pollution, falloutChance }: DetonatedOptions
) => Detonated[];
export default detonatedRules;
