/**
 * Vocabulary Context Loader
 * Load từ vựng thuộc đúng lộ trình/nhóm đang học.
 * Được dùng bởi tất cả minigame screens.
 */
import {
  getAllVaultWords,
  getWordsByTopic,
  getWordsByLevel,
  getRandomWords,
} from './dictionary';

export interface ContextWord {
  id: number;
  word: string;
  definition: string;
  definition_vi: string;
  pronunciation?: string;
  part_of_speech?: string;
  example?: string;
  example_vi?: string;
  level?: string;
}

export interface VocabContext {
  groupBy: string;
  groupValue: string;
}

/**
 * Load từ vựng theo đúng context (topic/level/group/vault).
 * Shuffle kết quả, trả về tối đa `limit` từ.
 */
export async function loadContextWords(
  ctx: VocabContext,
  limit = 20
): Promise<ContextWord[]> {
  let words: ContextWord[] = [];

  if (ctx.groupBy === 'group_name' && ctx.groupValue) {
    words = await getAllVaultWords(ctx.groupValue);
  } else if (ctx.groupBy === 'topic' && ctx.groupValue) {
    words = await getWordsByTopic(ctx.groupValue, limit * 2);
  } else if (ctx.groupBy === 'level' && ctx.groupValue) {
    words = await getWordsByLevel(ctx.groupValue, limit * 2);
  } else {
    words = await getRandomWords(limit * 2);
  }

  // Lọc từ phải có definition_vi để game hoạt động đúng
  const valid = words.filter(
    (w) => w.word && (w.definition_vi || w.definition)
  );

  // Shuffle
  const shuffled = valid.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, limit);
}
