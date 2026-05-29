import { Text, StyleSheet } from 'react-native';
import { colors } from '@/theme/tokens';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';
import { FormCompletionGroup } from './groups/FormCompletionGroup';
import { NoteCompletionGroup } from './groups/NoteCompletionGroup';
import { TableCompletionGroup } from './groups/TableCompletionGroup';
import { SentenceCompletionGroup } from './groups/SentenceCompletionGroup';
import { MapLabelingGroup } from './groups/MapLabelingGroup';
import { MatchingListeningGroup } from './groups/MatchingListeningGroup';
import { MCGroup } from '@/components/reading/groups/MCGroup';

interface ListeningGroupRendererProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
  activeQuestionNumber?: number | null;
  /** Vị trí bắt đầu của group này trong toàn bộ danh sách câu hỏi (0-based) */
  startIndex?: number;
}

export function ListeningGroupRenderer({ group, questions, answers, onAnswer, activeQuestionNumber, startIndex = 0 }: ListeningGroupRendererProps) {
  const type = group.group_type || '';

  switch (type) {
    case 'FORM_COMPLETION':
      return <FormCompletionGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} activeQuestionNumber={activeQuestionNumber} startIndex={startIndex} />;

    case 'NOTE_COMPLETION':
      return <NoteCompletionGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} activeQuestionNumber={activeQuestionNumber} startIndex={startIndex} />;

    case 'TABLE_COMPLETION':
      return <TableCompletionGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} activeQuestionNumber={activeQuestionNumber} startIndex={startIndex} />;

    case 'SENTENCE_COMPLETION':
      return <SentenceCompletionGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} activeQuestionNumber={activeQuestionNumber} startIndex={startIndex} />;

    case 'MAP_LABELING':
      return <MapLabelingGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} activeQuestionNumber={activeQuestionNumber} startIndex={startIndex} />;

    case 'MATCHING':
      return <MatchingListeningGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} activeQuestionNumber={activeQuestionNumber} startIndex={startIndex} />;

    case 'MULTIPLE_CHOICE_SINGLE':
    case 'MULTIPLE_CHOICE_MULTIPLE':
      return <MCGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} />;

    case 'TRUE_FALSE_NOT_GIVEN':
    case 'YES_NO_NOT_GIVEN':
    case 'SHORT_ANSWER':
    case 'SUMMARY_COMPLETION':
    case 'MATCHING_HEADINGS':
    case 'MATCHING_INFORMATION':
    case 'MATCHING_FEATURES':
    case 'FLOWCHART_COMPLETION':
    case 'DIAGRAM_COMPLETION':
      return <Text style={styles.mismatch}>Reading type "{type}" is not available for Listening.</Text>;

    default:
      return (
        <Text style={styles.comingSoon}>
          Listening type "{type}" is not yet implemented.
        </Text>
      );
  }
}

const styles = StyleSheet.create({
  comingSoon: { padding: 24, textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', fontSize: 14 },
  mismatch: { padding: 24, textAlign: 'center', color: colors.error, fontStyle: 'italic', fontSize: 14 },
});
