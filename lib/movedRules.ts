import {
  CityRegistry,
  instance as cityRegistryInstance,
} from '@civ-clone/core-city/CityRegistry';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  InteractionRegistry,
  instance as interactionRegistryInstance,
} from '@civ-clone/core-diplomacy/InteractionRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  TransportRegistry,
  instance as transportRegistryInstance,
} from '@civ-clone/core-unit-transport/TransportRegistry';
import {
  UnitRegistry,
  instance as unitRegistryInstance,
} from '@civ-clone/core-unit/UnitRegistry';
import { Peace, Vendetta } from '@civ-clone/library-diplomacy/Declarations';
import Action from '@civ-clone/core-unit/Action';
import Air from '@civ-clone/base-unit-type-air/Air';
import AttackEndsTurn from '@civ-clone/base-unit-trait-attack-ends-turn/AttackEndsTurn';
import CoastBound from '@civ-clone/base-unit-trait-coast-bound/CoastBound';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import High from '@civ-clone/core-rule/Priorities/High';
import { ITransport } from '@civ-clone/core-unit-transport/Transport';
import LostAtSea from '@civ-clone/core-unit-transport/Rules/LostAtSea';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import NavalTransport from '@civ-clone/base-unit-type-naval-transport/NavalTransport';
import Never from '@civ-clone/core-diplomacy/Expiries/Never';
import Player from '@civ-clone/core-player/Player';
import Sleeping from '@civ-clone/base-unit-action-sleep/Rules/Sleeping';
import Stowed from '@civ-clone/base-unit-action-embark/Busy/Stowed';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import { hasVendetta } from '@civ-clone/library-diplomacy/lib/holds';
import { instance as rngInstance } from '@civ-clone/core-random';

type ActionType = abstract new (...args: any[]) => Action;

export interface MovedDependencies {
  cityRegistry?: CityRegistry;
  engine?: Engine;
  interactionRegistry?: InteractionRegistry;
  randomNumberGenerator?: () => number;
  ruleRegistry?: RuleRegistry;
  transportRegistry?: TransportRegistry;
  unitRegistry?: UnitRegistry;
}

export interface MovedOptions {
  // The ruleset's own action classes: a plain move, leaving a transport, and the attacks.
  Move: ActionType;
  Disembark: ActionType;
  attacks: ActionType[];
  // Actions with an enemy that end a peace treaty without a grudge (walking onto, or pillaging, the partner's land).
  noVendetta: ActionType[];
  // The chance a `CoastBound` unit that ends its move out of sight of land is lost.
  coastBoundLoss: number;
}

/**
 * A ruleset's `Moved` rules, in order, with ids `<prefix>:unit/moved/<name>` as civ1-unit's are: telling the client,
 * vision, ending a unit's moves, transports carrying and collecting their cargo, leaving a transport, a `CoastBound`
 * unit lost at sea, an `AttackEndsTurn` unit's turn ending, and a broken peace treaty.
 */
export const movedRules = (
  prefix: string,
  {
    cityRegistry = cityRegistryInstance,
    engine = engineInstance,
    interactionRegistry = interactionRegistryInstance,
    randomNumberGenerator = rngInstance,
    ruleRegistry = ruleRegistryInstance,
    transportRegistry = transportRegistryInstance,
    unitRegistry = unitRegistryInstance,
  }: MovedDependencies,
  { Move, Disembark, attacks, noVendetta, coastBoundLoss }: MovedOptions
): Moved[] => {
  const id = (name: string): string => `${prefix}:unit/moved/${name}`,
    // Stows each of `units` aboard `transport`, as `Embark` and `LandAircraft` do, until it is full.
    collect = (transport: NavalTransport, units: Unit[]): void =>
      units.forEach((unit: Unit): void => {
        if (!transport.hasCapacity() || !transport.canStow(unit)) {
          return;
        }

        transport.stow(unit, unit.tile());

        unit.setBusy(new Stowed());
      }),
    // The transport's own units on the tile it has just moved onto, that aren't already aboard something.
    unitsToCollect = (transport: Unit, tile: Tile = transport.tile()): Unit[] =>
      unitRegistry
        .getByTile(tile)
        .filter(
          (unit: Unit): boolean =>
            unit !== transport &&
            unit.player() === transport.player() &&
            !transportRegistry.hasUnit(unit)
        ),
    // A transport's own move that took it onto a new tile (not one it was carried along on, and not an attack).
    transportMoved = [
      new Criterion((unit: Unit): boolean => unit instanceof NavalTransport),
      new Criterion(
        (unit: Unit, action: Action): boolean => action instanceof Move
      ),
      new Criterion(
        (unit: Unit, action: Action): boolean => action.to() === unit.tile()
      ),
    ],
    isOwnCity = (unit: Unit): boolean =>
      cityRegistry.getByTile(unit.tile())?.player() === unit.player();

  return [
    new Moved(
      id('emit'),
      new Effect((unit: Unit, action: Action): void => {
        engine.emit('unit:moved', unit, action);
      })
    ),
    new Moved(
      id('apply-visibility'),
      new Effect((unit: Unit): void => unit.applyVisibility())
    ),
    new Moved(
      id('end-moves-when-exhausted'),
      new Criterion((unit: Unit): boolean => unit.moves().value() < 0.3),
      new Effect((unit: Unit): void => {
        unit.moves().set(0);
        unit.setActive(false);
      })
    ),
    new Moved(
      // A transport leaving one of its player's cities takes only the units sentried aboard (`Stowed` or `Sleeping`);
      //  at sea, all of its cargo goes with it, and so does an aircraft aboard, awake or not.
      id('move-cargo'),
      new Criterion((unit: Unit): boolean => unit instanceof NavalTransport),
      new Criterion(
        (unit: Unit, action: Action): boolean => action instanceof Move
      ),
      new Criterion((unit: Unit): boolean =>
        (unit as NavalTransport).hasCargo()
      ),
      new Effect((unit: Unit, action: Action): void => {
        const transport = unit as NavalTransport,
          leftPort =
            cityRegistry.getByTile(action.from())?.player() === unit.player();

        transport.cargo().forEach((cargo: Unit): void => {
          if (
            leftPort &&
            !(cargo instanceof Air) &&
            !(cargo.busy() instanceof Stowed) &&
            !(cargo.busy() instanceof Sleeping)
          ) {
            transport.unload(cargo);

            return;
          }

          cargo.action(action.forUnit(cargo));
        });
      })
    ),
    // These two come after `move-cargo`, so a unit collected here isn't also sent along the move just made.
    new Moved(
      // A carrier that moves onto its player's aircraft outside a city picks them up.
      id('collect-aircraft'),
      ...transportMoved,
      new Criterion((unit: Unit): boolean => !isOwnCity(unit)),
      new Effect((unit: Unit): void =>
        collect(
          unit as NavalTransport,
          unitsToCollect(unit).filter(
            (tileUnit: Unit): boolean => tileUnit instanceof Air
          )
        )
      )
    ),
    new Moved(
      // A transport that moves into one of its player's cities picks up the units sleeping there.
      id('collect-sleeping'),
      ...transportMoved,
      new Criterion((unit: Unit): boolean => isOwnCity(unit)),
      new Effect((unit: Unit): void =>
        collect(
          unit as NavalTransport,
          unitsToCollect(unit).filter(
            (tileUnit: Unit): boolean => tileUnit.busy() instanceof Sleeping
          )
        )
      )
    ),
    new Moved(
      id('disembark'),
      new Criterion(
        (unit: Unit, action: Action): boolean => action instanceof Disembark
      ),
      new Effect((unit: Unit): void => {
        const manifest = transportRegistry.getByUnit(unit);

        manifest.transport().unload(unit);

        transportRegistry.unregister(manifest);
      })
    ),
    new Moved(
      // A unit that leaves its transport's tile with a plain move (an aircraft taking off, a unit walking off a ship in
      //  a city) is no longer aboard. A `Disembark` is a move too, which `disembark` unloads.
      id('take-off'),
      new Criterion(
        (unit: Unit, action: Action): boolean => action instanceof Move
      ),
      new Criterion(
        (unit: Unit, action: Action): boolean => !(action instanceof Disembark)
      ),
      new Criterion((unit: Unit): boolean => transportRegistry.hasUnit(unit)),
      new Criterion(
        (unit: Unit): boolean =>
          transportRegistry.getByUnit(unit).transport().tile() !== unit.tile()
      ),
      new Effect((unit: Unit): void => {
        transportRegistry.getByUnit(unit).transport().unload(unit);

        if (unit.busy() instanceof Stowed) {
          unit.setBusy();
        }
      })
    ),
    new Moved(
      id('trireme-lost-at-sea'),
      new Criterion((unit: Unit): boolean => unit.hasTrait(CoastBound)),
      new Criterion((unit: Unit): boolean => unit.moves().value() === 0),
      new Criterion((unit: Unit): boolean => !unit.tile().isCoast()),
      new Criterion((): boolean => randomNumberGenerator() <= coastBoundLoss),
      new Effect((unit: Unit): void => {
        ruleRegistry.process(LostAtSea, unit as unknown as ITransport);
      })
    ),
    new Moved(
      // A unit that `AttackEndsTurn` can't attack again until next turn.
      id('bomber/end-turn-after-attack'),
      new High(),
      new Criterion((unit: Unit): boolean => unit.hasTrait(AttackEndsTurn)),
      new Criterion((unit: Unit, action: Action): boolean =>
        attacks.some(
          (AttackType: ActionType): boolean => action instanceof AttackType
        )
      ),
      new Effect((unit: Unit): void => {
        unit.moves().set(0);
        unit.setActive(false);
      })
    ),
    new Moved(
      id('break-peace-treaty'),
      // Any action with an enemy: a sneak attack or capture, or a covert action at peace.
      new Criterion(
        (unit: Unit, action: Action) =>
          typeof (action as unknown as { enemy?: unknown }).enemy === 'function'
      ),
      new Effect((unit: Unit, action: Action) => {
        const enemy = (action as unknown as { enemy(): Player }).enemy(),
          peaceTreaties = interactionRegistry
            .getByPlayers(unit.player(), enemy)
            .filter(
              (interaction): interaction is Peace =>
                interaction instanceof Peace && interaction.active()
            );

        peaceTreaties.forEach((peaceTreaty) =>
          peaceTreaty.expire(unit.player())
        );

        // The victim of an attack in peacetime holds a grudge; walking onto or pillaging its land only ends the treaty.
        if (
          peaceTreaties.length > 0 &&
          !noVendetta.some(
            (ActionType: ActionType): boolean => action instanceof ActionType
          ) &&
          !hasVendetta(enemy, unit.player(), interactionRegistry)
        ) {
          interactionRegistry.register(
            new Vendetta(enemy, unit.player(), new Never(), ruleRegistry)
          );
        }
      })
    ),
  ];
};

export default movedRules;
