import { View, Text, StyleSheet, FlatList, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { colors, spacing, radius } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { useDictionaryStore } from '@/stores/useDictionaryStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { GlassCard } from '@/components/ui/GlassCard';

const getLevelColor = (level: string) => {
  switch (level?.toUpperCase()) {
    case 'A1': return '#4cd137';
    case 'A2': return '#44bd32';
    case 'B1': return '#fbc531';
    case 'B2': return '#e1b12c';
    case 'C1': return '#e84118';
    case 'C2': return '#c23616';
    default: return colors.outline;
  }
};

export default function DictionaryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { 
    searchQuery, 
    setSearchQuery, 
    performSearch, 
    searchResults, 
    isLoading,
    recentSearches,
    selectWord,
    vaultLearningCount,
    vaultMasteredCount,
    loadVaultCounts,
  } = useDictionaryStore();

  useEffect(() => {
    loadVaultCounts();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    performSearch(text);
  };

  return (
    <Screen>
      <AppHeader 
        title="Từ điển & Sổ tay" 
        avatarUri={user?.avatar_url || undefined}
        avatarFrame={user?.avatar_frame}
      />
      
      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <FontAwesome name="search" size={18} color={colors.outline} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tra cứu 100,000 từ vựng..."
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor={colors.outline}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <FontAwesome name="times-circle" size={18} color={colors.outline} />
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : searchQuery.length > 0 ? (
          /* Search Results */
          <FlatList
            data={searchResults}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.resultItem}
                onPress={() => {
                  selectWord(item.id);
                  router.push(`/vocabulary/${item.id}`);
                }}
              >
                <View style={{ flex: 1 }}>
                  <View style={styles.resultHeader}>
                    <Text style={styles.resultWord}>{item.word}</Text>
                    {item.level && (
                      <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level) }]}>
                        <Text style={styles.levelText}>{item.level}</Text>
                      </View>
                    )}
                    {item.is_academic === 1 && (
                      <View style={styles.academicBadge}>
                        <Text style={styles.academicText}>IELTS</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.resultDef} numberOfLines={1}>{item.definition_vi}</Text>
                </View>
                <FontAwesome name="chevron-right" size={14} color={colors.outline} />
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.listContent}
          />
        ) : (
          /* History & Vault Summary */
          <FlatList
            ListHeaderComponent={() => (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Sổ tay của tôi</Text>
                </View>
                <View style={styles.vaultGrid}>
                  <TouchableOpacity style={[styles.vaultCard, { backgroundColor: '#E1F5FE' }]} onPress={() => router.push('/vocabulary/vault')}>
                    <Text style={styles.vaultCount}>{vaultLearningCount}</Text>
                    <Text style={styles.vaultLabel}>Đang học</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.vaultCard, { backgroundColor: '#E8F5E9' }]} onPress={() => router.push('/vocabulary/vault')}>
                    <Text style={styles.vaultCount}>{vaultMasteredCount}</Text>
                    <Text style={styles.vaultLabel}>Đã thuộc</Text>
                  </TouchableOpacity>
                </View>

                {recentSearches.length > 0 && (
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
                  </View>
                )}
              </>
            )}
            data={recentSearches}
            keyExtractor={(item) => `recent-${item.id}`}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.resultItem}
                onPress={() => {
                  selectWord(item.id);
                  router.push(`/vocabulary/${item.id}`);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Text style={styles.resultWord}>{item.word}</Text>
                  {item.level && (
                    <View style={[styles.levelBadge, { backgroundColor: getLevelColor(item.level), paddingHorizontal: 6, height: 18 }]}>
                      <Text style={[styles.levelText, { fontSize: 8 }]}>{item.level}</Text>
                    </View>
                  )}
                </View>
                <FontAwesome name="history" size={14} color={colors.outline} />
              </TouchableOpacity>
            )}
            ListFooterComponent={() => (
              <View style={{ marginTop: spacing.xl, gap: spacing.lg }}>
                {/* Học theo trình độ */}
                <View>
                  <Text style={styles.sectionTitle}>Lộ trình theo trình độ</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                    {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((lvl) => (
                      <TouchableOpacity 
                        key={lvl} 
                        style={[styles.levelCard, { borderLeftColor: getLevelColor(lvl) }]}
                        onPress={() => router.push(`/vocabulary/words?groupBy=level&groupValue=${lvl}`)}
                      >
                        <Text style={[styles.levelCardTitle, { color: getLevelColor(lvl) }]}>{lvl}</Text>
                        <Text style={styles.levelCardSub}>Level {lvl}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Chủ đề phổ biến */}
                <View>
                  <Text style={styles.sectionTitle}>Chủ đề phổ biến</Text>
                  <View style={styles.topicGrid}>
                    {[
                      { name: 'Environment', icon: 'leaf', color: '#27ae60' },
                      { name: 'Education', icon: 'book', color: '#2980b9' },
                      { name: 'Technology', icon: 'laptop', color: '#8e44ad' },
                      { name: 'Health', icon: 'heartbeat', color: '#c0392b' },
                      { name: 'Society', icon: 'users', color: '#f39c12' },
                      { name: 'Work', icon: 'briefcase', color: '#34495e' },
                    ].map((topic) => (
                      <TouchableOpacity 
                        key={topic.name} 
                        style={styles.topicCard}
                        onPress={() => router.push(`/vocabulary/words?groupBy=topic&groupValue=${topic.name}`)}
                      >
                        <View style={[styles.topicIcon, { backgroundColor: topic.color + '15' }]}>
                          <FontAwesome name={topic.icon as any} size={18} color={topic.color} />
                        </View>
                        <Text style={styles.topicName}>{topic.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  listContent: { paddingBottom: spacing.xxl },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  resultWord: { fontSize: 17, fontWeight: '600', color: colors.text },
  resultDef: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  
  levelBadge: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 4,
    justifyContent: 'center',
  },
  levelText: { color: '#fff', fontSize: 10, fontWeight: '800' },
  academicBadge: {
    backgroundColor: '#34495e',
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 4,
    justifyContent: 'center',
  },
  academicText: { color: '#fff', fontSize: 8, fontWeight: '800' },

  sectionHeader: { marginTop: spacing.lg, marginBottom: spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  
  vaultGrid: { flexDirection: 'row', gap: spacing.md },
  vaultCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  vaultCount: { fontSize: 24, fontWeight: '800', color: colors.text },
  vaultLabel: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },

  horizontalScroll: { gap: spacing.md, paddingVertical: spacing.sm },
  levelCard: {
    backgroundColor: '#fff',
    width: 100,
    padding: spacing.md,
    borderRadius: radius.md,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  levelCardTitle: { fontSize: 20, fontWeight: '800' },
  levelCardSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginTop: spacing.sm },
  topicCard: {
    width: '30%',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  topicIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicName: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
});
