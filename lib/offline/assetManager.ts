import * as FileSystem from 'expo-file-system';
import { AI_ASSETS, AIModelMeta } from '@/constants/assets';
import { getSecureItem, setSecureItem } from '@/lib/storage';

const MODELS_DIR = `${FileSystem.documentDirectory}models/`;

export interface AssetStatus {
  isDownloaded: boolean;
  version: string | null;
  localUri: string | null;
}

/**
 * AssetManager — Quản lý việc tải và lưu trữ các mô hình AI (Tier 2).
 */
export const AssetManager = {
  /**
   * Đảm bảo thư mục lưu trữ tồn tại
   */
  async ensureDir() {
    const info = await FileSystem.getInfoAsync(MODELS_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
    }
  },

  /**
   * Lấy đường dẫn cục bộ của một model
   */
  getLocalUri(modelId: string): string {
    return `${MODELS_DIR}${modelId}.onnx`;
  },

  /**
   * Kiểm tra trạng thái của một model
   */
  async getStatus(modelId: string): Promise<AssetStatus> {
    const path = this.getLocalUri(modelId);
    const info = await FileSystem.getInfoAsync(path);
    const version = await getSecureItem(`model_version_${modelId}`);

    return {
      isDownloaded: info.exists,
      version: version ?? null,
      localUri: info.exists ? path : null,
    };
  },

  /**
   * Tải một model AI về máy
   */
  async downloadModel(
    modelId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    await this.ensureDir();
    const model = AI_ASSETS[modelId];
    if (!model) throw new Error(`Model ${modelId} not found in assets manifest`);

    const localUri = this.getLocalUri(modelId);
    const tempUri = `${FileSystem.cacheDirectory}${modelId}.tmp`;

    const downloadResumable = FileSystem.createDownloadResumable(
      model.url,
      tempUri,
      {},
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesExpectedToWrite > 0
          ? downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite
          : 0;
        onProgress?.(progress);
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result?.uri) throw new Error('Download failed');

    // Atomic swap
    const existing = await FileSystem.getInfoAsync(localUri);
    if (existing.exists) {
      await FileSystem.deleteAsync(localUri, { idempotent: true });
    }

    await FileSystem.moveAsync({ from: result.uri, to: localUri });
    await setSecureItem(`model_version_${modelId}`, model.version);

    console.log(`[AssetManager] Model ${modelId} downloaded to ${localUri}`);
    return localUri;
  },

  /**
   * Xoá một model để giải phóng bộ nhớ
   */
  async deleteModel(modelId: string) {
    const path = this.getLocalUri(modelId);
    await FileSystem.deleteAsync(path, { idempotent: true });
    await setSecureItem(`model_version_${modelId}`, '');
  },

  /**
   * Kiểm tra xem có bản cập nhật mới cho model không
   */
  async checkForUpdate(modelId: string): Promise<boolean> {
    const model = AI_ASSETS[modelId];
    if (!model) return false;

    const status = await this.getStatus(modelId);
    if (!status.isDownloaded) return true;

    // So sánh version đơn giản
    return status.version !== model.version;
  }
};
