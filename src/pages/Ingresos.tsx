import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, Receipt, Plus, Package, Box, ChevronLeft } from 'lucide-react';
import { ComprasDashboard } from '../components/gestion/ComprasDashboard';
import { executeAWSQuery } from '../lib/aws-client';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { ModalSelector } from '../components/ui/ModalSelector';
import { CategoryDrillDownModal } from '../components/ui/CategoryDrillDownModal';
import { Modal } from '../components/ui/Modal';
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
  const [tipoIngreso, setTipoIngreso] = useState<'compra' | 'importaciones'>('compra');
  const [provId, setProvId] = useState('');
  const [tipoFacturaId, setTipoFacturaId] = useState('');
  const [referencia, setReferencia] = useState('');
  const [gastosExtras, setGastosExtras] = useState<string>('');
  const [monedas, setMonedas] = useState<any[]>([]);
  const [monedaId, setMonedaId] = useState<string>('1');
  
  // Dashboard State
  const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
  const [editingDraftId, setEditingDraftId] = useState<string|null>(null);

  // Detalle Compra
  const [isHeaderExpanded, setIsHeaderExpanded] = useState(true);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
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
      const [provs, tiposF, cats, vars, deps, maestRes, monRes] = await Promise.all([
        executeAWSQuery("SELECT * FROM Stock_Proveedores ORDER BY nombre"),
        executeAWSQuery("SELECT * FROM Stock_TiposFactura ORDER BY nombre"),
        executeAWSQuery("SELECT * FROM Stock_Categorias ORDER BY nombre"),
        executeAWSQuery("SELECT v.*, p.nombre as producto_padre, p.categoria_id, p.unidad_base FROM Stock_Variantes v INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id ORDER BY p.nombre, v.nombre_variante"),
        executeAWSQuery("SELECT id FROM Stock_Depositos WHERE tipo='central' ORDER BY id ASC"),
        executeAWSQuery("SELECT * FROM Stock_Productos_Maestros ORDER BY nombre"),
        executeAWSQuery("SELECT * FROM Stock_Monedas ORDER BY id")
      ]);
      if(provs) setProveedores(provs);
      if(tiposF) setTiposFactura(tiposF);
      if(cats) setCategorias(cats);
      if(maestRes) setMaestros(maestRes);
      if(monRes) setMonedas(monRes);
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

  const guardarCompra = async (esDraft: boolean = false) => {
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
            const estado = esDraft ? 'pre-compra' : 'pendiente';
            const valGastos = parseFloat(gastosExtras) || 0;
            
            q += `
               IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Stock_Compras_Costos_Extra]') AND type in (N'U'))
               BEGIN
                   CREATE TABLE Stock_Compras_Costos_Extra (
                       id INT IDENTITY(1,1) PRIMARY KEY,
                       compra_id UNIQUEIDENTIFIER NOT NULL,
                       descripcion VARCHAR(255) NOT NULL,
                       monto DECIMAL(18,2) NOT NULL,
                       fecha DATETIME DEFAULT GETDATE(),
                       FOREIGN KEY (compra_id) REFERENCES Stock_Compras(id)
                   );
               END
            `;

            if (editingDraftId) {
                q += `
                   UPDATE Stock_Compras SET proveedor_id = '${provId}', referencia_factura = '${referencia}', tipo_factura_id = ${tipoFacturaId}, total_compra = ${total}, gastos_extras = ${valGastos}, estado = '${estado}', moneda_id = ${monedaId} WHERE id = '${editingDraftId}';
                   DELETE FROM Stock_Compras_Detalle WHERE compra_id = '${editingDraftId}';
                   DECLARE @CompraId UNIQUEIDENTIFIER = '${editingDraftId}';
                `;
            } else {
                q += `
                   IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'estado' AND Object_ID = Object_ID(N'Stock_Compras'))
                   BEGIN
                       ALTER TABLE Stock_Compras ADD estado VARCHAR(50) DEFAULT 'pendiente';
                   END
                   DECLARE @CompraId UNIQUEIDENTIFIER = NEWID();
                   INSERT INTO Stock_Compras (id, proveedor_id, referencia_factura, tipo_factura_id, total_compra, creado_por, estado, gastos_extras, moneda_id)
                   VALUES (@CompraId, '${provId}', '${referencia}', ${tipoFacturaId}, ${total}, '${user?.id}', '${estado}', ${valGastos}, ${monedaId});
                `;
            }
            
            if (!editingDraftId && valGastos > 0) {
                q += `
                   INSERT INTO Stock_Compras_Costos_Extra (compra_id, descripcion, monto) 
                   VALUES (@CompraId, 'Gasto Inicial Automático', ${valGastos});
                `;
            }
        }

        // Detalles y Stock físico
        for(const item of carrito) {
            if (tipoIngreso === 'compra') {
                q += `
                   INSERT INTO Stock_Compras_Detalle (compra_id, variante_id, cantidad, precio_unitario)
                   VALUES (@CompraId, '${item.variante.id}', ${item.cantidad}, ${item.precio_unitario});
                `;
            } else {
                // Logica exclusiva para Ajuste Libre
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
            toast.success(esDraft ? "Borrador de Compra guardado" : "¡Compra Registrada Formalmente!");
            setViewMode('list');
        } else {
            toast.success("¡Ajuste Libre Registrado. Stock Actualizado!");
        }
        
        // Reset
        setProvId(''); setReferencia(''); setTipoFacturaId('');
        setCarrito([]);
        setEditingDraftId(null);
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
                {tipoIngreso === 'compra' ? 'Compras' : 'Ajustes de Inventario'}
            </h1>
            <p className="text-slate-500 font-medium">{tipoIngreso === 'compra' ? 'Gestiona tus pre-compras, seguimiento logístico y recibos.' : 'Asienta remitos y facturas o haz ingresos libres directo al almacén.'}</p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900 overflow-hidden p-1 rounded-xl">
            <button onClick={() => setTipoIngreso('compra')} className={cn("px-6 py-2.5 rounded-lg text-sm font-bold transition-all", tipoIngreso === 'compra' ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-blue-400 shadow-sm" : "text-slate-500")}>
                Compra Formal
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

      {tipoIngreso === 'compra' && (
             tipoIngreso === 'compra' && viewMode === 'list' ? (
                 <ComprasDashboard 
                     onCreateClick={() => {
                     setCarrito([]);
                     setProvId('');
                     setReferencia('');
                     setTipoFacturaId('');
                     setEditingDraftId(null);
                     setViewMode('form');
                 }}
                 onEditDraft={async (compra) => {
                     setProvId(compra.proveedor_id);
                     setReferencia(compra.referencia_factura);
                     setTipoFacturaId(compra.tipo_factura_id?.toString() || '');
                     setGastosExtras(compra.gastos_extras?.toString() || '');
                     setEditingDraftId(compra.id);
                     
                     const res = await executeAWSQuery(`SELECT d.*, v.nombre_variante, p.nombre as producto_padre, p.unidad_base FROM Stock_Compras_Detalle d INNER JOIN Stock_Variantes v ON d.variante_id = v.id INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id WHERE d.compra_id = '${compra.id}'`);
                     if(res) {
                         setCarrito(res.map((d: any) => ({
                             variante: {
                                 id: d.variante_id,
                                 nombre_variante: d.nombre_variante,
                                 producto_padre: d.producto_padre,
                                 unidad_base: d.unidad_base
                             },
                             cantidad: d.cantidad,
                             precio_unitario: d.precio_unitario
                         })));
                     }
                     setViewMode('form');
                 }} 
             />
          ) : (
             <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}}>
                 {tipoIngreso === 'compra' && (
                     <button onClick={() => setViewMode('list')} className="mb-4 pt-2 text-indigo-600 font-black text-sm flex items-center gap-1 hover:underline">
                         <ChevronLeft className="w-4 h-4"/> Volver al Panel de Compras
                     </button>
                 )}
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
                {/* COMPRA FORMAL - MONOLITHIC INVOICE */}
        <div className="lg:col-span-12 space-y-6 w-full mx-auto w-full px-4">
            
            {/* Cabecera / Documento de Facturación */}
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-5 py-3 flex justify-between items-center bg-slate-50 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-black shadow-sm">
                            <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 leading-none">Datos del Documento</h3>
                            <p className="text-[10px] text-slate-500 font-medium">Registra información fiscal o de remito</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest pl-1">Proveedor / Vendedor</label>
                            <button 
                                type="button" 
                                onClick={() => setIsProvModalOpen(true)}
                                className="w-full flex items-center justify-between bg-white border-2 border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg text-left transition-colors shadow-sm"
                            >
                                <span className={provId ? "font-bold text-slate-800 text-sm" : "text-slate-400 font-medium text-sm"}>
                                    {provId ? proveedores.find(p=>p.id===provId)?.nombre : "Tocar para Seleccionar Proveedor"}
                                </span>
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest pl-1">Documento Comercial</label>
                            <button 
                                type="button" 
                                onClick={() => setIsTipoModalOpen(true)}
                                className="w-full flex items-center justify-between bg-white border-2 border-slate-200 hover:border-slate-300 px-3 py-2 rounded-lg text-left transition-colors shadow-sm"
                            >
                                <span className={tipoFacturaId ? "font-bold text-slate-800 text-sm" : "text-slate-400 font-medium text-sm"}>
                                    {tipoFacturaId ? tiposFactura.find(p=>p.id.toString()===tipoFacturaId)?.nombre : "Tocar para Elegir Comprobante"}
                                </span>
                            </button>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest pl-1">
                                Nº Referencia Asoc. (Remito/Tkt)
                            </label>
                            <input 
                                type="text"
                                placeholder="A-0001-090234"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-sm uppercase transition-colors focus:border-indigo-400 shadow-sm outline-none"
                                value={referencia}
                                onChange={e=>setReferencia(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest pl-1">Moneda Base</label>
                            <select 
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm text-slate-800 transition-colors focus:border-indigo-400 shadow-sm outline-none cursor-pointer"
                                value={monedaId}
                                onChange={e=>setMonedaId(e.target.value)}
                            >
                                {monedas.map(m => <option key={m.id} value={m.id}>{m.codigo} ({m.simbolo})</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase text-slate-500 tracking-widest pl-1">Costos Extras</label>
                            <input 
                                type="number"
                                placeholder="0.00"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-sm text-rose-600 transition-colors focus:border-indigo-400 shadow-sm outline-none"
                                value={gastosExtras}
                                onChange={e=>setGastosExtras(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Facturador Gigante Central */}
            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50">
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Facturador</h3>
                        <p className="text-[10px] text-slate-500 font-bold">Declara las cantidades y el costo de lote.</p>
                    </div>
                    <button onClick={() => { setIsCatalogModalOpen(true); setMaestroElegido(null); }} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-transform hover:scale-[1.02] flex items-center gap-2 text-xs uppercase tracking-widest leading-none">
                        <Plus className="w-4 h-4"/> AÑADIR PRODUCTOS
                    </button>
                </div>
                
                {carrito.length === 0 ? (
                    <div className="p-8 flex flex-col items-center justify-center text-slate-400">
                        <ShoppingCart className="w-10 h-10 opacity-10 mb-2"/>
                        <p className="font-bold text-sm text-slate-500">Este comprobante está vacío.</p>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm text-center">Presiona el botón de Añadir Productos para armar el lote de registro para tu historial contable.</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-2 bg-white">
                        {/* Cabecera Tabla Fake */}
                        <div className="hidden md:grid grid-cols-12 gap-4 px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                             <div className="col-span-1">Action</div>
                             <div className="col-span-5">Producto Asentado</div>
                             <div className="col-span-2 text-center">Cantidad Recibida</div>
                             <div className="col-span-2 text-right">Costo Unit ($)</div>
                             <div className="col-span-2 text-right">Subtotal</div>
                        </div>

                        {carrito.map((item, idx) => (
                            <div key={idx} className="bg-white p-3 md:px-4 md:py-2 rounded-xl border border-slate-100 hover:border-slate-300 transition-colors flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-3 relative group">
                                <div className="hidden md:flex col-span-1 justify-center">
                                    <button onClick={()=>eliminarDelCarrito(idx)} className="text-slate-300 hover:text-rose-500 transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-rose-50 font-black">X</button>
                                </div>
                                <div className="col-span-5 flex items-center gap-4">
                                     <button onClick={()=>eliminarDelCarrito(idx)} className="md:hidden text-slate-300 hover:text-rose-500 transition-colors font-black">X</button>
                                     <div>
                                        <p className="font-bold text-sm text-slate-800 leading-none">{item.variante.producto_padre}</p>
                                        {item.variante.nombre_variante && (
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 bg-slate-100 px-2 py-0.5 rounded inline-block">
                                                {item.variante.nombre_variante}
                                            </p>
                                        )}
                                     </div>
                                </div>
                                <div className="col-span-2 flex justify-center">
                                    <div className="flex items-center gap-2 w-full max-w-[120px]">
                                        <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            placeholder="Cant."
                                            className="w-full bg-slate-50 text-slate-900 border border-slate-200 px-2 py-1.5 rounded-lg font-bold text-sm outline-none text-center focus:border-indigo-400 transition-colors"
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
                                        className="w-full max-w-[120px] bg-slate-50 text-emerald-700 border border-slate-200 px-2 py-1.5 rounded-lg font-bold text-sm outline-none text-right focus:border-emerald-400 transition-colors"
                                        value={item.precio_unitario || ''}
                                        onChange={(e) => {
                                            const nc = [...carrito];
                                            nc[idx].precio_unitario = Number(e.target.value);
                                            setCarrito(nc);
                                        }}
                                    />
                                </div>
                                <div className="col-span-2 flex justify-end">
                                    <p className="font-bold text-sm text-slate-800">${((item.cantidad || 0) * (item.precio_unitario || 0)).toFixed(2)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="px-5 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="text-center md:text-left">
                            <span className="text-[11px] font-black uppercase text-slate-400 tracking-widest block mb-1">Total Declarado A Pagar</span>
                            <span className="text-3xl font-black text-emerald-600 tracking-tighter">${carrito.reduce((acc, c) => acc + ((c.cantidad||0) * (c.precio_unitario||0)), 0).toFixed(2)}</span>
                        </div>
                        <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                           <button onClick={() => guardarCompra(true)} disabled={isProcesando} className="px-4 py-2.5 rounded-xl font-bold text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 transition whitespace-nowrap text-xs">
                               GUARDAR COMO BORRADOR
                           </button>
                           <button onClick={() => guardarCompra(false)} disabled={isProcesando} className="px-6 py-2.5 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 transition shadow text-sm whitespace-nowrap tracking-wide">
                               ASENTAR RECIBO OFICIAL
                           </button>
                        </div>
                    </div>
                </div>
            </div>
      </div>
      {/* Modals Globales del Formulario */}

      {/* MODAL DE EXPLORACIÓN DE PRODUCTOS (CATALOGO GLOBAL) */}
            <CategoryDrillDownModal onSelect={() => {}}
        title="Explorador de Catálogo Master"
        isOpen={isCatalogModalOpen}
        onClose={() => setIsCatalogModalOpen(false)}
        categorias={categorias}
        productos={variantes.map(v => ({
           id: v.id.toString(),
           nombre: v.nombre_variante ? `${v.producto_padre} (${v.nombre_variante})` : v.producto_padre,
           nombre_variante: v.nombre_variante,
           sku: v.sku,
           categoria_id: v.categoria_id,
           producto_maestro_id: v.producto_maestro_id,
           producto_nombre: v.producto_padre,
           unidad_base: v.unidad_base
        }))}
        multiSelect={true}
        onSelectMultiple={(ids) => {
           const nuevasVariantes = ids.map(id => {
               const v = variantes.find(va => va.id.toString() === id.toString());
               return { variante: {...v, producto_padre: v.producto_padre}, cantidad: 0, precio_unitario: 0 };
           });
           
           setCarrito(prev => {
               const filtradas = nuevasVariantes.filter(nv => !prev.some(p => p.variante.id === nv.variante.id));
               if (filtradas.length > 0) {
                   toast.success(`${filtradas.length} artículos añadidos a la factura.`);
               } else if (ids.length > 0) {
                   toast.error('Estos artículos ya están en la factura.');
               }
               return [...prev, ...filtradas];
           });
        }}
        activeItemIds={carrito.map(c => c.variante.id.toString())}
      />

      {tipoIngreso === 'compra' && (
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
      </motion.div>
      )
      )}
    </div>
  );
}
