// services/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Um .env-Variablen zu laden

const isProduction = process.env.NODE_ENV === 'production';

let connectionConfig;

if (isProduction) {
    // Use a single connection string from environment variable for production
    if (!process.env.DATABASE_URL) {
        console.error("DATABASE_URL environment variable is not set for production!");
        process.exit(1); // Exit if critical variable is missing
    }
    connectionConfig = {
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false // Often needed for cloud databases like RDS
        }
    };
} else {
    // Use separate environment variables for local development
    connectionConfig = {
        user: process.env.PG_USER,
        host: process.env.PG_HOST,
        database: process.env.PG_DATABASE,
        password: process.env.PG_PASSWORD,
        port: parseInt(process.env.PG_PORT || '5432'),
        ssl: false // Not needed for local development
    };
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