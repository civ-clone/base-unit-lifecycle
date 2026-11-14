import { Peace, Vendetta } from '@civ-clone/library-diplomacy/Declarations';
import Air from '@civ-clone/base-unit-type-air/Air';
import InteractionRegistry from '@civ-clone/core-diplomacy/InteractionRegistry';
import Land from '@civ-clone/base-unit-type-land/Land';
import Moved from '@civ-clone/core-unit/Rules/Moved';
import NavalTransport from '@civ-clone/base-unit-type-naval-transport/NavalTransport';
import Player from '@civ-clone/core-player/Player';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Sleeping from '@civ-clone/base-unit-action-sleep/Rules/Sleeping';
import Stowed from '@civ-clone/base-unit-action-embark/Busy/Stowed';
import { expect } from 'chai';
import movedRules from '../lib/movedRules';

// The bodies of `movedRules`, with stand-in units, actions and registries: each rule processed through a registry, as
//  `Moved` is in a game (every rule's criteria checked before any effect runs).

class Move {
  fromTile: unknown;
  toTile: unknown;
  forUnits: unknown[] = [];

  constructor(fromTile: unknown, toTile: unknown) {
    this.fromTile = fromTile;
    this.toTile = toTile;
  }

  from() {
    return this.fromTile;
  }

  to() {
    return this.toTile;
  }

  forUnit(unit: unknown) {
    this.forUnits.push(unit);

    return this;
  }
}
class Disembark extends Move {}
class Attack {}
class SneakMove extends Move {
  _enemy: Player;

  constructor(enemy: Player) {
    super(null, null);

    this._enemy = enemy;
  }

  enemy() {
    return this._enemy;
  }
}
class SneakAttack extends Attack {
  _enemy: Player;

  constructor(enemy: Player) {
    super();

    this._enemy = enemy;
  }

  enemy() {
    return this._enemy;
  }
}

const me = new Player(new RuleRegistry()),
  them = new Player(new RuleRegistry());

type Stub = Record<string, unknown>;

const stub = (Type: Function, props: Stub): any =>
  Object.assign(Object.create(Type.prototype), {
    player: () => me,
    busy: () => null,
    setBusy() {},
    hasTrait: () => false,
    moves: () => ({ value: () => 1, set() {} }),
    setActive() {},
    applyVisibility() {},
    action() {},
    ...props,
  });

const setUp = ({
  cityOwner = null as Player | null,
  unitsOn = [] as unknown[],
  aboard = new Map<unknown, unknown>(),
  interactionRegistry = new InteractionRegistry(),
} = {}) => {
  const ruleRegistry = new RuleRegistry(),
    unregistered: unknown[] = [];

  ruleRegistry.register(
    ...movedRules(
      'game',
      {
        cityRegistry: {
          getByTile: () => (cityOwner ? { player: () => cityOwner } : null),
        } as never,
        engine: { emit() {} } as never,
        interactionRegistry,
        randomNumberGenerator: () => 1,
        ruleRegistry,
        transportRegistry: {
          hasUnit: (unit: unknown) => aboard.has(unit),
          getByUnit: (unit: unknown) => ({
            transport: () => aboard.get(unit),
          }),
          unregister: (manifest: unknown) => unregistered.push(manifest),
        } as never,
        unitRegistry: { getByTile: () => unitsOn } as never,
      },
      {
        Move: Move as never,
        Disembark: Disembark as never,
        attacks: [Attack, SneakAttack] as never[],
        noVendetta: [SneakMove] as never[],
        coastBoundLoss: 0.5,
      }
    )
  );

  return {
    moved: (unit: unknown, action: unknown) =>
      ruleRegistry.process(Moved, unit as never, action as never),
    unregistered,
    interactionRegistry,
  };
};

// A transport with `cargo` aboard, recording what it unloads and stows.
const transport = (cargo: unknown[], tile: unknown = 'sea') => {
  const unloaded: unknown[] = [],
    stowed: unknown[] = [];

  return {
    unloaded,
    stowed,
    ship: stub(NavalTransport, {
      tile: () => tile,
      hasCargo: () => cargo.length > 0,
      cargo: () => cargo,
      unload: (unit: unknown) => unloaded.push(unit),
      hasCapacity: () => true,
      canStow: () => true,
      stow: (unit: unknown) => stowed.push(unit),
    }),
  };
};

describe('movedRules', (): void => {
  it('takes only sentried cargo and aircraft out of its own port, and all of it at sea', (): void => {
    const awake = stub(Land, {}),
      sentried = stub(Land, { busy: () => new Stowed() }),
      asleep = stub(Land, { busy: () => new Sleeping() }),
      aircraft = stub(Air, {}),
      cargo = [awake, sentried, asleep, aircraft],
      inPort = transport(cargo),
      atSea = transport(cargo);

    const leaving = new Move('port', 'sea');

    setUp({ cityOwner: me }).moved(inPort.ship, leaving);
    expect(inPort.unloaded).to.deep.equal([awake]);
    expect(leaving.forUnits).to.deep.equal([sentried, asleep, aircraft]);

    const sailing = new Move('sea', 'sea');

    setUp().moved(atSea.ship, sailing);
    expect(atSea.unloaded).to.deep.equal([]);
    expect(sailing.forUnits).to.deep.equal(cargo);
  });

  it('collects its aircraft outside its cities, and its sleeping units in them', (): void => {
    const aircraft = stub(Air, {}),
      sleeper = stub(Land, { busy: () => new Sleeping() }),
      awake = stub(Land, {}),
      foreign = stub(Air, { player: () => them });

    const atSea = transport([], 'here');

    setUp({ unitsOn: [aircraft, sleeper, awake, foreign] }).moved(
      atSea.ship,
      new Move('there', 'here')
    );
    expect(atSea.stowed).to.deep.equal([aircraft]);

    const inPort = transport([], 'here');

    setUp({ cityOwner: me, unitsOn: [aircraft, sleeper, awake] }).moved(
      inPort.ship,
      new Move('there', 'here')
    );
    expect(inPort.stowed).to.deep.equal([sleeper]);
  });

  it('unloads a disembarking unit and forgets its manifest, and a unit that moves off its transport', (): void => {
    const unloaded: unknown[] = [],
      ship = {
        unload: (unit: unknown) => unloaded.push(unit),
        tile: () => 'sea',
      },
      leaving = stub(Land, { tile: () => 'shore' }),
      takingOff = stub(Air, { tile: () => 'sky', busy: () => new Stowed() }),
      aboard = new Map<unknown, unknown>([
        [leaving, ship],
        [takingOff, ship],
      ]),
      { moved, unregistered } = setUp({ aboard });

    moved(leaving, new Disembark('sea', 'shore'));
    expect(unloaded).to.deep.equal([leaving]);
    expect(unregistered).to.length(1);

    let busy: unknown = 'stowed';

    takingOff.setBusy = (value?: unknown) => (busy = value ?? null);
    moved(takingOff, new Move('sea', 'sky'));
    expect(unloaded).to.deep.equal([leaving, takingOff]);
    expect(busy).to.null;
  });

  it('ends a treaty broken by a sneak attack, with a grudge, and one broken by a sneak move, without', (): void => {
    const attacker = stub(Land, {}),
      attacked = setUp(),
      walked = setUp();

    attacked.interactionRegistry.register(
      new Peace(me, them, new RuleRegistry())
    );
    walked.interactionRegistry.register(
      new Peace(me, them, new RuleRegistry())
    );

    attacked.moved(attacker, new SneakAttack(them));
    walked.moved(attacker, new SneakMove(them));

    const active = (registry: InteractionRegistry, Type: Function) =>
      registry
        .entries()
        .filter(
          (interaction) =>
            interaction instanceof Type &&
            (interaction as unknown as { active(): boolean }).active()
        ).length;

    expect(active(attacked.interactionRegistry, Peace)).to.equal(0);
    expect(active(attacked.interactionRegistry, Vendetta)).to.equal(1);
    expect(active(walked.interactionRegistry, Peace)).to.equal(0);
    expect(active(walked.interactionRegistry, Vendetta)).to.equal(0);
  });
});
