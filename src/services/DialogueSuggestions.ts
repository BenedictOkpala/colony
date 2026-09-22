import { CharacterState } from '../types/characterState';

export interface SuggestedQuestion {
  id: string;
  text: string;
  topic: 'confrontation' | 'alibi' | 'witness' | 'generator' | 'conduct' | 'general' | 'evidence';
  condition?: (state: CharacterState, historyText: string, context?: any) => boolean;
}

const ROOK_QUESTION_POOL: SuggestedQuestion[] = [
  // 1. Stage 2 Confrontation (Unlocked via Vale's revelation)
  {
    id: 'confront_station_empty',
    text: 'Vale says your station was empty. Why?',
    topic: 'confrontation',
    condition: (_state, history, ctx) => {
      const isConfrontation = ctx?.hasEvidenceRookUnattended ?? (typeof ctx === 'boolean' ? ctx : false);
      return isConfrontation && !history.toLowerCase().includes('station was empty') && !history.toLowerCase().includes('stepped away');
    }
  },
  {
    id: 'conduit_noise',
    text: 'What kind of noise was in the conduit?',
    topic: 'conduct',
    condition: (_state, history, ctx) => {
      const isConfrontation = ctx?.hasEvidenceRookUnattended ?? (typeof ctx === 'boolean' ? ctx : false);
      return isConfrontation && (history.toLowerCase().includes('conduit') || history.toLowerCase().includes('noise') || history.toLowerCase().includes('step away')) && !history.toLowerCase().includes('what kind of noise');
    }
  },

  // 2. Stage 1 Inquiries
  {
    id: 'see_anyone',
    text: 'Did you see anyone near the Generator?',
    topic: 'witness',
    condition: (_state, history, ctx) => {
      const isConfrontation = ctx?.hasEvidenceRookUnattended ?? (typeof ctx === 'boolean' ? ctx : false);
      return !isConfrontation && !history.toLowerCase().includes('see anyone') && !history.toLowerCase().includes('pass through');
    }
  },
  {
    id: 'where_were_you',
    text: 'Where were you when the power failed?',
    topic: 'alibi',
    condition: (_state, history, ctx) => {
      const isConfrontation = ctx?.hasEvidenceRookUnattended ?? (typeof ctx === 'boolean' ? ctx : false);
      return !isConfrontation && !history.toLowerCase().includes('where were you') && !history.toLowerCase().includes('station');
    }
  }
];

const VALE_QUESTION_POOL: SuggestedQuestion[] = [
  // 1. Stage 2 Evidence Follow-up (Damaged Relay Component)
  {
    id: 'vale_recognize_component',
    text: 'Do you recognize this component?',
    topic: 'evidence',
    condition: (_state, history, ctx) => {
      const isRelayStage = ctx?.hasEvidenceDamagedRelay ?? false;
      return isRelayStage && !history.toLowerCase().includes('recognize this component') && !history.toLowerCase().includes('replacements in storage');
    }
  },
  {
    id: 'vale_who_access',
    text: 'Who had access to the replacements?',
    topic: 'evidence',
    condition: (_state, history, ctx) => {
      const isRelayStage = ctx?.hasEvidenceDamagedRelay ?? false;
      return isRelayStage && !history.toLowerCase().includes('who had access') && !history.toLowerCase().includes('mina was working');
    }
  },

  // 2. Stage 1 Questions (Generator Blackout & Rook Alibi)
  {
    id: 'vale_why_near_gen',
    text: 'Why were you near the Generator?',
    topic: 'alibi',
    condition: (_state, history, ctx) => {
      const isRelayStage = ctx?.hasEvidenceDamagedRelay ?? false;
      return !isRelayStage && !history.toLowerCase().includes('why were you near') && !history.toLowerCase().includes('relay stations');
    }
  },
  {
    id: 'vale_see_rook',
    text: 'Did you see Rook at his station?',
    topic: 'witness',
    condition: (_state, history, ctx) => {
      const isRelayStage = ctx?.hasEvidenceDamagedRelay ?? false;
      return !isRelayStage && !history.toLowerCase().includes('did you see rook') && !history.toLowerCase().includes('unattended');
    }
  }
];

const MINA_QUESTION_POOL: SuggestedQuestion[] = [
  {
    id: 'mina_see_take_equipment',
    text: 'Did you see anyone take equipment from storage?',
    topic: 'evidence',
    condition: (_state, history) => !history.toLowerCase().includes('take equipment from storage') && !history.toLowerCase().includes('pip leave with a maintenance pouch')
  },
  {
    id: 'mina_pip_pouch',
    text: 'Did Pip check out a maintenance pouch?',
    topic: 'witness',
    condition: (_state, history) => history.toLowerCase().includes('pip') && !history.toLowerCase().includes('check out a maintenance pouch')
  }
];

const PIP_QUESTION_POOL: SuggestedQuestion[] = [
  // 1. Stage 2 Final Confrontation Questions
  {
    id: 'pip_confront_kira_delivery',
    text: 'Kira says you never delivered her equipment. Where did it go?',
    topic: 'confrontation',
    condition: (_state, history, ctx) => {
      const isFinalConfrontation = ctx?.hasEvidenceNoxPouch ?? false;
      return isFinalConfrontation && !history.toLowerCase().includes('never delivered her equipment') && !history.toLowerCase().includes('lost track');
    }
  },
  {
    id: 'pip_confront_relay_sabotage',
    text: 'The missing parts were used to sabotage the Relay. Explain that.',
    topic: 'confrontation',
    condition: (_state, history, ctx) => {
      const isFinalConfrontation = ctx?.hasEvidenceNoxPouch ?? false;
      return isFinalConfrontation && !history.toLowerCase().includes('sabotage the relay') && !history.toLowerCase().includes('how they ended up there');
    }
  },
  {
    id: 'pip_confront_nox_sighting',
    text: 'Nox saw someone carrying a maintenance pouch after the blackout.',
    topic: 'confrontation',
    condition: (_state, history, ctx) => {
      const isFinalConfrontation = ctx?.hasEvidenceNoxPouch ?? false;
      return isFinalConfrontation && !history.toLowerCase().includes('nox saw someone');
    }
  },

  // 2. Stage 1 Inquiries
  {
    id: 'pip_why_pouch',
    text: 'Why did you take a maintenance pouch from storage?',
    topic: 'evidence',
    condition: (_state, history, ctx) => {
      const isFinalConfrontation = ctx?.hasEvidenceNoxPouch ?? false;
      return !isFinalConfrontation && !history.toLowerCase().includes('take a maintenance pouch') && !history.toLowerCase().includes('kira asked me');
    }
  },
  {
    id: 'pip_who_ordered',
    text: 'Who asked you to fetch those parts?',
    topic: 'witness',
    condition: (_state, history, ctx) => {
      const isFinalConfrontation = ctx?.hasEvidenceNoxPouch ?? false;
      return !isFinalConfrontation && !history.toLowerCase().includes('who asked you to fetch') && !history.toLowerCase().includes('kira asked me');
    }
  }
];

const KIRA_QUESTION_POOL: SuggestedQuestion[] = [
  {
    id: 'kira_confirm_request',
    text: 'Did you ask Pip for repair equipment?',
    topic: 'witness',
    condition: (_state, history) => !history.toLowerCase().includes('ask pip for repair equipment') && !history.toLowerCase().includes('asked pip to bring me')
  },
  {
    id: 'kira_did_he_deliver',
    text: 'Did he deliver them?',
    topic: 'confrontation',
    condition: (_state, history) => !history.toLowerCase().includes('did he deliver them') && !history.toLowerCase().includes('never came back with them')
  }
];

const NOX_QUESTION_POOL: SuggestedQuestion[] = [
  {
    id: 'nox_see_tunnels',
    text: 'Did you see anything around the tunnels after the Generator failed?',
    topic: 'witness',
    condition: (_state, history) => !history.toLowerCase().includes('around the tunnels after the generator') && !history.toLowerCase().includes('someone hurried')
  },
  {
    id: 'nox_carrying_pouch',
    text: 'Was the ant you saw carrying anything?',
    topic: 'evidence',
    condition: (_state, history) => !history.toLowerCase().includes('carrying anything') && !history.toLowerCase().includes('maintenance pouch')
  }
];

export class DialogueSuggestions {
  /**
   * Evaluates conversation history and returns at most 1 to 2 dynamic follow-up questions
   */
  public static getSuggestions(state: CharacterState, context?: any): string[] {
    const fullHistoryText = state.conversationHistory
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    let pool: SuggestedQuestion[];
    switch (state.id) {
      case 'vale':
        pool = VALE_QUESTION_POOL;
        break;
      case 'mina':
        pool = MINA_QUESTION_POOL;
        break;
      case 'pip':
        pool = PIP_QUESTION_POOL;
        break;
      case 'kira':
        pool = KIRA_QUESTION_POOL;
        break;
      case 'nox':
        pool = NOX_QUESTION_POOL;
        break;
      case 'rook':
      default:
        pool = ROOK_QUESTION_POOL;
        break;
    }

    const available = pool.filter(q => {
      if (q.condition) {
        return q.condition(state, fullHistoryText, context);
      }
      return true;
    });

    // Pick top 1-2 most relevant questions prioritizing confrontation > evidence > conduct > witness > generator > alibi
    const prioritized = available.sort((a, b) => {
      const priorityScore = (topic: string) => {
        if (topic === 'confrontation') return 12;
        if (topic === 'evidence') return 8;
        if (topic === 'conduct') return 5;
        if (topic === 'witness') return 4;
        if (topic === 'generator') return 2;
        return 1;
      };
      return priorityScore(b.topic) - priorityScore(a.topic);
    });

    // Maximum of 1-2 suggested questions at once
    return prioritized.slice(0, 2).map(q => q.text);
  }
}
