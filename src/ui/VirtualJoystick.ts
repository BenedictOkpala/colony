import Phaser from 'phaser';

export class VirtualJoystick {
  private scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  private baseRing: Phaser.GameObjects.Arc;
  private baseBg: Phaser.GameObjects.Arc;
  private thumb: Phaser.GameObjects.Arc;
  private thumbCenter: Phaser.GameObjects.Arc;
  private hintText?: Phaser.GameObjects.Text;
  private touchZone: Phaser.GameObjects.Zone;

  public vector: Phaser.Math.Vector2 = new Phaser.Math.Vector2(0, 0);
  public isActive: boolean = false;
  private hasMovedOnce: boolean = false;
  private activePointerId: number | null = null;
  private maxRadius: number = 44;
  private defaultBaseX: number = 90;
  private defaultBaseY: number = 550;
  private activeBaseX: number = 90;
  private activeBaseY: number = 550;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    const cam = scene.cameras.main;

    this.defaultBaseX = 90;
    this.defaultBaseY = cam.height - 90;
    this.activeBaseX = this.defaultBaseX;
    this.activeBaseY = this.defaultBaseY;

    this.container = scene.add.container(this.defaultBaseX, this.defaultBaseY);
    this.container.setScrollFactor(0);
    this.container.setDepth(90);

    // 1. Outer Guide Ring (subtle cyan glow)
    this.baseRing = scene.add.circle(0, 0, 50, 0x0284c7, 0.15);
    this.baseRing.setStrokeStyle(2, 0x38bdf8, 0.85);
    this.container.add(this.baseRing);

    // 2. Base Dark Plate
    this.baseBg = scene.add.circle(0, 0, 42, 0x0f172a, 0.75);
    this.baseBg.setStrokeStyle(1.5, 0x1e293b, 0.9);
    this.container.add(this.baseBg);

    // 3. Thumb Knob
    this.thumb = scene.add.circle(0, 0, 22, 0x0284c7, 0.95);
    this.thumb.setStrokeStyle(2, 0x38bdf8, 1);
    this.container.add(this.thumb);

    this.thumbCenter = scene.add.circle(0, 0, 8, 0x38bdf8, 0.9);
    this.container.add(this.thumbCenter);

    // Set initial comfortable resting idle opacity
    this.container.setAlpha(0.55);

    // 4. First-Time Mobile Hint
    this.hintText = scene.add.text(0, -64, 'Touch & drag to move', {
      fontSize: '11px',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      fontStyle: 'bold',
      color: '#e2e8f0',
      backgroundColor: '#0f172acc',
      padding: { x: 8, y: 4 }
    });
    this.hintText.setOrigin(0.5);
    this.container.add(this.hintText);

    // 5. Left-side Screen Touch Zone
    const zoneW = cam.width * 0.48;
    const zoneH = cam.height * 0.7;
    this.touchZone = scene.add.zone(zoneW / 2, cam.height - zoneH / 2, zoneW, zoneH);
    this.touchZone.setScrollFactor(0);
    this.touchZone.setInteractive({ useHandCursor: false });

    this.touchZone.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (this.activePointerId === null) {
        this.activePointerId = pointer.id;
        this.onPointerDown(pointer);
      }
    });

    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) {
        this.onPointerMove(pointer);
      }
    });

    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.activePointerId) {
        this.activePointerId = null;
        this.onPointerUp();
      }
    });

    // GameScene coordinates camera sizing and UI layout on resize.
  }

  public repositionOnResize(): void {
    const cam = this.scene.cameras.main;
    this.defaultBaseX = 90;
    this.defaultBaseY = cam.height - 90;

    if (!this.isActive) {
      this.activeBaseX = this.defaultBaseX;
      this.activeBaseY = this.defaultBaseY;
      this.container.setPosition(this.defaultBaseX, this.defaultBaseY);
    }

    const zoneW = cam.width * 0.48;
    const zoneH = cam.height * 0.7;
    this.touchZone.setPosition(zoneW / 2, cam.height - zoneH / 2);
    this.touchZone.setSize(zoneW, zoneH);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    this.isActive = true;
    const cam = this.scene.cameras.main;

    // Anchor: If touch is close to default base, keep it there. Otherwise anchor to touch position.
    const distToDefault = Phaser.Math.Distance.Between(pointer.x, pointer.y, this.defaultBaseX, this.defaultBaseY);
    if (distToDefault <= 65) {
      this.activeBaseX = this.defaultBaseX;
      this.activeBaseY = this.defaultBaseY;
    } else {
      // Clamp anchor so joystick ring stays fully visible on screen
      this.activeBaseX = Phaser.Math.Clamp(pointer.x, 55, cam.width * 0.45);
      this.activeBaseY = Phaser.Math.Clamp(pointer.y, cam.height * 0.35, cam.height - 55);
    }

    this.container.setPosition(this.activeBaseX, this.activeBaseY);

    this.scene.tweens.add({
      targets: this.container,
      alpha: 0.95,
      duration: 120,
      ease: 'Quad.easeOut'
    });

    this.updateThumbPosition(pointer.x, pointer.y);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (!this.isActive) return;
    this.updateThumbPosition(pointer.x, pointer.y);
  }

  private onPointerUp(): void {
    this.isActive = false;
    this.vector.set(0, 0);

    // Snap thumb knob back to base center
    this.scene.tweens.add({
      targets: [this.thumb, this.thumbCenter],
      x: 0,
      y: 0,
      duration: 100,
      ease: 'Quad.easeOut'
    });

    // Return container smoothly to default resting position
    this.scene.tweens.add({
      targets: this.container,
      x: this.defaultBaseX,
      y: this.defaultBaseY,
      alpha: 0.55,
      duration: 250,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.activeBaseX = this.defaultBaseX;
        this.activeBaseY = this.defaultBaseY;
      }
    });
  }

  private updateThumbPosition(screenX: number, screenY: number): void {
    const dx = screenX - this.activeBaseX;
    const dy = screenY - this.activeBaseY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 6) {
      if (!this.hasMovedOnce) {
        this.hasMovedOnce = true;
        if (this.hintText) {
          this.scene.tweens.add({
            targets: this.hintText,
            alpha: 0,
            duration: 350,
            onComplete: () => this.hintText?.destroy()
          });
        }
      }
    }

    if (dist <= this.maxRadius) {
      this.thumb.setPosition(dx, dy);
      this.thumbCenter.setPosition(dx, dy);
      this.vector.set(dx / this.maxRadius, dy / this.maxRadius);
    } else {
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * this.maxRadius;
      const clampedY = Math.sin(angle) * this.maxRadius;
      this.thumb.setPosition(clampedX, clampedY);
      this.thumbCenter.setPosition(clampedX, clampedY);
      this.vector.set(Math.cos(angle), Math.sin(angle));
    }
  }

  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
    this.touchZone.setVisible(visible);
    if (!visible) {
      this.reset();
    }
  }

  public reset(): void {
    this.vector.set(0, 0);
    this.isActive = false;
    this.activePointerId = null;
    this.thumb.setPosition(0, 0);
    this.thumbCenter.setPosition(0, 0);
    this.container.setPosition(this.defaultBaseX, this.defaultBaseY);
    this.container.setAlpha(0.55);
  }
}
