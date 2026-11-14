import {
  CityGrowthRegistry,
  instance as cityGrowthRegistryInstance,
} from '@civ-clone/core-city-growth/CityGrowthRegistry';
import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TileImprovementRegistry,
  instance as tileImprovementRegistryInstance,
} from '@civ-clone/core-tile-improvement/TileImprovementRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import City from '@civ-clone/core-city/City';
import Destroyed from '@civ-clone/core-unit/Rules/Destroyed';
import Detonated from '@civ-clone/base-unit-action-nuclear-attack/Rules/Detonated';
import Effect from '@civ-clone/core-rule/Effect';
import High from '@civ-clone/core-rule/Priorities/High';
import Low from '@civ-clone/core-rule/Priorities/Low';
import Priority from '@civ-clone/core-rule/Priority';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import { instance as rngInstance } from '@civ-clone/core-random';

/**
 * Where `unit/detonated/halve-cities` runs among the `Detonated` rules: after the `Normal` ones (the units destroyed)
 * and before `Low` (the fallout), so a rule that takes its place runs there too.
 */
export const HALVE_CITIES_PRIORITY = 2500;

/** `city` loses half its size, rounded down, to `unit`'s detonation, so a city is never destroyed by it. */
export const halveCity = (
  city: City,
  unit: Unit,
  cityGrowthRegistry: CityGrowthRegistry = cityGrowthRegistryInstance
): void => {
  const cityGrowth = cityGrowthRegistry.getByCity(city),
    loss = Math.floor(cityGrowth.size() / 2);

  for (let i = 0; i < loss; i++) {
    cityGrowth.shrink(unit);
  }
};

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
  // Whether the units in `city` are spared (Civ1's SDI Defense: the city is still halved and the land falls out).
  sparesUnits: (city: City) => boolean;
  // Whether nothing happens at all over `tile` (Civ2's SDI Defense stops the whole attack). Without it, every
  //  detonation goes off. Asked once per rule, by the destroy, halve and fallout rules; the client is told either way.
  vetoes?: (unit: Unit, tile: Tile) => boolean;
  // The fallout a detonation leaves on land.
  Pollution: new (tile: Tile, ruleRegistry: RuleRegistry) => TileImprovement;
  // The chance each land square in the area without a city or fallout gets some.
  falloutChance: number;
}

/**
 * A ruleset's `Detonated` rules, with ids `<prefix>:unit/detonated/<name>` as civ1-unit's are, over the square a
 * nuclear weapon detonates over and the 8 around it: tell the client, destroy every unit (but those `sparesUnits`
 * keeps), halve every city, and fall out on the land.
 */
export const detonatedRules = (
  prefix: string,
  {
    cityGrowthRegistry = cityGrowthRegistryInstance,
    cityRegistry = cityRegistryInstance,
    engine = engineInstance,
    randomNumberGenerator = rngInstance,
    ruleRegistry = ruleRegistryInstance,
    tileImprovementRegistry = tileImprovementRegistryInstance,
    unitRegistry = unitRegistryInstance,
  }: DetonatedDependencies,
  { sparesUnits, Pollution, falloutChance, vetoes }: DetonatedOptions
): Detonated[] => {
  const id = (name: string): string => `${prefix}:unit/detonated/${name}`,
    area = (tile: Tile): Tile[] => [tile, ...tile.getNeighbours()],
    stopped = (unit: Unit, tile: Tile): boolean =>
      vetoes !== undefined && vetoes(unit, tile);

  return [
    new Detonated(
      // Before anything changes, so a client can see what's there to be hit.
      id('emit'),
      new High(),
      new Effect((unit: Unit, tile: Tile): void => {
        engine.emit('unit:nuclear-detonation', unit, tile);
      })
    ),

    new Detonated(
      id('destroy-units'),
      new Effect((unit: Unit, tile: Tile): void =>
        stopped(unit, tile)
          ? undefined
          : area(tile).forEach((areaTile: Tile): void => {
              const city = cityRegistry.getByTile(areaTile);

              if (city !== null && sparesUnits(city)) {
                engine.emit('city:sdi-protected', city, unit);

                return;
              }

              unitRegistry
                .getByTile(areaTile)
                .forEach((areaUnit: Unit): void => {
                  // Cargo is destroyed with its transport, earlier in this loop, if the transport is lost at sea.
                  if (areaUnit.destroyed()) {
                    return;
                  }

                  ruleRegistry.process(Destroyed, areaUnit, unit.player());
                });
            })
      )
    ),

    new Detonated(
      id('halve-cities'),
      new Priority(HALVE_CITIES_PRIORITY),
      new Effect((unit: Unit, tile: Tile): void =>
        stopped(unit, tile)
          ? undefined
          : area(tile).forEach((areaTile: Tile): void => {
              const city = cityRegistry.getByTile(areaTile);

              if (city === null) {
                return;
              }

              halveCity(city, unit, cityGrowthRegistry);
            })
      )
    ),

    new Detonated(
      id('fallout'),
      new Low(),
      new Effect((unit: Unit, tile: Tile): void =>
        stopped(unit, tile)
          ? undefined
          : area(tile)
              .filter(
                (areaTile: Tile): boolean =>
                  areaTile.isLand() &&
                  cityRegistry.getByTile(areaTile) === null &&
                  !tileImprovementRegistry
                    .getByTile(areaTile)
                    .some(
                      (improvement: TileImprovement): boolean =>
                        improvement instanceof Pollution
                    )
              )
              .forEach((areaTile: Tile): void => {
                if (randomNumberGenerator() >= falloutChance) {
                  return;
                }

                // Building it processes `Built`, which puts it on the tile.
                new Pollution(areaTile, ruleRegistry);
              })
      )
    ),
  ];
};

export default detonatedRules;
