{
  /* COMPRA FORMAL - MONOLITHIC INVOICE */
}
<div className="lg:col-span-12 space-y-6 max-w-5xl mx-auto w-full">
  {/* Cabecera / Documento de Facturación */}
  <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
    <div className="p-6 flex justify-between items-center bg-slate-50 border-b border-slate-100">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black shadow-sm">
          <Receipt className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-800 leading-none">
            Datos del Documento
          </h3>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Registra información fiscal o de remito
          </p>
        </div>
      </div>
    </div>

    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">
            Proveedor / Vendedor
          </label>
          <button
            type="button"
            onClick={() => setIsProvModalOpen(true)}
            className="w-full flex items-center justify-between bg-white border-2 border-slate-200 hover:border-slate-300 px-5 py-4 rounded-xl text-left transition-colors shadow-sm"
          >
            <span
              className={
                provId
                  ? "font-black text-slate-800 text-lg"
                  : "text-slate-400 font-bold"
              }
            >
              {provId
                ? proveedores.find((p) => p.id === provId)?.nombre
                : "Tocar para Seleccionar Proveedor"}
            </span>
          </button>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">
            Documento Comercial
          </label>
          <button
            type="button"
            onClick={() => setIsTipoModalOpen(true)}
            className="w-full flex items-center justify-between bg-white border-2 border-slate-200 hover:border-slate-300 px-5 py-4 rounded-xl text-left transition-colors shadow-sm"
          >
            <span
              className={
                tipoFacturaId
                  ? "font-black text-slate-800 text-lg"
                  : "text-slate-400 font-bold"
              }
            >
              {tipoFacturaId
                ? tiposFactura.find((p) => p.id.toString() === tipoFacturaId)
                    ?.nombre
                : "Tocar para Elegir Comprobante"}
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
            onChange={(e) => setReferencia(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-slate-500 tracking-widest pl-1">
            Monto Flete / Costos Extra ($)
          </label>
          <input
            type="number"
            placeholder="0.00"
            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-200 rounded-xl font-black text-lg text-rose-600 transition-colors focus:border-indigo-400 shadow-sm outline-none"
            value={gastosExtras}
            onChange={(e) => setGastosExtras(e.target.value)}
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
        <p className="text-sm text-slate-500 font-bold mt-1">
          Declara las cantidades y el costo de lote.
        </p>
      </div>
      <button
        onClick={() => {
          setIsCatalogModalOpen(true);
          setMaestroElegido(null);
        }}
        className="px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transition-transform hover:scale-[1.02] flex items-center gap-2 text-sm uppercase tracking-widest"
      >
        <Plus className="w-5 h-5" /> AÑADIR PRODUCTOS
      </button>
    </div>

    {carrito.length === 0 ? (
      <div className="p-16 flex flex-col items-center justify-center text-slate-400">
        <ShoppingCart className="w-20 h-20 opacity-10 mb-4" />
        <p className="font-black text-lg text-slate-500">
          Este comprobante está vacío.
        </p>
        <p className="text-sm text-slate-400 mt-1 max-w-sm text-center">
          Presiona el botón de Añadir Productos para armar el lote de registro
          para tu historial contable.
        </p>
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
          <div
            key={idx}
            className="bg-white p-4 md:px-4 md:py-3 rounded-2xl border-2 border-slate-100 hover:border-slate-300 transition-colors flex flex-col md:grid md:grid-cols-12 md:items-center gap-4 md:gap-4 relative group"
          >
            <div className="hidden md:flex col-span-1 justify-center">
              <button
                onClick={() => eliminarDelCarrito(idx)}
                className="text-slate-300 hover:text-rose-500 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-50 font-black"
              >
                X
              </button>
            </div>
            <div className="col-span-5 flex items-center gap-4">
              <button
                onClick={() => eliminarDelCarrito(idx)}
                className="md:hidden text-slate-300 hover:text-rose-500 transition-colors font-black"
              >
                X
              </button>
              <div>
                <p className="font-black text-sm text-slate-800 leading-none">
                  {item.variante.producto_padre}
                </p>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 bg-slate-100 px-2 py-0.5 rounded inline-block">
                  {item.variante.nombre_variante}
                </p>
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
                  value={item.cantidad || ""}
                  onChange={(e) => {
                    const nc = [...carrito];
                    nc[idx].cantidad = Number(e.target.value);
                    setCarrito(nc);
                  }}
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase">
                  {item.variante.unidad_base}
                </span>
              </div>
            </div>
            <div className="col-span-2 flex justify-end">
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="Costo"
                className="w-full max-w-[120px] bg-slate-50 text-emerald-700 border-2 border-slate-200 px-3 py-2 rounded-xl font-bold outline-none text-right focus:border-emerald-400 transition-colors"
                value={item.precio_unitario || ""}
                onChange={(e) => {
                  const nc = [...carrito];
                  nc[idx].precio_unitario = Number(e.target.value);
                  setCarrito(nc);
                }}
              />
            </div>
            <div className="col-span-2 flex justify-end">
              <p className="font-black text-xl text-slate-800">
                $
                {((item.cantidad || 0) * (item.precio_unitario || 0)).toFixed(
                  2,
                )}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}

    <div className="p-8 border-t border-slate-200 bg-slate-50 rounded-b-3xl">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="text-center md:text-left">
          <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest block mb-1">
            Total Declarado A Pagar
          </span>
          <span className="text-5xl font-black text-emerald-600 tracking-tighter">
            $
            {carrito
              .reduce(
                (acc, c) => acc + (c.cantidad || 0) * (c.precio_unitario || 0),
                0,
              )
              .toFixed(2)}
          </span>
        </div>
        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => guardarCompra(true)}
            disabled={isProcesando}
            className="px-8 py-5 rounded-2xl font-black text-slate-500 bg-white border-2 border-slate-200 hover:bg-slate-100 transition whitespace-nowrap"
          >
            GUARDAR COMO BORRADOR
          </button>
          <button
            onClick={() => guardarCompra(false)}
            disabled={isProcesando}
            className="px-10 py-5 rounded-2xl font-black text-white bg-slate-900 hover:bg-slate-800 transition shadow-2xl shadow-slate-900/40 text-lg whitespace-nowrap tracking-wide"
          >
            ASENTAR RECIBO OFICIAL
          </button>
        </div>
      </div>
    </div>
  </div>
</div>;
