import fetch from 'node-fetch'; // Polyfilled usually or native in v18

async function createTable() {
    const q = `
        IF OBJECT_ID('wms_equivalencias_metricas', 'U') IS NULL BEGIN
            CREATE TABLE wms_equivalencias_metricas (
                id INT IDENTITY(1,1) PRIMARY KEY,
                producto_maestro_id UNIQUEIDENTIFIER REFERENCES Stock_Productos_Maestros(id) ON DELETE CASCADE,
                gramos_por_metro_lineal DECIMAL(18,2) NOT NULL,
                CONSTRAINT UQ_equiv_prod UNIQUE(producto_maestro_id)
            );
        END
    `;

    try {
        const res = await fetch('http://3.85.26.173:5005/sql', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ query: q })
        });
        const data = await res.json();
        console.log(data);
    } catch(e) {
        console.error(e);
    }
}
createTable();
