import sys

with open("src/pages/Ingresos.tsx", "r", encoding="utf-8") as f:
    text = f.read()

# Remove 'ajuste' toggle from Tabs
tab_chunk_to_replace = """                    <button onClick={() => { setTipoIngreso('compra'); setViewMode('list'); }} className={cn("px-4 py-2 font-bold text-sm transition-colors uppercase tracking-widest", tipoIngreso === 'compra' ? "border-b-2 border-indigo-500 text-indigo-400" : "text-slate-400 hover:text-white")}>Compras Formales</button>
                    <button onClick={() => { setTipoIngreso('ajuste'); setViewMode('list'); }} className={cn("px-4 py-2 font-bold text-sm transition-colors uppercase tracking-widest", tipoIngreso === 'ajuste' ? "border-b-2 border-emerald-500 text-emerald-400" : "text-slate-400 hover:text-white")}>Ajuste Libre</button>"""
new_tab_chunk = """                    <button onClick={() => { setTipoIngreso('compra'); setViewMode('list'); }} className={cn("px-4 py-2 font-bold text-sm transition-colors uppercase tracking-widest", tipoIngreso === 'compra' ? "border-b-2 border-indigo-500 text-indigo-400" : "text-slate-400 hover:text-white")}>Compras y Remitos</button>"""
if tab_chunk_to_replace in text:
    text = text.replace(tab_chunk_to_replace, new_tab_chunk)

# Add Modal State
if "isCatalogModalOpen" not in text:
    text = text.replace("const [catFiltro, setCatFiltro] = useState('');", "const [catFiltro, setCatFiltro] = useState('');\n  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);")

start = text.find("{/* Cabecera Tipo Invoice - COLLAPSIBLE */}")
if start == -1:
    print("CRITICAL: Start block not found correctly")
    start = text.find("{/* Cabecera Tipo Invoice */}")

end = text.find("      {/* Modals Globales del Formulario */}")

if start > -1 and end > start:
    new_jsx = """{/* COMPRA FORMAL - MONOLITHIC INVOICE */}
        <div className="max-w-5xl mx-auto space-y-6">
            
            {/* Cabecera / Documento de Facturación */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-6 flex justify-between items-center bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black shadow-sm">DOC</div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 leading-none">Datos del Documento</h3>
                            <p className="text-sm text-slate-500 font-medium mt-1">Registra información fiscal o de remito</p>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Proveedor / Vendedor</label>
                            <button 
                                type="button" 
                                onClick={() => setIsProvModalOpen(true)}
                                className="w-full flex items-center justify-between bg-white border-2 border-slate-200 hover:border-slate-300 px-5 py-4 rounded-xl text-left transition-colors shadow-sm"
                            >
                                <span className={provId ? "font-black text-slate-800 text-lg" : "text-slate-400 font-bold"}>
                                    {provId ? proveedores.find(p=>p.id===provId)?.nombre : "Tocar para Seleccionar Proveedor"}
                                </span>
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Documento Comercial</label>
                            <button 
                                type="button" 
                                onClick={() => setIsTipoModalOpen(true)}
                                className="w-full flex items-center justify-between bg-white border-2 border-slate-200 hover:border-slate-300 px-5 py-4 rounded-xl text-left transition-colors shadow-sm"
                            >
                                <span className={tipoFacturaId ? "font-black text-slate-800 text-lg" : "text-slate-400 font-bold"}>
                                    {tipoFacturaId ? tiposFactura.find(p=>p.id.toString()===tipoFacturaId)?.nombre : "Tocar para Elegir Comprobante"}
                                </span>
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">
                                Nº Referencia Asoc. (Remito/Tkt)
                            </label>
                            <input 
                                type="text"
                                placeholder="A-0001-090234"
                                className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-xl font-black text-lg uppercase transition-colors focus:border-indigo-400 shadow-sm outline-none"
                                value={referencia}
                                onChange={e=>setReferencia(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">Monto Flete / Costos Extra ($)</label>
                            <input 
                                type="number"
                                placeholder="0.00"
                                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-lg text-rose-600 transition-colors focus:border-indigo-400 shadow-sm outline-none"
                                value={gastosExtras}
                                onChange={e=>setGastosExtras(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Facturador Gigante Central */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
                    <div>
                        <h3 className="font-black text-2xl text-slate-800">Facturador</h3>
                        <p className="text-sm text-slate-500 font-bold mt-1">Declara las cantidades y el costo de lote.</p>
                    </div>
                    <button onClick={() => { setIsCatalogModalOpen(true); setMaestroElegido(null); }} className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-transform hover:scale-[1.02] flex items-center gap-2 text-sm uppercase tracking-widest">
                        <Plus className="w-5 h-5"/> AÑADIR PRODUCTOS
                    </button>
                </div>
                
                {carrito.length === 0 ? (
                    <div className="p-16 flex flex-col items-center justify-center text-slate-400">
                        <ShoppingCart className="w-20 h-20 opacity-10 mb-4"/>
                        <p className="font-black text-lg text-slate-500">Este comprobante está vacío.</p>
                        <p className="text-sm text-slate-400 mt-1 max-w-sm text-center">Presiona el botón de Añadir Productos para armar el lote de registro para tu historial contable.</p>
                    </div>
                ) : (
                    <div className="p-4 md:p-8 space-y-4 bg-white">
                        {/* Cabecera Tabla Fake */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             <div className="col-span-1">Action</div>
                             <div className="col-span-5">Producto Asentado</div>
                             <div className="col-span-2 text-center">Cantidad Recibida</div>
                             <div className="col-span-2 text-right">Costo Unit ($)</div>
                             <div className="col-span-2 text-right">Subtotal</div>
                        </div>

                        {carrito.map((item, idx) => (
                            <div key={idx} className="bg-white p-4 md:px-4 md:py-3 rounded-2xl border-2 border-slate-100 hover:border-slate-300 transition-colors flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 md:gap-4 relative group">
                                <div className="hidden md:flex col-span-1 justify-center">
                                    <button onClick={()=>eliminarDelCarrito(idx)} className="text-slate-300 hover:text-rose-500 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-50 font-black">X</button>
                                </div>
                                <div className="col-span-5 flex items-center gap-4">
                                     <button onClick={()=>eliminarDelCarrito(idx)} className="md:hidden text-slate-300 hover:text-rose-500 transition-colors font-black">X</button>
                                     <div>
                                        <p className="font-black text-sm text-slate-800 leading-none">{item.variante.producto_padre}</p>
                                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 bg-slate-100 px-2 py-0.5 rounded inline-block">{item.variante.nombre_variante}</p>
                                     </div>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <div className="flex items-center gap-2 w-full max-w-[120px]">
                                        <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Cant."
                                            className="w-full bg-slate-50 text-slate-900 border-2 border-slate-200 px-3 py-2 rounded-xl font-black outline-none text-center focus:border-indigo-400 transition-colors"
                                            value={item.cantidad || ''}
                                            onChange={(e) => {
                                                const nc = [...carrito];
                                                nc[idx].cantidad = Number(e.target.value);
                                                setCarrito(nc);
                                            }}
                                        />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase">{item.variante.unidad_base}</span>
                                    </div>
                                </div>
                                <div className="col-span-2 flex justify-end">
                                    <input 
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Costo"
                                        className="w-full max-w-[120px] bg-slate-50 text-emerald-700 border-2 border-slate-200 px-3 py-2 rounded-xl font-bold outline-none text-right focus:border-emerald-400 transition-colors"
                                        value={item.precio_unitario || ''}
                                        onChange={(e) => {
                                            const nc = [...carrito];
                                            nc[idx].precio_unitario = Number(e.target.value);
                                            setCarrito(nc);
                                        }}
                                    />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                    <p className="font-black text-xl text-slate-800">${((item.cantidad || 0) * (item.precio_unitario || 0)).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="p-8 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                            <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest block mb-1">Total Declarado A Pagar</span>
                            <span className="text-5xl font-black text-emerald-600 tracking-tighter">${carrito.reduce((acc, c) => acc + ((c.cantidad||0) * (c.precio_unitario||0)), 0).toFixed(2)}</span>
                        </div>
                        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                           <button onClick={() => guardarCompra(true)} disabled={isProcesando} className="px-8 py-5 rounded-2xl font-black text-slate-500 bg-white border-2 border-slate-200 hover:bg-slate-100 transition whitespace-nowrap">
                               GUARDAR COMO BORRADOR
                           </button>
                           <button onClick={() => guardarCompra(false)} disabled={isProcesando} className="px-10 py-5 rounded-2xl font-black text-white bg-slate-900 hover:bg-slate-800 transition shadow-2xl shadow-slate-900/40 text-lg whitespace-nowrap tracking-wide">
                               ASENTAR RECIBO OFICIAL
                           </button>
                        </div>
                    </div>
                </div>
            </div>
      </div>
"""
    # Replace content directly
    text = text[:start] + new_jsx + text[end:]
    
    # Inject MODAL
    modal_jsx = """      {/* Modals Globales del Formulario */}

      {/* MODAL DE EXPLORACIÓN DE PRODUCTOS (CATALOGO GLOBAL) */}
      <Modal id="ProductPicker" isOpen={isCatalogModalOpen} onClose={() => setIsCatalogModalOpen(false)}>
          <div className="bg-slate-900 text-white rounded-3xl w-full max-w-5xl self-center max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700">
              <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                  <h3 className="font-black text-xl flex items-center gap-3">
                      Catálogo Master <span className="text-indigo-400 text-sm bg-slate-900 border border-slate-800 px-3 py-1 rounded-full uppercase tracking-widest">Pinche para agregar</span>
                  </h3>
                  <button onClick={() => setIsCatalogModalOpen(false)} className="text-slate-400 hover:text-white font-black bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl text-sm transition">CERRAR EXPLORADOR</button>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-900">
                  {/* LATERAL: CATEGORIAS */}
                  <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex-shrink-0 flex flex-col overflow-y-auto">
                      <div className="p-4 space-y-1">
                          <button onClick={() => { setCatFiltro(''); setMaestroElegido(null); }} className={catFiltro === '' ? "w-full text-left px-4 py-3 rounded-xl bg-indigo-600 font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2" : "w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 font-bold text-slate-400 hover:text-slate-200 transition"}>
                             <div className="w-1.5 h-1.5 rounded-full bg-white opacity-50"></div> Todos</button>
                          {categorias.map(c => (
                              <button key={c.id} onClick={() => { setCatFiltro(c.id.toString()); setMaestroElegido(null); }} className={catFiltro === c.id.toString() ? "w-full text-left px-4 py-3 rounded-xl bg-indigo-600 font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2" : "w-full text-left px-4 py-3 rounded-xl hover:bg-slate-800 font-bold text-slate-400 hover:text-slate-200 transition"}>
                                 <div className="w-1.5 h-1.5 rounded-full bg-white opacity-50"></div> {c.nombre}
                              </button>
                          ))}
                      </div>
                  </div>

                  {/* CENTRO: MAESTROS Y VARIANTES */}
                  <div className="flex-1 flex flex-col bg-slate-900 border-l border-slate-800/50">
                      {!maestroElegido ? (
                          <div className="p-6 md:p-8 flex-1 overflow-y-auto w-full max-h-[70vh]">
                              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-6">Selecciona el Producto Base</p>
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-16">
                                  {getMaestrosMostrados().map(m => (
                                      <button key={m.id} onClick={() => setMaestroElegido(m)} className="bg-slate-800 border border-slate-700 hover:border-slate-500 hover:bg-slate-750 p-6 rounded-2xl text-left transition-all hover:-translate-y-1 group">
                                          <Box className="w-8 h-8 mb-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                                          <p className="font-black text-white text-sm leading-tight">{m.nombre}</p>
                                          {m.sku && <p className="text-[10px] text-slate-500 mt-2 font-mono">{m.sku}</p>}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ) : (
                          <div className="p-6 md:p-8 flex-1 overflow-y-auto max-h-[70vh]">
                              <button onClick={() => setMaestroElegido(null)} className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-6 bg-indigo-500/10 hover:bg-indigo-500/20 px-4 py-2 rounded-lg transition width-fit">
                                  ← Volver a Productos
                              </button>
                              
                              <h2 className="text-3xl font-black text-white mb-2">{maestroElegido.nombre}</h2>
                              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8">Click sobre la variable específica para inyectar</p>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-16">
                                  {variantes.filter(v => v.producto_maestro_id === maestroElegido.id).map(v => {
                                      const isSelected = carrito.some(item => item.variante.id === v.id);
                                      return (
                                          <button 
                                              key={v.id} 
                                              onClick={() => {
                                                  if(isSelected) return; 
                                                  // PUSH TO CART DEFAULT 0
                                                  setCarrito([...carrito, { variante: {...v, producto_padre: maestroElegido.nombre}, cantidad: 0, precio_unitario: 0 }]);
                                              }}
                                              className={cn("p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-all group", isSelected ? "bg-emerald-950/30 border-emerald-500/50 cursor-default" : "bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-800/80 cursor-pointer")}
                                          >
                                              <div>
                                                  <p className={cn("font-black text-lg", isSelected ? "text-emerald-400" : "text-white")}>{v.nombre_variante}</p>
                                                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">S.K.U: {v.sku || 'N/A'}</p>
                                              </div>
                                              <div>
                                                  {isSelected ? (
                                                      <span className="bg-emerald-500 text-white text-[10px] uppercase font-black tracking-widest px-3 py-1.5 rounded-lg">Cargada</span>
                                                  ) : (
                                                      <span className="bg-slate-700 group-hover:bg-indigo-600 text-white w-8 h-8 flex items-center justify-center rounded-full font-black transition-colors">+</span>
                                                  )}
                                              </div>
                                          </button>
                                      )
                                  })}
                              </div>
                          </div>
                      )}
                  </div>
              </div>
          </div>
      </Modal>
"""
    text = text.replace("      {/* Modals Globales del Formulario */}", modal_jsx)
    with open("src/pages/Ingresos.tsx", "w", encoding="utf-8") as f:
        f.write(text)
    print("DONE SCRIPT")
else:
    print("FAILED")
