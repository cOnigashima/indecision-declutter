import { Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { colors, fonts, radii } from '../theme/tokens';

type Tone = 'kachi' | 'shu';

type EditableItemNameProps = {
  name: string;
  /** 品名だけを保存する。status など他項目は呼び出し側で触らないこと。 */
  onSave: (name: string) => Promise<void>;
  tone?: Tone;
};

/**
 * 品名をその場で編集できる見出し。詳細画面から編集画面へ移らずに「呼び名」を
 * 直せるようにする。tone で縁側（内部candidate・勝色）/ 捨離（朱）のアクセントを切り替える。
 */
export function EditableItemName({ name, onSave, tone = 'kachi' }: EditableItemNameProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startEdit = () => {
    setDraft(name);
    setError(null);
    setEditing(true);
  };

  const cancelEdit = () => {
    setEditing(false);
    setError(null);
  };

  const save = async () => {
    if (saving) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(draft.trim() || '無名');
      setEditing(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '品名を保存できませんでした。');
    } finally {
      setSaving(false);
    }
  };

  const accent = tone === 'shu' ? colors.shu : colors.kachi;

  if (editing) {
    return (
      <View style={styles.editBlock}>
        <TextInput
          autoFocus
          value={draft}
          onChangeText={setDraft}
          placeholder="無名"
          placeholderTextColor={colors.subtextLight}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={() => void save()}
        />
        <View style={styles.actions}>
          <Pressable disabled={saving} onPress={cancelEdit} style={styles.cancel}>
            <Text style={styles.cancelText}>やめる</Text>
          </Pressable>
          <Pressable disabled={saving} onPress={() => void save()} style={[styles.save, { backgroundColor: accent }]}>
            <Text style={styles.saveText}>{saving ? '保存中' : '保存'}</Text>
          </Pressable>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }

  return (
    <Pressable accessibilityRole="button" onPress={startEdit} style={styles.display}>
      <Text style={styles.name}>{name}</Text>
      <View style={styles.editHint}>
        <Pencil color={accent} size={15} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  cancel: {
    borderColor: colors.border,
    borderRadius: radii.pill,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 8,
  },
  cancelText: {
    color: colors.subtextDark,
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
  },
  display: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: 42,
    position: 'relative',
    width: '100%',
  },
  editBlock: {
    gap: 10,
  },
  editHint: {
    alignItems: 'center',
    backgroundColor: colors.borderLight,
    borderRadius: radii.pill,
    height: 28,
    justifyContent: 'center',
    position: 'absolute',
    right: 0,
    width: 28,
  },
  error: {
    color: colors.dangerText,
    fontFamily: fonts.sans,
    fontSize: 14,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radii.input,
    borderWidth: 1,
    color: colors.sumi,
    fontFamily: fonts.serifBold,
    fontSize: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    textAlign: 'center',
  },
  name: {
    color: colors.sumi,
    flexShrink: 1,
    fontFamily: fonts.serifBold,
    fontSize: 27,
    textAlign: 'center',
  },
  save: {
    borderRadius: radii.pill,
    paddingHorizontal: 22,
    paddingVertical: 8,
  },
  saveText: {
    color: colors.washi,
    fontFamily: fonts.sansBold,
    fontSize: 15,
  },
});
