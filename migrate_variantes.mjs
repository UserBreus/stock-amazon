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
        throw new Error("SQL Error: " + data.error + "\nQuery: " + query.substring(0, 500));
    }
    return data.data;
}

function parseCSV(content) {
    let lines = content.split('\n').filter(l => l.trim() !== '');
    let result = [];
    for(let i=1; i<lines.length; i++) { 
        let line = lines[i];
        let cols = [];
        let inQuote = false;
        let buf = "";
        for(let c=0; c<line.length; c++) {
            let char = line[c];
            if(char === '"') inQuote = !inQuote;
            else if(char === ',' && !inQuote) { cols.push(buf); buf = ""; }
            else buf += char;
        }
        cols.push(buf);
        result.push(cols.map(c => c.trim()));
    }
    return result;
}

async function migrate() {
    console.log("🚀 MIGRACION DE VARIANTES INICIADA 🚀");
    
    let finalC = fs.readFileSync('productos_a_cargar_final.csv', 'utf8');
    let pRows = parseCSV(finalC);
    let umMap = {};
    for (let r of pRows) {
        if(r.length >= 3) {
            umMap[r[1].toUpperCase()] = r[2];
        }
    }

    let csvContent = fs.readFileSync('pre_carga_variantes.csv', 'utf8');
    let rows = parseCSV(csvContent);

    let catCache = {};
    let prodCache = {};
    let attrCache = {}; 
    let attrValCache = {}; 

    console.log("1. Limpiando catalogo de variantes viejo...");
    await executeSql("DELETE FROM Stock_Etiquetas;" +
        "DELETE FROM Stock_Movimientos;" + 
        "DELETE FROM Stock_Compras_Detalle;" +
        "DELETE FROM Stock_Compras;" +
        "DELETE FROM Stock_Variantes;");

    let [catRes, prodRes, atRes, valRes] = await Promise.all([
        executeSql("SELECT id, nombre FROM Stock_Categorias"),
        executeSql("SELECT id, nombre FROM Stock_Productos_Maestros"),
        executeSql("SELECT id, nombre FROM wms_atributos_base"),
        executeSql("SELECT id, valor FROM wms_atributos_valores_base")
    ]);
    
    catRes.forEach(c => catCache[c.nombre.toUpperCase()] = c.id);
    prodRes.forEach(p => prodCache[p.nombre.toUpperCase()] = p.id);
    atRes.forEach(a => attrCache[a.nombre.toUpperCase()] = a.id);
    valRes.forEach(v => attrValCache[v.valor.toUpperCase()] = v.id);

    const getOrCreateAttr = async (name) => {
        let u = name.toUpperCase();
        if(attrCache[u]) return attrCache[u];
        let safe = name.replace(/'/g, "''");
        await executeSql("INSERT INTO wms_atributos_base (nombre) VALUES ('" + safe + "')");
        let r = await executeSql("SELECT id FROM wms_atributos_base WHERE nombre='" + safe + "'");
        attrCache[u] = r[0].id;
        return r[0].id;
    }
    
    const getOrCreateVal = async (attrId, val) => {
        let u = val.toUpperCase();
        if(attrValCache[u]) return attrValCache[u];
        let safe = val.replace(/'/g, "''");
        await executeSql("INSERT INTO wms_atributos_valores_base (atributo_id, valor) VALUES (" + attrId + ", '" + safe + "')");
        let r = await executeSql("SELECT id FROM wms_atributos_valores_base WHERE atributo_id=" + attrId + " AND valor='" + safe + "'");
        attrValCache[u] = r[0].id;
        return r[0].id;
    }
    
    await getOrCreateAttr("Medida de Ancho");
    await getOrCreateAttr("Gramaje");
    await getOrCreateAttr("Color o Reverso");
    await getOrCreateAttr("Acabado / Terminacion");
    await getOrCreateAttr("Color Tinta / Tela");
    await getOrCreateAttr("Talle");

    for(let r=0; r<rows.length; r++) {
        let cols = rows[r];
        if(cols.length < 8) continue;
        
        let fam = cols[0];
        let pm = cols[1];
        let nom = cols[2];
        let an = cols[3];
        let gr = cols[4];
        let rev = cols[5];
        let aca = cols[6];
        let col = cols[7];
        let talle = cols[8] || "";

        if(!catCache[fam.toUpperCase()]) {
             let sFam = fam.replace(/'/g, "''");
             await executeSql("INSERT INTO Stock_Categorias (nombre) VALUES ('" + sFam + "')");
             let rFam = await executeSql("SELECT id FROM Stock_Categorias WHERE nombre='" + sFam + "'");
             catCache[fam.toUpperCase()] = rFam[0].id;
        }

        let pmU = pm.toUpperCase();
        if(!prodCache[pmU]) {
             let unidad = umMap[pmU] || (pmU.includes("TINTA") || pmU.includes("LIQU") || pmU.includes("BARNIZ") ? "lts" : "uds");
             if (fam.toUpperCase().includes('TELA') || fam.toUpperCase().includes('POLIAMIDA')) unidad = "kg";
             if (fam.toUpperCase().includes('LONA') || fam.toUpperCase().includes('VINILO') || fam.toUpperCase().includes('PAPEL') || fam.toUpperCase().includes('PET') || fam.toUpperCase().includes('TPU')) unidad = "mts";
             
             let sPm = pm.replace(/'/g, "''");
             let skuPm = 'M-' + Date.now() + Math.floor(Math.random()*1000);
             await executeSql("INSERT INTO Stock_Productos_Maestros (sku, nombre, categoria_id, unidad_base) VALUES ('" + skuPm + "', '" + sPm + "', " + catCache[fam.toUpperCase()] + ", '" + unidad + "')");
             let rPm = await executeSql("SELECT id FROM Stock_Productos_Maestros WHERE nombre='" + sPm + "'");
             prodCache[pmU] = rPm[0].id;
        }

        let varNameParts = [pm];
        let md = {};
        if(col) { varNameParts.push(col); md["Color Tinta / Tela"] = col; }
        if(an) { varNameParts.push(an); md["Medida de Ancho"] = an; }
        if(gr) { varNameParts.push(gr+'g'); md["Gramaje"] = gr; }
        if(aca) { varNameParts.push(aca); md["Acabado / Terminacion"] = aca; }
        if(rev) { varNameParts.push(rev); md["Color o Reverso"] = rev; }
        if(talle) { varNameParts.push(talle); md["Talle"] = talle; }
        let finalVarName = varNameParts.join(" - ");
        
        let safeVN = finalVarName.replace(/'/g, "''");
        let safeJSON = JSON.stringify(md).replace(/'/g, "''");
        
        let skuSuffix = varNameParts.slice(1).map(x=>x.substring(0,4).toUpperCase().replace(/[^A-Z0-9]/g, '')).join('-');
        if(!skuSuffix) skuSuffix = "BASE";
        let skuVar = "VAR-" + pm.substring(0,4).toUpperCase().replace(/[^A-Z0-9]/g, '') + "-" + skuSuffix + "-" + r;

        console.log("Creando: " + finalVarName);
        await executeSql("INSERT INTO Stock_Variantes (producto_maestro_id, codigo_variante, nombre_variante, metadata_json) VALUES ('" + prodCache[pmU] + "', '" + skuVar + "', '" + safeVN + "', '" + safeJSON + "')");
        
        // Also populate the global dictionary just to keep the master records up to date as asked (crealos en modelos estructurados)
        if(an) { let aid = await getOrCreateAttr("Medida de Ancho"); await getOrCreateVal(aid, an); }
        if(gr) { let aid = await getOrCreateAttr("Gramaje"); await getOrCreateVal(aid, gr); }
        if(rev) { let aid = await getOrCreateAttr("Color o Reverso"); await getOrCreateVal(aid, rev); }
        if(aca) { let aid = await getOrCreateAttr("Acabado / Terminacion"); await getOrCreateVal(aid, aca); }
        if(col) { let aid = await getOrCreateAttr("Color Tinta / Tela"); await getOrCreateVal(aid, col); }
        if(talle) { let aid = await getOrCreateAttr("Talle"); await getOrCreateVal(aid, talle); }
    }

    console.log("¡TODAS LAS VARIANTES ARRAIGADAS CON EXITO! ✅");
}

migrate().catch(console.error);
