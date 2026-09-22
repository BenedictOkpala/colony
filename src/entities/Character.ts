import Phaser from 'phaser';
import { CharacterConfig } from '../types/colony';

export class Character {
  public scene: Phaser.Scene;
  public config: CharacterConfig;
  public sprite: Phaser.Physics.Arcade.Sprite;
  public shadow: Phaser.GameObjects.Ellipse;
  public nameText: Phaser.GameObjects.Text;
  public playerIndicator?: Phaser.GameObjects.Text;
  public currentRoom: string | null = null;
  protected targetAngle: number = 0;
  protected animTime: number = 0;

  constructor(scene: Phaser.Scene, config: CharacterConfig) {
    this.scene = scene;
    this.config = config;

    // 1. Subtle Underbody Ground Contact Shadow
    this.shadow = scene.add.ellipse(config.spawnX, config.spawnY + 8, 32, 16, 0x060302, 0.5);
    this.shadow.setDepth(8);

    const textureKey = config.isPlayer ? 'ant_player' : `ant_${config.id}`;
    this.sprite = scene.physics.add.sprite(config.spawnX, config.spawnY, textureKey);
    // Adjusted physics collision circle centered on thorax/abdomen
    this.sprite.setCircle(18, 30, 30);
    this.sprite.setCollideWorldBounds(true);
    this.sprite.setDepth(10);
    this.sprite.setDamping(true);
    this.sprite.setDrag(0.85);

    if (config.isPlayer) {
      // "You ▼" locator badge
      this.nameText = scene.add.text(config.spawnX, config.spawnY - 38, 'You', {
        fontSize: '13px',
        fontFamily: 'Segoe UI, Tahoma, sans-serif',
        fontStyle: 'bold',
        color: '#ffffff',
        stroke: '#000000',
        strokeThickness: 3
      });
      this.nameText.setOrigin(0.5);
      this.nameText.setDepth(15);

      this.playerIndicator = scene.add.text(config.spawnX, config.spawnY - 24, '▼', {
        fontSize: '11px',
        fontFamily: 'sans-serif',
        fontStyle: 'bold',
        color: '#38bdf8'
      });
      this.playerIndicator.setOrigin(0.5);
      this.playerIndicator.setDepth(15);
    } else {
      // NPC clean nametag (Rook, Mina, Pip, Vale, Nox, Kira)
      this.nameText = scene.add.text(config.spawnX, config.spawnY - 34, config.name, {
        fontSize: '12px',
        fontFamily: 'Segoe UI, Tahoma, sans-serif',
        fontStyle: 'bold',
        color: config.colorHex,
        stroke: '#000000',
        strokeThickness: 3
      });
      this.nameText.setOrigin(0.5);
      this.nameText.setDepth(15);
    }
  }

  public update(): void {
    this.animTime += 1;

    // Track shadow with sprite
    this.shadow.setPosition(this.sprite.x, this.sprite.y + 6);

    // Keep nametag tracking the sprite
    if (this.config.isPlayer) {
      this.nameText.setPosition(this.sprite.x, this.sprite.y - 38);
      if (this.playerIndicator) {
        this.playerIndicator.setPosition(this.sprite.x, this.sprite.y - 24);
      }
    } else {
      this.nameText.setPosition(this.sprite.x, this.sprite.y - 34);
    }

    // Smooth rotation matching movement direction & subtle micro-animation
    const body = this.sprite.body as Phaser.Physics.Arcade.Body;
    const isMoving = body && (Math.abs(body.velocity.x) > 5 || Math.abs(body.velocity.y) > 5);

    if (isMoving) {
      this.targetAngle = Math.atan2(body.velocity.y, body.velocity.x) + Math.PI / 2;
      this.sprite.rotation = Phaser.Math.Angle.RotateTo(
        this.sprite.rotation,
        this.targetAngle,
        0.18
      );
      // Subtle walking stride scale bob
      const strideBob = 1.0 + Math.sin(this.animTime * 0.2) * 0.03;
      this.sprite.setScale(strideBob, 2.0 - strideBob);
      this.shadow.setScale(strideBob * 1.05, 1.0);
    } else {
      // Subtle idle breathing cycle
      const breathe = 1.0 + Math.sin(this.animTime * 0.04) * 0.015;
      this.sprite.setScale(breathe, breathe);
      this.shadow.setScale(breathe, breathe);
    }
  }

  public get x(): number {
    return this.sprite.x;
  }

  public get y(): number {
    return this.sprite.y;
  }
}
