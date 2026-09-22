import Phaser from 'phaser';
import { AssetGenerator } from '../graphics/AssetGenerator';
import { InputMode } from '../services/InputMode';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  public preload(): void {
    AssetGenerator.generateAll(this);
  }

  public create(): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;
    const centerX = width / 2;
    const centerY = height / 2;

    // Subterranean dark earth background
    const bg = this.add.rectangle(centerX, centerY, width, height, 0x140d08);
    bg.setOrigin(0.5);

    // Subtle warm ambient glow behind title
    const glow = this.add.circle(centerX, centerY - 130, 180, 0xf59e0b, 0.12);
    this.tweens.add({
      targets: glow,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.2,
      duration: 2000,
      yoyo: true,
      repeat: -1
    });

    // Decorative mushroom clusters at bottom corners
    const shroomL = this.add.image(60, height - 50, 'prop_shroom_cyan');
    shroomL.setScale(1.4);
    const shroomR = this.add.image(width - 60, height - 50, 'prop_shroom_cyan');
    shroomR.setScale(1.4);

    // Colony Logo / Title
    const title = this.add.text(centerX, centerY - 145, 'C O L O N Y', {
      fontSize: '52px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#f59e0b'
    });
    title.setOrigin(0.5);
    title.setShadow(0, 0, '#f59e0b', 14);

    const subtitle = this.add.text(
      centerX,
      centerY - 85,
      'SUBTERRANEAN SOCIAL DEDUCTION',
      {
        fontSize: '13px',
        fontFamily: 'Courier, monospace',
        fontStyle: 'bold',
        color: '#94a3b8'
      }
    );
    subtitle.setOrigin(0.5);

    // Line divider
    const divider = this.add.rectangle(centerX, centerY - 60, 420, 2, 0xd97706);
    divider.setOrigin(0.5);

    // Character showcase preview (All 6 named NPCs + Player)
    const previewChars = [
      { key: 'ant_player', label: 'You', color: '#ff4d4f' },
      { key: 'ant_rook', label: 'Rook', color: '#adb5bd' },
      { key: 'ant_mina', label: 'Mina', color: '#60a5fa' },
      { key: 'ant_pip', label: 'Pip', color: '#fde047' },
      { key: 'ant_vale', label: 'Vale', color: '#4ade80' },
      { key: 'ant_nox', label: 'Nox', color: '#c084fc' },
      { key: 'ant_kira', label: 'Kira', color: '#fb923c' }
    ];

    const spacing = 80;
    const startX = centerX - ((previewChars.length - 1) * spacing) / 2;

    previewChars.forEach((char, idx) => {
      const charX = startX + idx * spacing;
      const charY = centerY + 18;

      const sprite = this.add.image(charX, charY, char.key);
      sprite.setScale(0.85);

      const name = this.add.text(charX, charY + 44, char.label, {
        fontSize: '12px',
        fontFamily: 'Segoe UI, Tahoma, sans-serif',
        fontStyle: 'bold',
        color: char.color
      });
      name.setOrigin(0.5);
    });

    // Start Game Button
    const btnY = centerY + 130;
    const btnWidth = 240;
    const btnHeight = 48;

    const startBtn = this.add.rectangle(centerX, btnY, btnWidth, btnHeight, 0xd97706);
    startBtn.setStrokeStyle(2, 0xfbbf24);
    startBtn.setInteractive({ useHandCursor: true });

    const btnText = this.add.text(centerX, btnY, '▶ START GAME', {
      fontSize: '16px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    btnText.setOrigin(0.5);

    startBtn.on('pointerover', () => {
      startBtn.setFillStyle(0xb45309);
      btnText.setScale(1.05);
    });

    startBtn.on('pointerout', () => {
      startBtn.setFillStyle(0xd97706);
      btnText.setScale(1.0);
    });

    startBtn.on('pointerdown', () => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => {
        this.scene.start('GameScene');
      });
    });

    // Controls line
    const isTouch = InputMode.isTouch();
    const hintText = isTouch 
      ? 'Virtual Joystick — Move   |   Touch Prompts — Interact'
      : 'WASD / Arrow Keys — Move   |   E — Interact   |   Shift — Sprint';

    const hint = this.add.text(
      centerX,
      height - 25,
      hintText,
      {
        fontSize: '11px',
        fontFamily: 'Courier, monospace',
        fontStyle: 'bold',
        color: '#94a3b8'
      }
    );
    hint.setOrigin(0.5);

    // Reposition existing objects, preserving draw order, input and tweens.
    // Never rebuild the menu from a global resize listener after scene shutdown.
    const centeredObjects = this.children.list.filter((child): child is Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Transform =>
      'x' in child && 'y' in child && child !== bg && child !== shroomL && child !== shroomR && child !== hint
    );
    let previousWidth = width;
    let previousHeight = height;
    const layout = () => {
      const { width: nextWidth, height: nextHeight } = this.scale.gameSize;
      this.cameras.main.setSize(nextWidth, nextHeight);
      for (const object of centeredObjects) {
        object.x += (nextWidth - previousWidth) / 2;
        object.y += (nextHeight - previousHeight) / 2;
      }
      bg.setPosition(nextWidth / 2, nextHeight / 2).setSize(nextWidth, nextHeight);
      shroomL.setPosition(60, nextHeight - 50);
      shroomR.setPosition(nextWidth - 60, nextHeight - 50);
      hint.setPosition(nextWidth / 2, nextHeight - 25);
      previousWidth = nextWidth;
      previousHeight = nextHeight;
    };
    this.scale.on('resize', layout);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.scale.off('resize', layout));
  }
}
