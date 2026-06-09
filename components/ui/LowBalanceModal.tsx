import React from 'react';
import { StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing, shadow } from '@/theme/tokens';
import { useUIStore } from '@/stores/useUIStore';
import { useRouter } from 'expo-router';
import { GlassCard } from './GlassCard';

export function LowBalanceModal() {
  const router = useRouter();
  const isOpen = useUIStore((s) => s.modals.lowBalance);
  const hideModal = useUIStore((s) => s.hideModal);

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={() => hideModal('lowBalance')}
    >
      <View style={styles.overlay}>
        <GlassCard style={styles.content}>
          <View style={styles.header}>
             <View style={styles.iconCircle}>
                <FontAwesome name="database" size={32} color="#FF7675" />
                <View style={styles.cross}>
                   <FontAwesome name="close" size={14} color="#fff" />
                </View>
             </View>
          </View>
          
          <Text style={styles.title}>Ồ, chưa đủ xu rồi!</Text>
          <Text style={styles.description}>
            Bạn cần tích lũy thêm xu để sở hữu vật phẩm này. Hãy hoàn thành các bài học hoặc thử thách hàng ngày nhé.
          </Text>

          <TouchableOpacity 
            style={styles.primaryBtn}
            onPress={() => {
              hideModal('lowBalance');
              router.push('/(tabs)');
            }}
          >
            <Text style={styles.primaryBtnText}>Đi học ngay</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.secondaryBtn}
            onPress={() => hideModal('lowBalance')}
          >
            <Text style={styles.secondaryBtnText}>Để sau</Text>
          </TouchableOpacity>
        </GlassCard>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  content: {
    width: '100%',
    padding: spacing.xl,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFEAA7',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  cross: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FF7675',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
    ...shadow.md,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    width: '100%',
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: colors.outline,
    fontSize: 14,
    fontWeight: '600',
  },
});
