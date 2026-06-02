import { View, ScrollView, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Platform, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { getWordDetail, addToVault, removeFromVault, isSavedInVault, updateCustomWord, deleteCustomWord } from '@/lib/offline/dictionary';
import { useTTS } from '@/hooks/useTTS';
import { GlassCard } from '@/components/ui/GlassCard';

export default function WordDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [word, setWord] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const { speak, isSpeaking } = useTTS();

  // Edit State
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    if (!id) return;
    setLoading(true);
    const vocabId = parseInt(id);
    const [data, savedStatus] = await Promise.all([
      getWordDetail(vocabId),
      isSavedInVault(vocabId)
    ]);
    setWord(data);
    setIsSaved(savedStatus);
    setEditData(data);
    setLoading(false);
  }

  const handleToggleSave = async () => {
    if (isSaved) {
      await removeFromVault(word.id);
      setIsSaved(false);
    } else {
      Alert.prompt(
        'Lưu vào sổ tay',
        'Nhập tên bảng từ vựng (ví dụ: IELTS, TOEIC...)',
        [
          { text: 'Hủy', style: 'cancel' },
          { 
            text: 'Lưu', 
            onPress: async (groupName) => {
              await addToVault(word.id, groupName || 'General');
              setIsSaved(true);
            }
          }
        ],
        'plain-text',
        'General'
      );
    }
  };

  const handleUpdate = async () => {
    if (!editData.word || !editData.definition_vi) return;
    try {
      await updateCustomWord(word.id, editData);
      setIsEditModalVisible(false);
      loadData();
    } catch (e: any) {
      Alert.alert('Lỗi', e.message);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc muốn xóa từ vựng này khỏi hệ thống không?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            await deleteCustomWord(word.id);
            router.back();
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <Screen>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </Screen>
    );
  }

  if (!word) {
    return (
      <Screen>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không tìm thấy từ vựng này.</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </Screen>
    );
  }

  const isUserWord = word.topic === 'User-Added';

  return (
    <Screen>
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerRight}>
          {isUserWord && (
            <>
              <TouchableOpacity onPress={() => setIsEditModalVisible(true)} style={styles.iconBtn}>
                <FontAwesome name="edit" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
                <FontAwesome name="trash" size={20} color="#ff4757" />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity onPress={handleToggleSave} style={styles.iconBtn}>
            <FontAwesome 
              name={isSaved ? "bookmark" : "bookmark-o"} 
              size={22} 
              color={isSaved ? colors.primary : colors.text} 
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Word Card */}
        <View style={styles.wordHero}>
          <Text style={styles.wordTitle}>{word.word}</Text>
          <View style={styles.pronounceRow}>
            <Text style={styles.ipa}>{word.pronunciation}</Text>
            <TouchableOpacity 
              style={[styles.audioBtn, isSpeaking && styles.audioBtnActive]} 
              onPress={() => speak(word.word)}
              disabled={isSpeaking}
            >
              <FontAwesome name="volume-up" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.posBadge}>
            <Text style={styles.posText}>{word.part_of_speech?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Definitions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Định nghĩa</Text>
          <GlassCard style={styles.defCard}>
            <Text style={styles.defEn}>{word.definition}</Text>
            <View style={styles.divider} />
            <Text style={styles.defVi}>{word.definition_vi}</Text>
          </GlassCard>
        </View>

        {/* Examples */}
        {word.example && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ví dụ</Text>
            <View style={styles.exampleCard}>
              <View style={styles.exampleLine} />
              <View style={{ flex: 1 }}>
                <Text style={styles.exEn}>{word.example}</Text>
                <Text style={styles.exVi}>{word.example_vi}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.mainActionBtn, isSaved && styles.mainActionBtnSaved]} 
          onPress={handleToggleSave}
        >
          <FontAwesome name={isSaved ? "check" : "plus"} size={16} color="#fff" style={{ marginRight: 8 }} />
          <Text style={styles.mainActionText}>
            {isSaved ? "Đã lưu vào sổ tay" : "Lưu vào sổ tay"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Edit Modal */}
      <Modal visible={isEditModalVisible} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa từ vựng</Text>
              <TouchableOpacity onPress={() => setIsEditModalVisible(false)}>
                <FontAwesome name="times" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Từ vựng *</Text>
                <TextInput style={styles.input} value={editData?.word} onChangeText={t => setEditData((f: any) => ({ ...f, word: t }))} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nghĩa tiếng Việt *</Text>
                <TextInput style={[styles.input, { minHeight: 60 }]} multiline value={editData?.definition_vi} onChangeText={t => setEditData((f: any) => ({ ...f, definition_vi: t }))} />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ví dụ</Text>
                <TextInput style={[styles.input, { minHeight: 60 }]} multiline value={editData?.example} onChangeText={t => setEditData((f: any) => ({ ...f, example: t }))} />
              </View>
              
              <TouchableOpacity style={styles.saveBtn} onPress={handleUpdate}>
                <Text style={styles.saveBtnText}>Cập nhật</Text>
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.unit * 10,
    paddingBottom: spacing.sm,
  },
  headerRight: { flexDirection: 'row', gap: spacing.sm },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  content: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  wordHero: { alignItems: 'center', gap: spacing.sm },
  wordTitle: { fontSize: 42, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
  pronounceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  ipa: { fontSize: 20, color: colors.primary, fontWeight: '600', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  audioBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  audioBtnActive: { opacity: 0.6 },
  posBadge: {
    backgroundColor: colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: spacing.xs,
  },
  posText: { fontSize: 12, fontWeight: '700', color: colors.primary },

  section: { gap: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginLeft: 4 },
  defCard: { padding: spacing.lg, borderRadius: radius.xl, gap: spacing.md },
  defEn: { fontSize: 17, color: colors.text, lineHeight: 26, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.border, opacity: 0.5 },
  defVi: { fontSize: 16, color: colors.textSecondary, lineHeight: 24 },

  exampleCard: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: 4 },
  exampleLine: { width: 4, backgroundColor: colors.secondary, borderRadius: 2, opacity: 0.3 },
  exEn: { fontSize: 16, color: colors.text, fontStyle: 'italic', lineHeight: 24 },
  exVi: { fontSize: 14, color: colors.textSecondary, marginTop: 4, lineHeight: 20 },

  mainActionBtn: {
    flexDirection: 'row',
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  mainActionBtnSaved: { backgroundColor: colors.secondary },
  mainActionText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  errorText: { fontSize: 16, color: colors.textSecondary },
  backBtn: { padding: spacing.md, backgroundColor: colors.primary, borderRadius: radius.md },
  backBtnText: { color: '#fff', fontWeight: '600' },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', height: '80%', borderTopLeftRadius: radius.xl2, borderTopRightRadius: radius.xl2 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.border },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  inputGroup: { gap: spacing.xs, marginBottom: spacing.md },
  inputLabel: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  input: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, fontSize: 16 },
  saveBtn: { backgroundColor: colors.primary, padding: spacing.md, borderRadius: radius.lg, alignItems: 'center', marginTop: spacing.md },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
