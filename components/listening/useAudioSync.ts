import { useState, useEffect, useRef } from 'react';

interface TimestampedQuestion {
  id: string;
  questionNumber: number;
  startMs: number;
  endMs: number;
}

export function useAudioSync(
  currentTimeMs: number,
  questions: TimestampedQuestion[]
): { activeQuestionNumber: number | null } {
  const [active, setActive] = useState<number | null>(null);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    if (questions.length === 0 || currentTimeMs < 0) {
      setActive(null);
      return;
    }

    const found = questions.find(
      (q) => currentTimeMs >= q.startMs && currentTimeMs <= q.endMs
    );

    if (found && found.questionNumber !== lastRef.current) {
      lastRef.current = found.questionNumber;
      setActive(found.questionNumber);
    } else if (!found && lastRef.current !== null) {
      lastRef.current = null;
      setActive(null);
    }
  }, [currentTimeMs, questions]);

  return { activeQuestionNumber: active };
}
