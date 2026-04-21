const fs = require('fs');

// We know what the families are from the PDF extraction
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
    if (t.match(/^-+$/)) {
        continue;
    }
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

const mapColor = {
    'NEGRO': 'Color', 'BLANCO': 'Color', 'AZUL FRANCIA': 'Color', 'AZUL MARINO': 'Color', 
    'ROJO': 'Color', 'AMARILLO': 'Color', 'VERDE': 'Color', 'CYAN': 'Color', 'MAGENTA': 'Color'
};
const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '6', '8', '10', '12', '14', '16'];

let baseProducts = [];

items.forEach(item => {
    let name = item.nombre;
    let base = name;
    
    // T- fix
    if (base.toUpperCase().startsWith('T-') || base.toUpperCase().includes(' T-')) {
        base = base.replace(/\bT-/gi, 'TINTA ').replace(/ T-/gi, ' TINTA ');
    }
    if (base.toUpperCase().includes(' T -') || base.toUpperCase().includes(' T ')) {
        if (item.categoria === 'TINTAS') {
            base = base.replace(/\bT\s?-?\s?\b/gi, 'TINTA ');
        }
    }

    let parts = base.split(" ");
    let last = parts[parts.length - 1];
    if (sizes.includes(last)) {
        parts.pop();
        base = parts.join(" ");
    }
    
    for (const color of Object.keys(mapColor)) {
        if (base.includes(color)) {
            base = base.replace(new RegExp(" " + color + "$"), "").replace(new RegExp(color + " "), "").replace(new RegExp(color), "").trim();
        }
    }

    if (item.categoria === 'TINTAS') {
        let regexCMYK = /\b(C|M|Y|K|BLANCA)\b/g;
        let match;
        while ((match = regexCMYK.exec(name)) !== null) {
            base = base.replace(new RegExp("\\b" + match[1] + "\\b"), "").trim();
        }
    }
    
    let matchIdx = base.search(/[\d\(]/);
    if (matchIdx > 0) base = base.substring(0, matchIdx);
    base = base.replace(/\s[Xx]$/, '');
    base = base.replace(/[\-\/:,]+$/, '').replace(/\s+/g, ' ').trim();
    
    // Fallback units per user instructions basically
    let unit = "";
    let baseUpper = base.toUpperCase();

    if (baseUpper.includes('FILM') || baseUpper.includes('PAPEL')) {
         unit = "lts";
    } else if (baseUpper.includes('POLIAMIDA')) {
         unit = "kg";
    } else if (
         baseUpper.includes('FRONTLIGTH') ||
         baseUpper.includes('LONA') ||
         baseUpper.includes('VINILO') ||
         baseUpper.includes('BANNER') ||
         baseUpper.includes('CANVAS') ||
         baseUpper.includes('TPU')
    ) {
         unit = "mts";
    } else if (item.categoria === 'TINTAS' || baseUpper.includes('TINTA') || baseUpper.includes('LIQUIDO') || baseUpper.includes('BARNIZ')) {
         unit = "lts";
    }
    
    baseProducts.push({
        BaseName: base,
        OriginalName: item.nombre,
        Category: item.categoria,
        Qty: item.cantidad,
        Unit: unit
    });
});

// Since the user might have some manual units (like kg for DRY, uds for MEDIAS), let's parse their file to extract them
let csvContent = fs.readFileSync('productos_a_cargar_final.csv', 'utf8');

// Use a dictionary to match "original name segment" to "User's metric unit"
let forceUnits = {
    'DRY': 'kg',
    'ADIS': 'kg',
    'ADIS ELASTIZADO': 'kg',
    'BANDERA COMÚN': 'kg',
    'BANDERA FINA': 'kg',
    'BANDERA MESH': 'kg',
    'DEPORTIVO': 'kg',
    'DRY LISO': 'kg',
    'DRY POROSO': 'kg',
    'FORRO SATEN': 'kg',
    'HEXAGONAL': 'kg',
    'JACQUARD': 'kg',
    'MYKONOS': 'kg',
    'PANAMA': 'kg',
    'DRY PRO': 'kg',
    'POLAR': 'kg',
    'LYCRA': 'kg',
    'TOALLA': 'kg',
    'NÁUTICA': 'kg',
    'JACQUARD ELITE': 'kg',
    'JACQUARD SUPREME': 'kg',
    'JACQUARD CHARRUA': 'kg',
    'RIB JACQUARD': 'kg',
    'SCUBA': 'kg',
    'DRY EXCLUSIVE': 'kg',
    'INTERLOCK': 'kg',
    'modal': 'kg',
    'PIQUE': 'kg',
    'SUPLEX': 'kg',
    'Jacquard City': 'kg',
    'Dry Milan': 'kg',
    'Microfibra RV Waterproof': 'kg',
    'Microfibra Short': 'kg',
    'INTERLOCK Grueso': 'kg',
    'DELTA': 'kg',
    'GRID': 'kg',
    'NAGASAKI': 'kg',
    'CAJA BANDERAS': 'uds',
    'MEDIA ANTIDESLIZANTE NEGRA': 'uds',
    'MEDIA ANTIDESLIZANTE': 'uds',
    'CAÑA': 'uds',
    'SHORT': 'uds',
    'MAQUINA PATILLERA': 'uds',
    'Estructuras Roll Up Fuerte': 'uds'
};


let outCsv = "Familia,Producto Maestro (Nombre),Unidad de Medida,Ejemplo Item Completo\n";
let uniqueBases = new Set();
baseProducts.forEach(b => {
    if(!uniqueBases.has(b.BaseName.toLowerCase())) {
        uniqueBases.add(b.BaseName.toLowerCase());
        
        let unitToUse = b.Unit;
        if (forceUnits[b.BaseName]) {
            unitToUse = forceUnits[b.BaseName];
        } else if (forceUnits[b.BaseName.replace(/"/g, '')]) {
            unitToUse = forceUnits[b.BaseName.replace(/"/g, '')];
        }
        
        // Manual override for exact user specs
        if (b.BaseName === "PAPEL RESPALDO" || b.BaseName === "PAPEL" || b.BaseName === "PAPEL SUBL") {
             unitToUse = "mts";
        }
        
        let ogName = b.OriginalName;
        // The user also requested replacing T- here too
        if (ogName.toUpperCase().includes('T-')) ogName = ogName.replace(/T-/g, 'TINTA ').replace(/ T-/g, ' TINTA ');
        
        outCsv += `"${b.Category}","${b.BaseName}","${unitToUse}", "${ogName}"\n`;
    }
});

fs.writeFileSync('productos_a_cargar_final.csv', outCsv);
console.log("Completely fresh mapping applied!");
