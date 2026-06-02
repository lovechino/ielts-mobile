export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8787/api/v1';

/**
 * Dictionary DB — hosted trên GitHub repo vocabulary riêng.
 * Thay YOUR_GITHUB_USERNAME và YOUR_VOCAB_REPO bằng repo thực tế.
 *
 * Cấu trúc GitHub Releases cần có:
 *   - Tag: v1.0.0, v1.1.0, ...
 *   - Asset: dictionary.db (full DB)
 *   - Asset (optional): patch_v1.0.0_to_v1.1.0.sql (delta patch)
 */
export const DICT_GITHUB_BASE = process.env.EXPO_PUBLIC_DICT_GITHUB_BASE
  || 'https://github.com/lovechino/vocabulary/releases/download';

/** URL tải full DB lần đầu (version mặc định khi chưa có backend metadata) */
export const DICT_INITIAL_URL = `${DICT_GITHUB_BASE}/v0.0.1/dictionary.db`;

/** Version mặc định khi tải lần đầu */
export const DICT_INITIAL_VERSION = '0.0.1';
