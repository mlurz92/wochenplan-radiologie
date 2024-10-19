
---

# Wochenplan Radiologie

Diese Anwendung dient zur Erstellung und Verwaltung von Wochenplänen für radiologische Abteilungen. Diese Anleitung führt Sie Schritt für Schritt durch die Einrichtung und Nutzung der Anwendung.

## Inhaltsverzeichnis
1. [Überblick über die Komponenten](#überblick-über-die-komponenten)
2. [Vorbereitungen](#vorbereitungen)
3. [Installation des Raspberry Pi OS](#installation-des-raspberry-pi-os)
4. [Initiale Konfiguration des Raspberry Pi](#initiale-konfiguration-des-raspberry-pi)
5. [Installation aller Abhängigkeiten](#installation-aller-abhängigkeiten)
6. [Fritz!Box konfigurieren](#fritzbox-konfigurieren)
7. [STRATO-Domain konfigurieren](#strato-domain-konfigurieren)
8. [Installation der Anwendung](#installation-der-anwendung)
9. [SSL-Zertifikat einrichten](#ssl-zertifikat-einrichten)
10. [Nginx als Reverse Proxy konfigurieren](#nginx-als-reverse-proxy-konfigurieren)
11. [Nutzung der Anwendung](#nutzung-der-anwendung)
12. [Aktualisierung der Anwendung](#aktualisierung-der-anwendung)
13. [Fehlerbehebung und Support](#fehlerbehebung-und-support)

## Überblick über die Komponenten

- **Raspberry Pi 4** mit **Raspberry Pi OS (64bit)**.
- **Fritz!Box** als Router.
- **STRATO-Domain** für den externen Zugriff.
- **Nginx** als Webserver, **pm2** zur Verwaltung der Anwendung, **SQLite** als Datenbank und **Certbot** für die SSL-Zertifizierung.

## Vorbereitungen

- **Hardware**: Raspberry Pi 4, SD-Karte (mindestens 16 GB), Netzteil, HDMI-Kabel und Tastatur.
- **Zugriff** auf das **STRATO-Kundencenter** und die **Fritz!Box**.
- **Internetverbindung**: Der Raspberry Pi sollte mit dem Internet verbunden werden.

## Installation des Raspberry Pi OS

1. **Raspberry Pi Imager installieren**:
   - Laden Sie den **Raspberry Pi Imager** von der offiziellen [Raspberry Pi Webseite](https://www.raspberrypi.org/software/) herunter und installieren Sie ihn auf Ihrem Computer.
   - Schließen Sie die SD-Karte an Ihren Computer an.

2. **Raspberry Pi OS installieren**:
   - Starten Sie den Raspberry Pi Imager.
   - Wählen Sie **Raspberry Pi OS (64-bit)** und Ihre SD-Karte aus.
   - Klicken Sie auf **Write**, um das Betriebssystem zu installieren.

3. **SD-Karte in den Raspberry Pi einlegen**:
   - Entfernen Sie die SD-Karte sicher und legen Sie sie in den Raspberry Pi ein.
   - Verbinden Sie Tastatur und Monitor, und schalten Sie den Raspberry Pi ein.

## Initiale Konfiguration des Raspberry Pi

1. **Einrichtungsassistent**:
   - Folgen Sie den Anweisungen auf dem Bildschirm, um Sprache, Zeitzone und WLAN-Verbindung einzurichten.
   - Wählen Sie ein sicheres Passwort für das Benutzerkonto.

2. **Aktivierung von SSH**:
   - Öffnen Sie das Terminal und geben Sie folgenden Befehl ein:
     ```bash
     sudo raspi-config
     ```
   - Wählen Sie **Interfacing Options** > **SSH** und aktivieren Sie es.

3. **Systemaktualisierung**:
   - Führen Sie im Terminal folgende Befehle aus:
     ```bash
     sudo apt update
     sudo apt upgrade -y
     ```

## Installation aller Abhängigkeiten

1. **Node.js installieren**:
   - Fügen Sie das NodeSource-Repository hinzu:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
     sudo apt install -y nodejs
     ```
   - Überprüfen Sie die Installation:
     ```bash
     node -v
     ```

2. **Nginx, SQLite und Certbot installieren**:
   ```bash
   sudo apt install -y git nginx sqlite3 certbot python3-certbot-nginx
   ```

3. **PM2 installieren**:
   ```bash
   sudo npm install -g pm2
   ```

4. **Firewall konfigurieren** (optional, empfohlen):
   ```bash
   sudo apt install ufw
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```

## Fritz!Box konfigurieren

1. **MyFritz und DynDNS aktivieren**:
   - Melden Sie sich bei der Fritz!Box an (`http://fritz.box`).
   - Aktivieren Sie unter **Internet > Freigaben > DynDNS** das **MyFritz!**-Konto.

2. **Portfreigabe einrichten**:
   - Unter **Internet > Freigaben > Portfreigaben** eine neue Freigabe für **HTTPS (Port 443)** erstellen und den Raspberry Pi als Zielgerät auswählen.

## STRATO-Domain konfigurieren

1. **Domain-Weiterleitung einrichten**:
   - Melden Sie sich im STRATO-Kundencenter an und konfigurieren Sie die Domain `wochenplan-radiologie.de`, um auf die MyFritz-Adresse weiterzuleiten.
   - Aktivieren Sie die SSL-Weiterleitung (HTTPS).

## Installation der Anwendung

1. **Repository klonen und Abhängigkeiten installieren**:
   ```bash
   sudo git clone https://github.com/mlurz92/wochenplan-radiologie.git /srv/wochenplan-radiologie
   cd /srv/wochenplan-radiologie
   sudo npm install
   ```

2. **Datenbank einrichten**:
   ```bash
   sqlite3 /srv/wochenplan-radiologie/wochenplan.db
   ```
   - Führen Sie SQL-Befehle aus, um die Tabellen zu erstellen (Details in der Anwendung).

3. **Anwendung mit PM2 starten**:
   ```bash
   sudo pm2 start app.js --name wochenplan
   sudo pm2 save
   ```

## SSL-Zertifikat einrichten

1. **Certbot ausführen**:
   ```bash
   sudo certbot --nginx -d raspberrypi.hyg6zkbn2mykr1go.myfritz.net
   ```
   Folgen Sie den Anweisungen, um das Zertifikat zu erstellen.

2. **Automatische Erneuerung einrichten**:
   ```bash
   sudo crontab -e
   ```
   Fügen Sie folgende Zeile hinzu:
   ```bash
   0 0 * * * /usr/bin/certbot renew --quiet
   ```

## Nginx als Reverse Proxy konfigurieren

1. **Nginx-Konfiguration erstellen**:
   - Erstellen Sie `/etc/nginx/sites-available/wochenplan`:
     ```nginx
     server {
         listen 443 ssl;
         server_name raspberrypi.hyg6zkbn2myfritz.net;

         ssl_certificate /etc/letsencrypt/live/raspberrypi.hyg6zkbn2myfritz.net/fullchain.pem;
         ssl_certificate_key /etc/letsencrypt/live/raspberrypi.hyg6zkbn2myfritz.net/privkey.pem;

         location / {
             proxy_pass http://localhost:3000;
             proxy_http_version 1.1;
             proxy_set_header Upgrade $http_upgrade;
             proxy_set_header Connection 'upgrade';
             proxy_set_header Host $host;
             proxy_cache_bypass $http_upgrade;
         }
     }
     ```

2. **Konfiguration aktivieren und Nginx neu starten**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/wochenplan /etc/nginx/sites-enabled/
   sudo systemctl restart nginx
   ```

## Nutzung der Anwendung

- **Zugriff auf die Anwendung**: Besuchen Sie [https://wochenplan-radiologie.de](https://wochenplan-radiologie.de).
- **Wochenplan erstellen**: Mitarbeiter über die Oberfläche zuweisen.
- **PDF-Export**: Exportieren Sie den Wochenplan über die Exportfunktion.

## Aktualisierung der Anwendung

1. **In das Anwendungsverzeichnis wechseln**:
   ```bash
   cd /srv/wochenplan-radiologie
   ```

2. **Code aktualisieren und Abhängigkeiten installieren**:
   ```bash
   git pull
   npm install
   ```

3. **Anwendung neu starten**:
   ```bash
   pm2 restart wochenplan
   ```

4. **Nginx-Konfiguration neu laden (falls erforderlich)**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Fehlerbehebung und Support

- **Logs anzeigen**:
   ```bash
   pm2 logs wochenplan
   ```
- **Nginx-Status prüfen**:
   ```bash
   sudo systemctl status nginx
   ```
- **Verbindung testen**:
   ```bash
   curl -I https://wochenplan-radiologie.de
   ```

---
