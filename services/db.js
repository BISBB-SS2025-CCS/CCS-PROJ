// services/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Um .env-Variablen zu laden

let connectionConfig;

// Try to use the connection string from the environment variable first
if (process.env.DATABASE_URL) {
    console.log('Using DATABASE_URL from environment for PostgreSQL connection.' + process.env.DATABASE_URL);
    connectionConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Often needed for cloud databases like RDS
        }
    };
} else {
    // Fallback to local development configuration using individual variables
    console.log('DATABASE_URL not set, falling back to local PostgreSQL config.');
    connectionConfig = {
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD,
        port: parseInt(process.env.PG_PORT || '5432'),
        ssl: false // Not needed for local development
    };
}

// Add a check to ensure essential local variables are set if DATABASE_URL is not used
if (!process.env.DATABASE_URL && (!process.env.PG_USER || !process.env.PG_HOST || !process.env.PG_DATABASE || !process.env.PG_PASSWORD)) {
     console.error("Essential PostgreSQL environment variables (PG_USER, PG_HOST, PG_DATABASE, PG_PASSWORD) are not set for local development and DATABASE_URL is also not set!");
     process.exit(1); // Exit if critical variables are missing
}


const pool = new Pool(connectionConfig);

pool.on('connect', () => {
    console.log('Successfully connected to PostgreSQL database!');
});

pool.on('error', (err) => {
    console.error('Unexpected error on idle PostgreSQL client', err);
    process.exit(-1); // Bei Fehlern beenden, um Neustart durch Orchestrierung (z.B. Docker) zu ermöglichen
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool // Exportieren, falls direkter Zugriff benötigt wird
};