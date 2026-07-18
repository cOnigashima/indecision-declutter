import { useCallback, useRef, useState } from 'react';

import {
  appendDraftPhoto,
  createDraft,
  draftCleanupTargets,
  replaceActiveDraftPhoto,
  selectDraftPhoto,
  type PhotoDraft,
} from '../../lib/photoDraft';
import { captureAndStorePhoto, deleteStoredPhoto, pickAndStorePhoto } from '../../lib/photoStorage';

type CaptureDraftApi = {
  photos: string[];
  activeIndex: number;
  error: string | null;
  setError: (message: string | null) => void;
  /** もう1枚: append a new camera capture. Keeps the draft when capture fails/cancels. */
  takePhoto: (acquire?: PhotoAcquirer) => Promise<string | null>;
  /** ライブラリから: append a photo picked from the device library, same draft handling. */
  pickPhoto: () => Promise<string | null>;
  /** 撮り直す: replace only the active photo, cleaning up the replaced file. */
  retakePhoto: (acquire?: PhotoAcquirer) => Promise<string | null>;
  /** やめる: delete every draft file. */
  cancelDraft: () => Promise<void>;
  /** 退避成功後: ownership moved to the item, reset without deleting files. */
  releaseDraft: () => void;
  selectPhoto: (index: number) => void;
};

type PhotoAcquirer = () => Promise<string | null>;

export function useCaptureDraft(initialPhotoUri?: string): CaptureDraftApi {
  const [draft, setDraft] = useState<PhotoDraft>(() => createDraft(initialPhotoUri));
  const [error, setError] = useState<string | null>(null);
  // Kept in sync with every mutation (not at render time) so cleanup sees
  // the latest draft even before React re-renders.
  const draftRef = useRef(draft);

  const applyDraft = useCallback((next: PhotoDraft) => {
    draftRef.current = next;
    setDraft(next);
  }, []);

  // Camera capture and library pick share append/error handling; only the
  // acquisition source differs, so the draft treats the returned URI uniformly.
  const appendFromSource = useCallback(
    async (acquire: () => Promise<string | null>): Promise<string | null> => {
      setError(null);
      try {
        const uri = await acquire();
        if (!uri) {
          return null;
        }
        applyDraft(appendDraftPhoto(draftRef.current, uri));
        return uri;
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : '写真を保存できませんでした。');
        return null;
      }
    },
    [applyDraft]
  );

  const takePhoto = useCallback(
    (acquire: PhotoAcquirer = captureAndStorePhoto) => appendFromSource(acquire),
    [appendFromSource]
  );

  const pickPhoto = useCallback(
    () => appendFromSource(pickAndStorePhoto),
    [appendFromSource]
  );

  const retakePhoto = useCallback(async (acquire: PhotoAcquirer = captureAndStorePhoto): Promise<string | null> => {
    setError(null);
    try {
      const uri = await acquire();
      if (!uri) {
        return null;
      }
      const { draft: nextDraft, removedUri } = replaceActiveDraftPhoto(draftRef.current, uri);
      applyDraft(nextDraft);
      if (removedUri) {
        await deleteStoredPhoto(removedUri);
      }
      return uri;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '写真を保存できませんでした。');
      return null;
    }
  }, [applyDraft]);

  const cancelDraft = useCallback(async (): Promise<void> => {
    const targets = draftCleanupTargets(draftRef.current);
    applyDraft(createDraft());
    setError(null);
    await Promise.all(targets.map((uri) => deleteStoredPhoto(uri)));
  }, [applyDraft]);

  const releaseDraft = useCallback(() => {
    applyDraft(createDraft());
  }, [applyDraft]);

  const selectPhoto = useCallback(
    (index: number) => {
      applyDraft(selectDraftPhoto(draftRef.current, index));
    },
    [applyDraft]
  );

  return {
    photos: draft.photos,
    activeIndex: draft.activeIndex,
    error,
    setError,
    takePhoto,
    pickPhoto,
    retakePhoto,
    cancelDraft,
    releaseDraft,
    selectPhoto,
  };
}
