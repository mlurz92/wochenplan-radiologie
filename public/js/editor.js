// Initialisiere die Anzeige, wenn das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', function () {
    const { kw, dateRange, year } = getCurrentCalendarWeek();
    aktuellesJahr = year;
    aktuelleWoche = { kw: kw, dateRange: dateRange, year: year };
    updateDateDisplay(aktuelleWoche);
    wochenplanLaden(aktuelleWoche.kw, aktuellesJahr);
    setupNavigation();
    setupArbeitsplatzkarten();
    setupZusatzstatuskarten();
    setupButtons();
    setupNotizen();
});

// Funktion zum Laden des Wochenplans
function wochenplanLaden(woche, jahr) {
    const gespeicherterPlan = loadFromLocalStorage(`wochenplan-kw-<span class="math-inline">\{woche\}\-</span>{jahr}`);
    const initialerWochenplan = {
        "Montag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
        "Dienstag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
        "Mittwoch": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
        "Donnerstag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
        "Freitag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
        "Samstag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
        "Sonntag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" }
    };
    anzeigeWochenplan(gespeicherterPlan || initialerWochenplan);
}

// Funktion zum Anzeigen des Wochenplans
function anzeigeWochenplan(wochenplan) {
    const wochentag = ermittleAktuellenWochentag();
    const aktuellerTagDaten = wochenplan[wochentag];

    // Lösche vorhandene Einträge in den Karten
    const arbeitsplatzKarten = document.querySelectorAll('.arbeitsplatz-karten .arbeitsplatzkarte');
    arbeitsplatzKarten.forEach(karte => {
        karte.querySelectorAll('.facharzt-liste li, .assistenzarzt-liste li').forEach(li => li.remove());
    });

    const zusatzstatusKarten = document.querySelectorAll('.zusatzstatus-karten .zusatzstatuskarte');
    zusatzstatusKarten.forEach(karte => {
        karte.querySelectorAll('.mitarbeiter-liste li').forEach(li => li.remove());
    });

    // Setze Daten für Arbeitsplätze
    for (const arbeitsplatz in aktuellerTagDaten.arbeitsplaetze) {
        const mitarbeiter = aktuellerTagDaten.arbeitsplaetze[arbeitsplatz];
        const kartenId = `karte-${arbeitsplatz.toLowerCase()}`;
        const karte = document.getElementById(kartenId);

        if (karte) {
            mitarbeiter.forEach(ma => {
                const rolle = getMitarbeiterRolle(ma);
                if (rolle === 'Facharzt' || rolle === 'Assistenzarzt') {
                    addMitarbeiterToKarte(ma, rolle, karte);
                }
            });
        }
    }

    // Setze Daten für Zusatzstatus
    for (const zusatzstatus in aktuellerTagDaten.zusatzstatus) {
        const mitarbeiter = aktuellerTagDaten.zusatzstatus[zusatzstatus];
        const kartenId = `karte-${zusatzstatus.toLowerCase()}`;
        const karte = document.getElementById(kartenId);

        if (karte) {
            mitarbeiter.forEach(ma => {
                addMitarbeiterToKarte(ma, null, karte);
            });
        }
    }

    // Setze den aktiven Wochentag-Button in der Navigation
    const aktuellerWochentagButton = document.getElementById(`weekday-${wochentag.toLowerCase()}`);
    if (aktuellerWochentagButton) {
        document.querySelectorAll('.weekday-button').forEach(btn => btn.classList.remove('active'));
        aktuellerWochentagButton.classList.add('active');
    }

    // Setze die Notizen für den aktuellen Tag
    const notizenFeld = document.getElementById('notes-editor');
    if (notizenFeld) {
        notizenFeld.value = aktuellerTagDaten.notizen;
    }

    // Zeige oder verberge Karten basierend auf dem aktuellen Tag
    const tagIndex = ['montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag', 'sonntag'].indexOf(wochentag.toLowerCase());
    const istWochenendeOderFeiertag = tagIndex >= 5 || isHoliday(new Date(aktuellesJahr, 0, (aktuelleWoche.kw - 1) * 7 + tagIndex + 1));
    const kinderKarte = document.getElementById('karte-kinder');
    const spaetdienstKarte = document.getElementById('karte-spätdienst');

    if (istWochenendeOderFeiertag) {
        // Zeige nur Dienst und Hintergrund an
        document.querySelectorAll('.arbeitsplatz-karten .arbeitsplatzkarte, .zusatzstatus-karten .zusatzstatuskarte').forEach(karte => {
            if (karte.id !== 'karte-dienst' && karte.id !== 'karte-hintergrund') {
                karte.style.display = 'none';
            } else {
                karte.style.display = 'flex';
            }
        });
    } else {
        // Normale Wochentagsanzeige
        document.querySelectorAll('.arbeitsplatz-karten .arbeitsplatzkarte, .zusatzstatus-karten .zusatzstatuskarte').forEach(karte => {
            karte.style.display = 'flex'; // Setze die Anzeige für alle Karten zurück
        });

        // Verberge Kinder-Karte außer an bestimmten Tagen
        if (kinderKarte) {
            kinderKarte.style.display = ['montag', 'mittwoch', 'freitag'].includes(wochentag.toLowerCase()) ? 'flex' : 'none';
        }

        // Verberge Spätdienst-Karte außer an bestimmten Tagen
        if (spaetdienstKarte) {
            spaetdienstKarte.style.display = ['montag', 'donnerstag'].includes(wochentag.toLowerCase()) ? 'flex' : 'none';
        }
    }
}

// Funktion zum Ermitteln des aktiven Wochentags
function ermittleAktuellenWochentag() {
    const aktiverButton = document.querySelector('.weekday-button.active');
    if (aktiverButton) {
        return aktiverButton.id.replace('weekday-', '').charAt(0).toUpperCase() + aktiverButton.id.replace('weekday-', '').slice(1);
    }
    return "Montag"; // Standardmäßig Montag anzeigen, falls kein Button aktiv ist
}

// Funktion zum Speichern des Wochenplans
function wochenplanSpeichern() {
    const aktuellerWochentag = ermittleAktuellenWochentag();
    const wochenplan = loadFromLocalStorage(`wochenplan-kw-<span class="math-inline">\{aktuelleWoche\.kw\}\-</span>{aktuellesJahr}`) || {};

    // Initialisiere den aktuellen Tag im Wochenplan, falls nicht vorhanden
    if (!wochenplan[aktuellerWochentag]) {
        wochenplan[aktuellerWochentag] = { arbeitsplaetze: {}, zusatzstatus: {}, notizen: "" };
    }

    // Aktualisiere die Notizen für den aktuellen Tag
    const notizenFeld = document.getElementById('notes-editor');
    wochenplan[aktuellerWochentag].notizen = notizenFeld.value;

    // Daten für Arbeitsplätze sammeln
    const arbeitsplatzKarten = document.querySelectorAll('.arbeitsplatz-karten .arbeitsplatzkarte');
    arbeitsplatzKarten.forEach(karte => {
        const arbeitsplatzName = karte.querySelector('h3').textContent.split(' ')[0];
        const facharztListe = Array.from(karte.querySelectorAll('.facharzt-liste li')).map(li => li.textContent.replace('x', '').trim());
        const assistenzarztListe = Array.from(karte.querySelectorAll('.assistenzarzt-liste li')).map(li => li.textContent.replace('x', '').trim());

        // Stelle sicher, dass das Objekt für den aktuellen Tag existiert
        if (!wochenplan[aktuellerWochentag].arbeitsplaetze[arbeitsplatzName]) {
            wochenplan[aktuellerWochentag].arbeitsplaetze[arbeitsplatzName] = [];
        }

        wochenplan[aktuellerWochentag].arbeitsplaetze[arbeitsplatzName] = [...facharztListe, ...assistenzarztListe];
    });

    // Daten für Zusatzstatus sammeln
    const zusatzstatusKarten = document.querySelectorAll('.zusatzstatus-karten .zusatzstatuskarte');
    zusatzstatusKarten.forEach(karte => {
        const zusatzstatusName = karte.querySelector('h3').textContent;
        const mitarbeiterListe = Array.from(karte.querySelectorAll('.mitarbeiter-liste li')).map(li => li.textContent.replace('x', '').trim());

        // Stelle sicher, dass das Objekt für den aktuellen Tag existiert
        if (!wochenplan[aktuellerWochentag].zusatzstatus[zusatzstatusName]) {
            wochenplan[aktuellerWochentag].zusatzstatus[zusatzstatusName] = [];
        }

        wochenplan[aktuellerWochentag].zusatzstatus[zusatzstatusName] = mitarbeiterListe;
    });

    // Speichern des Wochenplans im LocalStorage
    saveToLocalStorage(`wochenplan-kw-<span class="math-inline">\{aktuelleWoche\.kw\}\-</span>{aktuellesJahr}`, wochenplan);
    console.log("Wochenplan gespeichert:", wochenplan);
    alert("Der Wochenplan wurde erfolgreich gespeichert!");
}

// Funktion zum Zurücksetzen des Tages
function tagZuruecksetzen() {
    const aktuellerWochentag = ermittleAktuellenWochentag();
    const bestaetigung = confirm(`Möchten Sie wirklich alle Zuweisungen und die Notizen für ${aktuellerWochentag} zurücksetzen?`);
    if (bestaetigung) {
        const wochenplan = loadFromLocalStorage(`wochenplan-kw-<span class="math-inline">\{aktuelleWoche\.kw\}\-</span>{aktuellesJahr}`);

        if (wochenplan && wochenplan[aktuellerWochentag]) {
            wochenplan[aktuellerWochentag] = {
                arbeitsplaetze: {},
                zusatzstatus: {},
                notizen: "" // Setzt auch die Notizen zurück
            };

            saveToLocalStorage(`wochenplan-kw-<span class="math-inline">\{aktuelleWoche\.kw\}\-</span>{aktuellesJahr}`, wochenplan);
            anzeigeWochenplan(wochenplan);
        }
    }
}

// Funktion zum Zurücksetzen der Woche
function wocheZuruecksetzen() {
    const bestaetigung = confirm("Möchten Sie wirklich alle Zuweisungen für die gesamte Woche zurücksetzen?");
    if (bestaetigung) {
        const initialerWochenplan = {
            "Montag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
            "Dienstag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
            "Mittwoch": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
            "Donnerstag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
            "Freitag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
            "Samstag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" },
            "Sonntag": { "arbeitsplaetze": {}, "zusatzstatus": {}, "notizen": "" }
        };

        saveToLocalStorage(`wochenplan-kw-<span class="math-inline">\{aktuelleWoche\.kw\}\-</span>{aktuellesJahr}`, initialerWochenplan);
        anzeigeWochenplan(initialerWochenplan);
    }
}

// Funktion zum Aktualisieren der Anzeige von Kalenderwoche und Datumsbereich
function updateDateDisplay(weekData) {
    const kwElement = document.getElementById('current-kw');
    if (kwElement) {
        kwElement.textContent = `KW <span class="math-inline">\{weekData\.kw\} \(</span>{weekData.dateRange})`;
    }
}

// Funktion zum Einrichten der Navigation
function setupNavigation() {
    const prevWeekButton = document.getElementById('prevWeek');
    const nextWeekButton = document.getElementById('nextWeek');
    const weekdayButtons = document.querySelectorAll('.weekday-button');

    prevWeekButton.addEventListener('click', handlePrevWeekClick);
    nextWeekButton.addEventListener('click', handleNextWeekClick);

    weekdayButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Entferne 'active' Klasse von allen Buttons
            weekdayButtons.forEach(btn => btn.classList.remove('active'));

            // Füge 'active' Klasse zum angeklickten Button hinzu
            button.classList.add('active');

            // Rufe die Logik zum Anzeigen des Wochenplans für den ausgewählten Tag auf
            const wochentag = button.id.replace('weekday-', '');
            const tagIndex = ['mo', 'di', 'mi', 'do', 'fr', 'sa', 'so'].indexOf(wochentag);
            const aktuellesDatum = new Date(aktuellesJahr, 0, (aktuelleWoche.kw - 1) * 7 + tagIndex + 1);
            const wochenplan = loadFromLocalStorage(`wochenplan-kw-<span class="math-inline">\{aktuelleWoche\.kw\}\-</span>{aktuellesJahr}`);
            if (wochenplan) {
                const tag = button.id.split('-')[1].charAt(0).toUpperCase() + button.id.split('-')[1].slice(1);
                const tagesdaten = wochenplan[tag];
                anzeigeWochenplan({ [tag]: tagesdaten });
            }
        });
    });
}

// Funktion zum Behandeln des Klicks auf den "Vorherige Woche"-Button
function handlePrevWeekClick() {
    let year = aktuelleWoche.year;
    let week = aktuelleWoche.kw;

    if (week === 1) {
        // Wechsel ins vorherige Jahr, letzte Woche
        const prevYearData = getYearChange('prev', year);
        aktuelleWoche = getCalendarWeekAndDateRange(new Date(prevYearData.year, 11, 31)); // Letzter Tag des vorherigen Jahres
    } else {
        // Normale vorherige Woche
        aktuelleWoche = getWeekChange('prev', year, week);
    }

    updateDateDisplay(aktuelleWoche);
    wochenplanLaden(aktuelleWoche.kw, aktuelleWoche.year);
}

// Funktion zum Behandeln des Klicks auf den "Nächste Woche"-Button
function handleNextWeekClick() {
    let year = aktuelleWoche.year;
    let week = aktuelleWoche.kw;

    if (week >= 52) {
        // Wechsel ins nächste Jahr, erste Woche
        const nextYearData = getYearChange('next', year);
        aktuelleWoche = getCalendarWeekAndDateRange(new Date(nextYearData.year, 0, 1)); // Erster Tag des nächsten Jahres
    } else {
        // Normale nächste Woche
        aktuelleWoche = getWeekChange('next', year, week);
    }

    updateDateDisplay(aktuelleWoche);
    wochenplanLaden(aktuelleWoche.kw, aktuelleWoche.year);
}

// Funktion zum Einrichten der Button-Funktionen
function setupButtons() {
    document.getElementById('tagZuruecksetzen').addEventListener('click', tagZuruecksetzen);
    document.getElementById('wocheZuruecksetzen').addEventListener('click', wocheZuruecksetzen);
    document.getElementById('speichern').addEventListener('click', wochenplanSpeichern);
    document.getElementById('zurueckZuViewer').addEventListener('click', function() {
        window.location.href = 'index.html';
    });
}

// Funktion zum Initialisieren der Arbeitsplatzkarten
function setupArbeitsplatzkarten() {
    const arbeitsplatzKartenContainer = document.querySelector('.arbeitsplatz-karten');
    const arbeitsplaetze = ['CT', 'MRT', 'Angiographie', 'Mammographie', 'Ultraschall', 'Kinder', 'Teleradiologie'];

    arbeitsplaetze.forEach(arbeitsplatz => {
        const karte = document.createElement('div');
        karte.classList.add('arbeitsplatzkarte');
        const arbeitsplatzId = arbeitsplatz.toLowerCase();
        karte.id = `karte-${arbeitsplatzId}`;
        karte.innerHTML = `
            <h3 id="header-<span class="math-inline">\{arbeitsplatzId\}"\></span>{arbeitsplatz} <span class="counter counter-gesamt" id="${arbeitsplatzId}-gesamt-counter">0</span></h3>
            <div class="mitarbeiter-bereich facharzt-bereich">
                <h4 id="header-facharzt-${arbeitsplatzId}">Facharzt <span class="counter counter-facharzt" id="${arbeitsplatzId}-facharzt-counter">0</span></h4>
                <ul class="mitarbeiter-liste facharzt-liste" id="${arbeitsplatzId}-facharzt-liste"></ul>
            </div>
            <div class="mitarbeiter-bereich assistenzarzt-bereich">
                <h4 id="header-assistenzarzt-${arbeitsplatzId}">Assistenzarzt <span class="counter counter-assistenzarzt" id="${arbeitsplatzId}-assistenzarzt-counter">0</span></h4>
                <ul class="mitarbeiter-liste assistenzarzt-liste" id="${arbeitsplatzId}-assistenzarzt-liste"></ul>
            </div>
        `;
        arbeitsplatzKartenContainer.appendChild(karte);
        setupDragAndDrop(karte);
    });
}

// Funktion zum Initialisieren der Zusatzstatuskarten
function setupZusatzstatuskarten() {
    const zusatzstatusKartenContainer = document.querySelector('.zusatzstatus-karten');
    const zusatzstatus = ['Dienst', 'Hintergrund', 'Spätdienst', 'Frei', 'Urlaub', 'Weiterbildung', 'Krank', 'Sonstiges'];

    zusatzstatus.forEach(status => {
        const karte = document.createElement('div');
        karte.classList.add('zusatzstatuskarte');
        const statusId = status.toLowerCase();
        karte.id = `karte-${statusId}`;
        karte.innerHTML = `
            <h3 id="header-${statusId}">${status}</h3>
            <ul class="mitarbeiter-liste" id="${statusId}-liste"></ul>
        `;
        zusatzstatusKartenContainer.appendChild(karte);
        setupDragAndDrop(karte);
    });
}

// Funktion zum Einrichten von Drag and Drop für ein Element
function setupDragAndDrop(element) {
    element.addEventListener('dragover', onDragOver);
    element.addEventListener('drop', onDrop);
}

// Funktion zum Einrichten der Notizen
function setupNotizen() {
    const notizenFeld = document.getElementById('notes-editor');
    notizenFeld.addEventListener('input', () => {
        const aktuellerWochentag = ermittleAktuellenWochentag();
        const wochenplan = loadFromLocalStorage(`wochenplan-kw-${aktuelleWoche.kw}-${aktuellesJahr}`);

        if (wochenplan && wochenplan[aktuellerWochentag]) {
            wochenplan[aktuellerWochentag].notizen = notizenFeld.value;
            saveToLocalStorage(`wochenplan-kw-${aktuelleWoche.kw}-${aktuellesJahr}`, wochenplan);
        }
    });
}