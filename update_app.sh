#!/bin/bash

# Ins Arbeitsverzeichnis wechseln
cd /srv/wochenplan-radiologie || exit

# Git-Konfiguration setzen
git config --local user.name "mlurz92"
git config --local user.email "MarkusLurz@gmx.de"

# Lokale Änderungen verwerfen und Branch zurücksetzen
git fetch origin
git checkout main
git reset --hard origin/main
git clean -fd

# Stelle sicher, dass wir die neuesten Änderungen haben
git pull origin main

# NPM-Pakete neu installieren
rm -rf node_modules
npm install
npm audit fix --force

# Berechtigungen für Skripte und Verzeichnisse setzen
sudo chown -R mlurz92:mlurz92 .
chmod +x start_server.sh update_app.sh

# PM2-Prozess neustarten
pm2 delete wochenplan-radiologie 2>/dev/null || true
pm2 start server.js --name wochenplan-radiologie -- --env production

echo "Update abgeschlossen - Repository ist jetzt auf dem neuesten Stand"
