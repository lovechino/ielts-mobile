import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  interpolate, 
  Extrapolate 
} from 'react-native-reanimated';
import { FontAwesome } from '@expo/vector-icons';
import { colors, spacing, radius } from '@/theme/tokens';
import { useTTS } from '@/hooks/useTTS';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.xl * 2;
const CARD_HEIGHT = 400;

interface FlashcardProps {
  word: string;
  ipa?: string;
  definition: string;
  definition_vi: string;
  example?: string;
  example_vi?: string;
}

export const FlashcardPro: React.FC<FlashcardProps> = ({ 
  word, ipa, definition, definition_vi, example, example_vi 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const spin = useSharedValue(0);
  const { speak } = useTTS();

  const handleFlip = () => {
    spin.value = withSpring(isFlipped ? 0 : 180, { damping: 15 });
    setIsFlipped(!isFlipped);
  };

  const frontAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(spin.value, [0, 180], [0, 180], Extrapolate.CLAMP);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      zIndex: spin.value <= 90 ? 1 : 0,
      opacity: spin.value <= 90 ? 1 : 0,
    };
  });

  const backAnimatedStyle = useAnimatedStyle(() => {
    const rotateValue = interpolate(spin.value, [0, 180], [180, 360], Extrapolate.CLAMP);
    return {
      transform: [{ rotateY: `${rotateValue}deg` }],
      zIndex: spin.value > 90 ? 1 : 0,
      opacity: spin.value > 90 ? 1 : 0,
    };
  });

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={1} onPress={handleFlip} style={styles.cardWrapper}>
        {/* Front Side */}
        <Animated.View style={[styles.card, styles.cardFront, frontAnimatedStyle]}>
          <Text style={styles.wordText}>{word}</Text>
          <Text style={styles.ipaText}>{ipa}</Text>
          <TouchableOpacity 
            style={styles.speakerBtn} 
            onPress={(e) => { e.stopPropagation(); speak(word); }}
          >
            <FontAwesome name="volume-up" size={32} color={colors.primary} />
          </TouchableOpacity>
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Chạm để xem nghĩa</Text>
            <FontAwesome name="refresh" size={14} color={colors.outline} />
          </View>
        </Animated.View>

        {/* Back Side */}
        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          <View style={styles.backContent}>
            <Text style={styles.defLabel}>ĐỊNH NGHĨA</Text>
            <Text style={styles.defEn}>{definition}</Text>
            <Text style={styles.defVi}>{definition_vi}</Text>
            
            <View style={styles.divider} />
            
            {example && (
              <>
                <Text style={styles.defLabel}>VÍ DỤ</Text>
                <Text style={styles.exEn}>"{example}"</Text>
                <Text style={styles.exVi}>{example_vi}</Text>
              </>
            )}
          </View>
          <View style={styles.hintContainer}>
            <Text style={styles.hintText}>Chạm để quay lại</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: CARD_HEIGHT + 40,
  },
  cardWrapper: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: radius.xl2,
    backgroundColor: '#fff',
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backfaceVisibility: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
  cardFront: {
    gap: spacing.md,
  },
  cardBack: {
    backgroundColor: '#F8F9FE',
  },
  wordText: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  ipaText: {
    fontSize: 22,
    color: colors.primary,
    fontWeight: '600',
  },
  speakerBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  backContent: {
    width: '100%',
    gap: spacing.sm,
  },
  defLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.outline,
    letterSpacing: 1,
    marginBottom: 4,
  },
  defEn: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 26,
  },
  defVi: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  exEn: {
    fontSize: 16,
    color: colors.text,
    fontStyle: 'italic',
    lineHeight: 24,
  },
  exVi: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  hintContainer: {
    position: 'absolute',
    bottom: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  hintText: {
    fontSize: 13,
    color: colors.outline,
    fontWeight: '500',
  },
});
