import { API_BASE_URL } from './config';

export interface AIModelMeta {
  id: string;
  name: string;
  type: 'stt' | 'pronunciation' | 'translation';
  version: string;
  url: string;
  sizeMb: number;
  checksum?: string;
}

export const AI_ASSETS: Record<string, AIModelMeta> = {
  'whisper-tiny-en': {
    id: 'whisper-tiny-en',
    name: 'Whisper Tiny (English)',
    type: 'stt',
    version: '1.0.0',
    // Giả định URL từ Cloudflare R2 thông qua backend proxy hoặc trực tiếp
    url: `${API_BASE_URL}/assets/models/whisper-tiny-en-q4.onnx`,
    sizeMb: 42,
    checksum: 'size:44000000', // Sẽ cập nhật checksum thực tế sau
  },
};
