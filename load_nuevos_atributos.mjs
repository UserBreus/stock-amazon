import fs from 'fs';
import fetch from 'node-fetch'; // assuming fetch is globally available in Node v18+ but import just in case if node 18 allows it, actually global is fine.
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

async function loadNuevosAtributos() {
    try {
        console.log("Leyendo medidas_gramajes_avanzado.csv...");
        let csv = fs.readFileSync('medidas_gramajes_avanzado.csv', 'utf8');
        let rows = parseCSV(csv);

        // Sets de valores únicos (ignoramos vacíos)
        let anchos = new Set();
        let gramajes = new Set();
        let reversos = new Set();
        let acabados = new Set();

        for(let row of rows) {
            // Producto, Ancho, Gramaje, Reverso, Acabado, Nombre Original
            if(row[1]) anchos.add(row[1].trim());
            if(row[2]) gramajes.add(row[2].trim());
            if(row[3]) reversos.add(row[3].trim());
            if(row[4]) acabados.add(row[4].trim());
        }

        const mapAtributos = [
            { nombre_base: 'MEDIDA DE ANCHO', valores: Array.from(anchos) },
            { nombre_base: 'GRAMAJE', valores: Array.from(gramajes) },
            { nombre_base: 'REVERSO', valores: Array.from(reversos) },
            { nombre_base: 'ACABADO', valores: Array.from(acabados) },
        ];

        for (let obj of mapAtributos) {
            if (obj.valores.length === 0) continue;
            console.log("Procesando Atributo Base:", obj.nombre_base);
            
            // Aseguramos que exista el atributo base
            await executeSql(`
                IF NOT EXISTS (SELECT 1 FROM wms_atributos_base WHERE nombre='${obj.nombre_base}')
                INSERT INTO wms_atributos_base (nombre) VALUES ('${obj.nombre_base}')
            `);

            let res = await executeSql(`SELECT id FROM wms_atributos_base WHERE nombre='${obj.nombre_base}'`);
            let atributoId = res[0].id;

            // Inyectar los valores
            for(let valor of obj.valores) {
                let safeValor = valor.replace(/'/g, "''").toUpperCase(); // uniformidad visual
                await executeSql(`
                    IF NOT EXISTS (SELECT 1 FROM wms_atributos_valores_base WHERE atributo_id=${atributoId} AND valor='${safeValor}')
                    INSERT INTO wms_atributos_valores_base (atributo_id, valor) VALUES (${atributoId}, '${safeValor}')   
                `);
            }
        }

        console.log("Nuevos atributos inyectados en la base de datos.");
    } catch(err) {
        console.error("Error al cargar atributos:", err);
    }
}

loadNuevosAtributos();
