import type { IncomingMessage, ServerResponse } from 'http';
import type { CharacterState, ChatMessage } from '../src/types/characterState';
import type { RoundStage } from '../src/types/round';

export type StoryFactId =
  | 'ROOK_SAW_VALE'
  | 'VALE_ROUTE_CONTEXT'
  | 'VALE_ROOK_STATION_EMPTY'
  | 'ROOK_CONDUIT_NOISE'
  | 'CONDUIT_RELAY_COMPONENT'
  | 'VALE_RELAY_COMPONENT_RECOGNIZED'
  | 'VALE_MISSING_COMPONENTS'
  | 'MINA_PIP_POUCH'
  | 'PIP_KIRA_REQUEST'
  | 'KIRA_CONFIRMS_REQUEST'
  | 'KIRA_NO_DELIVERY'
  | 'RELAY_MISSING_COMPONENT'
  | 'NOX_POUCH_SIGHTING'
  | 'PIP_LOST_POUCH_EXCUSE'
  | 'PIP_FINAL_CONFRONTATION'
  | 'PIP_SABOTEUR_DENIAL';

export interface StoryFactDefinition {
  id: StoryFactId;
  characterId: string;
  validStages: RoundStage[];
  fallback: string;
  leadId?: string;
  isStageCompleting: boolean;
  questionMatches: (q: string, stage: RoundStage, state?: CharacterState) => boolean;
  responseMatches: (r: string) => boolean;
}

export const STORY_FACTS: StoryFactDefinition[] = [
  // 1. ROOK FIRST INTERROGATION (Fact: ROOK_SAW_VALE)
  {
    id: 'ROOK_SAW_VALE',
    characterId: 'rook',
    validStages: ['INVESTIGATE_GENERATOR', 'QUESTION_ROOK'],
    fallback: "I saw Vale pass through the nearby tunnel shortly before the blackout. I didn't see anyone else.",
    leadId: 'lead_vale_near_generator',
    isStageCompleting: true,
    questionMatches: (q, stage) => {
      if (stage !== 'INVESTIGATE_GENERATOR' && stage !== 'QUESTION_ROOK') return false;
      return (
        q.includes('what happened') ||
        q.includes('blackout') ||
        q.includes('power failure') ||
        q.includes('power cut') ||
        q.includes('generator') ||
        q.includes('vale') ||
        ((q.includes('who') || q.includes('anyone') || q.includes('anybody') || q.includes('did you see')) &&
          (q.includes('pass') || q.includes('around') || q.includes('near') || q.includes('tunnel') || q.includes('here') || q.includes('by') || q.includes('corridor') || q.includes('suspect') || q.includes('blackout')))
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return lower.includes('vale');
    }
  },

  // 2. VALE FIRST INTERROGATION (Context: VALE_ROUTE_CONTEXT)
  {
    id: 'VALE_ROUTE_CONTEXT',
    characterId: 'vale',
    validStages: ['QUESTION_VALE'],
    fallback: "I was moving between relay stations. My route takes me through that sector.",
    isStageCompleting: false,
    questionMatches: (q, stage) => {
      if (stage !== 'QUESTION_VALE') return false;
      return (
        q.includes('why were you') ||
        q.includes('why was vale') ||
        q.includes('what were you doing') ||
        q.includes('rook says') ||
        q.includes('rook saw') ||
        q.includes('your route') ||
        q.includes('why there') ||
        q.includes('why near') ||
        (q.includes('passing through') || q.includes('in the tunnel'))
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return lower.includes('relay stations') || lower.includes('route') || lower.includes('sector');
    }
  },

  // 2. VALE FIRST INTERROGATION (Contradiction: VALE_ROOK_STATION_EMPTY)
  {
    id: 'VALE_ROOK_STATION_EMPTY',
    characterId: 'vale',
    validStages: ['QUESTION_VALE'],
    fallback: "No. Rook's station was unattended when I passed through.",
    leadId: 'evidence_rook_unattended',
    isStageCompleting: true,
    questionMatches: (q, stage) => {
      if (stage !== 'QUESTION_VALE') return false;
      return (
        q.includes('rook') ||
        q.includes('his station') ||
        q.includes('at the station') ||
        q.includes('at his console') ||
        q.includes('at the console') ||
        q.includes('unattended') ||
        q.includes('empty console') ||
        q.includes('abandoned') ||
        ((q.includes('what did you see') || q.includes('did you see anyone') || q.includes('who was at') || q.includes('anyone at')) &&
          (q.includes('generator') || q.includes('console') || q.includes('station') || q.includes('there')))
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return (
        lower.includes('unattended') ||
        lower.includes('empty') ||
        lower.includes("wasn't there") ||
        lower.includes('was not there') ||
        lower.includes('abandoned') ||
        lower.includes('absent') ||
        (lower.includes('rook') && (lower.includes('not at') || lower.includes('was not') || lower.includes("didn't see") || lower.includes('missing')))
      );
    }
  },

  // 3. ROOK SECOND INTERROGATION (Confrontation: ROOK_CONDUIT_NOISE)
  {
    id: 'ROOK_CONDUIT_NOISE',
    characterId: 'rook',
    validStages: ['CONFRONT_ROOK'],
    fallback: "I stepped away briefly. I heard a strange noise coming from the conduit and went to inspect it.",
    leadId: 'lead_conduit_noise',
    isStageCompleting: true,
    questionMatches: (q, stage) => {
      if (stage !== 'CONFRONT_ROOK') return false;
      return (
        q.includes('empty') ||
        q.includes('unattended') ||
        q.includes('vale says') ||
        q.includes('why') ||
        q.includes('leave') ||
        q.includes('left') ||
        q.includes('step away') ||
        q.includes('stepped away') ||
        q.includes('abandon') ||
        q.includes('noise') ||
        q.includes('conduit') ||
        q.includes('rattle') ||
        q.includes('where were you') ||
        q.includes('post') ||
        q.includes('station')
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return (
        (lower.includes('conduit') || lower.includes('noise') || lower.includes('rattle')) &&
        (lower.includes('step away') || lower.includes('stepped away') || lower.includes('inspect') || lower.includes('check') || lower.includes('heard') || lower.includes('investigate'))
      );
    }
  },

  // 4. CONDUIT INSPECTION (World Evidence: CONDUIT_RELAY_COMPONENT)
  {
    id: 'CONDUIT_RELAY_COMPONENT',
    characterId: 'world',
    validStages: ['INSPECT_CONDUIT'],
    fallback: "A damaged Pheromone Relay component was lodged inside the conduit. It may have been used to create the noise that drew Rook away.",
    leadId: 'evidence_damaged_relay',
    isStageCompleting: true,
    questionMatches: () => true,
    responseMatches: () => true
  },

  // 5. VALE SECOND INTERROGATION (Recognition: VALE_RELAY_COMPONENT_RECOGNIZED)
  {
    id: 'VALE_RELAY_COMPONENT_RECOGNIZED',
    characterId: 'vale',
    validStages: ['ASK_VALE_RELAY'],
    fallback: "Yes. It's used in Pheromone Relay maintenance. We keep replacements in storage.",
    isStageCompleting: false,
    questionMatches: (q, stage) => {
      if (stage !== 'ASK_VALE_RELAY') return false;
      return (
        q.includes('recognize') ||
        q.includes('is it yours') ||
        q.includes('component') ||
        q.includes('relay') ||
        q.includes('found in conduit') ||
        q.includes('damaged')
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return lower.includes('pheromone relay') || lower.includes('replacements in storage') || lower.includes('maintenance');
    }
  },

  // 5. VALE SECOND INTERROGATION (Missing Components: VALE_MISSING_COMPONENTS)
  {
    id: 'VALE_MISSING_COMPONENTS',
    characterId: 'vale',
    validStages: ['ASK_VALE_RELAY'],
    fallback: "I noticed some were missing earlier. Mina was working around storage. She may know who took them.",
    leadId: 'evidence_relay_missing',
    isStageCompleting: true,
    questionMatches: (q, stage) => {
      if (stage !== 'ASK_VALE_RELAY') return false;
      return (
        q.includes('access') ||
        q.includes('who') ||
        q.includes('missing') ||
        q.includes('storage') ||
        q.includes('replacements') ||
        q.includes('mina') ||
        q.includes('took') ||
        q.includes('stock') ||
        q.includes('parts') ||
        q.includes('where') ||
        q.includes('component')
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return (
        (lower.includes('missing') && (lower.includes('storage') || lower.includes('relay') || lower.includes('mina') || lower.includes('parts') || lower.includes('replacements'))) ||
        (lower.includes('mina') && (lower.includes('storage') || lower.includes('relay') || lower.includes('parts') || lower.includes('took') || lower.includes('supplies') || lower.includes('working')))
      );
    }
  },

  // 6. MINA INTERROGATION (Fact: MINA_PIP_POUCH)
  {
    id: 'MINA_PIP_POUCH',
    characterId: 'mina',
    validStages: ['QUESTION_MINA'],
    fallback: "I saw Pip leave with a maintenance pouch before the blackout. I assumed he was running an errand.",
    leadId: 'lead_pip_pouch',
    isStageCompleting: true,
    questionMatches: (q, stage) => {
      if (stage !== 'QUESTION_MINA') return false;
      return (
        q.includes('pip') ||
        q.includes('pouch') ||
        q.includes('take') ||
        q.includes('took') ||
        q.includes('missing') ||
        q.includes('equipment') ||
        q.includes('storage') ||
        q.includes('supplies') ||
        q.includes('parts') ||
        q.includes('relay') ||
        q.includes('who') ||
        q.includes('checked') ||
        q.includes('anyone') ||
        q.includes('someone') ||
        q.includes('log') ||
        q.includes('record') ||
        q.includes('see') ||
        q.includes('saw')
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return (
        lower.includes('pip') &&
        (lower.includes('pouch') ||
          lower.includes('bag') ||
          lower.includes('checked out') ||
          lower.includes('storage') ||
          lower.includes('supplies') ||
          lower.includes('equipment') ||
          lower.includes('parts') ||
          lower.includes('errand') ||
          lower.includes('leave with') ||
          lower.includes('left with') ||
          lower.includes('saw pip') ||
          lower.includes('pip leave') ||
          lower.includes('pip was'))
      );
    }
  },

  // 7. PIP FIRST INTERROGATION (Fact: PIP_KIRA_REQUEST)
  {
    id: 'PIP_KIRA_REQUEST',
    characterId: 'pip',
    validStages: ['QUESTION_PIP'],
    fallback: "Kira asked me to bring her some repair equipment. That's what the pouch was for.",
    leadId: 'lead_kira_request',
    isStageCompleting: true,
    questionMatches: (q, stage) => {
      if (stage !== 'QUESTION_PIP') return false;
      return (
        q.includes('pouch') ||
        q.includes('storage') ||
        q.includes('mina') ||
        q.includes('why') ||
        q.includes('carrying') ||
        q.includes('take') ||
        q.includes('took') ||
        q.includes('who') ||
        q.includes('kira') ||
        q.includes('supplies') ||
        q.includes('equipment') ||
        q.includes('errand')
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return (
        lower.includes('kira') &&
        (lower.includes('request') ||
          lower.includes('order') ||
          lower.includes('asked') ||
          lower.includes('repair') ||
          lower.includes('supplies') ||
          lower.includes('deliveries') ||
          lower.includes('equipment') ||
          lower.includes('for kira') ||
          lower.includes('bring her'))
      );
    }
  },

  // 8. KIRA INTERROGATION (Confirm: KIRA_CONFIRMS_REQUEST)
  {
    id: 'KIRA_CONFIRMS_REQUEST',
    characterId: 'kira',
    validStages: ['VERIFY_KIRA'],
    fallback: "Yes. I asked Pip to bring me some parts for a repair.",
    isStageCompleting: false,
    questionMatches: (q, stage) => {
      if (stage !== 'VERIFY_KIRA') return false;
      return (
        (q.includes('ask pip') ||
          q.includes('asked pip') ||
          q.includes('pip claims') ||
          q.includes('request') ||
          q.includes('order')) &&
        !q.includes('deliver') &&
        !q.includes('receive') &&
        !q.includes('come back')
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return lower.includes('asked pip') || lower.includes('requested') || lower.includes('parts for a repair');
    }
  },

  // 8. KIRA INTERROGATION (Never Delivered: KIRA_NO_DELIVERY)
  {
    id: 'KIRA_NO_DELIVERY',
    characterId: 'kira',
    validStages: ['VERIFY_KIRA'],
    fallback: "No. He never came back with them. I eventually handled the repair another way.",
    leadId: 'evidence_pip_undelivered',
    isStageCompleting: true,
    questionMatches: (q, stage) => {
      if (stage !== 'VERIFY_KIRA') return false;
      return (
        q.includes('deliver') ||
        q.includes('delivered') ||
        q.includes('bring') ||
        q.includes('receive') ||
        q.includes('come back') ||
        q.includes('where') ||
        q.includes('parts') ||
        q.includes('pouch') ||
        q.includes('supplies') ||
        q.includes('get') ||
        q.includes('did he') ||
        q.includes('did pip')
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return (
        lower.includes('never delivered') ||
        lower.includes('never brought') ||
        lower.includes('never came back') ||
        lower.includes('never arrived') ||
        lower.includes("didn't deliver") ||
        lower.includes("did not deliver") ||
        lower.includes('another way') ||
        lower.includes('spare tools') ||
        lower.includes('local backups') ||
        lower.includes('never got')
      );
    }
  },

  // 10. RELAY INSPECTION (World Evidence: RELAY_MISSING_COMPONENT)
  {
    id: 'RELAY_MISSING_COMPONENT',
    characterId: 'world',
    validStages: ['RELAY_SABOTAGE', 'INSPECT_RELAY'],
    fallback: "A component matching the missing maintenance stock was deliberately fitted incorrectly.",
    leadId: 'evidence_relay_sabotage',
    isStageCompleting: true,
    questionMatches: () => true,
    responseMatches: () => true
  },

  // 11. NOX INTERROGATION (Fact: NOX_POUCH_SIGHTING)
  {
    id: 'NOX_POUCH_SIGHTING',
    characterId: 'nox',
    validStages: ['QUESTION_NOX'],
    fallback: "Someone hurried through the connecting tunnel carrying a maintenance pouch. It was too dark for me to see who it was.",
    leadId: 'evidence_nox_pouch',
    isStageCompleting: true,
    questionMatches: (q, stage) => {
      if (stage !== 'QUESTION_NOX') return false;
      return (
        q.includes('tunnel') ||
        q.includes('see') ||
        q.includes('saw') ||
        q.includes('anyone') ||
        q.includes('anything') ||
        q.includes('pouch') ||
        q.includes('blackout') ||
        q.includes('moving') ||
        q.includes('hurried') ||
        q.includes('who') ||
        q.includes('carrying')
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return (
        (lower.includes('pouch') || lower.includes('maintenance') || lower.includes('bag') || lower.includes('equipment')) &&
        (lower.includes('tunnel') || lower.includes('hurried') || lower.includes('ant') || lower.includes('blackout') || lower.includes('dark') || lower.includes('rush') || lower.includes('moving') || lower.includes('rushed'))
      );
    }
  },

  // 12. PIP FINAL CONFRONTATION (Lost Pouch Excuse: PIP_LOST_POUCH_EXCUSE)
  {
    id: 'PIP_LOST_POUCH_EXCUSE',
    characterId: 'pip',
    validStages: ['CONFRONT_PIP_FINAL'],
    fallback: "I lost track of the pouch during the blackout. Everything was chaotic.",
    isStageCompleting: false,
    questionMatches: (q, stage) => {
      if (stage !== 'CONFRONT_PIP_FINAL') return false;
      return (
        q.includes('kira says') ||
        q.includes('never delivered') ||
        q.includes('where did it go') ||
        q.includes('where is the pouch') ||
        q.includes('what happened to the pouch')
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return lower.includes('lost track') || lower.includes('chaotic');
    }
  },

  // 12. PIP FINAL CONFRONTATION (Confrontation: PIP_FINAL_CONFRONTATION)
  {
    id: 'PIP_FINAL_CONFRONTATION',
    characterId: 'pip',
    validStages: ['CONFRONT_PIP_FINAL'],
    fallback: "I don't know how they ended up there. I took the pouch for Kira. That's all I can tell you.",
    leadId: 'evidence_gathered_complete',
    isStageCompleting: true,
    questionMatches: (q, stage) => {
      if (stage !== 'CONFRONT_PIP_FINAL') return false;
      return (
        q.includes('relay') ||
        q.includes('sabotage') ||
        q.includes('parts were used') ||
        q.includes('missing parts') ||
        q.includes('explain') ||
        q.includes('nox saw') ||
        q.includes('carrying') ||
        q.includes('evidence') ||
        q.includes('guilty') ||
        q.includes('confess')
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return (
        lower.includes("don't know how they ended up there") ||
        lower.includes('ended up there') ||
        (lower.includes('took the pouch') && lower.includes('kira')) ||
        (lower.includes('relay') && (lower.includes("didn't") || lower.includes("never") || lower.includes("blaming")))
      );
    }
  },

  // SABOTEUR ACCUSATION (Pip denial: PIP_SABOTEUR_DENIAL)
  {
    id: 'PIP_SABOTEUR_DENIAL',
    characterId: 'pip',
    validStages: ['QUESTION_PIP', 'CONFRONT_PIP_FINAL'],
    fallback: "What? No! I'm just a runner delivering supplies! Why are you blaming me?",
    isStageCompleting: false,
    questionMatches: (q) => {
      return (
        q.includes('saboteur') ||
        q.includes('are you the saboteur') ||
        q.includes('did you sabotage') ||
        q.includes('traitor') ||
        q.includes('are you guilty')
      );
    },
    responseMatches: (r) => {
      const lower = r.toLowerCase();
      return lower.includes('runner delivering supplies') || lower.includes('blaming me');
    }
  }
];

export class CanonicalDialogue {
  public static readonly CANONICAL_INTENTS: StoryFactDefinition[] = STORY_FACTS;

  public static getIntent(
    state: CharacterState,
    rawQuestion: string,
    roundStage?: RoundStage
  ): StoryFactDefinition | null {
    const q = (rawQuestion || '').toLowerCase().trim();
    const charId = state.id.toLowerCase();

    if (roundStage) {
      for (const fact of STORY_FACTS) {
        if (
          fact.characterId === charId &&
          fact.validStages.includes(roundStage) &&
          fact.questionMatches(q, roundStage, state)
        ) {
          return fact;
        }
      }
      return null;
    }

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

  public static getCanonicalFallback(
    state: CharacterState,
    rawQuestion: string,
    roundStage?: RoundStage
  ): string {
    const matched = this.getIntent(state, rawQuestion, roundStage);
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

  public static getAllowedFacts(
    state: CharacterState,
    rawQuestion: string,
    roundStage?: RoundStage
  ): string[] {
    const matched = this.getIntent(state, rawQuestion, roundStage);
    if (matched) {
      return [matched.fallback];
    }

    const fallback = this.getCanonicalFallback(state, rawQuestion, roundStage);
    return [fallback];
  }
}

export interface ChatRequestBody {
  characterState: CharacterState;
  userMessage: string;
  history: ChatMessage[];
  roundStage?: RoundStage;
}

export interface GroundedContext {
  relevantFacts: string[];
  defaultFallback: string;
}

export function getGroundedContext(state: CharacterState, userMessage: string, roundStage?: RoundStage): GroundedContext {
  const defaultFallback = CanonicalDialogue.getCanonicalFallback(state, userMessage, roundStage);
  const relevantFacts = CanonicalDialogue.getAllowedFacts(state, userMessage, roundStage);

  return {
    relevantFacts,
    defaultFallback
  };
}

function buildSystemPrompt(state: CharacterState, relevantFacts: string[]): string {
  return `You are roleplaying as ${state.name}, an ant technician inside COLONY, a futuristic underground ant colony.

CHARACTER PROFILE:
- Name: ${state.name}
- Occupation: ${state.occupation}
- Personality: ${state.personality}
- Location: ${state.currentLocation}

ALLOWED ANSWER FACTS (Use ONLY these grounded facts to answer the question):
${relevantFacts.map(f => `- ${f}`).join('\n')}

RESPONSE CONTRACT:
1. Answer the investigator's question naturally in the first person ("I", "my", "me") using the ALLOWED ANSWER FACTS above.
2. Keep your answer short and concise (1-2 sentences maximum).
3. Do NOT repeat or echo the player's question.
4. Do NOT invent new facts or contradict your character profile.
5. NEVER speak in the third person or describe ${state.name} ("${state.name} is...", "he feels...", "she says...").
6. Do NOT include any meta commentary, thinking, instructions, or notes (e.g. no "Also, note:", no "Note:", no formatting analysis).
7. Output ONLY the spoken dialogue.`;
}

export function cleanAndExtractDialogue(rawText: string): string {
  let text = rawText.trim();
  // 1. Strip <think> tags
  text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Strip speaker prefixes like "Vale:", "Dialogue:", "Response:"
  text = text.replace(/^(dialogue|spoken|response|answer|\w+ says|\w+):\s*/i, '').trim();

  // 3. If quotes exist and contain clean dialogue, extract them
  const quoteMatch = text.match(/["“]([^"”]{4,})["”]/);
  if (quoteMatch && quoteMatch[1] && !isMetaOrReasoning(quoteMatch[1])) {
    return quoteMatch[1].trim();
  }

  // 4. If multiple paragraphs, check if the last paragraph is the actual dialogue
  const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  if (paragraphs.length > 1) {
    const lastP = paragraphs[paragraphs.length - 1];
    if (!isMetaOrReasoning(lastP)) {
      text = lastP;
    }
  }

  // 5. Strip surrounding quotes
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith('“') && text.endsWith('”')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1).trim();
  }

  return text;
}

export function isQuestionEcho(reply: string, userMessage: string): boolean {
  if (!reply || !userMessage) return false;

  const normalize = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  const normReply = normalize(reply);
  const normUser = normalize(userMessage);

  if (!normReply || !normUser) return false;

  // 1. Exact or near-exact match
  if (normReply === normUser) return true;

  // 2. Reply starts with or contains user question and has similar length
  if (normUser.length >= 8) {
    if (normReply.startsWith(normUser) && normReply.length <= normUser.length + 15) {
      return true;
    }
    if (normReply.includes(normUser) && normReply.length <= normUser.length + 20) {
      return true;
    }
  }

  // 3. High word-overlap echo check for question patterns
  const userWords = normUser.split(' ').filter(w => w.length > 2);
  if (userWords.length >= 3) {
    const replyWords = new Set(normReply.split(' ').filter(w => w.length > 2));
    const matchingCount = userWords.filter(w => replyWords.has(w)).length;
    const matchRatio = matchingCount / userWords.length;
    if (matchRatio >= 0.8 && normReply.split(' ').length <= userWords.length + 4) {
      if (/^(did you|why did|who|where|what|how|can you|could you|were you)\b/.test(normReply)) {
        return true;
      }
    }
  }

  return false;
}

export function isMetaOrReasoning(text: string): boolean {
  if (!text || text.length < 2) return true;
  const lower = text.toLowerCase().trim();

  const metaPatterns = [
    // Prefixes & meta notes
    /^(also,?\s*)?(note|notice|keep in mind|remember|reminder|context|clarification|hint|disclaimer)[:\s]/i,
    /^(okay|ok|well|so|now|let's|let us|we need to|i need to|i should|i will|here's|here is)\b/i,

    // Third-person character descriptions & personality commentary
    /\b(rook|vale|mina|pip|kira|nox|the character|the npc|the assistant|the speaker|the investigator|the player)\s+(is|was|will|might|should|would|could|must|can|feels|appears|seems|acts|replies|speaks|answers|wants|tends|is being|says)\b/i,
    /\b(he|she|they)\s+(might|should|would|could|must|will|can|is|was|feels|appears|seems|tends|wants)\b/i,
    /\b(personality|traits|occupation|dossier|backstory|system prompt|system instruction|instructions|prompt)\b/i,
    /\b(reluctant|hesitant|unwilling|guarded)\s+to\b/i,

    // Instruction echoes & commentary
    /\b(previous reply|the user|user is asking|user asks|keep it|respond with|respond as|response should|response would|output only|dialogue only|tight and concise|short and concise|1-2 sentences|brief response)\b/i,
    /\b(analysis|reasoning|internal monologue|thinking process|in-character|roleplay|meta)\b/i,
    /\b(according to|based on)\s+(the|my)?\s*(observations|knowledge|prompt|dossier|rules|character)/i,
    /\bas\s+(vale|rook|mina|pip|kira|nox),/i,
    /\bsince\s+(vale|rook|mina|pip|kira|nox)\s+/i,
    /\bthis follows naturally\b/i,
    /\bto answer the (question|user|investigator)\b/i
  ];

  for (const pattern of metaPatterns) {
    if (pattern.test(lower)) {
      return true;
    }
  }

  return false;
}

async function queryModel(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      temperature: 0.6,
      max_tokens: 120
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string; code?: number | string; type?: string };
  };

  if (data.error) {
    const errMsg = data.error.message || `Error code: ${data.error.code || 'unknown'}`;
    throw new Error(`Upstream error (${data.error.code}): ${errMsg}`);
  }

  const reply = data.choices?.[0]?.message?.content?.trim();
  if (!reply) {
    throw new Error('Received empty response from provider.');
  }

  return reply;
}

export async function handleChatRequest(body: ChatRequestBody): Promise<{ reply: string; isMock?: boolean }> {
  const apiKey = process.env.ANTSEED_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = process.env.ANTSEED_BASE_URL || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.ANTSEED_MODEL || process.env.OPENAI_MODEL || 'antseed';

  const sanitizedEndpoint = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const context = getGroundedContext(body.characterState, body.userMessage);

  console.log(`[AntSeed Server] Dispatching request to: ${sanitizedEndpoint} | Model: ${model} | Character: ${body.characterState?.name}`);

  // Check if real API credentials are configured
  const isPlaceholderOrMissing = !apiKey || apiKey.includes('your_antseed') || apiKey.trim() === '';

  if (isPlaceholderOrMissing) {
    console.log('[AntSeed Server] No credentials detected in .env; utilizing local mock response.');
    return {
      reply: `[DEV MOCK MODE: AntSeed credentials not configured in .env]\n${context.defaultFallback}`,
      isMock: true
    };
  }

  const systemPrompt = buildSystemPrompt(body.characterState, context.relevantFacts);
  const messages = [
    { role: 'system', content: systemPrompt },
    ...(body.history || []).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: body.userMessage }
  ];

  let rawReply = '';
  try {
    rawReply = await queryModel(sanitizedEndpoint, apiKey, model, messages);
  } catch (err: any) {
    console.error(`[AntSeed Server Error] Network/API request failed:`, err.message);
    throw new Error(`Failed to connect to AntSeed at ${sanitizedEndpoint}: ${err.message}`);
  }

  let cleanReply = cleanAndExtractDialogue(rawReply);
  const isInvalid = isMetaOrReasoning(cleanReply) || isQuestionEcho(cleanReply, body.userMessage);

  // Check if response contains meta leakage or question echo
  if (isInvalid) {
    console.warn(`[AntSeed Server Warning] Invalid response detected ("${cleanReply}"). Initiating single retry with strict instruction...`);

    const retryMessages = [
      ...messages,
      { role: 'assistant', content: rawReply },
      {
        role: 'user',
        content: `Return ONLY 1-2 sentences of spoken in-character dialogue answering the question directly. Do NOT repeat or echo the question. Do NOT include notes, analysis, or third-person commentary.`
      }
    ];

    try {
      const retryRaw = await queryModel(sanitizedEndpoint, apiKey, model, retryMessages);
      const retryClean = cleanAndExtractDialogue(retryRaw);
      const retryInvalid = isMetaOrReasoning(retryClean) || isQuestionEcho(retryClean, body.userMessage);

      if (!retryInvalid) {
        console.log(`[AntSeed Server] Retry successful: "${retryClean}"`);
        return { reply: retryClean, isMock: false };
      } else {
        console.warn(`[AntSeed Server Warning] Retry still invalid ("${retryClean}"). Using safe grounded fallback.`);
      }
    } catch (retryErr: any) {
      console.warn(`[AntSeed Server Warning] Retry request failed: ${retryErr.message}. Using safe grounded fallback.`);
    }

    // Safe grounded fallback so meta or echo is NEVER exposed to player
    console.log(`[AntSeed Server] Emitted safe grounded fallback: "${context.defaultFallback}"`);
    return { reply: context.defaultFallback, isMock: false };
  }

  console.log(`[AntSeed Server] Clean response: "${cleanReply}"`);
  return { reply: cleanReply, isMock: false };
}

// Handler for Vercel Serverless Function / Node HTTP
export default async function handler(req: IncomingMessage & { body?: any }, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method Not Allowed' }));
    return;
  }

  try {
    let body: ChatRequestBody;
    if (req.body) {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else if (typeof req[Symbol.asyncIterator] === 'function') {
      let rawBody = '';
      for await (const chunk of req) {
        rawBody += chunk;
      }
      body = JSON.parse(rawBody || '{}');
    } else {
      body = {} as any;
    }

    const result = await handleChatRequest(body);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(result));
  } catch (err: any) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
}
