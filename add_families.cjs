const fs = require('fs');

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

const mapColor = {
    'NEGRO': 'Color', 'BLANCO': 'Color', 'AZUL FRANCIA': 'Color', 'AZUL MARINO': 'Color', 
    'ROJO': 'Color', 'AMARILLO': 'Color', 'VERDE': 'Color', 'CYAN': 'Color', 'MAGENTA': 'Color'
};

const sizes = ['S', 'M', 'L', 'XL', 'XXL', 'XXXL', '6', '8', '10', '12', '14', '16'];

let baseMap = {};

items.forEach(item => {
    let name = item.nombre;
    if (name.toUpperCase().startsWith('T-') || name.toUpperCase().includes(' T-')) {
        name = name.replace(/\bT-/gi, 'TINTA ').replace(/ T-/gi, ' TINTA ');
    }
    if (name.toUpperCase().includes(' T -') || name.toUpperCase().includes(' T ')) {
        if (item.categoria === 'TINTAS') {
            name = name.replace(/\bT\s?-?\s?\b/gi, 'TINTA ');
        }
    }
    
    let base = name;
    let parts = name.split(" ");
    let last = parts[parts.length - 1];
    if (sizes.includes(last)) {
        parts.pop();
        base = parts.join(" ");
    }
    
    for (const [color, type] of Object.entries(mapColor)) {
        if (base.includes(color)) {
            base = base.replace(new RegExp(" " + color + "$"), "");
            base = base.replace(new RegExp(color + " "), "");
            base = base.replace(new RegExp(color), "").trim();
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
    if (matchIdx > 0) {
        base = base.substring(0, matchIdx);
    }
    base = base.replace(/\s[Xx]$/, '');
    base = base.replace(/[\-\/:,]+$/, '').replace(/\s+/g, ' ').trim();
    
    baseMap[base.toLowerCase()] = item.categoria;
});

let lines = fs.readFileSync('productos_a_cargar_final.csv', 'utf8').split('\n');
let outLines = [];

outLines.push('Familia,' + lines[0]);
for (let i = 1; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    
    // Extact the first column to match
    let firstQuote = line.indexOf('"');
    let secondQuote = line.indexOf('"', firstQuote + 1);
    
    let fam = "Desconocida";
    if (firstQuote !== -1 && secondQuote !== -1) {
        let prodName = line.substring(firstQuote + 1, secondQuote).trim().toLowerCase();
        if (baseMap[prodName]) {
            fam = baseMap[prodName];
        }
    }
    outLines.push(`"${fam}",${line}`);
}

fs.writeFileSync('productos_a_cargar_final.csv', outLines.join('\n'));
console.log("Families added!");
