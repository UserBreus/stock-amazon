const fs = require('fs');

const raw = fs.readFileSync('extracted_pdf_text.txt', 'utf8');

// The layout seems to be: {Number} {Item Name}
// Sometimes item name contains numbers like "1,80" or "100m".
// So we want to split by " \d+ " where that number is the inventory count.

let tokens = raw.split(/\s+/);
let items = [];
let currentIndex = 0;

let currentCategory = 'General';

let currentQty = null;
let currentString = [];

const finalizeItem = () => {
    if (currentQty !== null && currentString.length > 0) {
        items.push({
            categoria: currentCategory,
            cantidad: currentQty,
            nombre: currentString.join(" ").trim()
        });
    }
    currentString = [];
};

for (let i = 0; i < tokens.length; i++) {
    let t = tokens[i];
    
    // Check if category marker
    if (t.startsWith('**') && t.endsWith('**')) {
        finalizeItem();
        currentCategory = t.replace(/\*\*/g, '').trim();
        continue;
    }
    
    // Ignore dashes
    if (t.match(/^-+$/)) {
        continue;
    }
    
    // If it's a pure integer, it might be a quantity that starts an item
    if (/^\d+$/.test(t)) {
        // Is it a standalone size like "6", "8", "10" for short? 
        // If currentString has "SHORT", "NEGRO", then the number could be a size, not a new item quantity.
        // Wait, the quantity always comes FIRST. "0 SHORT NEGRO 6 0 SHORT NEGRO 8" -> "0" "SHORT" "NEGRO" "6" "0" "SHORT"
        // If we see a number, how do we know if it's the quantity of the NEXT item, or the size of the CURRENT item?
        // Well, the sequence would be [Number] [Word] ... [Number] [Number] [Word] ...
        // If the NEXT token is a word, then the current token is likely a Quantity.
        
        let nextIsWord = false;
        if (i + 1 < tokens.length && /^[a-zA-Z]/.test(tokens[i+1])) {
            nextIsWord = true;
        }
        
        if (nextIsWord) {
            finalizeItem();
            currentQty = parseInt(t);
        } else {
            // It's probably part of the name (like a size)
            if (currentQty !== null) {
                currentString.push(t);
            }
        }
    } else {
        if (currentQty !== null) {
            currentString.push(t);
        }
    }
}
finalizeItem();

// Post-process to extract structures (Size, Color, etc)
// We will separate Base Name and variants.

let baseProducts = [];
let structuresFound = [];

// Helper to push variant
const addStruct = (cat, val) => {
    let exist = structuresFound.find(x => x.categoria === cat && x.valor === val);
    if (!exist) structuresFound.push({categoria: cat, valor: val});
};

const mapColor = {
    'NEGRO': 'Color', 'BLANCO': 'Color', 'AZUL FRANCIA': 'Color', 'AZUL MARINO': 'Color', 
    'ROJO': 'Color', 'AMARILLO': 'Color', 'VERDE': 'Color', 'CYAN': 'Color', 'MAGENTA': 'Color'
};

const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '6', '8', '10', '12', '14', '16'];

items.forEach(item => {
    let name = item.nombre;
    
    // specific rename for T- right away
    if (name.toUpperCase().startsWith('T-') || name.toUpperCase().includes(' T-')) {
        name = name.replace(/\bT-/gi, 'TINTA ').replace(/ T-/gi, ' TINTA ');
    }
    // Also "ECO T -" or "MIMAKI T-" type variations
    if (name.toUpperCase().includes(' T -') || name.toUpperCase().includes(' T ')) {
        // Only if it's in TINTAS to be safe
        if (item.categoria === 'TINTAS') {
            name = name.replace(/\bT\s?-?\s?\b/gi, 'TINTA ');
        }
    }
    
    let base = name;
    
    let parts = name.split(" ");
    
    // Check sizes
    let last = parts[parts.length - 1];
    if (sizes.includes(last)) {
        addStruct('Talle', last);
        parts.pop();
        base = parts.join(" ");
    }
    
    // Check colors
    for (const [color, type] of Object.entries(mapColor)) {
        if (base.includes(color)) {
            addStruct(type, color);
            // Replace color from base name
            base = base.replace(new RegExp(" " + color + "$"), "");
            base = base.replace(new RegExp(color + " "), "");
            base = base.replace(new RegExp(color), "").trim();
        }
    }

    // specific rules for Tintas
    if (item.categoria === 'TINTAS') {
        let regexCMYK = /\b(C|M|Y|K|BLANCA)\b/g;
        let match;
        while ((match = regexCMYK.exec(name)) !== null) {
            addStruct('Color Tinta', match[1]);
            base = base.replace(new RegExp("\\b" + match[1] + "\\b"), "").trim();
        }
    }
    
    // Strip from first number or opening parenthesis backwards
    let matchIdx = base.search(/[\d\(]/);
    if (matchIdx > 0) {
        base = base.substring(0, matchIdx);
    }
    
    // Sometimes it truncates leaving "x" at the end like "Vinilo Brillo x"
    base = base.replace(/\s[Xx]$/, '');
    
    base = base.replace(/[\-\/:,]+$/, '').replace(/\s+/g, ' ').trim();
    
    let baseUpper = base.toUpperCase();
    let unit = "";

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
    } else if (item.categoria === 'TINTAS' || baseUpper.includes('TINTA')) {
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

let outCsv = "Producto Maestro (Nombre),Unidad de Medida,Ejemplo Item Completo\n";
let uniqueBases = new Set();
baseProducts.forEach(b => {
    if(!uniqueBases.has(b.BaseName.toLowerCase())) {
        uniqueBases.add(b.BaseName.toLowerCase());
        outCsv += `"${b.BaseName}","${b.Unit}", "${b.OriginalName}"\n`;
    }
});

fs.writeFileSync('productos_a_cargar_final.csv', outCsv);

let outStruct = "Rasgo (Estructura),Valor\n";
structuresFound.forEach(s => {
    outStruct += `"${s.categoria}","${s.valor}"\n`;
});

fs.writeFileSync('estructuras_registradas.csv', outStruct);

console.log("Files generated: productos_a_cargar.csv and estructuras_registradas.csv");
