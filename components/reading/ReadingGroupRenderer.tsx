import { Text, StyleSheet } from 'react-native';
import type { QuestionGroupDTO, QuestionDTO } from '@/lib/api/types';
import { TFNGGroup } from './groups/TFNGGroup';
import { MCGroup } from './groups/MCGroup';
import { ShortAnswerGroup } from './groups/ShortAnswerGroup';
import { SummaryCompletionGroup } from './groups/SummaryCompletionGroup';
import { MatchingHeadingsGroup } from './groups/MatchingHeadingsGroup';
import { MatchingInformationGroup } from './groups/MatchingInformationGroup';
import { FlowChartGroup } from './groups/FlowChartGroup';
import { DiagramCompletionGroup } from './groups/DiagramCompletionGroup';

interface ReadingGroupRendererProps {
  group: QuestionGroupDTO;
  questions: QuestionDTO[];
  answers: Record<string, string>;
  onAnswer: (questionId: string, answer: string) => void;
}

export function ReadingGroupRenderer({ group, questions, answers, onAnswer }: ReadingGroupRendererProps) {
  const type = group.group_type || '';

  switch (type) {
    case 'TRUE_FALSE_NOT_GIVEN':
    case 'YES_NO_NOT_GIVEN':
      return <TFNGGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} />;

    case 'MULTIPLE_CHOICE_SINGLE':
    case 'MULTIPLE_CHOICE_MULTIPLE':
      return <MCGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} />;

    case 'SHORT_ANSWER':
      return <ShortAnswerGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} />;

    case 'SUMMARY_COMPLETION':
      return <SummaryCompletionGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} />;

    case 'MATCHING_HEADINGS':
      return <MatchingHeadingsGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} />;

    case 'MATCHING_INFORMATION':
      return <MatchingInformationGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} variant="information" />;

    case 'MATCHING_FEATURES':
      return <MatchingInformationGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} variant="features" />;

    case 'FLOWCHART_COMPLETION':
      return <FlowChartGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} />;

    case 'DIAGRAM_COMPLETION':
      return <DiagramCompletionGroup group={group} questions={questions} answers={answers} onAnswer={onAnswer} />;

    default:
      return (
        <Text style={styles.comingSoon}>
          Question type "{type}" is not yet implemented.
        </Text>
      );
  }
}

const styles = StyleSheet.create({
  comingSoon: {
    padding: 24, textAlign: 'center', color: '#94a3b8',
    fontStyle: 'italic', fontSize: 14,
  },
});
