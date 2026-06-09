import { Audio } from 'expo-av';

/**
 * Danh sách âm thanh. 
 * Khuyên dùng: Tải file mp3 về bỏ vào thư mục mobile/assets/sounds và dùng require() 
 * để tránh lỗi 403 (Forbidden) khi server từ chối hotlink từ App.
 */
export const SOUNDS = {
  // Thay đổi sang URL ổn định hơn hoặc dùng local assets
  success: 'https://cdn.pixabay.com/audio/2021/08/04/audio_bb4c2f000b.mp3', 
  click: 'https://cdn.pixabay.com/audio/2022/03/15/audio_c8b91c015b.mp3',
  error: 'https://cdn.pixabay.com/audio/2021/08/04/audio_34f66a8779.mp3',
  beep: 'https://cdn.pixabay.com/audio/2021/08/04/audio_34f66a8779.mp3',
};

// Map cho local assets (Nếu bạn đã tải về)
// const LOCAL_SOUNDS = {
//   success: require('@/assets/sounds/success.mp3'),
//   click: require('@/assets/sounds/click.mp3'),
//   error: require('@/assets/sounds/error.mp3'),
//   beep: require('@/assets/sounds/beep.mp3'),
// };

export async function playSound(type: keyof typeof SOUNDS) {
  try {
    const source = { uri: SOUNDS[type] };
    // const source = LOCAL_SOUNDS[type]; // Dùng cái này nếu đã có file local

    const { sound } = await Audio.Sound.createAsync(
      source,
      { shouldPlay: true, volume: 0.5 }
    );
    
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
  } catch (error) {
    // console.warn('[Sound] Playback failed:', error);
  }
}

