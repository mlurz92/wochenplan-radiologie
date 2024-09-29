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
    UNIQUE(year, week)
  )`);
}

// Wochenplan speichern
app.post('/api/save-plan', (req, res) => {
  const { year, week, ...planData } = req.body;
  const planJson = JSON.stringify(planData);

  db.run(`INSERT OR REPLACE INTO wochenplaene (year, week, plan) VALUES (?, ?, ?)`,
    [year, week, planJson],
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

  db.get(`SELECT plan FROM wochenplaene WHERE year = ? AND week = ?`, [year, week], (err, row) => {
    if (err) {
      res.status(500).json({ error: 'Fehler beim Laden des Plans' });
      return console.error(err.message);
    }
    if (row) {
      res.json(JSON.parse(row.plan));
    } else {
      res.status(404).json({ error: 'Plan nicht gefunden' });
    }
  });
});

// Statische Dateien servieren
app.use(express.static(path.join(__dirname, 'public')));

// Catch-all Route für das Frontend-Routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, '127.0.0.1', () => {
  console.log(`Server läuft auf http://127.0.0.1:${port}`);
});
