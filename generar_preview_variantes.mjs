import fs from 'fs';

// 1. Cargar Base Map de Familia y Productos Maestros 
let pcf = fs.readFileSync('productos_a_cargar_final.csv', 'utf8').split('\n');
let baseProductsMapping = []; 
// ["Familia", "Producto Maestro", "Unidad"]
for (let i = 1; i < pcf.length; i++) {
    let line = pcf[i].trim();
    if (!line) continue;
    let parts = line.split('",');
    if (parts.length >= 3) {
        let familia = parts[0].replace(/"/g, '').trim();
        let prod = parts[1].replace(/"/g, '').trim();
        let unidad = parts[2].replace(/"/g, '').trim();
        if (prod) {
            baseProductsMapping.push({ familia, prod, unidad });
        }
    }
}
// Sort by length to match the longest 'Producto' first in strings
baseProductsMapping.sort((a, b) => b.prod.length - a.prod.length);

// 2. Cargar items del PDF
let raw = fs.readFileSync('extracted_pdf_text.txt', 'utf8');
let tokens = raw.split(/\s+/);
let items = [];
let currentCategory = 'General';
let currentQty = null;
let currentString = [];

const finalizeItem = () => {
    if (currentQty !== null && currentString.length > 0) {
        items.push({
            categoria: currentCategory,
            nombreOriginal: currentString.join(" ").trim()
        });
    }
    currentString = [];
};

for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i];
    if (t.startsWith('**') && t.endsWith('**')) {
        finalizeItem();
        currentCategory = t.replace(/\*\*/g, '').trim();
        continue;
    }
    if (t.match(/^-+$/)) continue;
    if (/^\d+$/.test(t)) {
        let nextIsWord = false;
        if (i + 1 < tokens.length && /^[a-zA-Z]/.test(tokens[i+1])) {
            nextIsWord = true;
        }
        if (nextIsWord) {
            finalizeItem();
            currentQty = parseInt(t);
        } else {
            if (currentQty !== null) currentString.push(t);
        }
    } else {
        if (currentQty !== null) currentString.push(t);
    }
}
finalizeItem();

// 3. Preparar extracción
function extractAttrs(originalName) {
    let name = originalName;
    
    // a. Gramaje
    let gramaje = "";
    let matchG = /\b(\d+)\s*(g|gsm|gr)\b/i.exec(name);
    if (!matchG) matchG = /\(\s*(\d+)\s*(g|gsm|gr)\s*\)/i.exec(name);
    if (matchG) {
        gramaje = matchG[1];
        name = name.replace(matchG[0], ""); 
    }

    // b. Reverso
    let reverso = "";
    let matchR = /(?:\(|\b)(?:Reverso\s+|R\/)([a-zA-Z]+)(?:\)|\b)/i.exec(name);
    if (matchR) {
        reverso = matchR[1].toUpperCase();
        name = name.replace(matchR[0], "");
    }

    // c. Acabado
    let acabado = "";
    let matchA = /\b(?:BRI|BRILLO|Brillante)\b/i.exec(name);
    if (matchA) {
        acabado = "BRILLO";
        name = name.replace(matchA[0], "");
    } else {
        matchA = /\b(?:MAT|MATE)\b/i.exec(name);
        if (matchA) {
            acabado = "MATE";
            name = name.replace(matchA[0], "");
        } else {
            matchA = /\b(?:SEMIBRILLO)\b/i.exec(name);
            if (matchA) {
                acabado = "SEMIBRILLO";
                name = name.replace(matchA[0], "");
            }
        }
    }

    // d. Ancho
    let ancho = "";
    let matchW = /\b(\d+[,.]\d+)\b/i.exec(name);
    if (matchW) {
        ancho = matchW[1].replace('.', ',');
        name = name.replace(matchW[0], "");
    } else {
        matchW = /\b(\d+)\s*(cm|mm)\b/i.exec(name);
        if (matchW) {
            ancho = matchW[1] + matchW[2];
            name = name.replace(matchW[0], "");
        } else {
            matchW = /\b(\d+\s*[xX]\s*\d+)\b/i.exec(name);
            if (matchW) {
                ancho = matchW[1].toUpperCase();
                name = name.replace(matchW[0], "");
            }
        }
    }

    // e. Colores y Tallas (Tintas, prendras)
    let colorTinta = "";
    let talle = "";
    
    // Tintas: CYMK
    let lowerName = name.toLowerCase();
    if (lowerName.includes("cyan") || /\b(?:-c|c)\b/i.test(name) && originalName.includes("TINTA")) colorTinta = "CYAN";
    else if (lowerName.includes("magenta") || /\b(?:-m|m)\b/i.test(name) && originalName.includes("TINTA")) colorTinta = "MAGENTA";
    else if (lowerName.includes("yellow") || /\b(?:-y|y)\b/i.test(name) && originalName.includes("TINTA")) colorTinta = "AMARILLO";
    else if (lowerName.includes("black") || lowerName.includes("negro") || /\b(?:-k|k)\b/i.test(name) && originalName.includes("TINTA")) colorTinta = "NEGRO";
    else if (lowerName.includes("light cyan") || /\blc\b/i.test(name)) colorTinta = "LIGHT CYAN";
    else if (lowerName.includes("light magenta") || /\blm\b/i.test(name)) colorTinta = "LIGHT MAGENTA";
    else if (lowerName.includes("white") || lowerName.includes("blanca")) colorTinta = "BLANCO";
    
    // Remove detected colors to clean base string
    if(colorTinta) {
        if(colorTinta==='CYAN') name = name.replace(/cyan|-c/gi, "");
        if(colorTinta==='MAGENTA') name = name.replace(/magenta|-m/gi, "");
        if(colorTinta==='AMARILLO') name = name.replace(/yellow|-y/gi, "");
        if(colorTinta==='NEGRO') name = name.replace(/black|negro|-k/gi, "");
        if(colorTinta==='BLANCO') name = name.replace(/white|blanca/gi, "");
    }

    // Clean junk
    name = name.replace(/\(\d+\s*Mts?\)/ig, ""); 
    name = name.replace(/\bx\s*\d+\s*m\b/ig, ""); 
    name = name.replace(/\b(?:mts|m)\b/ig, ""); 
    name = name.replace(/ \(\d+(lts|l\.)\)/ig, "");
    name = name.replace(/[\(\)\[\]]/g, "").replace(/\s+/g, ' ').trim();

    return { ancho, gramaje, reverso, acabado, colorTinta, talle, cleanName: name };
}

let outCsv = "Familia,Producto Maestro,Nombre Variante PDF,Ancho,Gramaje,Reverso,Acabado,Color\n";
let validSet = new Set();

for (let item of items) {
    let rawStr = item.nombreOriginal;
    let attrs = extractAttrs(rawStr);
    
    let upperF = attrs.cleanName.toUpperCase();
    if (upperF.includes('T-')) upperF = upperF.replace(/T-/g, 'TINTA ').replace(/ T-/g, ' TINTA ');
    
    // Find base product
    let assignedFamilia = "General";
    let assignedPM = "DESCONOCIDO";
    
    for (let bp of baseProductsMapping) {
        if (upperF.includes(bp.prod.toUpperCase())) {
            assignedFamilia = bp.familia;
            assignedPM = bp.prod;
            break;
        }
    }
    
    // Format out line
    let csvLine = `"${assignedFamilia}","${assignedPM}","${rawStr.replace(/"/g, '""')}","${attrs.ancho}","${attrs.gramaje}","${attrs.reverso}","${attrs.acabado}","${attrs.colorTinta}"`;
    
    if(!validSet.has(csvLine)) {
        validSet.add(csvLine);
        outCsv += csvLine + "\n";
    }
}

fs.writeFileSync('pre_carga_variantes.csv', outCsv);
console.log("Archivo pre_carga_variantes.csv generado exitosamente para todos los items del PDF.");
