const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection string
const connectionString = 'postgresql://postgres:postgres@localhost:5433/generated_db';

// Path to the SQL schema file
const schemaFilePath = path.join(__dirname, '../database/schema.sql');

async function migrate() {
    const client = new Client({
        connectionString: connectionString,
    });

    try {
        console.log('Connecting to the database...');
        await client.connect();
        console.log('Successfully connected to the database.');

        console.log(`Reading SQL schema from ${schemaFilePath}...`);
        const schemaSql = fs.readFileSync(schemaFilePath, 'utf8');
        console.log('SQL schema read successfully.');

        console.log('Executing SQL schema...');
        // Execute the SQL schema. This will create tables, enums, functions, and triggers.
        // The pgcrypto extension creation is commented out in the schema,
        // but if it were uncommented, it would be handled here.
        await client.query(schemaSql);
        console.log('SQL schema executed successfully. Tables and other objects created/updated.');

    } catch (err) {
        console.error('Error during migration:', err);
        process.exit(1); // Exit with a non-zero code to indicate failure
    } finally {
        console.log('Closing database connection...');
        await client.end();
        console.log('Database connection closed.');
    }
}

// Execute the migration function
migrate();

/*
To run this migration script, you need to:
1. Install the 'pg' package:
   npm install pg

2. Add a script to your package.json:
   "scripts": {
     "migrate": "node backend/migrate.js",
     "start": "node backend/index.js" // Example start script
   }

3. Run the migration:
   npm run migrate

This script should be run before your application starts, or as part of your deployment process.
*/
