#!/bin/bash

# Navigiere zum Projektverzeichnis
cd /pfad/zum/wochenplan-radiologie

# Hole die neuesten Änderungen vom Git-Repository
git pull

# Installiere neue Abhängigkeiten
npm install

# Starte den Server neu
pm2 restart wochenplan-radiologie