const fs = require('fs');
const file = 'src/components/DespachoEgresos.tsx';
let c = fs.readFileSync(file, 'utf8');

const originalStart = '<div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center shadow-sm">';

let startIndex = c.indexOf(originalStart);
if(startIndex !== -1) {
    let nextDivEnd = c.indexOf('</div>', c.indexOf('</div>', c.indexOf('</div>', startIndex) + 1) + 1);
    // Find the actual end of that item which is </div> inside cart.map
    // Just replace the entire chunk between cart.map((item, idx) => ( ... ))
    
    // Instead, I'll match everything starting from 'cart.map((item, idx) => (' and ending at '))}</div>'
    
    let mapStart = c.indexOf('cart.map((item, idx) => (');
    let mapEndStr = '))}\r\n                              </div>';
    let mapEnd = c.indexOf(mapEndStr);
    if(mapEnd === -1) mapEndStr = '))}\n                              </div>';
    mapEnd = c.indexOf(mapEndStr);
    
    if (mapStart !== -1 && mapEnd !== -1) {
        
        const newMapBlock = `cart.map((item, idx) => (
                                     <div key={idx} className={cn("border p-4 rounded-xl shadow-sm transition-all", item.cantidad_a_extraer > item.cantidad_actual ? "bg-rose-50 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800")}>
                                         <div className="flex items-center">
                                             <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2"><h4 className="font-black truncate">{item.producto_nombre}</h4><span className="bg-slate-100 dark:bg-slate-800 px-2 rounded text-[10px] font-bold">{item.nombre_variante}</span></div>
                                                <p className="text-xs font-mono text-indigo-500">{item.codigo_barras} (Disp: {item.cantidad_actual})</p>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                <input type="number" step="0.01" value={item.cantidad_a_extraer} onChange={e=>{
                                                    const v = Number(e.target.value);
                                                    setCart(cart.map(c=>c.id===item.id?{...c,cantidad_a_extraer:v}:c));
                                                }} className={cn("w-20 text-center font-black bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg py-2", item.cantidad_a_extraer > item.cantidad_actual ? "text-rose-600" : "text-indigo-600")} />
                                                <button onClick={() => setCart(cart.filter(c=>c.id!==item.id))} className="p-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 className="w-4 h-4"/></button>
                                             </div>
                                         </div>
                                         {item.cantidad_a_extraer > item.cantidad_actual && (
                                            <p className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-4 pt-3 border-t border-rose-200 dark:border-rose-900/50 flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4"/> Ese no se puede dar de baja por que supera el stock disponible por {(item.cantidad_a_extraer - item.cantidad_actual).toFixed(2)} uds. No se puede transferir.
                                            </p>
                                         )}
                                     </div>`;
                                     
        c = c.substring(0, mapStart) + newMapBlock + c.substring(mapEnd);
        fs.writeFileSync(file, c);
        console.log("REPLACED MAP CORRECTLY");
    } else {
        console.log("no map bounds");
    }
} else {
    console.log("no start index");
}
