{
  /* Modals Globales del Formulario */
}

{
  /* MODAL DE EXPLORACIÓN DE PRODUCTOS (CATALOGO GLOBAL) */
}
<Modal
  id="ProductPicker"
  isOpen={isCatalogModalOpen}
  onClose={() => setIsCatalogModalOpen(false)}
>
  <div className="bg-slate-900 text-white rounded-3xl w-[95vw] md:w-[85vw] max-w-6xl self-center max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-700 mx-auto">
    <div className="px-8 py-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
      <h3 className="font-black text-xl flex items-center gap-3">
        Explorador de Catálogo Master{" "}
        <span className="text-indigo-400 text-[10px] bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-full uppercase tracking-widest font-bold">
          Touch to Insert
        </span>
      </h3>
      <button
        onClick={() => setIsCatalogModalOpen(false)}
        className="text-slate-400 hover:text-white font-black bg-slate-800 hover:bg-slate-700 px-6 py-2.5 rounded-xl text-sm transition"
      >
        Finalizar Búsqueda
      </button>
    </div>

    <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-900 relative">
      {/* LATERAL: CATEGORIAS */}
      <div className="w-full md:w-64 bg-slate-950/80 border-r border-slate-800 flex-shrink-0 flex flex-col overflow-y-auto hidden md:flex">
        <div className="p-4 space-y-1.5">
          <button
            onClick={() => {
              setCatFiltro("");
              setMaestroElegido(null);
            }}
            className={
              catFiltro === ""
                ? "w-full text-left px-5 py-3.5 rounded-xl bg-indigo-600 font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-3"
                : "w-full text-left px-5 py-3.5 rounded-xl hover:bg-slate-800 font-bold text-slate-400 hover:text-slate-200 transition"
            }
          >
            <div className="w-1.5 h-1.5 rounded-full bg-white opacity-50"></div>{" "}
            Todas las Categorías
          </button>
          {categorias.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCatFiltro(c.id.toString());
                setMaestroElegido(null);
              }}
              className={
                catFiltro === c.id.toString()
                  ? "w-full text-left px-5 py-3.5 rounded-xl bg-indigo-600 font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-3"
                  : "w-full text-left px-5 py-3.5 rounded-xl hover:bg-slate-800 font-bold text-slate-400 hover:text-slate-200 transition"
              }
            >
              <div className="w-1.5 h-1.5 rounded-full bg-white opacity-50"></div>{" "}
              {c.nombre}
            </button>
          ))}
        </div>
      </div>

      {/* PARA MOBILE (Select en vez de barra lateral) */}
      <div className="md:hidden p-4 border-b border-slate-800">
        <select
          className="w-full bg-slate-800 text-white font-bold p-4 rounded-xl border border-slate-700 outline-none"
          value={catFiltro}
          onChange={(e) => {
            setCatFiltro(e.target.value);
            setMaestroElegido(null);
          }}
        >
          <option value="">Todas las Categorías</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nombre}
            </option>
          ))}
        </select>
      </div>

      {/* CENTRO: MAESTROS Y VARIANTES */}
      <div className="flex-1 flex flex-col bg-slate-900 min-h-[500px]">
        {!maestroElegido ? (
          <div className="p-6 md:p-10 flex-1 overflow-y-auto w-full">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black mb-6 pl-1">
              Selecciona la línea de producto a cargar
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-16">
              {getMaestrosMostrados().map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMaestroElegido(m)}
                  className="bg-slate-800 border-2 border-slate-750 hover:border-slate-500 hover:bg-slate-800 p-6 rounded-2xl text-left transition-all hover:-translate-y-1 group"
                >
                  <Box className="w-8 h-8 mb-4 text-slate-500 group-hover:text-indigo-400 transition-colors" />
                  <p className="font-black text-white text-sm md:text-base leading-tight">
                    {m.nombre}
                  </p>
                  {m.sku && (
                    <p className="text-[10px] text-slate-500 mt-2 font-mono">
                      {m.sku}
                    </p>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-10 flex-1 overflow-y-auto">
            <button
              onClick={() => setMaestroElegido(null)}
              className="flex items-center gap-2 text-indigo-400 font-bold text-sm mb-6 bg-indigo-500/10 hover:bg-indigo-500/20 px-5 py-3 rounded-xl transition w-fit border border-indigo-500/20"
            >
              ← Atrás a Lotes
            </button>

            <h2 className="text-3xl font-black text-white mb-2">
              {maestroElegido.nombre}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-10">
              Toca el botón (+) de la variable específica para agregarla
              directamente a tu factura debajo.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-16">
              {variantes
                .filter((v) => v.producto_maestro_id === maestroElegido.id)
                .map((v) => {
                  const isSelected = carrito.some(
                    (item) => item.variante.id === v.id,
                  );
                  return (
                    <button
                      key={v.id}
                      onClick={() => {
                        if (isSelected) return;
                        // PUSH TO CART DEFAULT 0
                        setCarrito([
                          ...carrito,
                          {
                            variante: {
                              ...v,
                              producto_padre: maestroElegido.nombre,
                            },
                            cantidad: 0,
                            precio_unitario: 0,
                          },
                        ]);
                      }}
                      className={cn(
                        "p-5 rounded-2xl border-2 text-left flex items-center justify-between transition-all group overflow-hidden relative",
                        isSelected
                          ? "bg-emerald-950/40 border-emerald-500/50 cursor-default"
                          : "bg-slate-800 border-slate-700 hover:border-indigo-500 hover:bg-slate-800 hover:-translate-y-0.5 cursor-pointer shadow-lg",
                      )}
                    >
                      {isSelected && (
                        <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none"></div>
                      )}
                      <div className="relative z-10">
                        <p
                          className={cn(
                            "font-black text-lg",
                            isSelected ? "text-emerald-400" : "text-white",
                          )}
                        >
                          {v.nombre_variante}
                        </p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                          S.K.U: {v.sku || "N/A"}
                        </p>
                      </div>
                      <div className="relative z-10">
                        {isSelected ? (
                          <span className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-xl">
                            SELECCIONADO
                          </span>
                        ) : (
                          <span className="bg-slate-700 group-hover:bg-indigo-600 text-white w-10 h-10 flex items-center justify-center rounded-xl font-black transition-colors shadow-sm text-xl">
                            +
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
</Modal>;
