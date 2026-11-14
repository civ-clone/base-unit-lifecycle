import { CityRegistry } from '@civ-clone/core-city/CityRegistry';
import { Engine } from '@civ-clone/core-engine/Engine';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { TransportRegistry } from '@civ-clone/core-unit-transport/TransportRegistry';
import { UnitRegistry } from '@civ-clone/core-unit/UnitRegistry';
import Action from '@civ-clone/core-unit/Action';
import Moved from '@civ-clone/core-unit/Rules/Moved';
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
  Move: ActionType;
  Disembark: ActionType;
  attacks: ActionType[];
  noVendetta: ActionType[];
  coastBoundLoss: number;
}
/**
 * A ruleset's `Moved` rules, in order, with ids `<prefix>:unit/moved/<name>` as civ1-unit's are: telling the client,
 * vision, ending a unit's moves, transports carrying and collecting their cargo, leaving a transport, a `CoastBound`
 * unit lost at sea, an `AttackEndsTurn` unit's turn ending, and a broken peace treaty.
 */
export declare const movedRules: (
  prefix: string,
  {
    cityRegistry,
    engine,
    interactionRegistry,
    randomNumberGenerator,
    ruleRegistry,
    transportRegistry,
    unitRegistry,
  }: MovedDependencies,
  { Move, Disembark, attacks, noVendetta, coastBoundLoss }: MovedOptions
) => Moved[];
export default movedRules;
