import React from 'react';
import { View, Text, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';
import { useDownloadStore } from '@/stores/useDownloadStore';

export const DictionaryDownloadModal: React.FC = () => {
  const { isDownloading, progress, status, error } = useDownloadStore();

  if (!isDownloading && status !== 'error' && status !== 'extracting') return null;

  const getStatusText = () => {
    switch (status) {
      case 'downloading': return `Đang tải dữ liệu học tập... ${Math.round(progress * 100)}%`;
      case 'extracting': return 'Đang tối ưu hóa dữ liệu...';
      case 'error': return 'Có lỗi xảy ra khi tải dữ log. Vui lòng thử lại.';
      default: return '';
    }
  };

  return (
    <Modal transparent visible={true} animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Chuẩn bị vũ trụ học tập</Text>
          <Text style={styles.subtitle}>Chúng tôi đang tải 100,000 từ vựng để bạn có thể học Offline mọi lúc mọi nơi.</Text>
          
          <View style={styles.progressContainer}>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
            </View>
            <Text style={styles.statusText}>{getStatusText()}</Text>
          </View>

          {status === 'downloading' && (
            <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 10 }} />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: radius.xl2,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center' },
  subtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  progressContainer: { width: '100%', marginTop: spacing.lg, gap: 8 },
  progressBarBg: { width: '100%', height: 10, backgroundColor: '#f0f0f0', borderRadius: 5, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: colors.primary },
  statusText: { fontSize: 12, color: colors.outline, fontWeight: '600', textAlign: 'center' },
});
