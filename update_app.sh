#!/bin/bash

# Ins Arbeitsverzeichnis wechseln
cd /srv/wochenplan-radiologie || exit

echo "Bereinige und konfiguriere Git..."
# Git-Konfiguration setzen
git config --local user.name "mlurz92"
git config --local user.email "MarkusLurz@gmx.de"

# Remote-Repository bereinigen und konfigurieren
echo "Bereinige Remote-Repositories..."
git remote remove upstream 2>/dev/null || true
git remote remove origin 2>/dev/null || true
git remote add origin https://github.com/mlurz92/wochenplan-radiologie.git

# Status anzeigen
echo "Aktuelle Remote-Konfiguration:"
git remote -v

# Lokale Änderungen verwerfen und Branch zurücksetzen
echo "Hole aktuelle Änderungen..."
git fetch origin
git checkout main || git checkout -b main
git reset --hard origin/main
git clean -fd

# Stelle sicher, dass wir die neuesten Änderungen haben
git pull origin main

echo "Aktualisiere NPM-Pakete..."
# NPM-Pakete neu installieren
rm -rf node_modules
npm install
npm audit fix --force

# Berechtigungen für Skripte und Verzeichnisse setzen
echo "Setze Berechtigungen..."
sudo chown -R pi:pi .
chmod +x start_server.sh update_app.sh

# PM2-Prozess neustarten
echo "Starte Anwendung neu..."
pm2 delete wochenplan-radiologie 2>/dev/null || true
pm2 start server.js --name wochenplan-radiologie -- --env production

echo "Update abgeschlossen - Repository ist jetzt auf dem neuesten Stand"
