const fs = require('fs');
let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

// 1. Remove duplicate imports
const importLine = "import { GestionCostosCero } from '../components/gestion/GestionCostosCero';";
const firstImport = c.indexOf(importLine);
if (firstImport !== -1) {
    let restOfFile = c.substring(firstImport + importLine.length);
    restOfFile = restOfFile.replace(new RegExp(importLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), '');
    c = c.substring(0, firstImport + importLine.length) + restOfFile;
}

// 2. Remove duplicate button
const btnStartTag = `<button \n             draggable={isEditMode}\n             onDragStart={(e) => handleDragStart(e, 'btn_sys_costos_cero')}`;
const firstBtn = c.indexOf(btnStartTag);
if (firstBtn !== -1) {
    let btnEnd = c.indexOf('</button>', firstBtn) + 9;
    let restOfFile = c.substring(btnEnd);
    
    // Find second button if exists
    let secondBtn = restOfFile.indexOf(btnStartTag);
    while (secondBtn !== -1) {
        let secondBtnEnd = restOfFile.indexOf('</button>', secondBtn) + 9;
        restOfFile = restOfFile.substring(0, secondBtn) + restOfFile.substring(secondBtnEnd);
        secondBtn = restOfFile.indexOf(btnStartTag);
    }
    c = c.substring(0, btnEnd) + restOfFile;
}

// 3. Remove duplicate tab content
const tabStartTag = `{activeTab === 'costos_cero' && (`;
const firstTab = c.indexOf(tabStartTag);
if (firstTab !== -1) {
    let tabEnd = c.indexOf(')}', firstTab) + 2;
    let restOfFile = c.substring(tabEnd);
    
    // Find second tab if exists
    let secondTab = restOfFile.indexOf(tabStartTag);
    while (secondTab !== -1) {
        let secondTabEnd = restOfFile.indexOf(')}', secondTab) + 2;
        restOfFile = restOfFile.substring(0, secondTab) + restOfFile.substring(secondTabEnd);
        secondTab = restOfFile.indexOf(tabStartTag);
    }
    c = c.substring(0, tabEnd) + restOfFile;
}

// Clean up extra empty lines
c = c.replace(/\n\s*\n\s*\n/g, '\n\n');

fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
console.log("Deduplicado con éxito");
