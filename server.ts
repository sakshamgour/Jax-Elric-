import express from "express";
import "dotenv/config";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("literary.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL, -- 'poetry' or 'novel'
    pdf_data TEXT, -- base64 encoded pdf
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    comment TEXT NOT NULL,
    rating INTEGER DEFAULT 5,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/content", (req, res) => {
    const content = db.prepare("SELECT * FROM content ORDER BY created_at DESC").all();
    res.json(content);
  });

  app.post("/api/content", (req, res) => {
    const { title, body, type, pdfData, adminKey } = req.body;
    const secret = process.env.ADMIN_SECRET || "jaxelricweb";
    
    // Simple admin check - in a real app this would be more robust
    if (adminKey !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!title || !body || !type) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const info = db.prepare("INSERT INTO content (title, body, type, pdf_data) VALUES (?, ?, ?, ?)").run(title, body, type, pdfData || null);
    res.json({ id: info.lastInsertRowid });
  });

  app.delete("/api/content/:id", (req, res) => {
    const { id } = req.params;
    const adminKey = req.headers["x-admin-key"];
    const secret = process.env.ADMIN_SECRET || "jaxelricweb";

    if (adminKey !== secret) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const info = db.prepare("DELETE FROM content WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: "Content not found" });
    }
    res.json({ success: true });
  });

  app.delete("/api/reviews/:id", (req, res) => {
    const { id } = req.params;
    // For reviews, we'll allow deletion without admin key for now as requested
    // but in a real app you'd want some verification.
    const info = db.prepare("DELETE FROM reviews WHERE id = ?").run(id);
    if (info.changes === 0) {
      return res.status(404).json({ error: "Review not found" });
    }
    res.json({ success: true });
  });

  app.get("/api/reviews", (req, res) => {
    const reviews = db.prepare("SELECT * FROM reviews ORDER BY created_at DESC").all();
    res.json(reviews);
  });

  app.post("/api/reviews", (req, res) => {
    const { name, comment, rating } = req.body;
    if (!name || !comment) {
      return res.status(400).json({ error: "Missing fields" });
    }
    const info = db.prepare("INSERT INTO reviews (name, comment, rating) VALUES (?, ?, ?)").run(name, comment, rating || 5);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
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
