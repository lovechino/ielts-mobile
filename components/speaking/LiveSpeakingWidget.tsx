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
  const { prefilledPart } = useSpeakingStore();

  switch (prefilledPart) {
    case 2:
      return <SpeakingPart2Widget {...props} />;
    case 3:
      return <SpeakingPart3Widget {...props} />;
    default:
      return <SpeakingPart1Widget {...props} />;
  }
}
