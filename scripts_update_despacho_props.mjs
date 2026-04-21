import fs from 'fs';

let c = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

if (!c.includes('interface DespachoEgresosProps')) {
   c = c.replace(
       "export function DespachoEgresos() {",
       "interface DespachoEgresosProps { initialOperationType?: 'traslado' | 'venta_consumo'; initialMode?: 'unitario' | 'lote' | 'solicitudes' | 'historial'; }\nexport function DespachoEgresos({ initialOperationType = 'traslado', initialMode = 'unitario' }: DespachoEgresosProps) {"
   );
   
   c = c.replace(
       "const [mode, setMode] = useState<'unitario' | 'lote' | 'solicitudes' | 'historial'>('unitario');",
       "const [mode, setMode] = useState<'unitario' | 'lote' | 'solicitudes' | 'historial'>(initialMode);"
   );

   c = c.replace(
       "const [operationType, setOperationType] = useState<'traslado' | 'venta_consumo'>('traslado');",
       "const [operationType, setOperationType] = useState<'traslado' | 'venta_consumo'>(initialOperationType);"
   );

   // Update whenever props change so it properly resets when mounting dynamically
   const effStr = `  useEffect(() => {\n    setOperationType(initialOperationType);\n    setMode(initialMode);\n  }, [initialOperationType, initialMode]);\n`;
   
   c = c.replace(
       "useEffect(() => {\n    fetchBaseData();\n  }, []);",
       "useEffect(() => {\n    fetchBaseData();\n  }, []);\n\n" + effStr
   );

   fs.writeFileSync('src/components/DespachoEgresos.tsx', c);
   console.log("DespachoEgresos updated with props.");
}
