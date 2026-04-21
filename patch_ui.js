import fs from 'fs';
import path from 'path';

const file = path.join(process.cwd(), 'src/pages/InventarioGerencial.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!content.includes('RecepcionAuditoria')) {
  content = content.replace(
    "import { ModalSelector } from '../components/ui/ModalSelector';",
    "import { ModalSelector } from '../components/ui/ModalSelector';\nimport { RecepcionAuditoria } from '../components/RecepcionAuditoria';"
  );
}

// 2. Change activeTab init
content = content.replace(
  "useState<'stock' | 'escaner' | 'catalogo'>('stock')",
  "useState<'stock' | 'escaner' | 'catalogo' | 'recepcion'>('stock')"
);

// 3. Change Tabs array
content = content.replace(
  `        {[
          { id: 'stock', label: 'Lista de Artículos' },
          { id: 'escaner', label: 'Descargo por Lector' },
          { id: 'catalogo', label: 'Familias de Productos' }
        ]`,
  `        {[
          { id: 'stock', label: 'Lista de Artículos' },
          { id: 'recepcion', label: 'Ingreso de Stock (WMS)' }
        ]`
);

// 4. Inject Recepcion block
if (!content.includes('activeTab === \'recepcion\'')) {
  content = content.replace(
    "{activeTab === 'escaner' && (",
    `{activeTab === 'recepcion' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <RecepcionAuditoria onRecargaRequerida={fetchData} />
        </motion.div>
      )}

      {activeTab === 'escaner_legacy' as any && (`
  );
}

// 5. Hide catalogo
content = content.replace(
  "{activeTab === 'catalogo' && (",
  "{activeTab === 'catalogo_legacy' as any && ("
);

fs.writeFileSync(file, content);
console.log('Patched');
