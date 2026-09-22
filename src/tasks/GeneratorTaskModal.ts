import Phaser from 'phaser';

export class GeneratorTaskModal {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;
  public isOpen: boolean = false;
  private switchesState: boolean[] = [false, false, false];
  private switchButtons: Phaser.GameObjects.Rectangle[] = [];
  private switchLabels: Phaser.GameObjects.Text[] = [];
  private statusLights: Phaser.GameObjects.Arc[] = [];
  private activateBtn!: Phaser.GameObjects.Rectangle;
  private activateText!: Phaser.GameObjects.Text;
  private onCompleteCallback: () => void;

  constructor(scene: Phaser.Scene, onComplete: () => void) {
    this.scene = scene;
    this.onCompleteCallback = onComplete;
  }

  public open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.switchesState = [false, false, false];
    this.createUI();
  }

  private createUI(): void {
    const cam = this.scene.cameras.main;
    const centerX = cam.width / 2;
    const centerY = cam.height / 2;

    this.container = this.scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(100);

    // 1. Dark Backdrop
    const backdrop = this.scene.add.rectangle(centerX, centerY, cam.width, cam.height, 0x000000, 0.75);
    backdrop.setInteractive(); // Blocks clicks from passing through
    this.container.add(backdrop);

    // 2. Main Console Box
    const boxWidth = 520;
    const boxHeight = 420;
    const panelBg = this.scene.add.rectangle(centerX, centerY, boxWidth, boxHeight, 0x0f172a, 0.98);
    panelBg.setStrokeStyle(3, 0x00e5ff, 1);
    this.container.add(panelBg);

    // Header bar
    const header = this.scene.add.rectangle(centerX, centerY - boxHeight / 2 + 25, boxWidth - 6, 44, 0x1e293b);
    this.container.add(header);

    const title = this.scene.add.text(
      centerX - boxWidth / 2 + 20,
      centerY - boxHeight / 2 + 16,
      '⚡ GENERATOR CONSOLE // POWER CALIBRATION',
      {
        fontSize: '15px',
        fontFamily: 'Courier, monospace',
        fontStyle: 'bold',
        color: '#00e5ff'
      }
    );
    this.container.add(title);

    // Close Button [X]
    const closeBtnBg = this.scene.add.rectangle(centerX + boxWidth / 2 - 30, centerY - boxHeight / 2 + 22, 44, 34, 0x2b180d, 0.8);
    closeBtnBg.setStrokeStyle(1, 0x5c3a21);
    closeBtnBg.setInteractive({ useHandCursor: true });
    this.container.add(closeBtnBg);

    const closeBtn = this.scene.add.text(centerX + boxWidth / 2 - 30, centerY - boxHeight / 2 + 22, '✕', {
      fontSize: '14px',
      fontFamily: 'monospace',
      fontStyle: 'bold',
      color: '#ef4444'
    });
    closeBtn.setOrigin(0.5);
    this.container.add(closeBtn);

    closeBtnBg.on('pointerdown', () => this.close());
    closeBtnBg.on('pointerover', () => closeBtn.setColor('#ff8888'));
    closeBtnBg.on('pointerout', () => closeBtn.setColor('#ef4444'));
    this.container.add(closeBtn);

    // Instructions
    const instructions = this.scene.add.text(
      centerX,
      centerY - 130,
      'Align all 3 Colony Sub-Grid Capacitors to restore primary generator flow.',
      {
        fontSize: '13px',
        fontFamily: 'Segoe UI, sans-serif',
        color: '#94a3b8',
        align: 'center'
      }
    );
    instructions.setOrigin(0.5);
    this.container.add(instructions);

    // 3 Node Switch Rows
    const nodeNames = ['ALPHA CONDUIT (FOOD SECTOR)', 'BETA CONDUIT (BIO-LAB SECTOR)', 'GAMMA CONDUIT (COMM ARRAY)'];
    this.switchButtons = [];
    this.switchLabels = [];
    this.statusLights = [];

    nodeNames.forEach((name, i) => {
      const rowY = centerY - 65 + i * 55;

      // Row background
      const rowBg = this.scene.add.rectangle(centerX, rowY, 460, 44, 0x1e293b, 0.7);
      rowBg.setStrokeStyle(1, 0x334155);
      this.container.add(rowBg);

      // Status indicator LED
      const light = this.scene.add.circle(centerX - 200, rowY, 7, 0xef4444);
      this.statusLights.push(light);
      this.container.add(light);

      // Node Name Label
      const label = this.scene.add.text(centerX - 180, rowY - 7, name, {
        fontSize: '12px',
        fontFamily: 'Courier, monospace',
        fontStyle: 'bold',
        color: '#e2e8f0'
      });
      this.container.add(label);

      // Toggle Button
      const btn = this.scene.add.rectangle(centerX + 160, rowY, 90, 30, 0x334155);
      btn.setStrokeStyle(1, 0x64748b);
      btn.setInteractive({ useHandCursor: true });
      this.switchButtons.push(btn);
      this.container.add(btn);

      const btnText = this.scene.add.text(centerX + 160, rowY, 'OFFLINE', {
        fontSize: '11px',
        fontFamily: 'Courier, monospace',
        fontStyle: 'bold',
        color: '#ef4444'
      });
      btnText.setOrigin(0.5);
      this.switchLabels.push(btnText);
      this.container.add(btnText);

      btn.on('pointerdown', () => this.toggleSwitch(i));
    });

    // 4. Activate Core Button
    this.activateBtn = this.scene.add.rectangle(centerX, centerY + 135, 260, 46, 0x334155);
    this.activateBtn.setStrokeStyle(2, 0x475569);
    this.container.add(this.activateBtn);

    this.activateText = this.scene.add.text(centerX, centerY + 135, 'LOCKED (3 REQUIRED)', {
      fontSize: '13px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#64748b'
    });
    this.activateText.setOrigin(0.5);
    this.container.add(this.activateText);
  }

  private toggleSwitch(index: number): void {
    this.switchesState[index] = !this.switchesState[index];
    const isOn = this.switchesState[index];

    const light = this.statusLights[index];
    const btn = this.switchButtons[index];
    const text = this.switchLabels[index];

    if (isOn) {
      light.setFillStyle(0x22c55e);
      btn.setFillStyle(0x065f46);
      btn.setStrokeStyle(1, 0x10b981);
      text.setText('ONLINE');
      text.setColor('#34d399');
    } else {
      light.setFillStyle(0xef4444);
      btn.setFillStyle(0x334155);
      btn.setStrokeStyle(1, 0x64748b);
      text.setText('OFFLINE');
      text.setColor('#ef4444');
    }

    this.updateActivationStatus();
  }

  private updateActivationStatus(): void {
    const allOn = this.switchesState.every(s => s);

    if (allOn) {
      this.activateBtn.setFillStyle(0x0284c7);
      this.activateBtn.setStrokeStyle(2, 0x38bdf8);
      this.activateBtn.setInteractive({ useHandCursor: true });
      this.activateText.setText('⚡ RESTORE POWER GRID');
      this.activateText.setColor('#ffffff');

      this.activateBtn.removeAllListeners();
      this.activateBtn.on('pointerdown', () => this.triggerComplete());
      this.activateBtn.on('pointerover', () => this.activateBtn.setFillStyle(0x0369a1));
      this.activateBtn.on('pointerout', () => this.activateBtn.setFillStyle(0x0284c7));
    } else {
      const remaining = this.switchesState.filter(s => !s).length;
      this.activateBtn.setFillStyle(0x334155);
      this.activateBtn.setStrokeStyle(2, 0x475569);
      this.activateBtn.disableInteractive();
      this.activateText.setText(`LOCKED (${remaining} REQUIRED)`);
      this.activateText.setColor('#64748b');
    }
  }

  private triggerComplete(): void {
    this.activateBtn.setFillStyle(0x15803d);
    this.activateText.setText('✓ CALIBRATION SUCCESSFUL!');
    this.activateText.setColor('#4ade80');

    this.scene.time.delayedCall(700, () => {
      this.close();
      this.onCompleteCallback();
    });
  }

  public close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    if (this.container) {
      this.container.destroy();
    }
  }
}

