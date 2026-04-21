import fs from 'fs';

let content = fs.readFileSync('pre_carga_variantes.csv', 'utf8').split('\n');
let pcf = fs.readFileSync('productos_a_cargar_final.csv', 'utf8').split('\n');

// Build strict exact mappings from master file
let pm_to_familia = {};
for (let i = 1; i < pcf.length; i++) {
    let parts = pcf[i].split('",');
    if (parts.length >= 2) {
        let f = parts[0].replace(/"/g, '').trim();
        let p = parts[1].replace(/"/g, '').trim();
        pm_to_familia[p.toUpperCase()] = f;
    }
}

// Add rigid fallback assignments
let hardOverrides = {
    "FRONTLIGTH": "LONAS, VINILOS Y OTROS",
    "FRONTLIGHT": "LONAS, VINILOS Y OTROS",
    "VINILO": "LONAS, VINILOS Y OTROS",
    "BANNER": "LONAS, VINILOS Y OTROS",
    "LONA": "LONAS, VINILOS Y OTROS",
    "CANVAS": "LONAS, VINILOS Y OTROS",
    "BACK PET": "LONAS, VINILOS Y OTROS",
    "STEEL ROLL": "LONAS, VINILOS Y OTROS",
    "CAR FLAG POLE": "LONAS, VINILOS Y OTROS",
    "PAPEL": "PAPELES",
    "POLIAMIDA": "POLIAMIDA",
    "MEDIA": "ARTICULOS",
    "CAÑA": "ARTICULOS",
    "SHORT": "ARTICULOS",
    "MAQUINA": "ARTICULOS",
    "ESTRUCTURAS": "ARTICULOS"
};

let lines = content.slice(1).filter(l => l.trim() !== '');
let out = ['Familia,Producto Maestro,Nombre Variante PDF,Ancho,Gramaje,Reverso,Acabado,Color,Talle'];

for (let line of lines) {
    let parts = [];
    let cur = ''; let inQuotes = false;
    for(let i=0; i<line.length; i++) {
        if(line[i]==='"' && (i===0 || line[i-1]!=='\\')) { inQuotes = !inQuotes; } 
        else if(line[i]===',' && !inQuotes) { parts.push(cur); cur = ''; } 
        else { cur += line[i]; }
    }
    parts.push(cur);
    parts = parts.map(p => p.replace(/^"|"$/g, '').trim());
    if(parts.length < 8) continue;
    
    let fm = parts[0];
    let pm = parts[1];
    let nom = parts[2];
    let an = parts[3];
    let gr = parts[4];
    let rev = parts[5];
    let aca = parts[6];
    let col = parts[7];
    let talle = "";

    // --- RULES IMPLEMENTATION ---
    let originalUpper = nom.toUpperCase();
    
    // 1. Tallas de ropa (Extracción antes de borrar nums)
    let talleMatch = /\b(S|M|L|XL|XXL|XXXL|6|8|10|12|14|16)\b$/.exec(nom.toUpperCase());
    // Evitamos falso positivo con "M" de magenta si es tinta
    if (talleMatch && (originalUpper.includes("SHORT") || originalUpper.includes("MEDIA"))) {
        talle = talleMatch[1];
        nom = nom.substring(0, talleMatch.index).trim();
    }
    
    // 2. Colores puros de Tintas
    let isInk = originalUpper.includes("TINTA") || originalUpper.includes("T-") || originalUpper.includes("LIQUIDO");
    if (isInk) {
        if (/\bC\b(?!AÑA)/.test(nom.toUpperCase()) || /CIAN|CYAN/i.test(nom)) col = "CIAN";
        else if (/\bM\b/.test(nom.toUpperCase()) && !/\bMts?\b/i.test(nom) || /MAGENTA/i.test(nom)) col = "MAGENTA";
        else if (/\bY\b/.test(nom.toUpperCase()) || /YELLOW|AMARILLO/i.test(nom)) col = "YELLOW";
        else if (/\bK\b/.test(nom.toUpperCase()) || /BLACK|NEGRO/i.test(nom)) col = "BLACK";
        else if (/BLANC[OA]/i.test(nom)) col = "BLANCO";
        
        // Retirar los identificadores de color del nombre SOLO si es tinta (para no borrar NEGRO de los shorts)
        nom = nom.replace(/\b(C|M|Y|K|CYAN|CIAN|MAGENTA|YELLOW|AMARILLO|BLACK|BLANC[OA])\b/gi, "");
    }

    // 3. TINTAS: T-C, T- significa Tinta. Borralo. Todas las tintas = TINTA
    nom = nom.replace(/\bT-\s*/gi, "TINTA ");
    nom = nom.replace(/\bT\s+-\s*/gi, "TINTA ");
    if (nom.toUpperCase().includes("MIMAKI T")) nom = nom.replace(/MIMAKI T[- ]?/gi, "TINTA MIMAKI ");
    if (nom.toUpperCase().includes("ECO T")) nom = nom.replace(/ECO T[- ]?/gi, "TINTA ECO ");

    // 4. ECO S = Ecosolvente
    nom = nom.replace(/\bECO\s*S\b/gi, "ECOSOLVENTE");

    // 5. F- Elimínalo (F- UV)
    nom = nom.replace(/\bF-\s*/gi, "");

    // 6. UV -TEXTIES detalle UV TEXTIL
    nom = nom.replace(/\bUV\s*-TEXTIL-SUPER SOFT\b/gi, "UV TEXTIL SUPER SOFT");

    // 7. El nombre NO puede tener valor numerico aqui
    // Extract remaining numbers into Ancho if missing and it's a measure
    if (!an) {
        let m = /\b(\d+,\d+)\b/.exec(nom) || /\b(\d+x\d+)\b/i.exec(nom);
        if(m) an = m[1].toUpperCase();
    }
    // Now DESTROY all numbers from the name
    nom = nom.replace(/\d+[,.]?\d*/g, ""); // Borra 1,60, 3.20, 100, etc.
    nom = nom.replace(/\b(M|Mts|cm|mm|g|gsm|gr|x)\b/ig, ""); // Removes lingering units
    
    // Clean parenthesis, hyphens and extra spaces
    nom = nom.replace(/[\(\)\[\]]/g, "");
    nom = nom.replace(/-+/g, " ");
    nom = nom.replace(/\s+/g, " ").trim();
    
    // Also remove words like "Directa" if we don't want them in color, wait... Directa is part of TINTA SUBLI Directa.
    // If nom is just "TINTA SUBLI Directa", that's fine.

    // 8. Establecer Producto Maestro y Familia
    pm = nom; // Master product es exactamente el nombre limpio
    let umPm = pm.toUpperCase();

    // Map Familia using the Master Reference
    fm = "DESCONOCIDO";
    
    // Check direct matches
    for (const [key, value] of Object.entries(pm_to_familia)) {
         if (umPm.includes(key)) {
             fm = value;
             break;
         }
    }
    // If still unknown, use Hard Overrides
    if (fm === "DESCONOCIDO" || fm === "General") {
        for (const [key, value] of Object.entries(hardOverrides)) {
             if (umPm.includes(key)) {
                 fm = value;
                 break;
             }
        }
    }

    // Force all TINTAS
    if (umPm.includes("TINTA") || umPm.includes("BARNIZ") || umPm.includes("LIQUIDO")) {
        fm = "TINTAS";
    }
    if(umPm.includes("FILM") || umPm.includes("PET") || umPm.includes("TPU")) {
        fm = "PET";
        if(umPm.includes("TPU")) fm = "TPU";
    }

    // Colors mapping for Shorts / Cañas / Medias (no ink items)
    if (fm === 'ARTICULOS') {
        if (/AZUL FRANCIA/i.test(originalUpper)) col = "AZUL FRANCIA";
        else if (/AZUL MARINO/i.test(originalUpper)) col = "AZUL MARINO";
        else if (/ROJO/i.test(originalUpper)) col = "ROJO";
        else if (/VERDE/i.test(originalUpper)) col = "VERDE";
        else if (/AMARILLO/i.test(originalUpper)) col = "AMARILLO";
        else if (/BLANCO/i.test(originalUpper)) col = "BLANCO";
        else if (/NEGRO/i.test(originalUpper)) col = "NEGRO";
        
        pm = pm.replace(/\b(AZUL FRANCIA|AZUL MARINO|ROJO|VERDE|AMARILLO|BLANCO|NEGRO)\b/gi, "").trim();
        nom = pm; // Set them equal
    }

    // Some Final cleanup
    pm = pm.replace(/\s+/g, " ").trim();
    nom = nom.replace(/\s+/g, " ").trim();

    // Avoid empty strings
    if(!pm) pm = "TINTA"; // Edge case
    if(!nom) nom = pm;

    let csvLine = `"${fm}","${pm}","${nom}","${an}","${gr}","${rev}","${aca}","${col}","${talle}"`;
    out.push(csvLine);
}

// Deduplicate
let finalOut = [];
let setOut = new Set();
for(let line of out) {
    if(!setOut.has(line)) {
        setOut.add(line);
        finalOut.push(line);
    }
}

fs.writeFileSync('pre_carga_variantes.csv', finalOut.join('\n'));
console.log("Archivo pre_carga_variantes.csv REESCRITO con éxito (Cero números en el Nombre, Atributos segregados).");
