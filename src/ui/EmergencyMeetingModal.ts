import Phaser from 'phaser';
import { RoundManager } from '../systems/RoundManager';

export interface SuspectOption {
  id: 'rook' | 'mina' | 'pip' | 'vale' | 'nox' | 'kira';
  name: string;
  role: string;
  room: string;
  colorHex: string;
  accentHex: string;
  bgHex: string;
  spriteKey: string;
  primaryColor: string;
  secondaryColor: string;
  highlightColor: string;
}

export const SUSPECTS: SuspectOption[] = [
  {
    id: 'rook',
    name: 'Rook',
    role: 'Chief Engineer',
    room: 'Generator Room',
    colorHex: '#adb5bd',
    accentHex: '#475569',
    bgHex: 'rgba(43, 45, 48, 0.35)',
    spriteKey: 'ant_rook',
    primaryColor: '#2b2d30',
    secondaryColor: '#18191a',
    highlightColor: '#495057'
  },
  {
    id: 'mina',
    name: 'Mina',
    role: 'Biochemist',
    room: 'Bio-Lab',
    colorHex: '#60a5fa',
    accentHex: '#1971c2',
    bgHex: 'rgba(25, 113, 194, 0.2)',
    spriteKey: 'ant_mina',
    primaryColor: '#1971c2',
    secondaryColor: '#0f4c81',
    highlightColor: '#4dabf7'
  },
  {
    id: 'pip',
    name: 'Pip',
    role: 'Supply Runner',
    room: 'Food Storage',
    colorHex: '#fde047',
    accentHex: '#d97706',
    bgHex: 'rgba(217, 119, 6, 0.25)',
    spriteKey: 'ant_pip',
    primaryColor: '#d97706',
    secondaryColor: '#92400e',
    highlightColor: '#fbbf24'
  },
  {
    id: 'vale',
    name: 'Vale',
    role: 'Maintenance Lead',
    room: 'Central Hub',
    colorHex: '#4ade80',
    accentHex: '#2f9e44',
    bgHex: 'rgba(47, 158, 68, 0.2)',
    spriteKey: 'ant_vale',
    primaryColor: '#2f9e44',
    secondaryColor: '#1e632b',
    highlightColor: '#69db7c'
  },
  {
    id: 'nox',
    name: 'Nox',
    role: 'Brood Tender',
    room: 'Nursery',
    colorHex: '#c084fc',
    accentHex: '#7048e8',
    bgHex: 'rgba(112, 72, 232, 0.2)',
    spriteKey: 'ant_nox',
    primaryColor: '#7048e8',
    secondaryColor: '#4c2889',
    highlightColor: '#9775fa'
  },
  {
    id: 'kira',
    name: 'Kira',
    role: 'Communications Specialist',
    room: 'Comms Relay',
    colorHex: '#fb923c',
    accentHex: '#e8590c',
    bgHex: 'rgba(232, 89, 12, 0.2)',
    spriteKey: 'ant_kira',
    primaryColor: '#e8590c',
    secondaryColor: '#9a3412',
    highlightColor: '#ff922b'
  }
];

export class EmergencyMeetingModal {
  private scene: Phaser.Scene;
  private roundManager: RoundManager;
  private onPlayAgain: () => void;
  private modalElement: HTMLElement | null = null;
  public isOpen: boolean = false;
  private selectedSuspectId: string | null = null;
  private animFrameId: number | null = null;

  constructor(scene: Phaser.Scene, roundManager: RoundManager, onPlayAgain: () => void) {
    this.scene = scene;
    this.roundManager = roundManager;
    this.onPlayAgain = onPlayAgain;
  }

  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.selectedSuspectId = null;
    this.renderMeetingView();
  }

  public close(): void {
    this.isOpen = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  private getAntDataUrl(spriteKey: string): string {
    try {
      const tex = this.scene.textures.get(spriteKey);
      if (tex) {
        const src = tex.getSourceImage() as HTMLCanvasElement;
        if (src && typeof src.toDataURL === 'function') {
          return src.toDataURL();
        }
      }
    } catch {
      // Fallback
    }
    return '';
  }

  private renderMeetingView(): void {
    if (this.modalElement) {
      this.modalElement.remove();
    }

    const discoveredEvidence = this.roundManager.getDiscoveredEvidence();

    const overlay = document.createElement('div');
    overlay.id = 'emergency-meeting-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(8, 5, 3, 0.94);
      backdrop-filter: blur(8px);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1200;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      color: #e2e8f0;
      padding: 12px;
      box-sizing: border-box;
      user-select: none;
    `;

    const evidenceHtml = discoveredEvidence.length > 0
      ? discoveredEvidence.map(item => `
          <div class="evidence-item">
            <span class="evidence-dot">▸</span>
            <span class="evidence-text">${item}</span>
          </div>
        `).join('')
      : `<div class="evidence-empty">No discovered evidence logged.</div>`;

    const suspectsHtml = SUSPECTS.map(suspect => {
      const portraitUrl = this.getAntDataUrl(suspect.spriteKey);
      const isSelected = this.selectedSuspectId === suspect.id;
      return `
        <div class="suspect-card ${isSelected ? 'selected' : ''}" data-id="${suspect.id}" style="--char-color: ${suspect.colorHex}; --char-accent: ${suspect.accentHex}; --char-bg: ${suspect.bgHex};">
          <div class="suspect-portrait-frame">
            ${portraitUrl ? `<img src="${portraitUrl}" class="suspect-img" alt="${suspect.name}" />` : `<div class="suspect-dot" style="background: ${suspect.colorHex};"></div>`}
          </div>
          <div class="suspect-info">
            <div class="suspect-name" style="color: ${suspect.colorHex};">${suspect.name}</div>
            <div class="suspect-role">${suspect.role}</div>
            <div class="suspect-room">${suspect.room}</div>
          </div>
          <div class="selected-indicator">SELECTED</div>
        </div>
      `;
    }).join('');

    const selectedSuspect = SUSPECTS.find(s => s.id === this.selectedSuspectId);
    const accuseBtnLabel = selectedSuspect ? `ACCUSE ${selectedSuspect.name.toUpperCase()}` : 'SELECT A SUSPECT';

    overlay.innerHTML = `
      <style>
        #emergency-meeting-card {
          width: 920px;
          max-width: 98vw;
          height: 600px;
          max-height: 96vh;
          background: linear-gradient(145deg, #18110b 0%, #0c0805 100%);
          border: 2px solid #b45309;
          border-radius: 12px;
          box-shadow: 0 16px 50px rgba(0, 0, 0, 0.95), inset 0 0 30px rgba(180, 83, 9, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          position: relative;
        }
        .meeting-header {
          padding: 14px 20px;
          background: linear-gradient(90deg, #2a1408 0%, #170d06 100%);
          border-bottom: 2px solid #b45309;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header-title-block {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .meeting-title {
          font-family: 'Courier New', Courier, monospace;
          font-size: 20px;
          font-weight: 800;
          color: #f59e0b;
          letter-spacing: 2px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .meeting-subtitle {
          font-size: 12px;
          color: #cbd5e1;
          letter-spacing: 0.5px;
        }
        .meeting-tag {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          font-weight: bold;
          color: #ef4444;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid #ef4444;
          padding: 4px 10px;
          border-radius: 4px;
          letter-spacing: 1px;
        }
        .meeting-body {
          display: flex;
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }
        .case-file-panel {
          width: 320px;
          background: rgba(15, 10, 7, 0.75);
          border-right: 1px solid #334155;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
        }
        .section-label {
          font-family: 'Courier New', Courier, monospace;
          font-size: 11px;
          font-weight: bold;
          color: #38bdf8;
          letter-spacing: 1.5px;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 6px;
        }
        .evidence-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
        }
        .evidence-item {
          background: #131b28;
          border: 1px solid #1e293b;
          border-left: 3px solid #0284c7;
          border-radius: 6px;
          padding: 8px 10px;
          font-size: 11px;
          line-height: 1.4;
          color: #e2e8f0;
          display: flex;
          gap: 6px;
        }
        .evidence-dot {
          color: #38bdf8;
          font-weight: bold;
        }
        .evidence-empty {
          font-size: 11px;
          color: #64748b;
          font-style: italic;
          padding: 12px 0;
        }
        .suspects-panel {
          flex: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          overflow-y: auto;
          background: rgba(8, 5, 3, 0.4);
        }
        .suspects-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          flex: 1;
        }
        .suspect-card {
          background: var(--char-bg);
          border: 1.5px solid #334155;
          border-radius: 8px;
          padding: 10px;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          transition: all 0.18s ease;
          position: relative;
          overflow: hidden;
        }
        .suspect-card:hover {
          border-color: var(--char-color);
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
        }
        .suspect-card.selected {
          border-color: var(--char-color);
          border-width: 2.5px;
          background: linear-gradient(180deg, var(--char-bg) 0%, rgba(0, 0, 0, 0.7) 100%);
          box-shadow: 0 0 20px var(--char-accent), inset 0 0 15px rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        .suspect-portrait-frame {
          width: 58px;
          height: 58px;
          border-radius: 50%;
          background: #090604;
          border: 2px solid var(--char-color);
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 8px;
          overflow: hidden;
        }
        .suspect-img {
          width: 72px;
          height: 72px;
          object-fit: contain;
          image-rendering: pixelated;
        }
        .suspect-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .suspect-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .suspect-name {
          font-family: 'Segoe UI', Tahoma, sans-serif;
          font-size: 14px;
          font-weight: bold;
          letter-spacing: 0.5px;
        }
        .suspect-role {
          font-size: 10px;
          color: #cbd5e1;
        }
        .suspect-room {
          font-size: 9px;
          font-family: 'Courier New', Courier, monospace;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .selected-indicator {
          display: none;
          position: absolute;
          top: 4px;
          right: 6px;
          font-size: 8px;
          font-family: 'Courier New', Courier, monospace;
          font-weight: bold;
          color: #ffffff;
          background: #0284c7;
          padding: 2px 5px;
          border-radius: 3px;
        }
        .suspect-card.selected .selected-indicator {
          display: block;
        }
        .meeting-footer {
          padding: 12px 20px;
          background: #0d0805;
          border-top: 1px solid #334155;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        .skip-btn {
          background: #1e293b;
          border: 1.5px solid #475569;
          color: #cbd5e1;
          padding: 10px 22px;
          border-radius: 6px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          font-weight: bold;
          letter-spacing: 1px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .skip-btn:hover {
          background: #334155;
          border-color: #94a3b8;
          color: #ffffff;
        }
        .accuse-btn {
          background: ${selectedSuspect ? '#b45309' : '#1e293b'};
          border: 1.5px solid ${selectedSuspect ? '#f59e0b' : '#334155'};
          color: ${selectedSuspect ? '#ffffff' : '#64748b'};
          padding: 10px 26px;
          border-radius: 6px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 13px;
          font-weight: 800;
          letter-spacing: 1.5px;
          cursor: ${selectedSuspect ? 'pointer' : 'not-allowed'};
          transition: all 0.15s ease;
          box-shadow: ${selectedSuspect ? '0 0 16px rgba(245, 158, 11, 0.4)' : 'none'};
        }
        .accuse-btn:hover {
          ${selectedSuspect ? 'background: #d97706; transform: translateY(-1px); box-shadow: 0 0 24px rgba(245, 158, 11, 0.6);' : ''}
        }
        .confirm-modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.85);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 50;
        }
        .confirm-modal-box {
          background: #140e0a;
          border: 2px solid #f59e0b;
          border-radius: 10px;
          padding: 24px 30px;
          max-width: 440px;
          width: 90%;
          text-align: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.9);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .confirm-title {
          font-family: 'Courier New', Courier, monospace;
          font-size: 14px;
          font-weight: bold;
          color: #f59e0b;
          letter-spacing: 1px;
        }
        .confirm-question {
          font-size: 15px;
          line-height: 1.4;
          color: #ffffff;
        }
        .confirm-actions {
          display: flex;
          justify-content: center;
          gap: 14px;
          margin-top: 8px;
        }
        .btn-confirm {
          background: #b45309;
          border: 1.5px solid #f59e0b;
          color: #ffffff;
          padding: 8px 22px;
          border-radius: 6px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
        }
        .btn-confirm:hover {
          background: #d97706;
        }
        .btn-cancel {
          background: #1e293b;
          border: 1.5px solid #475569;
          color: #cbd5e1;
          padding: 8px 22px;
          border-radius: 6px;
          font-family: 'Courier New', Courier, monospace;
          font-size: 12px;
          font-weight: bold;
          cursor: pointer;
        }
        .btn-cancel:hover {
          background: #334155;
          color: #ffffff;
        }
        @media (max-width: 768px) {
          #emergency-meeting-card {
            height: 96vh;
          }
          .meeting-body {
            flex-direction: column;
          }
          .case-file-panel {
            width: 100%;
            max-height: 130px;
            border-right: none;
            border-bottom: 1px solid #334155;
            padding: 10px;
          }
          .suspects-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }
          .suspect-card {
            padding: 6px;
          }
          .suspect-portrait-frame {
            width: 42px;
            height: 42px;
            margin-bottom: 4px;
          }
          .suspect-img {
            width: 52px;
            height: 52px;
          }
          .suspect-name {
            font-size: 12px;
          }
          .suspect-role {
            font-size: 9px;
          }
        }
      </style>

      <div id="emergency-meeting-card">
        <div class="meeting-header">
          <div class="header-title-block">
            <div class="meeting-title">⚡ EMERGENCY MEETING</div>
            <div class="meeting-subtitle">The colony must decide who caused the sabotages.</div>
          </div>
          <div class="meeting-tag">DECISION PENDING</div>
        </div>

        <div class="meeting-body">
          <div class="case-file-panel">
            <div class="section-label">CASE FILE // EVIDENCE</div>
            <div class="evidence-list">
              ${evidenceHtml}
            </div>
          </div>

          <div class="suspects-panel">
            <div class="section-label">SUSPECT ROSTER // SELECT TO ACCUSE</div>
            <div class="suspects-grid">
              ${suspectsHtml}
            </div>
          </div>
        </div>

        <div class="meeting-footer">
          <button class="skip-btn" id="btn-skip-vote">SKIP VOTE</button>
          <button class="accuse-btn" id="btn-accuse" ${!selectedSuspect ? 'disabled' : ''}>${accuseBtnLabel}</button>
        </div>

        <div id="confirm-container" style="display: none;"></div>
      </div>
    `;

    this.modalElement = overlay;
    document.body.appendChild(overlay);

    // Event listeners
    const suspectCards = overlay.querySelectorAll('.suspect-card');
    suspectCards.forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        if (id) {
          this.selectedSuspectId = id;
          this.renderMeetingView();
        }
      });
    });

    const skipBtn = overlay.querySelector('#btn-skip-vote');
    if (skipBtn) {
      skipBtn.addEventListener('click', () => {
        this.showConfirmation('skip');
      });
    }

    const accuseBtn = overlay.querySelector('#btn-accuse');
    if (accuseBtn && selectedSuspect) {
      accuseBtn.addEventListener('click', () => {
        this.showConfirmation('accuse', selectedSuspect);
      });
    }
  }

  private showConfirmation(type: 'accuse' | 'skip', suspect?: SuspectOption): void {
    if (!this.modalElement) return;
    const confirmContainer = this.modalElement.querySelector('#confirm-container') as HTMLElement;
    if (!confirmContainer) return;

    confirmContainer.style.display = 'block';

    const title = type === 'accuse' && suspect ? `ACCUSE // ${suspect.name.toUpperCase()}` : 'SKIP ACCUSATION';
    const question = type === 'accuse' && suspect
      ? `Accuse ${suspect.name} of sabotaging the colony?`
      : `End the meeting without accusing anyone?`;

    confirmContainer.innerHTML = `
      <div class="confirm-modal-backdrop">
        <div class="confirm-modal-box">
          <div class="confirm-title">${title}</div>
          <div class="confirm-question">${question}</div>
          <div class="confirm-actions">
            <button class="btn-cancel" id="btn-dialog-cancel">CANCEL</button>
            <button class="btn-confirm" id="btn-dialog-confirm">CONFIRM</button>
          </div>
        </div>
      </div>
    `;

    const cancelBtn = confirmContainer.querySelector('#btn-dialog-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        confirmContainer.style.display = 'none';
        confirmContainer.innerHTML = '';
      });
    }

    const confirmBtn = confirmContainer.querySelector('#btn-dialog-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        confirmContainer.style.display = 'none';
        confirmContainer.innerHTML = '';
        if (type === 'accuse' && suspect) {
          this.executeVote(suspect);
        } else {
          this.executeSkip();
        }
      });
    }
  }

  private executeVote(suspect: SuspectOption): void {
    this.renderVoteCastScreen(suspect.name.toUpperCase(), () => {
      if (suspect.id === 'pip') {
        this.renderCorrectEnding();
      } else {
        this.renderWrongEnding(suspect);
      }
    });
  }

  private executeSkip(): void {
    this.renderVoteCastScreen('SKIP VOTE', () => {
      this.renderSkipEnding();
    });
  }

  private renderVoteCastScreen(targetText: string, onComplete: () => void): void {
    if (!this.modalElement) return;

    const card = this.modalElement.querySelector('#emergency-meeting-card');
    if (!card) return;

    card.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100%;
        background: #0a0604;
        gap: 20px;
        padding: 40px;
        text-align: center;
      ">
        <div style="
          font-family: 'Courier New', Courier, monospace;
          font-size: 22px;
          font-weight: 800;
          color: #f59e0b;
          letter-spacing: 3px;
        ">
          VOTE CAST // ${targetText}
        </div>
        <div style="
          font-size: 13px;
          color: #94a3b8;
          letter-spacing: 1px;
        ">
          Tallying colony consensus...
        </div>
        <div style="
          width: 220px;
          height: 3px;
          background: #1e293b;
          border-radius: 2px;
          overflow: hidden;
          margin-top: 10px;
        ">
          <div style="
            width: 100%;
            height: 100%;
            background: #f59e0b;
            animation: progressLine 1.2s ease-in-out forwards;
          "></div>
        </div>
      </div>
      <style>
        @keyframes progressLine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0%); }
        }
      </style>
    `;

    setTimeout(() => {
      onComplete();
    }, 1300);
  }

  private renderCorrectEnding(): void {
    if (!this.modalElement) return;
    const card = this.modalElement.querySelector('#emergency-meeting-card');
    if (!card) return;

    const pip = SUSPECTS.find(s => s.id === 'pip')!;
    const pipUrl = this.getAntDataUrl(pip.spriteKey);

    card.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        height: 100%;
        background: linear-gradient(145deg, #18110b 0%, #0c0805 100%);
        overflow-y: auto;
      ">
        <div style="
          padding: 16px 24px;
          background: linear-gradient(90deg, #451a03 0%, #170d06 100%);
          border-bottom: 2px solid #f59e0b;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 20px;
            font-weight: 800;
            color: #f59e0b;
            letter-spacing: 2px;
          ">
            ⚡ SABOTEUR EXPOSED
          </div>
          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            font-weight: bold;
            color: #4ade80;
            background: rgba(74, 222, 128, 0.15);
            border: 1px solid #4ade80;
            padding: 4px 10px;
            border-radius: 4px;
          ">
            COLONY SECURED
          </div>
        </div>

        <div style="
          flex: 1;
          padding: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 18px;
          max-width: 680px;
          margin: 0 auto;
          text-align: center;
        ">
          <!-- Isolated Suspect Frame -->
          <div style="
            width: 84px;
            height: 84px;
            border-radius: 50%;
            background: #090604;
            border: 3px solid #f59e0b;
            box-shadow: 0 0 25px rgba(245, 158, 11, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
          ">
            ${pipUrl ? `<img src="${pipUrl}" style="width: 100px; height: 100px; object-fit: contain; image-rendering: pixelated;" alt="Pip" />` : ''}
          </div>

          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 18px;
            font-weight: 800;
            color: #fde047;
            letter-spacing: 1.5px;
          ">
            PIP WAS THE SABOTEUR
          </div>

          <!-- Solved Evidence Chain -->
          <div style="
            background: rgba(15, 10, 7, 0.8);
            border: 1px solid #78350f;
            border-radius: 8px;
            padding: 16px 20px;
            text-align: left;
            display: flex;
            flex-direction: column;
            gap: 10px;
            font-size: 13px;
            line-height: 1.5;
            color: #e2e8f0;
          ">
            <div>Pip used Kira's legitimate request to remove maintenance equipment from storage.</div>
            <div>A Relay component was used to lure Rook away from the Generator.</div>
            <div>The missing equipment later appeared in the Pheromone Relay sabotage.</div>
          </div>

          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            font-weight: bold;
            color: #4ade80;
            letter-spacing: 1px;
          ">
            COLONY SECURED
          </div>
        </div>

        <div style="
          padding: 14px 24px;
          background: #0d0805;
          border-top: 1px solid #334155;
          display: flex;
          justify-content: center;
        ">
          <button id="btn-play-again" style="
            background: #059669;
            border: 1.5px solid #34d399;
            color: #ffffff;
            padding: 10px 36px;
            border-radius: 6px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 1.5px;
            cursor: pointer;
            box-shadow: 0 0 16px rgba(16, 185, 129, 0.4);
            transition: all 0.15s ease;
          ">
            PLAY AGAIN
          </button>
        </div>
      </div>
    `;

    const playAgainBtn = card.querySelector('#btn-play-again');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        this.close();
        this.onPlayAgain();
      });
    }
  }

  private renderWrongEnding(suspect: SuspectOption): void {
    if (!this.modalElement) return;
    const card = this.modalElement.querySelector('#emergency-meeting-card');
    if (!card) return;

    card.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        height: 100%;
        background: linear-gradient(145deg, #18110b 0%, #0c0805 100%);
        overflow-y: auto;
      ">
        <div style="
          padding: 16px 24px;
          background: linear-gradient(90deg, #2a1408 0%, #170d06 100%);
          border-bottom: 2px solid #b45309;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 18px;
            font-weight: 800;
            color: #f59e0b;
            letter-spacing: 2px;
          ">
            THE COLONY HAS DECIDED
          </div>
          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            font-weight: bold;
            color: #ef4444;
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid #ef4444;
            padding: 4px 10px;
            border-radius: 4px;
          ">
            CASE FAILED
          </div>
        </div>

        <div style="
          flex: 1;
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          max-width: 620px;
          margin: 0 auto;
          text-align: center;
        ">
          <!-- Animated Bindle Walk Canvas -->
          <div style="
            width: 100%;
            height: 150px;
            background: #0f0906;
            border: 1.5px solid #334155;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.8);
            position: relative;
          ">
            <canvas id="bindle-canvas" width="560" height="150" style="width: 100%; height: 100%;"></canvas>
          </div>

          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 17px;
            font-weight: 800;
            color: #f1f5f9;
            letter-spacing: 1.5px;
          ">
            ${suspect.name.toUpperCase()} WAS INNOCENT
          </div>

          <div style="
            font-size: 13px;
            color: #fca5a5;
            line-height: 1.4;
          ">
            THE SABOTEUR REMAINS IN THE COLONY
          </div>

          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #64748b;
            letter-spacing: 1px;
          ">
            CASE FAILED
          </div>
        </div>

        <div style="
          padding: 14px 24px;
          background: #0d0805;
          border-top: 1px solid #334155;
          display: flex;
          justify-content: center;
        ">
          <button id="btn-play-again" style="
            background: #1e293b;
            border: 1.5px solid #475569;
            color: #ffffff;
            padding: 10px 36px;
            border-radius: 6px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 1.5px;
            cursor: pointer;
            transition: all 0.15s ease;
          ">
            PLAY AGAIN
          </button>
        </div>
      </div>
    `;

    this.startBindleAnimation(suspect);

    const playAgainBtn = card.querySelector('#btn-play-again');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        this.close();
        this.onPlayAgain();
      });
    }
  }

  private startBindleAnimation(suspect: SuspectOption): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    const canvas = this.modalElement?.querySelector('#bindle-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let antX = 40;
    let stepCount = 0;

    const render = () => {
      if (!this.isOpen || !canvas) return;

      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // 1. Dark Subterranean Tunnel Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0c0704');
      bgGrad.addColorStop(0.7, '#190e09');
      bgGrad.addColorStop(1, '#0e0805');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Tunnel floor line
      const floorY = 118;
      ctx.strokeStyle = '#2e1c12';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, floorY);
      ctx.lineTo(w, floorY);
      ctx.stroke();

      // Earth floor texture dots
      ctx.fillStyle = '#21140c';
      for (let i = 0; i < w; i += 28) {
        ctx.fillRect(i + ((i % 5) * 3), floorY + 4 + (i % 6), 6, 2);
      }

      // Update ant position (slow walking forward)
      antX += 0.45;
      if (antX > w + 60) {
        antX = -60;
      }
      stepCount += 0.08;

      const bob = Math.sin(stepCount * 2) * 1.5;
      const antY = floorY - 14 + bob;

      ctx.save();
      ctx.translate(antX, antY);

      // 2. Ant Body (Side View walking right)
      const primary = suspect.primaryColor;
      const secondary = suspect.secondaryColor;
      const highlight = suspect.highlightColor;

      // Legs (Side View 3 visible pairs)
      const legPhase1 = Math.sin(stepCount);
      const legPhase2 = Math.sin(stepCount + Math.PI);

      ctx.strokeStyle = secondary;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';

      // Rear legs
      ctx.beginPath();
      ctx.moveTo(-16, 2);
      ctx.lineTo(-24 + legPhase1 * 6, 14);
      ctx.stroke();

      // Middle legs
      ctx.beginPath();
      ctx.moveTo(-2, 3);
      ctx.lineTo(-2 + legPhase2 * 6, 14);
      ctx.stroke();

      // Front legs
      ctx.beginPath();
      ctx.moveTo(12, 2);
      ctx.lineTo(16 + legPhase1 * 6, 14);
      ctx.stroke();

      // Abdomen / Gaster (Rear)
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.ellipse(-18, -4, 12, 8, -0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Abdomen highlight
      ctx.fillStyle = highlight;
      ctx.beginPath();
      ctx.ellipse(-18, -6, 8, 3, -0.2, 0, Math.PI * 2);
      ctx.fill();

      // Petiole connector
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.ellipse(-6, -2, 3, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Thorax (Middle)
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.ellipse(2, -4, 9, 6, 0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Head (Front facing right)
      ctx.fillStyle = primary;
      ctx.beginPath();
      ctx.ellipse(14, -6, 7, 6, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Eye
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(16, -7, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Drooping sad antenna
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(18, -9);
      ctx.quadraticCurveTo(24, -10, 26, -4);
      ctx.stroke();

      // 3. Stick Over Shoulder Carrying Bindle
      // Wooden stick angled backward over thorax/shoulder
      const stickStartX = 6;
      const stickStartY = -2;
      const stickEndX = -30;
      const stickEndY = -28;

      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(stickStartX, stickStartY);
      ctx.lineTo(stickEndX, stickEndY);
      ctx.stroke();

      // Cloth Bindle Sack hanging from end of stick
      const bindleX = stickEndX + 2;
      const bindleY = stickEndY + 8;

      // Knot ties
      ctx.fillStyle = '#f8fafc';
      ctx.beginPath();
      ctx.arc(stickEndX, stickEndY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Knot ears
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(stickEndX, stickEndY);
      ctx.lineTo(stickEndX - 4, stickEndY - 6);
      ctx.moveTo(stickEndX, stickEndY);
      ctx.lineTo(stickEndX + 3, stickEndY - 5);
      ctx.stroke();

      // Bindle bag pouch (spotted cloth)
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.ellipse(bindleX, bindleY, 8, 9, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Subtle spotted pattern on bindle
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.arc(bindleX - 3, bindleY - 2, 1.2, 0, Math.PI * 2);
      ctx.arc(bindleX + 3, bindleY - 1, 1.2, 0, Math.PI * 2);
      ctx.arc(bindleX, bindleY + 3, 1.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      this.animFrameId = requestAnimationFrame(render);
    };

    this.animFrameId = requestAnimationFrame(render);
  }

  private renderSkipEnding(): void {
    if (!this.modalElement) return;
    const card = this.modalElement.querySelector('#emergency-meeting-card');
    if (!card) return;

    card.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        height: 100%;
        background: linear-gradient(145deg, #18110b 0%, #0c0805 100%);
        overflow-y: auto;
      ">
        <div style="
          padding: 16px 24px;
          background: linear-gradient(90deg, #1e293b 0%, #0f172a 100%);
          border-bottom: 2px solid #475569;
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 18px;
            font-weight: 800;
            color: #cbd5e1;
            letter-spacing: 2px;
          ">
            NO CONSENSUS
          </div>
          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 11px;
            font-weight: bold;
            color: #ef4444;
            background: rgba(239, 68, 68, 0.15);
            border: 1px solid #ef4444;
            padding: 4px 10px;
            border-radius: 4px;
          ">
            CASE FAILED
          </div>
        </div>

        <div style="
          flex: 1;
          padding: 28px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          max-width: 620px;
          margin: 0 auto;
          text-align: center;
        ">
          <div style="
            font-size: 32px;
            margin-bottom: 4px;
          ">
            ⚖️
          </div>

          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 18px;
            font-weight: 800;
            color: #e2e8f0;
            letter-spacing: 1.5px;
          ">
            THE SABOTEUR REMAINS UNIDENTIFIED
          </div>

          <div style="
            font-size: 13px;
            color: #94a3b8;
            line-height: 1.5;
            max-width: 460px;
          ">
            The colony meeting concluded without an accusation. The sabotage investigation remains unresolved.
          </div>

          <div style="
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #ef4444;
            letter-spacing: 1px;
          ">
            CASE FAILED
          </div>
        </div>

        <div style="
          padding: 14px 24px;
          background: #0d0805;
          border-top: 1px solid #334155;
          display: flex;
          justify-content: center;
        ">
          <button id="btn-play-again" style="
            background: #1e293b;
            border: 1.5px solid #475569;
            color: #ffffff;
            padding: 10px 36px;
            border-radius: 6px;
            font-family: 'Courier New', Courier, monospace;
            font-size: 14px;
            font-weight: 800;
            letter-spacing: 1.5px;
            cursor: pointer;
            transition: all 0.15s ease;
          ">
            PLAY AGAIN
          </button>
        </div>
      </div>
    `;

    const playAgainBtn = card.querySelector('#btn-play-again');
    if (playAgainBtn) {
      playAgainBtn.addEventListener('click', () => {
        this.close();
        this.onPlayAgain();
      });
    }
  }
}

