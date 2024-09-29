#!/bin/bash

# Navigiere zum Projektverzeichnis
cd /srv/wochenplan-radiologie

# Hole die neuesten Änderungen vom Git-Repository
git pull

# Installiere neue Abhängigkeiten
npm install

# Starte den Server neu
pm2 restart wochenplan-radiologie
