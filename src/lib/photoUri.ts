export function isRenderablePhotoUri(uri?: string): uri is string {
  return !!uri && /^(file|content|assets-library|ph|http|https|data|blob):/i.test(uri);
}
