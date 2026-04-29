async function checkDelta() {
    const API_URL = "http://3.85.26.173:5005/sql";
    async function executeQuery(query) {
        const r = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        return await r.json();
    }

    try {
        const resMaestros = await executeQuery("SELECT id, nombre, sku, atributos_config FROM Stock_Productos_Maestros WHERE nombre LIKE '%DELTA%';");
        const maestros = resMaestros.data;
        console.log("MAESTROS:", JSON.stringify(maestros, null, 2));

        if (maestros && maestros.length > 0) {
            const ids = maestros.map(m => m.id).join(',');
            const resVariants = await executeQuery(`SELECT id, producto_maestro_id, nombre_variante, codigo_variante FROM Stock_Variantes WHERE producto_maestro_id IN (${ids});`);
            console.log("VARIANTES:", JSON.stringify(resVariants.data, null, 2));
        }
    } catch (e) {
        console.error(e);
    }
}
checkDelta();
