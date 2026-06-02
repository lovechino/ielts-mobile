import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { colors, spacing, radius } from '@/theme/tokens';
import { getAllVaultWords, getVaultGroups } from '@/lib/offline/dictionary';
import { FontAwesome } from '@expo/vector-icons';
import { GlassCard } from '@/components/ui/GlassCard';

export default function VaultScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [words, setWords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedGroup]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [groupList, wordList] = await Promise.all([
        getVaultGroups(),
        getAllVaultWords(selectedGroup || undefined)
      ]);
      setGroups([{ group_name: 'Tất cả', count: wordList.length }, ...groupList]);
      setWords(wordList);
    } catch (error) {
      console.error('Load vault error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'mastered': return '#4CAF50';
      case 'learning': return colors.primary;
      default: return colors.outline;
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sổ tay từ vựng</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {groups.map((group) => (
            <TouchableOpacity
              key={group.group_name}
              style={[
                styles.filterChip,
                (selectedGroup === group.group_name || (group.group_name === 'Tất cả' && !selectedGroup)) && styles.filterChipActive
              ]}
              onPress={() => setSelectedGroup(group.group_name === 'Tất cả' ? null : group.group_name)}
            >
              <Text style={[
                styles.filterText,
                (selectedGroup === group.group_name || (group.group_name === 'Tất cả' && !selectedGroup)) && styles.filterTextActive
              ]}>
                {group.group_name} ({group.count})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.wordList} showsVerticalScrollIndicator={false}>
          {words.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="bookmark-o" size={60} color={colors.border} />
              <Text style={styles.emptyText}>Chưa có từ vựng nào trong bảng này.</Text>
            </View>
          ) : (
            words.map((item) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.wordCard}
                onPress={() => router.push(`/vocabulary/${item.id}`)}
              >
                <View style={styles.wordInfo}>
                  <Text style={styles.wordName}>{item.word}</Text>
                  <Text style={styles.wordDef} numberOfLines={1}>{item.definition_vi}</Text>
                </View>
                <View style={styles.wordMeta}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
                      {item.status.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.groupLabel}>#{item.group_name}</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color={colors.border} />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
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
    paddingBottom: spacing.sm,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
  
  filterSection: { paddingVertical: spacing.md },
  filterScroll: { paddingHorizontal: spacing.md, gap: spacing.sm },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  filterTextActive: { color: '#fff' },

  wordList: { padding: spacing.md, gap: spacing.sm },
  wordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  wordInfo: { flex: 1, gap: 4 },
  wordName: { fontSize: 18, fontWeight: '700', color: colors.text },
  wordDef: { fontSize: 14, color: colors.textSecondary },
  wordMeta: { alignItems: 'flex-end', gap: 4 },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: { fontSize: 10, fontWeight: '800' },
  groupLabel: { fontSize: 11, color: colors.outline, fontWeight: '500' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: spacing.md },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 40 },
});
