// Globale Variablen
let currentWeek = {};
let currentDay = new Date().getDay();
if (currentDay === 0 || currentDay === 6) currentDay = 1; // Standardmäßig auf Montag setzen, wenn Wochenende
const workplaces = ['CT', 'MRT', 'Angiographie', 'Mammographie', 'Ultraschall', 'Kinder'];
const additionalStatus = ['Dienst', 'Hintergrund', 'Spätdienst', 'Dienstfrei', 'Urlaub', 'Weiterbildung', 'Krank'];
const staffMembers = {
    fa: ['Polednia', 'Dalitz', 'Krzykowski', 'Lurz', 'Placzek', 'Zill'],
    aa: ['Becker', 'Fröhlich', 'Martin', 'Torki', 'Müller', 'Meier']
};

// Initialisierung der Anwendung
document.addEventListener('DOMContentLoaded', () => {
    checkBrowserCompatibility();
    initializeWeekPicker();
    if (isEditorMode()) {
        initializeWorkplaceCards();
        initializeStatusCards();
        initializeDragAndDrop();
        initializeSidebar();
    } else {
        initializeReadOnlyView();
    }
    initializeEventListeners();
    setCurrentWeek();
    loadWeekPlan();
    updateUI();
    feather.replace();
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
    flatpickr("#week-picker", {
        inline: true,
        locale: 'de',
        weekNumbers: true,
        mode: 'single',
        enableTime: false,
        dateFormat: "Y-W",
        onOpen: function(selectedDates, dateStr, instance) {
            instance.element.style.display = 'block';
        },
        onClose: function(selectedDates, dateStr, instance) {
            instance.element.style.display = 'none';
        },
        onChange: function(selectedDates, dateStr, instance) {
            const date = selectedDates[0];
            const week = getWeekNumber(date);
            const year = date.getFullYear();
            setCurrentWeek(year, week);
            loadWeekPlan();
            updateUI();
        }
    });

    document.getElementById('calendar-icon').addEventListener('click', function() {
        const weekPicker = document.getElementById('week-picker');
        weekPicker.style.display = weekPicker.style.display === 'none' ? 'block' : 'none';
    });
}

// Kalenderwoche berechnen
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

// Aktuelle Woche setzen
function setCurrentWeek(year = new Date().getFullYear(), week = getWeekNumber(new Date())) {
    currentWeek.year = year;
    currentWeek.week = week;
    document.getElementById('current-week').textContent = `KW ${week}, ${year} (${getDateRange(year, week)})`;
}

// Datum Range berechnen
function getDateRange(year, week) {
    const firstDay = getDateForWeekAndDay(year, week, 1); // Montag
    const lastDay = getDateForWeekAndDay(year, week, 7); // Sonntag
    const options = { day: 'numeric', month: 'numeric' };
    return `${firstDay.toLocaleDateString('de-DE', options)} - ${lastDay.toLocaleDateString('de-DE', options)}`;
}

// Datum für Woche und Tag berechnen
function getDateForWeekAndDay(year, week, day) {
    const simple = new Date(year, 0, 1 + (week - 1) * 7);
    const dow = simple.getDay();
    const ISOweekStart = new Date(simple);
    if (dow <= 4)
        ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
    else
        ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
    ISOweekStart.setDate(ISOweekStart.getDate() + day - 1);
    return ISOweekStart;
}

// Initialisierung von Arbeitsplatzkarten
function initializeWorkplaceCards() {
    const workplaceCards = document.getElementById('workplace-cards');
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
    additionalStatus.forEach(status => {
        const card = document.createElement('div');
        card.className = 'status-card';
        card.setAttribute('data-status', status);
        card.innerHTML = `
            <h2>${status} ${['Urlaub', 'Weiterbildung', 'Krank'].includes(status) ? '<span class="counter">(0)</span>' : ''}</h2>
            <ul class="staff-list-items"></ul>
        `;
        statusCards.appendChild(card);
    });
}

// Initialisierung von Drag-and-Drop
function initializeDragAndDrop() {
    const containers = document.querySelectorAll('.workplace-card, .status-card');
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

// Initialisierung der Sidebar
function initializeSidebar() {
    const sidebar = document.getElementById('staff-pool');
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggle-sidebar';
    toggleButton.textContent = '<<';
    toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        toggleButton.textContent = sidebar.classList.contains('collapsed') ? '>>' : '<<';
    });
    sidebar.prepend(toggleButton);
}

// Initialisierung der schreibgeschützten Ansicht
function initializeReadOnlyView() {
    initializeWorkplaceCards();
    initializeStatusCards();
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

        if (targetType.startsWith('Dienst') || targetType.startsWith('Hintergrund') || targetType.startsWith('Spätdienst') || targetType.startsWith('Dienstfrei') || targetType.startsWith('Urlaub') || targetType.startsWith('Weiterbildung') || targetType.startsWith('Krank')) {
            assignStaffToStatus(staffName, staffType, targetType);
        } else {
            assignStaffToWorkplace(staffName, staffType, targetType);
        }

        item.remove();
        saveWeekPlan();
        updateUI();
    }
}

// Mitarbeiter aus allen Zuweisungen entfernen
function removeStaffFromAllAssignments(staffName) {
    for (let day = 1; day <= 7; day++) {
        workplaces.forEach(workplace => {
            if (currentWeek[day][workplace]) {
                currentWeek[day][workplace] = currentWeek[day][workplace].filter(staff => staff.name !== staffName);
            }
        });
        additionalStatus.forEach(status => {
            if (currentWeek[day][status]) {
                currentWeek[day][status] = currentWeek[day][status].filter(staff => staff.name !== staffName);
            }
        });
    }
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

    if (['Dienst', 'Hintergrund', 'Dienstfrei'].includes(status)) {
        currentWeek[currentDay][status] = [{ name: staffName, type: staffType }];
    } else if (status === 'Spätdienst') {
        currentWeek[currentDay][status] = [{ name: staffName, type: staffType }];
    } else {
        const exists = currentWeek[currentDay][status].some(staff => staff.name === staffName);
        if (!exists) {
            currentWeek[currentDay][status].push({ name: staffName, type: staffType });
        }
    }
}

// Wochenplan laden
async function loadWeekPlan() {
    await loadPlan();
}

// Leere Woche initialisieren
function initializeEmptyWeek() {
    currentWeek = {
        year: currentWeek.year,
        week: currentWeek.week
    };
    for (let i = 1; i <= 7; i++) {
        currentWeek[i] = {};
        workplaces.forEach(workplace => currentWeek[i][workplace] = []);
        additionalStatus.forEach(status => currentWeek[i][status] = []);
    }
}

// Wochenplan speichern
async function saveWeekPlan() {
    await savePlan();
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
            const li = document.createElement('li');
            li.className = 'staff-member';
            li.innerHTML = `<span class="staff-name">${staff.name}</span> ${isEditorMode() ? '<button class="remove-btn" title="Entfernen">&times;</button>' : ''}`;
            li.setAttribute('data-staff-type', staff.type);
            if (staff.type === 'fa') {
                faList.appendChild(li);
                faCount++;
            } else {
                aaList.appendChild(li);
                aaCount++;
            }

            if (isEditorMode()) {
                li.querySelector('.remove-btn').addEventListener('click', () => {
                    removeStaffFromAssignment(staff.name, workplace, null);
                    saveWeekPlan();
                    updateUI();
                });
            }
        });

        totalCounter.textContent = `(${faCount + aaCount})`;
        faCounter.textContent = `(${faCount})`;
        aaCounter.textContent = `(${aaCount})`;

        updateCardColor(card, workplace, faCount, aaCount);
    });
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
            const li = document.createElement('li');
            li.className = 'staff-member';
            li.innerHTML = `<span class="staff-name">${staff.name}</span> ${isEditorMode() ? '<button class="remove-btn" title="Entfernen">&times;</button>' : ''}`;
            li.setAttribute('data-staff-type', staff.type);
            ul.appendChild(li);

            if (isEditorMode()) {
                li.querySelector('.remove-btn').addEventListener('click', () => {
                    removeStaffFromAssignment(staff.name, null, status);
                    saveWeekPlan();
                    updateUI();
                });
            }
        });

        if (counter) {
            counter.textContent = `(${staffList.length})`;
        }

        updateStatusCardColor(card, status, staffList.length);
    });
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
                saveWeekPlan();
                updateUI();
            }
        });

        document.getElementById('reset-week').addEventListener('click', () => {
            if (confirm('Möchten Sie die aktuelle Woche wirklich zurücksetzen?')) {
                initializeEmptyWeek();
                saveWeekPlan();
                updateUI();
            }
        });

        document.getElementById('save-plan').addEventListener('click', savePlan);
    } else {
        document.getElementById('edit-mode').addEventListener('click', checkPassword);
    }

    const calendarIcon = document.getElementById('calendar-icon');
    const weekPicker = document.getElementById('week-picker');

    calendarIcon.addEventListener('mouseenter', () => {
        weekPicker.classList.remove('hidden');
    });

    calendarIcon.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!weekPicker.matches(':hover')) {
                weekPicker.classList.add('hidden');
            }
        }, 200);
    });

    weekPicker.addEventListener('mouseenter', () => {
        weekPicker.classList.remove('hidden');
    });

    weekPicker.addEventListener('mouseleave', () => {
        weekPicker.classList.add('hidden');
    });
}

// Woche ändern
function changeWeek(offset) {
    const date = new Date(currentWeek.year, 0, (currentWeek.week - 1) * 7 + 1);
    date.setDate(date.getDate() + offset * 7);
    const newWeek = getWeekNumber(date);
    const newYear = date.getFullYear();
    setCurrentWeek(newYear, newWeek);
    loadWeekPlan();
    updateUI();
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
            overviewWindow.document.write(assignments.join(', ') || '&nbsp;');
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
    let workplaceAssignments = [];
    let statusAssignments = [];

    workplaces.forEach(workplace => {
        const staffList = currentWeek[day][workplace] || [];
        if (staffList.some(staff => staff.name === staffName)) {
            workplaceAssignments.push(getAbbreviation(workplace));
        }
    });

    additionalStatus.forEach(status => {
        const staffList = currentWeek[day][status] || [];
        if (staffList.some(staff => staff.name === staffName)) {
            statusAssignments.push(getAbbreviation(status));
        }
    });

    if (workplaceAssignments.length > 0 && statusAssignments.length > 0) {
        return workplaceAssignments.map(wp => `${wp}/${statusAssignments.join(',')}`);
    } else {
        return [...workplaceAssignments, ...statusAssignments];
    }
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
        'Weiterbildung': 'WB'
    };
    return abbreviations[name] || name;
}

// Export als PDF
function exportAsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');

    const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const dateRange = getDateRange(currentWeek.year, currentWeek.week);

    for (let day = 1; day <= 7; day++) {
        if (day > 1) doc.addPage();

        doc.setFontSize(16);
        doc.text(`Wochenplan für ${days[day % 7]}, KW ${currentWeek.week} (${dateRange})`, 10, 20);

        let yPosition = 30;

        workplaces.forEach(workplace => {
            const staffList = currentWeek[day][workplace] || [];
            let faNames = staffList.filter(s => s.type === 'fa').map(s => s.name).join(', ');
            let aaNames = staffList.filter(s => s.type === 'aa').map(s => s.name).join(', ');

            doc.setFontSize(12);
            doc.text(`${workplace} (FA: ${faNames || 'keine'} | AA: ${aaNames || 'keine'})`, 10, yPosition);
            yPosition += 10;
        });

        additionalStatus.forEach(status => {
            const staffList = currentWeek[day][status] || [];
            let names = staffList.map(s => s.name).join(', ');

            doc.setFontSize(12);
            doc.text(`${status}: ${names || 'keine'}`, 10, yPosition);
            yPosition += 10;
        });
    }

    // Wochenübersicht
    doc.addPage();
    doc.setFontSize(16);
    doc.text(`Wochenübersicht KW ${currentWeek.week} (${dateRange})`, 10, 20);

    const tableData = [];
    const allStaff = [...staffMembers.fa, ...staffMembers.aa];

    allStaff.forEach(staffName => {
        const row = [staffName];
        for (let day = 1; day <= 7; day++) {
            const assignments = getStaffAssignmentsForDay(staffName, day);
            row.push(assignments.join(', ') || ' ');
        }
        tableData.push(row);
    });

    doc.autoTable({
        head: [['Mitarbeiter', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So']],
        body: tableData,
        startY: 30,
    });

    doc.save(`Wochenplan_KW${currentWeek.week}.pdf`);
}

// Wochenende oder Feiertag prüfen
async function checkWeekendOrHoliday() {
    const date = getDateForWeekAndDay(currentWeek.year, currentWeek.week, currentDay);
    const isSpecialDay = await isWeekendOrHoliday(date);

    const workplaceCards = document.querySelectorAll('.workplace-card');
    const statusCards = document.querySelectorAll('.status-card');

    if (isSpecialDay) {
        workplaces.forEach(workplace => {
            const card = document.querySelector(`.workplace-card[data-workplace="${workplace}"]`);
            card.style.display = 'none';
        });

        additionalStatus.forEach(status => {
            const card = document.querySelector(`.status-card[data-status="${status}"]`);
            if (['Dienst', 'Hintergrund'].includes(status)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    } else {
        workplaces.forEach(workplace => {
            const card = document.querySelector(`.workplace-card[data-workplace="${workplace}"]`);
            card.style.display = 'block';
        });

        additionalStatus.forEach(status => {
            const card = document.querySelector(`.status-card[data-status="${status}"]`);
            card.style.display = 'block';
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

// Entfernen eines Mitarbeiters aus einer Zuordnung
function removeStaffFromAssignment(staffName, workplace = null, status = null) {
    if (workplace) {
        if (currentWeek[currentDay][workplace]) {
            currentWeek[currentDay][workplace] = currentWeek[currentDay][workplace].filter(staff => staff.name !== staffName);
        }
    }

    if (status) {
        if (currentWeek[currentDay][status]) {
            currentWeek[currentDay][status] = currentWeek[currentDay][status].filter(staff => staff.name !== staffName);
        }
    }
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
        if (response.ok) {
            alert('Wochenplan erfolgreich gespeichert!');
        } else {
            throw new Error('Fehler beim Speichern des Wochenplans');
        }
    } catch (error) {
        console.error('Fehler beim Speichern:', error);
        alert('Fehler beim Speichern des Wochenplans. Bitte versuchen Sie es erneut.');
    }
}

// Neue Funktion zum Laden des Wochenplans
async function loadPlan() {
    try {
        const response = await fetch(`/api/load-plan?year=${currentWeek.year}&week=${currentWeek.week}`);
        if (response.ok) {
            const planData = await response.json();
            currentWeek = planData;
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
function checkPassword() {
    const password = prompt('Bitte geben Sie das Passwort ein:');
    if (password === 'Kandinsky1!') {
        window.location.href = 'editor.html';
    } else {
        alert('Falsches Passwort!');
    }
}

// Hilfsfunktion zur Überprüfung des Editor-Modus
function isEditorMode() {
    return window.location.pathname.includes('editor.html');
}

// LocalStorage-Funktionen
function saveToLocalStorage() {
    localStorage.setItem('currentWeek', JSON.stringify(currentWeek));
}

function loadFromLocalStorage() {
    const storedWeek = localStorage.getItem('currentWeek');
    if (storedWeek) {
        currentWeek = JSON.parse(storedWeek);
    } else {
        initializeEmptyWeek();
    }
}

// Aktualisierte saveWeekPlan-Funktion
async function saveWeekPlan() {
    saveToLocalStorage();
    await savePlan();
}

// Aktualisierte loadWeekPlan-Funktion
async function loadWeekPlan() {
    loadFromLocalStorage();
    await loadPlan();
}

// Initialisierung der Anwendung (Aufruf am Ende der Datei)
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    checkBrowserCompatibility();
    initializeWeekPicker();
    if (isEditorMode()) {
        initializeWorkplaceCards();
        initializeStatusCards();
        initializeDragAndDrop();
        initializeSidebar();
    } else {
        initializeReadOnlyView();
    }
    initializeEventListeners();
    setCurrentWeek();
    loadWeekPlan();
    updateUI();
    feather.replace();
}
