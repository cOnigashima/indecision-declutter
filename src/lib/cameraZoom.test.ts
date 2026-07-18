import { describe, expect, it } from 'vitest';

import {
  CAMERA_ZOOM_MAX,
  cameraZoomFromPinch,
  clampCameraZoom,
  isCameraZoomPreset,
} from './cameraZoom';

describe('camera zoom', () => {
  it('clamps zoom to the range accepted by the camera', () => {
    expect(clampCameraZoom(-0.1)).toBe(0);
    expect(clampCameraZoom(0.2)).toBe(0.2);
    expect(clampCameraZoom(1)).toBe(CAMERA_ZOOM_MAX);
  });

  it('zooms in and out relative to the value at the start of the pinch', () => {
    expect(cameraZoomFromPinch(0.1, 2)).toBeGreaterThan(0.1);
    expect(cameraZoomFromPinch(0.1, 0.5)).toBeLessThan(0.1);
  });

  it('ignores invalid pinch scales and detects a nearby preset', () => {
    expect(cameraZoomFromPinch(0.2, 0)).toBe(0.2);
    expect(isCameraZoomPreset(0.006, 0)).toBe(true);
    expect(isCameraZoomPreset(0.04, 0)).toBe(false);
  });
});
