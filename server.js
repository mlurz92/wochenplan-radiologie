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
    plan TEXT,
    notes TEXT,
    UNIQUE(year, week)
  )`);
}

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
app.listen(port, '0.0.0.0', () => {
  console.log(`Server läuft auf http://0.0.0.0:${port}`);
});
