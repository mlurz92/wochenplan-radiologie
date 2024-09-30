# Wochenplan Radiologie - Detaillierte Installations- und Einrichtungsanleitung

Diese umfassende Anleitung führt Sie Schritt für Schritt durch den gesamten Prozess der Installation und Einrichtung der Wochenplan-Radiologie-Website auf einem Raspberry Pi 4 mit Raspberry OS Lite 64 Bookworm. Zusätzlich wird detailliert erklärt, wie Sie die Website über das Internet mit einer Fritz!Box zugänglich machen.

## Inhaltsverzeichnis

1. [Voraussetzungen](#voraussetzungen)
2. [Raspberry OS Lite 64 Bookworm installieren](#schritt-1-raspberry-os-lite-64-bookworm-installieren)
3. [Verbindung zum Raspberry Pi herstellen](#schritt-2-verbindung-zum-raspberry-pi-herstellen)
4. [System aktualisieren](#schritt-3-system-aktualisieren)
5. [Benötigte Software installieren](#schritt-4-benötigte-software-installieren)
6. [Wochenplan-Radiologie-Projekt klonen](#schritt-5-wochenplan-radiologie-projekt-klonen)
7. [Abhängigkeiten installieren und Anwendung konfigurieren](#schritt-6-abhängigkeiten-installieren-und-anwendung-konfigurieren)
8. [PM2 für die Prozessverwaltung einrichten](#schritt-7-pm2-für-die-prozessverwaltung-einrichten)
9. [Nginx als Reverse Proxy einrichten](#schritt-8-nginx-als-reverse-proxy-einrichten)
10. [Fritz!Box für Internetzugriff konfigurieren](#schritt-9-fritzbox-für-internetzugriff-konfigurieren)
11. [Zugriff auf die Website](#schritt-10-zugriff-auf-die-website)
12. [Wartung und Updates](#wartung-und-updates)
13. [Sicherheitshinweise](#sicherheitshinweise)
14. [Fehlerbehebung](#fehlerbehebung)

## Voraussetzungen

- Raspberry Pi 4 (mindestens 2GB RAM empfohlen, 4GB oder 8GB für bessere Leistung)
- MicroSD-Karte (mindestens 16GB, Class 10 oder UHS-I für bessere Geschwindigkeit)
- Offizielles Raspberry Pi Netzteil (5.1V, 3A)
- Ethernet-Kabel (empfohlen) oder WLAN-Verbindung
- Computer mit SD-Karten-Lesegerät und Internetzugang
- Fritz!Box-Router mit Internetzugang und Administratorzugriff
- Grundlegende Kenntnisse in der Verwendung von Kommandozeilen

## Schritt 1: Raspberry OS Lite 64 Bookworm installieren

1. Laden Sie den Raspberry Pi Imager von der offiziellen Website herunter: 
   https://www.raspberrypi.com/software/
   
2. Installieren Sie den Raspberry Pi Imager auf Ihrem Computer und starten Sie ihn.

3. Klicken Sie auf "CHOOSE OS" (Betriebssystem auswählen) und navigieren Sie zu:
   "Raspberry Pi OS (other)" > "Raspberry Pi OS Lite (64-bit)"

4. Klicken Sie auf "CHOOSE STORAGE" (Speicher auswählen) und wählen Sie Ihre MicroSD-Karte aus der Liste aus.

5. Klicken Sie auf das Zahnrad-Symbol in der rechten unteren Ecke, um die erweiterten Optionen zu öffnen:
   - Aktivieren Sie "Enable SSH" (SSH aktivieren)
   - Wählen Sie "Use password authentication" (Passwort-Authentifizierung verwenden)
   - Setzen Sie einen Benutzernamen (z.B. "piuser") und ein sicheres Passwort
   - Aktivieren Sie "Set hostname" und geben Sie einen Namen ein (z.B. "raspberrypi")
   - Wenn Sie WLAN verwenden möchten:
     - Aktivieren Sie "Configure wireless LAN"
     - Geben Sie Ihre WLAN-SSID und das Passwort ein
     - Wählen Sie Ihr Land/Ihre Region aus der Liste
   - Aktivieren Sie "Set locale settings"
     - Wählen Sie Ihre Zeitzone und das gewünschte Tastaturlayout

6. Klicken Sie auf "SAVE" (Speichern), um die erweiterten Optionen zu schließen.

7. Klicken Sie auf "WRITE" (Schreiben) und bestätigen Sie den Vorgang.

8. Warten Sie, bis der Schreibvorgang und die Verifizierung abgeschlossen sind.

9. Entfernen Sie die MicroSD-Karte sicher aus Ihrem Computer.

10. Setzen Sie die MicroSD-Karte in den Raspberry Pi ein.

11. Verbinden Sie ein Ethernet-Kabel (falls Sie kein WLAN konfiguriert haben) und das Netzteil mit dem Raspberry Pi.

12. Schalten Sie den Raspberry Pi ein, indem Sie das Netzteil mit einer Steckdose verbinden.

## Schritt 2: Verbindung zum Raspberry Pi herstellen

1. Öffnen Sie ein Terminal (unter Windows können Sie PowerShell oder PuTTY verwenden) auf Ihrem Computer.

2. Warten Sie etwa 2 Minuten, bis der Raspberry Pi vollständig gebootet ist.

3. Verbinden Sie sich per SSH mit dem Raspberry Pi, indem Sie folgenden Befehl eingeben:
   ```
   ssh piuser@raspberrypi.local
   ```
   Ersetzen Sie "piuser" durch den von Ihnen gewählten Benutzernamen, falls Sie einen anderen verwendet haben.

4. Wenn Sie zum ersten Mal eine Verbindung herstellen, werden Sie gefragt, ob Sie dem Fingerprint vertrauen. Geben Sie "yes" ein und drücken Sie Enter.

5. Geben Sie das Passwort ein, das Sie während der Installation festgelegt haben, und drücken Sie Enter. (Das Passwort wird beim Eintippen nicht angezeigt.)

6. Sie sollten nun mit dem Raspberry Pi verbunden sein und den Befehlsprompt sehen.

## Schritt 3: System aktualisieren

1. Führen Sie den folgenden Befehl aus, um die Paketlisten zu aktualisieren:
   ```bash
   sudo apt update
   ```

2. Führen Sie anschließend den folgenden Befehl aus, um alle installierten Pakete auf den neuesten Stand zu bringen:
   ```bash
   sudo apt upgrade -y
   ```
   Dieser Vorgang kann einige Minuten dauern.

3. Nachdem alle Updates installiert wurden, starten Sie den Raspberry Pi neu:
   ```bash
   sudo reboot
   ```

4. Warten Sie etwa eine Minute, bis der Raspberry Pi neu gestartet ist.

5. Verbinden Sie sich erneut per SSH mit dem Raspberry Pi, wie in Schritt 2 beschrieben.

## Schritt 4: Benötigte Software installieren

1. Installieren Sie Git, Node.js, npm und SQLite3 mit folgendem Befehl:
   ```bash
   sudo apt install -y git nodejs npm sqlite3
   ```

2. Überprüfen Sie die installierten Versionen:
   ```bash
   git --version
   node --version
   npm --version
   sqlite3 --version
   ```

3. Installieren Sie PM2 global mit npm:
   ```bash
   sudo npm install -g pm2
   ```

4. Überprüfen Sie die PM2-Installation:
   ```bash
   pm2 --version
   ```

## Schritt 5: Wochenplan-Radiologie-Projekt klonen

1. Wechseln Sie in das /srv-Verzeichnis:
   ```bash
   cd /srv
   ```

2. Erstellen Sie ein neues Verzeichnis für das Projekt:
   ```bash
   sudo mkdir wochenplan-radiologie
   ```

3. Ändern Sie den Besitzer des Verzeichnisses:
   ```bash
   sudo chown $USER:$USER wochenplan-radiologie
   ```

4. Wechseln Sie in das neue Verzeichnis:
   ```bash
   cd wochenplan-radiologie
   ```

5. Klonen Sie das Projekt-Repository:
   ```bash
   git clone https://github.com/mlurz92/wochenplan-radiologie.git .
   ```
   Beachten Sie den Punkt am Ende des Befehls, der das aktuelle Verzeichnis als Ziel angibt.

6. Überprüfen Sie, ob alle Dateien erfolgreich geklont wurden:
   ```bash
   ls -la
   ```

## Schritt 6: Abhängigkeiten installieren und Anwendung konfigurieren

1. Installieren Sie die Projektabhängigkeiten:
   ```bash
   npm install
   ```

2. Erstellen Sie die .env-Datei:
   ```bash
   echo "PORT=3000" > .env
   echo "NODE_ENV=production" >> .env
   ```

3. Überprüfen Sie den Inhalt der .env-Datei:
   ```bash
   cat .env
   ```

4. Stellen Sie sicher, dass die Datei wochenplan.db im Projektverzeichnis existiert:
   ```bash
   ls -la | grep wochenplan.db
   ```
   Falls die Datei nicht existiert, wird sie automatisch erstellt, wenn die Anwendung zum ersten Mal gestartet wird.

## Schritt 7: PM2 für die Prozessverwaltung einrichten

1. Starten Sie die Anwendung mit PM2:
   ```bash
   pm2 start server.js --name wochenplan-radiologie
   ```

2. Überprüfen Sie den Status der Anwendung:
   ```bash
   pm2 status
   ```

3. Speichern Sie die aktuelle PM2-Prozessliste:
   ```bash
   pm2 save
   ```

4. Konfigurieren Sie PM2, um beim Systemstart automatisch zu starten:
   ```bash
   pm2 startup
   ```

5. Führen Sie den von PM2 ausgegebenen Befehl aus, um PM2 beim Systemstart zu laden. Der Befehl sieht ähnlich aus wie:
   ```bash
   sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u piuser --hp /home/piuser
   ```
   Ersetzen Sie "piuser" durch Ihren tatsächlichen Benutzernamen.

## Schritt 8: Nginx als Reverse Proxy einrichten

1. Installieren Sie Nginx:
   ```bash
   sudo apt install -y nginx
   ```

2. Überprüfen Sie den Status von Nginx:
   ```bash
   sudo systemctl status nginx
   ```

3. Erstellen Sie eine neue Nginx-Konfigurationsdatei für die Anwendung:
   ```bash
   sudo nano /etc/nginx/sites-available/wochenplan-radiologie
   ```

4. Fügen Sie folgende Konfiguration in die Datei ein:
   ```nginx
   server {
       listen 80;
       server_name localhost;

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

5. Speichern Sie die Datei und verlassen Sie den Editor (in nano: Strg+X, dann Y, dann Enter).

6. Aktivieren Sie die neue Konfiguration, indem Sie einen symbolischen Link erstellen:
   ```bash
   sudo ln -s /etc/nginx/sites-available/wochenplan-radiologie /etc/nginx/sites-enabled/
   ```

7. Entfernen Sie den Standard-Nginx-Konfigurationslink:
   ```bash
   sudo rm /etc/nginx/sites-enabled/default
   ```

8. Testen Sie die Nginx-Konfiguration auf Fehler:
   ```bash
   sudo nginx -t
   ```

9. Wenn keine Fehler gemeldet werden, starten Sie Nginx neu:
   ```bash
   sudo systemctl restart nginx
   ```

## Schritt 9: Fritz!Box für Internetzugriff konfigurieren

1. Öffnen Sie einen Webbrowser auf Ihrem Computer und geben Sie die IP-Adresse Ihrer Fritz!Box ein (standardmäßig 192.168.178.1).

2. Melden Sie sich mit Ihrem Fritz!Box-Passwort an.

3. Navigieren Sie zu "Internet" > "Freigaben" > "DynDNS".

4. Aktivieren Sie DynDNS, indem Sie auf "DynDNS benutzen" klicken.

5. Wählen Sie einen DynDNS-Anbieter aus der Liste (z.B. dyndns.org).

6. Öffnen Sie ein neues Browser-Fenster und registrieren Sie sich bei dem gewählten DynDNS-Anbieter. Folgen Sie deren Anweisungen zur Einrichtung eines Hostnamens.

7. Gehen Sie zurück zur Fritz!Box-Oberfläche und geben Sie die DynDNS-Daten ein:
   - Benutzername (Ihr Konto beim DynDNS-Anbieter)
   - Kennwort
   - Aktualisierungs-URL (wird normalerweise automatisch ausgefüllt)
   - Domainname (der von Ihnen beim DynDNS-Anbieter registrierte Hostname)

8. Klicken Sie auf "Übernehmen", um die DynDNS-Einstellungen zu speichern.

9. Navigieren Sie zu "Internet" > "Freigaben" > "Portfreigaben".

10. Klicken Sie auf "Neue Portfreigabe".

11. Wählen Sie "Andere Anwendung" aus der Liste.

12. Füllen Sie die Felder wie folgt aus:
    - Name der Portfreigabe: Wochenplan-Radiologie
    - Protokoll: TCP
    - Von Port: 80 (oder einen anderen Port Ihrer Wahl, z.B. 8080)
    - An Computer: Wählen Sie Ihren Raspberry Pi aus der Liste oder geben Sie seine IP-Adresse manuell ein
    - An Port: 80

13. Klicken Sie auf "OK", um die Portfreigabe zu speichern.

14. Klicken Sie auf "Übernehmen", um die Änderungen zu aktivieren.

## Schritt 10: Zugriff auf die Website

Sie können nun auf die Website zugreifen:

1. Im lokalen Netzwerk:
   Öffnen Sie einen Webbrowser und geben Sie ein: http://raspberrypi.local
   (Ersetzen Sie "raspberrypi" durch den von Ihnen gewählten Hostnamen, falls Sie ihn geändert haben)

2. Über das Internet:
   Öffnen Sie einen Webbrowser und geben Sie ein: http://[Ihre-DynDNS-Adresse]
   (Ersetzen Sie [Ihre-DynDNS-Adresse] durch den vollständigen Hostnamen, den Sie bei Ihrem DynDNS-Anbieter registriert haben)

3. Überprüfen Sie, ob die Website korrekt angezeigt wird und alle Funktionen verfügbar sind.

4. Falls Sie Probleme beim Zugriff haben:
   - Überprüfen Sie, ob der Raspberry Pi eingeschaltet und mit dem Netzwerk verbunden ist.
   - Stellen Sie sicher, dass die PM2-Prozesse laufen (verwenden Sie `pm2 status`).
   - Überprüfen Sie die Nginx-Logs auf Fehler (`sudo tail -f /var/log/nginx/error.log`).
   - Stellen Sie sicher, dass die Portfreigabe in der Fritz!Box korrekt eingerichtet ist.
   - Überprüfen Sie, ob Ihre DynDNS-Adresse korrekt auf Ihre öffentliche IP-Adresse verweist.

## Wartung und Updates

Regelmäßige Wartung und Updates sind wichtig, um die Sicherheit und Funktionalität Ihrer Anwendung zu gewährleisten. Hier sind die Schritte für die Wartung:

1. System-Updates:
   ```bash
   sudo apt update
   sudo apt upgrade -y
   ```
   Führen Sie diese Befehle regelmäßig (z.B. wöchentlich) aus.

2. Anwendungs-Updates:
   ```bash
   cd /srv/wochenplan-radiologie
   git pull
   npm install
   pm2 restart wochenplan-radiologie
   ```
   Führen Sie diese Befehle aus, wenn Updates für die Anwendung verfügbar sind.

3. Überprüfen Sie regelmäßig den Status der Anwendung:
   ```bash
   pm2 status
   ```

4. Überprüfen Sie die Logs auf Fehler oder Warnungen:
   ```bash
   pm2 logs wochenplan-radiologie
   ```

5. Datenbank-Backup:
   Führen Sie regelmäßige Backups der SQLite-Datenbank durch:
   ```bash
   cp /srv/wochenplan-radiologie/wochenplan.db /home/piuser/wochenplan_backup_$(date +%Y%m%d).db
   ```
   Ersetzen Sie "piuser" durch Ihren Benutzernamen.

6. Überprüfen Sie regelmäßig den freien Speicherplatz:
   ```bash
   df -h
   ```

## Sicherheitshinweise

1. Ändern Sie regelmäßig das Passwort Ihres Raspberry Pi:
   ```bash
   passwd
   ```

2. Halten Sie das System und alle installierten Pakete aktuell, wie im Abschnitt "Wartung und Updates" beschrieben.

3. Erwägen Sie die Verwendung von HTTPS für eine sichere Verbindung:
   - Installieren Sie Certbot: `sudo apt install certbot python3-certbot-nginx`
   - Konfigurieren Sie SSL: `sudo certbot --nginx -d [Ihre-DynDNS-Adresse]`
   - Folgen Sie den Anweisungen von Certbot.

4. Beschränken Sie den SSH-Zugriff auf vertrauenswürdige IP-Adressen:
   - Bearbeiten Sie die SSH-Konfigurationsdatei: `sudo nano /etc/ssh/sshd_config`
   - Fügen Sie folgende Zeile hinzu: `AllowUsers piuser@192.168.1.0/24`
     (Ersetzen Sie "piuser" durch Ihren Benutzernamen und passen Sie den IP-Bereich an)
   - Speichern Sie die Datei und starten Sie den SSH-Dienst neu: `sudo systemctl restart ssh`

5. Aktivieren Sie die Firewall (ufw):
   ```bash
   sudo apt install ufw
   sudo ufw allow SSH
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

6. Überwachen Sie regelmäßig die Systemprotokolle auf verdächtige Aktivitäten:
   ```bash
   sudo journalctl -f
   ```

## Fehlerbehebung

1. Problem: Die Website ist nicht erreichbar
   Lösung:
   - Überprüfen Sie, ob der Raspberry Pi eingeschaltet und mit dem Netzwerk verbunden ist.
   - Stellen Sie sicher, dass PM2 läuft: `pm2 status`
   - Überprüfen Sie die Nginx-Konfiguration: `sudo nginx -t`
   - Überprüfen Sie die Nginx-Logs: `sudo tail -f /var/log/nginx/error.log`

2. Problem: PM2 startet die Anwendung nicht
   Lösung:
   - Überprüfen Sie die Anwendungs-Logs: `pm2 logs wochenplan-radiologie`
   - Starten Sie die Anwendung manuell, um Fehler zu sehen: `node /srv/wochenplan-radiologie/server.js`

3. Problem: Die Datenbank ist beschädigt
   Lösung:
   - Stoppen Sie die Anwendung: `pm2 stop wochenplan-radiologie`
   - Sichern Sie die bestehende Datenbank: `cp /srv/wochenplan-radiologie/wochenplan.db /srv/wochenplan-radiologie/wochenplan_backup.db`
   - Löschen Sie die beschädigte Datenbank: `rm /srv/wochenplan-radiologie/wochenplan.db`
   - Starten Sie die Anwendung neu: `pm2 start wochenplan-radiologie`

4. Problem: Node.js oder npm-Fehler
   Lösung:
   - Überprüfen Sie die installierten Versionen: `node --version` und `npm --version`
   - Aktualisieren Sie bei Bedarf Node.js und npm:
     ```bash
     sudo npm cache clean -f
     sudo npm install -g n
     sudo n stable
     ```

5. Problem: Nginx-Fehler
   Lösung:
   - Überprüfen Sie die Nginx-Konfiguration: `sudo nginx -t`
   - Überprüfen Sie den Nginx-Status: `sudo systemctl status nginx`
   - Starten Sie Nginx neu: `sudo systemctl restart nginx`

6. Problem: Fritz!Box-Portfreigabe funktioniert nicht
   Lösung:
   - Überprüfen Sie, ob die richtige interne IP-Adresse des Raspberry Pi verwendet wird.
   - Deaktivieren Sie temporär die Firewall des Raspberry Pi, um zu testen, ob sie das Problem verursacht.
   - Versuchen Sie, einen anderen Port für die Weiterleitung zu verwenden (z.B. 8080 statt 80).

7. Problem: DynDNS-Aktualisierung funktioniert nicht
   Lösung:
   - Überprüfen Sie die DynDNS-Einstellungen in der Fritz!Box.
   - Versuchen Sie, den DynDNS-Dienst manuell zu aktualisieren.
   - Überprüfen Sie, ob Ihr DynDNS-Anbieter Probleme oder Wartungsarbeiten hat.

Bei anhaltenden Problemen oder Fragen, die nicht durch diese Anleitung gelöst werden können, konsultieren Sie bitte die offizielle Dokumentation der verwendeten Software oder wenden Sie sich an einen erfahrenen Systemadministrator oder die Community-Foren der jeweiligen Projekte.
