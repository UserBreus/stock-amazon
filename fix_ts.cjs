const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

if (!code.includes('CheckCircle,')) {
    code = code.replace(
        'ArrowRightLeft, ArrowUpFromLine, LayoutDashboard, History, ScanBarcode, ArrowLeft',
        'ArrowRightLeft, ArrowUpFromLine, LayoutDashboard, History, ScanBarcode, ArrowLeft, CheckCircle, PackageCheck'
    );
}

if (!code.includes('import { printRemito }')) {
    code = code.replace(
        `import { executeAWSQuery } from '../lib/aws-client';`,
        `import { executeAWSQuery } from '../lib/aws-client';\nimport { printRemito } from '../lib/printRemito';`
    );
}

if (!code.includes('selectedHistorialRemito')) {
    code = code.replace(
        `const [globalHistorial, setGlobalHistorial] = useState<any[]>([]);`,
        `const [globalHistorial, setGlobalHistorial] = useState<any[]>([]);\n  const [selectedHistorialRemito, setSelectedHistorialRemito] = useState<any>(null);`
    );
}

fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
