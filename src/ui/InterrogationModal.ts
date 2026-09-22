import Phaser from 'phaser';
import { CharacterState } from '../types/characterState';
import { DialogueService } from '../services/DialogueService';
import { DialogueSuggestions } from '../services/DialogueSuggestions';
import { CanonicalDialogue, CanonicalIntent } from '../services/CanonicalDialogue';
import { RoundManager } from '../systems/RoundManager';

export class InterrogationModal {
  private state: CharacterState;
  private modalElement: HTMLElement | null = null;
  public isOpen: boolean = false;
  private isWaitingResponse: boolean = false;
  private onCloseCallback: () => void;
  public onLeadDiscovered?: (leadId: string) => void;
  public hasEvidenceRookUnattended: boolean = false;
  private roundManager?: RoundManager;

  constructor(
    _scene: Phaser.Scene, 
    state: CharacterState, 
    onClose: () => void, 
    onLeadDiscovered?: (leadId: string) => void,
    roundManager?: RoundManager
  ) {
    this.state = state;
    this.onCloseCallback = onClose;
    this.onLeadDiscovered = onLeadDiscovered;
    this.roundManager = roundManager;
  }

  public setCharacterState(state: CharacterState): void {
    this.state = state;
  }

  public setRoundManager(roundManager: RoundManager): void {
    this.roundManager = roundManager;
  }

  public isStageActive(): boolean {
    if (!this.roundManager) return true;
    return this.roundManager.getActiveSuspectId() === this.state.id;
  }

  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.createDOMOverlay();
  }

  private createDOMOverlay(): void {
    if (this.modalElement) {
      this.modalElement.remove();
    }

    const getCharColorHex = (id: string) => {
      switch (id) {
        case 'vale': return '#4ade80';
        case 'mina': return '#60a5fa';
        case 'pip': return '#fde047';
        case 'kira': return '#fb923c';
        case 'nox': return '#c084fc';
        case 'rook':
        default: return '#f59e0b';
      }
    };

    const charColorHex = getCharColorHex(this.state.id);
    const charNameUpper = this.state.name.toUpperCase();

    const getGreeting = (id: string) => {
      switch (id) {
        case 'vale': return 'Need something? I was checking the relay conduits.';
        case 'mina': return 'Checking the inventory logs. Do you need something from supply?';
        case 'pip': return 'Hey there! Just running errands and checking the storage tunnels.';
        case 'kira': return 'Monitoring nursery environmental telemetry. What is your status?';
        case 'nox': return 'Larvae chambers are resting. What brings you down here?';
        case 'rook':
        default: return "Need something? I'm keeping an eye on the power grid.";
      }
    };

    const overlay = document.createElement('div');
    overlay.id = 'interrogation-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(8, 5, 3, 0.88);
      backdrop-filter: blur(5px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #e2e8f0;
      user-select: text;
      padding: 10px;
      box-sizing: border-box;
    `;

    overlay.innerHTML = `
      <style>
        .interrogation-card {
          width: 820px;
          max-width: 96vw;
          height: 520px;
          max-height: 92vh;
          background: linear-gradient(145deg, #18110b 0%, #0d0906 100%);
          border: 2px solid #5c3a21;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.9), inset 0 0 20px rgba(92, 58, 33, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .interrogation-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .dossier-panel {
          width: 250px;
          background: rgba(20, 13, 8, 0.95);
          border-right: 1px solid #3d2514;
          padding: 16px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .chat-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: rgba(14, 9, 6, 0.85);
          padding: 14px;
          overflow: hidden;
        }
        @media (max-width: 680px), (max-height: 480px) {
          .interrogation-card {
            height: 96vh;
            max-height: 96vh;
          }
          .dossier-panel {
            width: 140px;
            padding: 8px;
          }
          .dossier-panel canvas {
            width: 64px !important;
            height: 64px !important;
          }
          .dossier-extra {
            display: none !important;
          }
          .chat-panel {
            padding: 8px;
          }
        }
      </style>

      <div class="interrogation-card">
        <!-- Top Header Bar -->
        <div style="
          padding: 10px 16px;
          background: rgba(28, 17, 10, 0.85);
          border-bottom: 1px solid #3d2514;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${charColorHex}; box-shadow: 0 0 8px ${charColorHex};"></span>
            <span style="font-family: Courier, monospace; font-weight: bold; font-size: 12px; color: ${charColorHex}; letter-spacing: 1px;">INVESTIGATION MODE // INTERROGATION</span>
          </div>
          <button id="modal-close-btn" style="
            background: #2b180d;
            border: 1px solid #5c3a21;
            color: #ef4444;
            font-family: monospace;
            font-weight: bold;
            font-size: 12px;
            padding: 4px 10px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.2s;
          ">✕ EXIT [ESC]</button>
        </div>

        <!-- Main Body -->
        <div class="interrogation-body">
          
          <!-- Left Column: Character Dossier & Large Visual -->
          <div class="dossier-panel">
            <div style="
              width: 100px;
              height: 100px;
              border-radius: 50%;
              background: radial-gradient(circle, #3d2514 0%, #120b06 100%);
              border: 2px solid #784c28;
              box-shadow: 0 0 16px rgba(0, 0, 0, 0.8);
              display: flex;
              justify-content: center;
              align-items: center;
              margin-bottom: 10px;
            ">
              <canvas id="char-portrait-canvas" width="90" height="90" style="image-rendering: pixelated;"></canvas>
            </div>

            <h2 style="font-size: 18px; font-weight: 800; color: #e2e8f0; margin: 0 0 2px 0; letter-spacing: 1px;">${charNameUpper}</h2>
            <div style="font-family: Courier, monospace; font-size: 11px; color: ${charColorHex}; font-weight: bold; margin-bottom: 8px;">${this.state.occupation}</div>

            <div class="dossier-extra" style="
              width: 100%;
              background: rgba(35, 22, 13, 0.6);
              border: 1px solid #4a2d19;
              border-radius: 6px;
              padding: 8px;
              font-size: 10px;
              text-align: left;
              color: #94a3b8;
              line-height: 1.35;
              margin-bottom: 8px;
            ">
              <div style="color: #cbd5e1; font-weight: bold; margin-bottom: 2px;">DOSSIER:</div>
              <div>• <b>Sector:</b> ${this.state.currentLocation}</div>
              <div>• <b>Personality:</b> ${this.state.personality}</div>
            </div>

            <div class="dossier-extra" style="margin-top: auto; font-size: 10px; color: #64748b; line-height: 1.2;">
              Answers based on memories & observations.
            </div>
          </div>

          <!-- Right Column: Interactive Chat & Input -->
          <div class="chat-panel">
            <!-- Messages Container -->
            <div id="dialogue-messages" style="
              flex: 1;
              overflow-y: auto;
              display: flex;
              flex-direction: column;
              gap: 10px;
              padding-right: 6px;
              margin-bottom: 10px;
            ">
              <div style="
                align-self: flex-start;
                max-width: 85%;
                background: #23160d;
                border: 1px solid #4a2d19;
                border-radius: 8px 8px 8px 0px;
                padding: 8px 12px;
                font-size: 12px;
                color: #e2e8f0;
                line-height: 1.4;
              ">
                <div style="font-weight: bold; color: ${charColorHex}; font-size: 10px; margin-bottom: 2px;">${charNameUpper}</div>
                <span>${this.formatDialogueText(getGreeting(this.state.id))}</span>
              </div>
            </div>

            <!-- Suggested Quick Questions (Dynamic) -->
            <div id="suggested-questions-container" style="
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
              margin-bottom: 8px;
            "></div>

            <!-- Typing Indicator -->
            <div id="typing-indicator" style="
              display: none;
              font-size: 11px;
              font-family: Courier, monospace;
              color: ${charColorHex};
              margin-bottom: 6px;
              padding-left: 4px;
            ">${this.state.name} is thinking...</div>

            <!-- Free-form Question Input Bar -->
            <form id="question-form" style="display: flex; gap: 8px;">
              <input 
                type="text" 
                id="question-input" 
                placeholder="Ask your own question to ${this.state.name}..." 
                autocomplete="off"
                style="
                  flex: 1;
                  background: #1c110a;
                  border: 1px solid #5c3a21;
                  border-radius: 6px;
                  padding: 8px 12px;
                  font-size: 13px;
                  color: #f8fafc;
                  outline: none;
                "
              />
              <button 
                type="submit" 
                id="ask-btn"
                style="
                  background: #d97706;
                  border: 1px solid #fbbf24;
                  border-radius: 6px;
                  color: #ffffff;
                  font-weight: bold;
                  font-size: 12px;
                  padding: 0 16px;
                  cursor: pointer;
                  min-height: 38px;
                "
              >ASK</button>
            </form>

            <!-- Clean Stage-Complete Controls Container -->
            <div id="stage-complete-container" style="display: none; margin-top: auto;"></div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    this.modalElement = overlay;

    this.drawCharacterPortrait();
    this.renderHistory();
    this.updateBottomControls();

    const form = overlay.querySelector('#question-form') as HTMLFormElement;
    const input = overlay.querySelector('#question-input') as HTMLInputElement;
    const closeBtn = overlay.querySelector('#modal-close-btn') as HTMLButtonElement;

    setTimeout(() => input?.focus(), 50);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const question = input.value.trim();
      if (question && !this.isWaitingResponse) {
        this.submitQuestion(question);
        input.value = '';
      }
    });

    closeBtn.addEventListener('click', () => this.close());
    closeBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.close();
    }, { passive: false });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        this.close();
        window.removeEventListener('keydown', onKeyDown);
      }
    };
    window.addEventListener('keydown', onKeyDown);
  }

  private drawCharacterPortrait(): void {
    const canvas = document.getElementById('char-portrait-canvas') as HTMLCanvasElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 90;
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.translate(size / 2, size / 2 + 4);

    let primaryColor = '#495057';
    let midColor = '#2b2d30';
    let darkColor = '#18191a';
    let accentColor = '#adb5bd';

    if (this.state.id === 'vale') {
      primaryColor = '#2f9e44';
      midColor = '#1e632b';
      darkColor = '#052e16';
      accentColor = '#4ade80';
    } else if (this.state.id === 'mina') {
      primaryColor = '#1971c2';
      midColor = '#0f4c81';
      darkColor = '#0a192f';
      accentColor = '#60a5fa';
    } else if (this.state.id === 'pip') {
      primaryColor = '#d97706';
      midColor = '#92400e';
      darkColor = '#451a03';
      accentColor = '#fde047';
    } else if (this.state.id === 'kira') {
      primaryColor = '#e8590c';
      midColor = '#9a3412';
      darkColor = '#431407';
      accentColor = '#fb923c';
    } else if (this.state.id === 'nox') {
      primaryColor = '#7048e8';
      midColor = '#4c2889';
      darkColor = '#2e1065';
      accentColor = '#c084fc';
    }

    // Antennae
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-5, -14);
    ctx.lineTo(-16, -30);
    ctx.moveTo(5, -14);
    ctx.lineTo(16, -30);
    ctx.stroke();

    ctx.fillStyle = accentColor;
    ctx.beginPath();
    ctx.arc(-16, -30, 2.5, 0, Math.PI * 2);
    ctx.arc(16, -30, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Abdomen
    const gradG = ctx.createRadialGradient(0, 12, 2, 0, 12, 18);
    gradG.addColorStop(0, primaryColor);
    gradG.addColorStop(0.6, midColor);
    gradG.addColorStop(1, darkColor);
    ctx.fillStyle = gradG;
    ctx.beginPath();
    ctx.ellipse(0, 12, 16, 20, 0, 0, Math.PI * 2);
    ctx.fill();

    // Thorax
    const gradT = ctx.createRadialGradient(0, -3, 2, 0, -3, 12);
    gradT.addColorStop(0, primaryColor);
    gradT.addColorStop(0.6, midColor);
    gradT.addColorStop(1, darkColor);
    ctx.fillStyle = gradT;
    ctx.beginPath();
    ctx.ellipse(0, -3, 11, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const gradH = ctx.createRadialGradient(0, -18, 2, 0, -18, 11);
    gradH.addColorStop(0, primaryColor);
    gradH.addColorStop(0.6, midColor);
    gradH.addColorStop(1, darkColor);
    ctx.fillStyle = gradH;
    ctx.beginPath();
    ctx.ellipse(0, -18, 11, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    [-1, 1].forEach(side => {
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.ellipse(side * 6, -18, 3, 5, side * 0.25, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(side * 5.5, -20, 1, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
  }

  private renderHistory(): void {
    const container = document.getElementById('dialogue-messages');
    if (!container) return;

    if (this.state.conversationHistory.length > 0) {
      container.innerHTML = '';
      this.state.conversationHistory.forEach(msg => {
        this.appendMessage(msg.role === 'user' ? 'You' : this.state.name.toUpperCase(), msg.content, msg.role === 'user');
      });
    }
  }

  private updateBottomControls(): void {
    const suggestedContainer = document.getElementById('suggested-questions-container');
    const questionForm = document.getElementById('question-form');
    const stageCompleteContainer = document.getElementById('stage-complete-container');
    const typingIndicator = document.getElementById('typing-indicator');

    if (!suggestedContainer || !questionForm || !stageCompleteContainer) return;

    if (!this.isStageActive()) {
      // Stage is complete! Hide question inputs and show clean stage-complete panel
      suggestedContainer.style.display = 'none';
      questionForm.style.display = 'none';
      if (typingIndicator) typingIndicator.style.display = 'none';
      stageCompleteContainer.style.display = 'block';

      // Determine next lead emphasis if RoundManager has a suspect target
      let nextLeadHtml = '';
      const nextSuspect = this.roundManager?.getActiveSuspectId();
      if (nextSuspect) {
        const charMeta: Record<string, { name: string; color: string; bg: string; border: string }> = {
          rook: { name: 'ROOK', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' },
          vale: { name: 'VALE', color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.4)' },
          mina: { name: 'MINA', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.4)' },
          pip:  { name: 'PIP',  color: '#fde047', bg: 'rgba(253, 224, 71, 0.15)', border: 'rgba(253, 224, 71, 0.4)' },
          kira: { name: 'KIRA', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
          nox:  { name: 'NOX',  color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.4)' }
        };
        const meta = charMeta[nextSuspect.toLowerCase()];
        if (meta) {
          nextLeadHtml = `<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; color: ${meta.color}; background: ${meta.bg}; border: 1px solid ${meta.border}; letter-spacing: 0.5px;">NEW LEAD // ${meta.name}</span>`;
        }
      }

      const currentObj = this.roundManager?.getCurrentObjective();
      const nextObjectiveTitle = currentObj ? currentObj.title : 'Proceed with investigation';

      stageCompleteContainer.innerHTML = `
        <div style="
          background: linear-gradient(135deg, rgba(20, 13, 8, 0.96) 0%, rgba(10, 7, 4, 0.98) 100%);
          border: 1.5px solid #0284c7;
          border-radius: 8px;
          padding: 12px 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.7), inset 0 0 12px rgba(2, 132, 199, 0.15);
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
              <span style="font-family: Courier, monospace; font-size: 13px; font-weight: bold; color: #38bdf8; display: flex; align-items: center; gap: 4px;">
                ✓ STAGE COMPLETE
              </span>
              ${nextLeadHtml}
            </div>
            <button id="exit-interrogation-btn" style="
              background: #0284c7;
              border: 1px solid #38bdf8;
              border-radius: 6px;
              color: #ffffff;
              font-weight: bold;
              font-size: 12px;
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              padding: 8px 18px;
              cursor: pointer;
              display: flex;
              align-items: center;
              gap: 6px;
              transition: all 0.15s;
              box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
            ">
              EXIT INTERROGATION →
            </button>
          </div>
          <div style="font-size: 12px; color: #cbd5e1; line-height: 1.4;">
            Next Objective: <strong style="color: #38bdf8;">${nextObjectiveTitle}</strong>
          </div>
        </div>
      `;

      const exitBtn = stageCompleteContainer.querySelector('#exit-interrogation-btn') as HTMLButtonElement;
      if (exitBtn) {
        exitBtn.addEventListener('click', () => this.close());
        exitBtn.addEventListener('mouseenter', () => {
          exitBtn.style.background = '#0369a1';
          exitBtn.style.borderColor = '#7dd3fc';
        });
        exitBtn.addEventListener('mouseleave', () => {
          exitBtn.style.background = '#0284c7';
          exitBtn.style.borderColor = '#38bdf8';
        });
      }
    } else {
      // Stage is active! Show normal interrogation controls
      stageCompleteContainer.style.display = 'none';
      suggestedContainer.style.display = 'flex';
      questionForm.style.display = 'flex';
      this.renderSuggestedQuestions();
    }
  }

  private renderSuggestedQuestions(): void {
    const container = document.getElementById('suggested-questions-container');
    if (!container) return;

    if (!this.isStageActive()) {
      this.updateBottomControls();
      return;
    }

    const questions = DialogueSuggestions.getSuggestions(this.state, this.roundManager || this.hasEvidenceRookUnattended);

    if (questions.length === 0) {
      container.innerHTML = `
        <div style="width: 100%; font-size: 10px; font-family: Courier, monospace; color: #94a3b8; font-style: italic;">
          (No further suggested leads. Ask your own question below)
        </div>
      `;
      return;
    }

    const getHeaderColor = (id: string) => {
      switch (id) {
        case 'vale': return '#4ade80';
        case 'mina': return '#60a5fa';
        case 'pip': return '#fde047';
        case 'kira': return '#fb923c';
        case 'nox': return '#c084fc';
        case 'rook':
        default: return '#f59e0b';
      }
    };

    const headerColor = getHeaderColor(this.state.id);
    container.innerHTML = `
      <div style="width: 100%; font-size: 10px; font-family: Courier, monospace; color: ${headerColor}; font-weight: bold; margin-bottom: 2px;">
        SUGGESTED QUESTIONS:
      </div>
    `;

    questions.forEach((q) => {
      const btn = document.createElement('button');
      btn.className = 'suggested-q-btn';
      btn.dataset.q = q;
      btn.style.cssText = `
        background: rgba(43, 24, 13, 0.9);
        border: 1px solid #5c3a21;
        border-radius: 6px;
        color: #e2e8f0;
        font-size: 11px;
        padding: 6px 10px;
        cursor: pointer;
        text-align: left;
        transition: all 0.15s;
        line-height: 1.2;
      `;
      btn.textContent = `💬 "${q}"`;

      btn.addEventListener('click', () => {
        if (!this.isWaitingResponse) {
          this.submitQuestion(q);
        }
      });

      btn.addEventListener('mouseenter', () => {
        btn.style.background = '#3d2514';
        btn.style.borderColor = headerColor;
      });
      btn.addEventListener('mouseleave', () => {
        btn.style.background = 'rgba(43, 24, 13, 0.9)';
        btn.style.borderColor = '#5c3a21';
      });

      container.appendChild(btn);
    });
  }

  private currentTurnId: number = 0;
  private currentAbortController: AbortController | null = null;

  private async submitQuestion(question: string): Promise<void> {
    this.appendMessage('You', question, true);

    // If stage is already complete, do NOT spend AntSeed calls
    if (!this.isStageActive()) {
      const currentObjective = this.roundManager?.getCurrentObjective();
      const message = currentObjective
        ? `You have already questioned ${this.state.name}. Next objective: ${currentObjective.title}.`
        : `${this.state.name} is focused on their duties.`;
      this.appendMessage(
        this.state.name.toUpperCase(),
        message,
        false,
        false
      );
      this.updateBottomControls();
      return;
    }

    // Advance turn ID and abort previous turn if any
    this.currentTurnId++;
    const turnId = this.currentTurnId;
    if (this.currentAbortController) {
      try {
        this.currentAbortController.abort();
      } catch {}
    }
    const abortController = new AbortController();
    this.currentAbortController = abortController;

    // Record user message in local character history
    this.state.conversationHistory.push({
      role: 'user',
      content: question,
      timestamp: Date.now()
    });

    const typing = document.getElementById('typing-indicator');
    const input = document.getElementById('question-input') as HTMLInputElement | null;
    const askBtn = document.getElementById('ask-btn') as HTMLButtonElement | null;
    const suggestedBtns = document.querySelectorAll('.suggested-q-btn') as NodeListOf<HTMLButtonElement>;

    if (typing) {
      typing.textContent = `${this.state.name} is thinking...`;
      typing.style.display = 'block';
    }
    if (input) {
      input.disabled = true;
      input.placeholder = `${this.state.name} is thinking...`;
    }
    if (askBtn) {
      askBtn.disabled = true;
      askBtn.style.opacity = '0.5';
      askBtn.style.cursor = 'not-allowed';
    }
    suggestedBtns.forEach((b) => {
      b.disabled = true;
      b.style.pointerEvents = 'none';
      b.style.opacity = '0.5';
    });

    this.isWaitingResponse = true;

    // ==============================================================
    // 3-SECOND DETERMINISTIC DEADLINE RACE
    // AntSeed has up to 3000ms to return a valid grounded response.
    // If it takes longer than 3000ms or fails validation/errors,
    // the canonical fallback is immediately applied.
    // Late responses are permanently discarded.
    // ==============================================================
    let turnResolved = false;
    let timeoutHandle: any = null;

    const matchedIntent = CanonicalDialogue.getIntent(this.state, question, this.roundManager);

    const finalizeTurn = (replyText: string, intent: CanonicalIntent | null, isError: boolean = false) => {
      if (turnResolved || this.currentTurnId !== turnId) {
        // Discard stale or duplicate resolution
        return;
      }
      turnResolved = true;
      if (timeoutHandle) clearTimeout(timeoutHandle);

      // Record winning response in conversation history
      this.state.conversationHistory.push({
        role: 'assistant',
        content: replyText,
        timestamp: Date.now()
      });

      if (typing) typing.style.display = 'none';
      if (input) {
        input.disabled = false;
        input.placeholder = `Ask your own question to ${this.state.name}...`;
        input.focus();
      }
      if (askBtn) {
        askBtn.disabled = false;
        askBtn.style.opacity = '1';
        askBtn.style.cursor = 'pointer';
      }
      suggestedBtns.forEach((b) => {
        b.disabled = false;
        b.style.pointerEvents = 'auto';
        b.style.opacity = '1';
      });

      this.isWaitingResponse = false;
      this.appendMessage(this.state.name.toUpperCase(), replyText, false, isError);

      // Process story lead discovery strictly on the displayed response and matched intent
      this.processLeadDiscovery(replyText, intent);
      this.updateBottomControls();
    };

    // 3000ms Timer: Triggers canonical fallback if AntSeed is still pending
    timeoutHandle = setTimeout(() => {
      if (!turnResolved && this.currentTurnId === turnId) {
        console.log(`[InterrogationModal] 3000ms deadline reached for ${this.state.name}. Applying canonical fallback.`);
        try {
          abortController.abort();
        } catch {}
        const fallback = matchedIntent?.fallback || CanonicalDialogue.getCanonicalFallback(this.state, question, this.roundManager);
        finalizeTurn(fallback, matchedIntent, false);
      }
    }, 3000);

    // AntSeed Request Execution
    try {
      const response = await DialogueService.askCharacter(this.state, question, abortController.signal);

      if (!turnResolved && this.currentTurnId === turnId) {
        const cleanReply = response.reply?.trim() || '';
        const isValid = response.success && cleanReply.length > 0 && !cleanReply.includes('seems distracted');

        if (isValid) {
          console.log(`[InterrogationModal] AntSeed responded within deadline for ${this.state.name}.`);
          finalizeTurn(cleanReply, matchedIntent, false);
        } else {
          console.warn(`[InterrogationModal] AntSeed response invalid or failed for ${this.state.name}. Applying canonical fallback.`);
          const fallback = matchedIntent?.fallback || CanonicalDialogue.getCanonicalFallback(this.state, question, this.roundManager);
          finalizeTurn(fallback, matchedIntent, false);
        }
      }
    } catch (err: any) {
      if (!turnResolved && this.currentTurnId === turnId) {
        console.warn(`[InterrogationModal] Request exception for ${this.state.name}:`, err.message);
        const fallback = matchedIntent?.fallback || CanonicalDialogue.getCanonicalFallback(this.state, question, this.roundManager);
        finalizeTurn(fallback, matchedIntent, false);
      }
    }
  }

  private processLeadDiscovery(replyText: string, intent?: CanonicalIntent | null): void {
    const prevStage = this.roundManager?.getStage();
    let discoveredFact: CanonicalIntent | null = null;

    if (intent) {
      discoveredFact = intent;
    } else {
      const currentStage = this.roundManager?.getStage();
      for (const fact of CanonicalDialogue.CANONICAL_INTENTS) {
        if (fact.characterId === this.state.id.toLowerCase() && fact.leadId) {
          if (!currentStage || fact.validStages.includes(currentStage)) {
            if (fact.responseMatches(replyText)) {
              discoveredFact = fact;
              break;
            }
          }
        }
      }
    }

    if (discoveredFact) {
      console.log(`[COLONY] fact: ${discoveredFact.id}`);
      if (discoveredFact.leadId && this.onLeadDiscovered) {
        this.onLeadDiscovered(discoveredFact.leadId);
        const newStage = this.roundManager?.getStage();
        if (discoveredFact.isStageCompleting) {
          if (newStage !== prevStage) {
            console.log(`[COLONY] stage: ${prevStage} -> ${newStage}`);
            console.log(`[COLONY] objective: ${this.roundManager?.getCurrentObjective().title}`);
            console.log(`[COLONY] target: ${this.roundManager?.getActiveSuspectId() || 'none (world target)'}`);
            console.log(`[COLONY] HUD synchronized`);
          } else {
            console.error(`[COLONY ERROR] Stage transition failed! Current stage: ${prevStage}, Fact: ${discoveredFact.id}, Lead: ${discoveredFact.leadId}, Expected new stage but remained on ${prevStage}`);
          }
        }
      }
    }
  }

  private formatDialogueText(rawText: string): string {
    const escaped = this.escapeHtml(rawText);
    const charMeta: Record<string, { color: string; bg: string; border: string }> = {
      rook: { color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.4)' },
      vale: { color: '#4ade80', bg: 'rgba(74, 222, 128, 0.15)', border: 'rgba(74, 222, 128, 0.4)' },
      mina: { color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)', border: 'rgba(96, 165, 250, 0.4)' },
      pip:  { color: '#fde047', bg: 'rgba(253, 224, 71, 0.15)', border: 'rgba(253, 224, 71, 0.4)' },
      kira: { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.15)', border: 'rgba(251, 146, 60, 0.4)' },
      nox:  { color: '#c084fc', bg: 'rgba(192, 132, 252, 0.15)', border: 'rgba(192, 132, 252, 0.4)' }
    };

    return escaped.replace(/\b(rook|vale|mina|pip|kira|nox)\b/gi, (matched) => {
      const meta = charMeta[matched.toLowerCase()];
      if (!meta) return matched;
      return `<span style="display: inline-block; padding: 1px 6px; margin: 0 2px; border-radius: 4px; font-weight: 600; font-size: 0.95em; vertical-align: baseline; color: ${meta.color}; background: ${meta.bg}; border: 1px solid ${meta.border};">${matched}</span>`;
    });
  }

  private appendMessage(sender: string, text: string, isPlayer: boolean, isError: boolean = false): void {
    const container = document.getElementById('dialogue-messages');
    if (!container) return;

    const getCharColorHex = (id: string) => {
      switch (id) {
        case 'vale': return '#4ade80';
        case 'mina': return '#60a5fa';
        case 'pip': return '#fde047';
        case 'kira': return '#fb923c';
        case 'nox': return '#c084fc';
        case 'rook':
        default: return '#f59e0b';
      }
    };

    const charColor = getCharColorHex(this.state.id);
    const senderColor = isPlayer ? '#93c5fd' : isError ? '#f87171' : charColor;

    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
      align-self: ${isPlayer ? 'flex-end' : 'flex-start'};
      max-width: 85%;
      background: ${isPlayer ? '#1e3a8a' : isError ? '#450a0a' : '#23160d'};
      border: 1px solid ${isPlayer ? '#3b82f6' : isError ? '#ef4444' : '#4a2d19'};
      border-radius: ${isPlayer ? '8px 8px 0px 8px' : '8px 8px 8px 0px'};
      padding: 8px 12px;
      font-size: 12px;
      color: #f8fafc;
      line-height: 1.4;
      word-break: break-word;
      white-space: pre-wrap;
    `;

    msgDiv.innerHTML = `
      <div style="font-weight: bold; color: ${senderColor}; font-size: 10px; margin-bottom: 2px;">${sender.toUpperCase()}</div>
      <div>${this.formatDialogueText(text)}</div>
    `;

    container.appendChild(msgDiv);
    container.scrollTop = container.scrollHeight;
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    this.currentTurnId++;
    if (this.currentAbortController) {
      try {
        this.currentAbortController.abort();
      } catch {}
      this.currentAbortController = null;
    }

    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }

    this.onCloseCallback();
  }
}
