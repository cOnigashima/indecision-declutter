import { CameraView, type CameraType, useCameraPermissions } from 'expo-camera';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, Edit3, Images, Plus, RotateCcw, SwitchCamera, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { EnsoImage } from '../components/EnsoImage';
import { EnsoMark } from '../components/EnsoMark';
import { PhotoFrame } from '../components/PhotoFrame';
import { cameraZoomFromPinch, clampCameraZoom, isCameraZoomPreset } from '../lib/cameraZoom';
import { canRelease } from '../lib/captureFlow';
import { movePhotoToFront } from '../lib/photoSelection';
import { promptPhotoSource } from '../lib/photoSourcePrompt';
import { pickAndStorePhoto, storePhotoFromUri } from '../lib/photoStorage';
import { captureUrgencySelector, colors, fonts, radii, urgency } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { useItems } from '../state/ItemsContext';
import type { UrgencyLevel } from '../types/item';
import { useCaptureDraft } from './hooks/useCaptureDraft';

type Props = NativeStackScreenProps<RootStackParamList, 'Capture'>;

const urgencyLevels = [3, 2, 1, 0] as const;
type CameraIntent = 'append' | 'replace';

// expo-camera exposes zoom as a percentage of each device's maximum rather
// than an optical magnification. These presets are tuned to feel close to the
// familiar 1x / 2x camera controls on each native platform.
const CAMERA_ZOOM_PRESETS = {
  one: 0,
  two: Platform.select({ ios: 0.14, android: 0.25, default: 0.16 }) ?? 0.16,
} as const;
const CAMERA_GUIDE_ASPECT_RATIO = 4 / 5;
const CAMERA_GUIDE_HORIZONTAL_INSET = 16;
const CAMERA_GUIDE_TOP_INSET = 96;
const CAMERA_GUIDE_BOTTOM_INSET = 180;

export function CaptureScreen({ navigation }: Props) {
  const { createItem } = useItems();
  const { height: cameraScreenHeight, width: cameraScreenWidth } = useWindowDimensions();
  const {
    photos,
    activeIndex: activePhotoIndex,
    error: draftError,
    setError: setDraftError,
    takePhoto,
    pickPhoto,
    retakePhoto,
    cancelDraft,
    releaseDraft,
    selectPhoto,
  } = useCaptureDraft();
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [cameraVisible, setCameraVisible] = useState(true);
  const [cameraIntent, setCameraIntent] = useState<CameraIntent>('append');
  const [cameraFacing, setCameraFacing] = useState<CameraType>('back');
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraBusy, setCameraBusy] = useState(false);
  const [cameraZoom, setCameraZoom] = useState<number>(CAMERA_ZOOM_PRESETS.one);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const cameraZoomRef = useRef<number>(cameraZoom);
  const pinchStartZoomRef = useRef<number>(cameraZoom);
  const permissionRequestedRef = useRef(false);
  const coverPhoto = photos[activePhotoIndex] ?? photos[0];
  const error = draftError ?? saveError ?? cameraError;
  const cameraGuideAvailableHeight = Math.max(
    0,
    cameraScreenHeight - CAMERA_GUIDE_TOP_INSET - CAMERA_GUIDE_BOTTOM_INSET
  );
  const cameraGuideWidth = Math.max(
    0,
    Math.min(
      cameraScreenWidth - CAMERA_GUIDE_HORIZONTAL_INSET * 2,
      cameraGuideAvailableHeight * CAMERA_GUIDE_ASPECT_RATIO
    )
  );
  const cameraGuideHeight = cameraGuideWidth / CAMERA_GUIDE_ASPECT_RATIO;
  const cameraGuideLeft = (cameraScreenWidth - cameraGuideWidth) / 2;
  const cameraGuideTop =
    CAMERA_GUIDE_TOP_INSET + Math.max(0, (cameraGuideAvailableHeight - cameraGuideHeight) / 2);

  const updateCameraZoom = useCallback((value: number) => {
    const nextZoom = clampCameraZoom(value);
    cameraZoomRef.current = nextZoom;
    setCameraZoom((currentZoom) => (Math.abs(currentZoom - nextZoom) < 0.001 ? currentZoom : nextZoom));
  }, []);

  const cameraPinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .runOnJS(true)
        .onBegin(() => {
          pinchStartZoomRef.current = cameraZoomRef.current;
        })
        .onUpdate(({ scale }) => {
          updateCameraZoom(cameraZoomFromPinch(pinchStartZoomRef.current, scale));
        }),
    [updateCameraZoom]
  );

  // FABからは中間画面を挟まずカメラを開く。初回権限ダイアログもここで要求する。
  useEffect(() => {
    if (
      !cameraVisible ||
      !cameraPermission ||
      cameraPermission.granted ||
      !cameraPermission.canAskAgain ||
      permissionRequestedRef.current
    ) {
      return;
    }
    permissionRequestedRef.current = true;
    void requestCameraPermission();
  }, [cameraPermission, cameraVisible, requestCameraPermission]);

  const openCamera = (intent: CameraIntent) => {
    setCameraIntent(intent);
    setCameraReady(false);
    setCameraError(null);
    setCameraVisible(true);
  };

  const addAnotherPhoto = () => {
    promptPhotoSource({ onCamera: () => openCamera('append'), onLibrary: () => void pickPhoto() });
  };

  const handleCancel = () => {
    void cancelDraft();
    navigation.navigate('Tabs', { screen: 'CandidateList' });
  };

  const acquireCameraPhoto = async (): Promise<string | null> => {
    const picture = await cameraRef.current?.takePictureAsync({ exif: false, quality: 0.9 });
    if (!picture) {
      return null;
    }
    return storePhotoFromUri(picture.uri, picture.width);
  };

  const handleShutter = async () => {
    if (!cameraReady || cameraBusy) {
      return;
    }

    setCameraBusy(true);
    setCameraError(null);
    try {
      const uri =
        cameraIntent === 'replace'
          ? await retakePhoto(acquireCameraPhoto)
          : await takePhoto(acquireCameraPhoto);
      if (uri) {
        setCameraVisible(false);
      }
    } finally {
      setCameraBusy(false);
    }
  };

  const handleCameraLibrary = async () => {
    if (cameraBusy) {
      return;
    }

    setCameraBusy(true);
    setCameraError(null);
    try {
      const uri = cameraIntent === 'replace' ? await retakePhoto(pickAndStorePhoto) : await pickPhoto();
      if (uri) {
        setCameraVisible(false);
      }
    } finally {
      setCameraBusy(false);
    }
  };

  const handleRequestCameraPermission = async () => {
    permissionRequestedRef.current = true;
    const response = await requestCameraPermission();
    if (!response.granted) {
      setCameraError('カメラを許可するか、ライブラリから写真を選んでください。');
    }
  };

  const handleSwitchCamera = () => {
    updateCameraZoom(CAMERA_ZOOM_PRESETS.one);
    setCameraFacing((current) => (current === 'back' ? 'front' : 'back'));
  };

  const saveItem = async (next: 'capture' | 'edit') => {
    if (saving) {
      return;
    }

    setSaving(true);
    setSaveError(null);
    setDraftError(null);
    try {
      let nextPhotos = photos;
      if (nextPhotos.length === 0) {
        openCamera('append');
        return;
      }

      const orderedPhotos = movePhotoToFront(nextPhotos, activePhotoIndex);
      const itemId = await createItem({ photos: orderedPhotos, urgency: selectedUrgency });
      releaseDraft();
      if (next === 'edit') {
        navigation.replace('ItemEdit', { itemId });
      } else {
        navigation.replace('EvacuationComplete', { itemId, returnTo: 'capture' });
      }
    } catch (caught) {
      setSaveError(caught instanceof Error ? caught.message : '写しを収められませんでした。');
    } finally {
      setSaving(false);
    }
  };

  if (cameraVisible) {
    const cameraGranted = cameraPermission?.granted === true;

    return (
      <View style={styles.cameraScreen}>
        {cameraGranted ? (
          <GestureDetector gesture={cameraPinchGesture}>
            <View style={styles.cameraGestureArea}>
              <CameraView
                ref={cameraRef}
                active
                facing={cameraFacing}
                mode="picture"
                onCameraReady={() => setCameraReady(true)}
                onMountError={({ message }) => setCameraError(`カメラを起動できませんでした。${message}`)}
                style={styles.cameraView}
                zoom={cameraZoom}
              />
              <View pointerEvents="none" style={styles.cameraGuideLayer}>
                <View style={[styles.cameraGuideShade, { height: cameraGuideTop, left: 0, right: 0, top: 0 }]} />
                <View
                  style={[
                    styles.cameraGuideShade,
                    {
                      bottom: 0,
                      left: 0,
                      right: 0,
                      top: cameraGuideTop + cameraGuideHeight,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.cameraGuideShade,
                    {
                      height: cameraGuideHeight,
                      left: 0,
                      top: cameraGuideTop,
                      width: cameraGuideLeft,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.cameraGuideShade,
                    {
                      height: cameraGuideHeight,
                      right: 0,
                      top: cameraGuideTop,
                      width: cameraGuideLeft,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.cameraGuideFrame,
                    {
                      height: cameraGuideHeight,
                      left: cameraGuideLeft,
                      top: cameraGuideTop,
                      width: cameraGuideWidth,
                    },
                  ]}
                />
              </View>
            </View>
          </GestureDetector>
        ) : (
          <View style={styles.cameraPermissionPanel}>
            <Camera color={colors.white} size={40} strokeWidth={1.7} />
            <Text style={styles.cameraPermissionTitle}>
              {cameraPermission ? 'カメラの許可が必要です' : 'カメラを準備しています'}
            </Text>
            <Text style={styles.cameraPermissionText}>ライブラリの写真から、写しを収めることもできます。</Text>
            {cameraPermission ? (
              <Pressable onPress={() => void handleRequestCameraPermission()} style={styles.permissionButton}>
                <Text style={styles.permissionButtonText}>カメラを許可</Text>
              </Pressable>
            ) : null}
          </View>
        )}

        <SafeAreaView edges={['top']} style={styles.cameraTopBar}>
          <Pressable accessibilityLabel="撮影をやめる" onPress={handleCancel} style={styles.cameraTopButton}>
            <X color={colors.white} size={25} />
          </Pressable>
        </SafeAreaView>

        {error ? <Text style={styles.cameraErrorText}>{error}</Text> : null}

        {cameraGranted ? (
          <View pointerEvents="box-none" style={styles.cameraZoomBar}>
            <View style={styles.cameraZoomControls}>
              <Pressable
                accessibilityLabel="1倍ズーム"
                accessibilityRole="button"
                accessibilityState={{ selected: isCameraZoomPreset(cameraZoom, CAMERA_ZOOM_PRESETS.one) }}
                onPress={() => updateCameraZoom(CAMERA_ZOOM_PRESETS.one)}
                style={[
                  styles.cameraZoomButton,
                  isCameraZoomPreset(cameraZoom, CAMERA_ZOOM_PRESETS.one) && styles.cameraZoomButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.cameraZoomText,
                    isCameraZoomPreset(cameraZoom, CAMERA_ZOOM_PRESETS.one) && styles.cameraZoomTextActive,
                  ]}
                >
                  1×
                </Text>
              </Pressable>
              <Pressable
                accessibilityLabel="2倍ズーム"
                accessibilityRole="button"
                accessibilityState={{ selected: isCameraZoomPreset(cameraZoom, CAMERA_ZOOM_PRESETS.two) }}
                onPress={() => updateCameraZoom(CAMERA_ZOOM_PRESETS.two)}
                style={[
                  styles.cameraZoomButton,
                  isCameraZoomPreset(cameraZoom, CAMERA_ZOOM_PRESETS.two) && styles.cameraZoomButtonActive,
                ]}
              >
                <Text
                  style={[
                    styles.cameraZoomText,
                    isCameraZoomPreset(cameraZoom, CAMERA_ZOOM_PRESETS.two) && styles.cameraZoomTextActive,
                  ]}
                >
                  2×
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        <SafeAreaView edges={['bottom']} style={styles.cameraControls}>
          <Pressable
            accessibilityLabel="ライブラリから選ぶ"
            disabled={cameraBusy}
            onPress={() => void handleCameraLibrary()}
            style={styles.cameraSideControl}
          >
            <Images color={colors.white} size={26} />
            <Text style={styles.cameraControlLabel}>ライブラリ</Text>
          </Pressable>

          {cameraGranted ? (
            <Pressable
              accessibilityLabel="写真を撮る"
              disabled={!cameraReady || cameraBusy}
              onPress={() => void handleShutter()}
              style={[styles.shutterOuter, (!cameraReady || cameraBusy) && styles.cameraControlDisabled]}
            >
              <View style={styles.shutterInner} />
            </Pressable>
          ) : (
            <View style={styles.shutterPlaceholder} />
          )}

          {cameraGranted ? (
            <Pressable
              accessibilityLabel="前後のカメラを切り替える"
              disabled={cameraBusy}
              onPress={handleSwitchCamera}
              style={styles.cameraSideControl}
            >
              <SwitchCamera color={colors.white} size={27} />
              <Text style={styles.cameraControlLabel}>切り替え</Text>
            </Pressable>
          ) : (
            <View style={styles.cameraSideControl} />
          )}
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.preview}>
        <SafeAreaView edges={['top']} style={styles.topControls}>
          <Pressable onPress={handleCancel} style={styles.previewPill}>
            <X color={colors.white} size={16} />
            <Text style={styles.previewPillText}>やめる</Text>
          </Pressable>
          <Pressable onPress={() => openCamera('replace')} style={styles.previewPill}>
            <RotateCcw color={colors.white} size={16} />
            <Text style={styles.previewPillText}>撮り直す</Text>
          </Pressable>
        </SafeAreaView>
        <Pressable onPress={addAnotherPhoto} style={styles.previewPhoto}>
          <PhotoFrame
            uri={coverPhoto}
            label="撮る"
            style={styles.previewPhotoInner}
            contentFit="cover"
            backgroundColor={colors.photoLight}
          />
          {photos.length === 0 ? (
            <View style={styles.cameraPrompt}>
              <Camera color="rgba(255,255,255,0.82)" size={24} />
              <Text style={styles.cameraPromptText}>写真を撮る</Text>
              <Text style={styles.cameraPromptHint}>タップで カメラ / ライブラリ</Text>
            </View>
          ) : null}
        </Pressable>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View style={styles.photoRoll}>
          {photos.map((photo, index) => (
            <Pressable
              key={`${photo}-${index}`}
              onPress={() => selectPhoto(index)}
              style={[styles.thumb, index === activePhotoIndex && styles.coverThumb]}
            >
              <PhotoFrame uri={photo} label={`${index + 1}`} style={styles.thumbPhoto} backgroundColor={colors.photoLight} />
            </Pressable>
          ))}
          <Pressable onPress={addAnotherPhoto} style={styles.addThumb}>
            <Plus color={colors.white} size={18} />
            <Text style={styles.addThumbText}>もう1枚</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.sheet}>
        <Text style={styles.countText}>このモノ ・ {photos.length} 枚</Text>
        <Text style={styles.question}>この迷いは、どのくらい？</Text>
        <View style={styles.urgencyRow}>
          {urgencyLevels.map((level) => {
            const config = urgency[level];
            const Icon = config.icon;
            const selected = level === selectedUrgency;
            return (
              <Pressable key={level} onPress={() => setSelectedUrgency(level)} style={styles.urgencyOption}>
                <View style={styles.urgencyCircle}>
                  {selected ? (
                    <View key={`selected-${level}`} style={styles.ensoRing}>
                      <EnsoMark tone="blue" size={captureUrgencySelector.ensoSelected} animated />
                    </View>
                  ) : (
                    <View style={styles.ensoRing}>
                      <EnsoImage tone="gray" size={captureUrgencySelector.ensoUnselected} opacity={0.18} />
                    </View>
                  )}
                  <Icon
                    color={selected ? colors.kachi : colors.subtext}
                    size={selected ? captureUrgencySelector.iconSelected : captureUrgencySelector.iconUnselected}
                    strokeWidth={2.35}
                  />
                </View>
                <Text style={[styles.urgencyLabel, selected && styles.selectedLabel]}>{config.label}</Text>
              </Pressable>
            );
          })}
        </View>
        {canRelease(photos) ? (
          <>
            <ActionButton
              label={saving ? '収めています' : '写しを収めて、次を撮る'}
              icon={Camera}
              onPress={() => void saveItem('capture')}
            />
            <ActionButton
              label="写しを収めて、書き留める"
              tone="outline"
              icon={Edit3}
              onPress={() => void saveItem('edit')}
            />
          </>
        ) : (
          <Text style={styles.gateHint}>まず、写真を一枚撮りましょう</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addThumb: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 10,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    gap: 2,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  addThumbText: {
    color: colors.white,
    fontFamily: fonts.sans,
    fontSize: 9,
  },
  cameraControlDisabled: {
    opacity: 0.5,
  },
  cameraControlLabel: {
    color: colors.white,
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
  },
  cameraControls: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 0,
    paddingHorizontal: 30,
    paddingTop: 18,
    position: 'absolute',
    right: 0,
  },
  cameraErrorText: {
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: 10,
    bottom: 142,
    color: '#f2c1bc',
    fontFamily: fonts.sans,
    fontSize: 13,
    left: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'absolute',
    right: 24,
    textAlign: 'center',
  },
  cameraGestureArea: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cameraGuideFrame: {
    borderColor: colors.cameraGuideLine,
    borderRadius: 16,
    borderWidth: 1,
    position: 'absolute',
  },
  cameraGuideLayer: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cameraGuideShade: {
    backgroundColor: colors.cameraGuideShade,
    position: 'absolute',
  },
  cameraPermissionPanel: {
    alignItems: 'center',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
    paddingBottom: 100,
    paddingHorizontal: 38,
  },
  cameraPermissionText: {
    color: 'rgba(255,255,255,0.65)',
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  cameraPermissionTitle: {
    color: colors.white,
    fontFamily: fonts.serifSemiBold,
    fontSize: 20,
    marginTop: 4,
  },
  cameraScreen: {
    backgroundColor: colors.viewer,
    flex: 1,
  },
  cameraSideControl: {
    alignItems: 'center',
    gap: 5,
    height: 64,
    justifyContent: 'center',
    width: 86,
  },
  cameraTopBar: {
    left: 0,
    paddingHorizontal: 18,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cameraTopButton: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.photoScrim,
    borderRadius: 22,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  cameraView: {
    bottom: 0,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  cameraZoomBar: {
    alignItems: 'center',
    bottom: 124,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  cameraZoomButton: {
    alignItems: 'center',
    borderRadius: radii.pill,
    height: 36,
    justifyContent: 'center',
    width: 48,
  },
  cameraZoomButtonActive: {
    backgroundColor: colors.white,
  },
  cameraZoomControls: {
    backgroundColor: colors.photoScrim,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 4,
    padding: 4,
  },
  cameraZoomText: {
    color: colors.white,
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  cameraZoomTextActive: {
    color: colors.sumi,
  },
  countText: {
    color: colors.subtext,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
    textAlign: 'center',
  },
  coverThumb: {
    borderColor: colors.white,
    borderWidth: 2,
  },
  cameraPrompt: {
    alignItems: 'center',
    gap: 8,
    position: 'absolute',
  },
  cameraPromptText: {
    color: 'rgba(255,255,255,0.82)',
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
  },
  cameraPromptHint: {
    color: 'rgba(255,255,255,0.6)',
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  gateHint: {
    color: colors.subtext,
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    paddingVertical: 18,
    textAlign: 'center',
  },
  errorText: {
    bottom: 82,
    color: '#f2c1bc',
    fontFamily: fonts.sans,
    fontSize: 15,
    left: 20,
    position: 'absolute',
    right: 20,
    textAlign: 'center',
  },
  ensoRing: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
  photoRoll: {
    bottom: 16,
    flexDirection: 'row',
    gap: 8,
    left: 16,
    position: 'absolute',
    right: 16,
  },
  preview: {
    alignItems: 'center',
    backgroundColor: colors.photoDark,
    flex: 1,
    justifyContent: 'center',
  },
  previewPhoto: {
    alignItems: 'center',
    aspectRatio: CAMERA_GUIDE_ASPECT_RATIO,
    borderRadius: 18,
    backgroundColor: colors.photoLight,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 230,
  },
  previewPhotoInner: {
    height: '100%',
    width: '100%',
  },
  previewPill: {
    alignItems: 'center',
    backgroundColor: colors.photoScrim,
    borderRadius: radii.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  previewPillText: {
    color: colors.white,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
  },
  permissionButton: {
    backgroundColor: colors.white,
    borderRadius: radii.pill,
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  permissionButtonText: {
    color: colors.sumi,
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  question: {
    color: colors.sumi,
    fontFamily: fonts.serifSemiBold,
    fontSize: 18,
    textAlign: 'center',
  },
  screen: {
    backgroundColor: colors.washi,
    flex: 1,
  },
  selectedLabel: {
    color: colors.kachi,
    fontFamily: fonts.sansBold,
  },
  sheet: {
    backgroundColor: colors.washi,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    gap: 10,
    paddingBottom: 24,
    paddingHorizontal: 22,
    paddingTop: 20,
  },
  shutterInner: {
    backgroundColor: colors.white,
    borderRadius: 29,
    height: 58,
    width: 58,
  },
  shutterOuter: {
    alignItems: 'center',
    borderColor: colors.white,
    borderRadius: 38,
    borderWidth: 4,
    height: 76,
    justifyContent: 'center',
    width: 76,
  },
  shutterPlaceholder: {
    height: 76,
    width: 76,
  },
  thumb: {
    alignItems: 'center',
    backgroundColor: '#2a2a2e',
    borderRadius: 10,
    height: 52,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 52,
  },
  thumbPhoto: {
    height: 52,
    width: 52,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: 16,
    position: 'absolute',
    right: 16,
    top: 0,
    zIndex: 10,
  },
  urgencyCircle: {
    alignItems: 'center',
    height: captureUrgencySelector.circle,
    justifyContent: 'center',
    overflow: 'hidden',
    width: captureUrgencySelector.circle,
  },
  urgencyLabel: {
    color: colors.subtext,
    fontFamily: fonts.sansSemiBold,
    fontSize: 13,
  },
  urgencyOption: {
    alignItems: 'center',
    flex: 1,
    gap: 7,
  },
  urgencyRow: {
    flexDirection: 'row',
    marginBottom: 6,
    marginTop: 2,
  },
});
