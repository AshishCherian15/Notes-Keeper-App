import cors from 'cors';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jwt from 'jsonwebtoken';
import {
  createNote,
  createUser,
  deleteNote,
  getUserByEmail,
  getUserById,
  listNotes,
  updateNote,
  updateUserProfile
} from './db.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 4000);
const jwtSecret = process.env.JWT_SECRET || 'notes-keeper-dev-secret';
const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDist = path.resolve(__dirname, '../../client/dist');

app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: '1mb' }));

function createToken(user) {
  return jwt.sign({ sub: user.id }, jwtSecret, { expiresIn: '7d' });
}

function toSafeUser(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    bio: user.bio ?? '',
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

function authRequired(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = getUserById(payload.sub);

    if (!user) {
      return res.status(401).json({ error: 'Session expired. Please sign in again.' });
    }

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid session token.' });
  }
}

app.get('/api/health', (_, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (!name?.trim() || !email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existingUser = getUserByEmail(email);
  if (existingUser) {
    return res.status(409).json({ error: 'An account with that email already exists.' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = createUser({ name: name.trim(), email: email.trim().toLowerCase(), passwordHash });
  const token = createToken(user);

  return res.status(201).json({ token, user: toSafeUser(user) });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email?.trim() || !password?.trim()) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = getUserByEmail(email.trim().toLowerCase());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  return res.json({ token: createToken(user), user: toSafeUser(user) });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  return res.json({ user: toSafeUser(req.user) });
});

app.put('/api/profile', authRequired, (req, res) => {
  const { name, bio } = req.body ?? {};

  if (!name?.trim()) {
    return res.status(400).json({ error: 'Display name is required.' });
  }

  const user = updateUserProfile(req.user.id, {
    name: name.trim(),
    bio: bio?.trim() ?? ''
  });

  return res.json({ user });
});

app.get('/api/notes', authRequired, (req, res) => {
  const search = typeof req.query.q === 'string' ? req.query.q : '';
  return res.json({ notes: listNotes(req.user.id, search) });
});

app.post('/api/notes', authRequired, (req, res) => {
  const { title, content } = req.body ?? {};
  const note = createNote(req.user.id, {
    title: title?.trim() || 'Untitled note',
    content: content ?? ''
  });

  return res.status(201).json({ note });
});

app.put('/api/notes/:id', authRequired, (req, res) => {
  const noteId = Number(req.params.id);
  const { title, content } = req.body ?? {};

  if (!Number.isFinite(noteId)) {
    return res.status(400).json({ error: 'Invalid note identifier.' });
  }

  const note = updateNote(req.user.id, noteId, {
    title: title?.trim() || 'Untitled note',
    content: content ?? ''
  });

  if (!note) {
    return res.status(404).json({ error: 'Note not found.' });
  }

  return res.json({ note });
});

app.delete('/api/notes/:id', authRequired, (req, res) => {
  const noteId = Number(req.params.id);

  if (!Number.isFinite(noteId)) {
    return res.status(400).json({ error: 'Invalid note identifier.' });
  }

  deleteNote(req.user.id, noteId);
  return res.status(204).send();
});

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    return res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

app.listen(port, () => {
  console.log(`Notes Keeper API running on http://localhost:${port}`);
});
