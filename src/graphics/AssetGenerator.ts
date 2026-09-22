import Phaser from 'phaser';

export class AssetGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    this.generateAntTextures(scene);
    this.generateEnvironmentTiles(scene);
    this.generateRoomProps(scene);
    this.generateDirectionalSigns(scene);
  }

  private static generateAntTextures(scene: Phaser.Scene): void {
    const characters = [
      { key: 'ant_player', primary: '#c92a2a', secondary: '#8a1818', highlight: '#ff6b6b', eye: '#111827', sensor: '#38bdf8' }, // Crimson / Player
      { key: 'ant_rook', primary: '#2b2d30', secondary: '#18191a', highlight: '#495057', eye: '#0f172a', sensor: '#adb5bd' },     // Charcoal Black / Rook
      { key: 'ant_mina', primary: '#1971c2', secondary: '#0f4c81', highlight: '#4dabf7', eye: '#0a192f', sensor: '#74c0fc' },     // Cobalt Blue / Mina
      { key: 'ant_pip', primary: '#d97706', secondary: '#92400e', highlight: '#fbbf24', eye: '#451a03', sensor: '#fef08a' },      // Golden Ochre / Pip
      { key: 'ant_vale', primary: '#2f9e44', secondary: '#1e632b', highlight: '#69db7c', eye: '#052e16', sensor: '#bbf7d0' },     // Leaf Green / Vale
      { key: 'ant_nox', primary: '#7048e8', secondary: '#4c2889', highlight: '#9775fa', eye: '#2e1065', sensor: '#e9d5ff' },      // Royal Purple / Nox
      { key: 'ant_kira', primary: '#e8590c', secondary: '#9a3412', highlight: '#ff922b', eye: '#431407', sensor: '#fed7aa' }      // Rust Orange / Kira
    ];

    const size = 96;

    characters.forEach(({ key, primary, secondary, highlight, eye, sensor }) => {
      if (scene.textures.exists(key)) return;

      const canvas = scene.textures.createCanvas(key, size, size);
      if (!canvas) return;
      const ctx = canvas.getContext();

      ctx.clearRect(0, 0, size, size);
      ctx.save();
      ctx.translate(size / 2, size / 2);

      // 1. Soft Under-Body Shadow
      ctx.fillStyle = 'rgba(8, 4, 2, 0.55)';
      ctx.beginPath();
      ctx.ellipse(0, 10, 28, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. Six Articulated Organic Legs
      const legPairs = [
        { yBase: -8, spread: 27, angle: -0.45, length: 28 }, // Front legs
        { yBase: 2, spread: 33, angle: 0.1, length: 30 },     // Middle legs
        { yBase: 12, spread: 29, angle: 0.65, length: 34 }    // Rear legs
      ];

      [-1, 1].forEach(side => {
        legPairs.forEach(({ yBase, spread, angle, length }) => {
          ctx.strokeStyle = secondary;
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';

          ctx.beginPath();
          ctx.moveTo(side * 8, yBase);
          const kneeX = side * (spread * 0.7);
          const kneeY = yBase + angle * 12 - 4;
          const footX = side * spread;
          const footY = yBase + angle * length;

          ctx.lineTo(kneeX, kneeY);
          ctx.lineTo(footX, footY);
          ctx.stroke();

          // Leg highlight line
          ctx.strokeStyle = highlight;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(side * 8, yBase);
          ctx.lineTo(kneeX, kneeY);
          ctx.stroke();
        });
      });

      // 3. Abdomen / Gaster (Rear segment)
      const gradGaster = ctx.createRadialGradient(-3, 14, 2, 0, 18, 20);
      gradGaster.addColorStop(0, highlight);
      gradGaster.addColorStop(0.5, primary);
      gradGaster.addColorStop(1, secondary);

      ctx.fillStyle = gradGaster;
      ctx.beginPath();
      ctx.ellipse(0, 18, 16, 20, 0, 0, Math.PI * 2);
      ctx.fill();

      // Abdomen Exoskeleton Plates / Rings
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 2;
      for (let offset = 8; offset <= 26; offset += 6) {
        ctx.beginPath();
        ctx.ellipse(0, offset, 14 - (offset - 8) * 0.35, 3.5, 0, 0, Math.PI);
        ctx.stroke();
      }

      // Specular highlight on gaster
      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.ellipse(-5, 14, 5, 10, -0.3, 0, Math.PI * 2);
      ctx.fill();

      // 4. Petiole (waist connector)
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.ellipse(0, 5, 4, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 5. Thorax / Mesosoma (Middle segment)
      const gradThorax = ctx.createRadialGradient(-2, -3, 1, 0, 0, 14);
      gradThorax.addColorStop(0, highlight);
      gradThorax.addColorStop(0.6, primary);
      gradThorax.addColorStop(1, secondary);

      ctx.fillStyle = gradThorax;
      ctx.beginPath();
      ctx.ellipse(0, -2, 11, 13, 0, 0, Math.PI * 2);
      ctx.fill();

      // Thorax armor ridge
      ctx.strokeStyle = secondary;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -3, 8, 0, Math.PI * 2);
      ctx.stroke();

      // 6. Antennae (Curved, articulated)
      [-1, 1].forEach(side => {
        ctx.strokeStyle = '#2d2d30';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(side * 5, -19);
        const jointX = side * 14;
        const jointY = -30;
        const tipX = side * 18;
        const tipY = -38;

        ctx.lineTo(jointX, jointY);
        ctx.lineTo(tipX, tipY);
        ctx.stroke();

        // Glowing antenna sensor tip
        ctx.fillStyle = sensor;
        ctx.shadowColor = sensor;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(tipX, tipY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // 7. Head (Cephalon)
      const gradHead = ctx.createRadialGradient(-2, -18, 1, 0, -16, 12);
      gradHead.addColorStop(0, highlight);
      gradHead.addColorStop(0.7, primary);
      gradHead.addColorStop(1, secondary);

      ctx.fillStyle = gradHead;
      ctx.beginPath();
      ctx.ellipse(0, -16, 12, 11, 0, 0, Math.PI * 2);
      ctx.fill();

      // Mandibles / Jaws
      ctx.fillStyle = secondary;
      ctx.beginPath();
      ctx.moveTo(-5, -24);
      ctx.lineTo(-2, -29);
      ctx.lineTo(0, -26);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(5, -24);
      ctx.lineTo(2, -29);
      ctx.lineTo(0, -26);
      ctx.fill();

      // Large Expressive Compound Eyes
      [-1, 1].forEach(side => {
        ctx.fillStyle = eye;
        ctx.beginPath();
        ctx.ellipse(side * 7, -17, 3.5, 5.5, side * 0.25, 0, Math.PI * 2);
        ctx.fill();

        // Eye glint
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(side * 6.5, -19, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      canvas.refresh();
    });
  }

  private static generateEnvironmentTiles(scene: Phaser.Scene): void {
    const size = 32;

    // 1. Organic Subterranean Dirt Floor (Rich stratified soil with pebbles and fine roots)
    if (!scene.textures.exists('tile_dirt_floor')) {
      const canvas = scene.textures.createCanvas('tile_dirt_floor', size, size);
      if (canvas) {
        const ctx = canvas.getContext();
        
        // Base dark earth gradient
        const bgGrad = ctx.createLinearGradient(0, 0, size, size);
        bgGrad.addColorStop(0, '#3e2717');
        bgGrad.addColorStop(0.5, '#4a2f1c');
        bgGrad.addColorStop(1, '#3a2314');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, size, size);

        // Packed soil clumps
        ctx.fillStyle = '#5c3a23';
        ctx.beginPath();
        ctx.ellipse(6, 6, 4, 3, 0.2, 0, Math.PI * 2);
        ctx.ellipse(22, 8, 5, 4, -0.3, 0, Math.PI * 2);
        ctx.ellipse(14, 20, 6, 4, 0.1, 0, Math.PI * 2);
        ctx.ellipse(26, 24, 4, 3, -0.2, 0, Math.PI * 2);
        ctx.fill();

        // Shaded depressions
        ctx.fillStyle = '#2b170c';
        ctx.beginPath();
        ctx.ellipse(12, 11, 3, 2, 0.4, 0, Math.PI * 2);
        ctx.ellipse(4, 24, 4, 2, -0.1, 0, Math.PI * 2);
        ctx.ellipse(22, 22, 3, 3, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Fine mineral flecks / pebbles
        ctx.fillStyle = '#784c28';
        ctx.fillRect(8, 7, 2, 2);
        ctx.fillRect(18, 26, 2, 2);
        ctx.fillRect(27, 14, 2, 2);
        ctx.fillRect(3, 15, 2, 1);

        ctx.fillStyle = '#a16207';
        ctx.fillRect(14, 6, 1, 1);
        ctx.fillRect(24, 18, 1, 1);

        // Tiny root strand
        ctx.strokeStyle = '#26160c';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 18);
        ctx.quadraticCurveTo(8, 16, 16, 22);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 2. Tunnel Walkway (Packed worn ant pathway)
    if (!scene.textures.exists('tile_tunnel_floor')) {
      const canvas = scene.textures.createCanvas('tile_tunnel_floor', size, size);
      if (canvas) {
        const ctx = canvas.getContext();
        
        ctx.fillStyle = '#341f12';
        ctx.fillRect(0, 0, size, size);

        // Worn central corridor track
        ctx.fillStyle = '#442a18';
        ctx.fillRect(3, 2, 26, size - 4);

        // Subtle side packing
        ctx.fillStyle = '#24140a';
        ctx.fillRect(0, 0, 3, size);
        ctx.fillRect(size - 3, 0, 3, size);

        // Foot traffic soil patches
        ctx.fillStyle = '#4e311c';
        ctx.beginPath();
        ctx.ellipse(16, 16, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#26150b';
        ctx.fillRect(6, 8, 2, 3);
        ctx.fillRect(24, 20, 2, 3);

        ctx.fillStyle = '#5c3a23';
        ctx.fillRect(12, 10, 2, 2);
        ctx.fillRect(19, 22, 2, 2);

        canvas.refresh();
      }
    }

    // 3. Organic Cavern Wall (Stratified rock with depth & sedimentary cracks)
    if (!scene.textures.exists('tile_cavern_wall')) {
      const canvas = scene.textures.createCanvas('tile_cavern_wall', size, size);
      if (canvas) {
        const ctx = canvas.getContext();
        
        // Deep rock base
        ctx.fillStyle = '#180e07';
        ctx.fillRect(0, 0, size, size);

        // Rounded rock protrusion
        const rockGrad = ctx.createRadialGradient(size / 2 - 2, size / 2 - 2, 2, size / 2, size / 2, 15);
        rockGrad.addColorStop(0, '#362113');
        rockGrad.addColorStop(0.7, '#24160c');
        rockGrad.addColorStop(1, '#150c06');
        ctx.fillStyle = rockGrad;
        ctx.beginPath();
        ctx.ellipse(size / 2, size / 2, 14, 13, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chiseled rock bevel
        ctx.strokeStyle = '#452a18';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(1, 1, size - 2, size - 2);

        // Rock fissures / cracks
        ctx.strokeStyle = '#0d0703';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(5, 7);
        ctx.lineTo(13, 15);
        ctx.lineTo(23, 13);
        ctx.lineTo(27, 24);
        ctx.stroke();

        // Secondary mineral streak
        ctx.strokeStyle = '#5a371f';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(8, 4);
        ctx.lineTo(18, 8);
        ctx.stroke();

        canvas.refresh();
      }
    }
  }

  private static generateRoomProps(scene: Phaser.Scene): void {
    // 1. Bioluminescent Cyan Mushroom Cluster
    if (!scene.textures.exists('prop_shroom_cyan')) {
      const canvas = scene.textures.createCanvas('prop_shroom_cyan', 48, 48);
      if (canvas) {
        const ctx = canvas.getContext();
        
        // Layered bioluminescent glow aura
        const glow = ctx.createRadialGradient(24, 24, 2, 24, 24, 22);
        glow.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
        glow.addColorStop(0.6, 'rgba(2, 132, 199, 0.2)');
        glow.addColorStop(1, 'rgba(56, 189, 248, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 48, 48);

        // Glowing organic stalks
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(15, 42); ctx.quadraticCurveTo(16, 28, 13, 22);
        ctx.moveTo(24, 43); ctx.lineTo(24, 17);
        ctx.moveTo(33, 42); ctx.quadraticCurveTo(31, 28, 34, 23);
        ctx.stroke();

        const drawCap = (x: number, y: number, r: number) => {
          const capGrad = ctx.createRadialGradient(x, y - 2, 1, x, y, r);
          capGrad.addColorStop(0, '#7dd3fc');
          capGrad.addColorStop(0.5, '#0284c7');
          capGrad.addColorStop(1, '#0369a1');
          ctx.fillStyle = capGrad;
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * 0.65, 0, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(x - 2, y - 2, 1.3, 0, Math.PI * 2);
          ctx.arc(x + 2, y - 1, 1.1, 0, Math.PI * 2);
          ctx.arc(x, y + 2, 0.9, 0, Math.PI * 2);
          ctx.fill();
        };

        drawCap(13, 22, 9);
        drawCap(24, 17, 11);
        drawCap(34, 23, 8);
        canvas.refresh();
      }
    }

    // 2. Wall Lantern (Warm Amber Glow with cast iron cage)
    if (!scene.textures.exists('prop_lantern')) {
      const canvas = scene.textures.createCanvas('prop_lantern', 44, 44);
      if (canvas) {
        const ctx = canvas.getContext();
        
        const glow = ctx.createRadialGradient(22, 22, 2, 22, 22, 20);
        glow.addColorStop(0, 'rgba(251, 191, 36, 0.75)');
        glow.addColorStop(0.5, 'rgba(217, 119, 6, 0.28)');
        glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 44, 44);

        ctx.fillStyle = '#451a03';
        ctx.fillRect(20, 4, 4, 10);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(19, 12, 6, 3);

        ctx.fillStyle = '#1c1917';
        ctx.fillRect(14, 15, 16, 18);
        ctx.strokeStyle = '#44403c';
        ctx.lineWidth = 1;
        ctx.strokeRect(14, 15, 16, 18);

        const coreGrad = ctx.createRadialGradient(22, 24, 1, 22, 24, 7);
        coreGrad.addColorStop(0, '#ffffff');
        coreGrad.addColorStop(0.4, '#fef08a');
        coreGrad.addColorStop(0.8, '#f59e0b');
        coreGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = coreGrad;
        ctx.fillRect(16, 17, 12, 14);

        ctx.strokeStyle = '#1c1917';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(22, 15); ctx.lineTo(22, 33);
        ctx.moveTo(14, 24); ctx.lineTo(30, 24);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 3. Central Hub Stone Meeting Ring Dais
    if (!scene.textures.exists('prop_meeting_ring')) {
      const size = 160;
      const canvas = scene.textures.createCanvas('prop_meeting_ring', size, size);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.save();
        ctx.translate(size / 2, size / 2);

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(0, 0, 72, 0, Math.PI * 2);
        ctx.stroke();

        const stoneGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, 70);
        stoneGrad.addColorStop(0, '#452b19');
        stoneGrad.addColorStop(0.8, '#301c0f');
        stoneGrad.addColorStop(1, '#201209');
        ctx.fillStyle = stoneGrad;
        ctx.beginPath();
        ctx.arc(0, 0, 68, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 2;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * 68, Math.sin(a) * 68);
          ctx.stroke();
        }

        ctx.fillStyle = '#180e07';
        ctx.beginPath();
        ctx.arc(0, 0, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(0, 6, 6, 9, 0, 0, Math.PI * 2);
        ctx.ellipse(0, -5, 5, 5, 0, 0, Math.PI * 2);
        ctx.ellipse(0, -14, 4, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-2, -16); ctx.lineTo(-6, -22);
        ctx.moveTo(2, -16); ctx.lineTo(6, -22);
        ctx.stroke();

        ctx.restore();
        canvas.refresh();
      }
    }

    // 4. Central Hub Meeting Console Prop
    if (!scene.textures.exists('prop_meeting_console')) {
      const w = 48;
      const h = 48;
      const canvas = scene.textures.createCanvas('prop_meeting_console', w, h);
      if (canvas) {
        const ctx = canvas.getContext();
        
        // Shadow
        ctx.fillStyle = 'rgba(10, 5, 2, 0.6)';
        ctx.beginPath();
        ctx.ellipse(24, 40, 20, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Pedestal base
        ctx.fillStyle = '#241208';
        ctx.fillRect(8, 14, 32, 26);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.strokeRect(8, 14, 32, 26);

        // Center amber beacon dome
        const domeGrad = ctx.createRadialGradient(24, 22, 1, 24, 22, 10);
        domeGrad.addColorStop(0, '#fef08a');
        domeGrad.addColorStop(0.5, '#f59e0b');
        domeGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = domeGrad;
        ctx.beginPath();
        ctx.arc(24, 22, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Control buttons
        ctx.fillStyle = '#ef4444'; ctx.fillRect(12, 34, 6, 3);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(30, 34, 6, 3);

        canvas.refresh();
      }
    }

    // 5. Heavy Organic Boulder / Rock Formation
    if (!scene.textures.exists('prop_rock_cluster')) {
      const canvas = scene.textures.createCanvas('prop_rock_cluster', 64, 48);
      if (canvas) {
        const ctx = canvas.getContext();
        
        ctx.fillStyle = 'rgba(10, 5, 2, 0.5)';
        ctx.beginPath();
        ctx.ellipse(32, 40, 28, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        const rock1 = ctx.createRadialGradient(24, 20, 2, 26, 26, 22);
        rock1.addColorStop(0, '#4a2f1c');
        rock1.addColorStop(0.7, '#2a1a0f');
        rock1.addColorStop(1, '#180f08');
        ctx.fillStyle = rock1;
        ctx.beginPath();
        ctx.ellipse(26, 26, 22, 18, -0.2, 0, Math.PI * 2);
        ctx.fill();

        const rock2 = ctx.createRadialGradient(42, 24, 2, 44, 28, 16);
        rock2.addColorStop(0, '#543621');
        rock2.addColorStop(0.8, '#2d1b10');
        rock2.addColorStop(1, '#1a0e07');
        ctx.fillStyle = rock2;
        ctx.beginPath();
        ctx.ellipse(44, 28, 16, 14, 0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#120904';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(18, 16); ctx.lineTo(26, 28);
        ctx.moveTo(38, 22); ctx.lineTo(44, 32);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 6. Creeping Tree Root Tangles
    if (!scene.textures.exists('prop_roots')) {
      const canvas = scene.textures.createCanvas('prop_roots', 72, 48);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.strokeStyle = '#543018';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(4, 4);
        ctx.quadraticCurveTo(24, 18, 48, 22);
        ctx.quadraticCurveTo(60, 24, 68, 40);
        ctx.stroke();

        ctx.strokeStyle = '#3d2210';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(28, 20); ctx.quadraticCurveTo(34, 32, 42, 44);
        ctx.moveTo(12, 10); ctx.quadraticCurveTo(18, 24, 14, 38);
        ctx.stroke();
        canvas.refresh();
      }
    }

    // 7. Tunnel Archways (Timber & Steel portal framing entrance)
    if (!scene.textures.exists('prop_tunnel_arch_h')) {
      const canvas = scene.textures.createCanvas('prop_tunnel_arch_h', 128, 40);
      if (canvas) {
        const ctx = canvas.getContext();
        
        ctx.fillStyle = '#452613';
        ctx.fillRect(8, 4, 112, 10);
        ctx.fillStyle = '#6b3e1f';
        ctx.fillRect(10, 6, 108, 6);

        ctx.fillStyle = '#334155';
        ctx.fillRect(8, 2, 16, 14);
        ctx.fillRect(104, 2, 16, 14);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(12, 6, 3, 3);
        ctx.fillRect(112, 6, 3, 3);

        const glow = ctx.createRadialGradient(64, 22, 1, 64, 22, 16);
        glow.addColorStop(0, 'rgba(251, 191, 36, 0.75)');
        glow.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glow;
        ctx.fillRect(44, 4, 40, 36);

        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(61, 18, 6, 8);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(62, 19, 4, 6);

        canvas.refresh();
      }
    }

    // 8. Power Conduit Junction Breaker Box
    if (!scene.textures.exists('prop_conduit_box')) {
      const canvas = scene.textures.createCanvas('prop_conduit_box', 36, 44);
      if (canvas) {
        const ctx = canvas.getContext();
        
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(4, 4, 28, 36);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(4, 4, 28, 36);

        // Hazard stripes
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(6, 6, 24, 4);

        // Lever / switch
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(14, 16, 8, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(16, 18, 4, 4);

        // Heavy conduit pipe extending down
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(18, 40); ctx.lineTo(18, 44);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 9. GENERATOR ROOM: Primary Reactor & Generator Console Machinery
    if (!scene.textures.exists('generator_console')) {
      const w = 84;
      const h = 64;
      const canvas = scene.textures.createCanvas('generator_console', w, h);
      if (canvas) {
        const ctx = canvas.getContext();
        
        // Floor contact shadow
        ctx.fillStyle = 'rgba(10, 5, 2, 0.65)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 4, 38, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Industrial dark steel/bronze chassis base
        ctx.fillStyle = '#1e1b18';
        ctx.fillRect(6, 10, w - 12, h - 18);
        ctx.strokeStyle = '#443a2f';
        ctx.lineWidth = 2;
        ctx.strokeRect(6, 10, w - 12, h - 18);

        // Warning / Hazard markings on upper rim
        for (let x = 8; x < w - 8; x += 10) {
          ctx.fillStyle = (x % 20 === 8) ? '#f59e0b' : '#180e07';
          ctx.fillRect(x, 10, 10, 4);
        }

        // Heavy power cooling coils on left & right
        ctx.fillStyle = '#334155';
        ctx.fillRect(8, 18, 10, 24);
        ctx.fillRect(w - 18, 18, 10, 24);
        for (let y = 20; y < 40; y += 4) {
          ctx.strokeStyle = '#64748b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(8, y); ctx.lineTo(18, y);
          ctx.moveTo(w - 18, y); ctx.lineTo(w - 8, y);
          ctx.stroke();
        }

        // Core Generator Turbine Chamber (Glowing reactor core)
        const turbineGrad = ctx.createRadialGradient(w / 2, 28, 2, w / 2, 28, 18);
        turbineGrad.addColorStop(0, '#ffffff');
        turbineGrad.addColorStop(0.3, '#38bdf8');
        turbineGrad.addColorStop(0.7, '#0284c7');
        turbineGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = turbineGrad;
        ctx.beginPath();
        ctx.arc(w / 2, 28, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Magnetic turbine rotor spokes
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 1.5;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
          ctx.beginPath();
          ctx.moveTo(w / 2, 28);
          ctx.lineTo(w / 2 + Math.cos(a) * 14, 28 + Math.sin(a) * 14);
          ctx.stroke();
        }

        // Heavy copper conduit lines connecting core to chassis
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(18, 30); ctx.lineTo(w / 2 - 16, 28);
        ctx.moveTo(w - 18, 30); ctx.lineTo(w / 2 + 16, 28);
        ctx.stroke();

        // Lower Control Console & Status Display
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(18, 44, w - 36, 12);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1;
        ctx.strokeRect(18, 44, w - 36, 12);

        // Green frequency / load waveform
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(20, 50);
        ctx.lineTo(26, 50);
        ctx.lineTo(29, 46);
        ctx.lineTo(32, 54);
        ctx.lineTo(35, 50);
        ctx.lineTo(44, 50);
        ctx.stroke();

        // Status indicator LEDs
        ctx.fillStyle = '#22c55e'; ctx.fillRect(48, 47, 3, 3);
        ctx.fillStyle = '#eab308'; ctx.fillRect(54, 47, 3, 3);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(60, 47, 3, 3);

        canvas.refresh();
      }
    }

    // 10. GENERATOR ROOM: Auxiliary Power Transformer Rack
    if (!scene.textures.exists('prop_generator_aux')) {
      const w = 64;
      const h = 48;
      const canvas = scene.textures.createCanvas('prop_generator_aux', w, h);
      if (canvas) {
        const ctx = canvas.getContext();
        
        ctx.fillStyle = 'rgba(10, 5, 2, 0.5)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 4, 28, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#241a12';
        ctx.fillRect(4, 8, w - 8, h - 14);
        ctx.strokeStyle = '#543621';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(4, 8, w - 8, h - 14);

        // Power cell cylindrical capacitors
        for (let i = 0; i < 3; i++) {
          const cx = 14 + i * 18;
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(cx - 5, 12, 10, 20);
          ctx.fillStyle = '#38bdf8';
          ctx.fillRect(cx - 3, 14, 6, 16);
          ctx.strokeStyle = '#0369a1';
          ctx.lineWidth = 1;
          ctx.strokeRect(cx - 5, 12, 10, 20);
        }

        // Braided cables
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(8, 36); ctx.lineTo(w - 8, 36);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 11. FOOD STORAGE: Modular Storage Crates & Honeydew Pod Depot
    if (!scene.textures.exists('prop_food_crates')) {
      const w = 84;
      const h = 56;
      const canvas = scene.textures.createCanvas('prop_food_crates', w, h);
      if (canvas) {
        const ctx = canvas.getContext();
        
        // Floor shadow
        ctx.fillStyle = 'rgba(10, 5, 2, 0.6)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 4, 38, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wooden Storage Hamper 1 (Grain & Seeds)
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(4, 14, 36, 36);
        ctx.strokeStyle = '#382314';
        ctx.lineWidth = 2;
        ctx.strokeRect(4, 14, 36, 36);
        ctx.fillStyle = '#784c28';
        ctx.fillRect(6, 16, 32, 32);

        // Stencil Label
        ctx.fillStyle = '#fef08a';
        ctx.font = 'bold 7px monospace';
        ctx.fillText('SEED-A', 8, 24);

        // Grain & Seed Heap
        for (let i = 0; i < 16; i++) {
          const gx = 10 + (i % 4) * 7 + (i > 8 ? 3 : 0);
          const gy = 26 + Math.floor(i / 4) * 5;
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(gx, gy, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Glowing Golden Honeydew Pod / Canister 2
        const podGrad = ctx.createRadialGradient(60, 28, 2, 62, 32, 18);
        podGrad.addColorStop(0, '#fef08a');
        podGrad.addColorStop(0.5, '#eab308');
        podGrad.addColorStop(1, '#854d0e');
        ctx.fillStyle = podGrad;
        ctx.beginPath();
        ctx.ellipse(62, 32, 16, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Specular highlight on translucent resin pod
        ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
        ctx.beginPath();
        ctx.ellipse(58, 26, 3.5, 6, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // Hanging nectar ampoule rack
        ctx.fillStyle = '#451a03';
        ctx.fillRect(44, 8, 36, 4);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(48, 12, 4, 8);
        ctx.fillRect(58, 12, 4, 8);
        ctx.fillRect(68, 12, 4, 8);

        canvas.refresh();
      }
    }

    // 12. FOOD STORAGE: Wooden Pantry Shelving Unit
    if (!scene.textures.exists('prop_food_shelves')) {
      const w = 64;
      const h = 48;
      const canvas = scene.textures.createCanvas('prop_food_shelves', w, h);
      if (canvas) {
        const ctx = canvas.getContext();
        
        ctx.fillStyle = 'rgba(10, 5, 2, 0.5)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 4, 28, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shelving frame
        ctx.fillStyle = '#452613';
        ctx.fillRect(4, 4, w - 8, h - 10);
        ctx.strokeStyle = '#27140a';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(4, 4, w - 8, h - 10);

        // Shelf Dividers
        ctx.fillStyle = '#6b3e1f';
        ctx.fillRect(6, 18, w - 12, 3);
        ctx.fillRect(6, 32, w - 12, 3);

        // Jars & Casks on shelves
        const drawJar = (x: number, y: number, color: string) => {
          ctx.fillStyle = color;
          ctx.fillRect(x, y, 8, 10);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(x + 1, y - 2, 6, 2);
        };

        drawJar(10, 8, '#d97706');
        drawJar(22, 8, '#ca8a04');
        drawJar(34, 8, '#b45309');
        drawJar(46, 8, '#eab308');

        drawJar(12, 22, '#92400e');
        drawJar(26, 22, '#d97706');
        drawJar(42, 22, '#ca8a04');

        canvas.refresh();
      }
    }

    // 13. BIO-LAB: Specimen Incubation Vats & Research Station
    if (!scene.textures.exists('prop_biolab_tubes')) {
      const w = 84;
      const h = 64;
      const canvas = scene.textures.createCanvas('prop_biolab_tubes', w, h);
      if (canvas) {
        const ctx = canvas.getContext();
        
        // Shadow
        ctx.fillStyle = 'rgba(10, 5, 2, 0.6)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 4, 38, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        const drawVat = (x: number, h: number, glowColor: string, fluidColor: string, specimenColor: string) => {
          // Glow aura behind glass
          ctx.fillStyle = glowColor;
          ctx.fillRect(x - 12, 54 - h, 24, h - 6);

          // Steel base & top caps
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(x - 14, 52 - h, 28, 8);
          ctx.fillRect(x - 14, 50, 28, 10);
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(x - 14, 52 - h, 28, 8);
          ctx.strokeRect(x - 14, 50, 28, 10);

          // Dark glass interior
          ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
          ctx.fillRect(x - 11, 56 - h, 22, h - 10);

          // Glowing bioluminescent fluid
          ctx.fillStyle = fluidColor;
          ctx.fillRect(x - 9, 60 - h, 18, h - 16);

          // Specimen suspended embryo / spore
          ctx.fillStyle = specimenColor;
          ctx.beginPath();
          ctx.ellipse(x, 52 - h / 2, 5, h / 3.5, 0.1, 0, Math.PI * 2);
          ctx.fill();

          // Bubble particles
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fillRect(x - 4, 46 - h / 3, 2, 2);
          ctx.fillRect(x + 3, 40 - h / 2, 1.5, 1.5);
          ctx.fillRect(x - 2, 48 - h / 2, 2, 2);

          // Glass specular reflection stripe
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.fillRect(x - 8, 58 - h, 3, h - 14);
        };

        // Twin Incubation Vats (Emerald Bio-Culture & Cyan Pheromone Culture)
        drawVat(24, 48, 'rgba(16, 185, 129, 0.55)', 'rgba(16, 185, 129, 0.7)', '#064e3b');
        drawVat(60, 44, 'rgba(6, 182, 212, 0.55)', 'rgba(6, 182, 212, 0.7)', '#083344');

        // Brass connection tubes between vats
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(24, 10);
        ctx.quadraticCurveTo(42, 4, 60, 12);
        ctx.stroke();

        // Central Mini Analyzer Console
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(36, 42, 12, 18);
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(38, 45, 8, 5);

        canvas.refresh();
      }
    }

    // 14. BIO-LAB: Workbench & Microscope Desk
    if (!scene.textures.exists('prop_biolab_microscope')) {
      const w = 64;
      const h = 48;
      const canvas = scene.textures.createCanvas('prop_biolab_microscope', w, h);
      if (canvas) {
        const ctx = canvas.getContext();
        
        ctx.fillStyle = 'rgba(10, 5, 2, 0.5)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 4, 28, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Table surface
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(4, 18, w - 8, 24);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(4, 18, w - 8, 24);

        // Microscope apparatus
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(16, 8, 6, 16);
        ctx.fillRect(12, 6, 14, 4);
        ctx.fillRect(14, 22, 10, 3);
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(16, 20, 6, 2);

        // Flask rack with colorful chemicals
        ctx.fillStyle = '#10b981'; ctx.fillRect(36, 14, 5, 8);
        ctx.fillStyle = '#a855f7'; ctx.fillRect(44, 12, 5, 10);
        ctx.fillStyle = '#f59e0b'; ctx.fillRect(52, 15, 5, 7);

        canvas.refresh();
      }
    }

    // 15. COMMS: Mainframe Telemetry Console & Antenna Array
    if (!scene.textures.exists('prop_comms_console')) {
      const w = 84;
      const h = 58;
      const canvas = scene.textures.createCanvas('prop_comms_console', w, h);
      if (canvas) {
        const ctx = canvas.getContext();
        
        ctx.fillStyle = 'rgba(10, 5, 2, 0.6)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 4, 38, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chassis
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(6, 10, w - 12, h - 18);
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 2;
        ctx.strokeRect(6, 10, w - 12, h - 18);

        // Dual CRT Telemetry Displays
        // Screen 1: Signal waveform
        ctx.fillStyle = '#081f2e';
        ctx.fillRect(12, 14, 32, 22);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1;
        ctx.strokeRect(12, 14, 32, 22);

        ctx.strokeStyle = '#00e5ff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(14, 25);
        ctx.lineTo(19, 25);
        ctx.lineTo(22, 18);
        ctx.lineTo(25, 32);
        ctx.lineTo(28, 21);
        ctx.lineTo(31, 25);
        ctx.lineTo(42, 25);
        ctx.stroke();

        // Screen 2: Colony Grid Telemetry
        ctx.fillStyle = '#091e17';
        ctx.fillRect(48, 14, 26, 22);
        ctx.strokeStyle = '#059669';
        ctx.lineWidth = 1;
        ctx.strokeRect(48, 14, 26, 22);

        // Radar sweep circle
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(61, 25, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = '#34d399';
        ctx.fillRect(59, 23, 4, 4);

        // Switchboard matrix & status LEDs
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(12, 40, w - 24, 8);
        ctx.fillStyle = '#22c55e'; ctx.fillRect(16, 42, 4, 4);
        ctx.fillStyle = '#ef4444'; ctx.fillRect(24, 42, 4, 4);
        ctx.fillStyle = '#eab308'; ctx.fillRect(32, 42, 4, 4);
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(40, 42, 4, 4);

        // Antenna dish mounted on top right
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(70, 10); ctx.lineTo(76, 2);
        ctx.stroke();
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(76, 2, 3, 0, Math.PI * 2);
        ctx.fill();

        canvas.refresh();
      }
    }

    // 16. COMMS: Relay Transceiver Dish Unit
    if (!scene.textures.exists('prop_comms_relay_dish')) {
      const w = 54;
      const h = 50;
      const canvas = scene.textures.createCanvas('prop_comms_relay_dish', w, h);
      if (canvas) {
        const ctx = canvas.getContext();
        
        ctx.fillStyle = 'rgba(10, 5, 2, 0.5)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 4, 22, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Base
        ctx.fillStyle = '#334155';
        ctx.fillRect(18, 32, 18, 12);

        // Parabolic dish curve
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(27, 20, 18, Math.PI * 0.75, Math.PI * 1.6);
        ctx.stroke();

        // Glowing emitter node
        ctx.fillStyle = '#00e5ff';
        ctx.shadowColor = '#00e5ff';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(22, 14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        canvas.refresh();
      }
    }

    // 17. NURSERY: Royal Brood Chamber & Egg Nesting Silt Bed
    if (!scene.textures.exists('prop_nursery_eggs')) {
      const w = 96;
      const h = 60;
      const canvas = scene.textures.createCanvas('prop_nursery_eggs', w, h);
      if (canvas) {
        const ctx = canvas.getContext();
        
        // Sunken silt nest basin
        ctx.fillStyle = '#2a180e';
        ctx.beginPath();
        ctx.ellipse(w / 2, 34, 44, 22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#5c3a21';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Warm Silk Nesting fibers
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.2;
        for (let i = 0; i < 8; i++) {
          ctx.beginPath();
          ctx.moveTo(14 + i * 9, 36);
          ctx.quadraticCurveTo(w / 2, 46, w - 14 - i * 9, 36);
          ctx.stroke();
        }

        // Glowing Translucent Brood Eggs
        const eggPositions = [
          { x: 26, y: 32, r: 8 },
          { x: 38, y: 26, r: 9.5 },
          { x: 52, y: 28, r: 10 },
          { x: 68, y: 34, r: 8.5 },
          { x: 34, y: 39, r: 9 },
          { x: 48, y: 41, r: 10 },
          { x: 62, y: 40, r: 9 }
        ];

        eggPositions.forEach(({ x, y, r }) => {
          const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, r);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.4, '#fef9c3');
          grad.addColorStop(0.8, '#fde047');
          grad.addColorStop(1, '#ca8a04');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(x, y, r, r * 1.25, -0.15, 0, Math.PI * 2);
          ctx.fill();

          // Internal embryonic silhouette
          ctx.fillStyle = 'rgba(161, 98, 7, 0.4)';
          ctx.beginPath();
          ctx.ellipse(x, y + 1, r * 0.4, r * 0.6, 0.2, 0, Math.PI * 2);
          ctx.fill();
        });

        // Heat supply pipes at rim
        ctx.strokeStyle = '#9a3412';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(8, 20); ctx.lineTo(20, 28);
        ctx.moveTo(w - 8, 20); ctx.lineTo(w - 20, 28);
        ctx.stroke();

        canvas.refresh();
      }
    }

    // 18. NURSERY: Brood Thermal Regulation Station
    if (!scene.textures.exists('prop_nursery_incubator')) {
      const w = 64;
      const h = 48;
      const canvas = scene.textures.createCanvas('prop_nursery_incubator', w, h);
      if (canvas) {
        const ctx = canvas.getContext();
        
        ctx.fillStyle = 'rgba(10, 5, 2, 0.5)';
        ctx.beginPath();
        ctx.ellipse(w / 2, h - 4, 28, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#3b2010';
        ctx.fillRect(4, 10, w - 8, h - 16);
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(4, 10, w - 8, h - 16);

        // Radiant heat coils glowing warm orange
        for (let i = 0; i < 4; i++) {
          const rx = 12 + i * 12;
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(rx, 16, 6, 18);
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(rx + 1, 18, 4, 14);
        }

        canvas.refresh();
      }
    }

    // 19. Central Hub Crest Creed Banner
    if (!scene.textures.exists('prop_hub_banner')) {
      const canvas = scene.textures.createCanvas('prop_hub_banner', 48, 64);
      if (canvas) {
        const ctx = canvas.getContext();
        ctx.fillStyle = '#5c3a21';
        ctx.fillRect(4, 4, 40, 5);

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.moveTo(8, 9);
        ctx.lineTo(40, 9);
        ctx.lineTo(40, 50);
        ctx.lineTo(24, 60);
        ctx.lineTo(8, 50);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(24, 28, 7, 0, Math.PI * 2);
        ctx.fill();

        canvas.refresh();
      }
    }
  }

  private static generateDirectionalSigns(scene: Phaser.Scene): void {
    const createSign = (key: string, text: string, arrow: string, arrowPos: 'left' | 'right' | 'up' | 'down') => {
      if (scene.textures.exists(key)) return;
      const w = 110;
      const h = 24;
      const canvas = scene.textures.createCanvas(key, w, h);
      if (!canvas) return;
      const ctx = canvas.getContext();

      ctx.fillStyle = '#140c07';
      ctx.fillRect(0, 0, w, h);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, w - 2, h - 2);

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 9px Courier, monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      let fullText = text;
      if (arrowPos === 'left') fullText = `${arrow} ${text}`;
      else if (arrowPos === 'right') fullText = `${text} ${arrow}`;
      else if (arrowPos === 'up') fullText = `${arrow} ${text}`;
      else if (arrowPos === 'down') fullText = `${text} ${arrow}`;

      ctx.fillText(fullText, w / 2, h / 2);
      canvas.refresh();
    };

    createSign('sign_gen_left', 'GENERATOR', '◀', 'left');
    createSign('sign_food_up', 'STORAGE', '▲', 'up');
    createSign('sign_biolab_right', 'BIO-LAB', '▶', 'right');
    createSign('sign_comms_right', 'RELAY', '▶', 'right');
    createSign('sign_nursery_down', 'NURSERY', '▼', 'down');
    createSign('sign_hub', 'CENTRAL HUB', '◈', 'left');
  }
}
