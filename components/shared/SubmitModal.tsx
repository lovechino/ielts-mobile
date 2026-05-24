import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useTestStore } from '@/stores/useTestStore';
import { FontAwesome } from '@expo/vector-icons';

interface SubmitModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function SubmitModal({ visible, onClose, onConfirm }: SubmitModalProps) {
  const { getAnsweredCount, getTotalCount } = useTestStore();
  const answered = getAnsweredCount();
  const total = getTotalCount();
  const unanswered = total - answered;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <FontAwesome name="check-circle" size={48} color={colors.tertiary} style={{ marginBottom: spacing.md }} />
          <Text style={styles.title}>Submit Test?</Text>
          <Text style={styles.summary}>
            You answered {answered} of {total} questions.
          </Text>
          {unanswered > 0 && (
            <Text style={styles.warning}>⚠ {unanswered} question{unanswered > 1 ? 's' : ''} left unanswered.</Text>
          )}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Review</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={onConfirm}>
              <Text style={styles.submitText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: spacing.lg,
  },
  card: {
    backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.lg,
    width: '100%', maxWidth: 340, alignItems: 'center', ...shadow.card,
  },
  title: { fontSize: 20, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  summary: { fontSize: 15, color: colors.textSecondary, textAlign: 'center' },
  warning: { fontSize: 14, color: colors.secondary, marginTop: spacing.sm, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.lg, width: '100%' },
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, alignItems: 'center',
  },
  cancelText: { fontSize: 15, fontWeight: '600', color: colors.text },
  submitBtn: {
    flex: 1, padding: spacing.md, borderRadius: radius.md,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  submitText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
