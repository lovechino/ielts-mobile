import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { AppHeader } from '@/components/ui/AppHeader';
import { colors, spacing, radius } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { useDictionaryStore } from '@/stores/useDictionaryStore';
import { GlassCard } from '@/components/ui/GlassCard';

export default function DictionaryScreen() {
  const router = useRouter();
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
      <AppHeader title="Từ điển & Sổ tay" />
      
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
                <View>
                  <Text style={styles.resultWord}>{item.word}</Text>
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
                <Text style={styles.resultWord}>{item.word}</Text>
                <FontAwesome name="history" size={14} color={colors.outline} />
              </TouchableOpacity>
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
  resultWord: { fontSize: 17, fontWeight: '600', color: colors.text },
  resultDef: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  
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
});
