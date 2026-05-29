import React from 'react';
import { useSpeakingStore } from '@/stores/useSpeakingStore';
import { SpeakingPart1Widget } from './SpeakingPart1Widget';
import { SpeakingPart2Widget } from './SpeakingPart2Widget';
import { SpeakingPart3Widget } from './SpeakingPart3Widget';

interface LiveSpeakingWidgetProps {
  mode?: 'test' | 'practice';
  onEndSession?: () => void;
  onManualEnd?: () => void;
  onExit?: () => void;
}

export function LiveSpeakingWidget(props: LiveSpeakingWidgetProps) {
  const { lessonParts, currentPartIndex } = useSpeakingStore();
  const currentPart = lessonParts[currentPartIndex] || 1;

  switch (currentPart) {
    case 2:
      return <SpeakingPart2Widget {...props} key={`part-${currentPartIndex}`} />;
    case 3:
      return <SpeakingPart3Widget {...props} key={`part-${currentPartIndex}`} />;
    default:
      return <SpeakingPart1Widget {...props} key={`part-${currentPartIndex}`} />;
  }
}
