import { useEffect, useState, useRef } from 'react';
import { Text, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '@/theme/tokens';

interface AutoSaveIndicatorProps {
  lastSavedAt: number | null;
  isSaving?: boolean;
}

export function AutoSaveIndicator({ lastSavedAt, isSaving }: AutoSaveIndicatorProps) {
  const [label, setLabel] = useState('');

  useEffect(() => {
    if (isSaving) { setLabel('Saving...'); return; }
    if (!lastSavedAt) { setLabel(''); return; }

    const update = () => {
      const sec = Math.floor((Date.now() - lastSavedAt) / 1000);
      setLabel(sec < 2 ? 'Saved' : `Saved ${sec}s ago`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [lastSavedAt, isSaving]);

  if (!label) return null;

  return (
    <Text style={[styles.text, isSaving && styles.saving]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: { fontSize: 11, fontWeight: '600', color: colors.tertiary, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm, backgroundColor: colors.tertiaryFixed },
  saving: { color: colors.secondary, backgroundColor: colors.secondaryFixedDim },
});
