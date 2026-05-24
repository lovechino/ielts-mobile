import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '@/theme/tokens';

type Props = {
  status?: string;
  progress?: number;
  sizeKb?: number;
  onDownload: () => void;
  onDelete: () => void;
};

export function DownloadButton({ status, progress, sizeKb, onDownload, onDelete }: Props) {
  if (status === 'downloading') {
    return (
      <View style={styles.row}>
        <ActivityIndicator size="small" color={colors.accent} />
        <Text style={styles.text}>Đang tải xuống... {progress ?? 0}%</Text>
      </View>
    );
  }

  if (status === 'done') {
    return (
      <Pressable onPress={onDelete} style={styles.row}>
        <Text style={styles.doneIcon}>✓</Text>
        <Text style={styles.text}>Đã tải xuống{sizeKb ? ` (${sizeKb} KB)` : ''}</Text>
        <Text style={styles.deleteText}>Xoá</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onDownload} style={styles.row}>
      <Text style={styles.downloadIcon}>↓</Text>
      <Text style={styles.text}>Tải xuống để học offline</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  text: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  deleteText: { fontSize: 13, color: colors.error, fontWeight: '600', marginLeft: 'auto' },
  doneIcon: { fontSize: 16, color: colors.success },
  downloadIcon: { fontSize: 16, color: colors.accent },
});
