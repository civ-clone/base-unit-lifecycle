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
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import City from '@civ-clone/core-city/City';
import CityInvestigated from '@civ-clone/base-unit-action-investigate-city/Rules/CityInvestigated';
import Effect from '@civ-clone/core-rule/Effect';
import Embassy from '@civ-clone/base-unit-action-establish-embassy/Embassy';
import EmbassyEstablished from '@civ-clone/base-unit-action-establish-embassy/Rules/EmbassyEstablished';
import LeaderMet from '@civ-clone/base-unit-action-meet-with-leader/Rules/LeaderMet';
import Player from '@civ-clone/core-player/Player';
import Unit from '@civ-clone/core-unit/Unit';

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
export const diplomatRules = (
  prefix: string,
  {
    engine = engineInstance,
    interactionRegistry = interactionRegistryInstance,
    ruleRegistry = ruleRegistryInstance,
    turn = turnInstance,
  }: DiplomatDependencies
) => ({
  embassyEstablished: [
    new EmbassyEstablished(
      `${prefix}:unit/embassy-established/register`,
      new Effect((unit: Unit, city: City): boolean => {
        interactionRegistry.register(
          new Embassy(unit.player(), city.player(), ruleRegistry, turn) as never
        );

        engine.emit('player:embassy-established', unit.player(), city.player());

        return true;
      })
    ),
  ],
  cityInvestigated: [
    new CityInvestigated(
      `${prefix}:unit/city-investigated/emit`,
      new Effect((unit: Unit, city: City): boolean => {
        engine.emit('city:investigated', city, unit.player());

        return true;
      })
    ),
  ],
  leaderMet: [
    new LeaderMet(
      `${prefix}:unit/leader-met/meet`,
      new Effect((unit: Unit, player: Player): void => {
        unit.moves().set(0);

        engine.emit('player:meet-with-leader', unit.player(), player);
      })
    ),
  ],
});

export default diplomatRules;
