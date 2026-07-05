import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Camera, Edit3, Plus, RotateCcw, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton } from '../components/ActionButton';
import { EnsoImage } from '../components/EnsoImage';
import { EnsoMark } from '../components/EnsoMark';
import { PhotoFrame } from '../components/PhotoFrame';
import { movePhotoToFront } from '../lib/photoSelection';
import { colors, fonts, radii, urgency } from '../theme/tokens';
import type { RootStackParamList } from '../navigation/types';
import { useItems } from '../state/ItemsContext';
import type { UrgencyLevel } from '../types/item';
import { useCaptureDraft } from './hooks/useCaptureDraft';

type Props = NativeStackScreenProps<RootStackParamList, 'Capture'>;

const urgencyLevels = [3, 2, 1, 0] as const;

export function CaptureScreen({ navigation }: Props) {
  const { createItem } = useItems();
  const {
    photos,
    activeIndex: activePhotoIndex,
    error: draftError,
    setError: setDraftError,
    takePhoto,
    retakePhoto,
    cancelDraft,
    releaseDraft,
    selectPhoto,
  } = useCaptureDraft();
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const coverPhoto = photos[activePhotoIndex] ?? photos[0];
  const error = draftError ?? saveError;

  const handleCancel = () => {
    void cancelDraft();
    navigation.navigate('Tabs');
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
        const uri = await takePhoto();
        if (!uri) {
          return;
        }
        nextPhotos = [uri];
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
      setSaveError(caught instanceof Error ? caught.message : '退避できませんでした。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.preview}>
        <SafeAreaView edges={['top']} style={styles.topControls}>
          <Pressable onPress={handleCancel} style={styles.previewPill}>
            <X color={colors.white} size={16} />
            <Text style={styles.previewPillText}>やめる</Text>
          </Pressable>
          <Pressable onPress={() => void retakePhoto()} style={styles.previewPill}>
            <RotateCcw color={colors.white} size={16} />
            <Text style={styles.previewPillText}>撮り直す</Text>
          </Pressable>
        </SafeAreaView>
        <Pressable onPress={takePhoto} style={styles.previewPhoto}>
          <PhotoFrame
            uri={coverPhoto}
            label="撮る"
            style={styles.previewPhotoInner}
            contentFit="contain"
            backgroundColor={colors.photoLight}
          />
          {photos.length === 0 ? (
            <View style={styles.cameraPrompt}>
              <Camera color="rgba(255,255,255,0.82)" size={24} />
              <Text style={styles.cameraPromptText}>写真を撮る</Text>
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
          <Pressable onPress={takePhoto} style={styles.addThumb}>
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
                      <EnsoMark tone="blue" size={88} animated />
                    </View>
                  ) : (
                    <View style={styles.ensoRing}>
                      <EnsoImage tone="gray" size={80} opacity={0.18} />
                    </View>
                  )}
                  <Icon color={selected ? colors.kachi : colors.subtext} size={selected ? 40 : 36} strokeWidth={2.35} />
                </View>
                <Text style={[styles.urgencyLabel, selected && styles.selectedLabel]}>{config.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <ActionButton
          label={saving ? '退避中' : '退避して、次を撮る'}
          icon={Camera}
          onPress={() => void saveItem('capture')}
        />
        <ActionButton
          label="退避して、書き留める"
          tone="outline"
          icon={Edit3}
          onPress={() => void saveItem('edit')}
        />
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
    fontSize: 13,
  },
  countText: {
    color: colors.subtext,
    fontFamily: fonts.sansSemiBold,
    fontSize: 17,
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
    position: 'absolute',
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
    borderRadius: 18,
    backgroundColor: colors.photoLight,
    height: 304,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 230,
  },
  previewPhotoInner: {
    height: 304,
    width: 230,
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
    fontSize: 16,
  },
  question: {
    color: colors.sumi,
    fontFamily: fonts.serifSemiBold,
    fontSize: 28,
    marginTop: 14,
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
    gap: 16,
    paddingBottom: 20,
    paddingHorizontal: 12,
    paddingTop: 20,
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
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  urgencyLabel: {
    color: colors.subtext,
    fontFamily: fonts.sansSemiBold,
    fontSize: 18,
  },
  urgencyOption: {
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  urgencyRow: {
    flexDirection: 'row',
    marginBottom: 10,
    marginTop: 14,
  },
});
