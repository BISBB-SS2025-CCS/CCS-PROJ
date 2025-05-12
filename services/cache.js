// services/cache.js
const redis = require('redis');
require('dotenv').config(); // Stellt sicher, dass .env geladen wird

const isProduction = process.env.NODE_ENV === 'production';

// KORREKTE DEFINITION DER redisURL
let redisURL;
if (isProduction) {
    // Für AWS ElastiCache (Beispiel, passen Sie dies an Ihre Endpunkt-Struktur an)
    // Falls Ihr ElastiCache-Endpunkt bereits 'redis://' enthält, entfernen Sie es hier
    if (process.env.ELASTICACHE_REDIS_ENDPOINT && process.env.ELASTICACHE_REDIS_ENDPOINT.startsWith('redis://')) {
        redisURL = `${process.env.ELASTICACHE_REDIS_ENDPOINT}:${process.env.ELASTICACHE_REDIS_PORT}`;
    } else {
        redisURL = `redis://${process.env.ELASTICACHE_REDIS_ENDPOINT}:${process.env.ELASTICACHE_REDIS_PORT}`;
    }
} else {
    // Für lokale Entwicklung
    redisURL = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
}

console.log(`Attempting to connect to Redis with URL: ${redisURL}`); // Hinzugefügt für Debugging

const redisClientOptions = {
    url: redisURL // Die korrigierte URL wird hier verwendet
};

// Passwort-Handling (unverändert von Ihrem vorherigen Code, aber wichtig)
if (isProduction && process.env.ELASTICACHE_REDIS_PASSWORD) {
    redisClientOptions.password = process.env.ELASTICACHE_REDIS_PASSWORD;
} else if (!isProduction && process.env.REDIS_PASSWORD) {
    redisClientOptions.password = process.env.REDIS_PASSWORD;
}


const redisClient = redis.createClient(redisClientOptions);

redisClient.on('connect', () => {
    console.log('Successfully connected to Redis!');
});

redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
    // Im Produktionsmodus sollte die App nicht unbedingt wegen Redis abstürzen,
    // sondern graceful degradation implementieren (z.B. ohne Cache weiterarbeiten).
});

// Asynchrone Funktion zum Verbinden, da .connect() ein Promise zurückgibt
(async () => {
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('Could not connect to Redis on startup:', err);
        // Optional: Prozess beenden, wenn Redis kritisch ist
        // process.exit(1);
    }
})();

module.exports = redisClient;