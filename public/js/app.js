// Variablen für aktuell angezeigte Woche und Jahr
let aktuelleWoche = getCurrentCalendarWeek();
let aktuellesJahr = new Date().getFullYear();

// Hilfsfunktionen

/**
 * Gibt die aktuelle Kalenderwoche und den zugehörigen Datumsbereich zurück.
 *
 * @returns {Object} Ein Objekt mit den Eigenschaften `kw`, `dateRange` und `year`.
 */
function getCurrentCalendarWeek() {
    const today = new Date();
    return getCalendarWeekAndDateRange(today);
}

/**
 * Berechnet die Kalenderwoche und den Datumsbereich für ein gegebenes Datum.
 *
 * @param {Date} date - Das Datum, für das die Kalenderwoche und der Datumsbereich berechnet werden sollen.
 * @returns {Object} Ein Objekt mit den Eigenschaften `kw`, `dateRange` und `year`.
 */
function getCalendarWeekAndDateRange(date) {
    const currentDay = date.getDate();
    const currentMonth = date.getMonth();
    const currentYear = date.getFullYear();
    const firstDayOfYear = new Date(currentYear, 0, 1);
    const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
    const currentWeek = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

    let startDate, endDate;

    if (currentWeek === 1) {
        startDate = new Date(currentYear, 0, 1);
        endDate = new Date(currentYear, 0, 7 - firstDayOfYear.getDay());
    } else {
        startDate = new Date(currentYear, 0, currentDay - (date.getDay() === 0 ? 6 : date.getDay() - 1) - (7 * (currentWeek - 2)));
        endDate = new Date(currentYear, 0, currentDay + (7 - (date.getDay() === 0 ? 6 : date.getDay())) - (7 * (currentWeek - 2)));
    }

    let startMonth = startDate.getMonth() + 1;
    let endMonth = endDate.getMonth() + 1;

    return {
        kw: currentWeek,
        dateRange: `<span class="math-inline">\{startDate\.getDate\(\)\.toString\(\)\.padStart\(2, '0'\)\}\.</span>{startMonth.toString().padStart(2, '0')} - <span class="math-inline">\{endDate\.getDate\(\)\.toString\(\)\.padStart\(2, '0'\)\}\.</span>{endMonth.toString().padStart(2, '0')}.${currentYear}`,
        year: currentYear
    };
}

/**
 * Berechnet die Kalenderwoche und den Datumsbereich für das vorherige oder nächste Jahr.
 *
 * @param {string} direction - Die Richtung, in die gewechselt werden soll ('prev' oder 'next').
 * @param {number} currentYear - Das aktuelle Jahr.
 * @param {number} currentWeek - Die aktuelle Kalenderwoche.
 * @returns {Object} Ein Objekt mit den Eigenschaften `kw`, `dateRange` und `year`.
 */
function getYearChange(direction, currentYear, currentWeek) {
    let date;
    if (direction === 'prev') {
        date = new Date(currentYear - 1, 11, 31); // Letzter Tag des vorherigen Jahres
    } else {
        date = new Date(currentYear + 1, 0, 1); // Erster Tag des nächsten Jahres
    }
    return getCalendarWeekAndDateRange(date);
}

/**
 * Berechnet die Kalenderwoche und den Datumsbereich für die vorherige oder nächste Woche.
 *
 * @param {string} direction - Die Richtung, in die gewechselt werden soll ('prev' oder 'next').
 * @param {number} currentYear - Das aktuelle Jahr.
 * @param {number} currentWeek - Die aktuelle Kalenderwoche.
 * @returns {Object} Ein Objekt mit den Eigenschaften `kw`, `dateRange` und `year`.
 */
function getWeekChange(direction, currentYear, currentWeek) {
    let date;
    if (direction === 'prev') {
        date = new Date(currentYear, 0, (currentWeek - 1) * 7);
    } else {
        date = new Date(currentYear, 0, (currentWeek + 1) * 7);
    }
    return getCalendarWeekAndDateRange(date);
}

/**
 * Prüft, ob ein gegebenes Datum ein Feiertag in Sachsen ist.
 *
 * @param {Date} date - Das zu prüfende Datum.
 * @returns {boolean} True, wenn das Datum ein Feiertag in Sachsen ist, sonst false.
 */
function isHoliday(date) {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JavaScript Monate sind 0-basiert
    const day = date.getDate();

    // Feste Feiertage
    const holidays = [
        { month: 1, day: 1 },   // Neujahr
        { month: 5, day: 1 },   // Tag der Arbeit
        { month: 10, day: 3 },  // Tag der Deutschen Einheit
        { month: 10, day: 31 }, // Reformationstag
        { month: 12, day: 25 }, // 1. Weihnachtstag
        { month: 12, day: 26 }  // 2. Weihnachtstag
    ];

    // Prüfe, ob das Datum mit einem festen Feiertag übereinstimmt
    if (holidays.some(holiday => holiday.month === month && holiday.day === day)) {
        return true;
    }

    // Bewegliche Feiertage basierend auf Ostersonntag
    const easterSunday = getEasterSunday(year);
    const goodFriday = addDays(easterSunday, -2);
    const easterMonday = addDays(easterSunday, 1);
    const ascensionDay = addDays(easterSunday, 39);
    const pentecostMonday = addDays(easterSunday, 50);

    const movableHolidays = [
        goodFriday,      // Karfreitag
        easterMonday,    // Ostermontag
        ascensionDay,    // Christi Himmelfahrt
        pentecostMonday, // Pfingstmontag
    ];

    // Tag der Buße und Versöhnung: Der Mittwoch vor dem 23. November
    let repentanceDay = new Date(year, 10, 22); // 22. November
    while (repentanceDay.getDay() !== 3) { // 3 steht für Mittwoch
        repentanceDay.setDate(repentanceDay.getDate() - 1);
    }
    movableHolidays.push(repentanceDay);

    // Prüfe, ob das Datum mit einem beweglichen Feiertag übereinstimmt
    if (movableHolidays.some(holiday => holiday.getDate() === day && holiday.getMonth() + 1 === month)) {
        return true;
    }

    return false;
}

/**
 * Berechnet das Datum des Ostersonntags für ein gegebenes Jahr.
 *
 * @param {number} year - Das Jahr, für das das Ostersonntagsdatum berechnet werden soll.
 * @returns {Date} Das Datum des Ostersonntags im gegebenen Jahr.
 */
function getEasterSunday(year) {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;

    return new Date(year, month - 1, day);
}

/**
 * Fügt einem Datum eine bestimmte Anzahl von Tagen hinzu.
 *
 * @param {Date} date - Das Ausgangsdatum.
 * @param {number} days - Die Anzahl der Tage, die hinzugefügt werden sollen.
 * @returns {Date} Ein neues Datum, das um die angegebene Anzahl von Tagen verschoben ist.
 */
function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Speichert einen Wert im LocalStorage.
 *
 * @param {string} key - Der Schlüssel, unter dem der Wert gespeichert werden soll.
 * @param {any} value - Der zu speichernde Wert.
 */
function saveToLocalStorage(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

/**
 * Liest einen Wert aus dem LocalStorage.
 *
 * @param {string} key - Der Schlüssel, unter dem der Wert gespeichert ist.
 * @returns {any} Der ausgelesene Wert oder null, wenn der Schlüssel nicht existiert.
 */
function loadFromLocalStorage(key) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
}

/**
 * Löscht einen Wert aus dem LocalStorage.
 *
 * @param {string} key - Der Schlüssel, der gelöscht werden soll.
 */
function removeFromLocalStorage(key) {
    localStorage.removeItem(key);
}

/**
 * Aktualisiert die Farbcodierung einer Karte basierend auf der Anzahl der zugewiesenen Fach- und Assistenzärzte.
 *
 * @param {HTMLElement} karte - Das HTML-Element der zu aktualisierenden Karte.
 */
function updateFarbcodierung(karte) {
    const facharztCount = parseInt(karte.querySelector('.counter-facharzt')?.textContent) || 0;
    const assistenzarztCount = parseInt(karte.querySelector('.counter-assistenzarzt')?.textContent) || 0;
    const gesamtCount = facharztCount + assistenzarztCount;
    let neuerStatus = 'rot'; // Standardmäßig rot

    if (karte.classList.contains('arbeitsplatzkarte')) {
        const arbeitsplatzName = karte.querySelector('h3').textContent.split(' ')[0]; // Nimmt den ersten Teil des Titels als Arbeitsplatzname an

        switch (arbeitsplatzName) {
            case 'CT':
                if (facharztCount >= 2 || (facharztCount === 1 && gesamtCount >= 3)) {
                    neuerStatus = 'grün';
                } else if (facharztCount === 1 && assistenzarztCount === 1) {
                    neuerStatus = 'gelb';
                }
                break;
            case 'MRT':
                if (facharztCount >= 1 && gesamtCount >= 2) {
                    neuerStatus = 'grün';
                } else if (facharztCount === 1) {
                    const { kw } = getCurrentCalendarWeek();
                    const aktuellerTag = new Date(aktuellesJahr, 0, (kw - 1) * 7 + 3);
                    if (aktuellerTag.getDay() === 3) {
                        neuerStatus = 'grün'; // Ausnahme für Mittwoch
                    } else {
                        neuerStatus = 'gelb';
                    }
                }
                break;
            case 'Angiographie':
            case 'Mammographie':
                if (facharztCount >= 1 && assistenzarztCount >= 1) {
                    neuerStatus = 'grün';
                } else if (facharztCount >= 1 && assistenzarztCount === 0) {
                    neuerStatus = 'gelb';
                }
                break;
            case 'Ultraschall':
                if (gesamtCount >= 1) {
                    neuerStatus = 'grün';
                }
                break;
            case 'Kinder':
            case 'Teleradiologie':
                if (facharztCount >= 1) {
                    neuerStatus = 'grün';
                }
                break;
        }
    } else if (karte.classList.contains('zusatzstatuskarte')) {
        const zusatzstatusName = karte.querySelector('h3').textContent;
        const mitarbeiterCount = karte.querySelectorAll('.mitarbeiter-liste li')?.length || 0;

        if (['Dienst', 'Hintergrund', 'Frei', 'Spätdienst'].includes(zusatzstatusName)) {
            if (mitarbeiterCount > 0) {
                neuerStatus = 'grün';
            }
        }
    }

    setzeKartenFarbe(karte, neuerStatus);
}

/**
 * Setzt die Farbe einer Karte.
 *
 * @param {HTMLElement} karte - Das HTML-Element der Karte.
 * @param {string} status - Der neue Farbstatus ('rot', 'gelb' oder 'grün').
 */
function setzeKartenFarbe(karte, status) {
    // Entfernt bestehende Farbmodifikatoren
    karte.classList.remove('rot', 'gelb', 'grün');

    // Fügt die neue Farbe hinzu
    karte.classList.add(status);
}

// Event-Listener hinzufügen, wenn das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', function () {
    // Initialisiere die Mitarbeiterliste im Pool
    initMitarbeiterPool();
});

/**
 * Initialisiert den Mitarbeiterpool mit Fach- und Assistenzärzten.
 */
function initMitarbeiterPool() {
    const facharztPool = document.getElementById('facharzt-pool');
    const assistenzarztPool = document.getElementById('assistenzarzt-pool');

    const facharztListe = ["Polednia", "Dalitz", "Placzek", "Krzykowski", "Lurz", "Stöckel", "Zill"];
    const assistenzarztListe = ["Becker", "Apitz", "El Houba", "Fröhlich", "Martin", "Torki"];

    facharztListe.forEach(name => {
        const mitarbeiterElement = document.createElement('li');
        mitarbeiterElement.textContent = name;
        mitarbeiterElement.id = "mitarbeiter-" + name.toLowerCase().replace(/\s+/g, '-');
        mitarbeiterElement.draggable = true;
        mitarbeiterElement.ondragstart = onDragstart;
        facharztPool.appendChild(mitarbeiterElement);
    });

    assistenzarztListe.forEach(name => {
        const mitarbeiterElement = document.createElement('li');
        mitarbeiterElement.textContent = name;
        mitarbeiterElement.id = "mitarbeiter-" + name.toLowerCase().replace(/\s+/g, '-');
        mitarbeiterElement.draggable = true;
        mitarbeiterElement.ondragstart = onDragstart;
        assistenzarztPool.appendChild(mitarbeiterElement);
    });
}

// === Globale Variablen ===
/**
 * Speichert die ursprüngliche Karte des Mitarbeiters vor dem Drag-Start.
 * @type {HTMLElement|null}
 */
let originalMitarbeiterKarte = null;

// === Event-Handler ===

/**
 * Event-Handler für den Beginn eines Drag-Vorgangs.
 *
 * @param {DragEvent} event - Das Drag-Event.
 */
function onDragStart(event) {
    // Speichere die ID des gezogenen Elements im DataTransfer-Objekt
    event.dataTransfer.setData('text/plain', event.target.id);
    // Setze den Drag-Effekt (z.B. move)
    event.dataTransfer.effectAllowed = 'move';
    // Speichere die ursprüngliche Karte des Mitarbeiters, von der er gezogen wurde
    originalMitarbeiterKarte = getMitarbeiterKarte(event.target);
}

/**
 * Event-Handler für das Ziehen eines Elements über ein Drop-Ziel.
 *
 * @param {DragEvent} event - Das Drag-Event.
 */
function onDragOver(event) {
    // Verhindere das Standardverhalten (um Drop zu ermöglichen)
    event.preventDefault();
    // Setze den Drop-Effekt (z.B. move)
    event.dataTransfer.dropEffect = 'move';
}

/**
 * Event-Handler für das Ablegen eines Elements auf einem Drop-Ziel.
 *
 * @param {DragEvent} event - Das Drag-Event.
 */
function onDrop(event) {
    // Verhindere das Standardverhalten (z.B. Weiterleitung)
    event.preventDefault();
    // Hole die ID des gezogenen Elements
    const mitarbeiterId = event.dataTransfer.getData('text/plain');
    // Hole das gezogene Element
    const mitarbeiterElement = document.getElementById(mitarbeiterId);
    // Hole das Ziel-Element
    const dropTarget = getKarteOderMitarbeiterPool(event.target);

    // Prüfe, ob das Drop-Ziel eine gültige Karte oder der Mitarbeiter-Pool ist
    if (dropTarget) {
        // Logik für das Verschieben des Mitarbeiters
        if (isArbeitsplatzKarte(dropTarget) || isZusatzstatusKarte(dropTarget)) {
            moveMitarbeiter(mitarbeiterElement, dropTarget);
        } else if (isMitarbeiterPool(dropTarget)) {
            removeMitarbeiterFromKarte(mitarbeiterElement, originalMitarbeiterKarte);
        }
    }
}

// === Hilfsfunktionen ===

/**
 * Gibt die Karte zurück, zu der ein Element gehört, oder den Mitarbeiter-Pool, falls das Element nicht zu einer Karte gehört.
 *
 * @param {HTMLElement} element - Das Element, für das die Karte oder der Mitarbeiter-Pool gesucht werden soll.
 * @returns {HTMLElement|null} Die Karte, zu der das Element gehört, oder der Mitarbeiter-Pool, falls das Element nicht zu einer Karte gehört, oder null, falls das Element weder zu einer Karte noch zum Mitarbeiter-Pool gehört.
 */
function getKarteOderMitarbeiterPool(element) {
    // Durchsuche die übergeordneten Elemente, um die Karte oder den Mitarbeiter-Pool zu finden
    let currentElement = element;
    while (currentElement) {
        if (currentElement.classList.contains('arbeitsplatzkarte') || currentElement.classList.contains('zusatzstatuskarte') || currentElement.id === 'mitarbeiter-pool') {
            return currentElement;
        }
        currentElement = currentElement.parentElement;
    }
    return null;
}

/**
 * Gibt die Karte eines Mitarbeiters zurück.
 *
 * @param {HTMLElement} mitarbeiterElement - Das Element des Mitarbeiters.
 * @returns {HTMLElement|null} Die Karte des Mitarbeiters oder null, falls der Mitarbeiter keiner Karte zugeordnet ist.
 */
function getMitarbeiterKarte(mitarbeiterElement) {
    return getKarteOderMitarbeiterPool(mitarbeiterElement);
}

/**
 * Entfernt einen Mitarbeiter von einer Karte.
 *
 * @param {HTMLElement} mitarbeiterElement - Das Element des Mitarbeiters.
 * @param {HTMLElement} karte - Die Karte, von der der Mitarbeiter entfernt werden soll.
 * @returns {boolean} True, wenn der Mitarbeiter erfolgreich entfernt wurde, sonst false.
 */
function removeMitarbeiterFromKarte(mitarbeiterElement, karte) {
    // Hole den Mitarbeiternamen
    const mitarbeiterName = mitarbeiterElement.textContent;

    // Entferne den Mitarbeiter von der Karte
    if (karte) {
        const mitarbeiterItem = karte.querySelector(`.mitarbeiter-liste li[id="mitarbeiter-${mitarbeiterName.toLowerCase().replace(/\s+/g, '-')}"]`);
        if (mitarbeiterItem) {
            mitarbeiterItem.remove();
            console.log(`Mitarbeiter ${mitarbeiterName} von Karte entfernt.`);
            // Aktualisiere die Counter der Karte
            updateCounter(karte);
            // Aktualisiere den Status im Mitarbeiterpool (nicht ausgegraut/nicht durchgestrichen)
            updateMitarbeiterStatusImPool(mitarbeiterName, false);
            // Setze die globale Variable zurück
            originalMitarbeiterKarte = null;
            return true;
        } else {
            console.log(`Mitarbeiter ${mitarbeiterName} nicht auf der Karte gefunden.`);
        }
    }
    return false;
}

/**
 * Verschiebt einen Mitarbeiter auf eine neue Karte.
 *
 * @param {HTMLElement} mitarbeiterElement - Das Element des Mitarbeiters.
 * @param {HTMLElement} zielKarte - Die Zielkarte, auf die der Mitarbeiter verschoben werden soll.
 */
function moveMitarbeiter(mitarbeiterElement, zielKarte) {
    // Hole den Mitarbeiternamen
    const mitarbeiterName = mitarbeiterElement.textContent;

    // Hole die Rolle des Mitarbeiters (Facharzt oder Assistenzarzt)
    const mitarbeiterRolle = getMitarbeiterRolle(mitarbeiterName);

    // Entferne den Mitarbeiter von der vorherigen Karte (falls vorhanden)
    if (originalMitarbeiterKarte) {
        removeMitarbeiterFromKarte(mitarbeiterElement, originalMitarbeiterKarte);
    }

    // Füge den Mitarbeiter zur neuen Karte hinzu
    const erfolgreichHinzugefuegt = addMitarbeiterToKarte(mitarbeiterName, mitarbeiterRolle, zielKarte);

    if (erfolgreichHinzugefuegt) {
        // Aktualisiere die Counter der betroffenen Karten
        updateCounter(zielKarte);

        // Aktualisiere den Status im Mitarbeiterpool (ausgegraut/durchgestrichen)
        updateMitarbeiterStatusImPool(mitarbeiterName, true);

        // Setze die globale Variable zurück
        originalMitarbeiterKarte = null;

        console.log(`Mitarbeiter ${mitarbeiterName} erfolgreich zu ${zielKarte.id} hinzugefügt.`);
    } else {
        console.error(`Fehler beim Hinzufügen von ${mitarbeiterName} zu ${zielKarte.id}.`);
    }
}

/**
 * Fügt einen Mitarbeiter zu einer Karte hinzu.
 *
 * @param {string} mitarbeiterName - Der Name des Mitarbeiters.
 * @param {string} mitarbeiterRolle - Die Rolle des Mitarbeiters (Facharzt oder Assistenzarzt).
 * @param {HTMLElement} zielKarte - Die Zielkarte, zu der der Mitarbeiter hinzugefügt werden soll.
 * @returns {boolean} True, wenn der Mitarbeiter erfolgreich hinzugefügt wurde, sonst false.
 */
function addMitarbeiterToKarte(mitarbeiterName, mitarbeiterRolle, zielKarte) {
    // Erstelle ein neues Listenelement für den Mitarbeiter
    const newMitarbeiterElement = document.createElement('li');
    newMitarbeiterElement.textContent = mitarbeiterName;
    newMitarbeiterElement.id = "mitarbeiter-" + mitarbeiterName.toLowerCase().replace(/\s+/g, '-'); // Setze eine eindeutige ID basierend auf dem Namen

    // Erstelle ein 'x' zum Löschen
    const deleteSpan = document.createElement('span');
    deleteSpan.classList.add('delete-icon');
    deleteSpan.textContent = 'x';
    deleteSpan.onclick = function () {
        removeMitarbeiterFromKarte(newMitarbeiterElement, zielKarte);
    };
    newMitarbeiterElement.appendChild(deleteSpan);

    // Füge das Element zur entsprechenden Liste (Facharzt oder Assistenzarzt) hinzu
    let liste = null;
    if (zielKarte.classList.contains('arbeitsplatzkarte')) {
        if (mitarbeiterRolle === 'Facharzt') {
            liste = zielKarte.querySelector('.facharzt-liste');
        } else if (mitarbeiterRolle === 'Assistenzarzt') {
            liste = zielKarte.querySelector('.assistenzarzt-liste');
        }
    } else if (zielKarte.classList.contains('zusatzstatuskarte')) {
        liste = zielKarte.querySelector('.mitarbeiter-liste');
    }

    if (liste) {
        liste.appendChild(newMitarbeiterElement);
        return true;
    } else {
        console.error(`Zielliste auf der Karte ${zielKarte.id} nicht gefunden.`);
        return false;
    }
}

/**
 * Aktualisiert die Counter einer Karte.
 *
 * @param {HTMLElement} karte - Die Karte, deren Counter aktualisiert werden sollen.
 */
function updateCounter(karte) {
    // Hole die Anzahl der Fachärzte, Assistenzärzte und gesamt
    const facharztCount = karte.querySelectorAll('.facharzt-liste li')?.length || 0;
    const assistenzarztCount = karte.querySelectorAll('.assistenzarzt-liste li')?.length || 0;
    const gesamtCount = facharztCount + assistenzarztCount;

    // Aktualisiere die Counter-Anzeige, falls die Karte ein Arbeitsplatz ist.
    if (karte.classList.contains('arbeitsplatzkarte')) {
        karte.querySelector('.counter-gesamt').textContent = gesamtCount;
        karte.querySelector('.counter-facharzt').textContent = facharztCount;
        karte.querySelector('.counter-assistenzarzt').textContent = assistenzarztCount;
    }

    // Aktualisiere die Farbcodierung der Karte
    updateFarbcodierung(karte);
}

/**
 * Gibt die Rolle eines Mitarbeiters zurück.
 *
 * @param {string} mitarbeiterName - Der Name des Mitarbeiters.
 * @returns {string|null} Die Rolle des Mitarbeiters ('Facharzt' oder 'Assistenzarzt') oder null, wenn der Mitarbeiter nicht gefunden wurde.
 */
function getMitarbeiterRolle(mitarbeiterName) {
    // Durchsuche die Mitarbeiterliste und finde die Rolle
    if (["Polednia", "Dalitz", "Placzek", "Krzykowski", "Lurz", "Stöckel", "Zill"].includes(mitarbeiterName)) {
        return "Facharzt";
    } else if (["Becker", "Apitz", "El Houba", "Fröhlich", "Martin", "Torki"].includes(mitarbeiterName)) {
        return "Assistenzarzt";
    }
    return null;
}

/**
 * Aktualisiert den Status eines Mitarbeiters im Mitarbeiterpool.
 *
 * @param {string} mitarbeiterName - Der Name des Mitarbeiters.
 * @param {boolean} isAssignedToCard - Gibt an, ob der Mitarbeiter einer Karte zugewiesen ist.
 */
function updateMitarbeiterStatusImPool(mitarbeiterName, isAssignedToCard) {
    // Finde das entsprechende Element im Mitarbeiterpool
    const mitarbeiterElement = findMitarbeiterElementImPool(mitarbeiterName);

    // Aktualisiere die Anzeige (ausgegraut/durchgestrichen)
    if (isAssignedToCard) {
        mitarbeiterElement.classList.add('assigned');
    } else {
        mitarbeiterElement.classList.remove('assigned');
    }
}

/**
 * Findet das Element eines Mitarbeiters im Mitarbeiterpool.
 *
 * @param {string} mitarbeiterName - Der Name des Mitarbeiters.
 * @returns {HTMLElement|null} Das Element des Mitarbeiters im Mitarbeiterpool oder null, wenn der Mitarbeiter nicht gefunden wurde.
 */
function findMitarbeiterElementImPool(mitarbeiterName) {
    const facharztPool = document.getElementById('facharzt-pool');
    const assistenzarztPool = document.getElementById('assistenzarzt-pool');

    const facharztElement = Array.from(facharztPool.querySelectorAll('li')).find(li => li.textContent.includes(mitarbeiterName));
    const assistenzarztElement = Array.from(assistenzarztPool.querySelectorAll('li')).find(li => li.textContent.includes(mitarbeiterName));

    return facharztElement || assistenzarztElement;
}

/**
 * Überprüft, ob ein Element eine Arbeitsplatzkarte ist.
 *
 * @param {HTMLElement} element - Das zu überprüfende Element.
 * @returns {boolean} True, wenn das Element eine Arbeitsplatzkarte ist, sonst false.
 */
function isArbeitsplatzKarte(element) {
    return element.classList.contains('arbeitsplatzkarte');
}

/**
 * Überprüft, ob ein Element eine Zusatzstatuskarte ist.
 *
 * @param {HTMLElement} element - Das zu überprüfende Element.
 * @returns {boolean} True, wenn das Element eine Zusatzstatuskarte ist, sonst false.
 */
function isZusatzstatusKarte(element) {
    return element.classList.contains('zusatzstatuskarte');
}

/**
 * Überprüft, ob ein Element der Mitarbeiter-Pool ist.
 *
 * @param {HTMLElement} element - Das zu überprüfende Element.
 * @returns {boolean} True, wenn das Element der Mitarbeiter-Pool ist, sonst false.
 */
function isMitarbeiterPool(element) {
    return element.id === 'mitarbeiter-pool';
}