// create-user.js
require('dotenv').config(); // Lädt Umgebungsvariablen aus .env
const bcrypt = require('bcrypt');
const { Pool } = require('pg'); // Direkter Pool, um Abhängigkeit von services/db.js zu vermeiden, falls es Probleme gibt

// Konfiguriere den Pool mit deinen lokalen Datenbankdetails (aus .env)
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: parseInt(process.env.PG_PORT || '5432'),
});

const SALT_ROUNDS = 10; // Die gleiche Anzahl an Salt-Runden wie in auth.js

async function createUser(username, password) {
  if (!username || !password) {
    console.error('Fehler: Benutzername und Passwort müssen angegeben werden.');
    console.log('Verwendung: node create-user.js <benutzername> <passwort>');
    await pool.end(); // Pool schließen
    return;
  }

  try {
    // Überprüfen, ob der Benutzer bereits existiert
    const existingUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (existingUser.rows.length > 0) {
      console.log(`Benutzer "${username}" existiert bereits.`);
      await pool.end();
      return;
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Benutzer in die Datenbank einfügen
    await pool.query(
      'INSERT INTO users (username, password_hash) VALUES ($1, $2)',
      [username, hashedPassword]
    );

    console.log(`Benutzer "${username}" erfolgreich erstellt.`);
    console.log(`WICHTIG: Passwort "${password}" merken oder sicher verwahren (dies ist das letzte Mal, dass es im Klartext angezeigt wird).`);

  } catch (err) {
    console.error('Fehler beim Erstellen des Benutzers:', err);
  } finally {
    await pool.end(); // Wichtig: Pool-Verbindung schließen
  }
}

// Benutzername und Passwort aus den Kommandozeilenargumenten holen
// process.argv[0] ist 'node', process.argv[1] ist der Pfad zum Skript
const usernameArg = process.argv[2];
const passwordArg = process.argv[3];

createUser(usernameArg, passwordArg);