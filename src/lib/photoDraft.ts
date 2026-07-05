import { clampCoverIndex } from './itemRepositoryRules';

/** Photos captured before the item exists. The draft owns their files. */
export type PhotoDraft = {
  photos: string[];
  activeIndex: number;
};

export const emptyDraft: PhotoDraft = { photos: [], activeIndex: 0 };

export function createDraft(initialPhotoUri?: string): PhotoDraft {
  return initialPhotoUri ? { photos: [initialPhotoUri], activeIndex: 0 } : emptyDraft;
}

export function appendDraftPhoto(draft: PhotoDraft, uri: string): PhotoDraft {
  return {
    photos: [...draft.photos, uri],
    activeIndex: draft.photos.length,
  };
}

/** Replace the active photo with a retaken one. Returns the URI to clean up. */
export function replaceActiveDraftPhoto(
  draft: PhotoDraft,
  uri: string
): { draft: PhotoDraft; removedUri: string | null } {
  if (draft.photos.length === 0) {
    return { draft: appendDraftPhoto(draft, uri), removedUri: null };
  }

  const activeIndex = clampCoverIndex(draft.activeIndex, draft.photos.length);
  const photos = [...draft.photos];
  const removedUri = photos[activeIndex];
  photos[activeIndex] = uri;
  return { draft: { photos, activeIndex }, removedUri };
}

export function selectDraftPhoto(draft: PhotoDraft, index: number): PhotoDraft {
  return { ...draft, activeIndex: clampCoverIndex(index, draft.photos.length) };
}

/** All files to delete when the user abandons the draft. */
export function draftCleanupTargets(draft: PhotoDraft): string[] {
  return [...draft.photos];
}
