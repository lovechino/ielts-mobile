import { useEffect, useRef, useState, useMemo } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/ui/Screen';
import { ReadingScreen } from '@/components/reading/ReadingScreen';
import { ListeningScreen } from '@/components/listening/ListeningScreen';
import { WritingScreen } from '@/components/writing/WritingScreen';
import { colors, spacing } from '@/theme/tokens';
import { FontAwesome } from '@expo/vector-icons';
import { startSession } from '@/lib/api/speaking';
import { useSpeakingStore } from '@/stores/useSpeakingStore';
import { fetchLesson, fetchLessonQuestions } from '@/lib/api/lessons';
import type { LessonDTO, QuestionDTO, QuestionGroupDTO } from '@/lib/api/types';
import type { GroupedQuestion } from '@/stores/useTestStore';

export default function LessonScreen() {
  const { id, type, part, testType } = useLocalSearchParams<{ id: string; type?: string; part?: string; testType?: string }>();
  const router = useRouter();
  const { setSessionId, setCurrentPersonaId, setPrefill, setAppState, setFeedback } = useSpeakingStore();
  const startedRef = useRef(false);
  const lessonType = (type || '').toLowerCase();
  const speakingPart = parseInt(part || '1', 10);

  const [lessonData, setLessonData] = useState<LessonDTO | null>(null);
  const [allQuestions, setAllQuestions] = useState<QuestionDTO[]>([]);
  const [loadingLesson, setLoadingLesson] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Load lesson data + questions for all types (including speaking)
  useEffect(() => {
    if (!id) return;
    setLoadingLesson(true);
    setLoadError(null);

    if (lessonType === 'speaking') {
      fetchLesson(id)
        .then((lesson) => {
          setLessonData(lesson);
          setLoadingLesson(false);
        })
        .catch((err: any) => {
          setLoadError(err?.message || 'Could not load lesson.');
          setLoadingLesson(false);
        });
    } else {
      Promise.all([fetchLesson(id), fetchLessonQuestions(id)])
        .then(([lesson, questions]) => {
          setLessonData(lesson);
          setAllQuestions(questions || []);
          setLoadingLesson(false);
        })
        .catch((err: any) => {
          setLoadError(err?.message || 'Could not load lesson.');
          setLoadingLesson(false);
        });
    }
  }, [id, lessonType]);

  const groupedQuestions: GroupedQuestion[] = useMemo(() => {
    if (!lessonData?.question_groups) return [];
    return lessonData.question_groups.map((g: QuestionGroupDTO) => ({
      group: g,
      questions: allQuestions.filter((q) => q.group_id === g.id),
    }));
  }, [lessonData?.question_groups, allQuestions]);

  // Speaking auto-start — waits for lesson data to use actual content
  useEffect(() => {
    if (!id || lessonType !== 'speaking' || startedRef.current || loadingLesson || !lessonData) return;
    startedRef.current = true;

    const topic = lessonData.title || 'Practice speaking test';
    // lesson_parts is the unified source of truth (replaces legacy speaking_parts / speaking_part)
    const parts = lessonData.lesson_parts ?? (lessonData.speaking_part ? [lessonData.speaking_part] : null);
    const firstPart = parts?.[0] ?? speakingPart;

    // content may be a JSON string (structured part data) or plain text cue card.
    // Parse safely; if plain text, wrap it so Part2Widget can use it as cue_card.
    let parsedContent: any = null;
    if (lessonData.content) {
      try {
        parsedContent = JSON.parse(lessonData.content);
        if (typeof parsedContent === 'string') {
          throw new Error('Parsed content is a string');
        }
      } catch {
        // Plain text from CMS
        const partKey = `part${firstPart}`;
        const lines = lessonData.content.split('\n').map((l: string) => l.trim()).filter(Boolean);
        parsedContent = {
          [partKey]: firstPart === 1
            ? { topics: [{ name: lessonData.title || 'Topic', questions: lines }] }
            : firstPart === 2
            ? { cue_card: lessonData.content }
            : { questions: lines }
        };
      }
    }

    setCurrentPersonaId('james');
    setPrefill(
      topic,
      firstPart,
      parts ?? undefined,
      parsedContent
    );

    startSession({
      personaId: 'james',
      topic,
      part: firstPart,
      lesson_id: lessonData.id
    })
      .then((session) => {
        setSessionId(session.sessionId);
        
        // If the backend extracted the cue card from passages, update the store so the widget displays it.
        if (session.cue_card_text) {
          setPrefill(
            topic,
            session.parts?.[0] ?? firstPart,
            session.parts ?? parts ?? undefined,
            {
              ...(parsedContent || {}),
              part2: { cue_card: session.cue_card_text }
            }
          );
        }

        // Seed the opening question into the store so the chat bubble
        // shows the examiner's first message immediately on mount.
        if (session.opening_question) {
          setFeedback({
            transcript: '',
            response: session.opening_question,
            feedback: '',
            band_estimate: 0,
            fluency: 0,
            lexicalResource: 0,
            grammaticalRange: 0,
            pronunciation: 0,
            correction: null,
            next_question: null,
          });
        }
        setAppState('speaking');
        router.replace('/speaking/session');
      })
      .catch((err: any) => {
        Alert.alert('Error', err?.message || 'Could not start speaking session.');
        router.back();
      });
  }, [id, lessonType, lessonData, loadingLesson]);

  // Speaking loading
  if (lessonType === 'speaking') {
    return (
      <Screen>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>
            {loadingLesson ? 'Loading test...' : 'Starting speaking session...'}
          </Text>
        </View>
      </Screen>
    );
  }

  // Writing screen
  if (lessonType === 'writing') {
    if (loadingLesson) {
      return (
        <Screen>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>Loading lesson...</Text>
          </View>
        </Screen>
      );
    }
    if (loadError) {
      return (
        <Screen>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
            <Text style={{ color: colors.error, fontSize: 16, marginBottom: spacing.md }}>{loadError}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </Screen>
      );
    }
    if (!lessonData) return null;
    return (
      <WritingScreen
        lesson={lessonData}
        timeLimitMinutes={lessonData.time_limit || 60}
      />
    );
  }

  // Listening screen
  if (lessonType === 'listening') {
    if (loadingLesson) {
      return (
        <Screen>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>Loading lesson...</Text>
          </View>
        </Screen>
      );
    }
    if (loadError) {
      return (
        <Screen>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
            <Text style={{ color: colors.error, fontSize: 16, marginBottom: spacing.md }}>{loadError}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </Screen>
      );
    }
    if (!lessonData) return null;
    return (
      <ListeningScreen
        lesson={lessonData}
        groupedQuestions={groupedQuestions}
        timeLimitMinutes={lessonData.time_limit || 45}
      />
    );
  }

  // Reading screen
  if (lessonType === 'reading' || lessonType === 'mini') {
    if (loadingLesson) {
      return (
        <Screen>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>Loading lesson...</Text>
          </View>
        </Screen>
      );
    }
    if (loadError) {
      return (
        <Screen>
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg }}>
            <Text style={{ color: colors.error, fontSize: 16, marginBottom: spacing.md }}>{loadError}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={{ color: colors.primary, fontWeight: '700' }}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </Screen>
      );
    }
    if (!lessonData) return null;
    return (
      <ReadingScreen
        lesson={lessonData}
        groupedQuestions={groupedQuestions}
        timeLimitMinutes={lessonData.time_limit || 60}
      />
    );
  }

  // Placeholder for other types
  return (
    <Screen>
      <View style={styles.placeholder}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <FontAwesome name="chevron-left" size={20} color={colors.text} />
        </TouchableOpacity>
        <FontAwesome name="wrench" size={48} color={colors.outline} />
        <Text style={styles.placeholderTitle}>Đang phát triển</Text>
        <Text style={styles.placeholderSub}>
          {lessonType ? `Bài thi ${lessonType} đang được xây dựng.` : 'Bài học này chưa sẵn sàng.'}
        </Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Text style={styles.backLinkText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  backBtn: { position: 'absolute', top: spacing.xl, left: spacing.md, padding: spacing.sm },
  placeholderTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  placeholderSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  backLink: { marginTop: spacing.md },
  backLinkText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});
