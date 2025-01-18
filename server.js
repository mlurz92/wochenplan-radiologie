const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const helmet = require('helmet');
const app = express();
const port = 3000;
const path = require('path');
const saltRounds = 10; // Für bcrypt

// Sicherheits-Header setzen
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            styleSrc: ["'self'", "https://fonts.googleapis.com", "https://cdn.jsdelivr.net"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdn.jsdelivr.net"],
            imgSrc: ["'self'", "data:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        }
    },
    referrerPolicy: { policy: "same-origin" },
    // Weitere Einstellungen...
}));

// CORS-Header setzen (Cross-Origin Resource Sharing)
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Setze den Strict-Transport-Security-Header, um HSTS zu aktivieren
app.use(helmet.hsts({
    maxAge: 31536000, // 1 Jahr in Sekunden
    includeSubDomains: true,
    preload: true
}));

// Middleware, um JSON-Anfragen zu parsen
app.use(express.json());

// Statische Dateien im 'public'-Ordner bereitstellen
app.use(express.static(path.join(__dirname, 'public')));

// Erstelle eine neue Datenbankinstanz
const db = new sqlite3.Database('./data/wochenplan.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the wochenplan database.');
});

// Erstelle die Tabellen 'wochenplaene', 'passwoerter' und 'passwoerter_editor', falls sie noch nicht existieren und füge die Standardpasswörter ein
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS wochenplaene (
        jahr INTEGER NOT NULL,
        kw INTEGER NOT NULL,
        tag TEXT NOT NULL,
        mitarbeiter_name TEXT NOT NULL,
        arbeitsplatz TEXT,
        zusatzstatus TEXT,
        notizen TEXT,
        PRIMARY KEY (jahr, kw, tag, mitarbeiter_name)
    )`);

    const initialPassword = 'Radiologie1!';
    const editorPassword = 'Kandinsky1!';

    bcrypt.hash(initialPassword, saltRounds, (err, hash) => {
        if (err) {
            console.error('Fehler beim Hashen des Passworts:', err);
            return;
        }

        db.get(`SELECT * FROM passwoerter WHERE id = 1`, [], (err, row) => {
            if (err) {
                console.error('Fehler beim Abfragen der Tabelle passwoerter:', err);
                return;
            }

            if (!row) {
                db.run(`INSERT INTO passwoerter (hash) VALUES (?)`, [hash], function (err) {
                    if (err) {
                        console.error('Fehler beim Einfügen des Passworts in die Tabelle passwoerter:', err);
                    } else {
                        console.log('Initiales Passwort erfolgreich in die Datenbank eingefügt.');
                    }
                });
            } else {
                console.log('Initiales Passwort existiert bereits in der Datenbank.');
            }
        });
    });

    bcrypt.hash(editorPassword, saltRounds, (err, hash) => {
        if (err) {
            console.error('Fehler beim Hashen des Editor-Passworts:', err);
            return;
        }

        db.get(`SELECT * FROM passwoerter_editor WHERE id = 1`, [], (err, row) => {
            if (err) {
                console.error('Fehler beim Abfragen der Tabelle passwoerter_editor:', err);
                return;
            }

            if (!row) {
                db.run(`INSERT INTO passwoerter_editor (hash) VALUES (?)`, [hash], function (err) {
                    if (err) {
                        console.error('Fehler beim Einfügen des Editor-Passworts in die Tabelle passwoerter_editor:', err);
                    } else {
                        console.log('Editor-Passwort erfolgreich in die Datenbank eingefügt.');
                    }
                });
            } else {
                console.log('Editor-Passwort existiert bereits in der Datenbank.');
            }
        });
    });
});

// Session-Management (Beispiel mit einem einfachen Token)
let sessionToken = null;

// Middleware für Authentifizierung
const authenticate = (req, res, next) => {
    if (req.path.startsWith('/api/login') || req.path.startsWith('/api/logout')) {
        // Login und Logout sind immer erlaubt
        next();
    } else if (req.path.startsWith('/api/') && req.method !== 'GET' && req.header('Authorization') !== `Bearer ${sessionToken}`) {
        // Überprüfe, ob ein gültiger Token vorhanden ist, wenn es sich nicht um eine GET-Anfrage oder Login/Logout handelt
        res.status(401).json({ success: false, message: 'Authentifizierung erforderlich' });
    } else {
        // Nicht-API-Routen und GET-Anfragen sind erlaubt
        next();
    }
};

app.use(authenticate);

// API-Endpunkt zum Abrufen eines Wochenplans
app.get('/api/wochenplan/:jahr/:kw', (req, res) => {
    const { jahr, kw } = req.params;
    const sql = `SELECT * FROM wochenplaene WHERE jahr = ? AND kw = ?`;

    db.all(sql, [jahr, kw], (err, rows) => {
        if (err) {
            console.error("Fehler beim Abrufen des Wochenplans:", err.message);
            return res.status(500).json({ error: err.message });
        }

        const wochenplan = {};
        rows.forEach(row => {
            const tag = row.tag;
            if (!wochenplan[tag]) {
                wochenplan[tag] = {
                    arbeitsplaetze: {},
                    zusatzstatus: {},
                    notizen: row.notizen || ""
                };
            }

            if (row.arbeitsplatz) {
                if (!wochenplan[tag].arbeitsplaetze[row.arbeitsplatz]) {
                    wochenplan[tag].arbeitsplaetze[row.arbeitsplatz] = [];
                }
                wochenplan[tag].arbeitsplaetze[row.arbeitsplatz].push(row.mitarbeiter_name);
            }

            if (row.zusatzstatus) {
                if (!wochenplan[tag].zusatzstatus[row.zusatzstatus]) {
                    wochenplan[tag].zusatzstatus[row.zusatzstatus] = [];
                }
                wochenplan[tag].zusatzstatus[row.zusatzstatus].push(row.mitarbeiter_name);
            }
        });

        res.json(wochenplan);
    });
});

// API-Endpunkt zum Speichern eines Wochenplans
app.post('/api/wochenplan', (req, res) => {
    const { jahr, kw, wochenplan } = req.body;

    // Validierung der Eingabedaten
    if (!jahr || !kw || !wochenplan) {
        return res.status(400).json({ error: 'Jahr, Kalenderwoche und Wochenplan sind erforderlich' });
    }

    // Lösche zuerst die vorhandenen Einträge für die Woche
    const deleteSql = `DELETE FROM wochenplaene WHERE jahr = ? AND kw = ?`;
    db.run(deleteSql, [jahr, kw], (err) => {
        if (err) {
            console.error("Fehler beim Löschen des alten Wochenplans:", err.message);
            return res.status(500).json({ error: err.message });
        }

        // Speichere die neuen Einträge
        const insertSql = `INSERT INTO wochenplaene (jahr, kw, tag, mitarbeiter_name, arbeitsplatz, zusatzstatus, notizen) VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const wochentage = Object.keys(wochenplan);

        wochentage.forEach(tag => {
            const tagDaten = wochenplan[tag];

            // Speichere die Notizen
            if (tagDaten.notizen) {
                db.run(insertSql, [jahr, kw, tag, 'notizen', null, null, tagDaten.notizen], (err) => {
                    if (err) {
                        console.error(`Fehler beim Speichern der Notizen für ${tag}:`, err.message);
                    }
                });
            }

            // Speichere die Arbeitsplätze
            Object.keys(tagDaten.arbeitsplaetze).forEach(arbeitsplatz => {
                tagDaten.arbeitsplaetze[arbeitsplatz].forEach(mitarbeiter => {
                    db.run(insertSql, [jahr, kw, tag, mitarbeiter, arbeitsplatz, null, null], (err) => {
                        if (err) {
                            console.error(`Fehler beim Speichern von ${mitarbeiter} in ${arbeitsplatz} am ${tag}:`, err.message);
                        }
                    });
                });
            });

            // Speichere die Zusatzstatus
            Object.keys(tagDaten.zusatzstatus).forEach(zusatzstatus => {
                tagDaten.zusatzstatus[zusatzstatus].forEach(mitarbeiter => {
                    db.run(insertSql, [jahr, kw, tag, mitarbeiter, null, zusatzstatus, null], (err) => {
                        if (err) {
                            console.error(`Fehler beim Speichern von ${mitarbeiter} mit Status ${zusatzstatus} am ${tag}:`, err.message);
                        }
                    });
                });
            });
        });

        res.json({ message: `Wochenplan für KW ${kw} in Jahr ${jahr} erfolgreich gespeichert` });
    });
});

// API-Endpunkt zum Abrufen der Notizen für einen bestimmten Tag
app.get('/api/notizen/:jahr/:kw/:tag', (req, res) => {
    const { jahr, kw, tag } = req.params;

    // Validierung der Eingabedaten
    if (!jahr || !kw || !tag) {
        return res.status(400).json({ error: 'Jahr, Kalenderwoche und Tag sind erforderlich' });
    }

    const sql = `SELECT notizen FROM wochenplaene WHERE jahr = ? AND kw = ? AND tag = ? AND mitarbeiter_name = 'notizen'`;

    db.get(sql, [jahr, kw, tag], (err, row) => {
        if (err) {
            console.error("Fehler beim Abrufen der Notizen:", err.message);
            return res.status(500).json({ error: err.message });
        }

        res.json({ notizen: row ? row.notizen : '' });
    });
});

// API-Endpunkt zum Speichern der Notizen für einen bestimmten Tag
app.post('/api/notizen', (req, res) => {
    const { jahr, kw, tag, notizen } = req.body;

    // Validierung der Eingabedaten
    if (!jahr || !kw || !tag) {
        return res.status(400).json({ error: 'Jahr, Kalenderwoche und Tag sind erforderlich' });
    }

    const sql = `UPDATE wochenplaene SET notizen = ? WHERE jahr = ? AND kw = ? AND tag = ? AND mitarbeiter_name = 'notizen'`;

    db.run(sql, [notizen, jahr, kw, tag], function (err) {
        if (err) {
            console.error("Fehler beim Aktualisieren der Notizen:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (this.changes === 0) {
            // Wenn keine Zeile aktualisiert wurde, füge eine neue Zeile ein
            const insertSql = `INSERT INTO wochenplaene (jahr, kw, tag, mitarbeiter_name, notizen) VALUES (?, ?, ?, 'notizen', ?)`;
            db.run(insertSql, [jahr, kw, tag, notizen], (err) => {
                if (err) {
                    console.error("Fehler beim Speichern der Notizen:", err.message);
                    return res.status(500).json({ error: err.message });
                }
                res.json({ message: 'Notizen gespeichert' });
            });
        } else {
            res.json({ message: 'Notizen aktualisiert' });
        }
    });
});

// API-Endpunkt für die Passwortprüfung
app.post('/api/login', (req, res) => {
    const { password, isEditor } = req.body;
    const tableName = isEditor ? 'passwoerter_editor' : 'passwoerter';
    const sql = `SELECT hash FROM ${tableName} WHERE id = 1`;

    db.get(sql, [], (err, row) => {
        if (err) {
            console.error("Fehler beim Abrufen des Passwort-Hashes:", err.message);
            return res.status(500).json({ error: err.message });
        }

        if (row) {
            bcrypt.compare(password, row.hash, (err, result) => {
                if (err) {
                    console.error("Fehler beim Vergleichen des Passworts:", err.message);
                    return res.status(500).json({ error: err.message });
                } else if (result) {
                    // Erstelle einen einfachen Session-Token (in einer echten Anwendung sollten Sie eine sicherere Methode verwenden)
                    sessionToken = 'validToken';
                    res.json({ success: true, token: sessionToken });
                } else {
                    res.status(401).json({ success: false, message: 'Falsches Passwort' });
                }
            });
        } else {
            res.status(401).json({ success: false, message: 'Passwort nicht gefunden' });
        }
    });
});

// API-Endpunkt zum Abmelden (Logout)
app.post('/api/logout', (req, res) => {
    sessionToken = null; // Einfaches Zurücksetzen des Tokens
    res.json({ success: true, message: 'Erfolgreich abgemeldet' });
});

// Alle HTML Dateien
app.get('*', (req, res) => {
    const allowedPaths = ['/', '/index.html', '/editor.html', '/wochenuebersicht.html'];
    const requestedPath = req.path;
    const filePath = allowedPaths.includes(requestedPath)
        ? path.join(__dirname, 'public', requestedPath.substring(1) || 'index.html')
        : path.join(__dirname, 'public', 'index.html');

    res.sendFile(filePath);
});

// Server starten
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});