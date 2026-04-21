import fs from 'fs';

// Lee los ítems extraidos del PDF (podemos usar productos_a_cargar_final.csv para la lista maestra si queremos)
// Usaremos la extracción anterior de items raw del PDF para tener todos los sub-items con sus combinaciones
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
            nombre: currentString.join(" ").trim(),
            qty: currentQty
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

let extractedData = new Set();
let outCsv = "Producto,Ancho,Gramaje,Reverso,Acabado,Nombre Original\n";

// Patrones avanzados
for (let item of items) {
    let originalName = item.nombre;
    let name = originalName;

    // 1. Gramaje
    let gramaje = "";
    let matchG = /\b(\d+)\s*(g|gsm|gr)\b/i.exec(name);
    if (!matchG) {
        matchG = /\(\s*(\d+)\s*(g|gsm|gr)\s*\)/i.exec(name);
    }
    if (matchG) {
        gramaje = matchG[1]; // solo numero
        // remove gramaje info from string to avoid confusing width
        name = name.replace(matchG[0], ""); 
    }

    // 2. Reverso
    let reverso = "";
    let matchR = /(?:\(|\b)(?:Reverso\s+|R\/)([a-zA-Z]+)(?:\)|\b)/i.exec(name);
    if (matchR) {
        reverso = matchR[1].toUpperCase();
        name = name.replace(matchR[0], "");
    }

    // 3. Acabado
    let acabado = "";
    if (/\b(?:BRI|BRILLO|Brillante)\b/i.test(name)) {
        acabado = "BRILLO";
        name = name.replace(/\b(?:BRI|BRILLO|Brillante)\b/ig, "");
    } else if (/\b(?:MAT|MATE)\b/i.test(name)) {
        acabado = "MATE";
        name = name.replace(/\b(?:MAT|MATE)\b/ig, "");
    } else if (/\b(?:SEMIBRILLO)\b/i.test(name)) {
        acabado = "SEMIBRILLO";
        name = name.replace(/\b(?:SEMIBRILLO)\b/ig, "");
    }

    // 4. Medida / Ancho
    let ancho = "";
    // Buscar medidas formato "1,83" o "3.20" o "1,52"
    let matchWidth = /\b(\d+[,.]\d+)\b/i.exec(name);
    if (matchWidth) {
        ancho = matchWidth[1].replace('.', ',');
        name = name.replace(matchWidth[0], "");
    } else {
        // Tratar de buscar cm o mm como "60cm" o "914mm"
        let matchW2 = /\b(\d+)\s*(cm|mm)\b/i.exec(name);
        if (matchW2) {
            ancho = matchW2[1] + matchW2[2];
            name = name.replace(matchW2[0], "");
        } else {
            // "80X200"
            let matchW3 = /\b(\d+\s*[xX]\s*\d+)\b/i.exec(name);
            if (matchW3) {
                ancho = matchW3[1].toUpperCase();
                name = name.replace(matchW3[0], "");
            }
        }
    }

    // Remover basuras comunes ignoradas ("M", "Mts", "x50m")
    name = name.replace(/\(\d+\s*Mts?\)/ig, ""); // ej (1000 Mts)
    name = name.replace(/\bx\s*\d+\s*m\b/ig, ""); // ej x50m
    name = name.replace(/\bmts?\b/ig, "");
    name = name.replace(/\bm\b/ig, ""); // suelta
    
    // Limpieza producto base
    let producto = name;
    if (producto.toUpperCase().startsWith('T-') || producto.toUpperCase().includes(' T-')) {
        producto = producto.replace(/\bT-/gi, 'TINTA ').replace(/ T-/gi, ' TINTA ');
    }
    producto = producto.replace(/[\(\)\[\]]/g, "").replace(/\s+/g, ' ').trim();

    // Solo exportamos lo que tenga un atributo extraido o que limpie bien
    if (ancho || gramaje || reverso || acabado) {
        let line = `"${producto}","${ancho}","${gramaje}","${reverso}","${acabado}","${originalName}"`;
        if(!extractedData.has(line)) {
            extractedData.add(line);
            outCsv += line + "\n";
        }
    }
}

fs.writeFileSync('medidas_gramajes_avanzado.csv', outCsv);
console.log("Generado medidas_gramajes_avanzado.csv");
