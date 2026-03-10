import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.NODE_ENV === "production" 
  ? path.join(__dirname, "data", "wedding.db") 
  : "wedding.db";

// Ensure the directory exists for the database
if (process.env.NODE_ENV === "production") {
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
}

const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS rsvps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    guests INTEGER NOT NULL,
    attendance TEXT NOT NULL,
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/rsvp", (req, res) => {
    const { name, guests, attendance, message } = req.body;
    
    if (!name || !attendance) {
      return res.status(400).json({ error: "Nome e partecipazione sono richiesti" });
    }

    try {
      const stmt = db.prepare("INSERT INTO rsvps (name, guests, attendance, message) VALUES (?, ?, ?, ?)");
      stmt.run(name, guests || 1, attendance, message || "");
      res.json({ success: true });
    } catch (error) {
      console.error("RSVP Error:", error);
      res.status(500).json({ error: "Errore durante il salvataggio della risposta" });
    }
  });

  app.get("/api/rsvps", (req, res) => {
    // In a real app, you'd protect this route
    const rsvps = db.prepare("SELECT * FROM rsvps ORDER BY created_at DESC").all();
    res.json(rsvps);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
