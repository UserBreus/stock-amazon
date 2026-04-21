import fs from 'fs';

// 1. Read base products mapping
let baseCsv = fs.readFileSync('productos_a_cargar_final.csv', 'utf8').split('\n');
let baseMap = []; // we will sort by length descending to match longest possible BaseName first
for (let i = 1; i < baseCsv.length; i++) {
    let line = baseCsv[i].trim();
    if (!line) continue;
    let parts = line.split('",');
    if (parts.length >= 2) {
        let baseName = parts[1].replace(/"/g, '').trim();
        if (baseName) {
            baseMap.push(baseName);
        }
    }
}
// Sort by length so "PAPEL RESPALDO" matches before "PAPEL"
baseMap.sort((a, b) => b.length - a.length);

// 2. Parse PDF items
const raw = fs.readFileSync('extracted_pdf_text.txt', 'utf8');
let tokens = raw.split(/\s+/);
let items = [];
let currentCategory = 'General';
let currentQty = null;
let currentString = [];

const finalizeItem = () => {
    if (currentQty !== null && currentString.length > 0) {
        items.push({
            categoria: currentCategory,
            nombre: currentString.join(" ").trim()
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

function findBaseName(fullName) {
    let upperF = fullName.toUpperCase().replace(/\s+/g, ' ');
    // special replacements it suffered
    if (upperF.includes('T-')) upperF = upperF.replace(/T-/g, 'TINTA ').replace(/ T-/g, ' TINTA ');
    for (let base of baseMap) {
        if (upperF.includes(base.toUpperCase())) {
            return base;
        }
    }
    return "Desconocido";
}

let outCsv = "Producto Maestro,Medida / Ancho,Gramaje / Peso,Nombre Item PDF Original\n";

let regexMedidas = [
    // 1,83 / 1.83 / 1,83M / 1,83 Mts
    /\b(\d+[,.]\d+)\s*(mts|m|M)?\b/g,
    // 60cm / 50m / 58m / 100m
    /\b(\d+)\s*(cm|m|M|mm|mts)\b/g,
    // 80x200 / 120X100
    /\b(\d+)\s*[xX]\s*(\d+)(?:\s*(cm|m|M|mm))?\b/g
];

let regexGramajes = [
    // 20g / 52g / 90gsm
    /\b(\d+)\s*(g|gsm|gr)\b/gi,
    // (20g) / (52g) (Parenthesis included)
    /\(\s*(\d+)\s*(g|gsm|gr)\s*\)/gi
];

let extractedItems = new Set();

for (let item of items) {
    let name = item.nombre;
    
    let baseAssoc = findBaseName(name);

    let foundMedidas = [];
    let foundGramajes = [];

    // Parse meds
    for(let rm of regexMedidas) {
        let match;
        // reset regex index
        rm.lastIndex = 0;
        while ((match = rm.exec(name)) !== null) {
            foundMedidas.push(match[0].replace(/[()]/g, '').trim());
        }
    }
    
    // Parse grams
    for(let rg of regexGramajes) {
        let match;
        rg.lastIndex = 0;
        while ((match = rg.exec(name)) !== null) {
            foundGramajes.push(match[0].replace(/[()]/g, '').trim());
        }
    }

    // Dedup
    let mm = [...new Set(foundMedidas)].join(" | ");
    let gg = [...new Set(foundGramajes)].join(" | ");

    if (mm || gg) {
        let line = `"${baseAssoc}","${mm}","${gg}","${name}"`;
        if(!extractedItems.has(line)) {
            extractedItems.add(line);
            outCsv += line + "\n";
        }
    }
}

fs.writeFileSync('medidas_gramajes.csv', outCsv);
console.log("Extracted measures and grammages to as medidas_gramajes.csv");
