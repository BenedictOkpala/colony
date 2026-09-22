import Phaser from 'phaser';

export class StationMap {
  public container: Phaser.GameObjects.Container;
  private background: Phaser.GameObjects.Rectangle;
  private titleText: Phaser.GameObjects.Text;
  private tunnelGraphics: Phaser.GameObjects.Graphics;
  
  // Room node UI elements
  private nodeBgs: Record<string, Phaser.GameObjects.Rectangle> = {};
  private nodeLabels: Record<string, Phaser.GameObjects.Text> = {};
  private playerDot: Phaser.GameObjects.Arc;
  private playerPulseRing: Phaser.GameObjects.Arc;
  
  private currentRoomId: string | null = null;
  private targetRoomId: string | null = null;

  // Node relative positions inside the map card (card center is 0,0)
  private readonly roomNodes: Record<string, { x: number; y: number; w: number; h: number; name: string; color: number }> = {
    food_storage: { x: -38, y: -16, w: 26, h: 14, name: 'STORAGE', color: 0xd4a017 },
    biolab:       { x: 38,  y: -16, w: 26, h: 14, name: 'LAB',     color: 0x10b981 },
    generator:    { x: -38, y: 7,   w: 26, h: 14, name: 'GEN',     color: 0xf59e0b },
    hub:          { x: 0,   y: 7,   w: 28, h: 16, name: 'HUB',     color: 0xd97706 },
    comms:        { x: 38,  y: 7,   w: 26, h: 14, name: 'RELAY',   color: 0x38bdf8 },
    nursery:      { x: 0,   y: 27,  w: 32, h: 13, name: 'NURSERY', color: 0xca8a04 }
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);
    this.container.setScrollFactor(0);
    this.container.setDepth(82);
    this.container.disableInteractive();

    // 1. Background Earth-Tech Card
    this.background = scene.add.rectangle(0, 4, 130, 84, 0x0a0f1d, 0.92);
    this.background.setStrokeStyle(1.5, 0x78350f, 0.95);
    this.container.add(this.background);

    // Corner rivet accents
    const cornerOffsets = [
      { x: -61, y: -34 }, { x: 61, y: -34 },
      { x: -61, y: 42 },  { x: 61, y: 42 }
    ];
    cornerOffsets.forEach(pt => {
      const rivet = scene.add.circle(pt.x, pt.y, 1.5, 0xf59e0b, 0.7);
      this.container.add(rivet);
    });

    // 2. Header
    this.titleText = scene.add.text(0, -30, '◈ COLONY SCHEMATIC ◈', {
      fontSize: '7.5px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#f59e0b',
      letterSpacing: 0.5
    });
    this.titleText.setOrigin(0.5);
    this.container.add(this.titleText);

    // 3. Tunnel Lines Graphics
    this.tunnelGraphics = scene.add.graphics();
    this.container.add(this.tunnelGraphics);
    this.drawTunnels();

    // 4. Room Nodes
    for (const [id, def] of Object.entries(this.roomNodes)) {
      const bg = scene.add.rectangle(def.x, def.y, def.w, def.h, 0x1e293b, 0.95);
      bg.setStrokeStyle(1, 0x475569);
      this.container.add(bg);
      this.nodeBgs[id] = bg;

      const label = scene.add.text(def.x, def.y, def.name, {
        fontSize: '7px',
        fontFamily: 'Segoe UI, Tahoma, sans-serif',
        fontStyle: 'bold',
        color: '#94a3b8'
      });
      label.setOrigin(0.5);
      this.container.add(label);
      this.nodeLabels[id] = label;
    }

    // 5. Player Dot Indicator & Pulse
    this.playerPulseRing = scene.add.circle(0, 0, 6, 0x38bdf8, 0);
    this.playerPulseRing.setStrokeStyle(1, 0x38bdf8, 0.8);
    this.playerPulseRing.setVisible(false);
    this.container.add(this.playerPulseRing);

    this.playerDot = scene.add.circle(0, 0, 3, 0x38bdf8, 1);
    this.playerDot.setStrokeStyle(1, 0xffffff, 0.95);
    this.playerDot.setVisible(false);
    this.container.add(this.playerDot);

    scene.tweens.add({
      targets: this.playerPulseRing,
      scaleX: 1.8,
      scaleY: 1.8,
      alpha: { from: 0.8, to: 0 },
      duration: 1200,
      repeat: -1,
      ease: 'Quad.easeOut'
    });
  }

  private drawTunnels(): void {
    this.tunnelGraphics.clear();
    this.tunnelGraphics.lineStyle(1.5, 0x334155, 0.85);

    // Food Storage <-> Bio-Lab (top)
    this.tunnelGraphics.beginPath();
    this.tunnelGraphics.moveTo(this.roomNodes.food_storage.x, this.roomNodes.food_storage.y);
    this.tunnelGraphics.lineTo(this.roomNodes.biolab.x, this.roomNodes.biolab.y);
    this.tunnelGraphics.strokePath();

    // Food Storage <-> Generator (west)
    this.tunnelGraphics.beginPath();
    this.tunnelGraphics.moveTo(this.roomNodes.food_storage.x, this.roomNodes.food_storage.y);
    this.tunnelGraphics.lineTo(this.roomNodes.generator.x, this.roomNodes.generator.y);
    this.tunnelGraphics.strokePath();

    // Bio-Lab <-> Comms/Relay (east)
    this.tunnelGraphics.beginPath();
    this.tunnelGraphics.moveTo(this.roomNodes.biolab.x, this.roomNodes.biolab.y);
    this.tunnelGraphics.lineTo(this.roomNodes.comms.x, this.roomNodes.comms.y);
    this.tunnelGraphics.strokePath();

    // Generator <-> Hub <-> Comms/Relay (middle)
    this.tunnelGraphics.beginPath();
    this.tunnelGraphics.moveTo(this.roomNodes.generator.x, this.roomNodes.generator.y);
    this.tunnelGraphics.lineTo(this.roomNodes.hub.x, this.roomNodes.hub.y);
    this.tunnelGraphics.lineTo(this.roomNodes.comms.x, this.roomNodes.comms.y);
    this.tunnelGraphics.strokePath();

    // Hub <-> Nursery (south)
    this.tunnelGraphics.beginPath();
    this.tunnelGraphics.moveTo(this.roomNodes.hub.x, this.roomNodes.hub.y);
    this.tunnelGraphics.lineTo(this.roomNodes.nursery.x, this.roomNodes.nursery.y);
    this.tunnelGraphics.strokePath();
  }

  public updateState(currentRoomId: string | null, targetRoomId: string | null): void {
    if (this.currentRoomId === currentRoomId && this.targetRoomId === targetRoomId) {
      return;
    }
    this.currentRoomId = currentRoomId;
    this.targetRoomId = targetRoomId;

    // 1. Update Player Location Dot
    if (currentRoomId && this.roomNodes[currentRoomId]) {
      const node = this.roomNodes[currentRoomId];
      this.playerDot.setPosition(node.x, node.y);
      this.playerDot.setVisible(true);
      this.playerPulseRing.setPosition(node.x, node.y);
      this.playerPulseRing.setVisible(true);
    } else {
      this.playerDot.setVisible(false);
      this.playerPulseRing.setVisible(false);
    }

    // 2. Update Node Highlights
    for (const [id, bg] of Object.entries(this.nodeBgs)) {
      const label = this.nodeLabels[id];
      const isTarget = id === targetRoomId;
      const isCurrent = id === currentRoomId;

      if (isTarget) {
        bg.setStrokeStyle(1.5, 0x38bdf8, 1);
        bg.setFillStyle(0x0c4a6e, 0.95);
        label.setColor('#38bdf8');
      } else if (isCurrent) {
        bg.setStrokeStyle(1.2, 0x94a3b8, 0.95);
        bg.setFillStyle(0x334155, 0.95);
        label.setColor('#ffffff');
      } else {
        bg.setStrokeStyle(1, 0x334155, 0.7);
        bg.setFillStyle(0x1e293b, 0.85);
        label.setColor('#64748b');
      }
    }
  }

  public reposition(x: number, y: number): void {
    this.container.setPosition(x, y);
  }

  public setVisible(visible: boolean): void {
    this.container.setVisible(visible);
  }
}
