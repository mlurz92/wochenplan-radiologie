// app.js

// Globale Variablen
let currentWeek = {};
let currentDay = new Date().getDay();
if (currentDay === 0) currentDay = 7; // Sonntag als 7 behandeln
const workplaces = ['CT', 'MRT', 'Angiographie', 'Mammographie', 'Ultraschall', 'Kinder'];
const additionalStatus = ['Dienst', 'Hintergrund', 'Spätdienst', 'Dienstfrei', 'Urlaub', 'Weiterbildung', 'Krank', 'Sonstiges'];
const staffMembers = {
    fa: ['Polednia', 'Dalitz', 'Krzykowski', 'Lurz', 'Placzek', 'Zill'],
    aa: ['Becker', 'Fröhlich', 'Martin', 'Torki']
};

// Initialisierung der Anwendung
document.addEventListener('DOMContentLoaded', () => {
    checkBrowserCompatibility();
    initializeWeekPicker();
    initializeWorkplaceCards();
    initializeStatusCards();
    if (isEditorMode()) {
        initializeDragAndDrop();
        updateStaffPool();
    } else {
        initializeReadOnlyView();
    }
    initializeEventListeners();
    setCurrentWeek();
    loadWeekPlan();
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
            loadWeekPlan();
        }
    });

    document.getElementById('calendar-icon').addEventListener('click', function() {
        weekPicker.show();
    });
}

// Kalenderwoche berechnen
function getWeekNumber(d) {
    // Kopie des Datumsobjekts erstellen
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    // Donnerstag in aktueller Woche ermitteln
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    // Erste Jahreswoche ermitteln
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    // Kalenderwoche berechnen
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    return weekNo;
}

// Aktuelle Woche setzen
function setCurrentWeek(year = new Date().getFullYear(), week = getWeekNumber(new Date())) {
    currentWeek.year = year;
    currentWeek.week = week;
    document.getElementById('current-week').textContent = `KW ${week}, ${year} (${getDateRange(year, week)})`;
    currentDay = 1; // Auf Montag setzen
    updateUI();
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

// Initialisierung des Mitarbeiter-Pools
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

// Initialisierung der schreibgeschützten Ansicht
function initializeReadOnlyView() {
    const staffPool = document.getElementById('staff-pool');
    if (staffPool) {
        staffPool.style.display = 'none';
    }
    updateUI();
}

// Restlicher Code bleibt unverändert (Funktionen wie handleStaffAssignment, removeStaffFromAssignment, assignStaffToWorkplace, assignStaffToStatus, updateUI, etc.)

// Anpassungen im PDF-Export
function exportAsPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');

    const days = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];
    const dateRange = getDateRange(currentWeek.year, currentWeek.week);

    // Funktion zum Konvertieren von RGBA zu RGB
    function rgba2rgb(rgba, bgColor = { r: 255, g: 255, b: 255 }) {
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
    function createDayPage(day) {
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
            const cardWidth = isWorkplace ? 85 : 65;
            const cardHeight = isWorkplace ? 35 : 25;

            const rgbaColor = parseRGBA(color);
            const rgbColor = rgba2rgb(rgbaColor);
            doc.setFillColor(rgbColor.r, rgbColor.g, rgbColor.b);
            doc.roundedRect(xPosition, yPosition, cardWidth, cardHeight, 3, 3, 'F');

            doc.setFontSize(9);
            doc.setTextColor(0);
            doc.text(title, xPosition + 3, yPosition + 6);

            doc.setFontSize(7);
            let staffY = yPosition + 12;
            staffList.forEach(staff => {
                doc.text(`${staff.type === 'fa' ? 'FA: ' : 'AA: '}${staff.name}`, xPosition + 3, staffY);
                staffY += 4;
            });

            if (isWorkplace) {
                if ((index + 1) % 3 === 0) {
                    xPosition = 10;
                    yPosition += cardHeight + 5;
                } else {
                    xPosition += cardWidth + 5;
                }
            } else {
                if ((index + 1) % 4 === 0) {
                    xPosition = 10;
                    yPosition += cardHeight + 5;
                } else {
                    xPosition += cardWidth + 5;
                }
            }
        }

        // Zeichne Arbeitsplatzkarten
        workplaces.forEach((workplace, index) => {
            const staffList = currentWeek[day][workplace] || [];
            const faCount = staffList.filter(s => s.type === 'fa').length;
            const aaCount = staffList.filter(s => s.type === 'aa').length;
            let color;
            switch (workplace) {
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
            // Anpassung der Positionierung für 3x2 Layout
            if ((index + 1) % 3 === 0) {
                xPosition = 10;
                yPosition += 40;
            } else {
                xPosition += 90;
            }
        });

        // Reset position for status cards
        xPosition = 10;
        yPosition += 10;

        // Zeichne Statuskarten
        additionalStatus.forEach((status, index) => {
            const staffList = currentWeek[day][status] || [];
            let color = 'rgba(200, 200, 200, 0.2)';
            if (['Dienst', 'Hintergrund', 'Dienstfrei'].includes(status)) {
                color = staffList.length === 1 ? 'rgba(151, 255, 109, 0.2)' : 'rgba(255, 105, 107, 0.2)';
            } else if (status === 'Spätdienst') {
                color = staffList.length === 1 ? 'rgba(151, 255, 109, 0.2)' : 'rgba(200, 200, 200, 0.2)';
            }
            drawCard(status, staffList, color, false);
            // Anpassung der Positionierung für 4x2 Layout
            if ((index + 1) % 4 === 0) {
                xPosition = 10;
                yPosition += 30;
            } else {
                xPosition += 70;
            }
        });
    }

    // Erstelle eine Seite für jeden Tag
    for (let day = 1; day <= 7; day++) {
        createDayPage(day);
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
        doc.text('Übersicht', 280, 10);
        doc.link(275, 0, 22, 15, { pageNumber: doc.getNumberOfPages() });
    }

    doc.save(`Wochenplan_KW${currentWeek.week}_${currentWeek.year}.pdf`);
}
