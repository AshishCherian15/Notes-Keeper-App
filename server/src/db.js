import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '..', 'data');
const dbFile = path.join(dataDir, 'notes.db');

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    bio TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_notes_user_updated ON notes(user_id, updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_notes_user_title ON notes(user_id, title);
`);

function mapUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    bio: row.bio ?? '',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function mapNote(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    preview: (row.content || '').trim().slice(0, 160) || 'Start typing to add details.'
  };
}

export function createUser({ name, email, passwordHash }) {
  const statement = db.prepare(`
    INSERT INTO users (name, email, password_hash)
    VALUES (@name, @email, @passwordHash)
  `);

  const result = statement.run({ name, email, passwordHash });
  return getUserById(result.lastInsertRowid);
}

export function getUserByEmail(email) {
  const row = db.prepare('SELECT * FROM users WHERE lower(email) = lower(?)').get(email);
  return row ?? null;
}

export function getUserById(userId) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  return mapUser(row);
}

export function updateUserProfile(userId, { name, bio }) {
  db.prepare(`
    UPDATE users
    SET name = ?, bio = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(name, bio ?? '', userId);

  return getUserById(userId);
}

export function listNotes(userId, search = '') {
  const searchTerm = `%${search.trim()}%`;
  const rows = search.trim()
    ? db.prepare(`
        SELECT * FROM notes
        WHERE user_id = ? AND (title LIKE ? OR content LIKE ?)
        ORDER BY updated_at DESC, id DESC
      `).all(userId, searchTerm, searchTerm)
    : db.prepare(`
        SELECT * FROM notes
        WHERE user_id = ?
        ORDER BY updated_at DESC, id DESC
      `).all(userId);

  return rows.map(mapNote);
}

export function createNote(userId, { title, content }) {
  const result = db.prepare(`
    INSERT INTO notes (user_id, title, content)
    VALUES (?, ?, ?)
  `).run(userId, title, content ?? '');

  return getNoteById(userId, result.lastInsertRowid);
}

export function updateNote(userId, noteId, { title, content }) {
  db.prepare(`
    UPDATE notes
    SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(title, content ?? '', noteId, userId);

  return getNoteById(userId, noteId);
}

export function deleteNote(userId, noteId) {
  db.prepare('DELETE FROM notes WHERE id = ? AND user_id = ?').run(noteId, userId);
}

export function getNoteById(userId, noteId) {
  const row = db.prepare('SELECT * FROM notes WHERE id = ? AND user_id = ?').get(noteId, userId);
  return mapNote(row);
}
