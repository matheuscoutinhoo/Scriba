import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import initSqlJs, { type Database } from 'sql.js';
import { initializeSchema, execute } from '../database/connection';
import { createApp } from '../app';

async function createTestDb(): Promise<Database> {
   const SQL = await initSqlJs();
   const db = new SQL.Database();
   db.run('PRAGMA foreign_keys = ON');
   initializeSchema(db);
   execute(db,
      `INSERT INTO users (id, username, email, password_hash, display_name) VALUES (?, ?, ?, ?, ?)`,
      ['default-user', 'scriba', 'scriba@local', 'hash', 'Scriba User']
   );
   return db;
}

describe('Notes API - Search', () => {
   let db: Database;
   let app: ReturnType<typeof createApp>;

   beforeEach(async () => {
      db = await createTestDb();
      app = createApp(db);
   });

   afterEach(() => {
      db.close();
   });

   it('should search notes by title', async () => {
      await request(app).post('/api/notes').send({ title: 'JavaScript Guide', content: 'Learn JS' });
      await request(app).post('/api/notes').send({ title: 'Python Guide', content: 'Learn Python' });

      const res = await request(app).get('/api/notes/search?q=JavaScript');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('JavaScript Guide');
      expect(res.body.total).toBe(1);
   });

   it('should search notes by content', async () => {
      await request(app).post('/api/notes').send({ title: 'Note', content: 'React hooks are amazing' });
      await request(app).post('/api/notes').send({ title: 'Other', content: 'Vue composition API' });

      const res = await request(app).get('/api/notes/search?q=hooks');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
   });

   it('should return empty results for no match', async () => {
      await request(app).post('/api/notes').send({ title: 'Note', content: 'content' });

      const res = await request(app).get('/api/notes/search?q=nonexistent');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
      expect(res.body.total).toBe(0);
   });

   it('should respect limit parameter', async () => {
      for (let i = 0; i < 5; i++) {
         await request(app).post('/api/notes').send({ title: `Test Note ${i}`, content: 'searchable' });
      }

      const res = await request(app).get('/api/notes/search?q=searchable&limit=2');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.total).toBe(5);
   });

   it('should respect offset parameter', async () => {
      for (let i = 0; i < 5; i++) {
         await request(app).post('/api/notes').send({ title: `Note ${i}`, content: 'findme' });
      }

      const res = await request(app).get('/api/notes/search?q=findme&limit=2&offset=3');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
   });

   it('should reject missing query parameter', async () => {
      const res = await request(app).get('/api/notes/search');
      expect(res.status).toBe(400);
   });

   it('should reject empty query parameter', async () => {
      const res = await request(app).get('/api/notes/search?q=');
      expect(res.status).toBe(400);
   });
});

describe('Notes API - Validation Errors', () => {
   let db: Database;
   let app: ReturnType<typeof createApp>;

   beforeEach(async () => {
      db = await createTestDb();
      app = createApp(db);
   });

   afterEach(() => {
      db.close();
   });

   it('should reject create with missing body', async () => {
      const res = await request(app).post('/api/notes').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
   });

   it('should reject create with invalid category_id', async () => {
      const res = await request(app)
         .post('/api/notes')
         .send({ title: 'Note', category_id: 'not-a-uuid' });
      expect(res.status).toBe(400);
   });

   it('should reject update with invalid is_pinned type', async () => {
      const created = await request(app)
         .post('/api/notes')
         .send({ title: 'Note' });

      const res = await request(app)
         .put(`/api/notes/${created.body.data.id}`)
         .send({ is_pinned: 'yes' });
      expect(res.status).toBe(400);
   });

   it('should return 404 when updating non-existent note', async () => {
      const res = await request(app)
         .put('/api/notes/non-existent-id')
         .send({ title: 'Updated' });
      expect(res.status).toBe(404);
   });

   it('should return 404 when deleting non-existent note', async () => {
      const res = await request(app).delete('/api/notes/non-existent-id');
      expect(res.status).toBe(404);
   });
});

describe('Categories API - Validation Errors', () => {
   let db: Database;
   let app: ReturnType<typeof createApp>;

   beforeEach(async () => {
      db = await createTestDb();
      app = createApp(db);
   });

   afterEach(() => {
      db.close();
   });

   it('should reject create with missing name', async () => {
      const res = await request(app).post('/api/categories').send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation failed');
   });

   it('should reject create with empty name', async () => {
      const res = await request(app).post('/api/categories').send({ name: '' });
      expect(res.status).toBe(400);
   });

   it('should reject create with invalid color', async () => {
      const res = await request(app)
         .post('/api/categories')
         .send({ name: 'Test', color: 'not-a-color' });
      expect(res.status).toBe(400);
   });

   it('should return 404 when getting non-existent category', async () => {
      const res = await request(app).get('/api/categories/non-existent-id');
      expect(res.status).toBe(404);
   });

   it('should return 404 when updating non-existent category', async () => {
      const res = await request(app)
         .put('/api/categories/non-existent-id')
         .send({ name: 'Updated' });
      expect(res.status).toBe(404);
   });

   it('should return 404 when deleting non-existent category', async () => {
      const res = await request(app).delete('/api/categories/non-existent-id');
      expect(res.status).toBe(404);
   });

   it('should apply default color when not provided', async () => {
      const res = await request(app)
         .post('/api/categories')
         .send({ name: 'No Color' });
      expect(res.status).toBe(201);
      expect(res.body.data.color).toBe('#e11d48');
   });
});

describe('Notes API - Tags and Categories', () => {
   let db: Database;
   let app: ReturnType<typeof createApp>;

   beforeEach(async () => {
      db = await createTestDb();
      app = createApp(db);
   });

   afterEach(() => {
      db.close();
   });

   it('should update tags on a note', async () => {
      const created = await request(app)
         .post('/api/notes')
         .send({ title: 'Tagged', tags: ['original'] });

      const res = await request(app)
         .put(`/api/notes/${created.body.data.id}`)
         .send({ tags: ['new-tag-1', 'new-tag-2'] });

      expect(res.status).toBe(200);
      expect(res.body.data.tags).toHaveLength(2);
      expect(res.body.data.tags.map((t: { name: string }) => t.name)).not.toContain('original');
   });

   it('should create note in a category', async () => {
      const cat = await request(app)
         .post('/api/categories')
         .send({ name: 'Work' });

      const res = await request(app)
         .post('/api/notes')
         .send({ title: 'Work Note', category_id: cat.body.data.id });

      expect(res.status).toBe(201);
      expect(res.body.data.category_id).toBe(cat.body.data.id);
   });

   it('should filter notes by category', async () => {
      const cat = await request(app)
         .post('/api/categories')
         .send({ name: 'Dev' });

      await request(app)
         .post('/api/notes')
         .send({ title: 'Dev Note', category_id: cat.body.data.id });
      await request(app)
         .post('/api/notes')
         .send({ title: 'No Cat Note' });

      const res = await request(app).get(`/api/notes?category_id=${cat.body.data.id}`);
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe('Dev Note');
   });

   it('should archive and unarchive a note', async () => {
      const created = await request(app)
         .post('/api/notes')
         .send({ title: 'Archive Test' });

      await request(app)
         .put(`/api/notes/${created.body.data.id}`)
         .send({ is_archived: true });

      const archived = await request(app).get('/api/notes?archived=true');
      expect(archived.body.data).toHaveLength(1);

      const active = await request(app).get('/api/notes?archived=false');
      expect(active.body.data).toHaveLength(0);
   });
});
