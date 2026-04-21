import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Box, Send, Clock, Scan, QrCode, ArrowRightLeft } from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { cn } from '../lib/utils';
import { BarcodeScanner } from '../components/ui/BarcodeScanner';
import { ModalSelector } from '../components/ui/ModalSelector';
import { Modal } from '../components/ui/Modal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function InventarioOperativo() {
  const { user } = useAuth();
  
  const [depositos, setDepositos] = useState<any[]>([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string>('');
  
  const [productosMaestros, setProductosMaestros] = useState<any[]>([]);
  const [variantes, setVariantes] = useState<any[]>([]);
  const [etiquetasLocales, setEtiquetasLocales] = useState<any[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'stock' | 'traslado'>('traslado');

  // Request Form
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ producto_id: '', cantidad: 1 });

  // Escaner
  const [scanInput, setScanInput] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Traslado Express
  const [trasladoOrigen, setTrasladoOrigen] = useState<string>('');
  const [trasladoMaestroId, setTrasladoMaestroId] = useState<string>('');
  const [trasladoProducto, setTrasladoProducto] = useState<string>('');
  const [trasladoCantidad, setTrasladoCantidad] = useState<number>(1);
  const [isTrasladando, setIsTrasladando] = useState(false);
  const [etiquetasOrigen, setEtiquetasOrigen] = useState<any[]>([]);
  const [trasladoEtiquetaId, setTrasladoEtiquetaId] = useState<string>('');
  const [isFraccionado, setIsFraccionado] = useState(false);

  // Modals UI
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [isOrigenModalOpen, setIsOrigenModalOpen] = useState(false);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [isVarModalOpen, setIsVarModalOpen] = useState(false);

  useEffect(() => {
    fetchBaseData();
    const interval = setInterval(() => {
      if(sectorSeleccionado) fetchDataRelacional();
    }, 15000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (sectorSeleccionado) fetchDataRelacional();
  }, [sectorSeleccionado]);

  useEffect(() => {
     if (trasladoProducto && trasladoOrigen) {
         executeAWSQuery(`SELECT id, cantidad_actual, medida_secundaria FROM Stock_Etiquetas WHERE variante_id='${trasladoProducto}' AND deposito_id=${trasladoOrigen} AND (estado='activo' OR estado IS NULL) AND cantidad_actual > 0`).then(res => {
            if(res) {
               setEtiquetasOrigen(res);
               if(res.length > 0) setTrasladoEtiquetaId(res[0].id.toString());
            } else { setEtiquetasOrigen([]); }
         });
     } else {
         setEtiquetasOrigen([]);
     }
  }, [trasladoProducto, trasladoOrigen]);

  const fetchBaseData = async () => {
    try {
      const [depRes, prodRes, varRes] = await Promise.all([
        executeAWSQuery("SELECT * FROM Stock_Depositos ORDER BY nombre"),
        executeAWSQuery("SELECT * FROM Stock_Productos_Maestros ORDER BY nombre"),
        executeAWSQuery("SELECT * FROM Stock_Variantes ORDER BY nombre_variante")
      ]);
      
      if (depRes && depRes.length > 0) {
        setDepositos(depRes);
        // Autofill
        const operacionales = depRes.filter((d:any) => d.tipo === 'mini_sector');
        if(operacionales.length > 0 && !sectorSeleccionado) {
           setSectorSeleccionado(operacionales[0].id.toString());
        }
        const centrales = depRes.filter((d:any) => d.tipo === 'central');
        if(centrales.length > 0 && !trasladoOrigen) {
           setTrasladoOrigen(centrales[0].id.toString());
        }
      }
      if (prodRes) setProductosMaestros(prodRes);
      if (varRes) setVariantes(varRes);
    } catch (e) { console.error(e); }
  };

  const fetchDataRelacional = async () => {
    if (!sectorSeleccionado) return;
    try {
      const [etiqRes, solRes] = await Promise.all([
        executeAWSQuery(`
          SELECT e.*, p.nombre as producto_nombre, v.nombre_variante as producto_sku, p.unidad_base as unidad, m.gramos_por_metro_lineal 
          FROM Stock_Etiquetas e
          INNER JOIN Stock_Variantes v ON e.variante_id = v.id
          INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
          LEFT JOIN wms_equivalencias_metricas m ON p.id = m.producto_maestro_id
          WHERE e.deposito_id = ${sectorSeleccionado} AND (e.estado = 'activo' OR e.estado IS NULL)
        `),
        executeAWSQuery(`
          SELECT TOP 20 s.*, 'Solicitud' as producto_nombre
          FROM Stock_Solicitudes s
          WHERE s.deposito_id = ${sectorSeleccionado}
          ORDER BY s.fecha_creacion DESC
        `)
      ]);
      setEtiquetasLocales(etiqRes);
      setSolicitudes(solRes);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleTrasladoExpress = async (e: React.FormEvent) => {
    e.preventDefault();
    const isLote = trasladoMaestroId && productosMaestros.find(p=>p.id===trasladoMaestroId)?.tipo_gestion === 'lote_individual';
    
    if(!trasladoOrigen || !sectorSeleccionado || !trasladoProducto) return;
    if(isLote && !trasladoEtiquetaId) {
        toast.error("Debe seleccionar un Lote/Rollo físico específico para trasladar.");
        return;
    }
    if(!isLote && trasladoCantidad <= 0) return;
    if(isLote && isFraccionado && trasladoCantidad <= 0) return;

    setIsTrasladando(true);

    try {
      let query = '';

      if (isLote) {
         if (!isFraccionado) {
             query = `
                DECLARE @LotQty DECIMAL(18,4);
                SELECT @LotQty = cantidad_actual FROM Stock_Etiquetas WHERE id = '${trasladoEtiquetaId}' AND deposito_id = ${trasladoOrigen};
                IF @LotQty IS NOT NULL
                BEGIN
                   UPDATE Stock_Etiquetas SET deposito_id = ${sectorSeleccionado} WHERE id = '${trasladoEtiquetaId}';
                   INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, usuario_id)
                   VALUES ('${trasladoEtiquetaId}', 'traslado_salida', @LotQty, ${trasladoOrigen}, ${sectorSeleccionado}, '${user?.id}');
                   SELECT 'OK' as status;
                END
                ELSE BEGIN SELECT 'NO_STOCK' as status; END
             `;
         } else {
             query = `
                DECLARE @LotQty DECIMAL(18,4);
                SELECT @LotQty = cantidad_actual FROM Stock_Etiquetas WHERE id = '${trasladoEtiquetaId}' AND deposito_id = ${trasladoOrigen};
                IF @LotQty IS NOT NULL AND @LotQty >= ${trasladoCantidad}
                BEGIN
                   UPDATE Stock_Etiquetas SET cantidad_actual = cantidad_actual - ${trasladoCantidad} WHERE id = '${trasladoEtiquetaId}';
                   
                   DECLARE @NuevoLoteId INT;
                   INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual)
                   VALUES (CONVERT(varchar(255), NEWID()), '${trasladoProducto}', ${sectorSeleccionado}, ${trasladoCantidad}, ${trasladoCantidad});
                   SET @NuevoLoteId = SCOPE_IDENTITY();
                   
                   INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, usuario_id)
                   VALUES ('${trasladoEtiquetaId}', 'fraccionamiento_salida', ${trasladoCantidad}, ${trasladoOrigen}, ${sectorSeleccionado}, '${user?.id}');
                   
                   INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, usuario_id)
                   VALUES (@NuevoLoteId, 'fraccionamiento_ingreso', ${trasladoCantidad}, ${trasladoOrigen}, ${sectorSeleccionado}, '${user?.id}');
                   
                   SELECT 'OK' as status;
                END
                ELSE BEGIN SELECT 'NO_STOCK' as status; END
             `;
         }
      } else {
         query = `
            DECLARE @Remaining DECIMAL(18,4) = ${trasladoCantidad};
            DECLARE @TotalAvailable DECIMAL(18,4);
            
            SELECT @TotalAvailable = SUM(cantidad_actual) FROM Stock_Etiquetas 
            WHERE variante_id = '${trasladoProducto}' AND deposito_id = ${trasladoOrigen} AND (estado = 'activo' OR estado IS NULL) AND cantidad_actual > 0;
            
            IF @TotalAvailable IS NULL OR @TotalAvailable < @Remaining
            BEGIN
               SELECT 'NO_STOCK' as status;
               RETURN;
            END
            
            -- Generar etiqueta unica destino en lugar de fusionar
            DECLARE @LabelDestino INT;
            INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual)
            VALUES (CONVERT(varchar(255), NEWID()), '${trasladoProducto}', ${sectorSeleccionado}, ${trasladoCantidad}, ${trasladoCantidad});
            SET @LabelDestino = SCOPE_IDENTITY();
            
            DECLARE @CurrentLabel INT;
            DECLARE @CurrentQty DECIMAL(18,4);
            
            DECLARE cur CURSOR LOCAL FOR 
               SELECT id, cantidad_actual FROM Stock_Etiquetas 
               WHERE variante_id = '${trasladoProducto}' AND deposito_id = ${trasladoOrigen} AND (estado = 'activo' OR estado IS NULL) AND cantidad_actual > 0
               ORDER BY id ASC;
               
            OPEN cur;
            FETCH NEXT FROM cur INTO @CurrentLabel, @CurrentQty;
            
            WHILE @@FETCH_STATUS = 0 AND @Remaining > 0
            BEGIN
               DECLARE @ToDeduct DECIMAL(18,4);
               IF @CurrentQty >= @Remaining
                  SET @ToDeduct = @Remaining;
               ELSE
                  SET @ToDeduct = @CurrentQty;
                  
               UPDATE Stock_Etiquetas SET cantidad_actual = cantidad_actual - @ToDeduct WHERE id = @CurrentLabel;
               
               INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, usuario_id)
               VALUES (@CurrentLabel, 'traslado_salida', @ToDeduct, ${trasladoOrigen}, ${sectorSeleccionado}, '${user?.id}');
               
               INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, usuario_id)
               VALUES (@LabelDestino, 'traslado_ingreso', @ToDeduct, ${trasladoOrigen}, ${sectorSeleccionado}, '${user?.id}');
               
               SET @Remaining = @Remaining - @ToDeduct;
               FETCH NEXT FROM cur INTO @CurrentLabel, @CurrentQty;
            END
            
            CLOSE cur;
            DEALLOCATE cur;
            
            SELECT 'OK' as status;
         `;
      }
      
      const res = await executeAWSQuery(query);
      if(res && res[0] && res[0].status === 'NO_STOCK') {
         toast.error("Error: No hay stock suficiente de ese producto en el Almacén de origen para trasladar esa cantidad.");
      } else {
         toast.success("¡Traslado completado en milisegundos a prueba de tontos!");
         setTrasladoCantidad(1);
         fetchDataRelacional();
      }

    } catch (e: any) {
      toast.error("Falla técnica: " + e.message);
    } finally {
      setIsTrasladando(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-blue-950 dark:text-white tracking-tighter">Sectores y Traslados</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Movimientos internos de inventario hacia Puntos de Venta o Talleres.</p>
        </div>
        <div className="w-80">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Sector Actual de Trabajo</label>
          <button 
             type="button"
             onClick={() => setIsSectorModalOpen(true)}
             className="input-nexus w-full mt-1 flex items-center justify-between text-left h-[46px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
             <span className="font-black text-sm text-blue-950 dark:text-white truncate">
                {sectorSeleccionado ? depositos.find(d => d.id.toString() === sectorSeleccionado)?.nombre : "Tocar para cambiar..."}
             </span>
          </button>
        </div>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'traslado', label: 'Trasladar Mercadería' },
          { id: 'stock', label: 'Ver Existencias del Sector' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all",
              activeTab === tab.id 
                ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'traslado' && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-nexus p-10 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20 border-2 border-indigo-100 dark:border-indigo-900/30">
            <div className="max-w-2xl mx-auto">
               <div className="flex items-center gap-4 mb-8 justify-center flex-col text-center">
                  <div className="w-16 h-16 bg-white dark:bg-indigo-900/50 rounded-2xl shadow-xl shadow-indigo-200/50 dark:shadow-none flex items-center justify-center">
                     <ArrowRightLeft className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-indigo-950 dark:text-white">Motor de Traslados Internos</h2>
                    <p className="text-slate-500 dark:text-indigo-200/70 text-sm font-bold">Extrae mercancía de tu almacén maestro y reabastece otros sectores al instante.</p>
                  </div>
               </div>

               <form className="space-y-6 bg-white dark:bg-slate-950 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800" onSubmit={handleTrasladoExpress}>
                  <div className="grid grid-cols-2 gap-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/50 dark:border-slate-800">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">De <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">Resta Stock</span></label>
                        <button 
                           type="button"
                           onClick={() => setIsOrigenModalOpen(true)}
                           className="input-nexus w-full flex items-center justify-between text-left h-[46px] bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/50"
                        >
                           <span className="font-bold text-sm text-indigo-950 dark:text-indigo-100 truncate">
                              {trasladoOrigen ? depositos.find(d => d.id.toString() === trasladoOrigen)?.nombre : "Tocar para Origen..."}
                           </span>
                        </button>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">Hacia <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 rounded">Suma Stock</span></label>
                        <input className="input-nexus w-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-bold opacity-80 cursor-not-allowed" disabled value={depositos.find(d => d.id.toString() === sectorSeleccionado)?.nombre || 'Sector...'} />
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">1. Seleccionar Tipo de Producto General</label>
                       <button 
                          type="button"
                          onClick={() => setIsProdModalOpen(true)}
                          className="input-nexus w-full flex items-center justify-between text-left h-[52px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                       >
                          <span className={trasladoMaestroId ? "font-bold text-lg text-slate-900 dark:text-white" : "text-slate-400 font-bold"}>
                             {trasladoMaestroId ? productosMaestros.find(p=>p.id===trasladoMaestroId)?.nombre : "Tocar para buscar Maestro..."}
                          </span>
                       </button>
                     </div>
                     
                     {trasladoMaestroId && (
                       <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2">
                         <label className="text-[10px] font-black uppercase text-blue-600 tracking-widest pl-1">2. Opciones Disponibles (Talle/Color)</label>
                         <button 
                            type="button"
                            onClick={() => setIsVarModalOpen(true)}
                            className="input-nexus w-full flex items-center justify-between text-left h-[46px] bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-900/50"
                         >
                            <span className={trasladoProducto ? "font-black text-sm text-blue-950 dark:text-blue-100" : "text-blue-600 font-bold"}>
                               {trasladoProducto ? variantes.find(v=>v.id===trasladoProducto)?.nombre_variante : "Tocar para Variante..."}
                            </span>
                         </button>
                       </motion.div>
                     )}
                  </div>

                  {(() => {
                      const isLote = trasladoMaestroId && productosMaestros.find(p=>p.id===trasladoMaestroId)?.tipo_gestion === 'lote_individual';
                      
                      if(isLote && trasladoProducto) {
                         return (
                            <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-4 bg-amber-50/50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-200/50 dark:border-amber-900/30">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-amber-600 tracking-widest flex items-center justify-between">
                                     <span>3. Seleccionar Lote Único a Retirar</span>
                                     <span className="bg-amber-200 text-amber-800 px-2 rounded-md py-0.5">Rollo Físico</span>
                                  </label>
                                  <select 
                                     className="input-nexus w-full h-[46px] border-amber-200 bg-white dark:bg-slate-900 dark:border-amber-900/50 font-bold" 
                                     value={trasladoEtiquetaId} 
                                     onChange={e => setTrasladoEtiquetaId(e.target.value)}
                                  >
                                     <option value="">Seleccione Lote Físico...</option>
                                     {etiquetasOrigen.map(et => (
                                        <option key={et.id} value={et.id}>Lote/Rollo #{et.id} - Saldo: {et.cantidad_actual}</option>
                                     ))}
                                  </select>
                               </div>
                               
                               <div className="flex items-center gap-2 pt-2">
                                  <input 
                                     type="checkbox" 
                                     id="fraccionarLote" 
                                     checked={isFraccionado}
                                     onChange={e => setIsFraccionado(e.target.checked)}
                                     className="w-4 h-4 text-amber-600 border-amber-300 rounded focus:ring-amber-500"
                                  />
                                  <label htmlFor="fraccionarLote" className="text-xs font-bold text-amber-700 dark:text-amber-500">Recortar o Fraccionar Lote (Dejar resto original)</label>
                               </div>

                               {isFraccionado && (
                                  <div className="space-y-2 pt-2">
                                     <label className="text-[10px] font-black uppercase text-amber-600 tracking-widest">Kilos a Recortar (Fracción)</label>
                                     <input type="number" min="0.01" step="0.01" value={trasladoCantidad} onChange={e=>setTrasladoCantidad(Number(e.target.value))} className="input-nexus w-full text-3xl font-black h-16 text-center text-amber-950 dark:text-amber-100 border-amber-300 dark:border-amber-700" />
                                  </div>
                               )}
                            </motion.div>
                         );
                      }
                      
                      return (
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cantidad Total a mover</label>
                           <input type="number" min="0.01" step="0.01" value={trasladoCantidad} onChange={e=>setTrasladoCantidad(Number(e.target.value))} className="input-nexus w-full text-3xl font-black h-16 text-center text-blue-950 dark:text-white" />
                        </div>
                      );
                  })()}

                  <button disabled={isTrasladando} type="submit" className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xl shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3">
                     {isTrasladando ? 'Viajando por la base de datos...' : '¡EJECUTAR TRASLADO INMEDIATO!'}
                  </button>
               </form>
            </div>
         </motion.div>
      )}

      {activeTab === 'stock' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card-nexus p-0 overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-900 flex justify-between items-center bg-slate-50/30 dark:bg-slate-900/30">
            <h3 className="font-black text-blue-950 dark:text-white tracking-tight">Etiquetas en Ubicación Local</h3>
            <button onClick={() => setIsRequestModalOpen(true)} className="btn-primary text-xs py-2 h-auto flex gap-2"><Send className="w-3.5 h-3.5"/> Pedir Insumos</button>
          </div>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-900">
                <th className="px-8 py-5">Producto / SKU</th>
                <th className="px-8 py-5 text-right">Saldo Físico Operativo</th>
                <th className="px-8 py-5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
              {etiquetasLocales.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-8 py-10 text-center text-slate-500 font-bold">No hay stock asignado a este sector.</td>
                </tr>
              )}
              {etiquetasLocales.map((et) => (
                <tr key={et.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                  <td className="px-8 py-6">
                    <p className="font-black text-sm text-blue-950 dark:text-white">{et.producto_nombre}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{et.producto_sku}</p>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-xl text-blue-600 dark:text-blue-400">
                    <div>
                      {et.cantidad_actual}
                      <span className="text-[10px] font-bold text-slate-400 uppercase ml-1">{et.unidad}</span>
                    </div>
                    {et.gramos_por_metro_lineal && et.unidad === 'kg' && (
                      <div className="text-[10px] font-black tracking-[0.1em] text-emerald-500 mt-1 dark:text-emerald-400">
                        ≈ {(et.cantidad_actual / (et.gramos_por_metro_lineal / 1000)).toFixed(2)} Mts
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">Apto Uso</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}

      <ModalSelector
         title="Cambiar Sector Activo"
         isOpen={isSectorModalOpen}
         onClose={() => setIsSectorModalOpen(false)}
         selectedValue={sectorSeleccionado}
         onSelect={setSectorSeleccionado}
         options={depositos.filter(d=>d.tipo==='mini_sector').map(d => ({ value: d.id.toString(), label: d.nombre, icon: Box }))}
      />

      <ModalSelector
         title="Origen Central de Traslado"
         isOpen={isOrigenModalOpen}
         onClose={() => setIsOrigenModalOpen(false)}
         selectedValue={trasladoOrigen}
         onSelect={setTrasladoOrigen}
         options={depositos.filter(d=>d.tipo==='central').map(d => ({ value: d.id.toString(), label: d.nombre, icon: Box }))}
      />

      <ModalSelector
         title="Buscar Artículo Principal"
         isOpen={isProdModalOpen}
         onClose={() => setIsProdModalOpen(false)}
         selectedValue={trasladoMaestroId}
         onSelect={(id) => { setTrasladoMaestroId(id); setTrasladoProducto(''); }}
         options={productosMaestros.map(p => ({ value: p.id, label: p.nombre, sublabel: p.sku || 'Sin SKU Maestro', icon: Scan }))}
      />

      <ModalSelector
         title="Variante Operativa"
         isOpen={isVarModalOpen}
         onClose={() => setIsVarModalOpen(false)}
         selectedValue={trasladoProducto}
         onSelect={setTrasladoProducto}
         options={variantes.filter(v => v.producto_maestro_id.toString() === trasladoMaestroId).map(v => ({ value: v.id, label: v.nombre_variante, icon: Box }))}
      />
    </div>
  );
}
