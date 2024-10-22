#!/bin/bash
cd /srv/wochenplan-radiologie
git pull
npm install
chmod +x start_server.sh update_app.sh
pm2 restart wochenplan-radiologie --env production
