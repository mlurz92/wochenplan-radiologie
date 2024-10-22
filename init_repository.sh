#!/bin/bash

# Verzeichnis erstellen und Berechtigungen setzen
sudo mkdir -p /srv/wochenplan-radiologie
sudo chown mlurz92:mlurz92 /srv/wochenplan-radiologie

# In das Verzeichnis wechseln
cd /srv/wochenplan-radiologie || exit

# Repository klonen
git clone https://github.com/mlurz92/wochenplan-radiologie.git .

# Git-Konfiguration setzen
git config --local user.name "mlurz92"
git config --local user.email "MarkusLurz@gmx.de"

# Node.js-Abhängigkeiten installieren
npm install

# Berechtigungen für Skripte setzen
chmod +x start_server.sh update_app.sh

# PM2 global installieren falls noch nicht vorhanden
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

# PM2 für den Benutzer konfigurieren
pm2 startup systemd -u mlurz92 --hp /home/mlurz92

# Anwendung starten
./start_server.sh

echo "Installation abgeschlossen"