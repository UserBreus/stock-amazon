import { Client } from 'pg';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const match = env.match(/POSTGRES_URL=([^\n]+)/);

if (match) {
    const client = new Client({ connectionString: match[1].trim() });
    await client.connect();
    
    await client.query(`
        CREATE TABLE IF NOT EXISTS wms_atributos_base (
            id SERIAL PRIMARY KEY,
            nombre VARCHAR(255) NOT NULL UNIQUE
        );
        CREATE TABLE IF NOT EXISTS wms_atributos_valores_base (
            id SERIAL PRIMARY KEY,
            atributo_id INTEGER REFERENCES wms_atributos_base(id) ON DELETE CASCADE,
            valor VARCHAR(255) NOT NULL,
            UNIQUE(atributo_id, valor)
        );
    `);
    
    console.log('Tablas de Atributos en AWS PG creadas exitosamente.');
    process.exit(0);
} else {
    console.log('No POSTGRES_URL found');
    process.exit(1);
}
