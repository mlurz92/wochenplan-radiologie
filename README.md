
# Wochenplan Radiologie - Ausführliche Einrichtungsanleitung

## Inhaltsverzeichnis
1. [Einführung](#einführung)
2. [Voraussetzungen](#voraussetzungen)
3. [Schritt-für-Schritt-Anleitung](#schritt-für-schritt-anleitung)
   - [Schritt 1: Vorbereitung des Raspberry Pi](#schritt-1-vorbereitung-des-raspberry-pi)
   - [Schritt 2: Grundkonfiguration des Raspberry Pi](#schritt-2-grundkonfiguration-des-raspberry-pi)
   - [Schritt 3: Installation der Anwendung](#schritt-3-installation-der-anwendung)
   - [Schritt 4: Konfiguration des Webservers](#schritt-4-konfiguration-des-webservers)
   - [Schritt 5: Starten der Anwendung](#schritt-5-starten-der-anwendung)
   - [Schritt 6: Konfiguration der FRITZ!Box](#schritt-6-konfiguration-der-fritzbox)
   - [Schritt 7: Port-Weiterleitung einrichten](#schritt-7-port-weiterleitung-einrichten)
   - [Schritt 8: SSL-Verschlüsselung einrichten](#schritt-8-ssl-verschlüsselung-einrichten)
   - [Schritt 9: Zugriff auf die Anwendung](#schritt-9-zugriff-auf-die-anwendung)
4. [Wartung und Updates](#wartung-und-updates)
5. [Sicherheitshinweise](#sicherheitshinweise)
6. [Fehlerbehebung](#fehlerbehebung)
7. [Anwendungsübersicht](#anwendungsübersicht)
8. [Unterstützung und Kontakt](#unterstützung-und-kontakt)

## Einführung

Die Wochenplan-Radiologie-Anwendung ist ein leistungsfähiges Tool zur Erstellung und Verwaltung von Wochenplänen für die Arbeitsplatz- und Aufgabenverteilung in einer radiologischen Abteilung. Diese Anleitung führt Sie durch den Prozess der Einrichtung der Anwendung auf einem Raspberry Pi 4 und deren Hosting über MyFritz einer FRITZ!Box 6660.

## Voraussetzungen

Bevor Sie beginnen, stellen Sie sicher, dass Sie über folgende Komponenten verfügen:

- Raspberry Pi 4 (empfohlen: mindestens 4GB RAM)
- MicroSD-Karte (mindestens 16GB, empfohlen: 32GB oder mehr für bessere Leistung)
- Stromversorgung für den Raspberry Pi (mindestens 3A)
- Netzwerkkabel oder WLAN-Verbindung
- Computer mit SD-Karten-Lesegerät
- FRITZ!Box 6660 mit OS 7.58 oder neuer
- MyFritz-Konto (kostenlos bei AVM erhältlich)
- Grundlegende Kenntnisse in der Nutzung der Kommandozeile (Terminal)

## Schritt-für-Schritt-Anleitung

### Schritt 1: Vorbereitung des Raspberry Pi

1. Laden Sie den Raspberry Pi Imager von der offiziellen Website herunter: 
   https://www.raspberrypi.org/software/

2. Installieren und starten Sie den Raspberry Pi Imager auf Ihrem Computer.

3. Klicken Sie auf "CHOOSE OS" und wählen Sie "Raspberry Pi OS (other)" > "Raspberry Pi OS Lite (64-bit)".

4. Klicken Sie auf "CHOOSE STORAGE" und wählen Sie Ihre MicroSD-Karte aus.

5. Klicken Sie auf das Zahnrad-Symbol (⚙️) in der rechten unteren Ecke für erweiterte Optionen:
   - Aktivieren Sie "Enable SSH"
   - Wählen Sie "Use password authentication"
   - Setzen Sie einen Benutzernamen (z.B. "pi") und ein sicheres Passwort
   - Aktivieren Sie "Set locale settings" und wählen Sie Ihre Zeitzone und Ihr Tastaturlayout
   - Wenn Sie WLAN verwenden möchten, aktivieren Sie "Configure wireless LAN" und geben Sie Ihre WLAN-Daten ein

6. Klicken Sie auf "SAVE" und dann auf "WRITE". Bestätigen Sie, dass alle Daten auf der SD-Karte überschrieben werden können.

7. Warten Sie, bis der Schreibvorgang abgeschlossen ist. Dies kann einige Minuten dauern.

8. Setzen Sie die MicroSD-Karte in den Raspberry Pi ein, verbinden Sie ihn mit dem Netzwerk (per Kabel oder WLAN) und mit der Stromversorgung.

### Schritt 2: Grundkonfiguration des Raspberry Pi

1. Finden Sie die IP-Adresse Ihres Raspberry Pi:
   - Bei Verwendung eines Netzwerkkabels: Überprüfen Sie die verbundenen Geräte in Ihrer FRITZ!Box-Oberfläche
   - Bei Verwendung von WLAN: Die IP-Adresse sollten Sie bereits kennen, da Sie sie bei der Konfiguration angegeben haben

2. Öffnen Sie ein Terminal (auf Windows können Sie PuTTY verwenden) und verbinden Sie sich über SSH mit Ihrem Raspberry Pi:
   ```
   ssh [benutzername]@[IP-Adresse]
   ```
   Beispiel: `ssh pi@192.168.178.50`

3. Bestätigen Sie die Verbindung, wenn Sie nach der Authentizität des Hosts gefragt werden.

4. Geben Sie das Passwort ein, das Sie bei der Konfiguration festgelegt haben.

5. Nach erfolgreicher Anmeldung aktualisieren Sie das System mit folgenden Befehlen:
   ```
   sudo apt update
   sudo apt upgrade -y
   ```
   Dieser Vorgang kann einige Minuten dauern.

6. Installieren Sie die notwendigen Pakete mit folgendem Befehl:
   ```
   sudo apt install -y git nodejs npm sqlite3
   ```

7. Installieren Sie PM2 für das Prozessmanagement:
   ```
   sudo npm install -g pm2
   ```

### Schritt 3: Installation der Anwendung

1. Klonen Sie das Repository der Wochenplan-Radiologie-Anwendung:
   ```
   git clone https://github.com/mlurz92/wochenplan-radiologie.git
   ```

2. Wechseln Sie in das Projektverzeichnis:
   ```
   cd wochenplan-radiologie
   ```

3. Installieren Sie die Abhängigkeiten der Anwendung:
   ```
   npm install
   ```

4. Erstellen Sie eine .env-Datei für Umgebungsvariablen:
   ```
   nano .env
   ```

5. Fügen Sie folgende Zeilen in die .env-Datei ein:
   ```
   PORT=3000
   NODE_ENV=production
   ```
   Drücken Sie Strg+X, dann Y und Enter, um die Datei zu speichern und den Editor zu verlassen.

6. Machen Sie die Start- und Update-Skripte ausführbar:
   ```
   chmod +x start_server.sh update_app.sh
   ```

### Schritt 4: Konfiguration des Webservers

1. Installieren Sie Nginx als Webserver:
   ```
   sudo apt install -y nginx
   ```

2. Erstellen Sie eine Nginx-Konfigurationsdatei für die Anwendung:
   ```
   sudo nano /etc/nginx/sites-available/wochenplan-radiologie
   ```

3. Fügen Sie folgenden Inhalt in die Konfigurationsdatei ein:
   ```nginx
   server {
       listen 80;
       server_name [Ihre-MyFRITZ-Adresse];

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
   WICHTIG: Ersetzen Sie [Ihre-MyFRITZ-Adresse] mit Ihrer tatsächlichen MyFRITZ-Adresse.
   Beispiel: Wenn Ihre MyFRITZ-Adresse "raspberrypi.hyg6zkbn2mykr1go.myfritz.net" ist, sollte die Zeile so aussehen:
   ```nginx
   server_name raspberrypi.hyg6zkbn2mykr1go.myfritz.net;
   ```
   Speichern Sie die Datei mit Strg+X, Y und Enter.

4. Aktivieren Sie die Konfiguration, indem Sie einen symbolischen Link erstellen:
   ```
   sudo ln -s /etc/nginx/sites-available/wochenplan-radiologie /etc/nginx/sites-enabled
   ```

5. Testen Sie die Nginx-Konfiguration auf Fehler:
   ```
   sudo nginx -t
   ```

6. Wenn keine Fehler angezeigt werden, starten Sie Nginx neu:
   ```
   sudo systemctl restart nginx
   ```
   Hinweis: Stellen Sie sicher, dass Sie Ihre korrekte MyFRITZ-Adresse verwenden. Diese finden Sie in der FRITZ!Box-Oberfläche unter "Internet" > "MyFRITZ!-Konto" > "MyFRITZ!-Adresse".

### Schritt 5: Starten der Anwendung

1. Starten Sie die Anwendung mit PM2:
   ```
   pm2 start server.js --name wochenplan-radiologie
   ```

2. Konfigurieren Sie den automatischen Start der Anwendung bei Systemstart:
   ```
   pm2 startup systemd
   ```
   Führen Sie den Befehl aus, den PM2 Ihnen anzeigt.

3. Speichern Sie die aktuelle PM2-Konfiguration:
   ```
   pm2 save
   ```

### Schritt 6: Konfiguration der FRITZ!Box

1. Öffnen Sie einen Webbrowser und rufen Sie die FRITZ!Box-Benutzeroberfläche auf (normalerweise http://fritz.box).

2. Melden Sie sich mit Ihrem FRITZ!Box-Passwort an.

3. Navigieren Sie zu "Internet" > "Freigaben" > "DynDNS".

4. Aktivieren Sie DynDNS, indem Sie das Kontrollkästchen "DynDNS benutzen" anklicken.

5. Wählen Sie als DynDNS-Anbieter "MyFRITZ!" aus.

6. Klicken Sie auf "Übernehmen", um die Änderungen zu speichern.

7. Notieren Sie sich Ihre MyFRITZ!-Adresse (z.B. xxxxx.myfritz.net). Sie finden diese Adresse auch unter "Internet" > "MyFRITZ!-Konto" > "MyFRITZ!-Adresse".

### Schritt 7: Port-Weiterleitung einrichten

1. Bleiben Sie in der FRITZ!Box-Oberfläche und gehen Sie zu "Internet" > "Freigaben" > "Portfreigaben".

2. Klicken Sie auf "Neue Portfreigabe".

3. Wählen Sie "Andere Anwendung" aus der Liste aus.

4. Geben Sie folgende Daten ein:
   - Bezeichnung: Wochenplan Radiologie
   - Protokoll: TCP
   - Von Port: 80 (oder einen anderen Port Ihrer Wahl, z.B. 8080)
   - An Computer: [IP-Adresse Ihres Raspberry Pi]
   - An Port: 80

5. Klicken Sie auf "OK", um die Portfreigabe zu speichern.

### Schritt 8: SSL-Verschlüsselung einrichten

Für eine sichere Verbindung ist es wichtig, SSL einzurichten. Wir verwenden dafür Let's Encrypt:

1. Installieren Sie Certbot und das Nginx-Plugin:
   ```
   sudo apt install -y certbot python3-certbot-nginx
   ```

2. Führen Sie Certbot aus und folgen Sie den Anweisungen:
   ```
   sudo certbot --nginx -d [Ihre-MyFRITZ-Adresse]
   ```
   Ersetzen Sie [Ihre-MyFRITZ-Adresse] durch Ihre tatsächliche MyFRITZ!-Adresse (z.B. xxxxx.myfritz.net).

3. Wählen Sie die Option, um alle HTTP-Anfragen auf HTTPS umzuleiten, wenn Sie danach gefragt werden.

### Schritt 9: Zugriff auf die Anwendung

Sie können nun von überall auf Ihre Anwendung zugreifen:

1. Öffnen Sie einen Webbrowser und geben Sie Ihre MyFRITZ!-Adresse ein:
   ```
   https://[Ihre-MyFRITZ-Adresse]
   ```

2. Sie sollten nun die Benutzeroberfläche der Wochenplan-Radiologie-Anwendung sehen.

3. Um auf den Editor-Modus zuzugreifen, klicken Sie auf den "Bearbeiten"-Button und geben Sie das Passwort "Kandinsky1!" ein.

## Wartung und Updates

- Um die Anwendung zu aktualisieren, führen Sie folgende Befehle aus:
  ```
  cd /home/pi/wochenplan-radiologie
  git pull
  npm install
  pm2 restart wochenplan-radiologie
  ```

- Überwachen Sie die Anwendung mit PM2:
  ```
  pm2 monit
  ```

- Prüfen Sie regelmäßig auf Systemupdates:
  ```
  sudo apt update && sudo apt upgrade -y
  ```

- Erneuern Sie das SSL-Zertifikat regelmäßig (Let's Encrypt-Zertifikate sind 90 Tage gültig):
  ```
  sudo certbot renew
  ```

## Sicherheitshinweise

1. Ändern Sie regelmäßig alle Passwörter:
   - Raspberry Pi: `passwd`
   - FRITZ!Box: In der FRITZ!Box-Oberfläche unter "System" > "FRITZ!Box-Benutzer"
   - MyFRITZ!-Konto: Auf der AVM-Website

2. Halten Sie Ihr System und alle Anwendungen stets auf dem neuesten Stand:
   ```
   sudo apt update && sudo apt upgrade -y
   ```

3. Überprüfen Sie regelmäßig die Logs auf verdächtige Aktivitäten:
   ```
   sudo journalctl -u nginx
   pm2 logs wochenplan-radiologie
   ```

4. Erwägen Sie die Einrichtung einer Firewall auf dem Raspberry Pi:
   ```
   sudo apt install ufw
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   ```

5. Deaktivieren Sie nicht benötigte Dienste und Ports.

6. Verwenden Sie starke, einzigartige Passwörter für alle Konten.

7. Aktivieren Sie Zwei-Faktor-Authentifizierung wo immer möglich.

## Fehlerbehebung
- **Problem**: Die Anwendung ist nicht erreichbar
  **Lösung**: 
  1. Überprüfen Sie, ob der Raspberry Pi läuft und mit dem Netzwerk verbunden ist
  2. Stellen Sie sicher, dass die Anwendung läuft: `pm2 list`
  3. Überprüfen Sie die Nginx-Konfiguration: `sudo nginx -t`
  4. Prüfen Sie die Anwendungslogs: `pm2 logs wochenplan-radiologie`
  5. Kontrollieren Sie die Portweiterleitung in der FRITZ!Box

- **Problem**: SSL-Zertifikat ist abgelaufen
  **Lösung**:
  1. Erneuern Sie das Zertifikat manuell: `sudo certbot renew`
  2. Wenn das nicht funktioniert, versuchen Sie: `sudo certbot --nginx -d [Ihre-MyFRITZ-Adresse]`

- **Problem**: Datenbank-Fehler
  **Lösung**:
  1. Überprüfen Sie die Datenbankdatei: `ls -l /home/pi/wochenplan-radiologie/wochenplan.db`
  2. Stellen Sie sicher, dass die Berechtigungen korrekt sind: `sudo chown pi:pi /home/pi/wochenplan-radiologie/wochenplan.db`
  3. Prüfen Sie die Anwendungslogs auf spezifische Fehlermeldungen: `pm2 logs wochenplan-radiologie`

- **Problem**: Nginx zeigt die Standardseite statt der Anwendung
  **Lösung**:
  1. Überprüfen Sie die Nginx-Konfiguration: `sudo nano /etc/nginx/sites-available/wochenplan-radiologie`
  2. Stellen Sie sicher, dass die `server_name` Direktive Ihre korrekte MyFRITZ-Adresse enthält
  3. Wenn Sie Änderungen vorgenommen haben, speichern Sie die Datei und führen Sie aus:
     ```
     sudo nginx -t
     sudo systemctl restart nginx
     ```
  4. Löschen Sie den Browser-Cache oder versuchen Sie, die Seite in einem Inkognito-/Privatfenster zu öffnen

- **Problem**: Anwendung startet nicht nach Systemneustart
  **Lösung**:
  1. Überprüfen Sie den PM2-Startup-Status: `pm2 startup`
  2. Speichern Sie die aktuelle PM2-Konfiguration erneut: `pm2 save`
  3. Starten Sie die Anwendung manuell: `pm2 start server.js --name wochenplan-radiologie`

## Anwendungsübersicht

Die Wochenplan-Radiologie-Anwendung bietet folgende Hauptfunktionen:

1. **Wochenplanansicht**: Zeigt die Arbeitsplatz- und Aufgabenverteilung für eine ausgewählte Woche an.

2. **Editor-Modus**: Ermöglicht das Bearbeiten des Wochenplans (Passwort: "Kandinsky1!").

3. **Drag-and-Drop-Funktionalität**: Einfache Zuweisung von Mitarbeitern zu Arbeitsplätzen und Zusatzstatus.

4. **Farbcodierung**: Visuelle Darstellung der Besetzungssituation (rot, gelb, grün).

5. **Wochenübersicht**: Kompakte Darstellung der Zuweisungen für die gesamte Woche.

6. **PDF-Export**: Möglichkeit, den aktuellen Wochenplan als PDF zu exportieren.

7. **Automatische Speicherung**: Änderungen werden automatisch in der lokalen Datenbank gespeichert.

8. **Responsive Design**: Optimierte Darstellung auf verschiedenen Geräten.

### Verwendung der Anwendung:

1. Öffnen Sie die Anwendung in einem Webbrowser.
2. Navigieren Sie mit den Pfeiltasten oder dem Kalender-Icon zur gewünschten Woche.
3. Im Editor-Modus können Sie Mitarbeiter per Drag-and-Drop zuweisen.
4. Nutzen Sie die Buttons am unteren Bildschirmrand für zusätzliche Funktionen wie PDF-Export oder Wochenübersicht.
5. Achten Sie auf die Farbcodierung der Karten für eine schnelle Übersicht der Besetzungssituation.

## Unterstützung und Kontakt

Bei Fragen oder Problemen, die Sie mit dieser Anleitung nicht lösen können, wenden Sie sich bitte an:

- Technischer Support: [E-Mail-Adresse oder Telefonnummer einfügen]
- Projektverantwortlicher: [Name und Kontaktdaten einfügen]

Bitte bereiten Sie folgende Informationen vor, wenn Sie Unterstützung anfordern:

1. Genaue Beschreibung des Problems
2. Schritte zur Reproduktion des Problems
3. Relevante Fehlermeldungen (aus den Anwendungs- oder Systemlogs)
4. Informationen zur Systemumgebung (Raspberry Pi Modell, OS-Version, etc.)

## Schlusswort

Diese detaillierte Anleitung sollte Ihnen ermöglichen, die Wochenplan-Radiologie-Anwendung erfolgreich auf einem Raspberry Pi einzurichten und über MyFritz zugänglich zu machen. Befolgen Sie die Schritte sorgfältig und beachten Sie die Sicherheitshinweise, um eine sichere und zuverlässige Nutzung zu gewährleisten.

Wir wünschen Ihnen viel Erfolg bei der Verwendung der Wochenplan-Radiologie-Anwendung!
