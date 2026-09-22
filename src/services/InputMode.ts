export class InputMode {
  private static _isTouch: boolean = false;
  private static _hasInitialized: boolean = false;
  private static listeners: Array<(isTouch: boolean) => void> = [];

  public static init(): void {
    if (this._hasInitialized) return;
    this._hasInitialized = true;

    // Initial detection
    this._isTouch = 
      ('ontouchstart' in window) || 
      (navigator.maxTouchPoints > 0) || 
      (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);

    // Dynamic runtime switch on first touch
    window.addEventListener('touchstart', () => {
      if (!this._isTouch) {
        this._isTouch = true;
        this.notifyListeners();
      }
    }, { passive: true, once: true });

    // Dynamic switch on keyboard/mouse
    window.addEventListener('keydown', (e) => {
      if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyE'].includes(e.code)) {
        if (this._isTouch && navigator.maxTouchPoints === 0) {
          this._isTouch = false;
          this.notifyListeners();
        }
      }
    });

    // Orientation checker
    this.checkOrientation();
    window.addEventListener('resize', () => this.checkOrientation());
    window.addEventListener('orientationchange', () => this.checkOrientation());
  }

  public static isTouch(): boolean {
    if (!this._hasInitialized) this.init();
    return this._isTouch;
  }

  public static onModeChanged(listener: (isTouch: boolean) => void): void {
    this.listeners.push(listener);
  }

  private static notifyListeners(): void {
    this.listeners.forEach(fn => fn(this._isTouch));
  }

  private static checkOrientation(): void {
    const warning = document.getElementById('orientation-warning');
    if (!warning) return;

    // Show warning only on touch devices where height > width (portrait mode)
    const isPortrait = window.innerHeight > window.innerWidth && window.innerWidth < 800;
    if (this._isTouch && isPortrait) {
      warning.style.display = 'flex';
    } else {
      warning.style.display = 'none';
    }
  }
}

