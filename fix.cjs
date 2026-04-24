const fs = require('fs');
let s = fs.readFileSync('src/pages/Ingresos.tsx', 'utf8');

if(!s.includes('isHeaderExpanded')) {
    s = s.replace(
        '  // Detalle Compra',
        '  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);\n  // Detalle Compra'
    );
}

const startIndex = s.indexOf('{/* Cabecera Tipo Invoice */}');
const endIndex = s.indexOf('      {/* Modals Globales del Formulario */}');

const newJSX = `{/* Cabecera Tipo Invoice - COLLAPSIBLE */}
         <div className="lg:col-span-8 space-y-5">
            
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
                <div 
                   onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
                   className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm">1</div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 leading-none">Datos del Documento</h3>
                            <p className="text-xs text-slate-400 font-bold mt-1.5 uppercase tracking-widest">
                                {provId ? proveedores.find(p=>p.id===provId)?.nombre + ' \\u2022 ' + (referencia || 'Sin Ref') : 'Requerido para asentar...'}
                            </p>
                        </div>
                    </div>
                </div>

                {isHeaderExpanded && (
                    <motion.div initial={{height:0}} animate={{height:'auto'}} className="border-t border-slate-100 p-6 bg-slate-50/50">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {tipoIngreso === 'compra' && (
                                <>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Proveedor de Origen</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsProvModalOpen(true)}
                                        className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 px-4 py-3.5 rounded-2xl text-left transition-colors shadow-sm"
                                    >
                                        <span className={provId ? "font-bold text-slate-800" : "text-slate-400 font-medium"}>
                                            {provId ? proveedores.find(p=>p.id===provId)?.nombre : "Seleccionar Proveedor..."}
                                        </span>
                                    </button>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Tipo de Comprobante</label>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsTipoModalOpen(true)}
                                        className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-slate-300 px-4 py-3.5 rounded-2xl text-left transition-colors shadow-sm"
                                    >
                                        <span className={tipoFacturaId ? "font-bold text-slate-800" : "text-slate-400 font-medium"}>
                                            {tipoFacturaId ? tiposFactura.find(p=>p.id.toString()===tipoFacturaId)?.nombre : "Documento..."}
                                        </span>
                                    </button>
                                </div>
                                </>
                            )}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">
                                    Nº Referencia / Motivo
                                </label>
                                <input 
                                    type="text"
                                    placeholder={tipoIngreso === 'compra' ? "A-0001-090234" : "Ej: Ajuste semanal"}
                                    className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold uppercase transition-colors focus:border-slate-400 shadow-sm outline-none"
                                    value={referencia}
                                    onChange={e=>setReferencia(e.target.value)}
                                />
                            </div>
                            {tipoIngreso === 'compra' && (
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Gastos o Flete Extra ($)</label>
                                    <input 
                                        type="number"
                                        placeholder="Opcional..."
                                        className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold transition-colors focus:border-slate-400 shadow-sm outline-none"
                                        value={gastosExtras}
                                        onChange={e=>setGastosExtras(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="mt-6 flex justify-end">
                            <button onClick={()=>setIsHeaderExpanded(false)} className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl shadow-xl shadow-slate-900/10 text-sm hover:bg-slate-800 transition">Continuar al paso 2</button>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* Búsqueda de Productos Ultra Blanca */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm">2</div>
                    <h3 className="text-xl font-black text-slate-800">Añadir Artículos</h3>
                </div>
                
                {/* Categorias en Dropdown Simple Minimalista para no invadir */}
                <div className="mb-6 flex flex-col md:flex-row md:items-center gap-4">
                     <select 
                        className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 px-5 py-3 rounded-2xl cursor-pointer hover:bg-slate-100 outline-none w-full md:w-auto"
                        value={catFiltro}
                        onChange={(e) => { setCatFiltro(e.target.value); setMaestroElegido(null); setVarianteElegida(null); }}
                     >
                         <option value="">Todas las Categorías</option>
                         {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                     </select>
                     <p className="text-xs text-slate-400 font-medium">Toca un recuadro para seleccionarlo.</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[550px] overflow-y-auto pb-4 pr-1">
                    {getMaestrosMostrados().map(m => (
                        <div key={m.id} onClick={() => { setMaestroElegido(m); setVarianteElegida(null); setIsHeaderExpanded(false); }} className={cn("bg-white border-2 rounded-3xl p-6 cursor-pointer hover:scale-[1.02] transition-all relative group", maestroElegido?.id === m.id ? "border-slate-800 shadow-xl z-20" : "border-slate-100 hover:border-slate-300 shadow-sm")}>
                            
                            <Box className={cn("w-8 h-8 mb-4", maestroElegido?.id === m.id ? "text-slate-800" : "text-slate-300 group-hover:text-slate-500")} />
                            <p className="text-sm font-black text-slate-800 leading-tight">{m.nombre}</p>
                            {m.sku && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{m.sku}</p>}

                            {/* Popover Inline de Variante Inteligente */}
                            {maestroElegido?.id === m.id && (
                                <motion.div 
                                    initial={{opacity:0, scale:0.95}} 
                                    animate={{opacity:1, scale:1}}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute -top-4 -right-4 w-80 bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl z-50 cursor-default"
                                >
                                    <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                                        <h4 className="font-black text-slate-800 text-sm">Añadiendo <span className="text-indigo-600 truncate max-w-[120px] inline-block align-bottom">{m.nombre}</span></h4>
                                        <button onClick={(e) => { e.stopPropagation(); setMaestroElegido(null); }} className="text-slate-400 hover:text-rose-500 font-black text-xs px-2 py-1 bg-slate-50 hover:bg-rose-50 rounded-lg">✕ CERRAR</button>
                                    </div>
                                    
                                    <div className="space-y-5">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Tipo / Variante ({m.unidad_base || 'ud'})</label>
                                            <button 
                                                type="button" 
                                                onClick={() => setIsVarianteModalOpen(true)}
                                                className="w-full flex items-center justify-between bg-slate-50 border border-slate-200 hover:border-slate-300 px-4 py-3.5 rounded-2xl text-left transition"
                                            >
                                                <span className={varianteElegida ? "font-black text-slate-800 text-sm truncate" : "text-slate-400 font-bold text-xs"}>
                                                    {varianteElegida ? varianteElegida.nombre_variante : "Tocar para elegir..."}
                                                </span>
                                            </button>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Unidades</label>
                                                <input type="number" min="0.01" step="0.01" className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 font-black text-slate-800 focus:border-slate-400 shadow-sm outline-none text-center" value={cantidadInput} onChange={e=>setCantidadInput(Number(e.target.value))} />
                                            </div>
                                            <div className="flex-1 space-y-1.5">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">Costo Unit.</label>
                                                <input type="number" min="0" step="0.01" className="w-full px-4 py-3.5 rounded-2xl bg-white border border-slate-200 font-bold text-emerald-700 focus:border-slate-400 shadow-sm outline-none text-right" value={precioInput} onChange={e=>setPrecioInput(Number(e.target.value))} />
                                            </div>
                                        </div>
                                        <button disabled={!varianteElegida} onClick={agregarAlCarrito} className="w-full mt-2 py-4 shadow-xl shadow-slate-900/10 bg-slate-900 text-white disabled:opacity-50 disabled:shadow-none disabled:bg-slate-100 disabled:text-slate-400 hover:bg-slate-800 rounded-2xl font-black transition-colors">
                                            AGREGAR AL FORMULARIO
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Facturador Virtual Derecho Ultra Minimal */}
        <div className="lg:col-span-4">
            <div className="bg-white border border-slate-200 rounded-3xl sticky top-24 shadow-sm flex flex-col h-[80vh]">
                <div className="p-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-3xl">
                    <h3 className="font-black text-2xl text-slate-800">
                        Facturador
                    </h3>
                    <span className="text-xs font-black bg-white border border-slate-200 text-slate-800 px-3.5 py-1.5 rounded-xl shadow-sm">{carrito.length} Ítems</span>
                </div>
                
                <div className="flex-1 p-5 overflow-y-auto space-y-3 bg-white scrollbar-thin">
                    {carrito.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3">
                            <ShoppingCart className="w-16 h-16 opacity-10 mb-2"/>
                            <p className="font-bold text-sm text-slate-400">Tu formulario está vacío.</p>
                            <p className="text-[11px] text-slate-400 text-center uppercase tracking-widest leading-relaxed max-w-[200px]">Usa el panel de la izquierda para poblar este recibo.</p>
                        </div>
                    )}
                    {carrito.map((item, idx) => (
                        <div key={idx} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 flex flex-col relative group transition-colors hover:border-rose-100">
                            <button onClick={()=>eliminarDelCarrito(idx)} className="absolute top-4 right-4 text-slate-300 hover:text-white hover:bg-rose-500 w-7 h-7 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all font-black text-sm shadow-sm z-10">✕</button>
                            
                            <p className="font-black text-[15px] text-slate-800 leading-tight pr-8">{item.variante.producto_padre}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 mt-1 tracking-widest">{item.variante.nombre_variante}</p>
                            
                            <div className="flex justify-between items-center bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                                <div className="flex gap-2 text-xs font-bold text-slate-600">
                                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">{item.cantidad} <span className="text-[9px] text-slate-400">{item.variante.unidad_base}</span></div>
                                    <div className="bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm text-emerald-700">x $ {item.precio_unitario}</div>
                                </div>
                                <p className="font-black text-lg text-slate-800">${(item.cantidad * item.precio_unitario).toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-7 border-t border-slate-100 bg-slate-50/80 rounded-b-3xl">
                    <div className="flex justify-between items-end mb-6">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Total Declarado</span>
                        <span className="text-4xl font-black text-emerald-600 tracking-tighter">${carrito.reduce((acc, c) => acc + (c.cantidad * c.precio_unitario), 0).toFixed(2)}</span>
                    </div>
                    {tipoIngreso === 'compra' ? (
                        <div className="space-y-3">
                           <button onClick={() => guardarCompra(false)} disabled={isProcesando} className="w-full py-4 rounded-2xl font-black text-white bg-slate-900 hover:bg-slate-800 transition shadow-xl shadow-slate-900/10 tracking-widest text-sm">
                               CONFIRMAR OFICIAL  →
                           </button>
                           <button onClick={() => guardarCompra(true)} disabled={isProcesando} className="w-full py-3.5 rounded-2xl font-bold text-slate-500 bg-transparent border-2 border-slate-200 hover:bg-white hover:border-slate-300 transition text-sm">
                               Guardar y Seguir Editando
                           </button>
                        </div>
                    ) : (
                        <button onClick={() => guardarCompra(false)} disabled={isProcesando} className="w-full py-4 rounded-2xl font-black text-white bg-emerald-600 hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20 tracking-widest text-sm">
                            IMPACTAR ALMACÉN →
                        </button>
                    )}
                </div>
            </div>
        </div>
      </div>
      </motion.div>
`;
if(startIndex > -1) {
    s = s.substring(0, startIndex) + newJSX + s.substring(endIndex);
    fs.writeFileSync('src/pages/Ingresos.tsx', s);
    console.log('Success');
}
