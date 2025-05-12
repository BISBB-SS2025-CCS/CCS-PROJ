// services/db.js
const { Pool } = require('pg');
require('dotenv').config(); // Um .env-Variablen zu laden

const isProduction = process.env.NODE_ENV === 'production';

const connectionConfig = {
    user: isProduction ? process.env.RDS_USERNAME : process.env.PG_USER,
    host: isProduction ? process.env.RDS_HOSTNAME : process.env.PG_HOST,
    database: isProduction ? process.env.RDS_DB_NAME : process.env.PG_DATABASE,
    password: isProduction ? process.env.RDS_PASSWORD : process.env.PG_PASSWORD,
    port: isProduction ? parseInt(process.env.RDS_PORT || '5432') : parseInt(process.env.PG_PORT || '5432'),
    ssl: isProduction ? { rejectUnauthorized: false } : false // Für AWS RDS SSL, lokal meist nicht nötig
};

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