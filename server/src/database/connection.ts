import initSqlJs, { type Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

export type Database = SqlJsDatabase;

let db: Database | null = null;

export async function getDatabase(dbPath?: string): Promise<Database> {
   if (db) return db;

   const SQL = await initSqlJs();
   const resolvedPath = dbPath || path.resolve(process.cwd(), 'scriba.db');

   let data: Buffer | undefined;
   try {
      data = fs.readFileSync(resolvedPath);
   } catch {
      // DB file doesn't exist yet
   }

   db = data ? new SQL.Database(data) : new SQL.Database();
   db.run('PRAGMA foreign_keys = ON');

   return db;
}

export function saveDatabase(dbPath?: string): void {
   if (!db) return;
   const resolvedPath = dbPath || path.resolve(process.cwd(), 'scriba.db');
   const data = db.export();
   fs.writeFileSync(resolvedPath, Buffer.from(data));
}

export function closeDatabase(): void {
   if (db) {
      db.close();
      db = null;
   }
}

/** Helper: run a query and return all rows as objects */
export function queryAll<T = Record<string, unknown>>(database: Database, sql: string, params: unknown[] = []): T[] {
   const stmt = database.prepare(sql);
   stmt.bind(params.map(p => p === undefined ? null : p) as (string | number | null | Uint8Array)[]);
   const results: T[] = [];
   while (stmt.step()) {
      results.push(stmt.getAsObject() as T);
   }
   stmt.free();
   return results;
}

/** Helper: run a query and return the first row as object */
export function queryOne<T = Record<string, unknown>>(database: Database, sql: string, params: unknown[] = []): T | null {
   const stmt = database.prepare(sql);
   stmt.bind(params.map(p => p === undefined ? null : p) as (string | number | null | Uint8Array)[]);
   const result = stmt.step() ? (stmt.getAsObject() as T) : null;
   stmt.free();
   return result;
}

let batchDepth = 0;
let batchDirty = false;

/** Batch multiple execute() calls into a single saveDatabase() call */
export function batch<T>(fn: () => T): T {
   batchDepth++;
   try {
      const result = fn();
      return result;
   } finally {
      batchDepth--;
      if (batchDepth === 0 && batchDirty) {
         batchDirty = false;
         saveDatabase();
      }
   }
}

/** Helper: run a mutating query (INSERT/UPDATE/DELETE) */
export function execute(database: Database, sql: string, params: unknown[] = []): number {
   database.run(sql, params.map(p => p === undefined ? null : p) as (string | number | null | Uint8Array)[]);
   const changes = database.getRowsModified();
   if (changes > 0) {
      if (batchDepth > 0) batchDirty = true;
      else saveDatabase();
   }
   return changes;
}

export function initializeSchema(database: Database): void {
   database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      display_name TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

   database.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      color TEXT DEFAULT '#e11d48',
      icon TEXT,
      user_id TEXT NOT NULL,
      parent_id TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL,
      UNIQUE(slug, user_id)
    )
  `);

   database.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      excerpt TEXT,
      is_pinned INTEGER NOT NULL DEFAULT 0,
      is_archived INTEGER NOT NULL DEFAULT 0,
      user_id TEXT NOT NULL,
      category_id TEXT,
      position INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

   database.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(slug, user_id)
    )
  `);

   database.run(`
    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    )
  `);

   database.run('CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)');
   database.run('CREATE INDEX IF NOT EXISTS idx_notes_category_id ON notes(category_id)');
   database.run('CREATE INDEX IF NOT EXISTS idx_notes_created_at ON notes(created_at)');
   database.run('CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at)');
   database.run('CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id)');
   database.run('CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id)');
   database.run('CREATE INDEX IF NOT EXISTS idx_note_tags_note_id ON note_tags(note_id)');
   database.run('CREATE INDEX IF NOT EXISTS idx_note_tags_tag_id ON note_tags(tag_id)');
}
