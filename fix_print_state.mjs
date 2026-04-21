import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const target = `const [printProduct, setPrintProduct] = useState<any | null>(null);`;
const replacement = `const [printProduct, setPrintProduct] = useState<any | null>(null);\n  const [printEtiquetas, setPrintEtiquetas] = useState<any[]>([]);`;

txt = txt.replace(target, replacement);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("InventarioGerencial.tsx printEtiquetas state added!");
