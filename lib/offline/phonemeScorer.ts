/**
 * PhonemeScorer — Thuật toán so sánh ngữ âm Offline (Phase 5).
 * Sử dụng khoảng cách Levenshtein biến thể để chấm điểm độ chính xác.
 */

export interface PhonemeScore {
  accuracy: number; // 0.0 to 1.0
  isMatch: boolean;
  diff: Array<{ char: string; status: 'correct' | 'incorrect' | 'missing' }>;
}

export const PhonemeScorer = {
  /**
   * Chuẩn hoá chuỗi IPA (bỏ dấu ngoặc, dấu trọng âm, khoảng trắng)
   */
  normalizeIPA(ipa: string): string {
    return ipa
      .replace(/[\/\[\]]/g, '') // Bỏ / / hoặc [ ]
      .replace(/[ˈˌ]/g, '')     // Bỏ dấu trọng âm
      .replace(/\s/g, '')       // Bỏ khoảng trắng
      .trim()
      .toLowerCase();
  },

  /**
   * Chấm điểm phát âm dựa trên IPA
   * @param targetIpa IPA chuẩn (ví dụ từ từ điển)
   * @param heardIpa IPA nhận diện được từ AI Offline
   */
  scorePronunciation(targetIpa: string, heardIpa: string): PhonemeScore {
    const t = this.normalizeIPA(targetIpa);
    const h = this.normalizeIPA(heardIpa);

    if (!t) return { accuracy: 0, isMatch: false, diff: [] };

    const diff: PhonemeScore['diff'] = [];
    const tChars = t.split('');
    const hChars = h.split('');

    let correctCount = 0;
    const maxLen = Math.max(tChars.length, hChars.length);

    for (let i = 0; i < maxLen; i++) {
      const tc = tChars[i];
      const hc = hChars[i];

      if (tc === hc) {
        correctCount++;
        diff.push({ char: tc, status: 'correct' });
      } else if (hc && tc) {
        diff.push({ char: hc, status: 'incorrect' });
      } else if (tc) {
        diff.push({ char: tc, status: 'missing' });
      } else {
        // hc dư thừa — mark as incorrect
        diff.push({ char: hc, status: 'incorrect' });
      }
    }

    const accuracy = correctCount / tChars.length;

    return {
      accuracy: Math.min(1, accuracy),
      isMatch: accuracy >= 0.8,
      diff,
    };
  },

  /**
   * Tính toán Band Score sơ bộ cho Fluency dựa trên WPM (Words Per Minute)
   */
  estimateFluencyBand(wpm: number, totalSilenceMs: number): number {
    // IELTS chuẩn: 120-150 WPM là tự nhiên
    let score = 0;
    if (wpm >= 130) score = 8;
    else if (wpm >= 110) score = 7;
    else if (wpm >= 90) score = 6;
    else if (wpm >= 70) score = 5;
    else score = 4;

    // Phạt vì im lặng quá lâu (> 4s tổng cộng trong 1 lượt nói ngắn)
    if (totalSilenceMs > 4000) score -= 1;
    if (totalSilenceMs > 8000) score -= 1;

    return Math.max(1, score);
  }
};
