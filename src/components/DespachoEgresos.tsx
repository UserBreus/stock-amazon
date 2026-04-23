import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowRightLeft, Scan, Box, Search, Trash2, Printer, CheckCircle, Zap, AlertCircle, Clock, Send, ArchiveX } from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { useAuth } from '../context/AuthContext';
import { BarcodeScanner } from './ui/BarcodeScanner';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { Modal } from './ui/Modal';
import { CategoryDrillDownModal } from './ui/CategoryDrillDownModal';

interface DespachoEgresosProps { initialOperationType?: 'traslado' | 'venta_consumo'; initialMode?: 'lote' | 'solicitudes' | 'historial'; }

export function DespachoEgresos({ initialOperationType = 'traslado', initialMode = 'lote' }: DespachoEgresosProps) {
  const { user, isAdminStock, isGerente } = useAuth();
  
  const [depositos, setDepositos] = useState<any[]>([]);
  const [mode, setMode] = useState<'lote' | 'solicitudes' | 'historial'>(initialMode);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [catalogCategorias, setCatalogCategorias] = useState<any[]>([]);
  const [catalogProductos, setCatalogProductos] = useState<any[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  
  // Lote state
  const [cart, setCart] = useState<any[]>([]);
  const [loadingCode, setLoadingCode] = useState(false);
  const [operationType, setOperationType] = useState<'traslado' | 'venta_consumo'>(initialOperationType);
  
  // Novedad: Origen y Destino explicitly defined
  const [origenId, setOrigenId] = useState<string>(user?.sucursal_activa_id?.toString() || '');
  const [destinoId, setDestinoId] = useState<string>('');
  
  const [isExecuting, setIsExecuting] = useState(false);
  const [remitoPDFInfo, setRemitoPDFInfo] = useState<any>(null);

  // Historial state
  const [historial, setHistorial] = useState<any[]>([]);
  
  // Solicitudes state
  const [solicitudes, setSolicitudes] = useState<any[]>([]);

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    setOperationType(initialOperationType);
    setMode(initialMode);
  }, [initialOperationType, initialMode]);

  useEffect(() => {
     if(mode === 'historial') fetchHistorial();
     if(mode === 'solicitudes') fetchSolicitudes();
  }, [mode]);

  const fetchBaseData = async () => {
    try {
      const depRes = await executeAWSQuery("SELECT * FROM Stock_Depositos ORDER BY nombre");
      if (depRes) setDepositos(depRes);
    } catch(e) {}
  };

  const fetchHistorial = async () => {
      try {
         const res = await executeAWSQuery(`
            SELECT TOP 50 m.id, m.fecha, m.tipo_movimiento, m.cantidad_afectada,
                   e.codigo_barras, v.nombre_variante, pm.nombre as producto_nombre,
                   o.nombre as ori_nombre, d.nombre as des_nombre,
                   (SELECT cantidad_actual FROM Stock_Etiquetas WHERE variante_id = e.variante_id AND deposito_id = m.deposito_destino_id) as alert_saldo_destino
            FROM Stock_Movimientos m
            INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
            INNER JOIN Stock_Variantes v ON e.variante_id = v.id
            INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
            LEFT JOIN Stock_Depositos o ON m.deposito_origen_id = o.id
            LEFT JOIN Stock_Depositos d ON m.deposito_destino_id = d.id
            WHERE m.tipo_movimiento LIKE '%traslado%' OR m.tipo_movimiento LIKE '%egreso%'
            ORDER BY m.fecha DESC
         `);
         if(res) setHistorial(res);
      } catch(e) {}
  };

  const fetchSolicitudes = async () => {
      try {
         setSolicitudes([]); 
      } catch(e) {}
  };

  const processBarcodeCart = async (code: string) => {
     if(!code.trim()) return;
     if(!origenId) return toast.error("Seleccione un Origen Logístico primero.");
     
     setLoadingCode(true);
     try {
         const res = await executeAWSQuery(`
            SELECT e.*, v.nombre_variante, pm.nombre as producto_nombre, d.nombre as deposito_nombre
            FROM Stock_Etiquetas e
            INNER JOIN Stock_Variantes v ON e.variante_id = v.id
            INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
            LEFT JOIN Stock_Depositos d ON e.deposito_id = d.id
            WHERE e.codigo_barras = '${code.trim()}'
         `);
         if(res && res.length > 0) {
            const etq = res[0];
            if(etq.cantidad_actual <= 0) {
               toast.error("Esta etiqueta está agotada (sin saldo).");
            } else if (etq.deposito_id?.toString() !== origenId) {
               toast.error(`ERROR CATASTRÓFICO: La etiqueta escaneada pertenece físicamente a "${etq.deposito_nombre}", no a tu Origen seleccionado. Movimiento Bloqueado!`);
            } else if (cart.find(c => c.id === etq.id)) {
               toast.error("La etiqueta ya está en la bandeja");
            } else {
               setCart([{...etq, isBulk: false, cantidad_a_extraer: ''}, ...cart]);
               toast.success("Lote cargado");
            }
         } else {
            toast.error("Código no encontrado");
         }
     } catch (e: any) {
         toast.error("Error al buscar: " + e.message);
     } finally {
         setLoadingCode(false);
         setScanInput('');
     }
  };

  
  const openCatalog = async () => {
      if(!origenId) return toast.error("Seleccione un Origen Logístico primero.");
      setIsLoadingCatalog(true);
      try {
          const catRes = await executeAWSQuery("SELECT id, nombre FROM Stock_Categorias ORDER BY nombre");
          const prodRes = await executeAWSQuery(`
              SELECT v.id, 
                     v.nombre_variante,
                     v.nombre_variante as nombre,
                     pm.id as producto_maestro_id, pm.nombre as producto_nombre, pm.categoria_id,
                     COALESCE((SELECT CAST(SUM(cantidad_actual) AS INT) FROM Stock_Etiquetas WHERE variante_id = v.id AND deposito_id = ${origenId} AND estado = 'activo'), 0) as stock_total
              FROM Stock_Variantes v
              INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
              WHERE EXISTS (
                 SELECT 1 FROM Stock_Etiquetas e WHERE e.variante_id = v.id AND e.deposito_id = ${origenId} AND e.estado = 'activo'
              )
          `);
          setCatalogCategorias(catRes || []);
          setCatalogProductos(prodRes || []);
          setIsCatalogOpen(true);
      } catch (e: any) {
          toast.error("Error cargando catálogo: " + e.message);
      } finally {
          setIsLoadingCatalog(false);
      }
  };

  const handleCatalogSelection = async (varianteId: string) => {
      setLoadingCode(true);
      try {
          const res = await executeAWSQuery(`
              SELECT v.id as variante_id, v.nombre_variante, pm.nombre as producto_nombre, d.nombre as deposito_nombre,
                     SUM(e.cantidad_actual) as cantidad_total
              FROM Stock_Variantes v
              INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
              INNER JOIN Stock_Etiquetas e ON e.variante_id = v.id
              LEFT JOIN Stock_Depositos d ON e.deposito_id = d.id
              WHERE e.variante_id = ${varianteId} AND e.deposito_id = ${origenId} AND e.cantidad_actual > 0 AND e.estado = 'activo'
              GROUP BY v.id, v.nombre_variante, pm.nombre, d.nombre
          `);
          if(res && res.length > 0) {
              const bulkItem = res[0];
              const existingIndex = cart.findIndex(c => c.isBulk && c.variante_id === bulkItem.variante_id);
              if (existingIndex > -1) {
                 toast.error("Este producto ya está en el nivel de volumen del carrito.");
              } else {
                 setCart([{
                    id: 'BULK_' + bulkItem.variante_id,
                    isBulk: true,
                    variante_id: bulkItem.variante_id,
                    codigo_barras: 'GRANEL-AUTO',
                    producto_nombre: bulkItem.producto_nombre,
                    nombre_variante: bulkItem.nombre_variante,
                    cantidad_actual: bulkItem.cantidad_total,
                    cantidad_a_extraer: '',
                    deposito_id: origenId
                 }, ...cart]);
                 toast.success("Volumen de producto agregado al carrito");
              }
          } else {
              toast.error("No hay stock físico activo disponible de este producto.");
          }
      } catch(e: any) {
          toast.error("Fallo al obtener stock físico: " + e.message);
      } finally {
          setLoadingCode(false);
      }
  };

  const handleManualCodeSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     processBarcodeCart(scanInput);
  };

  const executeBatchOperation = async () => {
      if(cart.length === 0) return toast.error("La bandeja está vacía.");
      if(!origenId) return toast.error("Seleccione un Origen Logístico.");
      if(operationType === 'traslado' && !destinoId) return toast.error("Para traslados, seleccione el destino.");
      if(cart.some(c => !c.cantidad_a_extraer || Number(c.cantidad_a_extraer) <= 0 || Number(c.cantidad_a_extraer) > c.cantidad_actual)) return toast.error("Verifique las cantidades cargadas para extraer.");

      setIsExecuting(true);
      try {
          const isTransfer = operationType === 'traslado';
          let queries = [];
          
          let remitoId = 'NULL';
          if (isTransfer) {
              const remitoCode = 'REM-' + Date.now().toString().slice(-6) + Math.floor(Math.random()*100).toString();
              const destClean = Number(destinoId);
              queries.push(`
                  INSERT INTO wms_remitos_internos (numeracion, deposito_origen_id, deposito_destino_id, creado_por, estado) 
                  VALUES ('${remitoCode}', ${origenId}, ${destClean}, '${(user as any)?.id || ''}', 'EN_TRANSITO');
                  DECLARE @RemId INT = SCOPE_IDENTITY();
              `);
              remitoId = '@RemId';
          } else {
              queries.push("DECLARE @RemId INT = NULL;");
          }

          let labelsToPrint: any[] = [];
          const opNameOut = isTransfer ? 'traslado_salida' : 'egreso_final';
          const origenFijoSQL = origenId; 
          let queryVarCounter = 0;

          const pushQueriesForLot = (loteId: number, loteCodigo: string, allocQty: number, initialLoteQty: number, info: any) => {
              if (allocQty === initialLoteQty) {
                  if (isTransfer) {
                      queries.push(`
                          UPDATE Stock_Etiquetas SET deposito_id = ${destinoId} WHERE id = ${loteId};
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                          VALUES (${loteId}, '${opNameOut}', ${allocQty}, ${origenFijoSQL}, ${destinoId}, @RemId, '${(user as any)?.id || ''}');
                      `);
                  } else {
                      queries.push(`
                          UPDATE Stock_Etiquetas SET cantidad_actual = 0, estado = 'consumido' WHERE id = ${loteId};
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, remito_id, usuario_id)
                          VALUES (${loteId}, '${opNameOut}', ${allocQty}, ${origenFijoSQL}, @RemId, '${(user as any)?.id || ''}');
                      `);
                  }
              } else {
                  queries.push(`UPDATE Stock_Etiquetas SET cantidad_actual = cantidad_actual - ${allocQty} WHERE id = ${loteId};`);
                  if (isTransfer) {
                      const newCode = `${loteCodigo}-S${Math.floor(Math.random()*999)}`;
                      labelsToPrint.push({ codigo_barras: newCode, producto_nombre: info.producto_nombre, nombre_variante: info.nombre_variante, cantidad_actual: allocQty });
                      queryVarCounter++;
                      queries.push(`
                          DECLARE @NewLote_${queryVarCounter} INT;
                          INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, estado)
                          VALUES ('${newCode}', ${info.variante_id}, ${destinoId}, ${allocQty}, ${allocQty}, 'activo');
                          SET @NewLote_${queryVarCounter} = SCOPE_IDENTITY();
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                          VALUES (@NewLote_${queryVarCounter}, 'fraccionamiento_ingreso', ${allocQty}, ${origenFijoSQL}, ${destinoId}, @RemId, '${(user as any)?.id || ''}');
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                          VALUES (${loteId}, 'fraccionamiento_salida', ${allocQty}, ${origenFijoSQL}, ${destinoId}, @RemId, '${(user as any)?.id || ''}');
                      `);
                  } else {
                      queries.push(`
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, remito_id, usuario_id)
                          VALUES (${loteId}, '${opNameOut}', ${allocQty}, ${origenFijoSQL}, @RemId, '${(user as any)?.id || ''}');
                      `);
                  }
              }
          };

          const bulkVariants = cart.filter(c => c.isBulk).map(c => c.variante_id);
          let allBulkLabels: any[] = [];
          if (bulkVariants.length > 0) {
              const bRes = await executeAWSQuery(`
                 SELECT id, variante_id, cantidad_actual, codigo_barras 
                 FROM Stock_Etiquetas 
                 WHERE variante_id IN (${bulkVariants.join(',')}) AND deposito_id = ${origenId} AND cantidad_actual > 0 AND estado = 'activo'
                 ORDER BY id ASC
              `);
              if(bRes) allBulkLabels = bRes;
          }
          const manuallyScannedIds = cart.filter(c => !c.isBulk).map(c => c.id);

          for (let i = 0; i < cart.length; i++) {
              const item = cart[i];
              if (!item.isBulk) {
                  pushQueriesForLot(Number(item.id), item.codigo_barras, item.cantidad_a_extraer, item.cantidad_actual, item);
              } else {
                  let reqQty = item.cantidad_a_extraer;
                  let myLabels = allBulkLabels.filter(l => l.variante_id === item.variante_id && !manuallyScannedIds.includes(l.id));
                  
                  let bestFit = myLabels.find(l => l.cantidad_actual === reqQty);
                  if (bestFit) {
                      pushQueriesForLot(bestFit.id, bestFit.codigo_barras, reqQty, bestFit.cantidad_actual, item);
                      bestFit.cantidad_actual -= reqQty; 
                      reqQty = 0;
                  } else {
                      for (let lb of myLabels) {
                          if (reqQty <= 0) break;
                          if (lb.cantidad_actual <= 0) continue; 
                          
                          let draw = Math.min(lb.cantidad_actual, reqQty);
                          pushQueriesForLot(lb.id, lb.codigo_barras, draw, lb.cantidad_actual, item);
                          lb.cantidad_actual -= draw;
                          reqQty -= draw;
                      }
                  }

                  if (reqQty > 0) {
                     throw new Error(`Inconsistencia Lógica: No hay suficiente stock físico libre no-escaneado para completar la orden granel de ${item.producto_nombre}.`);
                  }
              }
          }

          if (isTransfer) { queries.push(`SELECT numeracion as rem_code FROM wms_remitos_internos WHERE id = @RemId;`); }

          const executeRes = await executeAWSQuery(`BEGIN TRY BEGIN TRANSACTION; ${queries.join('\n')} COMMIT TRANSACTION; END TRY BEGIN CATCH ROLLBACK TRANSACTION; THROW; END CATCH`);

          if (isTransfer) {
             setRemitoPDFInfo({ cart: [...cart], destino: depositos.find(d => d.id.toString() === destinoId)?.nombre || 'Ubicación', codigo: executeRes?.[0]?.rem_code || 'REM-0000', fecha: new Date().toLocaleString(), nuevasEtiquetas: labelsToPrint });
          }
          setCart([]);
          toast.success("Operación ejecutada con éxito.");
      } catch (err: any) {
          toast.error("Error: " + err.message);
      } finally { setIsExecuting(false); }
  };

  return (
    <div className="space-y-4 font-sans">
      
      {/* Navegación Modular (Motor Integral) */}
      <div className="flex flex-wrap gap-2 mb-6">
          {[
              { id: 'lote', icon: Box, label: 'Modo Multi-Lote (Remito)' },
              { id: 'solicitudes', icon: Send, label: 'Integración Solicitudes' },
              { id: 'historial', icon: Clock, label: 'Historial y Analítica' },
          ].map(tab => (
              <button 
                 key={tab.id} onClick={() => setMode(tab.id as any)}
                 className={cn("px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all", mode === tab.id ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30" : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400")}
              >
                  <tab.icon className="w-4 h-4" /> {tab.label}
              </button>
          ))}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm overflow-hidden">
          
          {/* MODO CARRITO LOTE */}
          {mode === 'lote' && (
              <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Panel Scan Left */}
                  <div className="col-span-1 lg:col-span-8 flex flex-col h-[65vh]">
                      <div className="flex gap-4 items-end mb-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                          <form onSubmit={handleManualCodeSubmit} className="flex-1 relative">
                             <Scan className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-500" />
                             <input type="text" autoFocus disabled={loadingCode || !origenId} value={scanInput} onChange={e=>setScanInput(e.target.value)}
                                className="w-full h-14 pl-12 bg-white dark:bg-slate-900 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-xl font-mono font-bold disabled:opacity-50"
                                placeholder={origenId ? "Escanear múltiples lotes..." : "Por favor pre-selecciona el Origen..."} />
                          </form>
                          <button type="button" onClick={openCatalog} disabled={isLoadingCatalog || !origenId} className="h-14 px-6 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-black rounded-xl disabled:opacity-50 flex items-center gap-2"><Search className="w-5 h-5"/> Catálogo</button>
                          <button onClick={() => setIsCameraOpen(true)} disabled={!origenId} className="h-14 px-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black rounded-xl disabled:opacity-50">Cámara</button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto custom-scrollbar border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/50 dark:bg-slate-950/20">
                          {cart.length === 0 ? ( <div className="h-full flex flex-col justify-center items-center opacity-40"><Box className="w-12 h-12 mb-2"/><p className="font-bold">Carrito Vacío</p></div> ) : (
                              <div className="space-y-3">
                                  {cart.map((item, idx) => (
                                     <div key={idx} className={cn("border p-4 rounded-xl flex items-center shadow-sm flex-col gap-3 transition-colors", Number(item.cantidad_a_extraer) > item.cantidad_actual ? "bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800")}>
                                         <div className="w-full flex items-center">
                                             <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2"><h4 className="font-black truncate">{item.producto_nombre}</h4><span className="bg-slate-100 dark:bg-slate-800 px-2 rounded text-[10px] font-bold">{item.nombre_variante}</span></div>
                                                <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-widest">{item.codigo_barras}</p>
                                             </div>
                                             <div className={cn("flex-shrink-0 mx-4 lg:mx-8 text-center px-3 py-1 rounded-lg border", Number(item.cantidad_a_extraer) > item.cantidad_actual ? "bg-rose-200 border-rose-300 dark:bg-rose-900/30" : "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-100 dark:border-emerald-800/50")}>
                                                <p className={cn("text-[9px] uppercase font-black tracking-widest", Number(item.cantidad_a_extraer) > item.cantidad_actual ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400")}>Disponible</p>
                                                <p className={cn("text-lg font-black leading-none", Number(item.cantidad_a_extraer) > item.cantidad_actual ? "text-rose-700 dark:text-rose-300" : "text-emerald-700 dark:text-emerald-300")}>{item.cantidad_actual}</p>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                <input type="number" step="0.01" max={item.cantidad_actual} value={item.cantidad_a_extraer} onChange={e=>{
                                                    const v = e.target.value === '' ? '' : Number(e.target.value);
                                                    setCart(cart.map(c=>c.id===item.id?{...c,cantidad_a_extraer:v}:c));
                                                }} className={cn("w-20 text-center font-black rounded-lg py-2 border focus:outline-none", Number(item.cantidad_a_extraer) > item.cantidad_actual ? "text-rose-600 bg-rose-50 border-rose-300 focus:ring-2 focus:ring-rose-500" : "text-emerald-600 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500")} />
                                                <button onClick={() => setCart(cart.filter(c=>c.id!==item.id))} className="p-3 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white"><Trash2 className="w-4 h-4"/></button>
                                             </div>
                                         </div>
                                         {Number(item.cantidad_a_extraer) > item.cantidad_actual && (
                                             <div className="w-full text-right mt-1">
                                                 <span className="bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-200 text-xs font-bold px-3 py-1.5 rounded border border-rose-200 dark:border-rose-800">
                                                     ⚠️ Operación no viable: No puedes retirar más unidades de la disponibilidad ({item.cantidad_actual} uds limitadas).
                                                 </span>
                                             </div>
                                         )}
                                     </div>
                                  ))}
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Panel Right Actions */}
                  <div className="col-span-1 lg:col-span-4 flex flex-col gap-4">
                     
                     {/* ORÍGEN LOGÍSTICO COMPONENT */}
                     <div className="bg-slate-50 dark:bg-slate-950 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 w-2 h-full bg-slate-200 dark:bg-slate-800"></div>
                         <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3 block flex items-center gap-2">
                            <Box className="w-3 h-3 text-slate-400"/> Origen de Extracción
                         </label>
                         <select 
                             disabled={!(isAdminStock || isGerente)}
                             value={origenId} 
                             onChange={e=>setOrigenId(e.target.value)} 
                             className={cn("w-full h-12 px-3 border border-slate-200 bg-white dark:bg-slate-900 dark:border-slate-800 rounded-xl mb-2 font-bold text-slate-900 dark:text-white outline-none", !(isAdminStock || isGerente) && "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed")}
                         >
                             <option value="" disabled>Seleccione Sucursal Logueada...</option>
                             {depositos.map(d=><option key={d.id} value={d.id}>{d.nombre}</option>)}
                         </select>
                         {!(isAdminStock || isGerente) && (
                            <p className="text-[9px] text-rose-500 uppercase font-black uppercase mt-2">* Bloqueado administrativamente a tu base de inicio.</p>
                         )}
                     </div>

                     <div className="bg-slate-50 dark:bg-slate-950 p-6 border border-slate-200 dark:border-slate-800 rounded-2xl relative overflow-hidden">
                         <div className={cn("absolute top-0 right-0 w-2 h-full transition-colors", operationType === 'traslado' ? "bg-indigo-500" : "bg-rose-500")}></div>
                         <label className={cn("text-[10px] font-black uppercase mb-4 block", operationType === 'traslado' ? "text-indigo-500" : "text-rose-500")}>
                            Modo Actual: {operationType === 'traslado' ? 'TRASLADO ENTRE ALMACENES' : 'EGRESO / RETIRO FINAL'}
                         </label>

                         {operationType === 'traslado' && (
                            <div className="mb-6 animate-in slide-in-from-top-2">
                                <label className="text-[10px] font-black uppercase text-indigo-500 mb-2 block flex items-center gap-1"><ArrowUpRight className="w-3 h-3"/> Destino de los lotes</label>
                                <select value={destinoId} onChange={e=>setDestinoId(e.target.value)} className="w-full h-12 px-3 border border-indigo-200 bg-white dark:bg-slate-900 dark:border-indigo-800 rounded-xl font-bold text-indigo-900 dark:text-indigo-100 outline-none focus:ring-2 focus:ring-indigo-500">
                                    <option value="" disabled>Seleccione Galpón Físico...</option>
                                    {depositos.map(d=><option key={d.id} value={d.id}>{d.nombre}</option>)}
                                </select>
                            </div>
                         )}

                         <button onClick={executeBatchOperation} disabled={isExecuting || cart.length === 0 || cart.some(c => Number(c.cantidad_a_extraer) > c.cantidad_actual)} className={cn("w-full text-white font-black py-4 rounded-xl shadow-lg disabled:opacity-50 transition-colors", operationType === 'traslado' ? "bg-indigo-600 hover:bg-indigo-700" : "bg-rose-600 hover:bg-rose-700")}>EJECUTAR ORDEN</button>
                     </div>
                  </div>
              </motion.div>
          )}

          {/* SOLICITUDES */}
          {mode === 'solicitudes' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="text-center py-20 opacity-50">
                  <ArchiveX className="w-16 h-16 mx-auto mb-4" />
                  <h3 className="text-2xl font-black">Módulo de Solicitudes en Construcción</h3>
                  <p className="max-w-xs mx-auto text-sm mt-2 font-medium">Próximamente el sistema conectará los pedidos de operarios automáticos para armar los carritos directamente.</p>
              </motion.div>
          )}

          {/* HISTORIAL Y ANALÍTICA */}
          {mode === 'historial' && (
              <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="font-black text-lg">Historial de Salidas y Traslados ({historial.length})</h3>
                      <button onClick={fetchHistorial} className="text-xs font-bold bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-full">Refrescar Trazabilidad</button>
                  </div>
                  
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-sm border-collapse">
                        <thead>
                           <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase font-black text-slate-500 tracking-widest bg-slate-50 dark:bg-slate-950">
                              <th className="py-3 px-4">Fecha/Operación</th>
                              <th className="py-3 px-4">Producto (SKU)</th>
                              <th className="py-3 px-4 text-center">Cant.</th>
                              <th className="py-3 px-4">Destino de Salida</th>
                              <th className="py-3 px-4 text-center">Alerta Reposición</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {historial.map(h => (
                               <tr key={h.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                  <td className="py-4 px-4 whitespace-nowrap">
                                      <p className="font-mono text-xs dark:text-slate-300">{new Date(h.fecha).toLocaleString()}</p>
                                      <p className={cn("text-[10px] font-black uppercase mt-1", h.tipo_movimiento.includes('salida') ? 'text-indigo-500' : 'text-rose-500')}>{h.tipo_movimiento}</p>
                                  </td>
                                  <td className="py-4 px-4">
                                      <p className="font-bold text-slate-900 dark:text-white">{h.producto_nombre}</p>
                                      <p className="text-xs text-slate-500 font-mono">{h.codigo_barras}</p>
                                  </td>
                                  <td className="py-4 px-4 text-center font-black text-lg">{h.cantidad_afectada}</td>
                                  <td className="py-4 px-4 font-medium text-slate-700 dark:text-slate-400">
                                      <span className="flex items-center gap-2"><ArrowRightLeft className="w-3 h-3"/> Hacia {h.des_nombre || 'N/A'}</span>
                                  </td>
                                  <td className="py-4 px-4 text-center">
                                      {h.alert_saldo_destino === null || h.alert_saldo_destino === undefined ? (
                                         <span className="text-slate-400/50">-</span>
                                      ) : h.alert_saldo_destino <= 0 ? (
                                         <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-lg text-xs font-black uppercase inline-flex items-center gap-1"><AlertCircle className="w-3 h-3"/> AGOTADO EN DESTINO</span>
                                      ) : (
                                         <span className="text-emerald-500 font-bold text-xs">{h.alert_saldo_destino} Stock Restante</span>
                                      )}
                                  </td>
                               </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
              </motion.div>
          )}

      </div>
      
      {isCameraOpen && (
          <div className="fixed inset-0 z-[100] bg-black/95 p-4 flex flex-col backdrop-blur-sm">
             <div className="flex justify-end p-4">
                <button onClick={() => setIsCameraOpen(false)} className="text-white font-bold px-6 py-3 bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-600/30">X Cancelar Escáner</button>
             </div>
             <div className="flex-1 flex items-center justify-center container mx-auto">
                <BarcodeScanner onScan={(code) => { setIsCameraOpen(false); processBarcodeCart(code); }} onClose={() => setIsCameraOpen(false)} />
             </div>
          </div>
      )}

      {/* MODAL REMITO LOTES */}
      <Modal isOpen={remitoPDFInfo !== null} onClose={()=>setRemitoPDFInfo(null)} title="Impresión de Remito Interno">
          {remitoPDFInfo && (
              <div className="text-center p-4">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-black mb-2">¡Despacho Registrado!</h3>
                  <button onClick={()=>window.print()} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-xl flex items-center justify-center gap-2 mt-6 print:hidden">
                      <Printer className="w-5 h-5"/> IMPRIMIR REMITO
                  </button>
                  <div className="hidden print:block text-left p-10 absolute inset-0 bg-white z-[999] text-black h-auto min-h-screen font-sans">
                      <div className="flex justify-between items-start border-2 border-black rounded-xl p-4 relative mb-6">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-white border-2 border-black border-t-0 p-2 font-black text-3xl">X</div>
                          
                          <div className="w-1/2 pr-6 border-r-2 border-black">
                              <h1 className="text-3xl font-black mb-1 leading-tight">DOCUMENTO NO VÁLIDO COMO FACTURA</h1>
                              <p className="font-bold text-lg leading-tight uppercase">SISTEMA INTERNO WMS</p>
                              <p className="text-sm mt-4 tracking-widest font-mono text-slate-600">COMPROBANTE DE TRASLADO FÍSICO</p>
                          </div>
                          <div className="w-1/2 pl-6 text-right">
                              <h2 className="text-3xl font-black uppercase mb-4 tracking-tight">REMITO</h2>
                              <div className="inline-block text-left">
                                  <p className="text-sm mb-1"><strong>N° Documento:</strong> <span className="font-mono text-base">{remitoPDFInfo.codigo}</span></p>
                                  <p className="text-sm mb-1"><strong>Fecha Emisión:</strong> <span className="font-mono text-base">{remitoPDFInfo.fecha}</span></p>
                                  <p className="text-sm"><strong>Operador Logístico:</strong> <span className="font-mono text-base">{(user as any)?.nombre || 'Automático'}</span></p>
                              </div>
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="border-2 border-black p-4 rounded-xl bg-slate-50">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Sale desde (Origen Logístico)</p>
                              <p className="font-black text-xl text-slate-900">{remitoPDFInfo.origen || depositos.find(d => d.id.toString() === origenId)?.nombre || 'Bodega Principal'}</p>
                          </div>
                          <div className="border-2 border-black p-4 rounded-xl bg-slate-50">
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Llega a (Destino Físico)</p>
                              <p className="font-black text-xl text-slate-900">{remitoPDFInfo.destino}</p>
                          </div>
                      </div>

                      <table className="w-full mb-10 border-2 border-black">
                         <thead>
                            <tr className="bg-slate-200 border-b-2 border-black">
                                <th className="text-center py-3 border-r-2 border-black w-24 text-sm font-black">CANT.</th>
                                <th className="text-center py-3 border-r-2 border-black w-48 text-sm font-black">CÓDIGO (LOTE)</th>
                                <th className="text-left py-3 px-4 border-r-2 border-black text-sm font-black">DESCRIPCIÓN DEL ARTÍCULO</th>
                                <th className="text-center py-3 text-sm font-black w-32">VARIACIÓN</th>
                            </tr>
                         </thead>
                         <tbody>
                            {remitoPDFInfo.cart.map((c:any)=>(
                               <tr key={c.codigo_barras} className="border-b border-black">
                                  <td className="text-center py-4 border-r-2 border-black font-black text-xl">{c.cantidad_a_extraer}</td>
                                  <td className="text-center py-4 border-r-2 border-black font-mono font-bold text-sm tracking-tighter">{c.codigo_barras}</td>
                                  <td className="text-left py-4 px-4 border-r-2 border-black font-bold uppercase text-slate-800">{c.producto_nombre}</td>
                                  <td className="text-center py-4 font-bold text-xs uppercase bg-slate-50">{c.nombre_variante}</td>
                               </tr>
                            ))}
                         </tbody>
                      </table>

                      <div className="grid grid-cols-2 gap-24 mt-32 px-10">
                          <div className="border-t-2 border-black text-center pt-2">
                              <p className="font-black uppercase tracking-widest text-sm">Firma de Entrega (Origen)</p>
                              <p className="text-xs text-slate-500 font-medium tracking-wide mt-1">Aclaración y DNI</p>
                          </div>
                          <div className="border-t-2 border-black text-center pt-2">
                              <p className="font-black uppercase tracking-widest text-sm">Firma de Recepción (Destino)</p>
                              <p className="text-xs text-slate-500 font-medium tracking-wide mt-1">Aclaración y Fecha de Ingreso</p>
                          </div>
                      </div>

                      <div className="mt-12 text-center border-t border-slate-300 pt-4">
                           <p className="text-[9px] uppercase font-mono text-slate-400 font-bold tracking-widest">Documento Remito X generado mediante Módulo Despachos WMS</p>
                      </div>
                  </div>
              </div>
          )}
      </Modal>

      <AnimatePresence>
        <CategoryDrillDownModal 
           isOpen={isCatalogOpen} 
           onClose={() => setIsCatalogOpen(false)} 
           title="Selección Manual: Físico de Operaciones" 
           categorias={catalogCategorias} 
           productos={catalogProductos} 
           onSelect={handleCatalogSelection} 
           closeOnSelect={false}
           activeItemIds={cart.map(c => c.variante_id?.toString())} 
        />
      </AnimatePresence>

    </div>
  );
}
