const express  = require("express");
const cors     = require("cors");
const Database = require("better-sqlite3");
const path     = require("path");

const app  = express();
const PORT = 4000;

app.use(cors());
app.use(express.json());

// ── Database ─────────────────────────────────────────────────
const db = new Database(path.join(__dirname, "mahal.db"));
console.log("✅ Database connected!");

// ── Create table ─────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id             TEXT    PRIMARY KEY,
    name           TEXT    NOT NULL,
    phone          TEXT    NOT NULL,
    date           TEXT    NOT NULL,
    time           TEXT,
    eventType      TEXT,
    hall           TEXT,
    status         TEXT    DEFAULT 'pending',
    paymentStatus  TEXT    DEFAULT 'unpaid',
    rent           REAL    DEFAULT 0,
    radioSet       REAL    DEFAULT 0,
    cleaning       REAL    DEFAULT 0,
    electricity    REAL    DEFAULT 0,
    gas            REAL    DEFAULT 0,
    generator      REAL    DEFAULT 0,
    advance        REAL    DEFAULT 0,
    discount       REAL    DEFAULT 0
  )
`);

// ── Test route ───────────────────────────────────────────────
app.get("/", (req, res) => {
  res.send("🏛️ Piriyam Mahal API Running!");
});

// ── GET all bookings ─────────────────────────────────────────
// FIX: Added /api prefix + .all() was missing before
app.get("/api/bookings", (req, res) => {
  try {
    const rows = db.prepare("SELECT * FROM bookings ORDER BY date DESC").all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── POST new booking ─────────────────────────────────────────
// FIX: Added /api prefix + using TEXT id (not AUTOINCREMENT)
app.post("/api/bookings", (req, res) => {
  try {
    const {
      id, name, phone, date, time, eventType, hall,
      status, paymentStatus,
      rent, radioSet, cleaning, electricity,
      gas, generator, advance, discount
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO bookings
        (id, name, phone, date, time, eventType, hall, status, paymentStatus,
         rent, radioSet, cleaning, electricity, gas, generator, advance, discount)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      id, name, phone, date, time, eventType, hall,
      status    || "pending",
      paymentStatus || "unpaid",
      rent      || 0, radioSet   || 0, cleaning    || 0,
      electricity || 0, gas      || 0, generator   || 0,
      advance   || 0, discount   || 0
    );

    res.json({ id, message: "✅ Booking saved!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PUT update booking status / payment ──────────────────────
app.put("/api/booking/:id", (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    db.prepare(
      "UPDATE bookings SET status=?, paymentStatus=? WHERE id=?"
    ).run(status, paymentStatus, req.params.id);
    res.json({ message: "✅ Updated!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE booking ───────────────────────────────────────────
app.delete("/api/booking/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM bookings WHERE id=?").run(req.params.id);
    res.json({ message: "✅ Deleted!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start server ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log("🏛️  Piriyam Mahal API running!");
  console.log(`✅  http://localhost:${PORT}`);
  console.log(`📦  Database: mahal.db`);
});
