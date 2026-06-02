/**
 * DictionaryOverlay — BottomSheet tra từ nhanh, gọi được từ bất kỳ đâu.
 *
 * Cách dùng:
 *   const { showDict } = useDictionaryOverlay();
 *   <Text onLongPress={() => showDict('ephemeral')}>ephemeral</Text>
 *   <DictionaryOverlay />
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Modal, Animated, Dimensions, ScrollView, TouchableWithoutFeedback,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { searchWords, getWordDetail, addToVault, isSavedInVault } from '@/lib/offline/dictionary';
import { useTTS } from '@/hooks/useTTS';
import { create } from 'zustand';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.55;

// ─── Global store để trigger overlay từ bất kỳ đâu ──────────────────────────

interface DictOverlayState {
  visible: boolean;
  word: string;
  show: (word: string) => void;
  hide: () => void;
}

export const useDictionaryOverlay = create<DictOverlayState>((set) => ({
  visible: false,
  word: '',
  show: (word) => set({ visible: true, word: word.trim() }),
  hide: () => set({ visible: false, word: '' }),
}));

// ─── Component ───────────────────────────────────────────────────────────────

interface WordData {
  id: number;
  word: string;
  definition: string;
  definition_vi: string;
  pronunciation: string;
  part_of_speech: string;
  example: string;
  example_vi: string;
}

export function DictionaryOverlay() {
  const { visible, word, hide } = useDictionaryOverlay();
  const { speak } = useTTS();

  const [loading, setLoading] = useState(false);
  const [wordData, setWordData] = useState<WordData | null>(null);
  const [saved, setSaved] = useState(false);
  const [savingVault, setSavingVault] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const slideAnim = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  // Animate in/out
  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
      lookupWord(word);
    } else {
      Animated.timing(slideAnim, {
        toValue: SHEET_HEIGHT,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, word]);

  const lookupWord = useCallback(async (query: string) => {
    if (!query) return;
    setLoading(true);
    setWordData(null);
    setNotFound(false);

    try {
      // Tìm exact match trước
      const results = await searchWords(query, 1);
      if (results.length === 0) {
        setNotFound(true);
        return;
      }
      const detail = await getWordDetail(results[0].id);
      if (!detail) { setNotFound(true); return; }

      setWordData(detail as WordData);

      // Kiểm tra đã lưu chưa
      const alreadySaved = await isSavedInVault(detail.id);
      setSaved(alreadySaved);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveVault = useCallback(async () => {
    if (!wordData || saved || savingVault) return;
    setSavingVault(true);
    try {
      await addToVault(wordData.id);
      setSaved(true);
    } finally {
      setSavingVault(false);
    }
  }, [wordData, saved, savingVault]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={hide}>
      {/* Backdrop */}
      <TouchableWithoutFeedback onPress={hide}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        {/* Handle bar */}
        <View style={styles.handle} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.queryWord} numberOfLines={1}>{word}</Text>
          <TouchableOpacity onPress={hide} style={styles.closeBtn}>
            <FontAwesome name="times" size={18} color={colors.outline} />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
          showsVerticalScrollIndicator={false}
        >
          {loading && (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Đang tra từ...</Text>
            </View>
          )}

          {notFound && !loading && (
            <View style={styles.center}>
              <FontAwesome name="search" size={32} color={colors.outlineVariant} />
              <Text style={styles.notFoundText}>Không tìm thấy "{word}"</Text>
              <Text style={styles.notFoundSub}>Thử kiểm tra lại chính tả</Text>
            </View>
          )}

          {wordData && !loading && (
            <>
              {/* Word + IPA + TTS */}
              <View style={styles.wordRow}>
                <View style={styles.wordInfo}>
                  <Text style={styles.wordText}>{wordData.word}</Text>
                  {wordData.pronunciation ? (
                    <Text style={styles.ipaText}>/{wordData.pronunciation}/</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.ttsBtn}
                  onPress={() => speak(wordData.word)}
                >
                  <FontAwesome name="volume-up" size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>

              {/* Part of speech */}
              {wordData.part_of_speech ? (
                <View style={styles.posChip}>
                  <Text style={styles.posText}>{wordData.part_of_speech}</Text>
                </View>
              ) : null}

              {/* Definitions */}
              <View style={styles.defBlock}>
                <Text style={styles.defLabel}>ĐỊNH NGHĨA</Text>
                {wordData.definition ? (
                  <Text style={styles.defEn}>{wordData.definition}</Text>
                ) : null}
                <Text style={styles.defVi}>{wordData.definition_vi}</Text>
              </View>

              {/* Example */}
              {wordData.example ? (
                <View style={styles.exBlock}>
                  <Text style={styles.defLabel}>VÍ DỤ</Text>
                  <Text style={styles.exEn}>"{wordData.example}"</Text>
                  {wordData.example_vi ? (
                    <Text style={styles.exVi}>{wordData.example_vi}</Text>
                  ) : null}
                </View>
              ) : null}

              {/* Save to vault */}
              <TouchableOpacity
                style={[styles.vaultBtn, saved && styles.vaultBtnSaved]}
                onPress={handleSaveVault}
                disabled={saved || savingVault}
              >
                {savingVault ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <FontAwesome
                      name={saved ? 'bookmark' : 'bookmark-o'}
                      size={16}
                      color="#fff"
                    />
                    <Text style={styles.vaultBtnText}>
                      {saved ? 'Đã lưu vào Sổ tay' : 'Lưu vào Sổ tay'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.xl2,
    borderTopRightRadius: radius.xl2,
    ...shadow.card,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.outlineVariant,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  queryWord: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  bodyContent: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
  center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  loadingText: { fontSize: 14, color: colors.textSecondary },
  notFoundText: { fontSize: 16, fontWeight: '700', color: colors.text },
  notFoundSub: { fontSize: 13, color: colors.textMuted },

  wordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordInfo: { flex: 1, gap: 4 },
  wordText: { fontSize: 32, fontWeight: '800', color: colors.text },
  ipaText: { fontSize: 16, color: colors.primary, fontWeight: '500' },
  ttsBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primaryFixed,
    alignItems: 'center',
    justifyContent: 'center',
  },

  posChip: {
    alignSelf: 'flex-start',
    backgroundColor: colors.tertiaryFixed,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  posText: { fontSize: 12, fontWeight: '700', color: colors.tertiary },

  defBlock: { gap: spacing.xs },
  defLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.outline,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  defEn: { fontSize: 16, fontWeight: '600', color: colors.text, lineHeight: 24 },
  defVi: { fontSize: 15, color: colors.textSecondary, lineHeight: 22 },

  exBlock: { gap: spacing.xs },
  exEn: { fontSize: 15, color: colors.text, fontStyle: 'italic', lineHeight: 22 },
  exVi: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },

  vaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  vaultBtnSaved: { backgroundColor: colors.tertiary },
  vaultBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
