const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Verbindung zur SQLite-Datenbank herstellen
const db = new sqlite3.Database(process.env.DATABASE_URL, (err) => {
    if (err) {
        console.error('Fehler beim Verbinden zur Datenbank:', err.message);
    } else {
        console.log('Verbunden zur SQLite-Datenbank.');
    }
});

// Tabelle erstellen, falls sie nicht existiert
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS plans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        year INTEGER NOT NULL,
        week INTEGER NOT NULL,
        data TEXT NOT NULL,
        UNIQUE(year, week)
    )`);
});

// API-Endpunkt zum Speichern des Wochenplans
app.post('/api/save-plan', (req, res) => {
    const { year, week, ...planData } = req.body;
    const data = JSON.stringify(planData);

    const sql = `INSERT INTO plans (year, week, data)
                 VALUES (?, ?, ?)
                 ON CONFLICT(year, week) DO UPDATE SET data=excluded.data`;

    db.run(sql, [year, week, data], function(err) {
        if (err) {
            console.error('Fehler beim Speichern des Plans:', err.message);
            res.status(500).json({ error: 'Fehler beim Speichern des Plans' });
        } else {
            res.status(200).json({ message: 'Plan erfolgreich gespeichert' });
        }
    });
});

// API-Endpunkt zum Laden des Wochenplans
app.get('/api/load-plan', (req, res) => {
    const { year, week } = req.query;

    const sql = `SELECT data FROM plans WHERE year = ? AND week = ?`;

    db.get(sql, [year, week], (err, row) => {
        if (err) {
            console.error('Fehler beim Laden des Plans:', err.message);
            res.status(500).json({ error: 'Fehler beim Laden des Plans' });
        } else if (row) {
            res.status(200).json(JSON.parse(row.data));
        } else {
            res.status(404).json({ error: 'Plan nicht gefunden' });
        }
    });
});

// API-Endpunkt zum Abrufen aller Pläne (für Editor-Modus)
app.get('/api/get-all-plans', (req, res) => {
    const sql = `SELECT year, week, data FROM plans`;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Fehler beim Abrufen aller Pläne:', err.message);
            res.status(500).json({ error: 'Fehler beim Abrufen aller Pläne' });
        } else {
            const allPlans = rows.map(row => ({
                year: row.year,
                week: row.week,
                ...JSON.parse(row.data)
            }));
            res.status(200).json(allPlans);
        }
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
