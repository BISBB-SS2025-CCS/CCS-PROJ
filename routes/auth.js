// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../services/db');
const router = express.Router();

const SALT_ROUNDS = 10; // Für bcrypt Hashing

// GET Login-Seite
router.get('/login', (req, res) => {
    if (req.session.userId) {
        return res.redirect('/incidents'); // Bereits eingeloggt
    }
    res.render('login', { error: null, message: req.query.message });
});

// POST Login-Versuch
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('login', { error: 'Bitte Benutzernamen und Passwort eingeben.', message: null });
    }

    try {
        const result = await db.query('SELECT id, username, password_hash FROM users WHERE username = $1', [username]);
        const user = result.rows[0];

        if (user && await bcrypt.compare(password, user.password_hash)) {
            req.session.userId = user.id;
            req.session.username = user.username; // Benutzername in Session speichern für Anzeige
            res.redirect('/incidents');
        } else {
            res.render('login', { error: 'Ungültiger Benutzername oder Passwort.', message: null });
        }
    } catch (err) {
        console.error('Login Fehler:', err);
        res.render('login', { error: 'Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.', message: null });
    }
});

// GET Logout
router.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Fehler beim Logout:', err);
            return res.redirect('/incidents'); // Oder eine Fehlerseite
        }
        res.clearCookie('connect.sid'); // Name des Session-Cookies (Standard)
        res.redirect('/auth/login?message=Erfolgreich ausgeloggt.');
    });
});

// Middleware zur Überprüfung der Authentifizierung
function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        return next(); // Benutzer ist eingeloggt, weiter zur nächsten Middleware/Route
    }
    res.redirect('/auth/login'); // Nicht eingeloggt, Weiterleitung zur Login-Seite
}

// Optional: Registrierungsroute (hier nicht vollständig implementiert, nur als Platzhalter)
// router.get('/register', (req, res) => { res.render('register', { error: null }); });
// router.post('/register', async (req, res) => { /* ... Logik zum Erstellen neuer Benutzer ... */ });

module.exports = { router, isAuthenticated };