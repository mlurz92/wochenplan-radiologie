// app.js

// Globale Variablen
let currentWeek = {
    year: new Date().getFullYear(),
    week: getWeekNumber(new Date()),
    1: {}, 2: {}, 3: {}, 4: {}, 5: {}, 6: {}, 7: {}
};
let currentDay = new Date().getDay();
if (currentDay === 0) currentDay = 7; // Sonntag als 7 behandeln
const workplaces = ['CT', 'MRT', 'Angiographie', 'Mammographie', 'Ultraschall', 'Kinder'];
const additionalStatus = ['Dienst', 'Hintergrund', 'Spätdienst', 'Dienstfrei', 'Urlaub', 'Weiterbildung', 'Krank', 'Sonstiges'];
const staffMembers = {
    fa: ['Polednia', 'Dalitz', 'Krzykowski', 'Lurz', 'Placzek', 'Zill'],
    aa: ['Becker', 'Fröhlich', 'Martin', 'Torki']
};

// Initialisierung der Anwendung
document.addEventListener('DOMContentLoaded', async () => {
    checkBrowserCompatibility();
    initializeWeekPicker();
    if (isEditorMode()) {
        initializeWorkplaceCards();
        initializeStatusCards();
        initializeDragAndDrop();
    } else {
        initializeWorkplaceCards();
        initializeStatusCards();
        initializeReadOnlyView();
        await initializePasswordProtection();
    }
    initializeEventListeners();
    setCurrentWeek();
    await loadPlan();
    updateUI();
});

// Überprüfung, ob im Editor-Modus
function isEditorMode() {
    return window.location.pathname.includes('editor.html');
}

// Browser-Kompatibilität prüfen
function checkBrowserCompatibility() {
    const features = [
        'localStorage' in window,
        'JSON' in window,
        'Promise' in window,
        'fetch' in window
    ];

    if (!features.every(feature => feature)) {
        alert('Ihr Browser unterstützt möglicherweise nicht alle Funktionen dieser Anwendung. Bitte verwenden Sie einen aktuellen Browser für die beste Erfahrung.');
    }
}

// Initialisierung des Wochenpickers
function initializeWeekPicker() {
    const weekPicker = new Pikaday({
        field: document.getElementById('week-picker'),
        format: 'YYYY-[W]WW',
        firstDay: 1,
        showWeekNumber: true,
        onSelect: function(date) {
            const year = date.getFullYear();
            const week = getWeekNumber(date);
            setCurrentWeek(year, week);
            loadPlan();
            updateUI();
        }
    });

    document.getElementById('calendar-icon').addEventListener('click', function() {
        weekPicker.show();
    });
}

// Kalenderwoche berechnen
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNum;
}

// Aktuelle Woche setzen
function setCurrentWeek(year = new Date().getFullYear(), week = getWeekNumber(new Date())) {
    currentWeek.year = year;
    currentWeek.week = week;
    document.getElementById('current-week').textContent = `KW ${week}, ${year} (${getDateRange(year, week)})`;
}

// Datum Range berechnen
function getDateRange(year, week) {
    const firstDay = getDateOfISOWeek(year, week);
    const lastDay = new Date(firstDay);
    lastDay.setDate(lastDay.getDate() + 6);
    const options = { day: 'numeric', month: 'numeric' };
    return `${firstDay.toLocaleDateString('de-DE', options)} - ${lastDay.toLocaleDateString('de-DE', options)}`;
}

// Datum für eine bestimmte ISO-Woche und Jahr berechnen
function getDateOfISOWeek(year, week) {
    const simple = new Date(year, 0, 4 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = new Date(simple);
    ISOweekStart.setDate(simple.getDate() - ((dow + 6) % 7));
    return ISOweekStart;
}

// Datum für Woche und Tag berechnen
function getDateForWeekAndDay(year, week, day) {
    const firstDayOfWeek = getDateOfISOWeek(year, week);
    const result = new Date(firstDayOfWeek);
    result.setDate(result.getDate() + day - 1);
    return result;
}

// Initialisierung von Arbeitsplatzkarten
function initializeWorkplaceCards() {
    const workplaceCards = document.getElementById('workplace-cards');
    workplaceCards.innerHTML = '';
    workplaces.forEach(workplace => {
        const card = document.createElement('div');
        card.className = 'workplace-card';
        card.setAttribute('data-workplace', workplace);
        card.innerHTML = `
            <h2>${workplace} <span class="counter">(0)</span></h2>
            <div class="staff-list">
                <h3>Facharzt <span class="counter">(0)</span></h3>
                <ul class="staff-list-items fa"></ul>
                <h3>Assistenzarzt <span class="counter">(0)</span></h3>
                <ul class="staff-list-items aa"></ul>
            </div>
        `;
        workplaceCards.appendChild(card);
    });
}

// Initialisierung von Statuskarten
function initializeStatusCards() {
    const statusCards = document.getElementById('additional-status-cards');
    statusCards.innerHTML = '';
    additionalStatus.forEach(status => {
        const card = document.createElement('div');
        card.className = 'status-card';
        card.setAttribute('data-status', status);
        card.innerHTML = `
            <h2>${status} ${['Urlaub', 'Weiterbildung', 'Krank', 'Sonstiges'].includes(status) ? '<span class="counter">(0)</span>' : ''}</h2>
            <ul class="staff-list-items"></ul>
        `;
        statusCards.appendChild(card);
    });
}

// Initialisierung von Drag-and-Drop
function initializeDragAndDrop() {
    const containers = document.querySelectorAll('.workplace-card .staff-list-items, .status-card .staff-list-items');
    containers.forEach(container => {
        new Sortable(container, {
            group: {
                name: 'shared',
                pull: true,
                put: true
            },
            animation: 150,
            ghostClass: 'sortable-ghost',
            onAdd: function(evt) {
                handleStaffAssignment(evt.item, evt.to);
            },
            onUpdate: function(evt) {
                updateUI();
            },
            onRemove: function(evt) {
                updateUI();
            },
            fallbackOnBody: true,
            swapThreshold: 0.65,
        });
    });

    const staffPool = document.querySelectorAll('#staff-pool .staff-list-items');
    staffPool.forEach(pool => {
        new Sortable(pool, {
            group: {
                name: 'shared',
                pull: 'clone',
                put: false
            },
            sort: false,
            animation: 150
        });
    });
}

// Initialisierung eines Item-Drag
function initializeDragForItem(item) {
    new Sortable.create(item.parentElement, {
        group: {
            name: 'shared',
            pull: true,
            put: true
        },
        animation: 150,
        ghostClass: 'sortable-ghost',
        onAdd: function(evt) {
            handleStaffAssignment(evt.item, evt.to);
        },
        onUpdate: function(evt) {
            updateUI();
        },
        onRemove: function(evt) {
            updateUI();
        },
        fallbackOnBody: true,
        swapThreshold: 0.65,
    });
}

// Initialisierung der schreibgeschützten Ansicht
function initializeReadOnlyView() {
    const staffPool = document.getElementById('staff-pool');
    if (staffPool) {
        staffPool.style.display = 'none';
    }
}

// Funktion zur korrekten Einordnung des Mitarbeiters
function handleStaffAssignment(item, target) {
    const staffName = item.querySelector('.staff-name').textContent;
    const staffType = item.getAttribute('data-staff-type');
    const targetCard = target.closest('.workplace-card, .status-card');

    if (targetCard) {
        const targetType = targetCard.getAttribute('data-workplace') || targetCard.getAttribute('data-status');

        if (additionalStatus.includes(targetType)) {
            assignStaffToStatus(staffName, staffType, targetType);
        } else {
            assignStaffToWorkplace(staffName, staffType, targetType);
        }

        if (item.closest('#staff-pool')) {
            // Wenn das Element aus dem Mitarbeiter-Pool kommt, erstellen Sie ein neues Element
            const newItem = item.cloneNode(true);
            target.appendChild(newItem);
            initializeDragForItem(newItem);
        } else {
            // Wenn das Element von einer anderen Karte kommt, verschieben Sie es
            target.appendChild(item);
        }

        savePlan();
        updateUI();
    }
}

// Mitarbeiter aus allen Zuweisungen entfernen
function removeStaffFromAssignment(staffName, workplace = null, status = null) {
    if (workplace) {
        if (currentWeek[currentDay][workplace]) {
            currentWeek[currentDay][workplace] = currentWeek[currentDay][workplace].filter(staff => staff.name !== staffName);
        }
    } else if (status) {
        if (currentWeek[currentDay][status]) {
            currentWeek[currentDay][status] = currentWeek[currentDay][status].filter(staff => staff.name !== staffName);
        }
    }
    updateUI();
}

// Mitarbeiter zu Arbeitsplatz zuweisen
function assignStaffToWorkplace(staffName, staffType, workplace) {
    if (!currentWeek[currentDay][workplace]) {
        currentWeek[currentDay][workplace] = [];
    }
    const exists = currentWeek[currentDay][workplace].some(staff => staff.name === staffName);
    if (!exists) {
        currentWeek[currentDay][workplace].push({ name: staffName, type: staffType });
    }
}

// Mitarbeiter zu Zusatzstatus zuweisen
function assignStaffToStatus(staffName, staffType, status) {
    if (!currentWeek[currentDay][status]) {
        currentWeek[currentDay][status] = [];
    }

    if (['Dienst', 'Hintergrund', 'Dienstfrei', 'Spätdienst'].includes(status)) {
        // Für diese Status nur eine Zuweisung erlauben
        currentWeek[currentDay][status] = [{ name: staffName, type: staffType }];
    } else {
        const exists = currentWeek[currentDay][status].some(staff => staff.name === staffName);
        if (!exists) {
            currentWeek[currentDay][status].push({ name: staffName, type: staffType });
        }
    }
}

// Wochenplan laden
async function loadPlan() {
    try {
        const response = await fetch(`/api/load-plan?year=${currentWeek.year}&week=${currentWeek.week}`);
        if (response.ok) {
            const planData = await response.json();
            // Merge planData into currentWeek, keeping year and week
            currentWeek = {
                year: currentWeek.year,
                week: currentWeek.week,
                ...planData
            };
            updateUI();
        } else if (response.status === 404) {
            initializeEmptyWeek();
            updateUI();
        } else {
            throw new Error('Fehler beim Laden des Wochenplans');
        }
    } catch (error) {
        console.error('Fehler beim Laden:', error);
        alert('Fehler beim Laden des Wochenplans. Bitte versuchen Sie es erneut.');
    }
}

// Neue Funktion für den Passwortschutz
async function initializePasswordProtection() {
    const overlay = document.createElement('div');
    overlay.id = 'password-overlay';
    overlay.innerHTML = `
        <div class="password-container">
            <h2>Passwortgeschützter Bereich</h2>
            <input type="password" id="password-input" placeholder="Passwort eingeben">
            <button id="submit-password">Zugriff anfordern</button>
        </div>
    `;
    document.body.appendChild(overlay);

    const passwordInput = document.getElementById('password-input');
    const submitButton = document.getElementById('submit-password');

    submitButton.addEventListener('click', checkPassword);
    passwordInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            checkPassword();
        }
    });

    function checkPassword() {
        if (passwordInput.value === 'Radiologie1!') {
            overlay.style.opacity = '0';
            setTimeout(() => {
                overlay.style.display = 'none';
            }, 500);
        } else {
            alert('Falsches Passwort. Bitte versuchen Sie es erneut.');
            passwordInput.value = '';
        }
    }
}

// Leere Woche initialisieren
function initializeEmptyWeek() {
    // Behalte year und week bei
    for (let i = 1; i <= 7; i++) {
        currentWeek[i] = {};
        workplaces.forEach(workplace => currentWeek[i][workplace] = []);
        additionalStatus.forEach(status => currentWeek[i][status] = []);
    }
}

// Wochenplan speichern
async function savePlan() {
    const planData = JSON.stringify(currentWeek);
    try {
        const response = await fetch('/api/save-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: planData,
        });
        if (!response.ok) {
            throw new Error('Fehler beim Speichern des Wochenplans');
        }
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

// UI aktualisieren
function updateUI() {
    updateWorkplaceCards();
    updateStatusCards();
    if (isEditorMode()) {
        updateStaffPool();
    }
    updateDayButtons();
    checkWeekendOrHoliday();
    updateCardBackgrounds();
}

// Arbeitsplatzkarten aktualisieren
function updateWorkplaceCards() {
    workplaces.forEach(workplace => {
        const card = document.querySelector(`.workplace-card[data-workplace="${workplace}"]`);
        const staffList = currentWeek[currentDay][workplace] || [];
        const faList = card.querySelector('.staff-list-items.fa');
        const aaList = card.querySelector('.staff-list-items.aa');
        const totalCounter = card.querySelector('h2 .counter');
        const faCounter = card.querySelector('h3:nth-of-type(1) .counter');
        const aaCounter = card.querySelector('h3:nth-of-type(2) .counter');

        faList.innerHTML = '';
        aaList.innerHTML = '';

        let faCount = 0;
        let aaCount = 0;

        staffList.forEach(staff => {
            const li = createStaffElement(staff);
            if (staff.type === 'fa') {
                faList.appendChild(li);
                faCount++;
            } else {
                aaList.appendChild(li);
                aaCount++;
            }
        });

        totalCounter.textContent = `(${faCount + aaCount})`;
        faCounter.textContent = `(${faCount})`;
        aaCounter.textContent = `(${aaCount})`;

        updateCardColor(card, workplace, faCount, aaCount);
    });

    // Verstecke oder zeige spezifische Arbeitsplatzkarten basierend auf dem aktuellen Tag
    const kinderCard = document.querySelector('.workplace-card[data-workplace="Kinder"]');
    if (kinderCard) {
        if ([1, 3, 5].includes(currentDay)) { // Montag, Mittwoch, Freitag
            kinderCard.style.display = 'block';
        } else {
            kinderCard.style.display = 'none';
        }
    }
}

// Zusatzstatuskarten aktualisieren
function updateStatusCards() {
    additionalStatus.forEach(status => {
        const card = document.querySelector(`.status-card[data-status="${status}"]`);
        const staffList = currentWeek[currentDay][status] || [];
        const ul = card.querySelector('.staff-list-items');
        const counter = card.querySelector('h2 .counter');

        ul.innerHTML = '';

        staffList.forEach(staff => {
            const li = createStaffElement(staff);
            ul.appendChild(li);
        });

        if (counter) {
            counter.textContent = `(${staffList.length})`;
        }

        updateStatusCardColor(card, status, staffList.length);
    });

    // Verstecke oder zeige die Spätdienst-Karte basierend auf dem aktuellen Tag
    const spaetdienstCard = document.querySelector('.status-card[data-status="Spätdienst"]');
    if (spaetdienstCard) {
        if ([1, 4].includes(currentDay)) { // Montag, Donnerstag
            spaetdienstCard.style.display = 'block';
        } else {
            spaetdienstCard.style.display = 'none';
        }
    }
}

// Kartenfarbe für Arbeitsplatzkarten aktualisieren
function updateCardColor(card, workplace, faCount, aaCount) {
    card.classList.remove('red', 'yellow', 'green');

    switch (workplace) {
        case 'CT':
            if (faCount >= 2 || (faCount >= 1 && (faCount + aaCount) >= 3)) {
                card.classList.add('green');
            } else {
                card.classList.add('red');
            }
            break;
        case 'MRT':
            if (faCount >= 1 && (faCount + aaCount) >= 2) {
                card.classList.add('green');
            } else {
                card.classList.add('red');
            }
            break;
        case 'Angiographie':
        case 'Mammographie':
            if (faCount >= 1 && aaCount >= 1) {
                card.classList.add('green');
            } else if (faCount >= 1) {
                card.classList.add('yellow');
            } else {
                card.classList.add('red');
            }
            break;
        case 'Ultraschall':
            if ((faCount + aaCount) >= 1) {
                card.classList.add('green');
            } else {
                card.classList.add('red');
            }
            break;
        case 'Kinder':
            if (faCount >= 1) {
                card.classList.add('green');
            } else {
                card.classList.add('red');
            }
            break;
    }
}

// Kartenfarbe für Zusatzstatuskarten aktualisieren
function updateStatusCardColor(card, status, count) {
    card.classList.remove('red', 'green');

    if (['Dienst', 'Hintergrund', 'Dienstfrei'].includes(status)) {
        if (count === 1) {
            card.classList.add('green');
        } else {
            card.classList.add('red');
        }
    } else if (status === 'Spätdienst') {
        if (count === 1) {
            card.classList.add('green');
        }
    }
}

// Mitarbeiter-Element erstellen
function createStaffElement(staff) {
    const li = document.createElement('li');
    li.className = 'staff-member';
    li.innerHTML = `<span class="staff-name">${staff.name}</span> ${isEditorMode() ? '<button class="remove-btn" title="Entfernen">&times;</button>' : ''}`;
    li.setAttribute('data-staff-type', staff.type);

    if (isEditorMode()) {
        li.querySelector('.remove-btn').addEventListener('click', (event) => {
            event.stopPropagation(); // Verhindert Bubble-up des Events
            const card = li.closest('.workplace-card, .status-card');
            const workplace = card.getAttribute('data-workplace');
            const status = card.getAttribute('data-status');
            removeStaffFromAssignment(staff.name, workplace, status);
            savePlan();
            updateUI();
        });
    }

    return li;
}

// Mitarbeiter-Pool aktualisieren
function updateStaffPool() {
    const faPool = document.querySelector('#fa-pool .staff-list-items');
    const aaPool = document.querySelector('#aa-pool .staff-list-items');

    faPool.innerHTML = '';
    aaPool.innerHTML = '';

    staffMembers.fa.forEach(name => {
        const li = document.createElement('li');
        li.className = 'staff-member';
        li.innerHTML = `<span class="staff-name">${name}</span>`;
        li.setAttribute('data-staff-type', 'fa');
        if (isStaffAssigned(name)) {
            li.classList.add('assigned');
        }
        faPool.appendChild(li);
    });

    staffMembers.aa.forEach(name => {
        const li = document.createElement('li');
        li.className = 'staff-member';
        li.innerHTML = `<span class="staff-name">${name}</span>`;
        li.setAttribute('data-staff-type', 'aa');
        if (isStaffAssigned(name)) {
            li.classList.add('assigned');
        }
        aaPool.appendChild(li);
    });
}

// Überprüfen, ob Mitarbeiter zugewiesen ist
function isStaffAssigned(name) {
    let assigned = false;

    workplaces.forEach(workplace => {
        const staffList = currentWeek[currentDay][workplace] || [];
        if (staffList.some(staff => staff.name === name)) {
            assigned = true;
        }
    });

    additionalStatus.forEach(status => {
        const staffList = currentWeek[currentDay][status] || [];
        if (staffList.some(staff => staff.name === name)) {
            assigned = true;
        }
    });

    return assigned;
}

// Funktion für die Tastatur-Navigation
function handleKeyNavigation(event) {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        changeDay(direction);
    }
}

// Funktion zum Wechseln des Tages
function changeDay(direction) {
    let newDay = currentDay + direction;
    if (newDay < 1) newDay = 7;
    if (newDay > 7) newDay = 1;
    currentDay = newDay;
    updateUI();
    updateDayButtons();
}

// Tagesbuttons aktualisieren
function updateDayButtons() {
    const buttons = document.querySelectorAll('.day-button');
    buttons.forEach(button => {
        const day = parseInt(button.getAttribute('data-day'));
        if (day === currentDay) {
            button.classList.add('active');
            button.setAttribute('aria-current', 'date');
        } else {
            button.classList.remove('active');
            button.removeAttribute('aria-current');
        }
    });
}

// Event Listener initialisieren
function initializeEventListeners() {
    document.getElementById('prev-week').addEventListener('click', () => {
        changeWeek(-1);
    });

    document.getElementById('next-week').addEventListener('click', () => {
        changeWeek(1);
    });

    const dayButtons = document.querySelectorAll('.day-button');
    dayButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentDay = parseInt(button.getAttribute('data-day'));
            updateUI();
        });
    });

    document.addEventListener('keydown', handleKeyNavigation);

    document.getElementById('week-overview').addEventListener('click', () => {
        showWeekOverview();
    });

    document.getElementById('pdf-export').addEventListener('click', () => {
        exportAsPDF();
    });

    if (isEditorMode()) {
        document.getElementById('reset-day').addEventListener('click', () => {
            if (confirm('Möchten Sie den aktuellen Tag wirklich zurücksetzen?')) {
                workplaces.forEach(workplace => currentWeek[currentDay][workplace] = []);
                additionalStatus.forEach(status => currentWeek[currentDay][status] = []);
                savePlan();
                updateUI();
            }
        });

        document.getElementById('reset-week').addEventListener('click', () => {
            if (confirm('Möchten Sie die aktuelle Woche wirklich zurücksetzen?')) {
                initializeEmptyWeek();
                savePlan();
                updateUI();
            }
        });

        document.getElementById('save-plan').addEventListener('click', async () => {
            try {
                await savePlan();
                alert('Wochenplan erfolgreich gespeichert!');
            } catch (error) {
                console.error('Fehler beim Speichern:', error);
                alert('Fehler beim Speichern des Wochenplans. Bitte versuchen Sie es erneut.');
            }
        });
    } else {
        document.getElementById('edit-mode').addEventListener('click', checkPassword);
    }
}

// Woche ändern
function changeWeek(offset) {
    const date = getDateOfISOWeek(currentWeek.year, currentWeek.week);
    date.setDate(date.getDate() + offset * 7);
    const newWeek = getWeekNumber(date);
    const newYear = date.getFullYear();
    setCurrentWeek(newYear, newWeek);
    loadPlan();
}

// Wochenübersicht anzeigen
function showWeekOverview() {
    let overviewWindow = window.open('', 'Wochenübersicht', 'width=1000,height=800');
    overviewWindow.document.write('<html><head><title>Wochenübersicht</title>');
    overviewWindow.document.write('<style>');
    overviewWindow.document.write('body { font-family: Roboto, sans-serif; padding: 20px; }');
    overviewWindow.document.write('table { width: 100%; border-collapse: collapse; }');
    overviewWindow.document.write('th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }');
    overviewWindow.document.write('th { background-color: #f0f4f8; }');
    overviewWindow.document.write('</style>');
    overviewWindow.document.write('</head><body>');
    overviewWindow.document.write(`<h1>Wochenübersicht KW ${currentWeek.week}, ${currentWeek.year}</h1>`);
    overviewWindow.document.write('<table>');
    overviewWindow.document.write('<tr><th>Mitarbeiter</th>');
    const days = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    days.forEach(day => {
        overviewWindow.document.write(`<th>${day}</th>`);
    });
    overviewWindow.document.write('</tr>');

    const allStaff = [...staffMembers.fa, ...staffMembers.aa];
    allStaff.forEach(staffName => {
        overviewWindow.document.write(`<tr><td>${staffName}</td>`);
        for (let day = 1; day <= 7; day++) {
            overviewWindow.document.write('<td>');
            const assignments = getStaffAssignmentsForDay(staffName, day);
            overviewWindow.document.write(assignments.join('/') || '&nbsp;');
            overviewWindow.document.write('</td>');
        }
        overviewWindow.document.write('</tr>');
    });

    overviewWindow.document.write('</table>');
    overviewWindow.document.write('</body></html>');
    overviewWindow.document.close();
}

// Mitarbeiterzuweisungen für einen Tag abrufen
function getStaffAssignmentsForDay(staffName, day) {
    let assignments = [];

    workplaces.forEach(workplace => {
        const staffList = currentWeek[day][workplace] || [];
        if (staffList.some(staff => staff.name === staffName)) {
            assignments.push(getAbbreviation(workplace));
        }
    });

    additionalStatus.forEach(status => {
        const staffList = currentWeek[day][status] || [];
        if (staffList.some(staff => staff.name === staffName)) {
            assignments.push(getAbbreviation(status));
        }
    });

    return assignments;
}

// Abkürzungen
function getAbbreviation(name) {
    const abbreviations = {
        'Angiographie': 'AN',
        'CT': 'CT',
        'MRT': 'MR',
        'Mammographie': 'MG',
        'Ultraschall': 'US',
        'Kinder': 'KUS',
        'Dienst': 'D',
        'Hintergrund': 'HG',
        'Dienstfrei': 'F',
        'Spätdienst': 'S',
        'Krank': 'K',
        'Urlaub': 'U',
        'Weiterbildung': 'WB',
        'Sonstiges': 'SO'
    };
    return abbreviations[name] || name;
}

// Export als PDF
function exportAsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');

    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    const dateRange = getDateRange(currentWeek.year, currentWeek.week);

    // Funktion zum Konvertieren von RGBA zu RGB
    function rgba2rgb(rgba, bgColor = {r:255, g:255, b:255}) {
        const a = rgba.a !== undefined ? rgba.a : 1;
        return {
            r: Math.round((1 - a) * bgColor.r + a * rgba.r),
            g: Math.round((1 - a) * bgColor.g + a * rgba.g),
            b: Math.round((1 - a) * bgColor.b + a * rgba.b)
        };
    }

    // Funktion zum Parsen von RGBA-Strings
    function parseRGBA(rgba) {
        const parts = rgba.substring(rgba.indexOf('(') + 1, rgba.lastIndexOf(')')).split(/,\s*/);
        return {
            r: parseInt(parts[0]),
            g: parseInt(parts[1]),
            b: parseInt(parts[2]),
            a: parseFloat(parts[3])
        };
    }

    // Funktion zum Erstellen einer Seite für jeden Tag
    async function createDayPage(day) {
        if (day > 1) doc.addPage();

        // Obere Leiste
        doc.setFillColor(200, 200, 200);
        doc.rect(0, 0, 297, 15, 'F');
        doc.setFontSize(12);
        doc.setTextColor(0);
        let xOffset = 10;
        days.forEach((dayName, index) => {
            if (index + 1 === day) {
                doc.setFillColor(150, 150, 150);
                doc.rect(xOffset - 2, 0, doc.getTextWidth(dayName) + 4, 15, 'F');
                doc.setTextColor(255);
            } else {
                doc.setTextColor(0);
                doc.link(xOffset - 2, 0, doc.getTextWidth(dayName) + 4, 15, { pageNumber: index + 1 });
            }
            doc.text(dayName, xOffset, 10);
            xOffset += doc.getTextWidth(dayName) + 10;
        });

        const currentDate = getDateForWeekAndDay(currentWeek.year, currentWeek.week, day);
        const formattedDate = currentDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });

        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(`Wochenplan für ${days[day - 1]}, ${formattedDate}`, 10, 25);

        let yPosition = 35;
        let xPosition = 10;

        // Funktion zum Zeichnen einer Karte
        function drawCard(title, staffList, color, isWorkplace = true) {
            const cardWidth = isWorkplace ? 60 : 50;
            const cardHeight = isWorkplace ? 25 : 20;

            const rgbaColor = parseRGBA(color);
            const rgbColor = rgba2rgb(rgbaColor);
            doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 3, 3, 'F');

            doc.setFontSize(8);
            doc.setTextColor(0);
            doc.text(title, xPosition + 3, yPosition + 6);

            doc.setFontSize(6);
            let staffY = yPosition + 10;
            staffList.forEach(staff => {
                doc.text(`${staff.type === 'fa' ? 'FA: ' : 'AA: '}${staff.name}`, xPosition + 3, staffY);
                staffY += 4;
            });
        }

        const isSpecialDay = await isWeekendOrHoliday(currentDate);

        // Zeichne Arbeitsplatzkarten
        let workplaceCount = 0;
        if (!isSpecialDay) {
            workplaces.forEach((workplace, index) => {
                if (workplace === 'Kinder' && ![1, 3, 5].includes(day)) {
                    return; // Überspringe Kinder-Karte, wenn nicht Mo, Mi, Fr
                }

                const staffList = currentWeek[day][workplace] || [];
                const faCount = staffList.filter(s => s.type === 'fa').length;
                const aaCount = staffList.filter(s => s.type === 'aa').length;
                let color;
                switch(workplace) {
                    case 'CT':
                        color = (faCount >= 2 || (faCount >= 1 && (faCount + aaCount) >= 3)) ? 'rgba(151, 255, 109, 0.2)' : 'rgba(255, 105, 107, 0.2)';
                        break;
                    case 'MRT':
                        color = (faCount >= 1 && (faCount + aaCount) >= 2) ? 'rgba(151, 255, 109, 0.2)' : 'rgba(255, 105, 107, 0.2)';
                        break;
                    case 'Angiographie':
                    case 'Mammographie':
                        color = (faCount >= 1 && aaCount >= 1) ? 'rgba(151, 255, 109, 0.2)' : (faCount >= 1 ? 'rgba(255, 247, 123, 0.2)' : 'rgba(255, 105, 107, 0.2)');
                        break;
                    case 'Ultraschall':
                        color = ((faCount + aaCount) >= 1) ? 'rgba(151, 255, 109, 0.2)' : 'rgba(255, 105, 107, 0.2)';
                        break;
                    case 'Kinder':
                        color = (faCount >= 1) ? 'rgba(151, 255, 109, 0.2)' : 'rgba(255, 105, 107, 0.2)';
                        break;
                }
                drawCard(workplace, staffList, color, true);
                workplaceCount++;

                if (workplaceCount % 3 === 0 || index === workplaces.length - 1) {
                    xPosition = 10;
                    yPosition += 35;
                } else {
                    xPosition += 70;
                }
            });
        }

        // Berechne die Anzahl der Zeilen für Arbeitsplatzkarten
        const workplaceRows = Math.ceil(workplaceCount / 3);

        // Reset position für Statuskarten mit konstantem Abstand
        xPosition = 10;
        yPosition = 35 + (workplaceRows * 35) + 20; // Konstanter Abstand von 20 mm

        // Zeichne Statuskarten
        additionalStatus.forEach((status, index) => {
            if (isSpecialDay && !['Dienst', 'Hintergrund'].includes(status)) {
                return; // Überspringe alle außer Dienst und Hintergrund an Wochenenden/Feiertagen
            }
            if (status === 'Spätdienst' && ![1, 4].includes(day)) {
                return; // Überspringe Spätdienst-Karte, wenn nicht Mo oder Do
            }

            const staffList = currentWeek[day][status] || [];
            let color = 'rgba(200, 200, 200, 0.2)';
            if (['Dienst', 'Hintergrund', 'Dienstfrei'].includes(status)) {
                color = staffList.length === 1 ? 'rgba(151, 255, 109, 0.2)' : 'rgba(255, 105, 107, 0.2)';
            } else if (status === 'Spätdienst') {
                color = staffList.length === 1 ? 'rgba(151, 255, 109, 0.2)' : 'rgba(200, 200, 200, 0.2)';
            }
            drawCard(status, staffList, color, false);

            if ((index + 1) % 4 === 0 || index === additionalStatus.length - 1) {
                xPosition = 10;
                yPosition += 30;
            } else {
                xPosition += 60;
            }
        });
    }

    // Erstelle eine Seite für jeden Tag
    (async function() {
        for (let day = 1; day <= 7; day++) {
            await createDayPage(day);
        }

        // Wochenübersicht
        doc.addPage();
        doc.setFontSize(16);
        doc.text(`Wochenübersicht KW ${currentWeek.week}, ${currentWeek.year} (${dateRange})`, 10, 20);

        const tableData = [];
        const allStaff = [...staffMembers.fa, ...staffMembers.aa];

        allStaff.forEach(staffName => {
            const row = [staffName];
            for (let day = 1; day <= 7; day++) {
                const assignments = getStaffAssignmentsForDay(staffName, day);
                row.push(assignments.length > 0 ? assignments.join('/') : ' ');
            }
            tableData.push(row);
        });

        doc.autoTable({
            head: [['Mitarbeiter', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']],
            body: tableData,
            startY: 30,
        });

        // Füge einen Link zur Wochenübersicht in der oberen Leiste jeder Seite hinzu
        for (let i = 1; i <= doc.getNumberOfPages(); i++) {
            doc.setPage(i);
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text('Wochenübersicht', 245, 10);
            doc.link(240, 0, 50, 15, { pageNumber: doc.getNumberOfPages() });
        }

        doc.save(`Wochenplan_KW${currentWeek.week}_${currentWeek.year}.pdf`);
    })();
}

// Wochenende oder Feiertag prüfen
async function checkWeekendOrHoliday() {
    const date = getDateForWeekAndDay(currentWeek.year, currentWeek.week, currentDay);
    const isSpecialDay = await isWeekendOrHoliday(date);

    const workplaceCards = document.querySelectorAll('.workplace-card');
    const statusCards = document.querySelectorAll('.status-card');

    if (isSpecialDay) {
        workplaceCards.forEach(card => {
            card.style.display = 'none';
        });

        statusCards.forEach(card => {
            const status = card.getAttribute('data-status');
            if (['Dienst', 'Hintergrund'].includes(status)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    } else {
        workplaceCards.forEach(card => {
            const workplace = card.getAttribute('data-workplace');
            if (workplace === 'Kinder') {
                card.style.display = [1, 3, 5].includes(currentDay) ? 'block' : 'none';
            } else {
                card.style.display = 'block';
            }
        });

        statusCards.forEach(card => {
            const status = card.getAttribute('data-status');
            if (status === 'Spätdienst') {
                card.style.display = [1, 4].includes(currentDay) ? 'block' : 'none';
            } else {
                card.style.display = 'block';
            }
        });
    }
}

// Feiertag prüfen (Sachsen)
async function isWeekendOrHoliday(date) {
    const day = date.getDay();
    if (day === 0 || day === 6) return true;  // Samstag oder Sonntag

    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const dayOfMonth = date.getDate();

    try {
        const response = await fetch(`https://feiertage-api.de/api/?jahr=${year}&nur_land=SN`);
        if (!response.ok) throw new Error('Feiertage API Fehler');
        const holidays = await response.json();

        for (const holiday in holidays) {
            if (holidays.hasOwnProperty(holiday)) {
                const holidayDate = new Date(holidays[holiday].datum);
                if (holidayDate.getFullYear() === year &&
                    holidayDate.getMonth() + 1 === month &&
                    holidayDate.getDate() === dayOfMonth) {
                    return true;
                }
            }
        }
    } catch (error) {
        console.error('Fehler beim Abrufen der Feiertage:', error);
    }

    return false;
}

// Aktualisierung der Kartenhintergründe basierend auf den Farben
function updateCardBackgrounds() {
    const allCards = document.querySelectorAll('.workplace-card, .status-card');
    allCards.forEach(card => {
        if (card.classList.contains('red')) {
            card.style.backgroundColor = 'rgba(255, 105, 107, 0.2)';
        } else if (card.classList.contains('yellow')) {
            card.style.backgroundColor = 'rgba(255, 247, 123, 0.2)';
        } else if (card.classList.contains('green')) {
            card.style.backgroundColor = 'rgba(151, 255, 109, 0.2)';
        } else {
            card.style.backgroundColor = 'var(--card-color)';
        }
    });
}

// Neue Funktion zum Speichern des Wochenplans
async function savePlan() {
    const planData = JSON.stringify(currentWeek);
    try {
        const response = await fetch('/api/save-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: planData,
        });
        if (!response.ok) {
            throw new Error('Fehler beim Speichern des Wochenplans');
        }
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        throw error;
    }
}

// Neue Funktion für den Passwortschutz
function checkPassword() {
    const password = prompt('Bitte geben Sie das Passwort ein:');
    if (password === 'Kandinsky1!') {
        window.location.href = 'editor.html';
    } else {
        alert('Falsches Passwort!');
    }
}
