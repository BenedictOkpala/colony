import { RoundStage, ObjectiveInfo } from '../types/round';
import { StoryFactId, STORY_FACTS } from '../types/storyFacts';

const TILE_SIZE = 32;

export class RoundManager {
  private currentStage: RoundStage = 'DUTIES';
  private incidentTimer: number = 0;
  private readonly incidentTriggerTime: number = 1800; // ~1.8 seconds after round start
  private hasTriggeredIncident: boolean = false;

  private secondSabotageTimer: number = 0;
  private isWaitingSecondSabotage: boolean = false;
  private readonly secondSabotageDelay: number = 3500; // ~3.5 seconds after Kira reveals undelivered parts

  public hasLeadValeNearGenerator: boolean = false;
  public hasEvidenceRookUnattended: boolean = false;
  public hasLeadConduitNoise: boolean = false;
  public hasEvidenceDamagedRelay: boolean = false;
  public hasEvidenceRelayMissing: boolean = false;
  public hasLeadPipPouch: boolean = false;
  public hasLeadKiraRequest: boolean = false;
  public hasEvidencePipUndelivered: boolean = false;
  public hasEvidenceRelaySabotage: boolean = false;
  public hasEvidenceNoxPouch: boolean = false;
  public hasEvidenceGatheredComplete: boolean = false;

  public onStageChanged?: (newStage: RoundStage, objective: ObjectiveInfo) => void;
  public onIncidentTriggered?: () => void;
  public onRelaySabotageTriggered?: () => void;
  public onLeadDiscovered?: (leadId: string, title: string, subtitle: string) => void;

  constructor() {
    this.currentStage = 'DUTIES';
  }

  public start(): void {
    this.currentStage = 'DUTIES';
    this.hasTriggeredIncident = false;
    this.incidentTimer = 0;
    this.secondSabotageTimer = 0;
    this.isWaitingSecondSabotage = false;
    this.hasLeadValeNearGenerator = false;
    this.hasEvidenceRookUnattended = false;
    this.hasLeadConduitNoise = false;
    this.hasEvidenceDamagedRelay = false;
    this.hasEvidenceRelayMissing = false;
    this.hasLeadPipPouch = false;
    this.hasLeadKiraRequest = false;
    this.hasEvidencePipUndelivered = false;
    this.hasEvidenceRelaySabotage = false;
    this.hasEvidenceNoxPouch = false;
    this.hasEvidenceGatheredComplete = false;
    this.emitObjective();
  }

  public discoverFact(factId: StoryFactId): void {
    const fact = STORY_FACTS.find(f => f.id === factId);
    if (fact && fact.leadId) {
      this.discoverLead(fact.leadId);
    }
  }

  public getDiscoveredEvidence(): string[] {
    const evidence: string[] = [];
    if (this.hasEvidenceRookUnattended) {
      evidence.push("Rook's station was unattended.");
    }
    if (this.hasEvidenceDamagedRelay) {
      evidence.push("A Relay component was used to lure Rook away.");
    }
    if (this.hasEvidenceRelayMissing) {
      evidence.push("Replacement components went missing from storage.");
    }
    if (this.hasLeadPipPouch) {
      evidence.push("Pip left storage carrying a maintenance pouch.");
    }
    if (this.hasEvidencePipUndelivered) {
      evidence.push("Kira requested equipment, but Pip never delivered it.");
    }
    if (this.hasEvidenceRelaySabotage) {
      evidence.push("Missing maintenance equipment was used in the Relay sabotage.");
    }
    if (this.hasEvidenceNoxPouch) {
      evidence.push("An unidentified ant carrying a maintenance pouch was seen after the Generator incident.");
    }
    return evidence;
  }

  public update(delta: number, _playerX: number, _playerY: number, currentRoomId: string | null): void {
    if (this.currentStage === 'DUTIES' && !this.hasTriggeredIncident) {
      this.incidentTimer += delta;
      if (this.incidentTimer >= this.incidentTriggerTime) {
        this.triggerPowerFailure();
      }
    } else if (this.currentStage === 'POWER_FAILURE') {
      // Check if player reached Generator Room
      if (currentRoomId === 'generator') {
        this.setStage('INVESTIGATE_GENERATOR');
      }
    }

    if (this.isWaitingSecondSabotage) {
      this.secondSabotageTimer += delta;
      if (this.secondSabotageTimer >= this.secondSabotageDelay) {
        this.triggerRelaySabotage();
      }
    }
  }

  private triggerPowerFailure(): void {
    this.hasTriggeredIncident = true;
    this.currentStage = 'POWER_FAILURE';

    if (this.onIncidentTriggered) {
      this.onIncidentTriggered();
    }

    this.emitObjective();
  }

  private triggerRelaySabotage(): void {
    this.isWaitingSecondSabotage = false;
    this.currentStage = 'RELAY_SABOTAGE';

    if (this.onRelaySabotageTriggered) {
      this.onRelaySabotageTriggered();
    }

    this.emitObjective();
  }

  public onTalkedToRook(): void {
    if (this.currentStage === 'INVESTIGATE_GENERATOR' || this.currentStage === 'POWER_FAILURE') {
      this.setStage('QUESTION_ROOK');
    }
  }

  public discoverLead(leadId: string): void {
    if (leadId === 'lead_vale_near_generator' && !this.hasLeadValeNearGenerator) {
      this.hasLeadValeNearGenerator = true;
      this.setStage('QUESTION_VALE');
      if (this.onLeadDiscovered) {
        this.onLeadDiscovered('lead_vale_near_generator', 'LEAD DISCOVERED', 'Vale was seen near the Generator');
      }
    } else if (leadId === 'evidence_rook_unattended' && !this.hasEvidenceRookUnattended) {
      this.hasEvidenceRookUnattended = true;
      this.setStage('CONFRONT_ROOK');
      if (this.onLeadDiscovered) {
        this.onLeadDiscovered('evidence_rook_unattended', 'CONTRADICTION FOUND', "Rook's station was unattended");
      }
    } else if (leadId === 'lead_conduit_noise' && !this.hasLeadConduitNoise) {
      this.hasLeadConduitNoise = true;
      this.setStage('INSPECT_CONDUIT');
      if (this.onLeadDiscovered) {
        this.onLeadDiscovered('lead_conduit_noise', 'LEAD RECORDED', 'Rook admitted checking conduit noise');
      }
    } else if (leadId === 'evidence_damaged_relay' && !this.hasEvidenceDamagedRelay) {
      this.hasEvidenceDamagedRelay = true;
      this.setStage('ASK_VALE_RELAY');
      if (this.onLeadDiscovered) {
        this.onLeadDiscovered('evidence_damaged_relay', 'EVIDENCE DISCOVERED', 'Damaged relay component found in conduit');
      }
    } else if (leadId === 'evidence_relay_missing' && !this.hasEvidenceRelayMissing) {
      this.hasEvidenceRelayMissing = true;
      this.setStage('QUESTION_MINA');
      if (this.onLeadDiscovered) {
        this.onLeadDiscovered('evidence_relay_missing', 'EVIDENCE LOGGED', 'Relay components missing from storage');
      }
    } else if (leadId === 'lead_pip_pouch' && !this.hasLeadPipPouch) {
      this.hasLeadPipPouch = true;
      this.setStage('QUESTION_PIP');
      if (this.onLeadDiscovered) {
        this.onLeadDiscovered('lead_pip_pouch', 'LEAD DISCOVERED', 'Pip was seen carrying a maintenance pouch');
      }
    } else if (leadId === 'lead_kira_request' && !this.hasLeadKiraRequest) {
      this.hasLeadKiraRequest = true;
      this.setStage('VERIFY_KIRA');
      if (this.onLeadDiscovered) {
        this.onLeadDiscovered('lead_kira_request', 'LEAD RECORDED', 'Pip claims Kira ordered repair equipment');
      }
    } else if (leadId === 'evidence_pip_undelivered' && !this.hasEvidencePipUndelivered) {
      this.hasEvidencePipUndelivered = true;
      this.setStage('EQUIPMENT_UNACCOUNTED');
      this.isWaitingSecondSabotage = true;
      this.secondSabotageTimer = 0;
      if (this.onLeadDiscovered) {
        this.onLeadDiscovered('evidence_pip_undelivered', 'EVIDENCE FOUND', 'EQUIPMENT NEVER DELIVERED');
      }
    } else if (leadId === 'evidence_relay_sabotage' && !this.hasEvidenceRelaySabotage) {
      this.hasEvidenceRelaySabotage = true;
      this.setStage('QUESTION_NOX');
      if (this.onLeadDiscovered) {
        this.onLeadDiscovered('evidence_relay_sabotage', 'EVIDENCE FOUND', 'MISSING MAINTENANCE COMPONENT');
      }
    } else if (leadId === 'evidence_nox_pouch' && !this.hasEvidenceNoxPouch) {
      this.hasEvidenceNoxPouch = true;
      this.setStage('CONFRONT_PIP_FINAL');
      if (this.onLeadDiscovered) {
        this.onLeadDiscovered('evidence_nox_pouch', 'EVIDENCE FOUND', 'UNKNOWN ANT CARRYING MAINTENANCE POUCH');
      }
    } else if (leadId === 'evidence_gathered_complete' && !this.hasEvidenceGatheredComplete) {
      this.hasEvidenceGatheredComplete = true;
      this.setStage('INVESTIGATION_COMPLETE');
      if (this.onLeadDiscovered) {
        this.onLeadDiscovered('evidence_gathered_complete', 'INVESTIGATION COMPLETE', 'CALL AN EMERGENCY MEETING');
      }
    }
  }

  public setStage(stage: RoundStage): void {
    this.currentStage = stage;
    this.emitObjective();
  }

  public getStage(): RoundStage {
    return this.currentStage;
  }

  public getActiveSuspectId(): string | null {
    switch (this.currentStage) {
      case 'INVESTIGATE_GENERATOR':
      case 'QUESTION_ROOK':
      case 'CONFRONT_ROOK':
        return 'rook';
      case 'QUESTION_VALE':
      case 'ASK_VALE_RELAY':
        return 'vale';
      case 'QUESTION_MINA':
        return 'mina';
      case 'QUESTION_PIP':
      case 'CONFRONT_PIP_FINAL':
        return 'pip';
      case 'VERIFY_KIRA':
        return 'kira';
      case 'QUESTION_NOX':
        return 'nox';
      default:
        return null;
    }
  }

  public getCurrentObjective(): ObjectiveInfo {
    switch (this.currentStage) {
      case 'DUTIES':
        return {
          category: 'COLONY DUTIES',
          title: 'Complete your assigned task',
          progress: '0 / 1',
          isAlert: false,
          targetX: 7.5 * TILE_SIZE,
          targetY: 19 * TILE_SIZE
        };
      case 'POWER_FAILURE':
        return {
          category: 'COLONY ALERT',
          title: 'Go to the Generator Room',
          isAlert: true,
          targetX: 8 * TILE_SIZE,
          targetY: 18 * TILE_SIZE
        };
      case 'INVESTIGATE_GENERATOR':
        return {
          category: 'INVESTIGATION',
          title: 'Question Rook about the power failure',
          isAlert: true,
          targetX: 9.5 * TILE_SIZE,
          targetY: 18 * TILE_SIZE
        };
      case 'QUESTION_ROOK':
        return {
          category: 'INVESTIGATION',
          title: 'Interrogate Rook regarding the blackout',
          isAlert: false,
          targetX: 9.5 * TILE_SIZE,
          targetY: 18 * TILE_SIZE
        };
      case 'QUESTION_VALE':
        return {
          category: 'INVESTIGATION',
          title: 'Find and question Vale',
          isAlert: true,
          targetX: 29 * TILE_SIZE,
          targetY: 19 * TILE_SIZE
        };
      case 'CONFRONT_ROOK':
        return {
          category: 'INVESTIGATION',
          title: 'Confront Rook about leaving his station',
          isAlert: true,
          targetX: 9.5 * TILE_SIZE,
          targetY: 18 * TILE_SIZE
        };
      case 'INSPECT_CONDUIT':
        return {
          category: 'INVESTIGATION',
          title: 'Inspect the conduit near the Generator',
          isAlert: true,
          targetX: 12 * TILE_SIZE,
          targetY: 17.5 * TILE_SIZE
        };
      case 'ASK_VALE_RELAY':
        return {
          category: 'INVESTIGATION',
          title: 'Ask Vale about the relay component',
          isAlert: true,
          targetX: 29 * TILE_SIZE,
          targetY: 19 * TILE_SIZE
        };
      case 'QUESTION_MINA':
        return {
          category: 'INVESTIGATION',
          title: 'Question Mina in the Bio-Lab',
          isAlert: true,
          targetX: 42 * TILE_SIZE,
          targetY: 6 * TILE_SIZE
        };
      case 'QUESTION_PIP':
        return {
          category: 'INVESTIGATION',
          title: 'Question Pip about the maintenance pouch',
          isAlert: true,
          targetX: 9 * TILE_SIZE,
          targetY: 6 * TILE_SIZE
        };
      case 'VERIFY_KIRA':
        return {
          category: 'INVESTIGATION',
          title: 'Verify request with Kira in Comms',
          isAlert: true,
          targetX: 42 * TILE_SIZE,
          targetY: 17 * TILE_SIZE
        };
      case 'EQUIPMENT_UNACCOUNTED':
        return {
          category: 'INVESTIGATION',
          title: 'Determine what happened to the missing equipment',
          isAlert: true
        };
      case 'RELAY_SABOTAGE':
      case 'INSPECT_RELAY':
        return {
          category: 'INVESTIGATION',
          title: 'Go to the Pheromone Relay',
          isAlert: true,
          targetX: 43 * TILE_SIZE,
          targetY: 19 * TILE_SIZE
        };
      case 'QUESTION_NOX':
        return {
          category: 'INVESTIGATION',
          title: 'Question Nox',
          isAlert: true,
          targetX: 26 * TILE_SIZE,
          targetY: 32 * TILE_SIZE
        };
      case 'CONFRONT_PIP_FINAL':
        return {
          category: 'INVESTIGATION',
          title: 'Confront Pip',
          isAlert: true,
          targetX: 9 * TILE_SIZE,
          targetY: 6 * TILE_SIZE
        };
      case 'INVESTIGATION_COMPLETE':
        return {
          category: 'INVESTIGATION COMPLETE',
          title: 'Call an emergency meeting',
          isAlert: true,
          targetX: 26 * TILE_SIZE,
          targetY: 18 * TILE_SIZE
        };
      case 'CASE_RESOLVED':
      case 'POST_INTERROGATION':
        return {
          category: 'INVESTIGATION',
          title: 'Power failure investigated // Strange conduit noise noted',
          isAlert: false
        };
    }
  }

  public getTargetRoomId(): string | null {
    switch (this.currentStage) {
      case 'DUTIES':
      case 'POWER_FAILURE':
      case 'INVESTIGATE_GENERATOR':
      case 'QUESTION_ROOK':
      case 'CONFRONT_ROOK':
      case 'INSPECT_CONDUIT':
        return 'generator';
      case 'QUESTION_VALE':
      case 'ASK_VALE_RELAY':
        return 'hub';
      case 'QUESTION_MINA':
        return 'biolab';
      case 'QUESTION_PIP':
      case 'CONFRONT_PIP_FINAL':
        return 'food_storage';
      case 'VERIFY_KIRA':
      case 'RELAY_SABOTAGE':
      case 'INSPECT_RELAY':
        return 'comms';
      case 'QUESTION_NOX':
        return 'nursery';
      case 'INVESTIGATION_COMPLETE':
        return 'hub';
      default:
        return null;
    }
  }

  private emitObjective(): void {
    if (this.onStageChanged) {
      this.onStageChanged(this.currentStage, this.getCurrentObjective());
    }
  }
}
