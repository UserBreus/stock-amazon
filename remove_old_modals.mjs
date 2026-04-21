import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const target1Start = txt.indexOf('<ModalSelector\n         title="Seleccionar Artículo a Etiquetar"');
if (target1Start !== -1) {
    const target1End = txt.indexOf('/>', target1Start) + 2;
    txt = txt.substring(0, target1Start) + txt.substring(target1End);
}

const target2Start = txt.indexOf('<ModalSelector\n         title="Destino de la Etiqueta Fija"');
if (target2Start !== -1) {
    const target2End = txt.indexOf('/>', target2Start) + 2;
    txt = txt.substring(0, target2Start) + txt.substring(target2End);
}

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("Removed dead ModalSelectors referencing newLabel");
