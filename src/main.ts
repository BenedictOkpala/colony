import Phaser from 'phaser';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 960,
  height: 640,
  scale: {
    // Preserve the 960x640 design scale; expand the visible area to the parent.
    mode: Phaser.Scale.EXPAND,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  // Reserve separate touch pointers for the locked joystick and action button.
  input: { activePointers: 2 },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  backgroundColor: '#140d08',
  scene: [MenuScene, GameScene]
};

window.addEventListener('DOMContentLoaded', () => {
  new Phaser.Game(config);
});
