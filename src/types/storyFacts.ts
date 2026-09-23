import { RoundStage } from './round';
import { CharacterState } from './characterState';

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
  characterId: string; // 'rook' | 'vale' | 'mina' | 'pip' | 'kira' | 'nox' | 'world'
  validStages: RoundStage[];
  fallback: string;
  leadId?: string;
  isStageCompleting: boolean;
  questionMatches: (q: string, stage: RoundStage, state?: CharacterState) => boolean;
  responseMatches: (r: string) => boolean;
}

export const STORY_FACTS: StoryFactDefinition[] = [
  // ----------------------------------------------------
  // 1. ROOK FIRST INTERROGATION
  // Fact: ROOK_SAW_VALE
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 2. VALE FIRST INTERROGATION (Context)
  // Fact: VALE_ROUTE_CONTEXT
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 2. VALE FIRST INTERROGATION (Contradiction)
  // Fact: VALE_ROOK_STATION_EMPTY
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 3. ROOK SECOND INTERROGATION (Confrontation)
  // Fact: ROOK_CONDUIT_NOISE
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 4. CONDUIT INSPECTION (World Evidence)
  // Fact: CONDUIT_RELAY_COMPONENT
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 5. VALE SECOND INTERROGATION (Component Recognition)
  // Fact: VALE_RELAY_COMPONENT_RECOGNIZED
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 5. VALE SECOND INTERROGATION (Missing Components / Mina)
  // Fact: VALE_MISSING_COMPONENTS
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 6. MINA INTERROGATION
  // Fact: MINA_PIP_POUCH
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 7. PIP FIRST INTERROGATION
  // Fact: PIP_KIRA_REQUEST
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 8. KIRA INTERROGATION (Confirm Request)
  // Fact: KIRA_CONFIRMS_REQUEST
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 8. KIRA INTERROGATION (Never Delivered)
  // Fact: KIRA_NO_DELIVERY
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 10. RELAY INSPECTION (World Evidence)
  // Fact: RELAY_MISSING_COMPONENT
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 11. NOX INTERROGATION
  // Fact: NOX_POUCH_SIGHTING
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 12. PIP FINAL CONFRONTATION (Lost Pouch Excuse)
  // Fact: PIP_LOST_POUCH_EXCUSE
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // 12. PIP FINAL CONFRONTATION (Relay Sabotage Confrontation)
  // Fact: PIP_FINAL_CONFRONTATION
  // ----------------------------------------------------
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

  // ----------------------------------------------------
  // SABOTEUR ACCUSATION (Pip denial - never confess)
  // Fact: PIP_SABOTEUR_DENIAL
  // ----------------------------------------------------
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
