import fs from 'fs';

const API_URL = 'http://3.85.26.173:5005/sql';

async function executeSql(query) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const data = await res.json();
    if (!data.success) {
        throw new Error("SQL Error: " + data.error + "\nQuery: " + query.substring(0, 100));
    }
    return data.data;
}

function parseCSV(content) {
    let lines = content.split('\n').filter(l => l.trim() !== '');
    let result = [];
    // Skip header line 0
    for(let i=1; i<lines.length; i++) {
        let line = lines[i];
        let idx = 0;
        let cols = [];
        let inQuote = false;
        let buf = "";
        for(let c=0; c<line.length; c++) {
            let char = line[c];
            if(char === '"') {
                inQuote = !inQuote;
            } else if(char === ',' && !inQuote) {
                cols.push(buf);
                buf = "";
            } else {
                buf += char;
            }
        }
        cols.push(buf);
        result.push(cols);
    }
    return result;
}

async function load() {
    try {
        console.log("Limpiando tablas de base de datos...");
        await executeSql(`
            DELETE FROM Stock_Movimientos;
            DELETE FROM Stock_Compras_Detalle;
            DELETE FROM Stock_Compras;
            DELETE FROM Stock_Etiquetas;
            DELETE FROM Stock_Variantes;
            DELETE FROM Stock_Productos_Maestros;
            DELETE FROM Stock_Categorias;
            DELETE FROM wms_atributos_valores_base;
            DELETE FROM wms_atributos_base;
        `);
        console.log("Tablas limpiadas exitosamente.");

        console.log("Leyendo productos_a_cargar_final.csv...");
        let prodCsv = fs.readFileSync('productos_a_cargar_final.csv', 'utf8');
        let prodRows = parseCSV(prodCsv);

        // Map families
        let familias = new Set();
        for(let row of prodRows) {
            if(row.length > 0 && row[0]) {
                familias.add(row[0].trim());
            }
        }

        console.log("Insertando familias...", familias);
        let catIdMap = {};
        for(let fam of familias) {
            let safeFam = fam.replace(/'/g, "''");
            await executeSql(`INSERT INTO Stock_Categorias (nombre) VALUES ('${safeFam}')`);
            let res = await executeSql(`SELECT id FROM Stock_Categorias WHERE nombre='${safeFam}'`);
            if(res && res.length > 0) {
                catIdMap[fam] = res[0].id;
            }
        }

        console.log("Insertando productos...");
        for(let row of prodRows) {
            if(row.length < 3) continue;
            let fam = row[0].trim();
            let nombre = row[1].trim();
            let unidad = row[2].trim() || 'ud';
            
            let safeNombre = nombre.replace(/'/g, "''");
            let safeUnidad = unidad.replace(/'/g, "''");
            let sku = 'SKU-' + Date.now() + '-' + Math.floor(Math.random()*10000);
            let catId = catIdMap[fam];

            await executeSql(`INSERT INTO Stock_Productos_Maestros (sku, nombre, categoria_id, unidad_base) VALUES ('${sku}', '${safeNombre}', ${catId}, '${safeUnidad}')`);
        }
        console.log("¡Productos cargados!");

        console.log("Leyendo estructuras_registradas.csv...");
        let estCsv = fs.readFileSync('estructuras_registradas.csv', 'utf8');
        let estRows = parseCSV(estCsv);

        let rasgoMap = {};
        console.log("Procesando estructuras...");
        for(let row of estRows) {
            if(row.length < 2) continue;
            let rasgo = row[0].trim();
            let valor = row[1].trim();

            if(!rasgoMap[rasgo]) {
                let safeRasgo = rasgo.replace(/'/g, "''");
                await executeSql(`INSERT INTO wms_atributos_base (nombre) VALUES ('${safeRasgo}')`);
                let res = await executeSql(`SELECT id FROM wms_atributos_base WHERE nombre='${safeRasgo}'`);
                rasgoMap[rasgo] = res[0].id;
            }
            
            let atributoId = rasgoMap[rasgo];
            let safeValor = valor.replace(/'/g, "''");
            await executeSql(`
                IF NOT EXISTS (SELECT 1 FROM wms_atributos_valores_base WHERE atributo_id=${atributoId} AND valor='${safeValor}')
                INSERT INTO wms_atributos_valores_base (atributo_id, valor) VALUES (${atributoId}, '${safeValor}')   
            `);
        }
        
        console.log("¡Estructuras cargadas!");
        console.log("PROCESO COMPLETADO EXITOSAMENTE.");

    } catch(err) {
        console.error(err);
    }
}

load();
