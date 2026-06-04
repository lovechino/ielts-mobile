import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, Modal, KeyboardAvoidingView, Platform
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { Screen } from '@/components/ui/Screen';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { addCustomWordToVault, searchWords, getWordDetail } from '@/lib/offline/dictionary';
import { useRouter } from 'expo-router';

export default function AddCustomWordScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const [formData, setFormData] = useState({
    word: '',
    definition: '',
    definition_vi: '',
    pronunciation: '',
    part_of_speech: '',
    example: '',
    example_vi: '',
    group_name: 'My Course'
  });

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, []);

  // Tìm kiếm gợi ý với Debounce 300ms
  const handleWordChange = (text: string) => {
    setFormData(f => ({ ...f, word: text }));
    
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    
    if (text.trim().length > 1) {
      searchTimeout.current = setTimeout(async () => {
        try {
          const results = await searchWords(text.trim(), 5);
          setSuggestions(results);
        } catch (e) {
          setSuggestions([]);
        }
      }, 300);
    } else {
      setSuggestions([]);
    }
  };

  // Tự động điền khi chọn gợi ý
  const handleSelectSuggestion = async (id: number) => {
    setLoading(true);
    setSuggestions([]); // Ẩn ngay lập tức
    try {
      const detail = await getWordDetail(id);
      if (detail) {
        setFormData(f => ({
          ...f,
          word: detail.word,
          definition: detail.definition || '',
          definition_vi: detail.definition_vi || '',
          pronunciation: detail.pronunciation || '',
          part_of_speech: detail.part_of_speech || '',
          example: detail.example || '',
          example_vi: detail.example_vi || ''
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.word || !formData.definition_vi) {
      alert('Vui lòng nhập ít nhất "Từ vựng" và "Nghĩa tiếng Việt"');
      return;
    }

    setLoading(true);
    try {
      const id = await addCustomWordToVault(formData);
      if (id) {
        alert('Đã thêm từ vựng thành công!');
        router.back();
      }
    } catch (e) {
      console.error(e);
      alert('Có lỗi xảy ra khi lưu từ vựng.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="times" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Thêm từ vựng mới</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.saveBtnText}>Lưu</Text>
          )}
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Từ vựng (Tiếng Anh) *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Resilient"
              value={formData.word}
              onChangeText={handleWordChange}
              autoFocus
            />
            {suggestions.length > 0 && (
              <View style={styles.suggestionBox}>
                {suggestions.map((s) => (
                  <TouchableOpacity 
                    key={s.id} 
                    style={styles.suggestionItem}
                    onPress={() => handleSelectSuggestion(s.id)}
                  >
                    <Text style={styles.suggestionWord}>{s.word}</Text>
                    <Text style={styles.suggestionDef} numberOfLines={1}>{s.definition_vi}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Phiên âm</Text>
              <TextInput
                style={styles.input}
                placeholder="/rɪˈzɪliənt/"
                value={formData.pronunciation}
                onChangeText={(t) => setFormData(f => ({ ...f, pronunciation: t }))}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>Từ loại</Text>
              <TextInput
                style={styles.input}
                placeholder="adj, n, v..."
                value={formData.part_of_speech}
                onChangeText={(t) => setFormData(f => ({ ...f, part_of_speech: t }))}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nghĩa tiếng Việt *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Kiên cường, mau phục hồi..."
              multiline
              numberOfLines={2}
              value={formData.definition_vi}
              onChangeText={(t) => setFormData(f => ({ ...f, definition_vi: t }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Định nghĩa (Tiếng Anh)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Able to withstand or recover quickly from difficult conditions."
              multiline
              numberOfLines={3}
              value={formData.definition}
              onChangeText={(t) => setFormData(f => ({ ...f, definition: t }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Ví dụ</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="He is a resilient person."
              multiline
              numberOfLines={2}
              value={formData.example}
              onChangeText={(t) => setFormData(f => ({ ...f, example: t }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Lộ trình / Nhóm</Text>
            <TextInput
              style={styles.input}
              placeholder="Ví dụ: Lộ trình của tôi"
              value={formData.group_name}
              onChangeText={(t) => setFormData(f => ({ ...f, group_name: t }))}
            />
          </View>
          
          <TouchableOpacity style={styles.mainSaveBtn} onPress={handleSave} disabled={loading}>
             {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.mainSaveBtnText}>Thêm vào lộ trình</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.unit * 10,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '700', color: colors.text },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  
  content: { padding: spacing.lg, gap: spacing.md },
  inputGroup: { gap: spacing.xs, marginBottom: spacing.sm },
  inputRow: { flexDirection: 'row', gap: spacing.md },
  label: { fontSize: 13, fontWeight: '700', color: colors.textSecondary, marginLeft: 2 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  mainSaveBtn: {
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
  },
  mainSaveBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  suggestionBox: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    marginTop: 2,
    maxHeight: 200,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 10,
  },
  suggestionItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f2f6',
  },
  suggestionWord: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  suggestionDef: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
});
