import Phaser from 'phaser';
import { Character } from './Character';
import { CharacterConfig } from '../types/colony';

export class Player extends Character {
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys?: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
    SHIFT: Phaser.Input.Keyboard.Key;
  };

  public onFirstMovement?: () => void;
  private hasMoved: boolean = false;
  public joystickVector?: Phaser.Math.Vector2;

  constructor(scene: Phaser.Scene, config: CharacterConfig) {
    super(scene, { ...config, isPlayer: true });

    if (scene.input.keyboard) {
      this.cursors = scene.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        E: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E),
        SHIFT: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT)
      };
    }
  }

  public update(): void {
    super.update();

    let vx = 0;
    let vy = 0;

    // 1. Keyboard Input
    if (this.cursors && this.wasdKeys) {
      const left = this.cursors.left.isDown || this.wasdKeys.A.isDown;
      const right = this.cursors.right.isDown || this.wasdKeys.D.isDown;
      const up = this.cursors.up.isDown || this.wasdKeys.W.isDown;
      const down = this.cursors.down.isDown || this.wasdKeys.S.isDown;

      if (left) vx -= 1;
      if (right) vx += 1;
      if (up) vy -= 1;
      if (down) vy += 1;
    }

    // 2. Virtual Joystick Input (Mobile)
    if (this.joystickVector && (this.joystickVector.x !== 0 || this.joystickVector.y !== 0)) {
      vx = this.joystickVector.x;
      vy = this.joystickVector.y;
    }

    let currentSpeed = this.config.speed;
    if (this.wasdKeys?.SHIFT.isDown) {
      currentSpeed *= 1.35; // Sprint boost
    }

    if (vx !== 0 || vy !== 0) {
      if (!this.hasMoved) {
        this.hasMoved = true;
        if (this.onFirstMovement) {
          this.onFirstMovement();
        }
      }

      if (!this.joystickVector || (this.joystickVector.x === 0 && this.joystickVector.y === 0)) {
        const length = Math.sqrt(vx * vx + vy * vy);
        vx = (vx / length) * currentSpeed;
        vy = (vy / length) * currentSpeed;
      } else {
        vx *= currentSpeed;
        vy *= currentSpeed;
      }
    }

    this.sprite.setVelocity(vx, vy);
  }

  public isInteractPressed(): boolean {
    if (this.wasdKeys) {
      return Phaser.Input.Keyboard.JustDown(this.wasdKeys.E);
    }
    return false;
  }
}
