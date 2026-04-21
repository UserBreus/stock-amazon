import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Receipt, Plus, Package, Box } from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { ModalSelector } from '../components/ui/ModalSelector';
import { GestionImportaciones } from '../components/GestionImportaciones';
import toast from 'react-hot-toast';

export function Ingresos() {
  const { user } = useAuth();
  
  // Maestros
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [tiposFactura, setTiposFactura] = useState<any[]>([]);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [maestros, setMaestros] = useState<any[]>([]);
  const [variantes, setVariantes] = useState<any[]>([]);
  const [almacenId, setAlmacenId] = useState<string>('');

  // Cabecera Compra
  const [tipoIngreso, setTipoIngreso] = useState<'compra' | 'ajuste' | 'importaciones'>('compra');
  const [provId, setProvId] = useState('');
  const [tipoFacturaId, setTipoFacturaId] = useState('');
  const [referencia, setReferencia] = useState('');
  const [gastosExtras, setGastosExtras] = useState<string>('');

  // Detalle Compra
  const [catFiltro, setCatFiltro] = useState('');
  const [maestroElegido, setMaestroElegido] = useState<any>(null);
  const [varianteElegida, setVarianteElegida] = useState<any>(null);
  const [cantidadInput, setCantidadInput] = useState(1);
  const [precioInput, setPrecioInput] = useState(0);

  // Carrito (Líneas de la factura)
  const [carrito, setCarrito] = useState<any[]>([]);
  const [isProcesando, setIsProcesando] = useState(false);
  // Modals
  const [isProvModalOpen, setIsProvModalOpen] = useState(false);
  const [isTipoModalOpen, setIsTipoModalOpen] = useState(false);
  const [isVarianteModalOpen, setIsVarianteModalOpen] = useState(false);

  useEffect(() => {
    fetchMaestros();
  }, []);

  const fetchMaestros = async () => {
    try {
      const [provs, tiposF, cats, vars, deps, maestRes] = await Promise.all([
        executeAWSQuery("SELECT * FROM Stock_Proveedores ORDER BY nombre"),
        executeAWSQuery("SELECT * FROM Stock_TiposFactura ORDER BY nombre"),
        executeAWSQuery("SELECT * FROM Stock_Categorias ORDER BY nombre"),
        executeAWSQuery("SELECT v.*, p.nombre as producto_padre, p.categoria_id, p.unidad_base FROM Stock_Variantes v INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id ORDER BY p.nombre, v.nombre_variante"),
        executeAWSQuery("SELECT id FROM Stock_Depositos WHERE tipo='central' ORDER BY id ASC"),
        executeAWSQuery("SELECT * FROM Stock_Productos_Maestros ORDER BY nombre")
      ]);
      if(provs) setProveedores(provs);
      if(tiposF) setTiposFactura(tiposF);
      if(cats) setCategorias(cats);
      if(maestRes) setMaestros(maestRes);
      if(vars) setVariantes(vars);
      if(deps && deps.length > 0) setAlmacenId(deps[0].id.toString());
    } catch(e) { console.error(e); }
  };

  const agregarAlCarrito = () => {
    if(!varianteElegida) return;
    if(cantidadInput <= 0 || precioInput < 0) return toast.error("Valores inválidos");
    
    // Check if already in cart
    const existe = carrito.findIndex(x => x.variante.id === varianteElegida.id && x.precio_unitario === precioInput);
    
    if(existe >= 0) {
        const nc = [...carrito];
        nc[existe].cantidad += cantidadInput;
        setCarrito(nc);
    } else {
        setCarrito([...carrito, { variante: varianteElegida, cantidad: cantidadInput, precio_unitario: precioInput }]);
    }
    
    setCantidadInput(1);
    setPrecioInput(0);
    setVarianteElegida(null);
  };

  const eliminarDelCarrito = (idx: number) => {
     setCarrito(carrito.filter((_, i) => i !== idx));
  };

  const guardarCompra = async () => {
     if(!almacenId) return toast.error("Falta depósito central.");
     
     if (tipoIngreso === 'compra') {
         if(!provId || !tipoFacturaId || !referencia) return toast.error("Completa los datos del proveedor y factura.");
     } else {
         if(!referencia) return toast.error("Indica el motivo del ajuste libre.");
     }

     if(carrito.length === 0) return toast.error("No hay productos.");

     const total = carrito.reduce((acc, current) => acc + (current.cantidad * current.precio_unitario), 0);
     setIsProcesando(true);

     try {
        let q = '';
        
        if (tipoIngreso === 'compra') {
            q += `
                -- Ensure column exists
                IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'estado' AND Object_ID = Object_ID(N'Stock_Compras'))
                BEGIN
                    ALTER TABLE Stock_Compras ADD estado VARCHAR(50) DEFAULT 'pendiente';
                END

                DECLARE @CompraId UNIQUEIDENTIFIER = NEWID();
                INSERT INTO Stock_Compras (id, proveedor_id, referencia_factura, tipo_factura_id, total_compra, creado_por, estado, gastos_extras)
                VALUES (@CompraId, '${provId}', '${referencia}', ${tipoFacturaId}, ${total}, '${user?.id}', 'pendiente', ${parseFloat(gastosExtras) || 0});
            `;
        }

        // Detalles y Stock físico
        for(const item of carrito) {
            
            if (tipoIngreso === 'compra') {
                q += `
                   -- Asociar factura, estado no afecta a Detalle
                   INSERT INTO Stock_Compras_Detalle (compra_id, variante_id, cantidad, precio_unitario)
                   VALUES (@CompraId, '${item.variante.id}', ${item.cantidad}, ${item.precio_unitario});
                `;
            } else {
                // Logica exclusiva para Ajuste Libre (Inject directo a stock)
                q += `
                   DECLARE @FisicoId_${item.variante.id.replace(/-/g,'')} INT;
                   SELECT TOP 1 @FisicoId_${item.variante.id.replace(/-/g,'')} = id FROM Stock_Etiquetas WHERE CAST(variante_id AS VARCHAR) = '${item.variante.id}' AND deposito_id = ${almacenId};
                   
                   IF @FisicoId_${item.variante.id.replace(/-/g,'')} IS NULL
                   BEGIN
                      INSERT INTO Stock_Etiquetas (variante_id, deposito_id, cantidad_actual) VALUES ('${item.variante.id}', ${almacenId}, ${item.cantidad});
                      SET @FisicoId_${item.variante.id.replace(/-/g,'')} = SCOPE_IDENTITY();
                   END
                   ELSE
                   BEGIN
                      UPDATE Stock_Etiquetas SET cantidad_actual = cantidad_actual + ${item.cantidad} WHERE id = @FisicoId_${item.variante.id.replace(/-/g,'')};
                   END

                   INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id, referencia_compra_id, usuario_id)
                   VALUES (@FisicoId_${item.variante.id.replace(/-/g,'')}, 'ajuste_ingreso_libre', ${item.cantidad}, ${almacenId}, NULL, '${user?.id}');
                `;
            }
        }

        await executeAWSQuery(q);
        
        if (tipoIngreso === 'compra') {
            toast.success("¡Compra Registrada (Pendiente de Recepción Físicament en Depósito)!");
        } else {
            toast.success("¡Ajuste Libre Registrado. Stock Actualizado!");
        }
        
        // Reset
        setProvId(''); setReferencia(''); setTipoFacturaId('');
        setCarrito([]);
     } catch(e: any) {
        toast.error("Error crítico: " + e.message);
     } finally {
        setIsProcesando(false);
     }
  };

  const getMaestrosMostrados = () => {
     if(!catFiltro) return maestros;
     return maestros.filter(m => m.categoria_id.toString() === catFiltro);
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h1 className="text-4xl font-black text-blue-950 dark:text-white tracking-tighter">
                {tipoIngreso === 'compra' ? 'Registro de Compras' : 'Ajustes de Inventario'}
            </h1>
            <p className="text-slate-500 font-medium">Asienta remitos y facturas o haz ingresos libres directo al almacén.</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 overflow-hidden p-1 rounded-xl">
            <button onClick={() => setTipoIngreso('compra')} className={cn("px-6 py-2.5 rounded-lg text-sm font-bold transition-all", tipoIngreso === 'compra' ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-400 shadow-sm" : "text-slate-500")}>
                Compra Formal
            </button>
            <button onClick={() => setTipoIngreso('ajuste')} className={cn("px-6 py-2.5 rounded-lg text-sm font-bold transition-all", tipoIngreso === 'ajuste' ? "bg-white dark:bg-slate-800 text-emerald-600 shadow-sm" : "text-slate-500")}>
                Ingreso Libre
            </button>
            <button onClick={() => setTipoIngreso('importaciones')} className={cn("px-6 py-2.5 rounded-lg text-sm font-bold transition-all", tipoIngreso === 'importaciones' ? "bg-white dark:bg-slate-800 text-purple-600 shadow-sm" : "text-slate-500")}>
                Importaciones y Costos
            </button>
        </div>
      </div>

      {tipoIngreso === 'importaciones' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
             <GestionImportaciones />
          </motion.div>
      )}

      {tipoIngreso !== 'importaciones' && (

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Cabecera Tipo Invoice */}
        <div className="lg:col-span-8 space-y-8">
            <div className={cn("card-nexus p-8 border-[3px] transition-colors", tipoIngreso === 'compra' ? "border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/20" : "border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/20")}>
                <div className={cn("flex items-center gap-3 mb-6 border-b pb-4", tipoIngreso === 'compra' ? "border-indigo-100 dark:border-indigo-800" : "border-emerald-100 dark:border-emerald-800")}>
                    <Receipt className={cn("w-5 h-5", tipoIngreso === 'compra' ? "text-indigo-500" : "text-emerald-500")} />
                    <h3 className={cn("text-xl font-black dark:text-white", tipoIngreso === 'compra' ? "text-indigo-950" : "text-emerald-950")}>
                        {tipoIngreso === 'compra' ? "Formulario de Proveedor" : "Formulario Libre"}
                    </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {tipoIngreso === 'compra' && (
                        <>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Proveedor de Origen</label>
                            <button 
                                type="button" 
                                onClick={() => setIsProvModalOpen(true)}
                                className="input-nexus w-full mt-1 flex items-center justify-between bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50 text-left h-[46px]"
                            >
                                <span className={provId ? "font-bold text-indigo-950 dark:text-indigo-100" : "text-slate-400 font-bold"}>
                                    {provId ? proveedores.find(p=>p.id===provId)?.nombre : "Tocar para buscar..."}
                                </span>
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Tipo de Asiento</label>
                            <button 
                                type="button" 
                                onClick={() => setIsTipoModalOpen(true)}
                                className="input-nexus w-full mt-1 flex items-center justify-between bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50 text-left h-[46px]"
                            >
                                <span className={tipoFacturaId ? "font-bold text-indigo-950 dark:text-indigo-100" : "text-slate-400 font-bold"}>
                                    {tipoFacturaId ? tiposFactura.find(p=>p.id.toString()===tipoFacturaId)?.nombre : "Tocar para elegir..."}
                                </span>
                            </button>
                        </div>
                        </>
                    )}
                    <div className={cn("space-y-2", tipoIngreso === 'ajuste' && "md:col-span-3")}>
                        <label className={cn("text-[10px] font-black uppercase tracking-widest", tipoIngreso === 'compra' ? "text-indigo-400" : "text-emerald-600")}>
                             {tipoIngreso === 'compra' ? 'Comp / Recibo Ref.' : 'Motivo del Ajuste (Ej: Encontrado en depósito)'}
                        </label>
                        <input 
                            type="text"
                            placeholder={tipoIngreso === 'compra' ? "A-0001-090234" : "Ingreso omitido la semana pasada"}
                            className="input-nexus w-full uppercase bg-white dark:bg-slate-900"
                            value={referencia}
                            onChange={e=>setReferencia(e.target.value)}
                        />
                    </div>
                    {tipoIngreso === 'compra' && (
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Gastos / Flete Extra (USD)</label>
                           <input 
                              type="number"
                              placeholder="Ej: 50.00"
                              className="input-nexus w-full font-bold bg-white dark:bg-slate-900"
                              value={gastosExtras}
                              onChange={e=>setGastosExtras(e.target.value)}
                           />
                        </div>
                    )}
                </div>
            </div>

            {/* Búsqueda de Productos con Tarjetas Modernas */}
            <div className="card-nexus p-8">
                <h3 className="text-xl font-black text-blue-950 dark:text-white mb-6">Añadir Artículos a la Compra</h3>
                
                {/* Categorias Pills */}
                <div className="flex flex-wrap gap-2 mb-6">
                    <button onClick={() => { setCatFiltro(''); setMaestroElegido(null); setVarianteElegida(null); }} className={cn("px-4 py-1.5 rounded-full text-xs font-black uppercase text-slate-500 border hover:bg-slate-50 transition-colors", !catFiltro && "bg-slate-200 border-slate-300 text-slate-800")}>TODAS</button>
                    {categorias.map(c => (
                        <button key={c.id} onClick={() => { setCatFiltro(c.id.toString()); setMaestroElegido(null); setVarianteElegida(null); }} className={cn("px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border transition-colors", catFiltro === c.id.toString() ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/30" : "bg-white text-slate-500 hover:border-blue-300")}>
                            {c.nombre}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-96 overflow-y-auto p-2 mb-4">
                    {getMaestrosMostrados().map(m => (
                        <div key={m.id} onClick={() => { setMaestroElegido(m); setVarianteElegida(null); }} className={cn("bg-slate-50 dark:bg-slate-900 border-2 rounded-2xl p-4 cursor-pointer hover:scale-105 transition-transform", maestroElegido?.id === m.id ? "border-blue-500 shadow-lg shadow-blue-500/20" : "border-slate-100 dark:border-slate-800 hover:border-slate-300")}>
                            <Box className={cn("w-5 h-5 mb-2", maestroElegido?.id === m.id ? "text-blue-500" : "text-slate-400")} />
                            <p className="text-sm font-black text-blue-950 dark:text-white leading-tight">{m.nombre}</p>
                            {m.sku && <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{m.sku}</p>}
                        </div>
                    ))}
                </div>

                {maestroElegido && (
                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="p-6 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-500/50 rounded-2xl">
                        <div className="mb-4 border-b border-emerald-200/50 dark:border-emerald-800/50 pb-4">
                            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Paso 2: ¿Qué modelo exacto vas a registrar?</p>
                            <p className="text-xl font-black text-emerald-900 dark:text-emerald-400">{maestroElegido.nombre}</p>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-center gap-4">
                            <div className="flex-1 w-full">
                                <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest pl-1">Modelo Exacto</label>
                                <button 
                                    type="button" 
                                    onClick={() => setIsVarianteModalOpen(true)}
                                    className="input-nexus w-full mt-1 flex items-center justify-between border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 text-left h-[46px]"
                                >
                                    <span className={varianteElegida ? "font-black text-emerald-950 dark:text-emerald-100" : "text-emerald-600 font-bold"}>
                                        {varianteElegida ? varianteElegida.nombre_variante : "Tocar para Elegir Variante..."}
                                    </span>
                                </button>
                            </div>
                            <div className="flex gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest pl-1">Cant ({varianteElegida?.unidad_base || 'ud'})</label>
                                    <input type="number" min="0.01" step="0.01" className="input-nexus w-24 text-center font-black bg-white dark:bg-slate-900" value={cantidadInput} onChange={e=>setCantidadInput(Number(e.target.value))} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-emerald-600 tracking-widest pl-1">Costo ($)</label>
                                    <input type="number" min="0" step="0.01" className="input-nexus w-28 font-bold bg-white dark:bg-slate-900" value={precioInput} onChange={e=>setPrecioInput(Number(e.target.value))} />
                                </div>
                                <div className="flex items-end">
                                    <button disabled={!varianteElegida} onClick={agregarAlCarrito} className="h-[46px] bg-emerald-600 disabled:opacity-50 disabled:bg-slate-400 hover:bg-emerald-700 text-white px-5 rounded-xl font-black flex items-center gap-2"><Plus className="w-5 h-5"/> AÑADIR</button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>

        {/* Facturador Virtual Derecho */}
        <div className="lg:col-span-4">
            <div className="card-nexus p-0 sticky top-24 shadow-xl shadow-slate-200/50 overflow-hidden border border-slate-200 dark:border-slate-800">
                <div className="bg-slate-900 text-white p-6">
                    <h3 className="font-black text-xl flex items-center gap-2"><ShoppingCart className="w-5 h-5"/> {tipoIngreso === 'compra' ? 'Borrador Facturación' : 'Borrador de Ajuste'}</h3>
                    <p className="text-slate-400 text-[10px] uppercase tracking-widest font-bold mt-1">Sube el stock en 1 click</p>
                </div>
                
                <div className="p-4 bg-slate-50 dark:bg-slate-900 min-h-[300px] max-h-[500px] overflow-y-auto space-y-2">
                    {carrito.length === 0 && <p className="text-center font-bold text-slate-400 mt-10">La factura aún está vacía.</p>}
                    {carrito.map((item, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-100 flex justify-between items-center relative group">
                            <div>
                                <p className="font-black text-sm text-blue-950 dark:text-white leading-tight">{item.variante.producto_padre}</p>
                                <p className="text-[10px] font-bold text-slate-500 uppercase">{item.variante.nombre_variante}</p>
                                <div className="mt-1 flex items-center gap-2 font-mono text-xs">
                                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded px-1 border border-slate-200 dark:border-slate-700">
                                        <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-16 bg-transparent text-slate-900 dark:text-white px-1 py-1 font-bold outline-none text-center"
                                            value={item.cantidad}
                                            onChange={(e) => {
                                                const nc = [...carrito];
                                                nc[idx].cantidad = Number(e.target.value);
                                                setCarrito(nc);
                                            }}
                                        />
                                        <span className="text-[10px] text-slate-500 font-bold pr-1">{item.variante.unidad_base}</span>
                                    </div>
                                    <span className="text-slate-400">x</span>
                                    <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded px-1 border border-slate-200 dark:border-slate-700">
                                        <span className="text-[10px] text-slate-500 font-bold pl-1">$</span>
                                        <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-20 bg-transparent text-slate-900 dark:text-white px-1 py-1 font-bold outline-none text-right"
                                            value={item.precio_unitario}
                                            onChange={(e) => {
                                                const nc = [...carrito];
                                                nc[idx].precio_unitario = Number(e.target.value);
                                                setCarrito(nc);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-lg text-emerald-600">${(item.cantidad * item.precio_unitario).toFixed(2)}</p>
                            </div>
                            <button onClick={()=>eliminarDelCarrito(idx)} className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full flex justify-center items-center opacity-0 group-hover:opacity-100 font-bold transition-opacity shadow-md shadow-rose-500/40">×</button>
                        </div>
                    ))}
                </div>

                <div className="p-6 bg-slate-50 dark:bg-slate-[850] border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-end mb-6">
                        <span className="text-xs font-black uppercase text-slate-400 tracking-widest">Total Declarado</span>
                        <span className="text-4xl font-black text-slate-900 dark:text-white">${carrito.reduce((acc, c) => acc + (c.cantidad * c.precio_unitario), 0).toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={guardarCompra} 
                        disabled={isProcesando}
                        className={cn("w-full py-4 rounded-xl font-black flex justify-center items-center gap-2 text-white shadow-lg transition-transform hover:scale-[1.02]", tipoIngreso === 'compra' ? "bg-indigo-600 shadow-indigo-500/30 hover:bg-indigo-700" : "bg-emerald-600 shadow-emerald-500/30 hover:bg-emerald-700")}
                    >
                        {isProcesando ? 'PROCESANDO...' : (tipoIngreso === 'compra' ? 'CONFIRMAR Y REGISTRAR COMPRA' : 'APLICAR AJUSTE DE STOCK')}
                    </button>
                    <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 text-center mt-3 uppercase tracking-widest">{tipoIngreso === 'compra' ? 'La compra quedará "Pendiente" y deberá ser auditada en Inventario.' : 'El inventario local será incrementado permanentemente.'}</p>
                </div>
            </div>
        </div>
      </div>
      )}

      {/* Modals Globales del Formulario */}
      {tipoIngreso !== 'importaciones' && (
      <>
      <ModalSelector
        title="Buscar Proveedor"
        isOpen={isProvModalOpen}
        onClose={() => setIsProvModalOpen(false)}
        selectedValue={provId}
        onSelect={setProvId}
        options={proveedores.map(p => ({ value: p.id, label: p.nombre, sublabel: `Documento: ${p.documento || 'No asignado'}`, icon: Receipt }))}
      />

      <ModalSelector
        title="Tipo de Documento"
        isOpen={isTipoModalOpen}
        onClose={() => setIsTipoModalOpen(false)}
        selectedValue={tipoFacturaId}
        onSelect={setTipoFacturaId}
        options={tiposFactura.map(p => ({ value: p.id.toString(), label: p.nombre, icon: Receipt }))}
      />

      <ModalSelector
        title={`Seleccionar Variante de ${maestroElegido ? maestroElegido.nombre : ''}`}
        isOpen={isVarianteModalOpen}
        onClose={() => setIsVarianteModalOpen(false)}
        closeOnSelect={false}
        selectedValue={varianteElegida?.id || ''}
        onSelect={(uid) => {
           const v = variantes.find(va => va.id === uid);
           if (!v) return;
           setVarianteElegida(v);
           
           setCarrito(prev => {
                const existe = prev.findIndex(x => x.variante.id === v.id);
                if (existe >= 0) {
                    toast.error("Ya está en el carrito. Ajusta la cantidad allí.");
                    return prev;
                }
                toast.success(`${v.nombre_variante} añadido al borrador.`);
                return [...prev, { variante: v, cantidad: cantidadInput > 0 ? cantidadInput : 1, precio_unitario: precioInput || 0 }];
           });
        }}
        options={(maestroElegido ? variantes.filter(v => v.producto_maestro_id === maestroElegido.id) : []).map(p => ({ value: p.id, label: p.nombre_variante, sublabel: `Unidad: ${p.unidad_base}`, icon: Box }))}
      />
      </>
      )}

    </div>
  );
}
