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
      // If currentStage is active, do NOT match or leak future stage facts
      return null;
    }

    // 2. Fallback for non-staged context: search character facts
    for (const fact of STORY_FACTS) {
      if (fact.characterId === charId) {
        const stage = fact.validStages[0] || 'INVESTIGATE_GENERATOR';
        if (fact.questionMatches(q, stage, state)) {
          return fact;
        }
      }
    }

    return null;
  }

  /**
   * Evaluates question intent and returns the canonical fallback text.
   * Three-Tier response selection:
   * Tier 1: Canonical stage fact (if genuinely matched)
   * Tier 2: General grounded character knowledge / alibi
   * Tier 3: Concise in-character "I don't know" style response
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

    switch (charId) {
      case 'rook':
        if (q.includes('where were you') || q.includes('location') || q.includes('station') || q.includes('duties') || q.includes('job') || q.includes('generator') || q.includes('power')) {
          return "I was working right here by the Generator keeping the power grid balanced.";
        }
        if (q.includes('mina')) {
          return "I haven't seen Mina around the Generator today. She's usually over in the Bio-Lab.";
        }
        if (q.includes('pip')) {
          return "Pip usually stays up near Food Storage. Haven't seen them down in the power sector.";
        }
        if (q.includes('vale')) {
          return "Vale checks relay lines between sectors.";
        }
        return "I don't know anything about that. I'm keeping an eye on the power grid.";

      case 'vale':
        if (q.includes('replacement') || q.includes('storage') || q.includes('supply') || q.includes('supplies') || q.includes('parts') || q.includes('mina') || q.includes('access')) {
          return "Mina manages colony supply storage in the Bio-Lab. I noticed some replacement components were missing earlier.";
        }
        if (q.includes('where were you') || q.includes('what were you doing') || q.includes('route') || q.includes('alibi') || q.includes('location') || q.includes('duties') || q.includes('job')) {
          return "I was checking relay conduits across the sector during my maintenance rounds.";
        }
        if (q.includes('rook')) {
          return "Rook works at the Generator console.";
        }
        if (q.includes('pip')) {
          return "Pip is a maintenance runner delivering supplies.";
        }
        return "I don't know anything about that. I was focused on my relay rounds.";

      case 'mina':
        if (q.includes('where were you') || q.includes('location') || q.includes('duties') || q.includes('job') || q.includes('storage') || q.includes('biolab') || q.includes('specimen') || q.includes('supplies') || q.includes('log')) {
          return "I've been in the Bio-Lab cataloging culture specimens and managing inventory.";
        }
        if (q.includes('pip')) {
          return "Pip handles errands and deliveries between sectors.";
        }
        if (q.includes('rook') || q.includes('generator')) {
          return "Rook handles the generator. I stay in the Bio-Lab.";
        }
        return "I don't know anything about that. I only manage Bio-Lab inventory.";

      case 'pip':
        if (q.includes('where were you') || q.includes('location') || q.includes('duties') || q.includes('job') || q.includes('runner') || q.includes('food')) {
          return "I was running errands between Food Storage and the upper sectors.";
        }
        if (q.includes('kira')) {
          return "Kira is stationed at the Comms terminal.";
        }
        if (q.includes('mina')) {
          return "Mina manages supplies over in the Bio-Lab.";
        }
        return "I don't know anything about that. I'm just running deliveries.";

      case 'kira':
        if (q.includes('where were you') || q.includes('location') || q.includes('duties') || q.includes('job') || q.includes('comms') || q.includes('telemetry') || q.includes('terminal')) {
          return "I remained at the Comms terminal monitoring nursery telemetry throughout the blackout.";
        }
        if (q.includes('nox') || q.includes('nursery') || q.includes('larvae')) {
          return "Nox cares for the nursery chambers. I monitor telemetry remotely.";
        }
        return "I don't know anything about that. My focus is on colony telemetry.";

      case 'nox':
        if (q.includes('where were you') || q.includes('location') || q.includes('duties') || q.includes('job') || q.includes('nursery') || q.includes('larvae') || q.includes('brood')) {
          return "I have been tending to the larvae in the Nursery.";
        }
        if (q.includes('kira') || q.includes('comms')) {
          return "Kira monitors nursery sensors from the Comms sector.";
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

    const fallback = this.getCanonicalFallback(state, rawQuestion, roundManager);
    return [fallback];
  }
}
