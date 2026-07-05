import { describe, expect, it } from 'vitest';

import { isRenderablePhotoUri } from './photoUri';

describe('isRenderablePhotoUri', () => {
  it.each([
    'file:///tmp/photo.jpg',
    'FILE:///tmp/photo.jpg',
    'content://media/external/images/1',
    'assets-library://asset/asset.JPG',
    'ph://asset-id',
    'https://example.com/photo.jpg',
    'HTTPS://example.com/photo.jpg',
    'data:image/jpeg;base64,abc',
    'blob:http://localhost/photo',
  ])('accepts renderable URI scheme: %s', (uri) => {
    expect(isRenderablePhotoUri(uri)).toBe(true);
  });

  it.each(['sample-photo-1', '', undefined, 'photo.jpg'])('rejects placeholder or relative value: %s', (uri) => {
    expect(isRenderablePhotoUri(uri)).toBe(false);
  });
});
