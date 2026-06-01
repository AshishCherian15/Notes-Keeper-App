import express, { Request, Response, NextFunction } from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-dev";

const db = new Database("notes.db", { verbose: console.log });
db.pragma("journal_mode = WAL");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Authentication Middleware
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user as { id: number; username: string };
    next();
  });
};

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: { id: number; username: string };
    }
  }
}

async function startServer() {
  try {
    const adminCheck = db.prepare("SELECT * FROM users WHERE username = 'admin'").get();
    if (!adminCheck) {
      const hashedPassword = await bcrypt.hash('admin', 10);
      const info = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)").run('admin', hashedPassword);
      const adminId = info.lastInsertRowid;

      const notes = [
        { title: 'Welcome to Notes Keeper! 🚀', content: 'This is your beautifully designed, fast, and secure place to store thoughts.\n\nFeatures:\n- Real-time save\n- Instant search\n- Colorful organization' },
        { title: 'Meeting Notes: Project Alpha 📊', content: 'Key takeaways from the sync:\n1. Move the launch to next Tuesday.\n2. Update the color palette to be more vibrant.\n3. Ensure mobile responsiveness is flawless.' },
        { title: 'Ideas for the weekend 🌴', content: '- Read that new sci-fi book\n- Try baking sourdough\n- Go for a long hike if the weather is nice' },
        { title: 'Shopping List 🛒', content: '- Almond milk\n- Avocados\n- Sriracha\n- Coffee beans' }
      ];

      const insertNote = db.prepare("INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)");
      notes.forEach(n => insertNote.run(adminId, n.title, n.content));
      console.log('Database seeded with admin user (admin / admin).');
    }
  } catch (err) {
    console.error('Failed to seed db:', err);
  }

  const app = express();

  app.use(cors());
  app.use(express.json());

  // API Routes

  // --- AUTH ROUTES ---
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const stmtCheck = db.prepare("SELECT * FROM users WHERE username = ?");
      const existingUser = stmtCheck.get(username);
      if (existingUser) {
        return res.status(409).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const stmtInsert = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
      const info = stmtInsert.run(username, hashedPassword);

      const token = jwt.sign({ id: info.lastInsertRowid, username }, JWT_SECRET, { expiresIn: "7d" });
      res.status(201).json({ token, user: { id: info.lastInsertRowid, username } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      const stmtCheck = db.prepare("SELECT * FROM users WHERE username = ?");
      const user = stmtCheck.get(username) as any;
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });
      res.status(200).json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req, res) => {
    res.json({ user: req.user });
  });

  // --- NOTES ROUTES ---
  app.get("/api/notes", authenticateToken, (req, res) => {
    try {
      const { q } = req.query;
      const userId = req.user!.id;
      
      let notes;
      if (q && typeof q === 'string') {
        const stmt = db.prepare(`
          SELECT * FROM notes 
          WHERE user_id = ? AND (title LIKE ? OR content LIKE ?) 
          ORDER BY updated_at DESC
        `);
        const searchParam = `%${q}%`;
        notes = stmt.all(userId, searchParam, searchParam);
      } else {
        const stmt = db.prepare(`
          SELECT * FROM notes 
          WHERE user_id = ? 
          ORDER BY updated_at DESC
        `);
        notes = stmt.all(userId);
      }
      res.json(notes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch notes" });
    }
  });

  app.post("/api/notes", authenticateToken, (req, res) => {
    try {
      const { title, content } = req.body;
      const userId = req.user!.id;

      if (!title) {
        return res.status(400).json({ error: "Title is required" });
      }

      const stmt = db.prepare("INSERT INTO notes (user_id, title, content) VALUES (?, ?, ?)");
      const info = stmt.run(userId, title, content || "");
      
      const newNote = db.prepare("SELECT * FROM notes WHERE id = ?").get(info.lastInsertRowid);
      res.status(201).json(newNote);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create note" });
    }
  });

  app.put("/api/notes/:id", authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;
      const userId = req.user!.id;

      const stmtCheck = db.prepare("SELECT * FROM notes WHERE id = ? AND user_id = ?");
      const existingNote = stmtCheck.get(id, userId);
      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      const stmtUpdate = db.prepare(`
        UPDATE notes 
        SET title = coalesce(?, title), 
            content = coalesce(?, content), 
            updated_at = CURRENT_TIMESTAMP 
        WHERE id = ? AND user_id = ?
      `);
      stmtUpdate.run(title, content, id, userId);

      const updatedNote = db.prepare("SELECT * FROM notes WHERE id = ?").get(id);
      res.json(updatedNote);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to update note" });
    }
  });

  app.delete("/api/notes/:id", authenticateToken, (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const stmtCheck = db.prepare("SELECT * FROM notes WHERE id = ? AND user_id = ?");
      const existingNote = stmtCheck.get(id, userId);
      if (!existingNote) {
        return res.status(404).json({ error: "Note not found" });
      }

      const stmtDelete = db.prepare("DELETE FROM notes WHERE id = ? AND user_id = ?");
      stmtDelete.run(id, userId);

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete note" });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
