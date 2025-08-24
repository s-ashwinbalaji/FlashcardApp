// hooks/useDatabase.ts - Modified with SM-2 Spaced Repetition Support

import { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

export interface Deck {
  id: number;
  name: string;
  description: string;
  created_at: string;
  card_count?: number; // Optional card count for display purposes
}

export interface Card {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  
  // SM-2 Spaced Repetition Fields
  repetitions: number;        // Number of consecutive successful reviews
  easiness_factor: number;    // How easy the card is (1.3 - 2.5)
  interval: number;           // Days until next review
  next_review: string | null; // ISO date string for next review
  last_reviewed: string | null; // ISO date string of last review
  review_count: number;       // Total number of times reviewed
  created_at?: string;
}

export function useDatabase() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    const initDb = async () => {
      const database = await SQLite.openDatabaseAsync('flashcards.db');
      
      // Create tables
      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS decks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await database.execAsync(`
        CREATE TABLE IF NOT EXISTS cards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          deck_id INTEGER NOT NULL,
          front TEXT NOT NULL,
          back TEXT NOT NULL,
          repetitions INTEGER DEFAULT 0,
          easiness_factor REAL DEFAULT 2.5,
          interval INTEGER DEFAULT 1,
          next_review DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_reviewed DATETIME,
          review_count INTEGER DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
        );
      `);

      // Check if we need to migrate existing tables
      try {
        // Check decks table
        const decksTableInfo = await database.getAllAsync(`PRAGMA table_info(decks);`);
        const decksColumns = decksTableInfo.map((row: any) => row.name);
        
        // Add created_at to decks if it doesn't exist
        if (!decksColumns.includes('created_at')) {
          await database.execAsync('ALTER TABLE decks ADD COLUMN created_at DATETIME;');
          // Update existing records with current timestamp
          await database.execAsync('UPDATE decks SET created_at = datetime("now") WHERE created_at IS NULL;');
        }

        // Check cards table
        const cardsTableInfo = await database.getAllAsync(`PRAGMA table_info(cards);`);
        const cardsColumns = cardsTableInfo.map((row: any) => row.name);
        
        // Add missing columns to cards if they don't exist
        if (!cardsColumns.includes('created_at')) {
          await database.execAsync('ALTER TABLE cards ADD COLUMN created_at DATETIME;');
          // Update existing records with current timestamp
          await database.execAsync('UPDATE cards SET created_at = datetime("now") WHERE created_at IS NULL;');
        }
        if (!cardsColumns.includes('repetitions')) {
          await database.execAsync('ALTER TABLE cards ADD COLUMN repetitions INTEGER DEFAULT 0;');
        }
        if (!cardsColumns.includes('easiness_factor')) {
          await database.execAsync('ALTER TABLE cards ADD COLUMN easiness_factor REAL DEFAULT 2.5;');
        }
        if (!cardsColumns.includes('interval')) {
          await database.execAsync('ALTER TABLE cards ADD COLUMN interval INTEGER DEFAULT 1;');
        }
        if (!cardsColumns.includes('next_review')) {
          await database.execAsync('ALTER TABLE cards ADD COLUMN next_review DATETIME;');
          // Update existing records with current timestamp
          await database.execAsync('UPDATE cards SET next_review = datetime("now") WHERE next_review IS NULL;');
        }
        if (!cardsColumns.includes('last_reviewed')) {
          await database.execAsync('ALTER TABLE cards ADD COLUMN last_reviewed DATETIME;');
        }
        if (!cardsColumns.includes('review_count')) {
          await database.execAsync('ALTER TABLE cards ADD COLUMN review_count INTEGER DEFAULT 0;');
        }
        
        // Migrate old difficulty field if it exists and hasn't been migrated
        if (cardsColumns.includes('difficulty') && !cardsColumns.includes('repetitions_migrated')) {
          // Convert old difficulty system to SM-2
          await database.execAsync(`
            UPDATE cards SET 
              repetitions = CASE 
                WHEN last_reviewed IS NULL THEN 0 
                ELSE review_count 
              END,
              easiness_factor = CASE 
                WHEN difficulty <= 2 THEN 2.5 
                WHEN difficulty = 3 THEN 2.3 
                WHEN difficulty = 4 THEN 2.0 
                ELSE 1.8 
              END,
              interval = CASE 
                WHEN last_reviewed IS NULL THEN 1 
                WHEN difficulty <= 3 THEN 6 
                WHEN difficulty = 4 THEN 3 
                WHEN difficulty = 5 THEN 1 
                ELSE 1 
              END
            WHERE repetitions IS NULL;
          `);
          
          // Mark as migrated
          await database.execAsync('ALTER TABLE cards ADD COLUMN repetitions_migrated INTEGER DEFAULT 1;');
        }
      } catch (error) {
        console.log('Migration error:', error);
      }

      setDb(database);
      setIsDbReady(true);
    };

    initDb();
  }, []);

  // Deck operations
  const createDeck = async (name: string, description: string = ''): Promise<number> => {
    if (!db) throw new Error('Database not initialized');
    
    const result = await db.runAsync(
      'INSERT INTO decks (name, description) VALUES (?, ?)',
      [name, description]
    );
    return result.lastInsertRowId;
  };

  const getDecks = async (): Promise<Deck[]> => {
    if (!db) return [];
    
    const result = await db.getAllAsync(`
      SELECT d.*, COUNT(c.id) as card_count 
      FROM decks d 
      LEFT JOIN cards c ON d.id = c.deck_id 
      GROUP BY d.id 
      ORDER BY d.created_at DESC
    `);
    return result as Deck[];
  };

  const getDeck = async (id: number): Promise<Deck | null> => {
    if (!db) return null;
    
    const result = await db.getFirstAsync('SELECT * FROM decks WHERE id = ?', [id]);
    return result as Deck | null;
  };

  const deleteDeck = async (id: number): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    await db.runAsync('DELETE FROM decks WHERE id = ?', [id]);
  };

  // Card operations
  const createCard = async (deckId: number, front: string, back: string): Promise<number> => {
    if (!db) throw new Error('Database not initialized');
    
    const now = new Date().toISOString();
    
    const result = await db.runAsync(
      `INSERT INTO cards (
        deck_id, front, back, repetitions, easiness_factor, 
        interval, next_review, review_count
      ) VALUES (?, ?, ?, 0, 2.5, 1, ?, 0)`,
      [deckId, front, back, now]
    );
    return result.lastInsertRowId;
  };

  const getCards = async (deckId: number): Promise<Card[]> => {
    if (!db) return [];
    
    const result = await db.getAllAsync(
      'SELECT * FROM cards WHERE deck_id = ? ORDER BY created_at DESC',
      [deckId]
    );
    return result as Card[];
  };

  const getCard = async (id: number): Promise<Card | null> => {
    if (!db) return null;
    
    const result = await db.getFirstAsync('SELECT * FROM cards WHERE id = ?', [id]);
    return result as Card | null;
  };

  const updateCard = async (
    id: number,
    front: string,
    back: string
  ): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    await db.runAsync(
      'UPDATE cards SET front = ?, back = ? WHERE id = ?',
      [front, back, id]
    );
  };

  const deleteCard = async (id: number): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
  };

  // SM-2 Study operations
  const getCardsForReview = async (deckId: number): Promise<Card[]> => {
    if (!db) return [];
    
    const now = new Date().toISOString();
    
    const result = await db.getAllAsync(
      `SELECT * FROM cards 
       WHERE deck_id = ? 
       AND (next_review IS NULL OR next_review <= ?)
       ORDER BY 
         CASE WHEN repetitions = 0 THEN 0 ELSE 1 END,
         next_review ASC,
         created_at ASC`,
      [deckId, now]
    );
    
    console.log(`Cards due for review in deck ${deckId}: ${result.length} cards found`);
    return result as Card[];
  };

  const getCardsForStudy = async (deckIds: number[]): Promise<Card[]> => {
    if (!db) return [];
    
    const now = new Date().toISOString();
    const placeholders = deckIds.map(() => '?').join(',');
    
    const result = await db.getAllAsync(
      `SELECT * FROM cards 
       WHERE deck_id IN (${placeholders}) 
       AND (next_review IS NULL OR next_review <= ?)
       ORDER BY 
         CASE WHEN repetitions = 0 THEN 0 ELSE 1 END,
         next_review ASC,
         created_at ASC`,
      [...deckIds, now]
    );
    
    // Shuffle cards from different decks for variety
    const cards = result as Card[];
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    
    console.log(`Cards due for study from ${deckIds.length} deck(s): ${cards.length} cards found`);
    return cards;
  };

  const getDeckStats = async (deckId: number) => {
    if (!db) return { total: 0, due: 0, new: 0, learning: 0, mature: 0 };
    
    const now = new Date().toISOString();
    
    const result = await db.getFirstAsync(
      `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN repetitions = 0 AND last_reviewed IS NULL THEN 1 ELSE 0 END) as new,
         SUM(CASE WHEN next_review IS NOT NULL AND next_review <= ? THEN 1 ELSE 0 END) as due,
         SUM(CASE WHEN repetitions > 0 AND repetitions < 2 THEN 1 ELSE 0 END) as learning,
         SUM(CASE WHEN repetitions >= 2 THEN 1 ELSE 0 END) as mature
       FROM cards 
       WHERE deck_id = ?`,
      [now, deckId]
    ) as { total: number; new: number; due: number; learning: number; mature: number } | null;
    
    return {
      total: result?.total || 0,
      new: result?.new || 0,
      due: result?.due || 0,
      learning: result?.learning || 0,
      mature: result?.mature || 0
    };
  };

  // SM-2 Algorithm Implementation
  const updateCardReview = async (cardId: number, quality: 0 | 1 | 2): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const card = await getCard(cardId);
    if (!card) throw new Error('Card not found');
    
    const now = new Date();
    let { repetitions, easiness_factor, interval } = card;

    // Map 3-button system to SM-2 quality scores
    const sm2Quality = quality === 0 ? 3 : quality === 1 ? 4 : 5;

    // SM-2 Algorithm Implementation
    if (sm2Quality >= 3) {
      // Successful recall
      repetitions += 1;

      if (repetitions === 1) {
        interval = 1; // First review: 1 day
      } else if (repetitions === 2) {
        interval = 6; // Second review: 6 days
      } else {
        // Subsequent reviews: previous interval * easiness factor
        interval = Math.round(interval * easiness_factor);
      }
    } else {
      // Failed recall - reset repetitions and set short interval
      repetitions = 0;
      interval = 1;
    }

    // Update easiness factor based on quality
    const qualityFactor = (5 - sm2Quality);
    const adjustment = 0.1 - qualityFactor * (0.08 + qualityFactor * 0.02);
    easiness_factor += adjustment;

    // Constrain easiness factor
    if (easiness_factor < 1.3) {
      easiness_factor = 1.3;
    }
    if (easiness_factor > 3.0) {
      easiness_factor = 3.0;
    }

    // Calculate next review date
    const nextReview = new Date(now.getTime() + interval * 24 * 60 * 60 * 1000);

    // Update database
    await db.runAsync(
      `UPDATE cards SET 
        repetitions = ?,
        easiness_factor = ?,
        interval = ?,
        next_review = ?,
        last_reviewed = ?,
        review_count = review_count + 1
       WHERE id = ?`,
      [
        repetitions,
        Math.round(easiness_factor * 100) / 100, // Round to 2 decimal places
        interval,
        nextReview.toISOString(),
        now.toISOString(),
        cardId
      ]
    );

    console.log(`Card ${cardId} updated: repetitions=${repetitions}, interval=${interval}d, EF=${easiness_factor.toFixed(2)}`);
  };

  // Database export for backup
  const exportDatabase = async (): Promise<string> => {
    if (!db) throw new Error('Database not initialized');
    
    const decks = await getDecks();
    const allCards = await db.getAllAsync('SELECT * FROM cards ORDER BY deck_id, created_at');
    
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      decks,
      cards: allCards
    };
    
    return JSON.stringify(exportData, null, 2);
  };

  return {
    db,
    isDbReady,
    // Deck operations
    createDeck,
    getDecks,
    getDeck,
    deleteDeck,
    // Card operations
    createCard,
    getCards,
    getCard,
    updateCard,
    deleteCard,
    // Study operations
    getCardsForReview,
    getCardsForDeck: getCardsForReview, // Alias for compatibility
    getCardsForStudy, // New multi-deck study method
    getDeckStats,
    updateCardReview,
    exportDatabase,
  };
}