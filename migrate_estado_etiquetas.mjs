const url = 'http://3.85.26.173:5005/sql';

async function migrate() {
    try {
        let r1 = await fetch(url, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ query: `ALTER TABLE Stock_Etiquetas ADD estado VARCHAR(50) DEFAULT 'activo'` })
        }).then(r=>r.json());
        console.log("Add Column:", r1);

        let r2 = await fetch(url, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ query: `UPDATE Stock_Etiquetas SET estado = 'activo' WHERE estado IS NULL` })
        }).then(r=>r.json());
        console.log("Update Data:", r2);

    } catch(e) {
        console.error(e);
    }
}
migrate();
