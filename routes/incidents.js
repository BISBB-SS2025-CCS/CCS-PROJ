// routes/incidents.js
const express = require('express');
const db = require('../services/db');
const redisClient = require('../services/cache');
const { isAuthenticated } = require('./auth'); // Authentifizierungs-Middleware importieren
const fetch = require('node-fetch'); // Node.js native fetch can also be used in newer versions

const router = express.Router();

const CACHE_KEY_ALL_INCIDENTS = 'incidents_all';
const CACHE_EXPIRATION_SECONDS = 300; // Cache für 5 Minuten

// Alle Routen hier erfordern Authentifizierung
router.use(isAuthenticated);

// GET alle Incidents (mit Caching)
router.get('/', async (req, res) => {
    try {
        let incidents;
        const cachedIncidents = await redisClient.get(CACHE_KEY_ALL_INCIDENTS);

        if (cachedIncidents) {
            console.log('Incidents aus dem Cache geladen');
            incidents = JSON.parse(cachedIncidents);
        } else {
            console.log('Incidents aus der Datenbank geladen');
            const result = await db.query('SELECT * FROM incidents ORDER BY date DESC');
            incidents = result.rows;
            // Incidents im Cache speichern (asynchron, Fehler hier sollte nicht den Request blockieren)
            redisClient.setEx(CACHE_KEY_ALL_INCIDENTS, CACHE_EXPIRATION_SECONDS, JSON.stringify(incidents))
                .catch(err => console.error("Fehler beim Setzen des Incidents-Cache:", err));
        }

        res.render('incidents', {
            incidents,
            error: null,
            message: req.query.message, // Für Erfolgs-/Fehlermeldungen
            username: req.session.username // Für die Anzeige im Header
        });
    } catch (err) {
        console.error('Fehler beim Abrufen der Incidents:', err);
        res.render('incidents', {
            incidents: [],
            error: 'Fehler beim Laden der Incidents.',
            message: null,
            username: req.session.username
        });
    }
});

// POST neuen Incident erstellen
router.post('/', async (req, res) => {
    const { title, reporter, type, description, resourceId, date } = req.body;

    if (!title || !description) {
        return res.status(400).redirect('/incidents?message=Titel und Beschreibung sind Pflichtfelder.');
    }

    try {
        // Wenn kein Datum angegeben, aktuelles Datum verwenden. ISO-Format für DB.
        const incidentDate = date ? new Date(date).toISOString() : new Date().toISOString();

        await db.query(
            'INSERT INTO incidents (date, title, reporter, type, description, resource_id, updated_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
            [incidentDate, title, reporter || null, type || null, description, resourceId || null]
        );

        // Cache invalidieren nach dem Erstellen
        redisClient.del(CACHE_KEY_ALL_INCIDENTS)
            .catch(err => console.error("Fehler beim Invalidieren des Incidents-Cache nach Erstellung:", err));

        res.redirect('/incidents?message=Incident erfolgreich erstellt!');
    } catch (err) {
        console.error('Fehler beim Erstellen des Incidents:', err);
        res.status(500).redirect('/incidents?message=Fehler beim Erstellen des Incidents.');
    }
});

// POST Incident löschen
router.post('/delete/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('DELETE FROM incidents WHERE id = $1 RETURNING *', [id]);

        if (result.rowCount === 0) {
            return res.status(404).redirect('/incidents?message=Incident nicht gefunden.');
        }

        // Cache invalidieren nach dem Löschen
        redisClient.del(CACHE_KEY_ALL_INCIDENTS)
            .catch(err => console.error("Fehler beim Invalidieren des Incidents-Cache nach Löschung:", err));

        res.redirect('/incidents?message=Incident erfolgreich gelöscht!');
    } catch (err) {
        console.error('Fehler beim Löschen des Incidents:', err);
        res.status(500).redirect('/incidents?message=Fehler beim Löschen des Incidents.');
    }
});

// POST Incident eskalieren
router.post('/escalate/:id', async (req, res) => {
    const { id } = req.params;
    const serverlessEndpoint = process.env.SERVERLESS_ENDPOINT;

    if (!serverlessEndpoint) {
        console.error('SERVERLESS_ENDPOINT environment variable is not set.');
        return res.status(500).redirect('/incidents?message=Fehler: Serverless-Endpunkt nicht konfiguriert.');
    }

    try {
        // Get the incident details from the database to retrieve resource_id
        const result = await db.query('SELECT resource_id FROM incidents WHERE id = $1', [id]);
        const incident = result.rows[0];

        if (!incident) {
            return res.status(404).redirect('/incidents?message=Incident nicht gefunden.');
        }

        if (!incident.resource_id) {
             return res.status(400).redirect('/incidents?message=Incident hat keine Ressourcen-ID zum Eskalieren.');
        }

        // Prepare the payload
        const payload = {
            resourceId: incident.resource_id
        };

        console.log(`Eskaliere Incident ${id} mit Ressourcen-ID ${incident.resource_id} an ${serverlessEndpoint}`);

        // Make the POST request to the serverless endpoint
        const response = await fetch(serverlessEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add any necessary authentication headers here if required by your serverless function
                // 'Authorization': `Bearer ${process.env.SERVERLESS_API_KEY}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Fehler beim Aufruf des Serverless-Endpunkts: ${response.status} ${response.statusText}`, errorText);
            return res.status(response.status).redirect(`/incidents?message=Fehler beim Eskalieren des Incidents: ${response.statusText}`);
        }

        console.log('Incident erfolgreich eskaliert.');
        res.redirect('/incidents?message=Incident erfolgreich eskaliert!');

    } catch (err) {
        console.error('Fehler beim Eskalieren des Incidents:', err);
        res.status(500).redirect('/incidents?message=Ein Fehler ist beim Eskalieren des Incidents aufgetreten.');
    }
});

module.exports = router;