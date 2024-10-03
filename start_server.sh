#!/bin/bash
cd /home/pi/wochenplan-radiologie
pm2 start server.js --name wochenplan-radiologie --env production
