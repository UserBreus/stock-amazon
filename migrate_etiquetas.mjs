import { createPool } from 'mysql2/promise';

const pool = createPool({
      host: 'database-1.czwo6qsuyaep.us-east-2.rds.amazonaws.com',
      user: 'admin',
      password: 'Silkypassword1!',
      database: 'stock_db'
});

async function run() {
    try {
        console.log("Adding estado to Stock_Etiquetas");
        await pool.query("ALTER TABLE Stock_Etiquetas ADD COLUMN estado VARCHAR(50) DEFAULT 'activo'");
        console.log("Success");
    } catch(e) {
        if(e.message.includes('Duplicate column')) {
            console.log("Column already exists");
        } else if (e.message.includes('syntax')) {
            // maybe it's sql server
            console.log("Maybe SQL Server syntax?");
        } else {
            console.error(e);
        }
    }
    process.exit(0);
}
run();
