import { CharacterState } from '../types/characterState';
import { RoundManager } from '../systems/RoundManager';
import { RoundStage } from '../types/round';
import { STORY_FACTS, StoryFactDefinition, StoryFactId } from '../types/storyFacts';

export type { StoryFactDefinition, StoryFactId };
export type CanonicalIntent = StoryFactDefinition;

export class CanonicalDialogue {
  public static readonly CANONICAL_INTENTS: StoryFactDefinition[] = STORY_FACTS;

  /**
   * Retrieves the matched canonical intent/fact if any
   */
  public static getIntent(
    state: CharacterState,
    rawQuestion: string,
    roundManager?: RoundManager | boolean
  ): StoryFactDefinition | null {
    const q = (rawQuestion || '').toLowerCase().trim();
    const charId = state.id.toLowerCase();

    // Determine current round stage if available
    let currentStage: RoundStage | null = null;
    if (roundManager && typeof roundManager === 'object' && 'getStage' in roundManager) {
      currentStage = roundManager.getStage();
    }

    // 1. First priority: search facts matching the current stage
    if (currentStage) {
      for (const fact of STORY_FACTS) {
        if (
          fact.characterId === charId &&
          fact.validStages.includes(currentStage) &&
          fact.questionMatches(q, currentStage, state)
        ) {
          return fact;
        }
      }
    }

    // 2. Second priority: search facts for this character regardless of stage
    for (const fact of STORY_FACTS) {
      if (fact.characterId === charId) {
        const dummyStage = fact.validStages[0] || 'INVESTIGATE_GENERATOR';
        if (fact.questionMatches(q, dummyStage, state)) {
          return fact;
        }
      }
    }

    return null;
  }

  /**
   * Evaluates question intent and returns the canonical fallback text.
   */
  public static getCanonicalFallback(
    state: CharacterState,
    rawQuestion: string,
    roundManager?: RoundManager | boolean
  ): string {
    const matched = this.getIntent(state, rawQuestion, roundManager);
    if (matched) {
      return matched.fallback;
    }

    const q = (rawQuestion || '').toLowerCase().trim();
    const charId = state.id.toLowerCase();

    // Default free-form fallbacks according to character alibis / knowledge
    switch (charId) {
      case 'rook':
        if (q.includes('where were you') || q.includes('location') || q.includes('station')) {
          return "I was working right here by the Generator keeping the power grid balanced.";
        }
        if (q.includes('mina')) {
          return "I haven't seen Mina around the Generator today. She's usually over in the Bio-Lab.";
        }
        if (q.includes('pip')) {
          return "Pip usually stays up near Food Storage. Haven't seen them down in the power sector.";
        }
        return "I'm keeping an eye on the power grid. If you have a question about what happened here, ask.";

      case 'vale':
        if (q.includes('where were you') || q.includes('what were you doing')) {
          return "I was checking relay conduits across the sector.";
        }
        return "I was doing my rounds checking relay lines.";

      case 'mina':
        if (q.includes('where were you') || q.includes('what were you doing')) {
          return "I've been in the Bio-Lab cataloging culture specimens and managing inventory.";
        }
        return "I manage the colony storage logs in the Bio-Lab corridor.";

      case 'pip':
        if (q.includes('where were you') || q.includes('what were you doing')) {
          return "I was running errands between Food Storage and the upper sectors.";
        }
        return "I'm just a runner delivering supplies across the sectors.";

      case 'kira':
        if (q.includes('where were you') || q.includes('what were you doing')) {
          return "I remained at the Comms terminal monitoring nursery telemetry throughout the blackout.";
        }
        return "I've been monitoring nursery telemetry at the Comms console.";

      case 'nox':
        if (q.includes('where were you') || q.includes('what were you doing')) {
          return "I have been tending to the larvae in the Nursery.";
        }
        return "The nursery larvae are resting. I don't know anything about that.";

      default:
        return "I don't know anything about that.";
    }
  }

  /**
   * Returns allowed answer facts for building system prompts
   */
  public static getAllowedFacts(
    state: CharacterState,
    rawQuestion: string,
    roundManager?: RoundManager | boolean
  ): string[] {
    const matched = this.getIntent(state, rawQuestion, roundManager);
    if (matched) {
      return [matched.fallback];
    }

    return state.observations.slice(0, 2);
  }
}
