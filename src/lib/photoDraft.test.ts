import { describe, expect, it } from 'vitest';

import {
  appendDraftPhoto,
  createDraft,
  draftCleanupTargets,
  emptyDraft,
  replaceActiveDraftPhoto,
  selectDraftPhoto,
} from './photoDraft';

describe('createDraft', () => {
  it('starts empty or with the handed-off photo', () => {
    expect(createDraft()).toEqual({ photos: [], activeIndex: 0 });
    expect(createDraft('uri-1')).toEqual({ photos: ['uri-1'], activeIndex: 0 });
  });
});

describe('appendDraftPhoto', () => {
  it('appends and activates the new photo', () => {
    const draft = appendDraftPhoto(appendDraftPhoto(emptyDraft, 'a'), 'b');
    expect(draft).toEqual({ photos: ['a', 'b'], activeIndex: 1 });
  });
});

describe('replaceActiveDraftPhoto', () => {
  it('replaces only the active photo and reports the removed uri', () => {
    const base = { photos: ['a', 'b', 'c'], activeIndex: 1 };
    const { draft, removedUri } = replaceActiveDraftPhoto(base, 'new');
    expect(draft).toEqual({ photos: ['a', 'new', 'c'], activeIndex: 1 });
    expect(removedUri).toBe('b');
  });

  it('appends when the draft is empty', () => {
    const { draft, removedUri } = replaceActiveDraftPhoto(emptyDraft, 'new');
    expect(draft).toEqual({ photos: ['new'], activeIndex: 0 });
    expect(removedUri).toBeNull();
  });

  it('clamps a stale active index before replacing', () => {
    const { draft, removedUri } = replaceActiveDraftPhoto({ photos: ['a', 'b'], activeIndex: 9 }, 'new');
    expect(draft).toEqual({ photos: ['a', 'new'], activeIndex: 1 });
    expect(removedUri).toBe('b');
  });
});

describe('selectDraftPhoto', () => {
  it('clamps the selected index into range', () => {
    const base = { photos: ['a', 'b'], activeIndex: 0 };
    expect(selectDraftPhoto(base, 1).activeIndex).toBe(1);
    expect(selectDraftPhoto(base, 5).activeIndex).toBe(1);
    expect(selectDraftPhoto(base, -1).activeIndex).toBe(0);
  });
});

describe('draftCleanupTargets', () => {
  it('returns every draft photo as a cleanup target', () => {
    expect(draftCleanupTargets({ photos: ['a', 'b'], activeIndex: 1 })).toEqual(['a', 'b']);
    expect(draftCleanupTargets(emptyDraft)).toEqual([]);
  });
});
