// create-user.js
require('dotenv').config(); // Lädt Umgebungsvariablen aus .env (falls für bcrypt benötigt, obwohl bcrypt keine env vars braucht)
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10; // Die gleiche Anzahl an Salt-Runden wie in auth.js

async function generateInsertStatement(username, password) {
  if (!username || !password) {
    console.error('Fehler: Benutzername und Passwort müssen angegeben werden.');
    console.log('Verwendung: node create-user.js <benutzername> <passwort>');
    return;
  }

  try {
    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // SQL INSERT Statement generieren
    // ACHTUNG: Dies ist nur für die Ausgabe gedacht.
    // In einer echten Anwendung sollten Sie niemals Passwörter im Klartext loggen
    // und immer parametrisierte Abfragen verwenden, um SQL-Injection zu vermeiden.
    const insertStatement = `INSERT INTO users (username, password_hash) VALUES ('${username}', '${hashedPassword}');`;

    console.log('Generierter SQL INSERT Befehl:');
    console.log(insertStatement);
    console.log(`WICHTIG: Passwort "${password}" merken oder sicher verwahren (dies ist das letzte Mal, dass es im Klartext angezeigt wird).`);


  } catch (err) {
    console.error('Fehler beim Generieren des Statements:', err);
  }
}

// Benutzername und Passwort aus den Kommandozeilenargumenten holen
// process.argv[0] ist 'node', process.argv[1] ist der Pfad zum Skript
const usernameArg = process.argv[2];
const passwordArg = process.argv[3];

generateInsertStatement(usernameArg, passwordArg);