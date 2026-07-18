import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
}));

import { Alert, type AlertButton } from 'react-native';
import { promptPhotoSource } from './photoSourcePrompt';

const alertMock = vi.mocked(Alert.alert);

function shownButtons(): AlertButton[] {
  return (alertMock.mock.calls[0]?.[2] ?? []) as AlertButton[];
}

describe('promptPhotoSource', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('offers camera, library, and a cancel choice', () => {
    promptPhotoSource({ onCamera: vi.fn(), onLibrary: vi.fn() });

    expect(alertMock).toHaveBeenCalledTimes(1);
    const buttons = shownButtons();
    expect(buttons.map((button) => button.text)).toEqual(['カメラで撮る', 'ライブラリから選ぶ', 'やめる']);
    expect(buttons[2]?.style).toBe('cancel');
  });

  it('routes each choice to its own handler', () => {
    const onCamera = vi.fn();
    const onLibrary = vi.fn();
    promptPhotoSource({ onCamera, onLibrary });
    const buttons = shownButtons();

    buttons[0]?.onPress?.();
    expect(onCamera).toHaveBeenCalledTimes(1);
    expect(onLibrary).not.toHaveBeenCalled();

    buttons[1]?.onPress?.();
    expect(onLibrary).toHaveBeenCalledTimes(1);
  });
});
