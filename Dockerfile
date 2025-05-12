# Verwenden Sie ein offizielles Node.js LTS (Long Term Support) Image als Basis.
# Wir wählen die Alpine-Variante, da sie kleiner und sicherer ist.
FROM node:lts-alpine

# Setzen Sie das Arbeitsverzeichnis im Container.
WORKDIR /app

# Kopieren Sie die package.json und package-lock.json Dateien.
# Wir kopieren diese zuerst, damit Docker das Installieren der Abhängigkeiten (npm install)
# cachen kann, wenn sich nur der Anwendungscode ändert.
COPY package.json ./
COPY package-lock.json ./

# Installieren Sie die Projekt-Abhängigkeiten.
# Die Flags --production stellen sicher, dass nur Produktionsabhängigkeiten installiert werden.
RUN npm install --production

# Kopieren Sie den Rest des Anwendungscodes in das Arbeitsverzeichnis im Container.
COPY . .

# Machen Sie den Port verfügbar, auf dem die Anwendung lauscht.
# In server.js wird standardmäßig Port 3000 verwendet.
EXPOSE 3000

# Definieren Sie den Befehl, der beim Starten des Containers ausgeführt wird.
# Dies startet Ihre Node.js-Anwendung.
CMD ["node", "server.js"]

# Optional: Fügen Sie USER node hinzu, um die Anwendung als nicht-root-Benutzer auszuführen (bessere Sicherheit)
# Es ist aber oft etwas komplexer mit Dateiberechtigungen etc., daher lassen wir es hier weg
# für ein simples Beispiel, aber es ist eine Best Practice für die Produktion.
# USER node