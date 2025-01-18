// Initialisiere die Anzeige, wenn das DOM vollständig geladen ist
document.addEventListener('DOMContentLoaded', function() {
    const { kw, dateRange, year } = getCurrentCalendarWeek();
    aktuellesJahr = year;
    aktuelleWoche = { kw: kw, dateRange: dateRange, year: year };
    updateDateDisplay(aktuelleWoche);
    wochenplanLaden(aktuelleWoche.kw, aktuellesJahr);
    setupNavigation();
    setupPasswordCheck();
    setupBearbeitenButton();
});

// Funktion zum Laden des Wochenplans
function wochenplanLaden(woche, jahr) {
    const gespeicherterPlan = loadFromLocalStorage(`wochenplan-kw-${woche}-${jahr}`);
    if (gespeicherterPlan) {
        anzeigeWochenplan(gespeicherterPlan);
    } else {
        // Hier können Sie eine Funktion aufrufen, um einen leeren Wochenplan zu initialisieren
    }
}

// Funktion zum Anzeigen des Wochenplans
function anzeigeWochenplan(wochenplan) {
    // Logik zum Anzeigen des Wochenplans in der index.html
}

// Funktion zum Aktualisieren der Anzeige von Kalenderwoche und Datumsbereich
function updateDateDisplay(weekData) {
    const kwElement = document.getElementById('current-kw');
    if (kwElement) {
        kwElement.textContent = `KW ${weekData.kw} (${weekData.dateRange})`;
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

    if (week === 52) {
        // Wechsel ins nächste Jahr, erste Woche
        const nextYearData = getYearChange('next', year);
        aktuelleWoche = getCalendarWeekAndDateRange(new Date(nextYearData.year, 0, 1)); // Erster Tag des nächsten Jahres
    } else if (week === 53) {
        // Sonderfall: Woche 53, setze Woche auf 1 und erhöhe das Jahr
        aktuelleWoche = getCalendarWeekAndDateRange(new Date(year + 1, 0, 1));
    } else {
        // Normale nächste Woche
        aktuelleWoche = getWeekChange('next', year, week);
    }

    updateDateDisplay(aktuelleWoche);
    wochenplanLaden(aktuelleWoche.kw, aktuelleWoche.year);
}

// Funktion zum Überprüfen des Passworts beim Laden der Seite
function setupPasswordCheck() {
    const passwordOverlay = document.getElementById('password-overlay-index');
    const passwordInput = document.getElementById('password-index-input');
    const rememberCheckbox = document.getElementById('remember-password-index');
    const passwordSubmit = document.getElementById('password-submit-index');

    function handlePasswordSubmit() {
        if (passwordInput.value === 'Radiologie1!') {
            passwordOverlay.style.display = 'none';
            if (rememberCheckbox.checked) {
                saveToLocalStorage('remember-index-password', 'true');
            }
        } else {
            alert('Falsches Passwort!');
        }
    }

    if (!loadFromLocalStorage('remember-index-password') || loadFromLocalStorage('remember-index-password') === 'false') {
        passwordOverlay.style.display = 'flex';

        passwordSubmit.addEventListener('click', handlePasswordSubmit);

        // Event-Listener für die Enter-Taste
        passwordInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                handlePasswordSubmit();
            }
        });

        // Event-Listener zum Schließen des Modals bei Klick außerhalb
        passwordOverlay.addEventListener('click', function(event) {
            if (event.target === passwordOverlay) {
                passwordOverlay.style.display = 'none';
            }
        });
    } else {
        passwordOverlay.style.display = 'none';
    }
}

// Funktion zum Einrichten des Bearbeiten-Buttons
function setupBearbeitenButton() {
    const bearbeitenButton = document.getElementById('bearbeiten');
    const passwordOverlay = document.getElementById('password-overlay-editor');
    const passwordInput = document.getElementById('password-editor-input');
    const rememberCheckbox = document.getElementById('remember-password-editor');
    const passwordSubmit = document.getElementById('password-submit-editor');

    function handlePasswordSubmit() {
        if (passwordInput.value === 'Kandinsky1!') {
            if (rememberCheckbox.checked) {
                saveToLocalStorage('remember-editor-password', 'true');
            }
            window.location.href = 'editor.html';
        } else {
            alert('Falsches Passwort!');
        }
    }

    bearbeitenButton.addEventListener('click', () => {
        passwordOverlay.style.display = 'flex';

        passwordSubmit.addEventListener('click', handlePasswordSubmit);

        // Event-Listener für die Enter-Taste
        passwordInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') {
                handlePasswordSubmit();
            }
        });

        // Event-Listener zum Schließen des Modals bei Klick außerhalb
        passwordOverlay.addEventListener('click', function(event) {
            if (event.target === passwordOverlay) {
                passwordOverlay.style.display = 'none';
            }
        });
    });
}