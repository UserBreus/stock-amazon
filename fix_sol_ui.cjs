const fs = require('fs');
let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

// The list to replace is from line 600 to 684 roughly
// Find: <div className="space-y-4">
const startMarker = '<div className="space-y-4">';
const startIndex = code.indexOf(startMarker, code.indexOf('solicitudesFiltradas.length === 0'));

let endIndex = -1;
if (startIndex !== -1) {
    // Look for the end of the mapping which looks like
    //               ))}
    //             </div>
    //           )}
    //         </motion.div>
    //       )}
    const endStr = '              ))}\r\n            </div>\r\n          )}\r\n        </motion.div>\r\n      )}\r\n\r\n      {/* PESTAÑA INVENTARIO */}';
    endIndex = code.indexOf(endStr);
    if(endIndex === -1) {
        // use fallback index approach
        endIndex = code.indexOf('</motion.div>', startIndex);
        // Find the `</div>` that matches `<div className="space-y-4">`
    }
}

console.log("Start Index:", startIndex);
console.log("End Index (approx):", endIndex);
if (startIndex !== -1 && endIndex !== -1) {
    const originalSection = code.substring(startIndex, endIndex);
    console.log("Section to replace starts with:\n", originalSection.substring(0, 150));
    console.log("\nSection to replace ends with:\n", originalSection.substring(originalSection.length - 150));

    const replacement = `<div className="space-y-4">
              {solicitudesFiltradas.map(sol => (
                <div 
                  key={sol.id} 
                  onClick={() => openSolModal(sol)}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-700 cursor-pointer transition-all overflow-hidden group"
                >
                  <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                        <ClipboardList className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-mono font-black text-sm text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{sol.numeracion}</span>
                          <span className="text-[10px] font-black tracking-widest text-white bg-amber-500 px-2 py-1 rounded-full uppercase shadow-sm">PENDIENTE</span>
                        </div>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-emerald-500" />
                          Destino: {sol.sector_nombre}
                        </h4>
                        <p className="text-sm text-slate-500 mt-0.5">{new Date(sol.fecha_creacion).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 mr-2">
                       <span className="text-sm font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-4 py-2 rounded-xl group-hover:bg-amber-100 dark:group-hover:bg-amber-900/40 transition-colors">Revisar Orden →</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        `;

    code = code.substring(0, startIndex) + replacement + code.substring(endIndex);

    fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
    console.log("Success! File replaced.");
}
