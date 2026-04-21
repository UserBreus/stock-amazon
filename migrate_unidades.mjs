const url = 'http://3.85.26.173:5005/sql';

async function migrate() {
    try {
        let r1 = await fetch(url, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ query: `
            IF OBJECT_ID('wms_unidades_medida', 'U') IS NULL BEGIN
                CREATE TABLE wms_unidades_medida (
                    id INT IDENTITY(1,1) PRIMARY KEY, 
                    nombre VARCHAR(255) NOT NULL UNIQUE
                );
            END
            ` })
        }).then(r=>r.json());
        console.log("Create Table:", r1);

        let r2 = await fetch(url, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ query: `
            INSERT INTO wms_unidades_medida (nombre)
            SELECT 'ud' WHERE NOT EXISTS (SELECT 1 FROM wms_unidades_medida WHERE nombre='ud');
            
            INSERT INTO wms_unidades_medida (nombre)
            SELECT 'kg' WHERE NOT EXISTS (SELECT 1 FROM wms_unidades_medida WHERE nombre='kg');
            
            INSERT INTO wms_unidades_medida (nombre)
            SELECT 'mts' WHERE NOT EXISTS (SELECT 1 FROM wms_unidades_medida WHERE nombre='mts');
            
            INSERT INTO wms_unidades_medida (nombre)
            SELECT 'lts' WHERE NOT EXISTS (SELECT 1 FROM wms_unidades_medida WHERE nombre='lts');
            ` })
        }).then(r=>r.json());
        console.log("Seed Data:", r2);

    } catch(e) {
        console.error(e);
    }
}
migrate();
