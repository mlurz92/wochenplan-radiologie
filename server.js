// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.use(cors({
  origin: 'https://wochenplan-radiologie.de', // Ersetzen Sie dies durch Ihre tatsächliche Domain
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(bodyParser.json());

// SQLite-Datenbankverbindung
const dbPath = process.env.DATABASE_URL || './wochenplan.db';
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Fehler beim Öffnen der Datenbank:', err.message);
  } else {
    console.log('Verbindung zur SQLite-Datenbank hergestellt.');
    initializeDatabase();
  }
});

// Datenbanktabelle initialisieren
function initializeDatabase() {
  db.run(`CREATE TABLE IF NOT EXISTS wochenplaene (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER,
    week INTEGER,
    plan TEXT,
    notes TEXT,
    UNIQUE(year, week)
  )`);
}

// Basic Authentication Middleware für den Editor-Modus
app.use('/editor.html', basicAuth({
  users: { 'editor': 'Kandinsky1!' },
  challenge: true,
  realm: 'Editor Bereich'
}));

// Optional: Basic Authentication Middleware für den Viewer-Modus
app.use('/', basicAuth({
  users: { 'viewer': 'Radiologie1!' },
  challenge: true,
  realm: 'Viewer Bereich'
}));

// Wochenplan speichern
app.post('/api/save-plan', (req, res) => {
  const { year, week, notes, ...planData } = req.body;
  const planJson = JSON.stringify(planData);

  db.run(`INSERT OR REPLACE INTO wochenplaene (year, week, plan, notes) VALUES (?, ?, ?, ?)`,
    [year, week, planJson, notes],
    function(err) {
      if (err) {
        res.status(500).json({ error: 'Fehler beim Speichern des Plans' });
        return console.error(err.message);
      }
      res.json({ message: 'Plan erfolgreich gespeichert', id: this.lastID });
    }
  );
});

// Wochenplan laden
app.get('/api/load-plan', (req, res) => {
  const { year, week } = req.query;

  db.get(`SELECT plan, notes FROM wochenplaene WHERE year = ? AND week = ?`, [year, week], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Fehler beim Laden des Plans' });
      return console.error(err.message);
    }
    if (row) {
      res.json({ ...JSON.parse(row.plan), notes: row.notes });
    } else {
      res.status(404).json({ error: 'Plan nicht gefunden' });
    }
  });
});

// Alle Wochenpläne abrufen
app.get('/api/get-all-plans', (req, res) => {
  db.all(`SELECT year, week, plan FROM wochenplaene`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Wochenpläne' });
      return console.error(err.message);
    }
    const plans = rows.map(row => ({
      year: row.year,
      week: row.week,
      ...JSON.parse(row.plan)
    }));
    res.json(plans);
  });
});

// Statische Dateien servieren
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all Route für das Frontend-Routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// HTTP-Server starten
app.listen(port, host, () => {
  console.log(`Server läuft auf http://${host}:${port}`);
});
