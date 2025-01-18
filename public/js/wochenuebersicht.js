document.addEventListener('DOMContentLoaded', function () {
    erstelleWochenuebersicht();
});

// Globale Variable zum Speichern der aktuellen Woche und des Jahres
let aktuelleWoche = getCurrentCalendarWeek();
let aktuellesJahr = new Date().getFullYear();

// Abkürzungen für die Anzeige in der Wochenübersicht
const abkuerzungen = {
    "Angiographie": "AN",
    "CT": "CT",
    "MRT": "MR",
    "Mammographie": "MA",
    "Ultraschall": "US",
    "Kinder": "KUS",
    "Teleradiologie": "T",
    "Dienst": "D",
    "Hintergrund": "HG",
    "Frei": "F",
    "Spätdienst": "S",
    "Urlaub": "U",
    "Weiterbildung": "WB",
    "Krank": "K",
    "Sonstiges": ""
};

/**
 * Gibt die Mitarbeiterzuweisungen für die aktuelle Woche zurück.
 *
 * @param {Object} wochenplan - Das Wochenplan-Objekt aus dem LocalStorage.
 * @returns {Object} Ein Objekt, das die Zuweisungen nach Tag und Mitarbeiter gruppiert.
 */
function getMitarbeiterZuweisungen(wochenplan) {
    const zuweisungen = {};

    Object.keys(wochenplan).forEach(tag => {
        zuweisungen[tag] = {};

        Object.keys(wochenplan[tag].arbeitsplaetze).forEach(arbeitsplatz => {
            const mitarbeiter = wochenplan[tag].arbeitsplaetze[arbeitsplatz];
            mitarbeiter.forEach(ma => {
                if (!zuweisungen[tag][ma]) {
                    zuweisungen[tag][ma] = [];
                }
                zuweisungen[tag][ma].push(abkuerzungen[arbeitsplatz] || arbeitsplatz);
            });
        });

        Object.keys(wochenplan[tag].zusatzstatus).forEach(status => {
            const mitarbeiter = wochenplan[tag].zusatzstatus[status];
            mitarbeiter.forEach(ma => {
                if (!zuweisungen[tag][ma]) {
                    zuweisungen[tag][ma] = [];
                }
                zuweisungen[tag][ma].push(abkuerzungen[status] || status);
            });
        });
    });

    return zuweisungen;
}

/**
 * Erstellt die Wochenübersichtstabelle.
 */
function erstelleWochenuebersicht() {
    const wochenplan = loadFromLocalStorage(`wochenplan-kw-${aktuelleWoche.kw}-${aktuellesJahr}`);
    const tabelle = document.getElementById('wochenuebersicht-tabelle');

    // Überprüfe, ob die Tabelle existiert
    if (!tabelle) {
        console.error('Tabelle mit der ID "wochenuebersicht-tabelle" nicht gefunden.');
        return;
    }

    const tbody = tabelle.querySelector('tbody');
    tbody.innerHTML = '';

    if (!wochenplan) {
        erstelleKeineDatenZeile(tbody);
        return;
    }

    const mitarbeiterZuweisungen = getMitarbeiterZuweisungen(wochenplan);
    const alleMitarbeiter = ermittleAlleMitarbeiter(wochenplan);

    erstelleTabellenUeberschrift(tbody);
    alleMitarbeiter.forEach(mitarbeiter => erstelleMitarbeiterZeile(tbody, mitarbeiter, mitarbeiterZuweisungen));
}

/**
 * Erstellt die Tabellenüberschrift.
 *
 * @param {HTMLElement} tbody - Das tbody-Element der Tabelle.
 */
function erstelleTabellenUeberschrift(tbody) {
    const headerRow = document.createElement('tr');
    const headerZellen = ['Mitarbeiter', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    headerZellen.forEach(zelle => {
        const th = document.createElement('th');
        th.textContent = zelle;
        headerRow.appendChild(th);
    });
    tbody.appendChild(headerRow);
}

/**
 * Erstellt eine Zeile für einen Mitarbeiter in der Wochenübersichtstabelle.
 *
 * @param {HTMLElement} tbody - Das tbody-Element der Tabelle.
 * @param {string} mitarbeiter - Der Name des Mitarbeiters.
 * @param {Object} mitarbeiterZuweisungen - Die Zuweisungen des Mitarbeiters.
 */
function erstelleMitarbeiterZeile(tbody, mitarbeiter, mitarbeiterZuweisungen) {
    const row = document.createElement('tr');
    const mitarbeiterZelle = document.createElement('td');
    mitarbeiterZelle.textContent = mitarbeiter;
    row.appendChild(mitarbeiterZelle);

    const tage = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    tage.forEach(tag => {
        row.appendChild(getTagesZuweisungen(mitarbeiterZuweisungen, tag, mitarbeiter));
    });

    tbody.appendChild(row);
}

/**
 * Gibt die Zuweisungen für einen bestimmten Tag und Mitarbeiter zurück.
 *
 * @param {Object} mitarbeiterZuweisungen - Die Zuweisungen aller Mitarbeiter.
 * @param {string} tag - Der Tag.
 * @param {string} mitarbeiter - Der Name des Mitarbeiters.
 * @returns {HTMLElement} - Die Tabellenzelle mit den Zuweisungen.
 */
function getTagesZuweisungen(mitarbeiterZuweisungen, tag, mitarbeiter) {
    const tagZelle = document.createElement('td');
    const zuweisungen = mitarbeiterZuweisungen[tag][mitarbeiter] || [];
    zuweisungen.sort((a, b) => {
        // Sortiere zuerst nach Arbeitsplatz, dann nach Zusatzstatus
        const isArbeitsplatzA = Object.keys(abkuerzungen).includes(a);
        const isArbeitsplatzB = Object.keys(abkuerzungen).includes(b);

        if (isArbeitsplatzA && !isArbeitsplatzB) {
            return -1;
        }
        if (!isArbeitsplatzA && isArbeitsplatzB) {
            return 1;
        }
        return 0; // Keine Änderung der Reihenfolge, wenn beide den gleichen Typ haben
    });
    tagZelle.textContent = zuweisungen.join(', ');
    return tagZelle;
}

/**
 * Erstellt eine Zeile für den Fall, dass keine Daten vorhanden sind.
 *
 * @param {HTMLElement} tbody - Das tbody-Element der Tabelle.
 */
function erstelleKeineDatenZeile(tbody) {
    const noDataRow = document.createElement('tr');
    noDataRow.innerHTML = `<td colspan="8">Keine Daten für diese Woche vorhanden.</td>`;
    tbody.appendChild(noDataRow);
}

/**
 * Ermittelt alle Mitarbeiter aus dem Wochenplan.
 *
 * @param {Object} wochenplan - Das Wochenplan-Objekt aus dem LocalStorage.
 * @returns {string[]} - Ein sortiertes Array mit allen Mitarbeiternamen.
 */
function ermittleAlleMitarbeiter(wochenplan) {
    let alleMitarbeiter = new Set();
    Object.values(wochenplan).forEach(tag => {
        Object.keys(tag.arbeitsplaetze).forEach(arbeitsplatz => {
            tag.arbeitsplaetze[arbeitsplatz].forEach(mitarbeiter => alleMitarbeiter.add(mitarbeiter));
        });
        Object.keys(tag.zusatzstatus).forEach(status => {
            tag.zusatzstatus[status].forEach(mitarbeiter => alleMitarbeiter.add(mitarbeiter));
        });
    });
    return Array.from(alleMitarbeiter).sort();
}