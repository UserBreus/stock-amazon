require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.VITE_DATABASE_URL });
client.connect().then(() => {
    client.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'stock_variantes';
    `).then(res => {
        console.log(res.rows);
        process.exit(0);
    });
});
