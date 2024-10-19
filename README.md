# Wochenplan Radiologie - Installationsanleitung

Diese Anleitung führt Sie Schritt für Schritt durch die Installation und Konfiguration der Anwendung **Wochenplan Radiologie** auf einem Raspberry Pi, sodass sie über Ihre MyFRITZ!-Adresse per HTTPS erreichbar ist. Die Anleitung richtet sich an Benutzer ohne tiefergehende technische Kenntnisse und erklärt jeden Schritt ausführlich.

---

## Inhaltsverzeichnis

1. [Überblick über die Komponenten](#1-überblick-über-die-komponenten)
2. [Vorbereitungen](#2-vorbereitungen)
3. [Installation des Raspberry Pi OS](#3-installation-des-raspberry-pi-os)
4. [Initiale Konfiguration des Raspberry Pi](#4-initiale-konfiguration-des-raspberry-pi)
5. [Installation der erforderlichen Software](#5-installation-der-erforderlichen-software)
6. [Konfiguration der Fritz!Box](#6-konfiguration-der-fritzbox)
7. [Installation der Anwendung](#7-installation-der-anwendung)
8. [Einrichtung von PM2 für die Anwendung](#8-einrichtung-von-pm2-für-die-anwendung)
9. [Einrichtung von Nginx als Reverse Proxy](#9-einrichtung-von-nginx-als-reverse-proxy)
10. [Einrichtung von Let's Encrypt SSL-Zertifikaten](#10-einrichtung-von-lets-encrypt-ssl-zertifikaten)
11. [Automatische Erneuerung der SSL-Zertifikate](#11-automatische-erneuerung-der-ssl-zertifikate)
12. [Anwendung testen und nutzen](#12-anwendung-testen-und-nutzen)
13. [Aktualisierung der Anwendung](#13-aktualisierung-der-anwendung)
14. [Fehlerbehebung und Support](#14-fehlerbehebung-und-support)
15. [Anhang: Wichtige Dateien und Verzeichnisse](#15-anhang-wichtige-dateien-und-verzeichnisse)
16. [Lizenz](#16-lizenz)

---

## 1. Überblick über die Komponenten

- **Raspberry Pi 4** mit **Raspberry Pi OS (64-bit)**.
- **Fritz!Box** als Router mit MyFRITZ!-Dienst.
- **MyFRITZ!-Adresse** für den externen Zugriff (`raspberrypi.hyg6zkbn2mykr1go.myfritz.net`).
- **Nginx** als Webserver und Reverse Proxy.
- **PM2** zur Verwaltung der Anwendung.
- **SQLite** als Datenbank.
- **Certbot** von Let's Encrypt für die SSL-Zertifizierung.

---

## 2. Vorbereitungen

### Hardware

- **Raspberry Pi 4** (oder kompatibel).
- **MicroSD-Karte** (mindestens 16 GB empfohlen).
- **Netzteil**, **HDMI-Kabel**, **Tastatur** und **Monitor** für die erste Einrichtung.

### Zugangsdaten und Informationen

- **Zugriff** auf die **Fritz!Box**-Benutzeroberfläche.
- **Internetverbindung** für den Raspberry Pi.
- **MyFRITZ!-Adresse** Ihres Raspberry Pi:
  ```
  raspberrypi.hyg6zkbn2mykr1go.myfritz.net
  ```

---

## 3. Installation des Raspberry Pi OS

1. **Raspberry Pi Imager herunterladen und installieren**:

   - Laden Sie den **Raspberry Pi Imager** von der offiziellen [Raspberry Pi Webseite](https://www.raspberrypi.org/software/) herunter und installieren Sie ihn auf Ihrem Computer.

2. **Raspberry Pi OS auf die SD-Karte installieren**:

   - Starten Sie den Raspberry Pi Imager.
   - **Betriebssystem auswählen**:
     - Wählen Sie **Raspberry Pi OS (64-bit)**.
   - **Speicher auswählen**:
     - Wählen Sie Ihre **SD-Karte** aus.
   - **Optionale Vorkonfiguration**:
     - Klicken Sie auf das **Zahnrad-Symbol** (Einstellungen), um folgende Einstellungen vorzunehmen:
       - **Hostname** setzen (z. B. `raspberrypi`).
       - **SSH aktivieren** und **Authentifizierungsmethode** festlegen.
       - **Benutzername und Passwort** festlegen (Standardbenutzer ist `pi`).
       - **WLAN einrichten** (falls verwendet).
       - **Gebietsschema** einstellen (Sprache, Zeitzone, Tastaturlayout).
   - **Schreiben**:
     - Klicken Sie auf **Schreiben**, um das Betriebssystem auf die SD-Karte zu installieren.
   - **Warten Sie**, bis der Vorgang abgeschlossen ist, und entfernen Sie die SD-Karte sicher vom Computer.

3. **Raspberry Pi starten**:

   - Legen Sie die SD-Karte in den Raspberry Pi ein.
   - Schließen Sie Tastatur, Monitor und Netzwerkverbindung an.
   - Schalten Sie den Raspberry Pi ein.
   - **Hinweis**: Bei korrekter Vorkonfiguration sollte der Raspberry Pi automatisch starten und sich mit dem Netzwerk verbinden.

---

## 4. Initiale Konfiguration des Raspberry Pi

1. **Erstkonfiguration durchführen**:

   - Wenn der Raspberry Pi startet, folgen Sie den Anweisungen auf dem Bildschirm.
   - **Sprache**, **Zeitzone** und **Tastaturlayout** bestätigen oder anpassen.
   - **System aktualisieren**, wenn Sie dazu aufgefordert werden.

2. **SSH-Zugang prüfen**:

   - Falls nicht bereits aktiviert, aktivieren Sie SSH über die **Raspberry Pi Konfiguration**:
     - Öffnen Sie das Terminal und geben Sie ein:
       ```bash
       sudo raspi-config
       ```
     - Wählen Sie **Interface Options** > **SSH** und aktivieren Sie es.

3. **System aktualisieren**:

   - Öffnen Sie das Terminal und führen Sie folgende Befehle aus:
     ```bash
     sudo apt update
     sudo apt upgrade -y
     ```

4. **Remote-Zugriff einrichten (optional)**:

   - Wenn Sie möchten, können Sie nun den Raspberry Pi über SSH von einem anderen Computer aus steuern:
     ```bash
     ssh pi@raspberrypi.local
     ```
   - Verwenden Sie den Hostnamen oder die IP-Adresse Ihres Raspberry Pi.

---

## 5. Installation der erforderlichen Software

1. **Node.js installieren**:

   - Fügen Sie das NodeSource-Repository hinzu und installieren Sie Node.js:
     ```bash
     curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
     sudo apt install -y nodejs
     ```
   - Überprüfen Sie die Installation:
     ```bash
     node -v
     ```
     - Die Ausgabe sollte die installierte Node.js-Version anzeigen (z. B. `v20.x.x`).

2. **Git, Nginx, SQLite und Certbot installieren**:

   ```bash
   sudo apt install -y git nginx sqlite3 certbot python3-certbot-nginx
   ```

3. **PM2 installieren**:

   - Installieren Sie PM2 global:
     ```bash
     sudo npm install -g pm2
     ```
   - Aktualisieren Sie NPM auf die neueste Version:
     ```bash
     sudo npm install -g npm
     ```

4. **Firewall einrichten (optional, aber empfohlen)**:

   - Installieren und konfigurieren Sie UFW:
     ```bash
     sudo apt install ufw
     sudo ufw allow OpenSSH
     sudo ufw allow 'Nginx Full'
     sudo ufw enable
     ```
   - **Hinweis**: Die Firewall schützt Ihren Raspberry Pi vor unerwünschtem Zugriff.

---

## 6. Konfiguration der Fritz!Box

1. **MyFRITZ!-Konto einrichten**:

   - Melden Sie sich in Ihrer Fritz!Box an (`http://fritz.box`).
   - Gehen Sie zu **Internet** > **MyFRITZ!-Konto**.
   - Richten Sie ein MyFRITZ!-Konto ein oder melden Sie sich an.
   - Notieren Sie sich die **MyFRITZ!-Adresse** Ihres Raspberry Pi:
     ```
     raspberrypi.hyg6zkbn2mykr1go.myfritz.net
     ```

2. **Portfreigaben einrichten**:

   - Gehen Sie zu **Internet** > **Freigaben** > **Portfreigaben**.
   - **Neue Portfreigabe** hinzufügen:
     - **Gerät**: Wählen Sie Ihren Raspberry Pi aus der Liste aus.
     - **Anwendung**: **HTTP-Server** (Port 80).
     - **Freigabe aktivieren**.
   - Wiederholen Sie den Vorgang für **HTTPS-Server** (Port 443).
   - Stellen Sie sicher, dass die Portfreigaben korrekt eingerichtet sind.

3. **DynDNS überprüfen**:

   - Gehen Sie zu **Internet** > **Online-Monitor** und stellen Sie sicher, dass Ihre MyFRITZ!-Adresse aktiv ist.

---

## 7. Installation der Anwendung

1. **In das Anwendungsverzeichnis wechseln und Repository klonen**:

   - Erstellen Sie das Verzeichnis `/srv/wochenplan-radiologie`:
     ```bash
     sudo mkdir -p /srv/wochenplan-radiologie
     sudo chown pi:pi /srv/wochenplan-radiologie
     ```
   - Wechseln Sie in das Verzeichnis:
     ```bash
     cd /srv/wochenplan-radiologie
     ```
   - Klonen Sie das GitHub-Repository:
     ```bash
     git clone https://github.com/mlurz92/wochenplan-radiologie.git .
     ```

2. **Abhängigkeiten installieren**:

   ```bash
   npm install
   ```

3. **Datenbank einrichten**:

   - Die Anwendung erstellt die SQLite-Datenbank automatisch beim ersten Start.
   - Überprüfen Sie, ob die Datei `wochenplan.db` im Verzeichnis vorhanden ist (wird nach dem ersten Start erstellt).

4. **Skripte ausführbar machen**:

   Stellen Sie sicher, dass die Skripte `start_server.sh` und `update_app.sh` ausführbar sind:
   ```bash
   chmod +x start_server.sh update_app.sh
   ```

---

## 8. Einrichtung von PM2 für die Anwendung

1. **Anwendung mit PM2 starten**:

   - Starten Sie die Anwendung mit dem bereitgestellten Skript:
     ```bash
     ./start_server.sh
     ```
     - Alternativ können Sie den Befehl direkt ausführen:
       ```bash
       pm2 start server.js --name wochenplan-radiologie --env production
       ```

   - Überprüfen Sie, ob die Anwendung läuft:
     ```bash
     pm2 list
     ```
     - Sie sollten einen Eintrag mit dem Namen "wochenplan-radiologie" sehen und den Status "online".

2. **PM2 beim Systemstart automatisch starten lassen**:

   - Generieren Sie ein Startup-Skript:
     ```bash
     pm2 startup systemd
     ```
   - Folgen Sie den Anweisungen und führen Sie den angezeigten Befehl mit `sudo` aus. Beispiel:
     ```bash
     sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u pi --hp /home/pi
     ```
   - Speichern Sie die aktuelle PM2-Prozessliste:
     ```bash
     pm2 save
     ```
   - **Hinweis**: PM2 kümmert sich nun darum, dass die Anwendung nach einem Neustart automatisch gestartet wird.

---

## 9. Einrichtung von Nginx als Reverse Proxy

1. **Standard-Nginx-Seite entfernen**:

   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   ```

2. **Nginx-Konfiguration für die Anwendung erstellen**:

   - Erstellen Sie eine neue Konfigurationsdatei:
     ```bash
     sudo nano /etc/nginx/sites-available/wochenplan-radiologie
     ```
   - Fügen Sie folgenden Inhalt ein (ersetzen Sie die MyFRITZ!-Adresse mit Ihrer eigenen):

     ```nginx
     server {
         listen 80;
         server_name raspberrypi.hyg6zkbn2mykr1go.myfritz.net;

         # Alle HTTP-Anfragen auf HTTPS umleiten
         return 301 https://$host$request_uri;
     }

     server {
         listen 443 ssl;
         server_name raspberrypi.hyg6zkbn2mykr1go.myfritz.net;

         ssl_certificate /etc/letsencrypt/live/raspberrypi.hyg6zkbn2mykr1go.myfritz.net/fullchain.pem;
         ssl_certificate_key /etc/letsencrypt/live/raspberrypi.hyg6zkbn2mykr1go.myfritz.net/privkey.pem;
         include /etc/letsencrypt/options-ssl-nginx.conf;
         ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

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

   - **Speichern** Sie die Datei (`Strg+O`, `Enter`) und schließen Sie den Editor (`Strg+X`).

3. **Konfiguration aktivieren und Nginx neu starten**:

   ```bash
   sudo ln -s /etc/nginx/sites-available/wochenplan-radiologie /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```
   - **Hinweis**: `nginx -t` testet die Konfiguration auf Fehler.

---

## 10. Einrichtung von Let's Encrypt SSL-Zertifikaten

Nachdem Nginx nun korrekt konfiguriert ist, um sowohl HTTP als auch HTTPS zu bedienen, führen Sie Certbot erneut aus, um das SSL-Zertifikat zu aktualisieren und die Umleitung einzurichten.

1. **Certbot mit dem Nginx-Plugin ausführen**:

   ```bash
   sudo certbot --nginx -d raspberrypi.hyg6zkbn2mykr1go.myfritz.net
   ```

2. **Optionen während der Certbot-Ausführung wählen**:

   Während der Ausführung von Certbot werden Sie gefragt, wie Sie den Webserver konfigurieren möchten. Da Sie bereits einen separaten Server-Block für HTTP erstellt haben, wählen Sie **Keine Änderungen an der Webserver-Konfiguration vornehmen** oder bestätigen Sie die vorhandene HTTPS-Konfiguration.

3. **Manuelle Einrichtung der Umleitung (falls erforderlich)**:

   Falls Certbot die Umleitung nicht automatisch einrichten kann, haben Sie bereits einen separaten Server-Block für die Umleitung erstellt (siehe [Einrichtung von Nginx als Reverse Proxy](#9-einrichtung-von-nginx-als-reverse-proxy)). Stellen Sie sicher, dass dieser Block korrekt konfiguriert ist.

4. **Überprüfung der Nginx-Konfiguration**:

   Testen Sie die Nginx-Konfiguration erneut:
   ```bash
   sudo nginx -t
   ```
   - Bei erfolgreichem Test starten Sie Nginx neu:
     ```bash
     sudo systemctl restart nginx
     ```

5. **SSL-Zertifikate überprüfen**:

   Die SSL-Zertifikate sollten nun unter folgendem Pfad vorhanden sein:
   ```
   /etc/letsencrypt/live/raspberrypi.hyg6zkbn2mykr1go.myfritz.net/
   ```

---

## 11. Automatische Erneuerung der SSL-Zertifikate

1. **Certbot automatische Erneuerung testen**:

   ```bash
   sudo certbot renew --dry-run
   ```
   - **Erwartete Ausgabe:**
     ```
     - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
     Processing /etc/letsencrypt/renewal/raspberrypi.hyg6zkbn2mykr1go.myfritz.net.conf
     ...
     Congratulations, all renewals succeeded. The following certs have been renewed:
       /etc/letsencrypt/live/raspberrypi.hyg6zkbn2mykr1go.myfritz.net/fullchain.pem (success)
     - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
     ```

2. **Certbot-Timer überprüfen**:

   Certbot richtet normalerweise einen Systemd-Timer ein, um die Zertifikate automatisch zu erneuern. Überprüfen Sie, ob dieser aktiv ist:

   ```bash
   sudo systemctl list-timers | grep certbot
   ```
   - **Erwartete Ausgabe:**
     ```
     Wed 2024-10-23 03:00:00 UTC  certbot.timer          certbot.service         active waiting
     ```

   - **Falls kein Timer vorhanden ist:**
     - Richten Sie den Timer manuell ein:
       ```bash
       sudo systemctl enable certbot.timer
       sudo systemctl start certbot.timer
       ```

3. **Manuelles Erneuern der Zertifikate (falls erforderlich)**:

   ```bash
   sudo certbot renew
   ```
   - Nach der Erneuerung starten Sie Nginx neu, um die neuen Zertifikate zu laden:
     ```bash
     sudo systemctl restart nginx
     ```

---

## 12. Anwendung testen und nutzen

1. **Anwendung über HTTPS aufrufen**:

   - Öffnen Sie Ihren Browser und navigieren Sie zu:
     ```
     https://raspberrypi.hyg6zkbn2mykr1go.myfritz.net
     ```

2. **Überprüfung**:

   - Sie sollten nun die Anwendung sehen und nutzen können.
   - Stellen Sie sicher, dass die Verbindung als **sicher** angezeigt wird (Schlosssymbol in der Adressleiste).

3. **Anwendung nutzen**:

   - **Wochenpläne erstellen und verwalten**.
   - **PDF-Export** nutzen.
   - **Passwortschutz** beachten (falls implementiert).

---

## 13. Aktualisierung der Anwendung

Die Anwendung kann einfach aktualisiert werden, indem Sie das bereitgestellte Update-Skript verwenden.

1. **Update-Skript ausführen**:

   - Führen Sie das Update-Skript aus, um den neuesten Code zu ziehen, Abhängigkeiten zu installieren und die Anwendung neu zu starten:
     ```bash
     ./update_app.sh
     ```
   - Alternativ können Sie die Befehle manuell ausführen:
     ```bash
     cd /srv/wochenplan-radiologie
     git pull
     npm install
     chmod +x start_server.sh update_app.sh
     pm2 restart wochenplan-radiologie --env production
     ```

2. **Nginx-Konfiguration neu laden (falls geändert)**:

   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

---

## 14. Fehlerbehebung und Support

### Anwendung läuft nicht

- **PM2-Prozess prüfen**:
  ```bash
  pm2 list
  ```
- **Logs anzeigen**:
  ```bash
  pm2 logs wochenplan-radiologie
  ```
  - Überprüfen Sie auf Fehlermeldungen und beheben Sie diese entsprechend.

### Nginx startet nicht

- **Nginx-Konfiguration testen**:
  ```bash
  sudo nginx -t
  ```
- **Nginx-Logs anzeigen**:
  ```bash
  sudo tail -f /var/log/nginx/error.log
  ```

### SSL-Zertifikate nicht vorhanden oder abgelaufen

- **Certbot erneut ausführen**:
  ```bash
  sudo certbot --nginx -d raspberrypi.hyg6zkbn2mykr1go.myfritz.net
  ```
- **Firewall und Portfreigaben prüfen**:
  - Stellen Sie sicher, dass Port 80 und 443 offen sind.

### Anwendung nicht erreichbar

- **Portfreigaben in der Fritz!Box prüfen**.
- **Internetverbindung des Raspberry Pi prüfen**.
- **DNS-Auflösung prüfen**:
  ```bash
  nslookup raspberrypi.hyg6zkbn2mykr1go.myfritz.net
  ```
- **MyFRITZ!-Status überprüfen**.


## 15. Anhang: Wichtige Dateien und Verzeichnisse

- **Anwendungsverzeichnis**: `/srv/wochenplan-radiologie/`
- **Start-Skript**: `start_server.sh`
- **Update-Skript**: `update_app.sh`
- **Nginx-Konfiguration**: `/etc/nginx/sites-available/wochenplan-radiologie`
- **SSL-Zertifikate**: `/etc/letsencrypt/live/raspberrypi.hyg6zkbn2mykr1go.myfritz.net/`
- **PM2-Prozessliste**: Gespeichert unter `/home/pi/.pm2/`
- **Nginx-Logs**: `/var/log/nginx/`
- **Datenbank**: `wochenplan.db` (wird automatisch erstellt)

### Wichtige Dateien im Anwendungsverzeichnis

```
/srv/wochenplan-radiologie/
│
├── public/
│   ├── index.html
│   ├── editor.html
│   ├── styles.css
│   └── app.js
│
├── node_modules/  (wird durch npm install generiert)
│
├── server.js
├── package.json
├── package-lock.json
├── .gitignore
├── .env
├── wochenplan.db  (wird automatisch erstellt)
├── start_server.sh
├── README.md
└── update_app.sh
```

---
