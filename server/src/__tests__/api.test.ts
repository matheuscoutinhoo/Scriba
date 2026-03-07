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

describe('Notes API', () => {
   let db: Database;
   let app: ReturnType<typeof createApp>;

   beforeEach(async () => {
      db = await createTestDb();
      app = createApp(db);
   });

   afterEach(() => {
      db.close();
   });

   describe('GET /api/health', () => {
      it('should return health status', async () => {
         const res = await request(app).get('/api/health');
         expect(res.status).toBe(200);
         expect(res.body.status).toBe('ok');
      });
   });

   describe('POST /api/notes', () => {
      it('should create a new note', async () => {
         const res = await request(app)
            .post('/api/notes')
            .send({ title: 'My Note', content: '# Hello' });

         expect(res.status).toBe(201);
         expect(res.body.data.title).toBe('My Note');
         expect(res.body.data.content).toBe('# Hello');
         expect(res.body.data.id).toBeDefined();
      });

      it('should reject empty title', async () => {
         const res = await request(app)
            .post('/api/notes')
            .send({ title: '' });

         expect(res.status).toBe(400);
      });

      it('should create note with tags', async () => {
         const res = await request(app)
            .post('/api/notes')
            .send({ title: 'Tagged', content: 'content', tags: ['dev', 'react'] });

         expect(res.status).toBe(201);
         expect(res.body.data.tags).toHaveLength(2);
      });
   });

   describe('GET /api/notes', () => {
      it('should return all notes', async () => {
         await request(app).post('/api/notes').send({ title: 'Note 1' });
         await request(app).post('/api/notes').send({ title: 'Note 2' });

         const res = await request(app).get('/api/notes');
         expect(res.status).toBe(200);
         expect(res.body.data).toHaveLength(2);
      });
   });

   describe('GET /api/notes/:id', () => {
      it('should return a single note', async () => {
         const created = await request(app)
            .post('/api/notes')
            .send({ title: 'Single Note' });

         const res = await request(app).get(`/api/notes/${created.body.data.id}`);
         expect(res.status).toBe(200);
         expect(res.body.data.title).toBe('Single Note');
      });

      it('should return 404 for non-existent note', async () => {
         const res = await request(app).get('/api/notes/non-existent');
         expect(res.status).toBe(404);
      });
   });

   describe('PUT /api/notes/:id', () => {
      it('should update a note', async () => {
         const created = await request(app)
            .post('/api/notes')
            .send({ title: 'Old Title' });

         const res = await request(app)
            .put(`/api/notes/${created.body.data.id}`)
            .send({ title: 'New Title' });

         expect(res.status).toBe(200);
         expect(res.body.data.title).toBe('New Title');
      });

      it('should pin a note', async () => {
         const created = await request(app)
            .post('/api/notes')
            .send({ title: 'Pin Me' });

         const res = await request(app)
            .put(`/api/notes/${created.body.data.id}`)
            .send({ is_pinned: true });

         expect(res.status).toBe(200);
         expect(res.body.data.is_pinned).toBe(1);
      });
   });

   describe('DELETE /api/notes/:id', () => {
      it('should delete a note', async () => {
         const created = await request(app)
            .post('/api/notes')
            .send({ title: 'Delete Me' });

         const res = await request(app).delete(`/api/notes/${created.body.data.id}`);
         expect(res.status).toBe(204);

         const getRes = await request(app).get(`/api/notes/${created.body.data.id}`);
         expect(getRes.status).toBe(404);
      });
   });
});

describe('Categories API', () => {
   let db: Database;
   let app: ReturnType<typeof createApp>;

   beforeEach(async () => {
      db = await createTestDb();
      app = createApp(db);
   });

   afterEach(() => {
      db.close();
   });

   describe('POST /api/categories', () => {
      it('should create a category', async () => {
         const res = await request(app)
            .post('/api/categories')
            .send({ name: 'Development' });

         expect(res.status).toBe(201);
         expect(res.body.data.name).toBe('Development');
         expect(res.body.data.slug).toBe('development');
      });
   });

   describe('GET /api/categories', () => {
      it('should return all categories as tree', async () => {
         const parent = await request(app)
            .post('/api/categories')
            .send({ name: 'Tech' });

         await request(app)
            .post('/api/categories')
            .send({ name: 'Frontend', parent_id: parent.body.data.id });

         const res = await request(app).get('/api/categories');
         expect(res.status).toBe(200);
         expect(res.body.data).toHaveLength(1);
         expect(res.body.data[0].children).toHaveLength(1);
      });
   });

   describe('PUT /api/categories/:id', () => {
      it('should update a category', async () => {
         const created = await request(app)
            .post('/api/categories')
            .send({ name: 'Old' });

         const res = await request(app)
            .put(`/api/categories/${created.body.data.id}`)
            .send({ name: 'New', color: '#3b82f6' });

         expect(res.status).toBe(200);
         expect(res.body.data.name).toBe('New');
         expect(res.body.data.color).toBe('#3b82f6');
      });
   });

   describe('DELETE /api/categories/:id', () => {
      it('should delete a category', async () => {
         const created = await request(app)
            .post('/api/categories')
            .send({ name: 'Delete Me' });

         const res = await request(app).delete(`/api/categories/${created.body.data.id}`);
         expect(res.status).toBe(204);
      });
   });
});
