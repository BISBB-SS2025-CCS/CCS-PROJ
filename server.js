// server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');

// Routen importieren
const authRoutes = require('./routes/auth').router; // .router, da wir es so exportieren
const incidentRoutes = require('./routes/incidents');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public'))); // Statische Dateien (CSS, Client-JS)

// Session-Setup
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true, // Auf true für Login-Session, oder false und manuell speichern
    cookie: {
        secure: process.env.NODE_ENV === 'production', // true in Produktion mit HTTPS
        httpOnly: true, // Verhindert Zugriff auf Cookie über Client-seitiges JS
        maxAge: 24 * 60 * 60 * 1000 // 1 Tag Gültigkeit
    }
}));

// View Engine Setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routen
app.use('/auth', authRoutes);
app.use('/incidents', incidentRoutes); // incidents-Routen müssen Authentifizierung prüfen

// Home-Route (Weiterleitung zu Login oder Incidents basierend auf Session)
app.get('/', (req, res) => {
    if (req.session.userId) {
        res.redirect('/incidents');
    } else {
        res.redirect('/auth/login');
    }
});

// Einfache Fehlerbehandlung (sollte erweitert werden)
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Etwas ist schiefgelaufen!');
});

// Server starten
app.listen(PORT, () => {
    console.log(`Server läuft auf http://localhost:${PORT}`);
    if (process.env.NODE_ENV === 'production') {
        console.log('App im Produktionsmodus gestartet.');
    } else {
        console.log('App im Entwicklungsmodus gestartet.');
    }
});