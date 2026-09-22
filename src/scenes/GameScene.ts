import Phaser from 'phaser';
import { ColonyMap } from '../world/ColonyMap';
import { Player } from '../entities/Player';
import { NPC } from '../entities/NPC';
import { TaskManager } from '../tasks/TaskManager';
import { GeneratorTaskModal } from '../tasks/GeneratorTaskModal';
import { InterrogationModal } from '../ui/InterrogationModal';
import { EmergencyMeetingModal } from '../ui/EmergencyMeetingModal';
import { HUDOverlay } from '../ui/HUDOverlay';
import { VirtualJoystick } from '../ui/VirtualJoystick';
import { CharacterConfig } from '../types/colony';
import { 
  INITIAL_ROOK_STATE, 
  INITIAL_VALE_STATE, 
  INITIAL_MINA_STATE, 
  INITIAL_PIP_STATE, 
  INITIAL_KIRA_STATE, 
  INITIAL_NOX_STATE 
} from '../types/characterState';
import { InputMode } from '../services/InputMode';
import { RoundManager } from '../systems/RoundManager';

export class GameScene extends Phaser.Scene {
  private map!: ColonyMap;
  private player!: Player;
  private npcs: NPC[] = [];
  private rookNPC?: NPC;
  private taskManager!: TaskManager;
  private roundManager!: RoundManager;
  private generatorModal!: GeneratorTaskModal;
  private interrogationModal!: InterrogationModal;
  private emergencyMeetingModal!: EmergencyMeetingModal;
  private isMeetingOpen: boolean = false;
  private hud!: HUDOverlay;
  private joystick?: VirtualJoystick;
  private generatorProp!: Phaser.GameObjects.Image;
  private generatorGlow!: Phaser.GameObjects.Arc;
  private conduitProp!: Phaser.GameObjects.Image;
  private conduitGlow!: Phaser.GameObjects.Arc;
  private relayProp!: Phaser.GameObjects.Image;
  private relayGlow!: Phaser.GameObjects.Arc;
  private meetingConsoleProp!: Phaser.GameObjects.Image;
  private meetingGlow!: Phaser.GameObjects.Arc;
  private ambientDimOverlay?: Phaser.GameObjects.Rectangle;
  private uiCamera?: Phaser.Cameras.Scene2D.Camera;
  private currentZoom: number = 1.85;
  private readonly MIN_ZOOM: number = 1.25;
  private readonly MAX_ZOOM: number = 2.2;

  constructor() {
    super({ key: 'GameScene' });
  }

  public create(): void {
    // 1. Render Map & Collision Grid
    this.map = new ColonyMap(this);
    this.map.renderMap();

    const worldWidth = ColonyMap.MAP_WIDTH * ColonyMap.TILE_SIZE;
    const worldHeight = ColonyMap.MAP_HEIGHT * ColonyMap.TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    // 2. Spawn Player (Central Hub)
    const playerConfig: CharacterConfig = {
      id: 'player',
      name: 'You',
      color: 0xc92a2a,
      colorHex: '#ffffff',
      accentColor: 0x8a1818,
      eyeColor: 0x111827,
      spawnRoom: 'hub',
      spawnX: 26 * ColonyMap.TILE_SIZE,
      spawnY: 18 * ColonyMap.TILE_SIZE,
      speed: 175,
      isPlayer: true
    };
    this.player = new Player(this, playerConfig);
    this.physics.add.collider(this.player.sprite, this.map.wallsGroup);

    // 3. Spawn the 6 Named NPCs across rooms with full character states
    const npcConfigs: CharacterConfig[] = [
      {
        id: 'rook',
        name: 'Rook',
        color: 0x2b2d30,
        colorHex: '#e2e8f0',
        accentColor: 0x18191a,
        eyeColor: 0x0f172a,
        spawnRoom: 'generator',
        spawnX: 9.5 * ColonyMap.TILE_SIZE,
        spawnY: 18 * ColonyMap.TILE_SIZE,
        speed: 75,
        patrolRadius: 30
      },
      {
        id: 'mina',
        name: 'Mina',
        color: 0x1971c2,
        colorHex: '#60a5fa',
        accentColor: 0x0f4c81,
        eyeColor: 0x0a192f,
        spawnRoom: 'biolab',
        spawnX: 42 * ColonyMap.TILE_SIZE,
        spawnY: 6 * ColonyMap.TILE_SIZE,
        speed: 80,
        patrolRadius: 40
      },
      {
        id: 'pip',
        name: 'Pip',
        color: 0xd97706,
        colorHex: '#fde047',
        accentColor: 0x92400e,
        eyeColor: 0x451a03,
        spawnRoom: 'food_storage',
        spawnX: 9 * ColonyMap.TILE_SIZE,
        spawnY: 6 * ColonyMap.TILE_SIZE,
        speed: 85,
        patrolRadius: 40
      },
      {
        id: 'vale',
        name: 'Vale',
        color: 0x2f9e44,
        colorHex: '#4ade80',
        accentColor: 0x1e632b,
        eyeColor: 0x052e16,
        spawnRoom: 'hub',
        spawnX: 29 * ColonyMap.TILE_SIZE,
        spawnY: 19 * ColonyMap.TILE_SIZE,
        speed: 75,
        patrolRadius: 45
      },
      {
        id: 'nox',
        name: 'Nox',
        color: 0x7048e8,
        colorHex: '#c084fc',
        accentColor: 0x4c2889,
        eyeColor: 0x2e1065,
        spawnRoom: 'nursery',
        spawnX: 26 * ColonyMap.TILE_SIZE,
        spawnY: 32 * ColonyMap.TILE_SIZE,
        speed: 80,
        patrolRadius: 40
      },
      {
        id: 'kira',
        name: 'Kira',
        color: 0xe8590c,
        colorHex: '#fb923c',
        accentColor: 0x9a3412,
        eyeColor: 0x431407,
        spawnRoom: 'comms',
        spawnX: 42 * ColonyMap.TILE_SIZE,
        spawnY: 17 * ColonyMap.TILE_SIZE,
        speed: 80,
        patrolRadius: 40
      }
    ];

    const getInitialStateForChar = (id: string) => {
      switch (id) {
        case 'rook': return { ...INITIAL_ROOK_STATE };
        case 'vale': return { ...INITIAL_VALE_STATE };
        case 'mina': return { ...INITIAL_MINA_STATE };
        case 'pip': return { ...INITIAL_PIP_STATE };
        case 'kira': return { ...INITIAL_KIRA_STATE };
        case 'nox': return { ...INITIAL_NOX_STATE };
        default: return undefined;
      }
    };

    this.npcs = npcConfigs.map(cfg => {
      const state = getInitialStateForChar(cfg.id);
      const npc = new NPC(this, cfg, state);
      this.physics.add.collider(npc.sprite, this.map.wallsGroup);
      if (cfg.id === 'rook') {
        this.rookNPC = npc;
      }
      return npc;
    });

    // 4. Interactive Generator Console Prop
    const genTaskX = 7 * ColonyMap.TILE_SIZE;
    const genTaskY = 19 * ColonyMap.TILE_SIZE;

    this.generatorGlow = this.add.circle(genTaskX + 16, genTaskY - 2, 34, 0xf59e0b, 0.25);
    this.generatorGlow.setDepth(2);
    this.tweens.add({
      targets: this.generatorGlow,
      scaleX: 1.25,
      scaleY: 1.25,
      alpha: 0.45,
      duration: 1200,
      yoyo: true,
      repeat: -1
    });

    this.generatorProp = this.add.image(genTaskX, genTaskY, 'generator_console');
    this.generatorProp.setDepth(3);

    // 5. Interactive Conduit Inspection Prop (near Generator Room entrance)
    const conduitX = 12 * ColonyMap.TILE_SIZE;
    const conduitY = 17.5 * ColonyMap.TILE_SIZE;

    this.conduitGlow = this.add.circle(conduitX, conduitY, 18, 0x38bdf8, 0.3);
    this.conduitGlow.setDepth(2);
    this.tweens.add({
      targets: this.conduitGlow,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0.6,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    this.conduitProp = this.add.image(conduitX, conduitY, 'prop_conduit_box');
    this.conduitProp.setDepth(3);

    // 6. Interactive Pheromone Relay Prop (in Comms / Relay Sector)
    const relayX = 43 * ColonyMap.TILE_SIZE;
    const relayY = 19 * ColonyMap.TILE_SIZE;

    this.relayGlow = this.add.circle(relayX, relayY, 20, 0x38bdf8, 0.25);
    this.relayGlow.setDepth(2);
    this.tweens.add({
      targets: this.relayGlow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.45,
      duration: 1400,
      yoyo: true,
      repeat: -1
    });

    this.relayProp = this.add.image(relayX, relayY, 'prop_conduit_box');
    this.relayProp.setDepth(3);

    // 7. Interactive Emergency Meeting Console Prop (Central Hub)
    const meetingX = 26 * ColonyMap.TILE_SIZE;
    const meetingY = 18 * ColonyMap.TILE_SIZE;

    this.meetingGlow = this.add.circle(meetingX, meetingY, 26, 0xd97706, 0.25);
    this.meetingGlow.setDepth(2);
    this.tweens.add({
      targets: this.meetingGlow,
      scaleX: 1.3,
      scaleY: 1.3,
      alpha: 0.45,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    this.meetingConsoleProp = this.add.image(meetingX, meetingY, 'prop_meeting_console');
    this.meetingConsoleProp.setDepth(3);

    // 7b. Subterranean Ambient Atmospheric Dust / Spores
    this.createAmbientAtmosphere(worldWidth, worldHeight);

    // 8. Initialize Round Manager for Opening Gameplay Sequence
    this.roundManager = new RoundManager();

    // 9. Tasks & Modals
    this.taskManager = new TaskManager();
    this.generatorModal = new GeneratorTaskModal(this, () => {
      this.onGeneratorTaskCompleted();
      if (InputMode.isTouch()) {
        this.joystick?.setVisible(true);
      }
    });

    if (this.rookNPC && this.rookNPC.characterState) {
      this.interrogationModal = new InterrogationModal(this, this.rookNPC.characterState, () => {
        // Resume game focus
        if (InputMode.isTouch()) {
          this.joystick?.setVisible(true);
        }
      }, (leadId) => {
        this.roundManager.discoverLead(leadId);
      }, this.roundManager);
    }

    this.isMeetingOpen = false;
    this.emergencyMeetingModal = new EmergencyMeetingModal(this, this.roundManager, () => {
      this.replayRound();
    });

    // 10. HUD & Touch Joystick
    this.hud = new HUDOverlay(this);
    this.hud.updateTasks(this.taskManager.getCompletedCount(), this.taskManager.getTotalCount());

    this.taskManager.onTaskUpdated = (completed, total) => {
      this.hud.updateTasks(completed, total);
    };

    this.roundManager.onStageChanged = (stage, objective) => {
      this.hud.updateObjective(objective);
      console.log(`[COLONY] stage: ${stage}`);
      console.log(`[COLONY] objective: ${objective.title}`);
      console.log(`[COLONY] target: ${this.roundManager.getActiveSuspectId() || 'none (world target)'}`);
      console.log(`[COLONY] HUD synchronized`);
    };
    this.roundManager.onIncidentTriggered = () => {
      this.triggerIncidentEffects();
    };
    this.roundManager.onRelaySabotageTriggered = () => {
      this.triggerRelaySabotageEffects();
    };
    this.roundManager.onLeadDiscovered = (_leadId, title, subtitle) => {
      this.hud.showIncidentAlert(title, subtitle);
      console.log(`[COLONY] lead discovered: ${title} // ${subtitle}`);
    };
    this.roundManager.start();

    // First movement dismisses desktop tutorial
    this.player.onFirstMovement = () => {
      this.hud.dismissDesktopTutorial();
    };

    // Initialize Virtual Joystick if on touch/mobile
    if (InputMode.isTouch()) {
      this.enableTouchJoystick();
    }

    InputMode.onModeChanged((isTouch) => {
      if (isTouch && !this.joystick) {
        this.enableTouchJoystick();
      }
    });

    // 8. World Camera (Follows Player at 1.85x Zoom) & Dedicated Stationary UI Camera
    this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
    this.cameras.main.startFollow(this.player.sprite, true, 0.08, 0.08);
    this.cameras.main.setZoom(this.currentZoom);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    // Dedicated UI Camera (Fixed 1x scale, (0,0) scroll, crystal-clear stationary HUD)
    this.uiCamera = this.cameras.add(0, 0, this.scale.width, this.scale.height, false, 'UI_CAMERA');
    this.uiCamera.setScroll(0, 0);
    this.uiCamera.setZoom(1);

    this.setupCameraLayers();

    // Zoom Buttons from HUD
    this.hud.onZoomIn = () => this.adjustZoom(0.18);
    this.hud.onZoomOut = () => this.adjustZoom(-0.18);
    this.hud.onZoomFit = () => this.fitToScreen();

    // Mouse Wheel Zoom
    this.input.on('wheel', (_pointer: Phaser.Input.Pointer, _gameObjects: unknown[], _deltaX: number, deltaY: number) => {
      this.adjustZoom(deltaY > 0 ? -0.12 : 0.12);
    });

    // Window/Viewport resize handling
    const resizeViewport = () => {
      const { width, height } = this.scale.gameSize;
      this.cameras.main.setSize(width, height);
      this.uiCamera?.setSize(width, height);
      this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
      this.setupCameraLayers();
      this.hud.repositionOnResize();
      this.joystick?.repositionOnResize();
    };
    this.scale.on('resize', resizeViewport);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', resizeViewport);
      // These scene-owned objects are destroyed on shutdown. Recreate them on replay.
      this.joystick = undefined;
      this.uiCamera = undefined;
    });
  }

  private setupCameraLayers(): void {
    if (!this.uiCamera) return;

    const uiObjects: Phaser.GameObjects.GameObject[] = [this.hud.container];
    if (this.joystick) {
      uiObjects.push(this.joystick.container);
      uiObjects.push(this.joystick['touchZone']);
    }

    // World camera ignores UI
    this.cameras.main.ignore(uiObjects);

    // UI camera ignores all non-UI children in scene
    this.children.list.forEach(child => {
      if (!uiObjects.includes(child)) {
        this.uiCamera?.ignore(child);
      }
    });
  }

  private createAmbientAtmosphere(worldWidth: number, worldHeight: number): void {
    const sporeColors = [0xf59e0b, 0x38bdf8, 0x10b981, 0xca8a04, 0xfde047];
    for (let i = 0; i < 35; i++) {
      const x = Phaser.Math.Between(40, worldWidth - 40);
      const y = Phaser.Math.Between(40, worldHeight - 40);
      const color = Phaser.Utils.Array.GetRandom(sporeColors);
      const radius = Phaser.Math.FloatBetween(1, 2.2);
      const spore = this.add.circle(x, y, radius, color, Phaser.Math.FloatBetween(0.18, 0.45));
      spore.setDepth(6);

      this.tweens.add({
        targets: spore,
        x: spore.x + Phaser.Math.Between(-25, 25),
        y: spore.y + Phaser.Math.Between(-35, 35),
        alpha: { from: 0.12, to: 0.5 },
        duration: Phaser.Math.Between(3200, 6500),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    }
  }

  private adjustZoom(delta: number): void {
    const targetZoom = Phaser.Math.Clamp(this.currentZoom + delta, this.MIN_ZOOM, this.MAX_ZOOM);
    if (Math.abs(targetZoom - this.currentZoom) > 0.01) {
      this.currentZoom = targetZoom;
      this.tweens.add({
        targets: this.cameras.main,
        zoom: this.currentZoom,
        duration: 180,
        ease: 'Quad.easeOut'
      });
    }
  }

  private fitToScreen(): void {
    const targetZoom = this.calculateFitZoom();
    this.currentZoom = targetZoom;
    this.tweens.add({
      targets: this.cameras.main,
      zoom: this.currentZoom,
      duration: 250,
      ease: 'Quad.easeOut'
    });
  }

  private calculateFitZoom(): number {
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 960;
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 640;
    const aspect = windowWidth / Math.max(windowHeight, 1);

    // On ultra-wide / desktop aspect ratios, ~1.65 allows comfortable corridor view
    // On narrower / standard mobile landscape aspect ratios, ~1.85-1.95 ensures characters stay recognizable
    let fit = 1.75;
    if (aspect >= 1.7) {
      fit = 1.65;
    } else if (aspect <= 1.4) {
      fit = 1.90;
    }

    return Phaser.Math.Clamp(fit, this.MIN_ZOOM, this.MAX_ZOOM);
  }

  private triggerIncidentEffects(): void {
    // 1. BOOM: Screen Shake / Deep impact
    this.cameras.main.shake(750, 0.02);

    // 2. Blackout & Emergency Lighting Cycle
    if (!this.ambientDimOverlay) {
      const worldWidth = ColonyMap.MAP_WIDTH * ColonyMap.TILE_SIZE;
      const worldHeight = ColonyMap.MAP_HEIGHT * ColonyMap.TILE_SIZE;
      this.ambientDimOverlay = this.add.rectangle(worldWidth / 2, worldHeight / 2, worldWidth, worldHeight, 0x030205, 0);
      this.ambientDimOverlay.setDepth(50);
    }

    // Sequence: Instant near-complete blackout (0.96) for ~700ms -> emergency lighting returns
    this.tweens.chain({
      targets: this.ambientDimOverlay,
      tweens: [
        {
          alpha: 0.96, // Near pitch-black silhouette
          duration: 60,
          ease: 'Linear'
        },
        {
          alpha: 0.96, // Hold blackout
          duration: 650,
          ease: 'Linear'
        },
        {
          alpha: 0.35, // Emergency burst
          duration: 150,
          ease: 'Quad.easeInOut'
        },
        {
          alpha: 0.7, // Emergency flicker
          duration: 120,
          ease: 'Quad.easeInOut'
        },
        {
          alpha: 0.28, // Settle at emergency ambient dimness
          duration: 600,
          ease: 'Quad.easeOut'
        }
      ]
    });

    // Generator console shifts to emergency flashing amber/red
    this.generatorGlow.setFillStyle(0xef4444, 0.45);
    this.tweens.add({
      targets: this.generatorGlow,
      scaleX: 1.4,
      scaleY: 1.4,
      alpha: 0.6,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // 3. Dust / Spore particle bursts around player & generator
    for (let i = 0; i < 20; i++) {
      const pX = this.player.x + Phaser.Math.Between(-90, 90);
      const pY = this.player.y + Phaser.Math.Between(-90, 90);
      const spore = this.add.circle(pX, pY, Phaser.Math.Between(2, 4), 0xfbbf24, 0.8);
      spore.setDepth(45);
      this.tweens.add({
        targets: spore,
        y: spore.y + Phaser.Math.Between(18, 40),
        x: spore.x + Phaser.Math.Between(-15, 15),
        alpha: 0,
        duration: Phaser.Math.Between(900, 1600),
        ease: 'Quad.easeOut',
        onComplete: () => spore.destroy()
      });
    }

    // 4. Alert banner in HUD
    this.hud.showIncidentAlert('POWER FAILURE', 'Generator signal lost in sector 4');

    // 5. Trigger alert reaction on all nearby NPCs
    this.npcs.forEach(npc => {
      npc.alertReaction();
    });
  }

  private enableTouchJoystick(): void {
    if (this.joystick) return;
    this.joystick = new VirtualJoystick(this);
    this.player.joystickVector = this.joystick.vector;
    this.setupCameraLayers();
  }

  public update(_time: number, delta: number): void {
    // Freeze player input if any modal is active
    if (this.generatorModal?.isOpen || this.interrogationModal?.isOpen || this.emergencyMeetingModal?.isOpen || this.isMeetingOpen) {
      this.player.sprite.setVelocity(0, 0);
      return;
    }

    this.player.update();
    this.npcs.forEach(npc => npc.update());

    // Update current room name in HUD
    const currentRoom = this.map.getRoomAt(this.player.x, this.player.y);
    const roomId = currentRoom ? currentRoom.id : null;
    this.hud.updateRoom(currentRoom ? currentRoom.name : null);

    // Update Round Manager State & Guide Pointer & Station Map
    if (this.roundManager) {
      this.roundManager.update(delta, this.player.x, this.player.y, roomId);
      this.hud.updateGuidePointer(this.player.x, this.player.y);
      this.hud.updateStationMap(roomId, this.roundManager.getTargetRoomId());
    }

    // ==============================================
    // Generic Proximity & Interaction Priority System
    // ==============================================
    const isTouch = InputMode.isTouch();
    const activeSuspect = this.roundManager.getActiveSuspectId();

    // 1. Update proximity visual indicators for all NPCs (highlight active suspect)
    this.npcs.forEach(npc => {
      const isActive = npc.config.id === activeSuspect;
      npc.updateProximityIndicator(this.player.x, this.player.y, isTouch, isActive);
    });

    // 2. Identify candidate interactable targets
    interface InteractableCandidate {
      type: 'npc' | 'prop';
      id: string;
      dist: number;
      action: string;
      target: string;
      isInvestigationTarget: boolean;
      onTrigger: () => void;
    }

    const candidates: InteractableCandidate[] = [];

    // Check ALL named NPCs (Gate full interrogation to the currently active suspect)
    this.npcs.forEach(npc => {
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        npc.x,
        npc.y
      );
      if (dist <= 65) {
        const isActive = npc.config.id === activeSuspect;
        if (isActive) {
          candidates.push({
            type: 'npc',
            id: npc.config.id,
            dist: dist,
            action: 'Question',
            target: npc.config.name,
            isInvestigationTarget: true,
            onTrigger: () => this.openInterrogation(npc)
          });
        } else {
          candidates.push({
            type: 'npc',
            id: npc.config.id,
            dist: dist,
            action: 'Talk to',
            target: npc.config.name,
            isInvestigationTarget: false,
            onTrigger: () => this.talkAmbientNPC(npc)
          });
        }
      }
    });

    // Check Generator Conduit inspection point
    if (this.roundManager.hasLeadConduitNoise && !this.roundManager.hasEvidenceDamagedRelay) {
      const distToConduit = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.conduitProp.x,
        this.conduitProp.y
      );
      if (distToConduit <= 65) {
        candidates.push({
          type: 'prop',
          id: 'conduit',
          dist: distToConduit,
          action: 'Inspect',
          target: 'Conduit',
          isInvestigationTarget: true,
          onTrigger: () => this.inspectConduit()
        });
      }
    }

    // Check Pheromone Relay damaged control point
    if (this.roundManager.hasEvidencePipUndelivered && !this.roundManager.hasEvidenceRelaySabotage) {
      const distToRelay = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.relayProp.x,
        this.relayProp.y
      );
      if (distToRelay <= 65) {
        candidates.push({
          type: 'prop',
          id: 'relay',
          dist: distToRelay,
          action: 'Inspect',
          target: 'Pheromone Relay',
          isInvestigationTarget: true,
          onTrigger: () => this.inspectRelay()
        });
      }
    }

    // Check Emergency Meeting Console
    if (this.roundManager.hasEvidenceGatheredComplete) {
      const distToMeeting = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.meetingConsoleProp.x,
        this.meetingConsoleProp.y
      );
      if (distToMeeting <= 65) {
        candidates.push({
          type: 'prop',
          id: 'meeting',
          dist: distToMeeting,
          action: 'Call',
          target: 'Meeting',
          isInvestigationTarget: true,
          onTrigger: () => this.interactMeetingConsole()
        });
      }
    }

    // Check Generator Console
    const genTask = this.taskManager.getTask('generator_calibrate');
    if (genTask && !genTask.isCompleted) {
      const distToGen = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        this.generatorProp.x,
        this.generatorProp.y
      );
      if (distToGen <= 65) {
        candidates.push({
          type: 'prop',
          id: 'generator',
          dist: distToGen,
          action: 'Fix',
          target: 'Generator',
          isInvestigationTarget: false,
          onTrigger: () => this.openGeneratorTask()
        });
      }
    }

    // 3. Select single nearest priority interactable (investigation targets take priority when close)
    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        if (a.isInvestigationTarget && !b.isInvestigationTarget) return -1;
        if (!a.isInvestigationTarget && b.isInvestigationTarget) return 1;
        return a.dist - b.dist;
      });
      const nearest = candidates[0];

      this.hud.showInteractPrompt(nearest.action, nearest.target, () => {
        nearest.onTrigger();
      }, nearest.isInvestigationTarget);

      if (this.player.isInteractPressed()) {
        nearest.onTrigger();
        return;
      }
    } else {
      this.hud.hideInteractPrompt();
    }
  }

  private talkAmbientNPC(npc: NPC): void {
    const activeSuspect = this.roundManager?.getActiveSuspectId();
    const currentObjective = this.roundManager?.getCurrentObjective();

    if (activeSuspect && activeSuspect !== npc.config.id) {
      const dialogue = `${npc.config.name} is busy with duties. Objective: ${currentObjective.title}.`;
      npc.showSpeechBubble(dialogue);
    } else {
      const dialogue = `${npc.config.name} is focused on their station.`;
      npc.showSpeechBubble(dialogue);
    }
  }

  private triggerRelaySabotageEffects(): void {
    // 1. Sharp impact / Alarm jolt
    this.cameras.main.shake(350, 0.015);

    // 2. Brief Environmental Flicker (Distinct from generator blackout)
    if (this.ambientDimOverlay) {
      this.tweens.chain({
        targets: this.ambientDimOverlay,
        tweens: [
          { alpha: 0.65, duration: 80, ease: 'Linear' },
          { alpha: 0.15, duration: 100, ease: 'Linear' },
          { alpha: 0.50, duration: 80, ease: 'Linear' },
          { alpha: 0.28, duration: 250, ease: 'Quad.easeOut' }
        ]
      });
    }

    // 3. Relay glow switches to emergency pulsing alarm
    this.relayGlow.setFillStyle(0xef4444, 0.6);
    this.tweens.add({
      targets: this.relayGlow,
      scaleX: 1.6,
      scaleY: 1.6,
      alpha: 0.75,
      duration: 350,
      yoyo: true,
      repeat: -1
    });

    // 4. Alert banner in HUD
    this.hud.showIncidentAlert('PHEROMONE RELAY OFFLINE', 'Pheromone Relay signal lost in Sector 2');

    // 5. NPC startled reaction
    this.npcs.forEach(npc => npc.alertReaction());
  }

  private inspectConduit(): void {
    this.hud.hideInteractPrompt();

    // Spark / Discovery Visual FX
    for (let i = 0; i < 12; i++) {
      const spark = this.add.circle(
        this.conduitProp.x + Phaser.Math.Between(-8, 8),
        this.conduitProp.y + Phaser.Math.Between(-8, 8),
        Phaser.Math.Between(2, 4),
        0x38bdf8,
        0.9
      );
      spark.setDepth(25);
      this.tweens.add({
        targets: spark,
        x: spark.x + Phaser.Math.Between(-25, 25),
        y: spark.y + Phaser.Math.Between(-25, 25),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(400, 750),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }

    this.conduitGlow.setFillStyle(0x4ade80, 0.5);
    this.roundManager.discoverLead('evidence_damaged_relay');
  }

  private inspectRelay(): void {
    this.hud.hideInteractPrompt();

    // Spark / Discovery Visual FX
    for (let i = 0; i < 14; i++) {
      const spark = this.add.circle(
        this.relayProp.x + Phaser.Math.Between(-8, 8),
        this.relayProp.y + Phaser.Math.Between(-8, 8),
        Phaser.Math.Between(2, 4),
        0xfb923c,
        0.9
      );
      spark.setDepth(25);
      this.tweens.add({
        targets: spark,
        x: spark.x + Phaser.Math.Between(-30, 30),
        y: spark.y + Phaser.Math.Between(-30, 30),
        alpha: 0,
        scale: 0.2,
        duration: Phaser.Math.Between(400, 750),
        ease: 'Quad.easeOut',
        onComplete: () => spark.destroy()
      });
    }

    this.relayGlow.setFillStyle(0xef4444, 0.4);
    this.roundManager.discoverLead('evidence_relay_sabotage');
  }

  private interactMeetingConsole(): void {
    if (this.isMeetingOpen || this.emergencyMeetingModal?.isOpen) return;
    console.log('[COLONY] Emergency meeting console activated');
    console.log('[COLONY] Emergency meeting ready');
    this.hud.hideInteractPrompt();
    this.openEmergencyMeeting();
  }

  private openEmergencyMeeting(): void {
    this.isMeetingOpen = true;
    this.player.sprite.setVelocity(0, 0);
    this.hud.container.setVisible(false);
    if (this.joystick) {
      this.joystick.container.setVisible(false);
    }
    this.emergencyMeetingModal.open();
  }

  private replayRound(): void {
    this.isMeetingOpen = false;
    this.emergencyMeetingModal?.close();
    this.interrogationModal?.close();
    this.generatorModal?.close();
    this.scene.restart();
  }

  private openInterrogation(npc: NPC): void {
    // Only open full interrogation if this NPC is currently the active suspect
    if (this.roundManager.getActiveSuspectId() !== npc.config.id) {
      this.talkAmbientNPC(npc);
      return;
    }

    if (this.interrogationModal && !this.interrogationModal.isOpen && npc.characterState) {
      this.player.sprite.setVelocity(0, 0);
      this.joystick?.setVisible(false);
      this.hud.hideInteractPrompt();
      this.interrogationModal.setCharacterState(npc.characterState);
      this.interrogationModal.setRoundManager(this.roundManager);
      this.interrogationModal.hasEvidenceRookUnattended = this.roundManager.hasEvidenceRookUnattended;
      if (npc.config.id === 'rook') {
        this.roundManager.onTalkedToRook();
      }
      this.interrogationModal.open();
    }
  }

  private openGeneratorTask(): void {
    if (!this.generatorModal.isOpen) {
      this.player.sprite.setVelocity(0, 0);
      this.joystick?.setVisible(false);
      this.generatorModal.open();
    }
  }

  private onGeneratorTaskCompleted(): void {
    this.taskManager.completeTask('generator_calibrate');
    this.hud.hideInteractPrompt();

    this.generatorGlow.setFillStyle(0x22c55e, 0.5);
    this.generatorGlow.setScale(1.6);
    this.tweens.add({
      targets: this.generatorGlow,
      scaleX: 1.15,
      scaleY: 1.15,
      alpha: 0.35,
      duration: 600
    });

    const burst = this.add.circle(this.generatorProp.x, this.generatorProp.y, 12, 0x22c55e, 0.85);
    burst.setDepth(20);
    this.tweens.add({
      targets: burst,
      scaleX: 7,
      scaleY: 7,
      alpha: 0,
      duration: 900,
      onComplete: () => burst.destroy()
    });
  }
}
