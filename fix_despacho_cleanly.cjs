const fs = require('fs');

let code = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

// 1. Delete the "Navegación Modular" block
code = code.replace(
  /\{\/\* Navegación Modular \(Motor Integral\) \*\/\}.*?<\/div>/s,
  ''
);

// 2. Remove the "mode === 'lote' && (" wrapper and its closing braces.
// Actually, it's easier to just remove `{mode === 'lote' && (` and the accompanying `)}` manually
code = code.replace(/\{\s*\/\* MODO CARRITO LOTE \*\/\}\s*\{mode === 'lote' && \(/, '{/* MODO CARRITO LOTE */}');

// 3. Remove the mode === 'lote' closing `)}` and  `mode === 'solicitudes'` and `mode === 'historial'`
code = code.replace(
  /\)\}\s*\{\/\* SOLICITUDES \*\/\}[\s\S]*?\{\/\* HISTORIAL Y ANALÍTICA \*\/\}[\s\S]*?(?=<\/div>\s*\{isCameraOpen)/,
  ''
);

// Also remove `historial` from state just to be clean
code = code.replace(
  `const [mode, setMode] = useState<'lote' | 'solicitudes' | 'historial'>(initialMode);`,
  `const [mode, setMode] = useState<'lote' | 'solicitudes' | 'historial'>('lote');`
);

fs.writeFileSync('src/components/DespachoEgresos.tsx', code);
console.log('Update done!');
