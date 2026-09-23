import Phaser from 'phaser';

export class MissionBriefingModal {
  private scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  public isOpen: boolean = false;
  private backdrop!: Phaser.GameObjects.Rectangle;
  private panelBg!: Phaser.GameObjects.Rectangle;
  private onDismissCallback?: () => void;
  private keyListener?: (event: KeyboardEvent) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(120);
    this.container.setVisible(false);
  }

  public show(onDismiss: () => void): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.onDismissCallback = onDismiss;

    this.container.removeAll(true);
    this.container.setVisible(true);
    this.container.setAlpha(0);

    const cam = this.scene.cameras.main;
    const centerX = cam.width / 2;
    const centerY = cam.height / 2;

    // 1. Dark Vignette Backdrop (blocks clicks through)
    this.backdrop = this.scene.add.rectangle(centerX, centerY, cam.width + 200, cam.height + 200, 0x000000, 0.72);
    this.backdrop.setInteractive();
    this.container.add(this.backdrop);

    // 2. Main Mission Briefing Box
    const boxWidth = Math.min(480, cam.width - 32);
    const boxHeight = 310;

    // Outer glow / accent shadow
    const glowBg = this.scene.add.rectangle(centerX, centerY, boxWidth + 8, boxHeight + 8, 0xef4444, 0.22);
    this.container.add(glowBg);

    // Main Card Panel
    this.panelBg = this.scene.add.rectangle(centerX, centerY, boxWidth, boxHeight, 0x0a0f1d, 0.98);
    this.panelBg.setStrokeStyle(2, 0xef4444, 0.95);
    this.container.add(this.panelBg);

    // 3. Top Header Bar / Badge
    const headerBg = this.scene.add.rectangle(centerX, centerY - boxHeight / 2 + 24, boxWidth - 4, 42, 0x1e1b2e, 0.9);
    this.container.add(headerBg);

    const tagText = this.scene.add.text(centerX, centerY - boxHeight / 2 + 15, '⚠️  COLONY ALERT // POWER GRID COMPROMISED', {
      fontSize: '11px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#f87171'
    });
    tagText.setOrigin(0.5);
    this.container.add(tagText);

    // 4. Main Headline
    const titleText = this.scene.add.text(centerX, centerY - 88, 'GENERATOR FAILURE', {
      fontSize: '22px',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    titleText.setOrigin(0.5);
    this.container.add(titleText);

    // Decorative Accent Line
    const divider = this.scene.add.rectangle(centerX, centerY - 68, boxWidth - 60, 2, 0xef4444, 0.6);
    this.container.add(divider);

    // 5. Lore / Context Description
    const loreText = this.scene.add.text(centerX, centerY - 44, 'Someone sabotaged the colony.', {
      fontSize: '13px',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      fontStyle: 'italic',
      color: '#fca5a5'
    });
    loreText.setOrigin(0.5);
    this.container.add(loreText);

    // 6. Directives Box
    const dirBoxWidth = boxWidth - 50;
    const dirBoxHeight = 84;
    const dirBg = this.scene.add.rectangle(centerX, centerY + 18, dirBoxWidth, dirBoxHeight, 0x0f172a, 0.9);
    dirBg.setStrokeStyle(1, 0x334155, 0.9);
    this.container.add(dirBg);

    const directives = [
      { icon: '⚡', text: 'Restore power.', color: '#fbbf24' },
      { icon: '🔍', text: 'Question the crew.', color: '#38bdf8' },
      { icon: '🎯', text: 'Find the saboteur.', color: '#4ade80' }
    ];

    directives.forEach((dir, i) => {
      const rowY = centerY - 10 + i * 26;
      const rowText = this.scene.add.text(centerX - dirBoxWidth / 2 + 20, rowY, `${dir.icon}  ${dir.text}`, {
        fontSize: '13px',
        fontFamily: 'Segoe UI, Tahoma, sans-serif',
        fontStyle: 'bold',
        color: dir.color
      });
      this.container.add(rowText);
    });

    // 7. Action Button [ INVESTIGATE ]
    const btnY = centerY + 104;
    const btnWidth = 220;
    const btnHeight = 38;

    const btnBg = this.scene.add.rectangle(centerX, btnY, btnWidth, btnHeight, 0x0c1e36, 0.96);
    btnBg.setStrokeStyle(1.5, 0x38bdf8, 0.9);
    btnBg.setInteractive({ useHandCursor: true });
    this.container.add(btnBg);

    const btnText = this.scene.add.text(centerX, btnY, '[  INVESTIGATE  ]', {
      fontSize: '12px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#38bdf8'
    });
    btnText.setOrigin(0.5);
    this.container.add(btnText);

    // Button Hover FX
    btnBg.on('pointerover', () => {
      btnBg.setFillStyle(0x0e2f57, 1);
      btnBg.setStrokeStyle(1.5, 0x00f0ff, 1);
      btnText.setColor('#ffffff');
      btnBg.setScale(1.02);
      btnText.setScale(1.02);
    });
    btnBg.on('pointerout', () => {
      btnBg.setFillStyle(0x0c1e36, 0.96);
      btnBg.setStrokeStyle(1.5, 0x38bdf8, 0.9);
      btnText.setColor('#38bdf8');
      btnBg.setScale(1);
      btnText.setScale(1);
    });

    // Click handler
    btnBg.on('pointerdown', () => {
      this.dismiss();
    });

    // Keyboard listener for SPACE, E, ENTER
    this.keyListener = (e: KeyboardEvent) => {
      if (this.isOpen && (e.code === 'Space' || e.code === 'KeyE' || e.code === 'Enter')) {
        this.dismiss();
      }
    };
    window.addEventListener('keydown', this.keyListener);

    // Fade in animation
    this.scene.tweens.add({
      targets: this.container,
      alpha: 1,
      duration: 350,
      ease: 'Quad.easeOut'
    });
  }

  public dismiss(): void {
    if (!this.isOpen) return;
    this.isOpen = false;

    if (this.keyListener) {
      window.removeEventListener('keydown', this.keyListener);
      this.keyListener = undefined;
    }

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0,
      duration: 250,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.container.setVisible(false);
        if (this.onDismissCallback) {
          this.onDismissCallback();
        }
      }
    });
  }

  public repositionOnResize(): void {
    if (!this.isOpen) return;
    const cam = this.scene.cameras.main;
    const centerX = cam.width / 2;
    const centerY = cam.height / 2;
    if (this.backdrop) {
      this.backdrop.setPosition(centerX, centerY);
      this.backdrop.setSize(cam.width + 200, cam.height + 200);
    }
  }

  public destroy(): void {
    if (this.keyListener) {
      window.removeEventListener('keydown', this.keyListener);
      this.keyListener = undefined;
    }
    this.container.destroy();
  }
}

