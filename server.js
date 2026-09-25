import express from "express";
import Database from "better-sqlite3";
import { customAlphabet } from "nanoid";

const app = express();
app.use(express.json());
app.use(express.static("public"));

const db = new Database("urls.db");
db.exec(`CREATE TABLE IF NOT EXISTS urls (
  code TEXT PRIMARY KEY,
  long_url TEXT NOT NULL,
  clicks INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

const makeCode = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ", 7
);

app.post("/api/shorten", (req, res) => {
  const { url } = req.body;

  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const code = makeCode();
  db.prepare("INSERT INTO urls (code, long_url) VALUES (?, ?)").run(code, url);
  res.json({ shortUrl: `${req.protocol}://${req.get("host")}/${code}` });
});

app.get("/:code", (req, res) => {
  const row = db.prepare("SELECT long_url FROM urls WHERE code = ?").get(req.params.code);
  if (!row) return res.status(404).send("Not found");
  db.prepare("UPDATE urls SET clicks = clicks + 1 WHERE code = ?").run(req.params.code);
  res.redirect(302, row.long_url);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));