import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet } from 'react-native';
import { colors, radius, spacing, shadow } from '@/theme/tokens';

interface MatchOption {
  id: string;
  text: string;
}

interface MatchDropdownProps {
  options: MatchOption[];
  selected: string;
  onSelect: (value: string) => void;
  usedOptions?: string[];
  placeholder?: string;
}

export function MatchDropdown({ options, selected, onSelect, usedOptions = [], placeholder = 'Select' }: MatchDropdownProps) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((o) => o.id === selected)?.text || '';

  return (
    <View>
      <TouchableOpacity style={styles.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={[styles.triggerText, !selected && styles.placeholder]}>
          {selected ? selectedLabel.substring(0, 40) : placeholder}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade">
        <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>Select an option</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = selected === item.id;
                const isUsed = usedOptions.includes(item.id);
                return (
                  <TouchableOpacity
                    style={[styles.optionRow, isSelected && styles.optionRowActive]}
                    onPress={() => { onSelect(item.id); setOpen(false); }}
                    disabled={false}
                  >
                    <View style={styles.optionId}>
                      <Text style={[styles.optionIdText, isSelected && { color: '#fff' }]}>{item.id}</Text>
                    </View>
                    <Text style={[styles.optionText, isSelected && { fontWeight: '700' }]}>{item.text}</Text>
                    {isUsed && !isSelected ? <Text style={styles.usedBadge}>(used)</Text> : null}
                  </TouchableOpacity>
                );
              }}
              style={{ maxHeight: 300 }}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: spacing.sm, paddingVertical: 6,
    borderRadius: radius.sm, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: '#fff', minWidth: 100,
  },
  triggerText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.text },
  placeholder: { color: colors.textMuted, fontWeight: '400' },
  arrow: { fontSize: 10, color: colors.textMuted },
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end', padding: spacing.md,
  },
  sheet: {
    backgroundColor: '#fff', borderRadius: radius.xl,
    padding: spacing.md, maxHeight: '60%', ...shadow.card,
  },
  sheetTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  optionRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm,
    padding: spacing.sm, borderRadius: radius.sm,
    borderBottomWidth: 1, borderBottomColor: colors.surfaceContainerHigh,
  },
  optionRowActive: { backgroundColor: colors.primary },
  optionId: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center', justifyContent: 'center',
  },
  optionIdText: { fontSize: 13, fontWeight: '700', color: colors.textSecondary },
  optionText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  usedBadge: { fontSize: 11, color: colors.secondary, fontWeight: '600' },
  closeBtn: {
    marginTop: spacing.sm, padding: spacing.sm,
    alignItems: 'center', borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
  },
  closeText: { fontSize: 15, fontWeight: '600', color: colors.text },
});
