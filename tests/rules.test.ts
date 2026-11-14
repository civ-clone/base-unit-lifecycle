import * as fs from 'fs';
import * as path from 'path';
import AttackEndsTurn from '@civ-clone/base-unit-trait-attack-ends-turn/AttackEndsTurn';
import CoastBound from '@civ-clone/base-unit-trait-coast-bound/CoastBound';
import Air from '@civ-clone/base-unit-type-air/Air';
import Land from '@civ-clone/base-unit-type-land/Land';
import { Peace } from '@civ-clone/library-diplomacy/Declarations';
import Player from '@civ-clone/core-player/Player';
import PlayerAction from '@civ-clone/core-player/PlayerAction';
import Rule from '@civ-clone/core-rule/Rule';
import Tile from '@civ-clone/core-world/Tile';
import TileImprovement from '@civ-clone/core-tile-improvement/TileImprovement';
import Unit from '@civ-clone/core-unit/Unit';
import UnitImprovement from '@civ-clone/core-unit-improvement/UnitImprovement';
import detonatedRules from '../lib/detonatedRules';
import diplomatRules from '../lib/diplomatRules';
import { expect } from 'chai';
import lifecycleRules from '../lib/lifecycleRules';
import movedRules from '../lib/movedRules';
import treatyPartner from '../lib/treatyPartner';

// civ1-unit 0.1.40's own rules (835709d), dumped from its compiled `getRules`: id, rule type, priority and how many
//  criteria each has, in order. The assemblers with civ1-unit's prefix and options must give exactly these, so that
//  civ1-unit can adopt them later without a single rule moving (R2b).
const civ1: Record<string, [string, string, number, number][]> = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), 'tests/fixtures/civ1-unit-rules.json'),
    'utf8'
  )
);

const fingerprint = (
  rules: Rule<any, any>[]
): [string, string, number, number][] =>
  rules.map((rule: Rule<any, any>) => [
    rule.id() as string,
    rule.constructor.name,
    rule.priority().value(),
    (
      (rule as unknown as { _criteria?: { _criteria: unknown[] } })._criteria
        ?._criteria ?? []
    ).length,
  ]);

// Stand-ins named as civ1-unit's classes are, since a rule id carries the class's name.
class Fortified extends UnitImprovement {}
class ActiveUnit extends PlayerAction {}
class InactiveUnit extends PlayerAction {}
class Move {}
class Disembark extends Move {}
class Attack {}
class SneakAttack extends Attack {}
class SneakMove extends Move {}
class SneakPillage {}
class Pollution extends TileImprovement {}

const lifecycle = lifecycleRules(
  'civ1-unit',
  {},
  {
    ActiveUnit: ActiveUnit as never,
    InactiveUnit: InactiveUnit as never,
    removedOnActivate: [Fortified],
    stowable: [Land, Air],
    partnerOf: (): Player | null => null,
    shortfallFactor: 0.5,
  }
);

describe('lifecycleRules', (): void => {
  (
    [
      ['Rules/Unit/activate', lifecycle.activate],
      ['Rules/Unit/canStow', lifecycle.canStow],
      ['Rules/Unit/created', lifecycle.created],
      ['Rules/Unit/defeated', lifecycle.defeated],
      ['Rules/Unit/destroyed', lifecycle.destroyed],
      ['Rules/Unit/expectedMovementCost', lifecycle.expectedMovementCost],
      ['Rules/Unit/halted', lifecycle.halted],
      ['Rules/Unit/impassable', lifecycle.impassable],
      ['Rules/Unit/lostAtSea', lifecycle.lostAtSea],
      ['Rules/Player/action', lifecycle.playerAction],
      ['Rules/Unit/stowed', lifecycle.stowed],
      ['Rules/Unit/unsupported', lifecycle.unsupported],
      ['Rules/Unit/validateMove', lifecycle.validateMove],
    ] as [string, Rule<any, any>[]][]
  ).forEach(([file, rules]): void => {
    it(`gives civ1-unit's ${file} rules, in order`, (): void => {
      expect(fingerprint(rules)).to.deep.equal(civ1[file]);
    });
  });

  it("gives civ1-unit's transferred/emit, after which civ1-unit keeps its own start-afresh rule", (): void => {
    expect(fingerprint(lifecycle.transferred)).to.deep.equal(
      civ1['Rules/Unit/transferred'].filter(([id]) => id.endsWith('/emit'))
    );
  });

  it('makes no impassable rule without a partnerOf', (): void => {
    const rules = lifecycleRules(
      'game',
      {},
      {
        ActiveUnit: ActiveUnit as never,
        InactiveUnit: InactiveUnit as never,
        removedOnActivate: [],
        stowable: [],
        shortfallFactor: 0.5,
      }
    );

    expect(rules.impassable).to.deep.equal([]);
    expect(rules.created[0].id()).to.equal('game:unit/created/register');
    expect(rules.canStow).to.deep.equal([]);
    expect(rules.activate).to.length(2);
  });

  it('prices a long step with the given shortfall factor', (): void => {
    const [rule] = lifecycleRules(
      'game',
      {},
      {
        ActiveUnit: ActiveUnit as never,
        InactiveUnit: InactiveUnit as never,
        removedOnActivate: [],
        stowable: [],
        shortfallFactor: 0.25,
      }
    ).expectedMovementCost;

    // max(m, c × factor): 3 moves, a step costing 20.
    expect(rule.process(null, 20, 3)).to.equal(5);
    expect(rule.validate(null, 20, 0)).to.false;
  });
});

describe('movedRules', (): void => {
  const options = {
    Move: Move as never,
    Disembark: Disembark as never,
    attacks: [Attack, SneakAttack] as never[],
    noVendetta: [SneakMove, SneakPillage] as never[],
    coastBoundLoss: 0.5,
  };

  it("gives civ1-unit's Rules/Unit/moved rules, in order", (): void => {
    expect(fingerprint(movedRules('civ1-unit', {}, options))).to.deep.equal(
      civ1['Rules/Unit/moved']
    );
  });

  it('ends the turn of a unit that AttackEndsTurn after any of the given attacks only', (): void => {
    const rule = movedRules('game', {}, options).find((rule) =>
        rule.id()!.endsWith('/bomber/end-turn-after-attack')
      )!,
      bomber = {
        hasTrait: (Trait: unknown): boolean => Trait === AttackEndsTurn,
      },
      fighter = { hasTrait: (): boolean => false };

    expect(rule.validate(bomber, new Attack())).to.true;
    expect(rule.validate(bomber, new SneakAttack())).to.true;
    expect(rule.validate(bomber, new Move())).to.false;
    expect(rule.validate(fighter, new Attack())).to.false;
  });

  it('loses a CoastBound unit out of sight of land at the given odds', (): void => {
    const rules = (draw: number) =>
        movedRules(
          'game',
          { randomNumberGenerator: (): number => draw },
          { ...options, coastBoundLoss: 0.25 }
        ).find((rule) => rule.id()!.endsWith('/trireme-lost-at-sea'))!,
      unit = (coast: boolean) => ({
        hasTrait: (Trait: unknown): boolean => Trait === CoastBound,
        moves: () => ({ value: (): number => 0 }),
        tile: () => ({ isCoast: (): boolean => coast }),
      });

    expect(rules(0.25).validate(unit(false))).to.true;
    expect(rules(0.26).validate(unit(false))).to.false;
    expect(rules(0).validate(unit(true))).to.false;
  });
});

describe('detonatedRules', (): void => {
  it("gives civ1-unit's Rules/Unit/detonated rules, in order", (): void => {
    expect(
      fingerprint(
        detonatedRules(
          'civ1-unit',
          {},
          {
            sparesUnits: (): boolean => false,
            Pollution: Pollution as never,
            falloutChance: 2 / 3,
          }
        )
      )
    ).to.deep.equal(civ1['Rules/Unit/detonated']);
  });

  it('pollutes land at the given odds, and spares the units sparesUnits keeps', (): void => {
    const built: Tile[] = [],
      destroyed: unknown[] = [],
      spared: unknown[] = [],
      land = (name: string) =>
        ({ name, isLand: (): boolean => true } as unknown as Tile),
      centre = Object.assign(land('centre'), {
        getNeighbours: (): Tile[] => [land('a'), land('b')],
      }),
      draws = [0.1, 0.9, 0.2],
      city = { name: 'city' },
      rules = detonatedRules(
        'game',
        {
          cityRegistry: {
            getByTile: (tile: { name: string }) =>
              tile.name === 'a' ? city : null,
          } as never,
          engine: {
            emit: (event: string, ...args: unknown[]): void => {
              if (event === 'city:sdi-protected') {
                spared.push(args[0]);
              }
            },
          } as never,
          randomNumberGenerator: (): number => draws.shift()!,
          ruleRegistry: {
            process: (Type: unknown, unit: unknown): void => {
              destroyed.push(unit);
            },
          } as never,
          tileImprovementRegistry: { getByTile: () => [] } as never,
          unitRegistry: {
            getByTile: (tile: { name: string }) => [
              { tile, destroyed: (): boolean => false },
            ],
          } as never,
        },
        {
          sparesUnits: (candidate): boolean => candidate === (city as never),
          Pollution: class {
            constructor(tile: Tile) {
              built.push(tile);
            }
          } as never,
          falloutChance: 0.5,
        }
      ),
      attacker = { player: (): null => null } as unknown as Unit;

    rules
      .find((rule) => rule.id() === 'game:unit/detonated/destroy-units')!
      .process(attacker, centre);
    rules
      .find((rule) => rule.id() === 'game:unit/detonated/fallout')!
      .process(attacker, centre);

    expect(spared).to.deep.equal([city]);
    expect(destroyed).to.length(2);
    // Square a has the city; of centre and b, centre draws 0.1 (polluted) and b draws 0.9 (not).
    expect(
      built.map((tile) => (tile as unknown as { name: string }).name)
    ).to.deep.equal(['centre']);
  });
});

describe('treatyPartner', (): void => {
  class Road extends TileImprovement {}
  class Farm extends TileImprovement {}

  it('is the partner working an improved tile, for a land unit that fights', (): void => {
    const me = { name: 'me' },
      them = { name: 'them' },
      unit = (fights: boolean, domain: typeof Unit = Land) =>
        Object.assign(Object.create(domain.prototype), {
          hasTrait: (): boolean => !fights,
          player: () => me,
        }),
      partnerOf = (improvement: TileImprovement | null, atPeace = true) =>
        treatyPartner([Road], {
          interactionRegistry: {
            getByPlayers: () => [
              Object.assign(Object.create(Peace.prototype), {
                active: (): boolean => atPeace,
              }),
            ],
          } as never,
          tileImprovementRegistry: {
            getByTile: () => (improvement ? [improvement] : []),
          } as never,
          workedTileRegistry: {
            getByTile: () => ({ city: () => ({ player: () => them }) }),
          } as never,
        });

    const road = Object.create(Road.prototype),
      farm = Object.create(Farm.prototype),
      tile = {} as Tile;

    expect(partnerOf(road)(unit(true), tile)).to.equal(them);
    expect(partnerOf(farm)(unit(true), tile)).to.null;
    expect(partnerOf(null)(unit(true), tile)).to.null;
    expect(partnerOf(road, false)(unit(true), tile)).to.null;
    expect(partnerOf(road)(unit(false), tile)).to.null;
    expect(partnerOf(road)(unit(true, Air), tile)).to.null;
  });
});

describe('diplomatRules', (): void => {
  it("gives civ1-unit's embassy, investigation and meeting rules, which come first in its Rules/Unit/diplomat", (): void => {
    const rules = diplomatRules('civ1-unit', {});

    expect(
      fingerprint([
        ...rules.embassyEstablished,
        ...rules.cityInvestigated,
        ...rules.leaderMet,
      ])
    ).to.deep.equal(civ1['Rules/Unit/diplomat'].slice(0, 3));
  });

  it("registers an embassy for the Diplomat's player, and a meeting ends its turn", (): void => {
    const registered: unknown[] = [],
      events: string[] = [],
      me = {},
      them = {},
      rules = diplomatRules('game', {
        engine: { emit: (event: string) => events.push(event) } as never,
        interactionRegistry: {
          register: (interaction: unknown) => registered.push(interaction),
        } as never,
      });
    let moves = 1;
    const unit = {
      player: () => me,
      moves: () => ({ set: (value: number) => (moves = value) }),
    };

    rules.embassyEstablished[0].process(unit, { player: () => them });
    rules.leaderMet[0].process(unit, them);

    expect(registered).to.length(1);
    const [embassy] = registered as { holder(): unknown; host(): unknown }[];

    expect([embassy.holder(), embassy.host()]).to.deep.equal([me, them]);
    expect(moves).to.equal(0);
    expect(events).to.deep.equal([
      'player:embassy-established',
      'player:meet-with-leader',
    ]);
  });
});

describe('lifecycleRules, a short step of the ruleset’s own', (): void => {
  it('decides a short step and prices it with `shortStep`, spending the moves', (): void => {
    const calls: unknown[][] = [],
      rules = lifecycleRules(
        'game',
        { randomNumberGenerator: (): number => 0.25 },
        {
          ActiveUnit: ActiveUnit as never,
          InactiveUnit: InactiveUnit as never,
          removedOnActivate: [],
          stowable: [],
          shortfallFactor: 0.5,
          shortStep: {
            succeeds: (remaining, movement, cost, rng) => {
              calls.push([remaining, movement, cost, rng()]);

              return remaining === movement;
            },
            expectedCost: (movement: number) => movement,
          },
        }
      ),
      [, short] = rules.validateMove,
      [expected] = rules.expectedMovementCost;
    let moves = 1;
    const unit = {
      moves: () => ({
        value: () => moves,
        set: (value: number) => (moves = value),
      }),
      movement: () => ({ value: () => 1 }),
    };

    expect(short.process(unit, 3)).to.true;
    expect(moves).to.equal(0);
    expect(calls).to.deep.equal([[1, 1, 3, 0.25]]);
    expect(expected.process(null, 20, 3)).to.equal(3);
  });
});

describe('detonatedRules, vetoed', (): void => {
  it('does nothing over a square the ruleset vetoes, but still tells the client', (): void => {
    const events: string[] = [],
      touched: string[] = [],
      rules = detonatedRules(
        'game',
        {
          cityRegistry: {
            getByTile: () => {
              touched.push('city');

              return null;
            },
          } as never,
          engine: { emit: (event: string) => events.push(event) } as never,
          unitRegistry: { getByTile: () => [] } as never,
          tileImprovementRegistry: { getByTile: () => [] } as never,
        },
        {
          sparesUnits: () => false,
          Pollution: Pollution as never,
          falloutChance: 1,
          vetoes: () => true,
        }
      ),
      tile = { getNeighbours: () => [], isLand: () => true },
      attacker = { player: () => null };

    rules.forEach((rule) => rule.process(attacker, tile));

    expect(events).to.deep.equal(['unit:nuclear-detonation']);
    expect(touched).to.deep.equal([]);
  });
});
