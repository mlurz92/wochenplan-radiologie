
# Wochenplan Radiologie auf Raspberry Pi 4

Diese Anleitung führt Sie durch den gesamten Prozess der Einrichtung eines Raspberry Pi 4 und der Installation des Wochenplan-Radiologie-Projekts, einschließlich der Konfiguration mit einer Fritzbox.

## Benötigte Hardware

- Raspberry Pi 4 (mindestens 2GB RAM empfohlen)
- MicroSD-Karte (mindestens 8GB)
- Stromversorgung für Raspberry Pi 4
- Ethernet-Kabel
- Computer mit SD-Kartenleser
- Fritzbox-Router

## 1. Vorbereitung des Raspberry Pi 4

### 1.1 Betriebssystem herunterladen

1. Besuchen Sie die offizielle Raspberry Pi Website: https://www.raspberrypi.org/software/
2. Laden Sie den "Raspberry Pi Imager" für Ihr Betriebssystem herunter und installieren Sie ihn.

### 1.2 Betriebssystem auf die SD-Karte schreiben

1. Stecken Sie die MicroSD-Karte in Ihren Computer.
2. Öffnen Sie den Raspberry Pi Imager.
3. Klicken Sie auf "CHOOSE OS" und wählen Sie "Raspberry Pi OS Lite (64-bit)".
4. Klicken Sie auf "CHOOSE STORAGE" und wählen Sie Ihre MicroSD-Karte.
5. Klicken Sie auf das Zahnrad-Symbol für erweiterte Optionen:
   - Aktivieren Sie "Enable SSH"
   - Setzen Sie Benutzername und Passwort (z.B. Benutzer: pi, Passwort: ein sicheres Passwort Ihrer Wahl)
   - Konfigurieren Sie Ihr WLAN (optional, wenn Sie kein Ethernet-Kabel verwenden)
6. Klicken Sie auf "WRITE" und warten Sie, bis der Vorgang abgeschlossen ist.

### 1.3 Raspberry Pi starten

1. Entfernen Sie die MicroSD-Karte aus Ihrem Computer und stecken Sie sie in den Raspberry Pi.
2. Verbinden Sie den Raspberry Pi mit einem Ethernet-Kabel mit Ihrer Fritzbox.
3. Schließen Sie die Stromversorgung an den Raspberry Pi an.

## 2. Verbindung zum Raspberry Pi herstellen

### 2.1 IP-Adresse finden

1. Öffnen Sie die Benutzeroberfläche Ihrer Fritzbox (normalerweise http://fritz.box).
2. Navigieren Sie zum Bereich "Heimnetz" > "Netzwerk".
3. Suchen Sie in der Liste der verbundenen Geräte nach "raspberry" und notieren Sie die IP-Adresse.

### 2.2 SSH-Verbindung herstellen

1. Öffnen Sie auf Ihrem Computer ein Terminal (Linux/Mac) oder PowerShell (Windows).
2. Geben Sie folgenden Befehl ein (ersetzen Sie `<IP-ADRESSE>` durch die notierte IP):
   ```
   ssh pi@<IP-ADRESSE>
   ```
3. Bestätigen Sie die Sicherheitsabfrage mit "yes".
4. Geben Sie das Passwort ein, das Sie beim Erstellen des Images festgelegt haben.

## 3. Raspberry Pi konfigurieren

### 3.1 System aktualisieren

```bash
sudo apt update
sudo apt upgrade -y
```

### 3.2 Benötigte Pakete installieren

```bash
sudo apt install -y git nodejs npm nginx
```

## 4. Wochenplan-Radiologie-Projekt installieren

### 4.1 Projektverzeichnis erstellen

```bash
sudo mkdir -p /srv/wochenplan-radiologie
sudo chown pi:pi /srv/wochenplan-radiologie
```

### 4.2 Projekt klonen

```bash
git clone https://github.com/mlurz92/wochenplan-radiologie.git /srv/wochenplan-radiologie
```

### 4.3 Abhängigkeiten installieren

```bash
cd /srv/wochenplan-radiologie
npm install
```

### 4.4 PM2 installieren und konfigurieren

```bash
sudo npm install -g pm2
pm2 start server.js --name wochenplan-radiologie
sudo env PATH=$PATH:/usr/bin /usr/local/bin/pm2 startup systemd -u pi --hp /home/pi
pm2 save
```

## 5. Server konfigurieren

### 5.1 Systemd-Service erstellen

1. Erstellen Sie eine neue Datei:
   ```bash
   sudo nano /etc/systemd/system/wochenplan-radiologie.service
   ```

2. Fügen Sie folgenden Inhalt ein:
   ```ini
   [Unit]
   Description=Wochenplan Radiologie
   After=network.target

   [Service]
   Type=forking
   User=pi
   WorkingDirectory=/srv/wochenplan-radiologie
   ExecStart=/usr/local/bin/pm2 start server.js --name wochenplan-radiologie
   Restart=on-failure

   [Install]
   WantedBy=multi-user.target
   ```

3. Speichern Sie die Datei mit STRG+O, bestätigen Sie mit ENTER, und schließen Sie den Editor mit STRG+X.

4. Aktivieren und starten Sie den Service:
   ```bash
   sudo systemctl enable wochenplan-radiologie.service
   sudo systemctl start wochenplan-radiologie.service
   ```

### 5.2 Nginx als Reverse Proxy konfigurieren

1. Erstellen Sie eine neue Nginx-Konfigurationsdatei:
   ```bash
   sudo nano /etc/nginx/sites-available/wochenplan-radiologie
   ```

2. Fügen Sie folgenden Inhalt ein:
   ```nginx
   server {
       listen 80;
       server_name _;

       root /srv/wochenplan-radiologie/public;
       index index.html;

       location / {
           try_files $uri $uri/ @nodejs;
       }

       location @nodejs {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. Speichern Sie die Datei mit STRG+O, bestätigen Sie mit ENTER, und schließen Sie den Editor mit STRG+X.

4. Aktivieren Sie die Konfiguration:
   ```bash
   sudo ln -s /etc/nginx/sites-available/wochenplan-radiologie /etc/nginx/sites-enabled/
   sudo rm /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl restart nginx
   ```

### 5.3 Firewall konfigurieren

```bash
sudo apt install -y ufw
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## 6. Fritzbox-Konfiguration

1. Öffnen Sie die Fritzbox-Benutzeroberfläche (http://fritz.box).
2. Navigieren Sie zu "Internet" > "Freigaben".
3. Klicken Sie auf "Neue Freigabe".
4. Wählen Sie "Andere Anwendung".
5. Geben Sie folgende Informationen ein:
   - Bezeichnung: Wochenplan Radiologie
   - Protokoll: TCP
   - Port an Gerät im Heimnetz: 80
   - Internes Gerät: Wählen Sie Ihren Raspberry Pi aus der Liste
6. Klicken Sie auf "OK" zum Speichern.

## 7. Zugriff auf die Anwendung

Sie können nun von jedem Gerät in Ihrem Heimnetzwerk auf die Anwendung zugreifen, indem Sie die IP-Adresse Ihres Raspberry Pi in einen Webbrowser eingeben:

```
http://<IP-ADRESSE-DES-RASPBERRY-PI>
```

Um von außerhalb Ihres Heimnetzwerks auf die Anwendung zuzugreifen, verwenden Sie die öffentliche IP-Adresse Ihrer Fritzbox (Sie finden sie unter "Internet" > "Online-Monitor" in der Fritzbox-Oberfläche):

```
http://<ÖFFENTLICHE-IP-IHRER-FRITZBOX>
```

## 8. Wartung und Updates

### 8.1 Skripte für einfache Verwaltung erstellen

1. Erstellen Sie `start_server.sh`:
   ```bash
   nano /srv/wochenplan-radiologie/start_server.sh
   ```
   Inhalt:
   ```bash
   #!/bin/bash
   cd /srv/wochenplan-radiologie
   pm2 start server.js --name wochenplan-radiologie
   ```

2. Erstellen Sie `update_app.sh`:
   ```bash
   nano /srv/wochenplan-radiologie/update_app.sh
   ```
   Inhalt:
   ```bash
   #!/bin/bash
   cd /srv/wochenplan-radiologie
   git pull
   npm install
   pm2 restart wochenplan-radiologie
   ```

3. Machen Sie die Skripte ausführbar:
   ```bash
   chmod +x /srv/wochenplan-radiologie/start_server.sh /srv/wochenplan-radiologie/update_app.sh
   ```

### 8.2 Anwendung aktualisieren

Um die Anwendung zu aktualisieren, führen Sie folgendes aus:

```bash
/srv/wochenplan-radiologie/update_app.sh
```

## 9. Sicherheitshinweise

- Ändern Sie regelmäßig das Passwort Ihres Raspberry Pi.
- Halten Sie Ihr System und alle Anwendungen stets auf dem neuesten Stand.
- Erwägen Sie die Einrichtung einer VPN-Verbindung für sicheren Fernzugriff.

Herzlichen Glückwunsch! Sie haben erfolgreich den Wochenplan Radiologie auf Ihrem Raspberry Pi 4 installiert und konfiguriert.
