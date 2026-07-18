import DateTimePicker from '@react-native-community/datetimepicker';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { ComponentType } from 'react';
import {
  Calendar,
  Camera,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  JapaneseYen,
  MapPin,
  MessageSquare,
  Package,
  Plus,
  Trash2,
} from 'lucide-react-native';
import type { LucideProps } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EnsoImage } from '../components/EnsoImage';
import { EnsoMark } from '../components/EnsoMark';
import { PhotoFrame } from '../components/PhotoFrame';
import { formatDateInput, parseDateInput } from '../lib/dateLabels';
import {
  formatPriceInput,
  joinBlockersInput,
  normalizeOptionalText,
  parsePriceInput,
  splitBlockersInput,
} from '../lib/itemForm';
import { coverIndexAfterRemove, mapIndexAfterMove } from '../lib/itemRepositoryRules';
import { clampPhotoIndex as clampIndex } from '../lib/photoSelection';
import { promptPhotoSource } from '../lib/photoSourcePrompt';
import { captureAndStorePhoto, pickAndStorePhoto } from '../lib/photoStorage';
import type { RootStackParamList } from '../navigation/types';
import { useItems } from '../state/ItemsContext';
import { useItemLoader } from '../state/useItemLoader';
import { usePhotoActions } from '../state/usePhotoActions';
import { colors, fonts, radii, shadows, urgency, urgencySelector } from '../theme/tokens';
import type { UrgencyLevel } from '../types/item';

type Props = NativeStackScreenProps<RootStackParamList, 'ItemEdit'>;

const urgencyLevels = [3, 2, 1, 0] as const;
const webNoOutline =
  Platform.OS === 'web' ? ({ outlineStyle: 'none' } as unknown as TextInputProps['style']) : undefined;

export function ItemEditScreen({ navigation, route }: Props) {
  const { addPhoto, updateExistingItem } = useItems();
  const { item, loading, error: loadError } = useItemLoader(route.params.itemId);
  const { movePhoto, removePhoto } = usePhotoActions(route.params.itemId);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [name, setName] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>(1);
  const [priceText, setPriceText] = useState('');
  const [lastUsedAt, setLastUsedAt] = useState('');
  const [location, setLocation] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);
  const [blockersText, setBlockersText] = useState('');
  const [memoryNote, setMemoryNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const hydratedItemId = useRef<string | null>(null);

  useEffect(() => {
    // Hydrate form fields once per item; photo additions refresh the item
    // object mid-edit and must not clobber what the user has typed.
    if (!item || hydratedItemId.current === item.id) {
      return;
    }
    hydratedItemId.current = item.id;
    setName(item.name);
    setSelectedUrgency(item.urgency);
    setCoverIndex(item.coverIndex);
    setPriceText(formatPriceInput(item.price));
    setLastUsedAt(item.lastUsedAt ?? '');
    setLocation(item.location ?? '');
    setBlockersText(joinBlockersInput(item.blockers));
    setMemoryNote(item.memoryNote ?? '');
  }, [item]);

  const addPhotoFromSource = async (acquire: () => Promise<string | null>) => {
    if (!item) {
      return;
    }

    setError(null);
    try {
      const uri = await acquire();
      if (uri) {
        await addPhoto(item.id, uri);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '写真を追加できませんでした。');
    }
  };

  const handleAddPhoto = () => {
    promptPhotoSource({
      onCamera: () => void addPhotoFromSource(captureAndStorePhoto),
      onLibrary: () => void addPhotoFromSource(pickAndStorePhoto),
    });
  };

  const handleDateValueChange = (selected: Date) => {
    setLastUsedAt(formatDateInput(selected));

    // Android shows a one-shot dialog; iOS keeps the inline calendar mounted.
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
  };

  const handleSelectToday = () => {
    handleDateValueChange(new Date());
  };

  const handleRemovePhoto = async (index: number) => {
    if (!item || photoBusy) {
      return;
    }
    setError(null);
    if (item.photos.length <= 1) {
      setError('写真は1枚以上必要です。');
      return;
    }

    setPhotoBusy(true);
    try {
      const result = await removePhoto(index);
      // The pending cover selection follows the same removal rule as the DB.
      setCoverIndex((current) =>
        coverIndexAfterRemove(clampIndex(current, item.photos.length), index, result.photos.length)
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '写真を削除できませんでした。');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleMovePhoto = async (fromIndex: number, toIndex: number) => {
    if (!item || photoBusy || toIndex < 0 || toIndex >= item.photos.length) {
      return;
    }

    setError(null);
    setPhotoBusy(true);
    try {
      await movePhoto(fromIndex, toIndex);
      setCoverIndex((current) => mapIndexAfterMove(clampIndex(current, item.photos.length), fromIndex, toIndex));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '写真を並べ替えられませんでした。');
    } finally {
      setPhotoBusy(false);
    }
  };

  const handleDone = async () => {
    if (!item || saving) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const parsedPrice = parsePriceInput(priceText);
      if (!parsedPrice.ok) {
        setError(parsedPrice.message);
        return;
      }

      await updateExistingItem(item.id, {
        name: name.trim() || '無名',
        urgency: selectedUrgency,
        price: parsedPrice.value,
        lastUsedAt: normalizeOptionalText(lastUsedAt),
        location: normalizeOptionalText(location),
        coverIndex: clampIndex(coverIndex, item.photos.length),
        blockers: splitBlockersInput(blockersText),
        memoryNote: normalizeOptionalText(memoryNote),
      });
      navigation.replace('ItemDetail', { itemId: item.id });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '記録を残せませんでした。');
    } finally {
      setSaving(false);
    }
  };

  if (!item) {
    return (
      <SafeAreaView style={styles.emptyScreen}>
        <Text style={styles.emptyText}>
          {loading ? '読み込み中…' : loadError ? '記録を読み込めませんでした。' : '記録が見つかりません'}
        </Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.emptyBack}>
          <Text style={styles.emptyBackText}>戻る</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.cancel}>キャンセル</Text>
        </Pressable>
        <Text style={styles.title}>記録する</Text>
        <Pressable onPress={() => void handleDone()}>
          <Text style={styles.done}>{saving ? '記録中' : '完了'}</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <View>
          <View style={styles.labelRow}>
            <LabelWithIcon icon={Camera} label={`写真（${item.photos.length}枚）`} />
            <Text style={styles.help}>タップで表紙</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.photoRoll}>
            {item.photos.map((photo, index) => (
              <View key={`${photo}-${index}`} style={styles.thumbWrap}>
                <Pressable onPress={() => setCoverIndex(index)}>
                  <PhotoFrame uri={photo} compact dark label={`${index + 1}`} />
                  {index === coverIndex ? <Text style={styles.coverBadge}>表紙</Text> : null}
                  {index !== coverIndex && item.photos.length > 1 ? <Text style={styles.coverAction}>表紙にする</Text> : null}
                </Pressable>
                <View style={styles.thumbControls}>
                  <Pressable
                    accessibilityLabel="前へ"
                    disabled={photoBusy || index === 0}
                    onPress={() => void handleMovePhoto(index, index - 1)}
                    style={[styles.thumbControl, index === 0 && styles.thumbControlDisabled]}
                  >
                    <ChevronLeft color={colors.subtextDark} size={17} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="写真を削除"
                    disabled={photoBusy}
                    onPress={() => void handleRemovePhoto(index)}
                    style={styles.thumbControl}
                  >
                    <Trash2 color={colors.dangerText} size={15} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="後ろへ"
                    disabled={photoBusy || index === item.photos.length - 1}
                    onPress={() => void handleMovePhoto(index, index + 1)}
                    style={[styles.thumbControl, index === item.photos.length - 1 && styles.thumbControlDisabled]}
                  >
                    <ChevronRight color={colors.subtextDark} size={17} />
                  </Pressable>
                </View>
              </View>
            ))}
            <Pressable onPress={handleAddPhoto} style={styles.addPhoto}>
              <Plus color={colors.subtext} size={22} />
              <Text style={styles.addPhotoText}>足す</Text>
            </Pressable>
          </ScrollView>
        </View>

        <View>
          <LabelWithIcon icon={Package} label="品名" />
          <TextInput value={name} onChangeText={setName} placeholder="無名" style={[styles.nameInput, webNoOutline]} />
        </View>

        <View>
          <LabelWithIcon icon={HelpCircle} label="捨てたい度" />
          <View style={styles.urgencyPicker}>
            {urgencyLevels.map((level) => {
              const active = level === selectedUrgency;
              const Icon = urgency[level].icon;
              return (
                <Pressable
                  key={level}
                  onPress={() => setSelectedUrgency(level)}
                  style={styles.urgencyOption}
                >
                  <View style={styles.urgencyCircle}>
                    {active ? (
                      <View key={`edit-selected-${level}`} style={styles.ensoRing}>
                        <EnsoMark tone="blue" size={urgencySelector.ensoSelected} animated />
                      </View>
                    ) : (
                      <View style={styles.ensoRing}>
                        <EnsoImage tone="gray" size={urgencySelector.ensoUnselected} opacity={0.18} />
                      </View>
                    )}
                    <Icon
                      color={active ? colors.kachi : colors.subtext}
                      size={active ? urgencySelector.iconSelected : urgencySelector.iconUnselected}
                      strokeWidth={2.35}
                    />
                  </View>
                  <Text style={[styles.urgencyLabel, active && styles.selectedUrgencyLabel]}>{urgency[level].label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.infoCard}>
          <InfoInputRow
            icon={JapaneseYen}
            keyboardType="number-pad"
            label="購入価格"
            onChangeText={setPriceText}
            placeholder="未入力"
            suffix="円"
            value={priceText}
          />
          <View style={styles.infoRow}>
            <Calendar color={colors.subtext} size={17} />
            <Text style={styles.infoLabel}>最後に使った</Text>
            <View style={styles.infoInputWrap}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setShowDatePicker((open) => !open)}
                style={styles.dateValueButton}
              >
                <Text style={[styles.dateValueText, !lastUsedAt && styles.dateValuePlaceholder]}>
                  {lastUsedAt || '年/月/日'}
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  handleSelectToday();
                  setShowDatePicker(false);
                }}
                style={styles.quickAction}
              >
                <Text style={styles.quickActionText}>今日</Text>
              </Pressable>
            </View>
          </View>
          <InfoInputRow
            icon={MapPin}
            label="保管場所"
            last
            onChangeText={setLocation}
            placeholder="未入力"
            value={location}
          />
        </View>

        {showDatePicker && Platform.OS === 'ios' ? (
          <Modal transparent animationType="fade" visible onRequestClose={() => setShowDatePicker(false)}>
            <Pressable style={styles.datePickerBackdrop} onPress={() => setShowDatePicker(false)}>
              <Pressable style={styles.datePickerCard} onPress={(event) => event.stopPropagation()}>
                <View style={styles.datePickerHeader}>
                  <Text style={styles.datePickerTitle}>最後に使った日</Text>
                  <View style={styles.datePickerActions}>
                    <Pressable
                      accessibilityLabel="今日を選択"
                      accessibilityRole="button"
                      onPress={handleSelectToday}
                      style={styles.quickAction}
                    >
                      <Text style={styles.quickActionText}>今日</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.done}>完了</Text>
                    </Pressable>
                  </View>
                </View>
                <DateTimePicker
                  accentColor={colors.kachi}
                  value={parseDateInput(lastUsedAt) ?? new Date()}
                  mode="date"
                  display="inline"
                  locale="ja-JP"
                  maximumDate={new Date()}
                  onValueChange={(_event, selected) => handleDateValueChange(selected)}
                  style={styles.datePicker}
                />
              </Pressable>
            </Pressable>
          </Modal>
        ) : null}
        {showDatePicker && Platform.OS !== 'ios' ? (
          <DateTimePicker
            value={parseDateInput(lastUsedAt) ?? new Date()}
            mode="date"
            display="default"
            maximumDate={new Date()}
            onValueChange={(_event, selected) => handleDateValueChange(selected)}
          />
        ) : null}

        <View>
          <View style={styles.labelRow}>
            <LabelWithIcon icon={HelpCircle} label="迷った理由" />
            <Text style={styles.help}>読点・カンマで複数入力</Text>
          </View>
          <TextInput
            value={blockersText}
            onChangeText={setBlockersText}
            placeholder="思い出、高かった、いつか使う"
            placeholderTextColor={colors.subtextLight}
            style={[styles.reasonInput, webNoOutline]}
          />
        </View>

        <View>
          <LabelWithIcon icon={MessageSquare} label="モノへの想い・メモ" />
          <TextInput
            value={memoryNote}
            onChangeText={setMemoryNote}
            multiline
            placeholder="思い出、迷っている理由、感謝の言葉など..."
            placeholderTextColor={colors.subtextLight}
            style={[styles.memo, webNoOutline]}
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function LabelWithIcon({ icon: Icon, label }: { icon: ComponentType<LucideProps>; label: string }) {
  return (
    <View style={styles.labelWithIcon}>
      <Icon color={colors.subtext} size={15} strokeWidth={2} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

type InfoRowProps = {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  last?: boolean;
  placeholder?: string;
  onQuickAction?: () => void;
  quickActionLabel?: string;
  suffix?: string;
  keyboardType?: TextInputProps['keyboardType'];
};

function InfoInputRow({
  icon: Icon,
  keyboardType,
  label,
  last,
  onChangeText,
  onQuickAction,
  placeholder,
  quickActionLabel,
  suffix,
  value,
}: InfoRowProps) {
  return (
    <View style={[styles.infoRow, last && styles.lastInfoRow]}>
      <Icon color={colors.subtext} size={17} />
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoInputWrap}>
        <TextInput
          keyboardType={keyboardType}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.subtextLight}
          style={[styles.infoInput, webNoOutline]}
          value={value}
        />
        {suffix ? <Text style={styles.infoSuffix}>{suffix}</Text> : null}
        {quickActionLabel && onQuickAction ? (
          <Pressable onPress={onQuickAction} style={styles.quickAction}>
            <Text style={styles.quickActionText}>{quickActionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  addPhoto: {
    alignItems: 'center',
    backgroundColor: colors.note,
    borderColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    gap: 4,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  addPhotoText: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 13,
  },
  cancel: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 17,
  },
  content: {
    gap: 18,
    padding: 18,
    paddingBottom: 34,
  },
  coverBadge: {
    backgroundColor: colors.kachi,
    borderRadius: radii.pill,
    color: colors.white,
    fontFamily: fonts.sansBold,
    fontSize: 12,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 1,
    position: 'absolute',
    top: 5,
  },
  coverAction: {
    backgroundColor: colors.translucentCard,
    borderRadius: radii.pill,
    bottom: 5,
    color: colors.kachi,
    fontFamily: fonts.sansBold,
    fontSize: 12,
    left: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    position: 'absolute',
    right: 5,
    textAlign: 'center',
  },
  dateValueButton: {
    flex: 1,
    paddingVertical: 6,
  },
  dateValueText: {
    color: colors.sumi,
    fontFamily: fonts.sans,
    fontSize: 18,
    textAlign: 'right',
  },
  dateValuePlaceholder: {
    color: colors.subtextLight,
  },
  datePicker: {
    width: '100%',
  },
  datePickerBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(28, 26, 23, 0.45)',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  datePickerCard: {
    backgroundColor: colors.card,
    borderRadius: radii.card,
    maxWidth: 360,
    paddingHorizontal: 12,
    paddingVertical: 16,
    width: '100%',
    ...shadows.card,
  },
  datePickerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  datePickerHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  datePickerTitle: {
    color: colors.sumi,
    fontFamily: fonts.serifSemiBold,
    fontSize: 17,
  },
  done: {
    color: colors.kachi,
    fontFamily: fonts.sansBold,
    fontSize: 18,
  },
  emptyBack: {
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  emptyBackText: {
    color: colors.subtextDark,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  emptyScreen: {
    alignItems: 'center',
    backgroundColor: colors.washi,
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  errorText: {
    color: colors.dangerText,
    fontFamily: fonts.sans,
    fontSize: 15,
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
  header: {
    alignItems: 'center',
    borderBottomColor: colors.borderLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  help: {
    color: colors.subtextLight,
    fontFamily: fonts.sans,
    fontSize: 14,
  },
  infoCard: {
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
    borderRadius: radii.input,
    borderWidth: 1,
  },
  infoLabel: {
    color: colors.subtext,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  infoRow: {
    alignItems: 'center',
    borderBottomColor: colors.borderLight,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    minHeight: 62,
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoInput: {
    color: colors.sumi,
    flex: 1,
    fontFamily: fonts.sans,
    fontSize: 18,
    minWidth: 0,
    padding: 0,
    paddingVertical: 6,
    textAlign: 'right',
  },
  infoInputWrap: {
    alignItems: 'center',
    flex: 1.35,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    minWidth: 0,
  },
  infoSuffix: {
    color: colors.subtext,
    fontFamily: fonts.sans,
    fontSize: 16,
    marginLeft: 4,
  },
  label: {
    color: colors.subtext,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    letterSpacing: 0.5,
  },
  labelRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelWithIcon: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  memo: {
    backgroundColor: colors.note,
    borderColor: colors.border,
    borderRadius: radii.input,
    borderWidth: 1,
    color: colors.sumi,
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 29,
    marginTop: 8,
    minHeight: 116,
    padding: 14,
  },
  nameInput: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.input,
    borderWidth: 1,
    color: colors.sumi,
    fontFamily: fonts.serif,
    fontSize: 20,
    marginTop: 8,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  photoRoll: {
    gap: 10,
  },
  quickAction: {
    backgroundColor: 'rgba(44,46,99,0.08)',
    borderColor: 'rgba(44,46,99,0.16)',
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  quickActionText: {
    color: colors.kachi,
    fontFamily: fonts.sansBold,
    fontSize: 14,
  },
  reasonInput: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.input,
    borderWidth: 1,
    color: colors.sumi,
    fontFamily: fonts.serif,
    fontSize: 17,
    marginTop: 8,
    paddingHorizontal: 15,
    paddingVertical: 13,
  },
  screen: {
    backgroundColor: colors.washi,
    flex: 1,
  },
  selectedUrgencyLabel: {
    color: colors.kachi,
    fontFamily: fonts.sansBold,
  },
  thumbControl: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.borderLight,
    borderRadius: 8,
    borderWidth: 1,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  thumbControlDisabled: {
    opacity: 0.35,
  },
  thumbControls: {
    flexDirection: 'row',
    gap: 5,
    justifyContent: 'center',
    marginTop: 6,
  },
  thumbWrap: {
    position: 'relative',
  },
  title: {
    color: colors.sumi,
    fontFamily: fonts.serifSemiBold,
    fontSize: 19,
  },
  urgencyCircle: {
    alignItems: 'center',
    height: urgencySelector.circle,
    justifyContent: 'center',
    overflow: 'hidden',
    width: urgencySelector.circle,
  },
  urgencyLabel: {
    color: colors.subtext,
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
  },
  urgencyOption: {
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  urgencyPicker: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
});
