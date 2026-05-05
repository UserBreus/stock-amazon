import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowRightLeft, Scan, Box, Search, Trash2, Printer, CheckCircle, Zap, AlertCircle, Clock, Send, ArchiveX, ClipboardList } from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { useAuth } from '../context/AuthContext';
import { BarcodeScanner } from './ui/BarcodeScanner';
import toast from 'react-hot-toast';
import { cn } from '../lib/utils';
import { Modal } from './ui/Modal';
import { CategoryDrillDownModal } from './ui/CategoryDrillDownModal';
import { printRemito } from '../lib/printRemito';
import { RecomendacionesIngresoModal } from './ui/RecomendacionesIngresoModal';

interface DespachoEgresosProps { initialOperationType?: 'traslado' | 'venta_consumo'; initialMode?: 'lote' | 'solicitudes' | 'historial'; onComplete?: () => void; }

export function DespachoEgresos({ initialOperationType = 'traslado', initialMode = 'lote', onComplete }: DespachoEgresosProps) {
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
  const [isViewingFullscreenPDF, setIsViewingFullscreenPDF] = useState(false);

  // New states for forced physical selection
  const [pendingPhysicalSelection, setPendingPhysicalSelection] = useState<string | null>(null);
  const [physicalSelectorData, setPhysicalSelectorData] = useState<{ etiquetas: any[], tipo_gestion: string, isFetching: boolean }>({ etiquetas: [], tipo_gestion: 'granel', isFetching: false });
  const [localPhysicalCart, setLocalPhysicalCart] = useState<{ [key: string]: number }>({});
  const [physicalSearch, setPhysicalSearch] = useState('');
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);


  // Historial state
  const [historial, setHistorial] = useState<any[]>([]);
  
  // Solicitudes state
  const [solicitudes, setSolicitudes] = useState<any[]>([]);

  // Recomendaciones state
  const [showRecommendationsModal, setShowRecommendationsModal] = useState(false);
  const [almacenAuditName, setAlmacenAuditName] = useState('');
  const [recomendacionesList, setRecomendacionesList] = useState<any[]>([]);

  const handleDestinoChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setDestinoId(val);
      if (val && operationType === 'traslado') {
          const dep = depositos.find(d => d.id.toString() === val);
          setAlmacenAuditName(dep?.nombre || 'Destino');
          
          try {
              const res = await executeAWSQuery(`
                 SELECT 
                    a.variante_id,
                    v.nombre_variante,
                    pm.nombre as producto_nombre,
                    pm.unidad_base,
                    pm.tipo_gestion,
                    a.cantidad_ideal,
                    ISNULL(v.costo, 0) as costo_unitario_real,
                    ISNULL((SELECT SUM(cantidad_actual) FROM Stock_Etiquetas WHERE variante_id = a.variante_id AND deposito_id = ${val} AND estado = 'activo'), 0) as stock_actual
                 FROM Stock_Alertas_Depositos a
                 JOIN Stock_Variantes v ON a.variante_id = v.id
                 JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
                 WHERE a.deposito_id = ${val}
              `);
              
              if (res) {
                  const recs = res.map((r: any) => {
                      const falta = Number(r.cantidad_ideal) - Number(r.stock_actual);
                      return { ...r, falta: falta > 0 ? falta : 0 };
                  });
                  
                  // Even if lacking is zero, we show the modal with "all set" UI
                  setRecomendacionesList(recs);
                  setShowRecommendationsModal(true);
              } else {
                  setRecomendacionesList([]);
                  setShowRecommendationsModal(true);
              }
          } catch(err) {
              console.error("Error cargando recomendaciones", err);
              setRecomendacionesList([]);
              setShowRecommendationsModal(true);
          }
      }
  };

  const handleAcceptRecommendations = (seleccionadas: any[], cantidades: Record<string, number>) => {
      const newItems = seleccionadas.map(rec => ({
          id: 'temp-' + Date.now() + Math.random(),
          variante_id: rec.variante_id,
          producto_nombre: rec.producto_nombre,
          nombre_variante: rec.nombre_variante,
          codigo_barras: 'ASIGNACIÓN AUTOMÁTICA',
          cantidad_actual: 999999, // We allow setting it, execution will validate origin availability
          cantidad_a_extraer: cantidades[rec.variante_id] || rec.falta,
          isBulk: true
      }));

      setCart(prev => [...newItems, ...prev]);
      setShowRecommendationsModal(false);
      toast.success(`${newItems.length} recomendación(es) agregada(s) a la orden de traslado.`);
  };

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
                     pm.tipo_gestion,
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
      // setIsCatalogOpen(false); // REMOVED: keep catalog open
      setPendingPhysicalSelection(varianteId);
      setPhysicalSelectorData({ etiquetas: [], tipo_gestion: 'granel', isFetching: true });
      setLocalPhysicalCart({});
      setPhysicalSearch('');
      
      try {
          const tipoRes = await executeAWSQuery(`
              SELECT pm.tipo_gestion FROM Stock_Variantes v
              INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
              WHERE v.id = ${varianteId}
          `);
          const tipo = tipoRes?.[0]?.tipo_gestion || 'granel';
          
          const etqRes = await executeAWSQuery(`
              SELECT e.id, e.codigo_barras, e.cantidad_actual, e.cantidad_inicial, e.variante_id,
                     v.nombre_variante, pm.nombre as producto_nombre, d.nombre as deposito_nombre
              FROM Stock_Etiquetas e
              INNER JOIN Stock_Variantes v ON v.id = e.variante_id
              INNER JOIN Stock_Productos_Maestros pm ON pm.id = v.producto_maestro_id
              LEFT JOIN Stock_Depositos d ON d.id = e.deposito_id
              WHERE e.variante_id = ${varianteId}
                AND e.deposito_id = ${origenId}
                AND e.estado = 'activo'
                AND e.cantidad_actual > 0
              ORDER BY e.id ASC
          `);
          
          if (!etqRes || etqRes.length === 0) {
              setPendingPhysicalSelection(null);
              toast.error("No hay piezas físicas activas de este producto en este depósito.");
              return;
          }
          
          setPhysicalSelectorData({ etiquetas: etqRes, tipo_gestion: tipo, isFetching: false });
      } catch (e: any) {
          toast.error("Error al cargar lotes físicos: " + e.message);
          setPendingPhysicalSelection(null);
      }
  };

  const confirmPhysicalSelection = () => {
      const { etiquetas, tipo_gestion } = physicalSelectorData;
      const newItems: any[] = [];
      
      for (const etq of etiquetas) {
          const qty = localPhysicalCart[etq.id] || 0;
          if (qty > 0) {
              if (cart.find(c => c.id === etq.id)) {
                  toast.error(`La etiqueta ${etq.codigo_barras} ya está en el carrito, saltando...`);
                  continue;
              }
              newItems.push({
                  ...etq,
                  isBulk: false, // Ahora NUNCA usamos bulk ciego
                  tipo_gestion: tipo_gestion,
                  cantidad_a_extraer: qty, // Lote ind = 1 o qty
                  cantidad_actual: tipo_gestion === 'lote_individual' ? 1 : etq.cantidad_actual
              });
          }
      }
      
      if (newItems.length > 0) {
          setCart(prev => [...newItems, ...prev]);
          toast.success(`${newItems.length} etiqueta(s) agregadas con extracto explícito.`);
      }
      setPendingPhysicalSelection(null);
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
          const remitoCode = (isTransfer ? 'REM-' : 'EGR-') + Date.now().toString().slice(-6) + Math.floor(Math.random()*100).toString();
          
          if (isTransfer) {
              const destClean = Number(destinoId);
              queries.push(`
                  INSERT INTO wms_remitos_internos (numeracion, deposito_origen_id, deposito_destino_id, creado_por, estado) 
                  VALUES ('${remitoCode}', ${origenId}, ${destClean}, '${(user as any)?.id || ''}', 'EN_TRANSITO');
                  DECLARE @RemId INT = SCOPE_IDENTITY();
              `);
          } else {
              queries.push(`
                  INSERT INTO wms_remitos_internos (numeracion, deposito_origen_id, deposito_destino_id, creado_por, estado) 
                  VALUES ('${remitoCode}', ${origenId}, ${origenId}, '${(user as any)?.id || ''}', 'EGRESO');
                  DECLARE @RemId INT = SCOPE_IDENTITY();
              `);
          }
          remitoId = '@RemId';

          let labelsToPrint: any[] = [];
          const opNameOut = isTransfer ? 'traslado_salida' : 'egreso_final';
          const origenFijoSQL = origenId; 
          let queryVarCounter = 0;
          const pdfItemsExtracted: any[] = [];

          const pushQueriesForLot = (loteId: number, loteCodigo: string, allocQty: number, initialLoteQty: number, info: any) => {
              pdfItemsExtracted.push({
                 id: loteId + '-' + Date.now() + Math.random(), 
                 codigo_barras: loteCodigo,
                 cantidad_a_extraer: allocQty,
                 producto_nombre: info.producto_nombre,
                 nombre_variante: info.nombre_variante
              });
              if (allocQty === initialLoteQty) {
                  if (isTransfer) {
                      queries.push(`
                          UPDATE Stock_Etiquetas SET deposito_id = ${destinoId} WHERE id = ${loteId};
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                          VALUES (${loteId}, '${opNameOut}', ${allocQty}, ${origenFijoSQL}, ${destinoId}, @RemId, '${(user as any)?.id || ''}');
                          INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
                          VALUES (@RemId, ${info.variante_id}, ${allocQty}, ${loteId}, 'PENDIENTE');
                      `);
                  } else {
                      queries.push(`
                          UPDATE Stock_Etiquetas SET cantidad_actual = 0, estado = 'consumido' WHERE id = ${loteId};
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, remito_id, usuario_id)
                          VALUES (${loteId}, '${opNameOut}', ${allocQty}, ${origenFijoSQL}, @RemId, '${(user as any)?.id || ''}');
                          INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
                          VALUES (@RemId, ${info.variante_id}, ${allocQty}, ${loteId}, 'ENTREGADO');
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
                          INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
                          VALUES (@RemId, ${info.variante_id}, ${allocQty}, @NewLote_${queryVarCounter}, 'PENDIENTE');
                      `);
                  } else {
                      queries.push(`
                          INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, remito_id, usuario_id)
                          VALUES (${loteId}, '${opNameOut}', ${allocQty}, ${origenFijoSQL}, @RemId, '${(user as any)?.id || ''}');
                          INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
                          VALUES (@RemId, ${info.variante_id}, ${allocQty}, ${loteId}, 'ENTREGADO');
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

          if (isTransfer || !isTransfer) { queries.push(`SELECT numeracion as rem_code FROM wms_remitos_internos WHERE id = @RemId;`); }

          const executeRes = await executeAWSQuery(`BEGIN TRY BEGIN TRANSACTION; ${queries.join('\n')} COMMIT TRANSACTION; END TRY BEGIN CATCH ROLLBACK TRANSACTION; THROW; END CATCH`);

          setRemitoPDFInfo({ 
             cart: pdfItemsExtracted, 
             origen: depositos.find(d => d.id.toString() === origenId)?.nombre || 'Bodega Principal',
             destino: isTransfer ? (depositos.find(d => d.id.toString() === destinoId)?.nombre || 'Ubicación') : 'EGRESO OPERATIVO / RETIRO', 
             codigo: Array.isArray(executeRes) && executeRes.length>0 ? executeRes[0].rem_code : `EXT-${Date.now()}`, 
             fecha: new Date().toLocaleString(), 
             nuevasEtiquetas: labelsToPrint 
          });

          setCart([]);
          toast.success("Operación ejecutada con éxito.");
          onComplete?.();
      } catch (err: any) {
          toast.error("Error: " + err.message);
      } finally { setIsExecuting(false); }
  };

  return (
    <>
    <div className="space-y-4 font-sans print:hidden">
      
      {/* Navegación Modular (Motor Integral) */}
      <div className="flex flex-wrap gap-2 mb-6">
          {[
              { id: 'lote', icon: Box, label: 'Modo Multi-Lote (Remito)' },
              { id: 'solicitudes', icon: Send, label: 'Integración Solicitudes' },
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
                                <select value={destinoId} onChange={handleDestinoChange} className="w-full h-12 px-3 border border-indigo-200 bg-white dark:bg-slate-900 dark:border-indigo-800 rounded-xl font-bold text-indigo-900 dark:text-indigo-100 outline-none focus:ring-2 focus:ring-indigo-500">
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

          {/* HISTORIAL REMOVED IN FAVOR OF GLOBAL SYSTEM */}

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
      <Modal isOpen={remitoPDFInfo !== null && !isViewingFullscreenPDF} onClose={()=>setRemitoPDFInfo(null)} title="Remito Generado">
          {remitoPDFInfo && (
              <div className="text-center p-4">
                  <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-black mb-2">¡Despacho Registrado!</h3>
                  <button onClick={() => { setIsViewingFullscreenPDF(true); }} className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-xl flex items-center justify-center gap-2 mt-6">
                      <ClipboardList className="w-5 h-5"/> VER HOJA REMITO
                  </button>
              </div>
          )}
      </Modal>

      {/* GLOBAL PRINT PORTAL */}
      {isViewingFullscreenPDF && remitoPDFInfo && (
        <div id="print-root" className="fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 sm:p-10 flex justify-center print:static print:w-full print:bg-white print:p-0 print:block">
            <div className="hide-on-print fixed top-6 right-6 flex gap-4 z-[110]">
              <button onClick={() => { 
                  printRemito(remitoPDFInfo.cart, {
                      codigo: remitoPDFInfo.codigo,
                      fecha: remitoPDFInfo.fecha,
                      estado: 'DESPACHADO',
                      origen: remitoPDFInfo.origen || depositos.find(d => d.id.toString() === origenId)?.nombre || 'Bodega Principal',
                      destino: remitoPDFInfo.destino
                  }, 'despacho');
              }} className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-transform hover:scale-110 flex items-center justify-center">
                 <span className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Printer className="w-4 h-4"/> Imprimir Hoja</span>
              </button>
              <button onClick={() => { setIsViewingFullscreenPDF(false); setRemitoPDFInfo(null); }} className="bg-white text-slate-900 p-4 rounded-full shadow-2xl hover:bg-slate-200 transition-transform hover:scale-110 flex items-center justify-center">
                 <span className="font-black text-xs uppercase tracking-widest">X Cerrar</span>
              </button>
            </div>
            <div className="w-full max-w-[900px] bg-white text-slate-800 font-sans p-12 min-h-[1056px] shadow-2xl relative border border-slate-100 rounded-3xl my-10 flex flex-col print:hidden">
                <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8 relative">
                    <div className="w-1/2 pr-6">
                        <h1 className="text-4xl font-black mb-2 tracking-tighter text-slate-900 leading-none">REMITO DE SALIDA</h1>
                        <p className="font-bold text-sm text-slate-400 uppercase tracking-widest">SISTEMA LOGÍSTICO INTERNO · WMS</p>
                    </div>
                    <div className="w-1/2 pl-6 text-right">
                        <div className="inline-block text-left bg-slate-50 p-5 rounded-2xl border border-slate-100 w-full">
                            <div className="flex justify-between mb-3 border-b border-slate-100 pb-3">
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">N° Documento</span>
                                <span className="font-mono font-black text-slate-700">{remitoPDFInfo.codigo}</span>
                            </div>
                            <div className="flex justify-between mb-3 border-b border-slate-100 pb-3">
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Fecha Operación</span>
                                <span className="font-mono font-bold text-slate-700">{remitoPDFInfo.fecha}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Operador</span>
                                <span className="font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md text-xs">{(user as any)?.nombre || 'Automático'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="border border-slate-100 p-6 rounded-2xl bg-white shadow-[0_0_40px_-15px_rgba(0,0,0,0.05)]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ArrowUpRight className="w-3 h-3 text-rose-400"/> Sale desde (Origen Logístico)</p>
                        <p className="font-black text-2xl text-slate-800 leading-tight">{remitoPDFInfo.origen || depositos.find(d => d.id.toString() === origenId)?.nombre || 'Bodega Principal'}</p>
                    </div>
                    <div className="border border-slate-100 p-6 rounded-2xl bg-white shadow-[0_0_40px_-15px_rgba(0,0,0,0.05)]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ArrowRightLeft className="w-3 h-3 text-indigo-400"/> Llega a (Destino Físico)</p>
                        <p className="font-black text-2xl text-slate-800 leading-tight">{remitoPDFInfo.destino}</p>
                    </div>
                </div>

                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden mb-16">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-slate-200">
                              <th className="py-4 px-6 print:py-1 print:px-2 print:text-[9px] w-24 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center border-r border-slate-100">CANT.</th>
                              <th className="py-4 px-6 print:py-1 print:px-2 print:text-[9px] w-32 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center border-r border-slate-100">LOTE / ID</th>
                              <th className="py-4 px-6 print:py-1 print:px-2 print:text-[9px] text-[10px] uppercase tracking-widest text-slate-400 font-bold border-r border-slate-100">ARTÍCULO / DESCRIPCIÓN</th>
                              <th className="py-4 px-6 print:py-1 print:px-2 print:text-[9px] text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center w-32">VARIACIÓN</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {remitoPDFInfo.cart.map((c:any, idx:number)=>(
                             <tr key={c.id + '-' + idx} className="bg-white hover:bg-slate-50 transition-colors">
                                <td className="text-center py-4 px-6 print:py-1 print:text-[11px] border-r border-slate-100 font-black text-lg print:text-sm text-slate-700">{c.cantidad_a_extraer}</td>
                                <td className="text-center py-4 px-6 print:py-1 print:text-[11px] border-r border-slate-100 font-mono font-bold text-xs tracking-tighter text-slate-500">{c.codigo_barras}</td>
                                <td className="py-4 px-6 print:py-1 print:px-2 print:text-[11px] border-r border-slate-100 font-black tracking-tight text-slate-800">{c.producto_nombre}</td>
                                <td className="text-center py-4 px-6 print:py-1 print:text-[11px] font-bold text-[10px] uppercase bg-slate-50/50 tracking-widest text-slate-500">{c.nombre_variante}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-2 gap-24 mt-auto print:mt-10 pt-20 print:pt-6 px-10">
                    <div className="border-t border-dashed border-slate-300 text-center pt-4">
                        <p className="font-black uppercase tracking-widest text-xs text-slate-800">Firma de Entrega (Origen)</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">ACLARACIÓN Y DNI</p>
                    </div>
                    <div className="border-t border-dashed border-slate-300 text-center pt-4">
                        <p className="font-black uppercase tracking-widest text-xs text-slate-800">Firma de Recepción (Destino)</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-widest mt-1">ACLARACIÓN Y FECHA</p>
                    </div>
                </div>
                
                <div className="mt-16 text-center pt-6 opacity-30">
                     <p className="text-[10px] uppercase font-mono text-slate-900 font-bold tracking-widest flex items-center justify-center gap-2">
                        <CheckCircle className="w-3 h-3" />
                        WMS INVENTARIO · DOCUMENTO GENERADO ELECTRÓNICAMENTE
                     </p>
                </div>
            </div>
        </div>
      )}
    </div>

        
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

        {/* PHYSICAL EXPLIXIT LOT SELECTOR MODAL */}
        <Modal isOpen={pendingPhysicalSelection !== null} onClose={()=>setPendingPhysicalSelection(null)} title="Selección Exacta de Lote Físico" maxWidth="max-w-5xl">
           <div className="p-6">
              {physicalSelectorData.isFetching ? (
                 <div className="flex flex-col items-center justify-center py-10 opacity-60">
                    <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full mb-4"></div>
                    <p className="font-bold">Rastreando ubicaciones físicas...</p>
                 </div>
              ) : (
                 <div className="space-y-6 flex flex-col h-full">
                    {/* STICKY HEADER ACTIONS AND SEARCH */}
                    <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 pb-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
                       <div className="flex-1 w-full relative">
                           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                           <input 
                               type="text" 
                               placeholder="Filtrar por código de barras o descripción..." 
                               value={physicalSearch} 
                               onChange={e => setPhysicalSearch(e.target.value)}
                               className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl outline-none focus:border-indigo-500 transition-colors"
                           />
                       </div>
                       <div className="flex w-full md:w-auto gap-2">
                           <button onClick={()=>setPendingPhysicalSelection(null)} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">Cancelar</button>
                           <button onClick={confirmPhysicalSelection} disabled={Object.values(localPhysicalCart).filter(v=>v>0).length===0} className="px-8 py-3 rounded-xl font-black bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                               Cargar <ArrowRightLeft className="w-4 h-4"/>
                           </button>
                       </div>
                    </div>

                    <div className="overflow-y-auto max-h-[60vh] custom-scrollbar pr-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                           {(physicalSelectorData.etiquetas.filter(etq => !physicalSearch || etq.codigo_barras.toLowerCase().includes(physicalSearch.toLowerCase()) || etq.producto_nombre.toLowerCase().includes(physicalSearch.toLowerCase()))).map((etq, index, arr) => (
                              <div key={etq.id} className={cn("border rounded-xl p-4 flex flex-col justify-between gap-4 transition-all duration-200 cursor-pointer select-none", localPhysicalCart[etq.id] > 0 ? "border-indigo-500 shadow-md shadow-indigo-500/10 bg-indigo-50/30 dark:bg-indigo-900/10" : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50")} onClick={(e) => { 
                                  if(physicalSelectorData.tipo_gestion === 'lote_individual') {
                                      setLocalPhysicalCart(prev => { 
                                          const next = {...prev}; 
                                          const isSelected = !prev[etq.id]; 
                                          if (e.shiftKey && lastSelectedIndex !== null && lastSelectedIndex !== index) { 
                                              const start = Math.min(lastSelectedIndex, index); 
                                              const end = Math.max(lastSelectedIndex, index); 
                                              for (let i = start; i <= end; i++) { 
                                                  next[arr[i].id] = 1; 
                                              } 
                                          } else { 
                                              next[etq.id] = isSelected ? 1 : 0; 
                                          } 
                                          return next; 
                                      }); 
                                      setLastSelectedIndex(index); 
                                  }
                               }}>
                                 <div>
                                    <h4 className="font-black text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">{etq.producto_nombre}</h4>
                                    <span className="inline-block mt-1 text-xs font-bold bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{etq.nombre_variante}</span>
                                    
                                    <div className="flex items-center gap-2 mt-3">
                                       <p className="text-xs font-mono font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-1"><Scan className="w-3 h-3"/> {etq.codigo_barras}</p>
                                    </div>
                                    <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest mt-2 bg-slate-200/50 dark:bg-slate-800/50 inline-block px-2 py-1 rounded-md">Saldo: {etq.cantidad_actual} <span className="opacity-50">/ Orig: {etq.cantidad_inicial}</span></p>
                                 </div>
                                 
                                 <div className="flex items-center justify-end border-t border-slate-200 dark:border-slate-800 pt-3 mt-1">
                                    {physicalSelectorData.tipo_gestion === 'lote_individual' ? (
                                       <button 
                                          className={cn("w-full h-12 rounded-xl flex items-center justify-center font-bold text-sm transition-all border-2", localPhysicalCart[etq.id] ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-400 hover:border-slate-300")}
                                       >
                                          {localPhysicalCart[etq.id] ? <><CheckCircle className="w-5 h-5 mr-2"/> Lote Seleccionado</> : "Haz clic para seleccionar"}
                                       </button>
                                    ) : (
                                       <div className="flex items-center w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden focus-within:ring-2 ring-indigo-500 focus-within:border-indigo-500 h-12" onClick={(e)=>e.stopPropagation()}>
                                          <span className="px-3 flex-1 text-[11px] font-black uppercase text-slate-400 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 h-full flex items-center">Extraer cant.</span>
                                          <input 
                                             type="number" 
                                             min="0"
                                             max={etq.cantidad_actual}
                                             value={localPhysicalCart[etq.id] || ''}
                                             placeholder="0"
                                             onChange={e => {
                                                const v = Number(e.target.value);
                                                setLocalPhysicalCart(prev => ({...prev, [etq.id]: Math.min(v, etq.cantidad_actual)}));
                                             }}
                                             className="w-24 px-3 py-2 text-lg font-black text-center text-indigo-600 bg-transparent outline-none focus:ring-0" 
                                          />
                                       </div>
                                    )}
                                 </div>
                              </div>
                           ))}
                           {physicalSelectorData.etiquetas.filter(etq => !physicalSearch || etq.codigo_barras.toLowerCase().includes(physicalSearch.toLowerCase()) || etq.producto_nombre.toLowerCase().includes(physicalSearch.toLowerCase())).length === 0 && (
                               <div className="col-span-full py-10 text-center text-slate-400 font-bold">No se encontraron etiquetas con ese filtro.</div>
                           )}
                        </div>
                    </div>
                 </div>
              )}
           </div>
        </Modal>

        {showRecommendationsModal && destinoId && (
            <RecomendacionesIngresoModal
                isOpen={showRecommendationsModal}
                onClose={() => setShowRecommendationsModal(false)}
                recomendaciones={recomendacionesList}
                onConfirm={handleAcceptRecommendations}
            />
        )}

        {/* GLOBAL PRINT PORTAL - MOVED OUTSIDE OF HIDDEN ROOT PARENT */}
        {remitoPDFInfo && (
            <div className="hidden print:block w-full text-black font-sans bg-white">
                {(remitoPDFInfo.cart.length > 0 ? remitoPDFInfo.cart.reduce((acc:any, curr:any, i:number) => { if (i % 30 === 0) acc.push([]); acc[acc.length - 1].push(curr); return acc; }, []) : [[]]).map((pageItems:any, pageIndex:number, pagesArray:any[]) => (
                    <div key={pageIndex} className="w-[210mm] min-h-[297mm] p-8 flex flex-col justify-between" style={{ pageBreakAfter: 'always' }}>
                        <div>
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
                                    <p className="font-black text-xl text-slate-900">{remitoPDFInfo.origen || depositos.find((d:any) => d.id.toString() === origenId)?.nombre || 'Bodega Principal'}</p>
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
                                  {pageItems.map((c:any, idx:number)=>(
                                     <tr key={c.id + '-' + idx} className="border-b border-black">
                                        <td className="text-center py-4 border-r-2 border-black font-black text-xl">{c.cantidad_a_extraer}</td>
                                        <td className="text-center py-4 border-r-2 border-black font-mono font-bold text-sm tracking-tighter">{c.codigo_barras}</td>
                                        <td className="text-left py-4 px-4 border-r-2 border-black font-bold uppercase text-slate-800">{c.producto_nombre}</td>
                                        <td className="text-center py-4 font-bold text-xs uppercase bg-slate-50">{c.nombre_variante}</td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                        </div>

                        <div className="mt-auto">
                            <div className="grid grid-cols-2 gap-24 mt-12 px-10">
                                <div className="border-t-2 border-black text-center pt-2">
                                    <p className="font-black uppercase tracking-widest text-sm">Firma de Entrega (Origen)</p>
                                    <p className="text-xs text-slate-500 font-medium tracking-wide mt-1">Aclaración y DNI</p>
                                </div>
                                <div className="border-t-2 border-black text-center pt-2">
                                    <p className="font-black uppercase tracking-widest text-sm">Firma de Recepción (Destino)</p>
                                    <p className="text-xs text-slate-500 font-medium tracking-wide mt-1">Aclaración y Fecha de Ingreso</p>
                                </div>
                            </div>
            
                            <div className="mt-8 flex justify-between items-center text-center border-t border-slate-300 pt-4">
                                 <p className="text-[9px] uppercase font-mono text-slate-400 font-bold tracking-widest">Documento Remito X generado mediante Módulo Despachos WMS</p>
                                 <p className="text-[9px] uppercase font-mono text-slate-600 font-black tracking-widest">HOJA {pageIndex + 1} DE {pagesArray.length}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

    </>
  );
}
