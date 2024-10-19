#!/bin/bash
cd /srv/wochenplan-radiologie
pm2 start server.js --name wochenplan-radiologie --env production
