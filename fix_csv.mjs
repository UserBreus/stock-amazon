import fs from 'fs';

let content = fs.readFileSync('pre_carga_variantes.csv', 'utf8').split('\n');

let headers = content[0];
let lines = content.slice(1).filter(l => l.trim() !== '');

let masterFamilies = {};
let pcf = fs.readFileSync('productos_a_cargar_final.csv', 'utf8').split('\n');
for (let i = 1; i < pcf.length; i++) {
    let parts = pcf[i].split('",');
    if (parts.length >= 2) {
        let familia = parts[0].replace(/"/g, '').trim();
        let prod = parts[1].replace(/"/g, '').trim();
        masterFamilies[prod.toUpperCase()] = familia;
    }
}
// Add explicit fallbacks mapped by user
masterFamilies["FRONTLIGHT"] = "LONAS, VINILOS Y OTROS";
masterFamilies["FRONTLIGTH"] = "LONAS, VINILOS Y OTROS";
masterFamilies["FRONTLIGTH MAT"] = "LONAS, VINILOS Y OTROS";
masterFamilies["FRONTLIGTH BRI"] = "LONAS, VINILOS Y OTROS";
masterFamilies["VINILO"] = "LONAS, VINILOS Y OTROS";
masterFamilies["BANNER"] = "LONAS, VINILOS Y OTROS";

let out = [headers];

for (let line of lines) {
    // Parse CSV line properly
    let parts = [];
    let cur = '';
    let inQuotes = false;
    for(let i=0; i<line.length; i++) {
        if(line[i]==='"' && (i===0 || line[i-1]!=='\\')) {
            inQuotes = !inQuotes;
        } else if(line[i]===',' && !inQuotes) {
            parts.push(cur);
            cur = '';
        } else {
            cur += line[i];
        }
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

    // --- APPLY ALGORITHMIC FIXES ---

    // 1. TINTAS RULES
    // Parse "T- ", "T-" into "TINTA "
    nom = nom.replace(/\bT-\s*/gi, "TINTA ");
    nom = nom.replace(/\bT\s+-\s*/gi, "TINTA ");
    nom = nom.replace(/\bMIMAKI T-\s*/gi, "TINTA MIMAKI ");
    nom = nom.replace(/\bECO T\b/gi, "TINTA ECO");
    
    if (pm.toUpperCase().includes('TINTA') || nom.toUpperCase().includes('TINTA')) {
        fm = "TINTAS";
    }

    // Colors mapping for inks
    const colRegexMap = [
        { regex: /\bC\b(?!AÑA)/gi, color: "CIAN" }, 
        { regex: /\bM\b/gi, color: "MAGENTA" },
        { regex: /\bY\b/gi, color: "YELLOW" },
        { regex: /\bK\b/gi, color: "BLACK" },
        { regex: /\bCYAN\b/gi, color: "CIAN" },
        { regex: /\bBLANCA\b/gi, color: "BLANCO" }
    ];
    
    if (fm === 'TINTAS') {
        for (let rule of colRegexMap) {
            if (rule.regex.test(nom)) {
                if(!col) col = rule.color;
                nom = nom.replace(rule.regex, "").trim();
            }
        }
    }

    // ECO S -> ECOSOLVENTE
    nom = nom.replace(/\bECO S\b/gi, "ECOSOLVENTE");
    
    // F- -> UV
    nom = nom.replace(/\bF-\s*UV\b/gi, "UV");

    // UV -TEXTIES -> UV TEXTIL
    nom = nom.replace(/\bUV\s*-TEXTIL-SUPER SOFT\b/gi, "UV TEXTIL SUPER SOFT");

    // "el nombre no puede tener valor numerico aqui." -> Strip out numbers and measures from MASTER name and PDF variant name.
    nom = nom.replace(/\b\d+,\d+\s*(m|mts|cm)?\b/gi, '');
    nom = nom.replace(/\b\d+\s*(m|mts|cm|g|gsm|gr|mm)\b/gi, '');
    nom = nom.replace(/\b\d+x\d+\b/gi, ''); // e.g. 80X200
    nom = nom.replace(/\(\s*\)/g, '');
    nom = nom.replace(/\bX\d+\b/gi, ''); // X4, X2
    nom = nom.replace(/\b\d+\b/g, ''); // Any lone digits
    
    // Cleanup noise
    nom = nom.replace(/PRUEBA 0 0/gi, '');
    nom = nom.replace(/PRUEBA/gi, '');
    nom = nom.replace(/  +/g, ' ').trim();
    // remove trailing hyphens
    nom = nom.replace(/-+$/ig, '').trim();
    // remove standalone '-'
    nom = nom.replace(/\s+-\s+/g, ' ').replace(/^-+|-+$/g, '').trim();

    pm = nom; // Master product should essentially just be the clean name without measures

    // Enforce Familia matching based on clean name
    let upperPm = pm.toUpperCase();
    if(upperPm.includes("FRONTLIG") || upperPm.includes("VINILO") || upperPm.includes("BANNER") || upperPm.includes("CANVAS") || upperPm.includes("BACK PET")) {
        fm = "LONAS, VINILOS Y OTROS";
    } else if (upperPm.includes("PAPEL") && !upperPm.includes("FOTO")) {
        fm = "PAPELES";
    }

    // Force fallback families from master file
    for (const [key, value] of Object.entries(masterFamilies)) {
         if (upperPm.includes(key)) {
             fm = value;
             break;
         }
    }

    // If 'General' or 'DESCONOCIDO' but it's a TINTA
    if (upperPm.includes("TINTA")) fm = "TINTAS";
    
    // Remove "Directa" from colors, fix strange spacing
    if(col === "C") col = "CIAN";
    if(col === "M") col = "MAGENTA";
    if(col === "Y") col = "YELLOW";
    if(col === "K") col = "BLACK";

    // Write row back out
    out.push(`"${fm}","${pm}","${nom}","${an}","${gr}","${rev}","${aca}","${col}"`);
}

// Deduplicate
let finalSet = new Set();
let cleanCsv = "";
for(let line of out) {
    if(!finalSet.has(line)) {
         finalSet.add(line);
         cleanCsv += line + "\\n";
    }
}

fs.writeFileSync('pre_carga_variantes_arreglado.csv', cleanCsv.replace(/\\n/g, '\n'));
console.log("Fixed CSV has been saved to pre_carga_variantes_arreglado.csv");
