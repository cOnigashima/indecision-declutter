export function clampPhotoIndex(index: number, photoCount: number): number {
  if (photoCount <= 0 || !Number.isFinite(index)) {
    return 0;
  }

  return Math.max(0, Math.min(Math.trunc(index), photoCount - 1));
}

export function movePhotoToFront(photos: string[], index: number): string[] {
  if (!Number.isFinite(index)) {
    return photos;
  }

  const nextIndex = Math.trunc(index);
  if (nextIndex <= 0 || nextIndex >= photos.length) {
    return photos;
  }

  return [photos[nextIndex], ...photos.slice(0, nextIndex), ...photos.slice(nextIndex + 1)];
}
