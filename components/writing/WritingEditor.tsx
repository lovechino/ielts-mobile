import { useCallback, useEffect, useRef, useState } from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { WordCountBar } from './WordCountBar';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { useWritingStore } from '@/stores/useWritingStore';
import { saveDraft } from '@/lib/api/progress';

interface WritingEditorProps {
  taskId: string;
  lessonId: string;
  minWords: number;
  recommendedWords?: number;
  placeholder?: string;
  editable?: boolean;
}

export function WritingEditor({ taskId, lessonId, minWords, recommendedWords, placeholder, editable = true }: WritingEditorProps) {
  const { drafts, wordCounts, lastSavedAt, autoSave } = useWritingStore();
  const draftText = drafts[taskId] || '';
  const wordCount = wordCounts[taskId] || 0;
  const savedAt = lastSavedAt[taskId] || null;

  const [localText, setLocalText] = useState(draftText);
  const [isSaving, setIsSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const persistDraft = useCallback(async (text: string) => {
    autoSave(taskId, text);
    setIsSaving(true);
    try {
      await saveDraft({ lesson_id: lessonId, draft_answers: { [taskId]: text }, time_left: 0 });
    } catch {}
    if (isMountedRef.current) setIsSaving(false);
  }, [taskId, lessonId, autoSave]);

  const handleChange = useCallback((text: string) => {
    setLocalText(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => persistDraft(text), 2000);
  }, [persistDraft]);

  const handlePaste = useCallback((e: any) => {
    const text = e.nativeEvent.text;
    const cleaned = text.replace(/<[^>]*>/g, '');
    if (cleaned !== text) {
      e.preventDefault();
      setLocalText(cleaned);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => persistDraft(cleaned), 2000);
    }
  }, [persistDraft]);

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <WordCountBar current={wordCount} min={minWords} recommended={recommendedWords} />
        <AutoSaveIndicator lastSavedAt={savedAt} isSaving={isSaving} />
      </View>
      <TextInput
        style={[styles.editor, !editable && styles.editorDisabled]}
        value={localText}
        onChangeText={handleChange}
        placeholder={placeholder || 'Write your essay here...'}
        placeholderTextColor={colors.textMuted}
        multiline
        textAlignVertical="top"
        autoCapitalize="sentences"
        autoCorrect
        spellCheck
        editable={editable}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, ...shadow.card },
  bar: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    backgroundColor: '#fff', borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg,
    borderBottomWidth: 1, borderColor: colors.border,
  },
  editor: {
    flex: 1, padding: spacing.md, fontSize: 16, lineHeight: 26,
    color: colors.text, backgroundColor: '#fff',
    borderBottomLeftRadius: radius.lg, borderBottomRightRadius: radius.lg,
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  editorDisabled: {
    backgroundColor: colors.surfaceContainerLow,
    color: colors.textSecondary,
  },
});
