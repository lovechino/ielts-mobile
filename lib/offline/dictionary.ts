import * as SQLite from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';

/**
 * Dictionary Database Service
 * Handles 100k words using SQLite FTS5 for O(1) perception search.
 */

let db: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;
const DB_NAME = 'dictionary.db';
const DB_PATH = `${FileSystem.documentDirectory}SQLite/${DB_NAME}`;

/** Xóa db instance cache để force re-open */
export const resetDictionaryDBCache = () => { 
  db = null; 
  initPromise = null;
};

const createSchema = async (database: SQLite.SQLiteDatabase) => {
  await database.execAsync(`
    CREATE TABLE IF NOT EXISTS vocabulary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      word TEXT NOT NULL UNIQUE,
      definition TEXT,
      definition_vi TEXT,
      pronunciation TEXT,
      part_of_speech TEXT,
      example TEXT,
      example_vi TEXT,
      topic TEXT,
      level TEXT,
      synonyms TEXT,
      antonyms TEXT,
      is_priority INTEGER DEFAULT 0,
      is_academic INTEGER DEFAULT 0
    );
    CREATE VIRTUAL TABLE IF NOT EXISTS vocab_fts USING fts5(
      word,
      content='vocabulary',
      content_rowid='id'
    );
    CREATE TRIGGER IF NOT EXISTS vocab_ai AFTER INSERT ON vocabulary BEGIN
      INSERT INTO vocab_fts(rowid, word) VALUES (new.id, new.word);
    END;
  `);
};

export const initDictionaryDB = async (): Promise<SQLite.SQLiteDatabase> => {
  if (initPromise) return initPromise;

  initPromise = (async () => {
    if (db) {
      // Verify instance vẫn hoạt động
      try { 
        await db.execAsync('SELECT 1'); 
        return db;
      } catch { 
        try { await db.closeAsync(); } catch {}
        db = null; 
      }
    }

    try {
      db = await SQLite.openDatabaseAsync(DB_NAME);
      // Deep integrity check: Đảm bảo file không corrupt
      const integrity: any = await db.getFirstAsync('PRAGMA integrity_check');
      if (integrity['integrity_check'] !== 'ok') {
        throw new Error('Database integrity check failed: ' + integrity['integrity_check']);
      }
      
      // Kiểm tra xem table vocabulary có tồn tại không
      const tableCheck: any = await db.getFirstAsync("SELECT name FROM sqlite_master WHERE type='table' AND name='vocabulary'");
      if (!tableCheck) {
        console.log('[Dictionary] Vocabulary table missing, initializing schema...');
        await createSchema(db);
      }
    } catch (e) {
      console.error('[Dictionary] Critical DB Error:', e);
      if (db) {
        try { await db.closeAsync(); } catch {}
        db = null;
      }
      
      // Xóa file lỗi để system tải lại ở lần tới
      await FileSystem.deleteAsync(DB_PATH, { idempotent: true });
      const { deleteSecureItem } = await import('@/lib/storage');
      await deleteSecureItem('db_version');
      throw e; 
    }

    // Luôn đảm bảo schema đầy đủ
    await createSchema(db);
    
    // Migration: Đảm bảo các cột mới tồn tại...
    // (rest of code)


    // Migration: Đảm bảo các cột mới tồn tại nếu file cũ đã có table vocabulary
    const columns = [
      { name: 'topic', type: 'TEXT' },
      { name: 'level', type: 'TEXT' },
      { name: 'synonyms', type: 'TEXT' },
      { name: 'antonyms', type: 'TEXT' },
      { name: 'is_priority', type: 'INTEGER DEFAULT 0' },
      { name: 'is_academic', type: 'INTEGER DEFAULT 0' }
    ];

    for (const col of columns) {
      try {
        const info: any[] = await db.getAllAsync(`PRAGMA table_info(vocabulary)`);
        const exists = info.some((c: any) => c.name === col.name);
        
        if (!exists) {
          console.log(`[Dictionary] Adding missing column: ${col.name}`);
          await db.execAsync(`ALTER TABLE vocabulary ADD COLUMN ${col.name} ${col.type};`);
        }
      } catch (e) {
        console.warn(`[Dictionary] Migration failed for ${col.name}:`, e);
      }
    }

    // user_word_vault luôn đảm bảo tồn tại (dữ liệu cá nhân)
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS user_word_vault (
        id TEXT PRIMARY KEY,
        vocab_id INTEGER REFERENCES vocabulary(id),
        status TEXT DEFAULT 'new',
        group_name TEXT DEFAULT 'General',
        next_review_at INTEGER,
        ease_factor REAL DEFAULT 2.5,
        interval INTEGER DEFAULT 0,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );
    `);
    console.log('[Dictionary] user_word_vault table ready');

    return db;
  })();

  return initPromise;
};

export const searchWords = async (query: string, limit = 20) => {
  const database = await initDictionaryDB();
  if (!query) return [];

  // FTS5 Search with JOIN to get non-indexed columns (definition_vi, etc.)
  // We use rowid to link FTS table with the content table
  const results = await database.getAllAsync<{ id: number; word: string; definition_vi: string; level: string; is_academic: number }>(
    `SELECT v.id, v.word, v.definition_vi, v.level, v.is_academic 
     FROM vocabulary v
     JOIN vocab_fts f ON v.id = f.rowid
     WHERE f.word MATCH ? 
     ORDER BY rank 
     LIMIT ?`,
    [`${query}*`, limit]
  );

  return results;
};

export const getWordDetail = async (id: number) => {
  const database = await initDictionaryDB();
  return await database.getFirstAsync<{
    id: number;
    word: string;
    definition: string;
    definition_vi: string;
    pronunciation: string;
    part_of_speech: string;
    example: string;
    example_vi: string;
    topic: string;
    level: string;
    synonyms: string;
    antonyms: string;
    is_priority: number;
    is_academic: number;
  }>(
    'SELECT * FROM vocabulary WHERE id = ?',
    [id]
  );
};

export const getRandomWordsByLevel = async (level: string, limit = 10) => {
  const database = await initDictionaryDB();
  return await database.getAllAsync<{
    id: number;
    word: string;
    definition: string;
    definition_vi: string;
    pronunciation: string;
    part_of_speech: string;
    level: string;
    is_academic: number;
  }>(
    'SELECT id, word, definition, definition_vi, pronunciation, part_of_speech, level, is_academic FROM vocabulary WHERE level = ? ORDER BY RANDOM() LIMIT ?',
    [level, limit]
  );
};

export const getRandomWords = async (limit = 10) => {
  const database = await initDictionaryDB();
  return await database.getAllAsync<{
    id: number;
    word: string;
    definition: string;
    definition_vi: string;
    pronunciation: string;
    part_of_speech: string;
    level: string;
    is_academic: number;
  }>(
    'SELECT id, word, definition, definition_vi, pronunciation, part_of_speech, level, is_academic FROM vocabulary ORDER BY RANDOM() LIMIT ?',
    [limit]
  );
};

export const getWordsByLevel = async (level: string, limit = 50) => {
  const database = await initDictionaryDB();
  return await database.getAllAsync<any>(
    'SELECT id, word, definition, definition_vi, pronunciation, part_of_speech, level, is_academic, topic FROM vocabulary WHERE level = ? LIMIT ?',
    [level, limit]
  );
};

export const getWordsByTopic = async (topic: string, limit = 50) => {
  const database = await initDictionaryDB();
  return await database.getAllAsync<any>(
    'SELECT id, word, definition, definition_vi, pronunciation, part_of_speech, level, is_academic, topic FROM vocabulary WHERE topic = ? LIMIT ?',
    [topic, limit]
  );
};

export const getAcademicWords = async (limit = 50) => {
  const database = await initDictionaryDB();
  return await database.getAllAsync<any>(
    'SELECT * FROM vocabulary WHERE is_academic = 1 LIMIT ?',
    [limit]
  );
};

export const getAllTopics = async () => {
  const database = await initDictionaryDB();
  return await database.getAllAsync<{ topic: string; count: number }>(
    "SELECT topic, COUNT(*) as count FROM vocabulary WHERE topic IS NOT NULL AND topic != 'User-Added' GROUP BY topic ORDER BY count DESC"
  );
};

export const addToVault = async (vocabId: number, groupName = 'General') => {
  const database = await initDictionaryDB();
  const id = Crypto.randomUUID();
  await database.runAsync(
    'INSERT OR IGNORE INTO user_word_vault (id, vocab_id, status, group_name) VALUES (?, ?, ?, ?)',
    [id, vocabId, 'new', groupName]
  );
};

export const removeFromVault = async (vocabId: number) => {
  const database = await initDictionaryDB();
  await database.runAsync('DELETE FROM user_word_vault WHERE vocab_id = ?', [vocabId]);
};

export const updateVaultWord = async (vocabId: number, stats: { interval: number; ease_factor: number; next_review_at: number; status: string }) => {
  const database = await initDictionaryDB();
  await database.runAsync(
    `UPDATE user_word_vault 
     SET interval = ?, ease_factor = ?, next_review_at = ?, status = ?, updated_at = (strftime('%s', 'now'))
     WHERE vocab_id = ?`,
    [stats.interval, stats.ease_factor, stats.next_review_at, stats.status, vocabId]
  );
};

export const getDueWords = async (limit = 10) => {
  const database = await initDictionaryDB();
  const now = Math.floor(Date.now() / 1000);
  return await database.getAllAsync<{
    id: number;
    word: string;
    definition: string;
    definition_vi: string;
    pronunciation: string;
    part_of_speech: string;
    interval: number;
    ease_factor: number;
  }>(
    `SELECT v.*, uv.interval, uv.ease_factor 
     FROM vocabulary v
     JOIN user_word_vault uv ON v.id = uv.vocab_id
     WHERE uv.next_review_at <= ? OR uv.status = 'new'
     ORDER BY uv.next_review_at ASC
     LIMIT ?`,
    [now, limit]
  );
};

export const getRandomMasteredWords = async (limit = 2) => {
  const database = await initDictionaryDB();
  const fortyEightHoursAgo = Math.floor(Date.now() / 1000) - (48 * 60 * 60);
  
  return await database.getAllAsync<any>(
    `SELECT v.*, uv.interval, uv.ease_factor 
     FROM vocabulary v 
     JOIN user_word_vault uv ON v.id = uv.vocab_id 
     WHERE uv.status = 'mastered' AND uv.updated_at < ?
     ORDER BY RANDOM() LIMIT ?`,
    [fortyEightHoursAgo, limit]
  );
};

export const getPracticeWords = async (limit = 10) => {
  // 1. Lấy khoảng 20% từ đã thuộc để "ôn tập duy trì" (Maintenance Review)
  const masteredLimit = Math.ceil(limit * 0.2);
  const mastered = await getRandomMasteredWords(masteredLimit);
  
  // 2. Lấy số lượng từ còn lại từ danh sách đến hạn (Due) hoặc từ mới (New)
  const remainingLimit = limit - mastered.length;
  const due = await getDueWords(remainingLimit);
  
  let result = [...mastered, ...due];

  // 3. Nếu vẫn chưa đủ, lấy thêm từ ngẫu nhiên trong kho 100k từ
  if (result.length < limit) {
    const random = await getRandomWords(limit - result.length);
    result = [...result, ...random];
  }

  // Trộn ngẫu nhiên danh sách cuối cùng để người dùng không đoán được
  return result.sort(() => Math.random() - 0.5);
};

export const getAllVaultWords = async (groupName?: string) => {
  const database = await initDictionaryDB();
  let query = `
    SELECT v.*, uv.status, uv.next_review_at, uv.group_name
    FROM vocabulary v
    JOIN user_word_vault uv ON v.id = uv.vocab_id
  `;
  const params: any[] = [];
  
  if (groupName) {
    query += ' WHERE uv.group_name = ?';
    params.push(groupName);
  }
  
  query += ' ORDER BY uv.created_at DESC';
  return await database.getAllAsync<any>(query, params);
};

export const getVaultGroups = async () => {
  const database = await initDictionaryDB();
  return await database.getAllAsync<{ group_name: string; count: number; learned: number }>(
    "SELECT group_name, COUNT(*) as count, SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END) as learned FROM user_word_vault GROUP BY group_name"
  );
};

export const isSavedInVault = async (vocabId: number) => {
  const database = await initDictionaryDB();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM user_word_vault WHERE vocab_id = ?',
    [vocabId]
  );
  return (result?.count || 0) > 0;
};

export const getMasteredCount = async () => {
  const database = await initDictionaryDB();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM user_word_vault WHERE status = 'mastered'"
  );
  return result?.count || 0;
};

export const getLearningCount = async () => {
  const database = await initDictionaryDB();
  const result = await database.getFirstAsync<{ count: number }>(
    "SELECT COUNT(*) as count FROM user_word_vault WHERE status != 'mastered'"
  );
  return result?.count || 0;
};

/** Tổng số từ trong bảng vocabulary (offline DB) */
export const getTotalWordCount = async (): Promise<number> => {
  const database = await initDictionaryDB();
  const result = await database.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM vocabulary'
  );
  return result?.count || 0;
};

/** Lấy toàn bộ vault để sync lên server */
export const getAllVaultForSync = async () => {
  const database = await initDictionaryDB();
  return await database.getAllAsync<{
    vocab_id: number;
    status: string;
    group_name: string;
    ease_factor: number;
    interval: number;
    next_review_at: number | null;
    updated_at: number | null;
  }>(
    'SELECT vocab_id, status, group_name, ease_factor, interval, next_review_at, updated_at FROM user_word_vault'
  );
};

/** Restore vault từ server về local (dùng khi đổi máy) */
export const restoreVaultFromServer = async (
  items: Array<{
    vocab_id: number;
    status: string;
    group_name?: string;
    ease_factor?: number;
    interval?: number;
    next_review_at?: number | null;
  }>
) => {
  const database = await initDictionaryDB();
  for (const item of items) {
    const id = Crypto.randomUUID();
    await database.runAsync(
      `INSERT OR REPLACE INTO user_word_vault
        (id, vocab_id, status, group_name, ease_factor, interval, next_review_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        item.vocab_id,
        item.status ?? 'new',
        item.group_name ?? 'General',
        item.ease_factor ?? 2.5,
        item.interval ?? 0,
        item.next_review_at ?? null,
        Math.floor(Date.now() / 1000),
      ]
    );
  }
};

export const getVocabularyBundles = async () => {
  const database = await initDictionaryDB();
  
  // Helper to get count from DB
  const getCount = async (where: string, params: any[] = []) => {
    const res = await database.getFirstAsync<{ count: number }>(`SELECT COUNT(*) as count FROM vocabulary WHERE ${where}`, params);
    return res?.count || 0;
  };

  const [b2Count, c1Count, a2Count, bizCount] = await Promise.all([
    getCount('level = ?', ['B2']),
    getCount('level = ? AND is_academic = 1', ['C1']),
    getCount('level = ?', ['A2']),
    getCount("topic = 'Work' OR topic = 'Business'", [])
  ]);

  return [
    {
      id: 'ielts_core',
      title: 'IELTS 6.5+ Core',
      description: 'Các từ vựng quan trọng nhất xuất hiện thường xuyên trong đề thi IELTS.',
      count: b2Count || 500,
      level: 'B2',
      topic: 'Academic',
    },
    {
      id: 'academic_writing',
      title: 'Academic Writing Pro',
      description: 'Nâng cấp vốn từ nối và từ vựng học thuật cho Writing Task 2.',
      count: c1Count || 300,
      level: 'C1',
      topic: 'Writing',
    },
    {
      id: 'daily_essential',
      title: 'Giao tiếp hằng ngày',
      description: 'Bộ từ vựng nền tảng A1-A2 cho người mới bắt đầu.',
      count: a2Count || 800,
      level: 'A2',
      topic: 'General',
    },
    {
      id: 'business_english',
      title: 'Tiếng Anh Công sở',
      description: 'Từ vựng chuyên sâu về họp hành, đàm phán và email.',
      count: bizCount || 400,
      level: 'B1',
      topic: 'Business',
    }
  ];
};

export const addCustomWordToVault = async (data: {
  word: string;
  definition: string;
  definition_vi: string;
  pronunciation?: string;
  part_of_speech?: string;
  example?: string;
  example_vi?: string;
  group_name?: string;
}) => {
  const database = await initDictionaryDB();
  
  // 1. Insert into vocabulary table
  const result = await database.runAsync(
    `INSERT OR IGNORE INTO vocabulary 
     (word, definition, definition_vi, pronunciation, part_of_speech, example, example_vi, topic) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.word, 
      data.definition, 
      data.definition_vi, 
      data.pronunciation || '', 
      data.part_of_speech || '', 
      data.example || '', 
      data.example_vi || '', 
      'User-Added'
    ]
  );

  // 2. Get the ID (either newly inserted or existing)
  const word = await database.getFirstAsync<{ id: number }>(
    'SELECT id FROM vocabulary WHERE word = ?',
    [data.word]
  );

  if (word) {
    // 3. Add to vault
    await addToVault(word.id, data.group_name || 'General');
    return word.id;
  }
  return null;
};

export const updateCustomWord = async (id: number, data: {
  word: string;
  definition: string;
  definition_vi: string;
  pronunciation?: string;
  part_of_speech?: string;
  example?: string;
  example_vi?: string;
}) => {
  const database = await initDictionaryDB();
  
  // Chỉ cho phép update nếu từ đó là 'User-Added'
  const current = await database.getFirstAsync<{ topic: string }>('SELECT topic FROM vocabulary WHERE id = ?', [id]);
  if (!current || current.topic !== 'User-Added') {
    throw new Error('Không thể chỉnh sửa từ vựng hệ thống.');
  }

  await database.runAsync(
    `UPDATE vocabulary 
     SET word = ?, definition = ?, definition_vi = ?, pronunciation = ?, part_of_speech = ?, example = ?, example_vi = ?
     WHERE id = ?`,
    [
      data.word, 
      data.definition, 
      data.definition_vi, 
      data.pronunciation || '', 
      data.part_of_speech || '', 
      data.example || '', 
      data.example_vi || '', 
      id
    ]
  );
  return true;
};

export const renameVocabularyGroup = async (oldName: string, newName: string) => {
  const database = await initDictionaryDB();
  await database.runAsync(
    'UPDATE user_word_vault SET group_name = ? WHERE group_name = ?',
    [newName, oldName]
  );
};

export const deleteCustomWord = async (id: number) => {
  const database = await initDictionaryDB();
  const current = await database.getFirstAsync<{ topic: string }>('SELECT topic FROM vocabulary WHERE id = ?', [id]);
  
  // 1. Xóa khỏi vault
  await database.runAsync('DELETE FROM user_word_vault WHERE vocab_id = ?', [id]);
  
  // 2. Nếu là từ user tự thêm thì xóa hẳn khỏi bảng vocabulary
  if (current?.topic === 'User-Added') {
    await database.runAsync('DELETE FROM vocabulary WHERE id = ?', [id]);
    await database.runAsync('DELETE FROM vocab_fts WHERE rowid = ?', [id]);
  }
};

export const getSystemVocabStats = async () => {
  const database = await initDictionaryDB();
  // Lấy danh sách các topic lớn, số lượng từ tổng và số lượng đã thuộc
  return await database.getAllAsync<{ topic: string; count: number; learned: number }>(
    `SELECT 
      v.topic, 
      COUNT(v.id) as count,
      COUNT(uv.vocab_id) as learned
     FROM vocabulary v
     LEFT JOIN user_word_vault uv ON v.id = uv.vocab_id AND uv.status = 'mastered'
     WHERE v.topic != 'User-Added' AND v.topic IS NOT NULL 
     GROUP BY v.topic 
     HAVING count > 10`
  );
};

export const toggleMasteredStatus = async (vocabId: number) => {
  const database = await initDictionaryDB();
  let newStatus: "mastered" | "learning" | undefined;

  await database.withTransactionAsync(async () => {
    const current = await database.getFirstAsync<{ status: string }>(
      'SELECT status FROM user_word_vault WHERE vocab_id = ?',
      [vocabId]
    );

    if (current) {
      newStatus = current.status === 'mastered' ? 'learning' : 'mastered';
      await database.runAsync(
        "UPDATE user_word_vault SET status = ?, updated_at = (strftime('%s', 'now')) WHERE vocab_id = ?",
        [newStatus, vocabId]
      );
    } else {
      newStatus = 'mastered';
      const id = Crypto.randomUUID();
      await database.runAsync(
        'INSERT INTO user_word_vault (id, vocab_id, status, group_name) VALUES (?, ?, ?, ?)',
        [id, vocabId, 'mastered', 'General']
      );
    }
  });

  return newStatus;
};

export const addBundleToVault = async (bundleId: string, groupName: string) => {
  const database = await initDictionaryDB();
  // Simplified: Get random words based on bundle criteria
  // In real app, this would use specific word IDs linked to the bundle
  const words = await getRandomWords(50); // Just for demo
  
  for (const word of words) {
    await addToVault(word.id, groupName);
  }
};
