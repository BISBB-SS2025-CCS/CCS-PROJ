// services/cache.js
const redis = require('redis');
require('dotenv').config(); // Stellt sicher, dass .env geladen wird

// Try to use the connection string from the environment variable first
let redisURL;
let redisClientOptions = {};

if (process.env.APP_REDIS_CONNECTION_STRING) {
    redisURL = process.env.APP_REDIS_CONNECTION_STRING;
    redisClientOptions.url = redisURL;
    // Assuming password is part of the connection string if used this way
    console.log('Using APP_REDIS_CONNECTION_STRING for Redis connection:' + redisURL);
} else {
    // Fallback to local development configuration
    redisURL = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
    redisClientOptions.url = redisURL;
    if (process.env.REDIS_PASSWORD) {
        redisClientOptions.password = process.env.REDIS_PASSWORD;
    }
    console.log('APP_REDIS_CONNECTION_STRING not set, falling back to local Redis config.');
}

console.log(`Attempting to connect to Redis with URL: ${redisURL}`); // Hinzugefügt für Debugging


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