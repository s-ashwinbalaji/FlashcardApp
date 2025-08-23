import { useEffect, useState } from 'react';
import * as SQLite from 'expo-sqlite';

export interface Deck {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface Card {
  id: number;
  deck_id: number;
  front: string;
  back: string;
  difficulty: number; // 1-5, where 5 is hardest
  last_reviewed: string | null;
  next_review: string | null;
  review_count: number;
}

export function useDatabase() {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);

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
          difficulty INTEGER DEFAULT 3,
          last_reviewed DATETIME,
          next_review DATETIME,
          review_count INTEGER DEFAULT 0,
          FOREIGN KEY (deck_id) REFERENCES decks (id) ON DELETE CASCADE
        );
      `);

      setDb(database);
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
    
    const result = await db.getAllAsync('SELECT * FROM decks ORDER BY created_at DESC');
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
    
    const result = await db.runAsync(
      'INSERT INTO cards (deck_id, front, back) VALUES (?, ?, ?)',
      [deckId, front, back]
    );
    return result.lastInsertRowId;
  };

  const getCards = async (deckId: number): Promise<Card[]> => {
    if (!db) return [];
    
    const result = await db.getAllAsync(
      'SELECT * FROM cards WHERE deck_id = ? ORDER BY id',
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
    back: string,
    difficulty?: number,
    lastReviewed?: string,
    nextReview?: string,
    reviewCount?: number
  ): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    const updates: string[] = [];
    const values: any[] = [];
    
    updates.push('front = ?', 'back = ?');
    values.push(front, back);
    
    if (difficulty !== undefined) {
      updates.push('difficulty = ?');
      values.push(difficulty);
    }
    
    if (lastReviewed !== undefined) {
      updates.push('last_reviewed = ?');
      values.push(lastReviewed);
    }
    
    if (nextReview !== undefined) {
      updates.push('next_review = ?');
      values.push(nextReview);
    }
    
    if (reviewCount !== undefined) {
      updates.push('review_count = ?');
      values.push(reviewCount);
    }
    
    values.push(id);
    
    await db.runAsync(
      `UPDATE cards SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
  };

  const deleteCard = async (id: number): Promise<void> => {
    if (!db) throw new Error('Database not initialized');
    
    await db.runAsync('DELETE FROM cards WHERE id = ?', [id]);
  };

  // Study operations
  const getCardsForReview = async (deckId: number): Promise<Card[]> => {
    if (!db) return [];
    
    const now = new Date().toISOString();
    
    // Get all cards that are either new (never reviewed) or due for review
    const result = await db.getAllAsync(
      `SELECT * FROM cards 
       WHERE deck_id = ? 
       AND (last_reviewed IS NULL OR next_review IS NULL OR next_review <= ?)
       ORDER BY 
         CASE WHEN last_reviewed IS NULL THEN 0 ELSE 1 END,
         next_review ASC, 
         id ASC`,
      [deckId, now]
    );
    console.log(`Cards for review in deck ${deckId}:`, result.length, 'cards found');
    
    // If no cards are due, return all cards in the deck for study
    if (result.length === 0) {
      const allCards = await db.getAllAsync(
        'SELECT * FROM cards WHERE deck_id = ? ORDER BY id ASC',
        [deckId]
      );
      console.log(`No cards due, returning all ${allCards.length} cards for study`);
      return allCards as Card[];
    }
    
    return result as Card[];
  };

  const getDeckStats = async (deckId: number) => {
    if (!db) return { total: 0, due: 0, new: 0 };
    
    const total = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM cards WHERE deck_id = ?',
      [deckId]
    ) as { count: number };
    
    const now = new Date().toISOString();
    const due = await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM cards 
       WHERE deck_id = ? 
       AND next_review IS NOT NULL 
       AND next_review <= ?`,
      [deckId, now]
    ) as { count: number };
    
    const newCards = await db.getFirstAsync(
      'SELECT COUNT(*) as count FROM cards WHERE deck_id = ? AND last_reviewed IS NULL',
      [deckId]
    ) as { count: number };
    
    return {
      total: total.count,
      due: due.count,
      new: newCards.count,
    };
  };

  return {
    db,
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
    getDeckStats,
  };
}
