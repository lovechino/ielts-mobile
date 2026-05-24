import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { useState } from 'react';
import { colors, radius, spacing } from '@/theme/tokens';

interface MapMarkerPinProps {
  markerId: string;
  x: number;
  y: number;
  isAnswered: boolean;
  selectedValue: string;
  options: Array<{ id: string; text: string }>;
  onSelect: (value: string) => void;
  isActive?: boolean;
}

export function MapMarkerPin({ markerId, x, y, isAnswered, selectedValue, options, onSelect, isActive }: MapMarkerPinProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[
          styles.pin,
          { left: `${x * 100}%`, top: `${y * 100}%` },
          isAnswered && styles.pinAnswered,
          isActive && styles.pinActive,
        ]}
        onPress={() => setOpen(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.pinText, isAnswered && styles.pinTextAnswered]}>{markerId}</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select for {markerId}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, selectedValue === item.id && styles.optionSelected]}
                  onPress={() => { onSelect(item.id); setOpen(false); }}
                >
                  <Text style={[styles.optionText, selectedValue === item.id && { fontWeight: '700' }]}>
                    {item.id}. {item.text}
                  </Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 250 }}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  pin: {
    position: 'absolute', width: 30, height: 30, borderRadius: 15,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    transform: [{ translateX: -15 }, { translateY: -15 }],
  },
  pinAnswered: { backgroundColor: colors.tertiary, borderColor: colors.tertiaryContainer },
  pinActive: { shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12, elevation: 6 },
  pinText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  pinTextAnswered: { color: '#fff' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end', padding: spacing.md },
  sheet: { backgroundColor: '#fff', borderRadius: radius.xl, padding: spacing.md, maxHeight: '50%' },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  option: { padding: spacing.sm, borderRadius: radius.sm, borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHigh },
  optionSelected: { backgroundColor: colors.primaryFixed },
  optionText: { fontSize: 14, color: colors.text },
  closeBtn: { marginTop: spacing.sm, padding: spacing.sm, alignItems: 'center', borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  closeText: { fontSize: 15, fontWeight: '600', color: colors.text },
});
