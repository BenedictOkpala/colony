import Phaser from 'phaser';

type UIObject = Phaser.GameObjects.GameObject & {
  x: number;
  y: number;
  visible: boolean;
  alpha: number;
  getBounds(): Phaser.Geom.Rectangle;
};

// Read-only diagnostics. Never changes visibility, filters, input or positioning.
export function inspectUIObject(
  object: UIObject | undefined,
  uiCamera: Phaser.Cameras.Scene2D.Camera,
  worldCamera: Phaser.Cameras.Scene2D.Camera
) {
  if (!object) return { exists: false };
  const ancestors = [];
  for (let node: UIObject | null = object; node; node = node.parentContainer) {
    ancestors.push({
      type: node.type, visible: node.visible, alpha: node.alpha,
      cameraFilter: node.cameraFilter,
      ignoredByUI: !!(node.cameraFilter & uiCamera.id),
      ignoredByWorld: !!(node.cameraFilter & worldCamera.id),
      willRenderInUI: node.willRender(uiCamera)
    });
  }
  const bounds = object.getBounds();
  return {
    exists: true, x: object.x, y: object.y, visible: object.visible, alpha: object.alpha,
    bounds: { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height },
    insideUIViewport: bounds.left >= 0 && bounds.top >= 0 &&
      bounds.right <= uiCamera.width && bounds.bottom <= uiCamera.height,
    effectiveVisible: ancestors.every(node => node.visible && node.alpha > 0),
    ignoredByUI: ancestors.some(node => node.ignoredByUI),
    ignoredByWorld: ancestors.some(node => node.ignoredByWorld),
    willRenderInUI: ancestors.every(node => node.willRenderInUI),
    ancestors
  };
}
