import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { colors, spacing, radius } from '@/theme/tokens';
import { useGameStore } from '@/stores/useGameStore';

const { width } = Dimensions.get('window');

interface WordPair {
  id: number;
  word: string;
  meaning: string;
}

interface WordMatchProps {
  data: WordPair[];
  onFinish: () => void;
}

interface Selection {
  id: number;
  type: 'word' | 'meaning';
}

export const WordMatch: React.FC<WordMatchProps> = ({ data, onFinish }) => {
  const [words, setWords] = useState<any[]>([]);
  const [meanings, setMeanings] = useState<any[]>([]);
  const [selected, setSelected] = useState<Selection | null>(null);
  const [matchedIds, setMatchedIds] = useState<number[]>([]);
  const [wrongId, setWrongId] = useState<Selection | null>(null);

  const { incrementCombo, resetCombo, addScore } = useGameStore();

  useEffect(() => {
    // Initialize and shuffle
    const shuffledWords = [...data].sort(() => Math.random() - 0.5);
    const shuffledMeanings = [...data].sort(() => Math.random() - 0.5);
    setWords(shuffledWords);
    setMeanings(shuffledMeanings);
  }, [data]);

  const handleSelect = (id: number, type: 'word' | 'meaning') => {
    if (matchedIds.includes(id)) return;
    if (selected && selected.type === type) {
      setSelected({ id, type }); // Change selection in same column
      return;
    }

    if (!selected) {
      setSelected({ id, type });
    } else {
      // Check for match
      if (selected.id === id) {
        // Correct match
        setMatchedIds([...matchedIds, id]);
        setSelected(null);
        addScore(10);
        incrementCombo();
        
        if (matchedIds.length + 1 === data.length) {
          setTimeout(onFinish, 1000);
        }
      } else {
        // Wrong match
        setWrongId({ id, type });
        resetCombo();
        setTimeout(() => {
          setSelected(null);
          setWrongId(null);
        }, 500);
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* Words Column */}
        <View style={styles.column}>
          {words.map((item) => (
            <TouchableOpacity
              key={`word-${item.id}`}
              disabled={matchedIds.includes(item.id)}
              style={[
                styles.item,
                selected?.id === item.id && selected?.type === 'word' && styles.selectedItem,
                matchedIds.includes(item.id) && styles.matchedItem,
                wrongId?.id === item.id && wrongId?.type === 'word' && styles.wrongItem,
              ]}
              onPress={() => handleSelect(item.id, 'word')}
            >
              <Text style={[
                styles.itemText,
                matchedIds.includes(item.id) && styles.matchedText
              ]}>{item.word}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meanings Column */}
        <View style={styles.column}>
          {meanings.map((item) => (
            <TouchableOpacity
              key={`meaning-${item.id}`}
              disabled={matchedIds.includes(item.id)}
              style={[
                styles.item,
                selected?.id === item.id && selected?.type === 'meaning' && styles.selectedItem,
                matchedIds.includes(item.id) && styles.matchedItem,
                wrongId?.id === item.id && wrongId?.type === 'meaning' && styles.wrongItem,
              ]}
              onPress={() => handleSelect(item.id, 'meaning')}
            >
              <Text style={[
                styles.itemText,
                matchedIds.includes(item.id) && styles.matchedText
              ]}>{item.meaning}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  column: {
    flex: 1,
    gap: spacing.sm,
  },
  item: {
    height: 60,
    backgroundColor: '#fff',
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  selectedItem: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  matchedItem: {
    borderColor: '#4CAF50',
    backgroundColor: '#E8F5E9',
    opacity: 0.6,
  },
  wrongItem: {
    borderColor: '#F44336',
    backgroundColor: '#FFEBEE',
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  matchedText: {
    color: '#2E7D32',
    textDecorationLine: 'line-through',
  },
});
