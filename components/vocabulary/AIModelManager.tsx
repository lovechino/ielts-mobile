import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { colors, radius, spacing } from '@/theme/tokens';
import { AssetManager, AssetStatus } from '@/lib/offline/assetManager';

interface AIModelManagerProps {
  modelId: string;
  onStatusChange?: (status: AssetStatus) => void;
}

export function AIModelManager({ modelId, onStatusChange }: AIModelManagerProps) {
  const [status, setStatus] = useState<AssetStatus | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);

  const checkStatus = async () => {
    const s = await AssetManager.getStatus(modelId);
    setStatus(s);
    onStatusChange?.(s);
  };

  useEffect(() => {
    checkStatus();
  }, [modelId]);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      await AssetManager.downloadModel(modelId, (p) => setProgress(p));
      await checkStatus();
    } catch (e) {
      console.error('[AIModelManager] Download failed:', e);
    } finally {
      setDownloading(false);
      setProgress(0);
    }
  };

  if (!status) return null;

  if (downloading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.text}>{Math.round(progress * 100)}%</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      style={[styles.container, status.isDownloaded && styles.active]} 
      onPress={status.isDownloaded ? undefined : handleDownload}
    >
      <FontAwesome 
        name={status.isDownloaded ? 'check-circle' : 'download'} 
        size={14} 
        color={status.isDownloaded ? colors.tertiary : colors.primary} 
      />
      <Text style={[styles.text, status.isDownloaded && styles.activeText]}>
        {status.isDownloaded ? 'Offline AI' : 'Tải AI'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.border,
  },
  active: {
    backgroundColor: '#E6F7ED',
    borderColor: colors.tertiary,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  activeText: {
    color: colors.tertiary,
  },
});
