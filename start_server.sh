#!/bin/bash

# Ins Arbeitsverzeichnis wechseln
cd /srv/wochenplan-radiologie || exit

# Berechtigungen prüfen und setzen
if [ "$(stat -c '%U' .)" != "mlurz92" ]; then
    sudo chown -R mlurz92:mlurz92 .
fi

# PM2-Prozess starten
pm2 start server.js --name wochenplan-radiologie -- --env production
