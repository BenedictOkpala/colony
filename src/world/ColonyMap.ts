import Phaser from 'phaser';
import { ColonyRoom } from '../types/colony';

export class ColonyMap {
  public static readonly TILE_SIZE = 32;
  public static readonly MAP_WIDTH = 52; // 52 tiles = 1664px
  public static readonly MAP_HEIGHT = 40; // 40 tiles = 1280px

  public rooms: ColonyRoom[] = [
    {
      id: 'hub',
      name: 'CENTRAL HUB',
      x: 18,
      y: 14,
      width: 16,
      height: 11,
      colorTheme: 0xd97706,
      labelX: 26 * 32,
      labelY: 15 * 32
    },
    {
      id: 'generator',
      name: 'GENERATOR',
      x: 4,
      y: 14,
      width: 11,
      height: 10,
      colorTheme: 0xf59e0b,
      labelX: 9.5 * 32,
      labelY: 15 * 32
    },
    {
      id: 'food_storage',
      name: 'FOOD STORAGE',
      x: 4,
      y: 3,
      width: 11,
      height: 8,
      colorTheme: 0xd4a017,
      labelX: 9.5 * 32,
      labelY: 4 * 32
    },
    {
      id: 'biolab',
      name: 'BIO-LAB',
      x: 37,
      y: 3,
      width: 11,
      height: 8,
      colorTheme: 0x10b981,
      labelX: 42.5 * 32,
      labelY: 4 * 32
    },
    {
      id: 'comms',
      name: 'COMMS',
      x: 37,
      y: 14,
      width: 11,
      height: 10,
      colorTheme: 0x38bdf8,
      labelX: 42.5 * 32,
      labelY: 15 * 32
    },
    {
      id: 'nursery',
      name: 'NURSERY',
      x: 18,
      y: 28,
      width: 16,
      height: 9,
      colorTheme: 0xca8a04,
      labelX: 26 * 32,
      labelY: 29 * 32
    }
  ];

  public wallsGroup!: Phaser.Physics.Arcade.StaticGroup;
  private scene: Phaser.Scene;
  private grid: boolean[][] = []; // true = walkable earthen floor, false = solid cavern wall

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.initGrid();
  }

  private initGrid(): void {
    for (let y = 0; y < ColonyMap.MAP_HEIGHT; y++) {
      this.grid[y] = [];
      for (let x = 0; x < ColonyMap.MAP_WIDTH; x++) {
        this.grid[y][x] = false;
      }
    }

    // 1. Carve rooms
    this.rooms.forEach(room => {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (y >= 0 && y < ColonyMap.MAP_HEIGHT && x >= 0 && x < ColonyMap.MAP_WIDTH) {
            this.grid[y][x] = true;
          }
        }
      }
    });

    // 2. Carve organic connecting tunnels (3-4 tiles wide)
    // Horizontal tunnel: Generator <-> Hub <-> Comms
    this.carveHorizontalTunnel(15, 4, 47, 4);

    // Vertical tunnel West: Food Storage <-> Generator
    this.carveVerticalTunnel(9, 3, 24, 4);

    // Vertical tunnel East: BioLab <-> Comms
    this.carveVerticalTunnel(42, 3, 24, 4);

    // Horizontal tunnel Top: Food Storage <-> BioLab
    this.carveHorizontalTunnel(6, 9, 43, 3);

    // Vertical tunnel South: Hub <-> Nursery
    this.carveVerticalTunnel(25, 20, 36, 4);
  }

  private carveHorizontalTunnel(yStart: number, xStart: number, xEnd: number, thickness: number): void {
    for (let t = 0; t < thickness; t++) {
      const y = yStart + t;
      for (let x = Math.min(xStart, xEnd); x <= Math.max(xStart, xEnd); x++) {
        if (y >= 0 && y < ColonyMap.MAP_HEIGHT && x >= 0 && x < ColonyMap.MAP_WIDTH) {
          this.grid[y][x] = true;
        }
      }
    }
  }

  private carveVerticalTunnel(xStart: number, yStart: number, yEnd: number, thickness: number): void {
    for (let t = 0; t < thickness; t++) {
      const x = xStart + t;
      for (let y = Math.min(yStart, yEnd); y <= Math.max(yStart, yEnd); y++) {
        if (y >= 0 && y < ColonyMap.MAP_HEIGHT && x >= 0 && x < ColonyMap.MAP_WIDTH) {
          this.grid[y][x] = true;
        }
      }
    }
  }

  public renderMap(): void {
    this.wallsGroup = this.scene.physics.add.staticGroup();

    // 1. Render floor and cavern wall tiles
    for (let y = 0; y < ColonyMap.MAP_HEIGHT; y++) {
      for (let x = 0; x < ColonyMap.MAP_WIDTH; x++) {
        const posX = x * ColonyMap.TILE_SIZE + ColonyMap.TILE_SIZE / 2;
        const posY = y * ColonyMap.TILE_SIZE + ColonyMap.TILE_SIZE / 2;

        if (this.grid[y][x]) {
          const isRoom = this.rooms.some(
            r => x >= r.x && x < r.x + r.width && y >= r.y && y < r.y + r.height
          );
          const tileTexture = isRoom ? 'tile_dirt_floor' : 'tile_tunnel_floor';
          const floor = this.scene.add.image(posX, posY, tileTexture);
          floor.setDepth(0);
        } else {
          const hasWalkableNeighbor = this.checkNeighborWalkable(x, y);
          if (hasWalkableNeighbor) {
            const wall = this.wallsGroup.create(posX, posY, 'tile_cavern_wall');
            wall.setDepth(1);
            wall.refreshBody();
          } else {
            const abyss = this.scene.add.rectangle(
              posX,
              posY,
              ColonyMap.TILE_SIZE,
              ColonyMap.TILE_SIZE,
              0x090503
            );
            abyss.setDepth(0);
          }
        }
      }
    }

    // 2. Render Room Signboards, Directional Nav Signs, and Environmental Props
    this.renderChamberProps();
  }

  private renderChamberProps(): void {
    // Room Headers & Signboards
    this.rooms.forEach(room => {
      const signBg = this.scene.add.rectangle(
        room.labelX,
        room.labelY,
        room.name.length * 9 + 24,
        22,
        0x140c07,
        0.92
      );
      signBg.setStrokeStyle(1.5, 0x78350f, 0.95);
      signBg.setDepth(2);

      const label = this.scene.add.text(room.labelX, room.labelY, room.name, {
        fontSize: '11px',
        fontFamily: 'Courier, monospace',
        fontStyle: 'bold',
        color: '#f59e0b'
      });
      label.setOrigin(0.5);
      label.setDepth(3);
    });

    // ==========================================
    // 1. CENTRAL HUB (Atmospheric Meeting Chamber)
    // ==========================================
    // Central Meeting Dais / Ring
    const meetingRing = this.scene.add.image(26 * 32, 19.5 * 32, 'prop_meeting_ring');
    meetingRing.setDepth(1);

    // Warm Hub Ambient Center Light
    this.addAmbientLightPool(26 * 32, 19.5 * 32, 80, 0xf59e0b, 0.14);

    // Hanging Ant Creed Banner on North Wall
    const hubBanner = this.scene.add.image(26 * 32, 16.5 * 32, 'prop_hub_banner');
    hubBanner.setDepth(2);

    // Directional Navigation Signs in Central Hub
    this.addNavSign(18.5 * 32, 17 * 32, 'sign_gen_left');       // Left toward Generator / Food Storage
    this.addNavSign(33.5 * 32, 17 * 32, 'sign_biolab_right');   // Right toward Bio-Lab & Comms
    this.addNavSign(26 * 32, 23.5 * 32, 'sign_nursery_down');    // Down toward Nursery

    // Organic Rock Clusters & Roots breaking rectangular boundaries
    this.addRockCluster(19.5 * 32, 15 * 32);
    this.addRockCluster(32.5 * 32, 15 * 32);
    this.addRockCluster(19.5 * 32, 23 * 32);
    this.addRockCluster(32.5 * 32, 23 * 32);
    this.addRoots(23 * 32, 15 * 32);
    this.addRoots(29 * 32, 15 * 32);

    // Warm Ambient Lanterns in Central Hub
    this.addLantern(21 * 32, 16 * 32);
    this.addLantern(31 * 32, 16 * 32);
    this.addLantern(21 * 32, 22 * 32);
    this.addLantern(31 * 32, 22 * 32);

    // ==========================================
    // 2. WEST TUNNEL & JUNCTION (To Generator & Food Storage)
    // ==========================================
    // Tunnel portal arch leaving Central Hub
    this.addTunnelArch(17 * 32, 17 * 32);
    this.addTunnelArch(15 * 32, 17 * 32);

    // West T-Junction Navigation Sign (at tile x: 10, y: 17)
    this.addNavSign(11 * 32, 15 * 32, 'sign_food_up');   // Up to Food Storage

    // ==========================================
    // 3. GENERATOR ROOM
    // ==========================================
    this.addAmbientLightPool(9.5 * 32, 18 * 32, 70, 0xf59e0b, 0.18);
    const genAux = this.scene.add.image(11.5 * 32, 21 * 32, 'prop_generator_aux');
    genAux.setDepth(2);
    this.addLantern(5 * 32, 16 * 32);
    this.addLantern(13 * 32, 16 * 32);
    this.addRockCluster(4.5 * 32, 22.5 * 32);
    this.addRoots(13.5 * 32, 22.5 * 32);
    this.addNavSign(13.5 * 32, 17 * 32, 'sign_hub'); // Exit back to Central Hub

    // ==========================================
    // 4. FOOD STORAGE
    // ==========================================
    this.addAmbientLightPool(9.5 * 32, 7 * 32, 60, 0xeab308, 0.16);
    const foodCrates = this.scene.add.image(7.5 * 32, 7.5 * 32, 'prop_food_crates');
    foodCrates.setDepth(2);
    const foodShelves = this.scene.add.image(11.5 * 32, 5.5 * 32, 'prop_food_shelves');
    foodShelves.setDepth(2);
    this.addLantern(5 * 32, 4 * 32);
    this.addLantern(14 * 32, 4 * 32);
    this.addRockCluster(13 * 32, 8 * 32);
    this.addNavSign(11 * 32, 9 * 32, 'sign_hub'); // Exit sign back to Hub

    // ==========================================
    // 5. EAST TUNNEL & JUNCTION (To Bio-Lab & Comms)
    // ==========================================
    this.addTunnelArch(35 * 32, 17 * 32);

    // East Junction Navigation Signs (at tile x: 42, y: 17)
    this.addNavSign(41 * 32, 14 * 32, 'sign_biolab_right'); // Up to Bio-Lab
    this.addNavSign(45 * 32, 17 * 32, 'sign_comms_right');  // East into Comms

    // ==========================================
    // 6. BIO-LAB
    // ==========================================
    this.addAmbientLightPool(42.5 * 32, 7 * 32, 65, 0x10b981, 0.16);
    const bioTubes = this.scene.add.image(44 * 32, 7.5 * 32, 'prop_biolab_tubes');
    bioTubes.setDepth(2);
    const bioMicroscope = this.scene.add.image(40 * 32, 5.5 * 32, 'prop_biolab_microscope');
    bioMicroscope.setDepth(2);
    this.addLantern(38 * 32, 4 * 32);
    this.addLantern(47 * 32, 4 * 32);
    this.addRockCluster(38 * 32, 8 * 32);
    this.addNavSign(41 * 32, 9 * 32, 'sign_hub');

    // ==========================================
    // 7. COMMS / PHEROMONE RELAY
    // ==========================================
    this.addAmbientLightPool(42.5 * 32, 19 * 32, 65, 0x38bdf8, 0.16);
    const commsConsole = this.scene.add.image(44 * 32, 19.5 * 32, 'prop_comms_console');
    commsConsole.setDepth(2);
    const relayDish = this.scene.add.image(40 * 32, 16.5 * 32, 'prop_comms_relay_dish');
    relayDish.setDepth(2);
    this.addLantern(38 * 32, 15 * 32);
    this.addLantern(47 * 32, 15 * 32);
    this.addRockCluster(46 * 32, 22 * 32);
    this.addNavSign(38.5 * 32, 17 * 32, 'sign_hub');

    // ==========================================
    // 8. NURSERY BROOD CHAMBER
    // ==========================================
    this.addAmbientLightPool(26 * 32, 33 * 32, 75, 0xca8a04, 0.15);
    const nurseryEggs = this.scene.add.image(26 * 32, 33.5 * 32, 'prop_nursery_eggs');
    nurseryEggs.setDepth(2);
    const incubator1 = this.scene.add.image(21 * 32, 31.5 * 32, 'prop_nursery_incubator');
    incubator1.setDepth(2);
    const incubator2 = this.scene.add.image(31 * 32, 31.5 * 32, 'prop_nursery_incubator');
    incubator2.setDepth(2);
    this.addLantern(19 * 32, 29 * 32);
    this.addLantern(33 * 32, 29 * 32);
    this.addRockCluster(20 * 32, 35 * 32);
    this.addRockCluster(32 * 32, 35 * 32);
    this.addNavSign(26 * 32, 28.5 * 32, 'sign_hub');

    // ==========================================
    // 9. TUNNEL BIOLUMINESCENT MUSHROOMS
    // ==========================================
    const shroomLocations = [
      { x: 14 * 32, y: 16 * 32 },
      { x: 38 * 32, y: 16 * 32 },
      { x: 9.5 * 32, y: 11 * 32 },
      { x: 42.5 * 32, y: 11 * 32 },
      { x: 26 * 32, y: 25 * 32 },
      { x: 22 * 32, y: 18 * 32 },
      { x: 30 * 32, y: 18 * 32 }
    ];

    shroomLocations.forEach(loc => {
      const shroom = this.scene.add.image(loc.x, loc.y, 'prop_shroom_cyan');
      shroom.setDepth(2);

      // Soft bioluminescent glow pool beneath mushroom
      const glowPool = this.scene.add.circle(loc.x, loc.y, 22, 0x38bdf8, 0.14);
      glowPool.setDepth(1);

      this.scene.tweens.add({
        targets: [shroom, glowPool],
        alpha: { from: 0.75, to: 1.0 },
        scaleX: { from: 0.95, to: 1.06 },
        scaleY: { from: 0.95, to: 1.06 },
        duration: Phaser.Math.Between(1800, 2400),
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });
    });
  }

  private addAmbientLightPool(x: number, y: number, radius: number, color: number, alpha: number): void {
    const pool = this.scene.add.circle(x, y, radius, color, alpha);
    pool.setDepth(1);
    this.scene.tweens.add({
      targets: pool,
      alpha: { from: alpha * 0.85, to: alpha * 1.15 },
      scaleX: { from: 0.98, to: 1.02 },
      scaleY: { from: 0.98, to: 1.02 },
      duration: Phaser.Math.Between(2200, 3000),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private addNavSign(x: number, y: number, textureKey: string): void {
    const sign = this.scene.add.image(x, y, textureKey);
    sign.setDepth(3);
  }

  private addTunnelArch(x: number, y: number): void {
    const arch = this.scene.add.image(x, y, 'prop_tunnel_arch_h');
    arch.setDepth(2);
  }

  private addRockCluster(x: number, y: number): void {
    const rock = this.scene.add.image(x, y, 'prop_rock_cluster');
    rock.setDepth(2);
  }

  private addRoots(x: number, y: number): void {
    const roots = this.scene.add.image(x, y, 'prop_roots');
    roots.setDepth(2);
  }

  private addLantern(x: number, y: number): void {
    const lantern = this.scene.add.image(x, y, 'prop_lantern');
    lantern.setDepth(2);

    // Warm localized light glow pool
    const lightPool = this.scene.add.circle(x, y, 26, 0xfbbf24, 0.16);
    lightPool.setDepth(1);

    this.scene.tweens.add({
      targets: [lantern, lightPool],
      alpha: { from: 0.85, to: 1.0 },
      duration: Phaser.Math.Between(1200, 1800),
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  private checkNeighborWalkable(x: number, y: number): boolean {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < ColonyMap.MAP_WIDTH && ny >= 0 && ny < ColonyMap.MAP_HEIGHT) {
          if (this.grid[ny][nx]) return true;
        }
      }
    }
    return false;
  }

  public getRoomAt(worldX: number, worldY: number): ColonyRoom | null {
    const tileX = Math.floor(worldX / ColonyMap.TILE_SIZE);
    const tileY = Math.floor(worldY / ColonyMap.TILE_SIZE);

    for (const room of this.rooms) {
      if (
        tileX >= room.x &&
        tileX < room.x + room.width &&
        tileY >= room.y &&
        tileY < room.y + room.height
      ) {
        return room;
      }
    }
    return null;
  }

  public isWalkable(tileX: number, tileY: number): boolean {
    if (tileX < 0 || tileX >= ColonyMap.MAP_WIDTH || tileY < 0 || tileY >= ColonyMap.MAP_HEIGHT) {
      return false;
    }
    return this.grid[tileY][tileX];
  }
}
