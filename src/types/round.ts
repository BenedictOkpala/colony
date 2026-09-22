export type RoundStage = 
  | 'DUTIES'
  | 'POWER_FAILURE'
  | 'INVESTIGATE_GENERATOR'
  | 'QUESTION_ROOK'
  | 'QUESTION_VALE'
  | 'CONFRONT_ROOK'
  | 'INSPECT_CONDUIT'
  | 'ASK_VALE_RELAY'
  | 'QUESTION_MINA'
  | 'QUESTION_PIP'
  | 'VERIFY_KIRA'
  | 'EQUIPMENT_UNACCOUNTED'
  | 'RELAY_SABOTAGE'
  | 'INSPECT_RELAY'
  | 'QUESTION_NOX'
  | 'CONFRONT_PIP_FINAL'
  | 'INVESTIGATION_COMPLETE'
  | 'CASE_RESOLVED'
  | 'POST_INTERROGATION';

export interface ObjectiveInfo {
  category: string;     // e.g. 'COLONY DUTIES' or 'COLONY ALERT' or 'INVESTIGATION'
  title: string;        // e.g. 'Go to the Generator Room'
  progress?: string;    // e.g. '0 / 1'
  isAlert?: boolean;
  targetX?: number;     // World coordinate for optional directional guide
  targetY?: number;
}

