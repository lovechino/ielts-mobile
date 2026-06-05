import { Audio } from 'expo-av';

export const SOUNDS = {
  success: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  click: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
  error: 'https://assets.mixkit.co/active_storage/sfx/2572/2572-preview.mp3',
  beep: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
};

export async function playSound(type: keyof typeof SOUNDS) {
  try {
    const { sound } = await Audio.Sound.createAsync(
      { uri: SOUNDS[type] },
      { shouldPlay: true }
    );
    
    // Tự động giải phóng bộ nhớ sau khi chơi xong
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    console.warn('[Sound] Playback failed:', error);
  }
}
