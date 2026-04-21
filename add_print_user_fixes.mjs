import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. Fix the QR code brightness (remove brightness-0 so it doesn't go solid black)
txt = txt.replace('className="w-48 h-48 object-contain brightness-0 my-4"', 'className="w-48 h-48 object-contain my-4"');

// 2. Fix the 10x15 box text overflow and the 4x4
txt = txt.replace('<div className="w-8 h-12 rounded border-2 border-current flex items-center justify-center">10x15</div>', '<div className="w-10 h-14 rounded border-[3px] border-current flex items-center justify-center text-[9px] font-black tracking-tighter">10x15</div>');
txt = txt.replace('<div className="w-8 h-8 rounded border-2 border-current flex items-center justify-center">4x4</div>', '<div className="w-10 h-10 rounded border-[3px] border-current flex items-center justify-center text-[10px] font-black">4x4</div>');

// 3. Make the label text prefer Order ID if applicable
const oldLabelText = `<p className="m-0 mt-4 text-xs font-mono text-black font-bold tracking-widest">{lbl.codigo_barras}</p>`;
const newLabelText = `<p className="m-0 mt-4 text-sm font-mono text-black font-black tracking-widest">
                {lbl.codigo_barras.includes('-OC') ? 'ORDEN: OC-' + lbl.codigo_barras.split('-OC')[1].split('-')[0].toUpperCase() : lbl.codigo_barras}
              </p>
              {lbl.codigo_barras.includes('-OC') && <p className="m-0 mt-1 text-[8px] text-black font-mono tracking-widest opacity-50">{lbl.codigo_barras}</p>}`;

txt = txt.replace(oldLabelText, newLabelText);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("InventarioGerencial.tsx 3 fixes applied.");
