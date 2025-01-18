# Wochenplan Radiologie

Eine einfache Webanwendung zum Erstellen und Verwalten von Wochenplänen für die Radiologie.

## Voraussetzungen

*   Raspberry Pi 4 mit installiertem Raspberry Pi OS Lite (64-bit)
*   Zugriff auf den Raspberry Pi über SSH
*   Eine Internetverbindung
*   Eine Fritz!Box 6660 mit konfigurierter MyFritz-Adresse (z.B. `https://raspberrypi.hyg6zkbn2mykr1go.myfritz.net/`)

## Installation

1.  **Mit dem Raspberry Pi über SSH verbinden:**

    Öffne ein Terminal und verwende den folgenden Befehl, um dich mit deinem Raspberry Pi zu verbinden:

    ```bash
    ssh pi@raspberrypi.local
    ```

    Ersetze `raspberrypi.local` mit dem Hostnamen oder der IP-Adresse deines Raspberry Pi. Das Standardpasswort für den Benutzer `pi` ist `raspberry`.

2.  **System aktualisieren:**

    Aktualisiere die Paketlisten und installiere verfügbare Updates:

    ```bash
    sudo apt update
    sudo apt upgrade -y
    ```

3.  **Node.js und npm installieren:**

    Installiere Node.js und npm (Node Package Manager):

    ```bash
    sudo apt install nodejs npm -y
    ```

4.  **PM2 installieren:**

    Installiere PM2, einen Prozessmanager für Node.js-Anwendungen:

    ```bash
    sudo npm install pm2@latest -g
    ```

5.  **NGINX installieren:**

    Installiere NGINX, einen Webserver, der als Reverse-Proxy verwendet wird:

    ```bash
    sudo apt install nginx -y
    ```

6.  **SQLite installieren:**

    Installiere SQLite, eine leichtgewichtige Datenbank:

    ```bash
    sudo apt install sqlite3 -y
    ```

7.  **Projektverzeichnis erstellen und Repository klonen:**

    Wechsle in das Verzeichnis `/srv` und klone das Projekt-Repository von GitHub:

    ```bash
    cd /srv
    sudo git clone https://github.com/mlurz92/wochenplan-radiologie.git
    ```

8.  **Abhängigkeiten installieren:**

    Wechsle in das Projektverzeichnis und installiere die benötigten Node.js-Module:

    ```bash
    cd /srv/wochenplan-radiologie
    sudo npm install
    ```

9.  **NGINX konfigurieren:**

    *   Öffne die NGINX-Konfigurationsdatei:

        ```bash
        sudo nano /etc/nginx/sites-available/default
        ```

    *   Füge die folgende Konfiguration innerhalb des `server`-Blocks hinzu (ersetze den vorhandenen Inhalt):

        ```nginx
        server {
            listen 80;
            listen [::]:80;
            server_name raspberrypi.hyg6zkbn2mykr1go.myfritz.net;

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

        Diese Konfiguration leitet alle Anfragen, die an Port 80 (HTTP) der MyFritz-Adresse eingehen, an den Node.js-Server weiter, der auf Port 3000 läuft.

    *   Speichere die Datei und schließe den Editor (Strg+X, Y, Enter).

    *   Teste die NGINX-Konfiguration:

        ```bash
        sudo nginx -t
        ```

    *   Starte NGINX neu:

        ```bash
        sudo systemctl restart nginx
        ```

10. **HTTPS mit Certbot einrichten:**

    *   Installiere Certbot und das NGINX-Plugin:

        ```bash
        sudo apt install certbot python3-certbot-nginx -y
        ```

    *   Führe Certbot aus und folge den Anweisungen:

        ```bash
        sudo certbot --nginx -d raspberrypi.hyg6zkbn2mykr1go.myfritz.net
        ```

    *   Wähle Option 2 (Redirect), um HTTP automatisch auf HTTPS umzuleiten.

    *   Certbot sollte die NGINX-Konfiguration automatisch anpassen und ein SSL-Zertifikat für deine MyFritz-Adresse erstellen.

11. **Anwendung mit PM2 starten:**

    ```bash
    cd /srv/wochenplan-radiologie
    sudo -u pi pm2 start server.js --name wochenplan-radiologie
    ```
    **Achtung:** Hier musste pm2 mit dem User pi ausgeführt werden, da es sonst zu konflikten mit den Rechten kommt, wenn pm2 versucht auf die Datenbank zuzugreifen.

12. **Autostart von PM2 einrichten:**

    ```bash
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u pi --hp /home/pi
    ```
    *   Führe den angezeigten Befehl aus, um PM2 beim Systemstart zu laden.
    **Achtung:** Hier musste der Pfad angepasst werden, da es sonst zu fehlern kam, wenn pm2 versucht wurde auszuführen beim booten.
    *   Speichere den aktuellen Status von PM2:

        ```bash
        sudo -u pi pm2 save
        ```

13. **Besitzer des Projektverzeichnisses anpassen:**

    ```bash
    sudo chown -R pi:pi /srv/wochenplan-radiologie
    ```

## Aktualisierung

1.  **Mit dem Raspberry Pi über SSH verbinden:**

    ```bash
    ssh pi@raspberrypi.local
    ```

2.  **Zum Projektverzeichnis wechseln:**

    ```bash
    cd /srv/wochenplan-radiologie
    ```

3.  **Änderungen vom GitHub-Repository abrufen:**
    Stelle sicher, dass du alle Änderungen eingecheckt und gepusht hast, bevor du diesen Befehl ausführst. Er setzt alle lokalen Änderungen zurück.

    ```bash
    git reset --hard
    git pull
    ```

4.  **Abhängigkeiten aktualisieren:**

    ```bash
    npm install
    ```

5.  **Anwendung neu starten:**

    ```bash
    pm2 restart wochenplan-radiologie
    ```

## Deinstallation

1.  **Mit dem Raspberry Pi über SSH verbinden:**

    ```bash
    ssh pi@raspberrypi.local
    ```

2.  **Anwendung stoppen:**

    ```bash
    pm2 stop wochenplan-radiologie
    ```

3.  **PM2 Autostart entfernen:**

    ```bash
    pm2 unstartup systemd
    ```

4.  **Anwendung löschen:**

    ```bash
    pm2 delete wochenplan-radiologie
    ```

5.  **Projektverzeichnis entfernen:**

    ```bash
    sudo rm -rf /srv/wochenplan-radiologie
    ```

6.  **NGINX entfernen:**

    ```bash
    sudo apt remove nginx -y
    ```

7.  **Certbot entfernen:**

    ```bash
    sudo apt remove certbot python3-certbot-nginx -y
    ```

8.  **Node.js und npm entfernen (optional):**

    ```bash
    sudo apt remove nodejs npm -y
    ```

9.  **SQLite entfernen (optional):**

    ```bash
    sudo apt remove sqlite3 -y
    ```

## Nutzungshinweise

*   Die Anwendung ist über die folgende URL erreichbar: `https://raspberrypi.hyg6zkbn2mykr1go.myfritz.net/`
*   Die **Viewer-Ansicht** (`index.html`) ist passwortgeschützt. Das Standardpasswort lautet: `Radiologie1!`
*   Die **Editor-Ansicht** (`editor.html`) kann über den "Bearbeiten"-Button in der Viewer-Ansicht aufgerufen werden. Das Standardpasswort lautet: `Kandinsky1!`
*   In der **Editor-Ansicht** können die Zuweisungen für den aktuell ausgewählten Tag über den Button "Tag zurücksetzen" und die Zuweisungen für die gesamte Woche über den Button "Woche zurücksetzen" zurückgesetzt werden.
*   Änderungen müssen über den Button **Speichern** gesichert werden.

## Zusätzliche Hinweise

*   Es wird empfohlen, die Passwörter nach der ersten Anmeldung zu ändern.
*   Der Datenverkehr wird durch HTTPS verschlüsselt.
*   Die Anwendung läuft auf einem Raspberry Pi 4 und sollte mit den aktuellen Versionen von Node.js, npm, PM2, NGINX und Certbot getestet werden.