import * as ort from 'onnxruntime-react-native';
import { AssetManager } from './assetManager';

/**
 * AIInference — Lớp xử lý chạy mô hình AI cục bộ (Tier 2).
 */
export class AIInference {
  private static sessions: Record<string, ort.InferenceSession> = {};

  /**
   * Khởi tạo session cho một model
   */
  static async getSession(modelId: string): Promise<ort.InferenceSession> {
    if (this.sessions[modelId]) return this.sessions[modelId];

    const status = await AssetManager.getStatus(modelId);
    if (!status.isDownloaded || !status.localUri) {
      throw new Error(`Model ${modelId} is not downloaded.`);
    }

    console.log(`[AIInference] Initializing session for ${modelId}...`);
    
    // Phase 4: Optimization — Sử dụng Hardware Acceleration nếu có
    const options: ort.InferenceSession.SessionOptions = {
      executionProviders: ['nnapi', 'coreml', 'cpu'], // Thứ tự ưu tiên: Android NNAPI -> iOS CoreML -> CPU
      enableCpuMemArena: true,
      enableMemPattern: true,
      logSeverityLevel: 3, // Chỉ log lỗi nghiêm trọng để tiết kiệm tài nguyên
    };

    const session = await ort.InferenceSession.create(status.localUri, options);
    this.sessions[modelId] = session;
    return session;
  }

  /**
   * Chạy mô hình Whisper để lấy transcript (Placeholder)
   * Trong thực tế cần: Audio -> Mel Spectrogram -> ONNX -> Decoding
   */
  static async runWhisper(audioUri: string): Promise<string> {
    // TODO: Implement actual audio processing and ONNX run
    console.log('[AIInference] runWhisper placeholder called with:', audioUri);
    return "This is a placeholder transcript from offline AI";
  }

  /**
   * Giải phóng bộ nhớ
   */
  static async releaseSession(modelId: string) {
    if (this.sessions[modelId]) {
      // onnxruntime-react-native doesn't have an explicit release in some versions
      // but we can null it out.
      delete this.sessions[modelId];
    }
  }
}
