export const CAMERA_ZOOM_MIN = 0;
export const CAMERA_ZOOM_MAX = 0.5;

const PINCH_ZOOM_SENSITIVITY = 0.16;

export function clampCameraZoom(value: number): number {
  return Math.min(CAMERA_ZOOM_MAX, Math.max(CAMERA_ZOOM_MIN, value));
}

export function cameraZoomFromPinch(startZoom: number, scale: number): number {
  if (!Number.isFinite(scale) || scale <= 0) {
    return clampCameraZoom(startZoom);
  }

  return clampCameraZoom(startZoom + Math.log2(scale) * PINCH_ZOOM_SENSITIVITY);
}

export function isCameraZoomPreset(currentZoom: number, presetZoom: number): boolean {
  return Math.abs(currentZoom - presetZoom) < 0.015;
}
