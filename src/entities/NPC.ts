import Phaser from 'phaser';
import { Character } from './Character';
import { CharacterConfig } from '../types/colony';
import { CharacterState } from '../types/characterState';

export class NPC extends Character {
  public characterState?: CharacterState;
  private moveTimer: number = 0;
  private isWaiting: boolean = false;
  private targetPoint: Phaser.Math.Vector2;
  private patrolRadius: number = 50;
  private anchorX: number;
  private anchorY: number;

  // Generic Interaction Indicator
  private indicatorContainer: Phaser.GameObjects.Container;
  private indicatorBg: Phaser.GameObjects.Rectangle;
  private indicatorText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, config: CharacterConfig, state?: CharacterState) {
    super(scene, config);
    this.characterState = state;

    this.patrolRadius = config.patrolRadius ?? 50;
    this.anchorX = config.spawnX;
    this.anchorY = config.spawnY;
    this.targetPoint = new Phaser.Math.Vector2(config.spawnX, config.spawnY);
    this.pickNewTarget();

    // Create Subtle Interaction Indicator above name tag
    this.indicatorContainer = scene.add.container(config.spawnX, config.spawnY - 50);
    this.indicatorContainer.setDepth(16);
    this.indicatorContainer.setAlpha(0);

    this.indicatorBg = scene.add.rectangle(0, 0, 24, 18, 0x0f172a, 0.85);
    this.indicatorBg.setStrokeStyle(1, 0xf59e0b, 0.9);
    this.indicatorContainer.add(this.indicatorBg);

    this.indicatorText = scene.add.text(0, 0, 'E', {
      fontSize: '10px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#fef08a'
    });
    this.indicatorText.setOrigin(0.5);
    this.indicatorContainer.add(this.indicatorText);
  }

  public update(): void {
    super.update();

    this.indicatorContainer.setPosition(this.sprite.x, this.sprite.y - 50);

    if (this.activeSpeechBubble) {
      this.activeSpeechBubble.setPosition(this.sprite.x, this.sprite.y - 75);
    }

    this.moveTimer--;

    if (this.isWaiting) {
      this.sprite.setVelocity(0, 0);
      if (this.moveTimer <= 0) {
        this.isWaiting = false;
        this.pickNewTarget();
        this.moveTimer = Phaser.Math.Between(120, 240);
      }
      return;
    }

    const dist = Phaser.Math.Distance.Between(
      this.sprite.x,
      this.sprite.y,
      this.targetPoint.x,
      this.targetPoint.y
    );

    if (dist < 15 || this.moveTimer <= 0) {
      this.isWaiting = true;
      this.moveTimer = Phaser.Math.Between(90, 180);
      this.sprite.setVelocity(0, 0);
    } else {
      const angle = Phaser.Math.Angle.Between(
        this.sprite.x,
        this.sprite.y,
        this.targetPoint.x,
        this.targetPoint.y
      );
      const vx = Math.cos(angle) * this.config.speed;
      const vy = Math.sin(angle) * this.config.speed;
      this.sprite.setVelocity(vx, vy);
    }
  }

  public updateProximityIndicator(
    playerX: number,
    playerY: number,
    isTouch: boolean,
    isActiveTarget: boolean = false,
    hasActiveInvestigationTarget: boolean = false
  ): number {
    const dist = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, playerX, playerY);

    // Suppress indicator if speech bubble is active or if another NPC is the active investigation target
    if (this.activeSpeechBubble || (!isActiveTarget && hasActiveInvestigationTarget)) {
      if (this.indicatorContainer.alpha > 0) {
        this.indicatorContainer.setAlpha(0);
      }
      return dist;
    }

    // Update icon style based on input mode and active investigation status
    if (isActiveTarget) {
      if (isTouch) {
        this.indicatorText.setText('💬 !');
        this.indicatorText.setFontSize(10);
        this.indicatorBg.setSize(26, 18);
      } else {
        this.indicatorText.setText('E !');
        this.indicatorText.setFontSize(10);
        this.indicatorBg.setSize(24, 16);
      }
      this.indicatorText.setColor('#fef08a');
      this.indicatorBg.setFillStyle(0x2d1a04, 0.95);
    } else {
      if (isTouch) {
        this.indicatorText.setText('💬');
        this.indicatorText.setFontSize(9);
        this.indicatorBg.setSize(20, 16);
      } else {
        this.indicatorText.setText('E');
        this.indicatorText.setFontSize(9);
        this.indicatorBg.setSize(18, 14);
      }
      this.indicatorText.setColor('#94a3b8');
      this.indicatorBg.setFillStyle(0x0f172a, 0.85);
    }

    // Visual Hierarchy:
    // Active Target: visible from 170px with golden accent
    // Inactive NPC: visible only when approaching (< 90px) with subtle tone
    const maxVisibleDist = isActiveTarget ? 170 : 90;
    const inRangeDist = 60;

    if (dist > maxVisibleDist) {
      if (this.indicatorContainer.alpha > 0) {
        this.indicatorContainer.setAlpha(0);
      }
    } else if (dist > inRangeDist) {
      const normalizedAlpha = Phaser.Math.Linear(0.6, 0.15, (dist - inRangeDist) / (maxVisibleDist - inRangeDist));
      this.indicatorContainer.setAlpha(normalizedAlpha);
      this.indicatorBg.setStrokeStyle(1, isActiveTarget ? 0xf59e0b : 0x475569, 0.8);
    } else {
      this.indicatorContainer.setAlpha(1.0);
      this.indicatorBg.setStrokeStyle(isActiveTarget ? 2 : 1, isActiveTarget ? 0xfbbf24 : 0x64748b, 1.0);
    }

    return dist;
  }

  private activeSpeechBubble?: Phaser.GameObjects.Container;

  public showSpeechBubble(dialogueText: string, durationMs: number = 2400): void {
    this.isWaiting = true;
    this.moveTimer = Math.round(durationMs / 16); // Pause movement during speech bubble
    this.sprite.setVelocity(0, 0);

    if (this.activeSpeechBubble) {
      this.activeSpeechBubble.destroy();
      this.activeSpeechBubble = undefined;
    }

    // Hide proximity indicator while speaking
    this.indicatorContainer.setAlpha(0);

    const bubble = this.scene.add.container(this.sprite.x, this.sprite.y - 62);
    bubble.setDepth(30);
    this.activeSpeechBubble = bubble;

    const paddingX = 10;
    const paddingY = 6;
    const maxTextWidth = 160;

    const textObj = this.scene.add.text(0, 0, dialogueText, {
      fontSize: '10.5px',
      fontFamily: 'Segoe UI, sans-serif',
      color: '#f8fafc',
      wordWrap: { width: maxTextWidth, useAdvancedWrap: true },
      align: 'center',
      lineSpacing: 2
    });
    textObj.setOrigin(0.5);

    const bWidth = Math.max(100, textObj.width + paddingX * 2);
    const bHeight = textObj.height + paddingY * 2;

    const bg = this.scene.add.rectangle(0, 0, bWidth, bHeight, 0x0f172a, 0.94);
    bg.setStrokeStyle(1.5, this.config.color || 0x38bdf8, 0.95);
    bubble.add(bg);

    bubble.add(textObj);

    // Subtle pointer tip below bubble
    const tip = this.scene.add.triangle(0, bHeight / 2, -5, 0, 5, 0, 0, 5, 0x0f172a);
    bubble.add(tip);

    // Animate pop-in
    bubble.setScale(0.88);
    bubble.setAlpha(0);
    this.scene.tweens.add({
      targets: bubble,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 180,
      ease: 'Back.easeOut'
    });

    this.scene.time.delayedCall(durationMs, () => {
      if (this.activeSpeechBubble === bubble) {
        this.scene.tweens.add({
          targets: bubble,
          alpha: 0,
          y: bubble.y - 6,
          duration: 250,
          onComplete: () => {
            if (this.activeSpeechBubble === bubble) {
              bubble.destroy();
              this.activeSpeechBubble = undefined;
            }
          }
        });
      }
    });
  }

  public alertReaction(): void {
    if (this.activeSpeechBubble) {
      this.activeSpeechBubble.destroy();
      this.activeSpeechBubble = undefined;
    }

    this.isWaiting = true;
    this.moveTimer = 180; // Pause for ~3 seconds
    this.sprite.setVelocity(0, 0);

    const alertBubble = this.scene.add.container(this.sprite.x, this.sprite.y - 58);
    alertBubble.setDepth(25);

    const bg = this.scene.add.circle(0, 0, 11, 0xef4444);
    bg.setStrokeStyle(1.5, 0xffffff);
    alertBubble.add(bg);

    const mark = this.scene.add.text(0, 0, '!', {
      fontSize: '13px',
      fontFamily: 'Segoe UI, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    mark.setOrigin(0.5);
    alertBubble.add(mark);

    this.scene.tweens.add({
      targets: alertBubble,
      y: alertBubble.y - 8,
      scaleX: 1.15,
      scaleY: 1.15,
      duration: 300,
      yoyo: true,
      ease: 'Back.easeOut'
    });

    this.scene.time.delayedCall(2800, () => {
      this.scene.tweens.add({
        targets: alertBubble,
        alpha: 0,
        y: alertBubble.y - 12,
        duration: 350,
        onComplete: () => alertBubble.destroy()
      });
    });
  }

  private pickNewTarget(): void {
    const offsetX = Phaser.Math.Between(-this.patrolRadius, this.patrolRadius);
    const offsetY = Phaser.Math.Between(-this.patrolRadius, this.patrolRadius);
    this.targetPoint.set(this.anchorX + offsetX, this.anchorY + offsetY);
  }
}
