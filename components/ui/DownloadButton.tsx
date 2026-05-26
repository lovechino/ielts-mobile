import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing } from '@/theme/tokens';

type Props = {
  status: 'idle' | 'downloading' | 'cached' | 'error';
  sizeKb?: number;
  onDownload: () => void;
  onDelete: () => void;
};

export function DownloadButton({ status, sizeKb, onDownload, onDelete }: Props) {
  if (status === 'downloading') {
    return (
      <View style={styles.row}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.text}>Đang tải xuống...</Text>
      </View>
    );
  }

  if (status === 'cached') {
    return (
      <Pressable onPress={onDelete} style={styles.row}>
        <FontAwesome name="check-circle" size={16} color={colors.success} />
        <Text style={styles.text}>Đã tải xuống{sizeKb ? ` (${sizeKb} KB)` : ''}</Text>
        <Text style={styles.deleteText}>Xoá</Text>
      </Pressable>
    );
  }

  if (status === 'error') {
    return (
      <Pressable onPress={onDownload} style={styles.row}>
        <FontAwesome name="exclamation-circle" size={16} color={colors.error} />
        <Text style={styles.text}>Tải thất bại, thử lại</Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onDownload} style={styles.row}>
      <FontAwesome name="arrow-circle-down" size={16} color={colors.primary} />
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
