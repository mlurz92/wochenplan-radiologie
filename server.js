require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// SQLite-Datenbankverbindung
const db = new sqlite3.Database('./wochenplan.db', (err) => {
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
    day INTEGER,
    plan TEXT,
    notes TEXT,
    UNIQUE(year, week, day)
  )`);
}

// Wochenplan speichern
app.post('/api/save-plan', (req, res) => {
  const { year, week, ...dayPlans } = req.body;

  const stmt = db.prepare(`INSERT OR REPLACE INTO wochenplaene (year, week, day, plan, notes) VALUES (?, ?, ?, ?, ?)`);

  Object.entries(dayPlans).forEach(([day, dayPlan]) => {
    const planJson = JSON.stringify(dayPlan);
    const notes = dayPlan.notes || '';
    stmt.run(year, week, day, planJson, notes);
  });

  stmt.finalize((err) => {
    if (err) {
      res.status(500).json({ error: 'Fehler beim Speichern des Plans' });
      return console.error(err.message);
    }
    res.json({ message: 'Plan erfolgreich gespeichert' });
  });
});

// Wochenplan laden
app.get('/api/load-plan', (req, res) => {
  const { year, week } = req.query;

  db.all(`SELECT day, plan, notes FROM wochenplaene WHERE year = ? AND week = ?`, [year, week], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Fehler beim Laden des Plans' });
      return console.error(err.message);
    }
    if (rows.length > 0) {
      const weekPlan = { year: parseInt(year), week: parseInt(week) };
      rows.forEach(row => {
        weekPlan[row.day] = { ...JSON.parse(row.plan), notes: row.notes };
      });
      res.json(weekPlan);
    } else {
      res.status(404).json({ error: 'Plan nicht gefunden' });
    }
  });
});

// Alle Wochenpläne abrufen
app.get('/api/get-all-plans', (req, res) => {
  db.all(`SELECT year, week, day, plan, notes FROM wochenplaene`, [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: 'Fehler beim Abrufen der Wochenpläne' });
      return console.error(err.message);
    }
    const plans = rows.map(row => ({
      year: row.year,
      week: row.week,
      day: row.day,
      ...JSON.parse(row.plan),
      notes: row.notes
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
app.listen(port, '0.0.0.0', () => {
  console.log(`Server läuft auf http://0.0.0.0:${port}`);
});
