import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// 1. Add manualCart state
if (!txt.includes('const [manualCart, setManualCart]')) {
    txt = txt.replace(
        "const [labelCatalog, setLabelCatalog] = useState<any[]>([]);",
        "const [labelCatalog, setLabelCatalog] = useState<any[]>([]);\n  const [manualCart, setManualCart] = useState<any[]>([]);"
    );
}

// 2. Add onCartChange to RecepcionAuditoria
txt = txt.replace(
    '<RecepcionAuditoria onRecargaRequerida={fetchData} />',
    '<RecepcionAuditoria onRecargaRequerida={fetchData} onCartChange={setManualCart} />'
);

// 3. Update Recientes panel to map manualCart instead of recentMovements
const startRec = txt.indexOf('{/* PANEL INGRESOS RECIENTES */}');
const endRec = txt.indexOf('{/* PANEL ÓRDENES DE COMPRA */}');

const newRecPanel = `{/* PANEL INGRESOS RECIENTES */}
          {labelTab === 'recientes' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center">Artículos agregados en Ingreso a Mano (Esperando a ser guardados)</p>
              <div className="max-h-[40vh] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                {manualCart.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-center">
                    <Zap className="w-10 h-10 mb-3 opacity-30" />
                    <p className="font-bold text-sm">La lista de Ingreso a Mano está vacía</p>
                    <p className="text-xs mt-1 max-w-xs opacity-70">Cierra esta ventana, ve a la pestaña "Ingresar a Mano" y agrega productos para imprimirlos desde aquí de antemano.</p>
                  </div>
                )}
                {manualCart.map(rec => (
                  <div key={rec.variante_id} className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-3 flex items-center gap-3 hover:border-amber-400 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-amber-900 dark:text-amber-100 truncate">{rec.descripcion}</p>
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-mono mt-0.5">Pendientes de ingreso: {rec.Auditada} {rec.unidad_base}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        type="number" min="1" defaultValue={rec.Auditada > 0 ? rec.Auditada : 1}
                        id={\`qty-rec-\${rec.variante_id}\`}
                        className="input-nexus w-16 text-center py-1 font-bold text-sm border-amber-200"
                        onClick={e => e.stopPropagation()}
                      />
                      <button
                        type="button"
                        onClick={() => addToPrintCart({ variante_id: rec.variante_id, nombre_completo: rec.descripcion, producto_nombre: rec.descripcion, sku: 'PROD', numero_etiquetas: parseInt((document.getElementById(\`qty-rec-\${rec.variante_id}\`) as HTMLInputElement)?.value || '1') })}
                        className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          `;

txt = txt.substring(0, startRec) + newRecPanel + txt.substring(endRec);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log('manual logic applied');
