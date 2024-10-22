#!/bin/bash

# Ins Arbeitsverzeichnis wechseln
cd /srv/wochenplan-radiologie

# Git-Konfiguration setzen, falls nicht vorhanden
if [ -z "$(git config --get user.name)" ]; then
    git config --local user.name "mlurz92"
    git config --local user.email "markuslurz@gmx.de"
fi

# Git-Pull durchführen
git pull

# NPM-Pakete aktualisieren und Sicherheitsprobleme beheben
npm install
npm audit fix --force

# Berechtigungen für Skripte setzen
chmod +x start_server.sh update_app.sh

# PM2-Prozess neustarten
pm2 delete wochenplan-radiologie 2>/dev/null || true
pm2 start server.js --name wochenplan-radiologie -- --env production
