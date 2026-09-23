import Phaser from 'phaser';
import { InputMode } from '../services/InputMode';
import { ObjectiveInfo } from '../types/round';
import { StationMap } from './StationMap';
import { inspectUIObject } from './UIDiagnostics';

export class HUDOverlay {
  private scene: Phaser.Scene;
  public container: Phaser.GameObjects.Container;
  private taskHeader: Phaser.GameObjects.Text;
  private taskItem: Phaser.GameObjects.Text;
  private taskBoxBg: Phaser.GameObjects.Rectangle;
  private roomPillBg: Phaser.GameObjects.Rectangle;
  private roomText: Phaser.GameObjects.Text;
  private controlsBox?: Phaser.GameObjects.Container;
  private desktopTutorialCard?: Phaser.GameObjects.Container;
  private zoomContainer?: Phaser.GameObjects.Container;
  public stationMap: StationMap;

  // Incident Alert Banner
  private alertBanner?: Phaser.GameObjects.Container;

  // Subtle Directional Guide Indicator
  private navGuideContainer: Phaser.GameObjects.Container;
  private navGuideIcon: Phaser.GameObjects.Text;
  private navGuideText: Phaser.GameObjects.Text;
  private targetLocation?: { x: number; y: number };

  // Desktop Interaction Prompt
  private desktopPromptContainer: Phaser.GameObjects.Container;
  private desktopPromptBg!: Phaser.GameObjects.Rectangle;
  private desktopPromptText: Phaser.GameObjects.Text;

  // Mobile Interaction Button
  private mobileActionBtn: Phaser.GameObjects.Container;
  private mobileActionBg!: Phaser.GameObjects.Arc;
  private mobileActionTitle: Phaser.GameObjects.Text;
  private mobileActionTarget: Phaser.GameObjects.Text;

  private isInteractVisible: boolean = false;
  private onInteractClick?: () => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0);
    this.container.setScrollFactor(0);
    this.container.setDepth(80);

    const cam = scene.cameras.main;
    const isTouch = InputMode.isTouch();

    // 1. Sleek Top-Left Objective / Mission Card (Unified Earth-Tech Glass Card)
    this.taskBoxBg = scene.add.rectangle(122, 50, 216, 72, 0x0a0f1d, 0.93);
    this.taskBoxBg.setStrokeStyle(1.5, 0x334155, 0.95);
    this.container.add(this.taskBoxBg);

    this.taskHeader = scene.add.text(24, 22, '◈ COLONY DUTIES', {
      fontSize: '9.5px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#38bdf8'
    });
    this.container.add(this.taskHeader);

    this.taskItem = scene.add.text(24, 38, 'Complete your assigned task (0/1)', {
      fontSize: '11px',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      color: '#e2e8f0',
      wordWrap: { width: 196 }
    });
    this.container.add(this.taskItem);

    // 2. Sleek Top-Right Room Pill Badge
    this.roomPillBg = scene.add.rectangle(cam.width - 80, 28, 120, 28, 0x0a0f1d, 0.9);
    this.roomPillBg.setStrokeStyle(1.5, 0x334155, 0.95);
    this.container.add(this.roomPillBg);

    this.roomText = scene.add.text(cam.width - 80, 28, '◈ Central Hub', {
      fontSize: '11px',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      fontStyle: 'bold',
      color: '#f8fafc'
    });
    this.roomText.setOrigin(0.5);
    this.container.add(this.roomText);

    // 3. Integrated Objective Direction Indicator (Within Mission Card)
    this.navGuideContainer = scene.add.container(122, 70);
    this.navGuideContainer.setAlpha(0);
    this.container.add(this.navGuideContainer);

    const navDivider = scene.add.rectangle(0, -9, 196, 1, 0x1e293b, 0.9);
    this.navGuideContainer.add(navDivider);

    this.navGuideIcon = scene.add.text(-86, 0, '◀', {
      fontSize: '10px',
      fontFamily: 'sans-serif',
      color: '#38bdf8'
    });
    this.navGuideIcon.setOrigin(0.5);
    this.navGuideContainer.add(this.navGuideIcon);

    this.navGuideText = scene.add.text(-72, -6, 'WEST  //  GENERATOR ROOM', {
      fontSize: '9.5px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#94a3b8'
    });
    this.navGuideContainer.add(this.navGuideText);

    // 4. Desktop Controls Legend
    if (!isTouch) {
      this.createDesktopControlsLegend(cam);
      this.createDesktopTutorialCard(cam);
    }

    // 5. Desktop Contextual Interaction Prompt (Compact COLONY Terminal Treatment)
    this.desktopPromptContainer = scene.add.container(cam.width / 2, cam.height - 40);
    this.desktopPromptContainer.setVisible(false);
    this.container.add(this.desktopPromptContainer);

    this.desktopPromptBg = scene.add.rectangle(0, 0, 160, 26, 0x0a0f1d, 0.94);
    this.desktopPromptBg.setStrokeStyle(1, 0x334155, 0.95);
    this.desktopPromptBg.setInteractive({ useHandCursor: true });
    this.desktopPromptBg.on('pointerdown', () => {
      if (this.onInteractClick) this.onInteractClick();
    });
    this.desktopPromptContainer.add(this.desktopPromptBg);

    this.desktopPromptText = scene.add.text(0, 0, '[E] Talk to Rook', {
      fontSize: '11px',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      fontStyle: 'bold',
      color: '#e2e8f0'
    });
    this.desktopPromptText.setOrigin(0.5);
    this.desktopPromptContainer.add(this.desktopPromptText);

    // 6. Mobile Contextual Interaction Button (Bottom-Right)
    this.mobileActionBtn = scene.add.container(cam.width - 80, cam.height - 80);
    this.mobileActionBtn.setAlpha(0);
    this.mobileActionBtn.setVisible(false);
    this.container.add(this.mobileActionBtn);

    this.mobileActionBg = scene.add.circle(0, 0, 36, 0x0284c7, 0.94);
    this.mobileActionBg.setStrokeStyle(2.5, 0x38bdf8);
    this.mobileActionBg.setInteractive({ useHandCursor: true });
    this.mobileActionBg.on('pointerdown', () => {
      if (this.onInteractClick) this.onInteractClick();
    });
    this.mobileActionBtn.add(this.mobileActionBg);

    this.mobileActionTitle = scene.add.text(0, -7, 'TALK', {
      fontSize: '12px',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      fontStyle: 'bold',
      color: '#ffffff'
    });
    this.mobileActionTitle.setOrigin(0.5);
    this.mobileActionBtn.add(this.mobileActionTitle);

    this.mobileActionTarget = scene.add.text(0, 8, 'Rook', {
      fontSize: '10px',
      fontFamily: 'Segoe UI, Tahoma, sans-serif',
      color: '#bae6fd'
    });
    this.mobileActionTarget.setOrigin(0.5);
    this.mobileActionBtn.add(this.mobileActionTarget);

    // 7. Touch & Desktop On-Screen Camera Zoom Controls (Top Right below Room pill)
    this.createZoomControls(cam);

    // 8. Mini Schematic Station Orientation Map (Bottom-Left)
    const mapX = 85;
    const mapY = isTouch ? cam.height - 195 : cam.height - 65;
    this.stationMap = new StationMap(scene, mapX, mapY);
    this.container.add(this.stationMap.container);

    // Responsive repositioning on canvas resize
    // GameScene coordinates camera sizing and HUD layout on resize.
  }

  public onZoomIn?: () => void;
  public onZoomOut?: () => void;
  public onZoomFit?: () => void;

  private createZoomControls(cam: Phaser.Cameras.Scene2D.Camera): void {
    const zoomContainer = this.scene.add.container(cam.width - 70, 62);
    this.zoomContainer = zoomContainer;
    this.container.add(zoomContainer);

    const bg = this.scene.add.rectangle(0, 0, 114, 26, 0x0a0f1d, 0.92);
    bg.setStrokeStyle(1, 0x334155, 0.95);
    zoomContainer.add(bg);

    // 1. Minus Button (Zoom Out)
    const minusBtn = this.scene.add.rectangle(-36, 0, 26, 20, 0x1e293b, 0.94);
    minusBtn.setStrokeStyle(1, 0x475569);
    minusBtn.setInteractive({ useHandCursor: true });
    minusBtn.on('pointerdown', () => {
      if (this.onZoomOut) this.onZoomOut();
    });
    zoomContainer.add(minusBtn);

    const minusText = this.scene.add.text(-36, 0, '−', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, sans-serif',
      fontStyle: 'bold',
      color: '#cbd5e1'
    });
    minusText.setOrigin(0.5);
    zoomContainer.add(minusText);

    // 2. FIT Button (Auto-Fit Zoom)
    const fitBtn = this.scene.add.rectangle(0, 0, 36, 20, 0x1e293b, 0.94);
    fitBtn.setStrokeStyle(1, 0x0284c7);
    fitBtn.setInteractive({ useHandCursor: true });
    fitBtn.on('pointerdown', () => {
      if (this.onZoomFit) this.onZoomFit();
    });
    zoomContainer.add(fitBtn);

    const fitText = this.scene.add.text(0, 0, 'FIT', {
      fontSize: '9px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#38bdf8'
    });
    fitText.setOrigin(0.5);
    zoomContainer.add(fitText);

    // 3. Plus Button (Zoom In)
    const plusBtn = this.scene.add.rectangle(36, 0, 26, 20, 0x1e293b, 0.94);
    plusBtn.setStrokeStyle(1, 0x475569);
    plusBtn.setInteractive({ useHandCursor: true });
    plusBtn.on('pointerdown', () => {
      if (this.onZoomIn) this.onZoomIn();
    });
    zoomContainer.add(plusBtn);

    const plusText = this.scene.add.text(36, 0, '+', {
      fontSize: '14px',
      fontFamily: 'Segoe UI, sans-serif',
      fontStyle: 'bold',
      color: '#cbd5e1'
    });
    plusText.setOrigin(0.5);
    zoomContainer.add(plusText);
  }

  private createDesktopControlsLegend(cam: Phaser.Cameras.Scene2D.Camera): void {
    this.controlsBox = this.scene.add.container(cam.width - 65, cam.height - 48);
    this.container.add(this.controlsBox);

    const bg = this.scene.add.rectangle(0, 0, 105, 68, 0x0a0f1d, 0.88);
    bg.setStrokeStyle(1, 0x334155, 0.95);
    this.controlsBox.add(bg);

    const controls = [
      { key: 'WASD', action: 'Move' },
      { key: 'Shift', action: 'Sprint' },
      { key: 'E', action: 'Interact' }
    ];

    controls.forEach(({ key, action }, idx) => {
      const rowY = -22 + idx * 22;

      const keyBg = this.scene.add.rectangle(-32, rowY, key.length > 3 ? 30 : 22, 16, 0x1e293b);
      keyBg.setStrokeStyle(1, 0x475569);
      this.controlsBox?.add(keyBg);

      const keyText = this.scene.add.text(-32, rowY, key, {
        fontSize: '9px',
        fontFamily: 'Segoe UI, sans-serif',
        fontStyle: 'bold',
        color: '#f8fafc'
      });
      keyText.setOrigin(0.5);
      this.controlsBox?.add(keyText);

      const actionText = this.scene.add.text(-12, rowY - 6, action, {
        fontSize: '10px',
        fontFamily: 'Segoe UI, sans-serif',
        color: '#94a3b8'
      });
      this.controlsBox?.add(actionText);
    });
  }

  private createDesktopTutorialCard(cam: Phaser.Cameras.Scene2D.Camera): void {
    this.desktopTutorialCard = this.scene.add.container(cam.width / 2, cam.height - 110);
    this.container.add(this.desktopTutorialCard);

    const cardBg = this.scene.add.rectangle(0, 0, 260, 68, 0x0a0f1d, 0.95);
    cardBg.setStrokeStyle(1.5, 0x0284c7, 0.95);
    this.desktopTutorialCard.add(cardBg);

    const t1 = this.scene.add.text(0, -20, 'MOVE: WASD / Arrow Keys', {
      fontSize: '11px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#38bdf8'
    });
    t1.setOrigin(0.5);
    this.desktopTutorialCard.add(t1);

    const t2 = this.scene.add.text(0, -2, 'INTERACT: E   |   SPRINT: Shift', {
      fontSize: '11px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#e2e8f0'
    });
    t2.setOrigin(0.5);
    this.desktopTutorialCard.add(t2);

    const t3 = this.scene.add.text(0, 16, '(Move to begin exploring)', {
      fontSize: '10px',
      fontFamily: 'Segoe UI, sans-serif',
      color: '#64748b'
    });
    t3.setOrigin(0.5);
    this.desktopTutorialCard.add(t3);
  }

  public dismissDesktopTutorial(): void {
    if (this.desktopTutorialCard) {
      this.scene.tweens.add({
        targets: this.desktopTutorialCard,
        alpha: 0,
        y: this.desktopTutorialCard.y + 15,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => {
          this.desktopTutorialCard?.destroy();
          this.desktopTutorialCard = undefined;
        }
      });
    }
  }

  public updateObjective(info: ObjectiveInfo): void {
    this.taskHeader.setText(`◈ ${info.category}`);
    this.taskItem.setText(info.title + (info.progress ? ` (${info.progress})` : ''));

    if (info.isAlert) {
      this.taskHeader.setColor('#ef4444');
      this.taskBoxBg.setStrokeStyle(1.5, 0xef4444, 0.95);
      this.taskItem.setColor('#fca5a5');
    } else if (info.category.includes('INVESTIGATION COMPLETE')) {
      this.taskHeader.setColor('#f59e0b');
      this.taskBoxBg.setStrokeStyle(1.5, 0xf59e0b, 0.95);
      this.taskItem.setColor('#fef08a');
    } else {
      this.taskHeader.setColor('#38bdf8');
      this.taskBoxBg.setStrokeStyle(1.5, 0x334155, 0.95);
      this.taskItem.setColor('#e2e8f0');
    }

    if (info.targetX !== undefined && info.targetY !== undefined) {
      this.targetLocation = { x: info.targetX, y: info.targetY };
      this.navGuideContainer.setAlpha(0.9);
    } else {
      this.targetLocation = undefined;
      this.navGuideContainer.setAlpha(0);
    }
  }

  private currentTargetRoomName: string = 'GENERATOR ROOM';

  public updateTargetRoom(roomId: string | null): void {
    if (!roomId) return;
    const roomMap: Record<string, string> = {
      generator: 'GENERATOR ROOM',
      hub: 'CENTRAL HUB',
      biolab: 'BIO-LAB',
      food_storage: 'FOOD STORAGE',
      comms: 'COMMS & RELAY',
      nursery: 'NURSERY'
    };
    this.currentTargetRoomName = roomMap[roomId] || roomId.toUpperCase();
  }

  public updateGuidePointer(playerX: number, playerY: number): void {
    if (!this.targetLocation) return;

    const angle = Phaser.Math.Angle.Between(playerX, playerY, this.targetLocation.x, this.targetLocation.y);
    const dist = Phaser.Math.Distance.Between(playerX, playerY, this.targetLocation.x, this.targetLocation.y);

    if (dist < 120) {
      this.navGuideContainer.setAlpha(0);
    } else {
      this.navGuideContainer.setAlpha(0.95);
      const deg = Phaser.Math.RadToDeg(angle);
      const roomStr = this.currentTargetRoomName;
      if (deg >= -45 && deg < 45) {
        this.navGuideIcon.setText('▶');
        this.navGuideText.setText(`EAST  //  ${roomStr}`);
      } else if (deg >= 45 && deg < 135) {
        this.navGuideIcon.setText('▼');
        this.navGuideText.setText(`SOUTH  //  ${roomStr}`);
      } else if (deg >= -135 && deg < -45) {
        this.navGuideIcon.setText('▲');
        this.navGuideText.setText(`NORTH  //  ${roomStr}`);
      } else {
        this.navGuideIcon.setText('◀');
        this.navGuideText.setText(`WEST  //  ${roomStr}`);
      }
    }
  }

  public showIncidentAlert(title: string, subtitle: string): void {
    const cam = this.scene.cameras.main;

    if (this.alertBanner) {
      this.alertBanner.destroy();
    }

    this.alertBanner = this.scene.add.container(cam.width / 2, 75);
    this.alertBanner.setScrollFactor(0);
    this.alertBanner.setDepth(95);
    this.container.add(this.alertBanner);

    const bannerBg = this.scene.add.rectangle(0, 0, 360, 48, 0x450a0a, 0.95);
    bannerBg.setStrokeStyle(2, 0xef4444);
    this.alertBanner.add(bannerBg);

    const titleText = this.scene.add.text(0, -10, `⚡ ${title.toUpperCase()}`, {
      fontSize: '12px',
      fontFamily: 'Courier, monospace',
      fontStyle: 'bold',
      color: '#fca5a5',
      letterSpacing: 1
    });
    titleText.setOrigin(0.5);
    this.alertBanner.add(titleText);

    const subText = this.scene.add.text(0, 8, subtitle, {
      fontSize: '11px',
      fontFamily: 'Segoe UI, sans-serif',
      color: '#ffffff'
    });
    subText.setOrigin(0.5);
    this.alertBanner.add(subText);

    // Pulse and fade after 5.5 seconds
    this.scene.tweens.add({
      targets: this.alertBanner,
      scaleX: { from: 0.9, to: 1.0 },
      scaleY: { from: 0.9, to: 1.0 },
      duration: 300,
      ease: 'Back.easeOut'
    });

    this.scene.time.delayedCall(5000, () => {
      if (this.alertBanner) {
        this.scene.tweens.add({
          targets: this.alertBanner,
          alpha: 0,
          y: 40,
          duration: 500,
          onComplete: () => {
            this.alertBanner?.destroy();
            this.alertBanner = undefined;
          }
        });
      }
    });
  }

  public updateTasks(completed: number, total: number): void {
    this.taskItem.setText(`Complete your assigned task (${completed}/${total})`);
  }

  public updateRoom(roomName: string | null): void {
    this.roomText.setText(roomName ? `◈ ${roomName}` : '◈ Colony Tunnels');
  }

  public showInteractPrompt(action: string, target: string, onClick?: () => void, isInvestigationTarget: boolean = false): void {
    this.onInteractClick = onClick;

    if (isInvestigationTarget) {
      this.desktopPromptBg.setFillStyle(0x2d1a04, 0.95);
      this.desktopPromptBg.setStrokeStyle(1.5, 0xf59e0b);
      this.desktopPromptText.setColor('#fef08a');
      this.mobileActionBg.setFillStyle(0xb45309, 0.95);
      this.mobileActionBg.setStrokeStyle(2.5, 0xf59e0b);
    } else {
      this.desktopPromptBg.setFillStyle(0x0a0f1d, 0.92);
      this.desktopPromptBg.setStrokeStyle(1, 0x334155);
      this.desktopPromptText.setColor('#94a3b8');
      this.mobileActionBg.setFillStyle(0x0284c7, 0.94);
      this.mobileActionBg.setStrokeStyle(2.5, 0x38bdf8);
    }

    if (InputMode.isTouch()) {
      this.mobileActionTitle.setText(action.toUpperCase());
      this.mobileActionTarget.setText(target);
      this.mobileActionBtn.setVisible(true);

      this.scene.tweens.add({
        targets: this.mobileActionBtn,
        alpha: 1.0,
        scaleX: 1.0,
        scaleY: 1.0,
        duration: 200,
        ease: 'Quad.easeOut'
      });
      this.desktopPromptContainer.setVisible(false);
    } else {
      this.desktopPromptText.setText(`[E] ${action} ${target}`);
      this.desktopPromptContainer.setVisible(true);
      this.mobileActionBtn.setVisible(false);
    }

    this.isInteractVisible = true;
  }

  public hideInteractPrompt(): void {
    if (this.isInteractVisible) {
      this.isInteractVisible = false;
      this.onInteractClick = undefined;
      this.desktopPromptContainer.setVisible(false);

      this.scene.tweens.add({
        targets: this.mobileActionBtn,
        alpha: 0,
        duration: 180,
        ease: 'Quad.easeOut',
        onComplete: () => {
          if (!this.isInteractVisible) {
            this.mobileActionBtn.setVisible(false);
          }
        }
      });
    }
  }

  public updateStationMap(currentRoomId: string | null, targetRoomId: string | null): void {
    this.stationMap.updateState(currentRoomId, targetRoomId);
  }

  public getUIDiagnostics(uiCamera: Phaser.Cameras.Scene2D.Camera, worldCamera: Phaser.Cameras.Scene2D.Camera) {
    const inspect = (object: Parameters<typeof inspectUIObject>[0]) => inspectUIObject(object, uiCamera, worldCamera);
    return {
      hud: inspect(this.container), objective: inspect(this.taskBoxBg),
      stationMap: inspect(this.stationMap.container), action: inspect(this.mobileActionBtn),
      roomBadge: inspect(this.roomPillBg), zoom: inspect(this.zoomContainer),
      interactionAvailable: this.isInteractVisible
    };
  }

  public repositionOnResize(): void {
    const cam = this.scene.cameras.main;

    // Reposition Top-Right widgets
    this.roomPillBg.setPosition(cam.width - 80, 28);
    this.roomText.setPosition(cam.width - 80, 28);

    if (this.zoomContainer) {
      this.zoomContainer.setPosition(cam.width - 70, 62);
    }

    const isTouch = InputMode.isTouch();
    const mapX = 85;
    const mapY = isTouch ? cam.height - 195 : cam.height - 65;
    this.stationMap.reposition(mapX, mapY);

    this.desktopTutorialCard?.setPosition(cam.width / 2, cam.height - 110);
    this.alertBanner?.setPosition(cam.width / 2, 75);

    // Reposition bottom prompts
    this.desktopPromptContainer.setPosition(cam.width / 2, cam.height - 48);
    this.mobileActionBtn.setPosition(cam.width - 80, cam.height - 80);

    if (this.controlsBox) {
      this.controlsBox.setPosition(cam.width - 65, cam.height - 48);
    }
  }
}
