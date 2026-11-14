import { Engine } from '@civ-clone/core-engine/Engine';
import { InteractionRegistry } from '@civ-clone/core-diplomacy/InteractionRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { Turn } from '@civ-clone/core-turn-based-game/Turn';
import CityInvestigated from '@civ-clone/base-unit-action-investigate-city/Rules/CityInvestigated';
import EmbassyEstablished from '@civ-clone/base-unit-action-establish-embassy/Rules/EmbassyEstablished';
import LeaderMet from '@civ-clone/base-unit-action-meet-with-leader/Rules/LeaderMet';
export interface DiplomatDependencies {
  engine?: Engine;
  interactionRegistry?: InteractionRegistry;
  ruleRegistry?: RuleRegistry;
  turn?: Turn;
}
/**
 * A ruleset's rules for the diplomatic missions that need no numbers of its own, with ids `<prefix>:unit/<event>/<name>`
 * as civ1-unit's are: an embassy is a one-way record for the Diplomat's player; an investigation is the client's to
 * show; meeting a leader ends the Diplomat's turn and opens talks, which are the client's.
 */
export declare const diplomatRules: (
  prefix: string,
  { engine, interactionRegistry, ruleRegistry, turn }: DiplomatDependencies
) => {
  embassyEstablished: EmbassyEstablished[];
  cityInvestigated: CityInvestigated[];
  leaderMet: LeaderMet[];
};
export default diplomatRules;
