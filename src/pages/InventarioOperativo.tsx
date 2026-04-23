import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box, Send, Trash2, PlusCircle, ShoppingCart, MapPin, Search, ArrowDownRight, PackageCheck, AlertCircle, ScanBarcode, ArrowRight, ShieldCheck, ClipboardList, MinusCircle, Truck, Printer, ArrowUpRight, ArrowRightLeft, CheckCircle } from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { cn } from '../lib/utils';
import { ModalSelector } from '../components/ui/ModalSelector';
import { Modal } from '../components/ui/Modal';
import { CategoryDrillDownModal } from '../components/ui/CategoryDrillDownModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function InventarioOperativo() {
  const { user, isGerente, isAdminStock } = useAuth();
  
  const [depositos, setDepositos] = useState<any[]>([]);
  // Si no es admin, anclado al sucursal_activa_id del perfil. Si no hay sucursal, le da error.
  const [sectorSeleccionado, setSectorSeleccionado] = useState<string>('');
  
  const [etiquetasLocales, setEtiquetasLocales] = useState<any[]>([]);
  const [remitosPendientes, setRemitosPendientes] = useState<any[]>([]);
  const [remitosHistoricos, setRemitosHistoricos] = useState<any[]>([]);
  const [remitoDetalleItems, setRemitoDetalleItems] = useState<any[]|null>(null);
  const [selectedActiveRemitoId, setSelectedActiveRemitoId] = useState<string|null>(null);
  const [selectedRemitoEstado, setSelectedRemitoEstado] = useState<string|null>(null);
  const [isReceiving, setIsReceiving] = useState(false);
  const [isViewingFullscreenPDF, setIsViewingFullscreenPDF] = useState(false);
  
  const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'stock' | 'recepcion' | 'historial' | 'solicitar'>('stock');

  const isSuperUser = isGerente || isAdminStock;

  // Modal para consumir stock local
  const [bajaEtiqueta, setBajaEtiqueta] = useState<any|null>(null);
  const [bajaCantidad, setBajaCantidad] = useState(1);

  // States for Solicitudes
  const [solicitudCart, setSolicitudCart] = useState<any[]>([]);
  const [catalogCategorias, setCatalogCategorias] = useState<any[]>([]);
  const [catalogProductos, setCatalogProductos] = useState<any[]>([]);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Modal selector de sector para supers
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (sectorSeleccionado) {
        fetchDataRelacional();
        const interval = setInterval(() => { fetchDataRelacional(); }, 20000); 
        return () => clearInterval(interval);
    }
  }, [sectorSeleccionado]);

  const fetchBaseData = async () => {
    try {
      const depRes = await executeAWSQuery("SELECT * FROM Stock_Depositos ORDER BY nombre");
      if (depRes && depRes.length > 0) {
        setDepositos(depRes);
        
        let targetSector = '';
        if (isSuperUser) {
           const opSectors = depRes.filter((d:any) => d.tipo === 'mini_sector');
           targetSector = opSectors.length > 0 ? opSectors[0].id.toString() : depRes[0].id.toString();
        } else {
           if(user?.sucursal_activa_id) {
               targetSector = user.sucursal_activa_id.toString();
           } else {
               toast.error("Tu usuario no tiene un sector/depósito asignado en el sistema.");
           }
        }
        
        if (targetSector) {
           setSectorSeleccionado(targetSector);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Error al cargar depósitos");
    }
  };

  const fetchDataRelacional = async () => {
    if (!sectorSeleccionado) return;
    try {
      const [etiqRes, remitosRes, historialRes] = await Promise.all([
        executeAWSQuery(`
          SELECT e.*, p.nombre as producto_nombre, v.nombre_variante as producto_sku, p.unidad_base as unidad, c.nombre as familia_nombre
          FROM Stock_Etiquetas e
          INNER JOIN Stock_Variantes v ON e.variante_id = v.id
          INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
          LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
          WHERE e.deposito_id = ${sectorSeleccionado} AND (e.estado = 'activo' OR e.estado IS NULL) AND e.cantidad_actual > 0
          ORDER BY c.nombre ASC, p.nombre ASC
        `),
        executeAWSQuery(`
          SELECT r.*, d_origen.nombre as origen_nombre, 
            (SELECT COUNT(*) FROM wms_remitos_internos_items i WHERE i.remito_id = r.id) as total_items
          FROM wms_remitos_internos r
          LEFT JOIN Stock_Depositos d_origen ON r.deposito_origen_id = d_origen.id
          WHERE r.deposito_destino_id = ${sectorSeleccionado} AND r.estado = 'EN_TRANSITO'
          ORDER BY r.fecha_creacion ASC
        `),
        executeAWSQuery(`
          SELECT TOP 50 r.*, d_origen.nombre as origen_nombre, 
            (SELECT COUNT(*) FROM wms_remitos_internos_items i WHERE i.remito_id = r.id) as total_items
          FROM wms_remitos_internos r
          LEFT JOIN Stock_Depositos d_origen ON r.deposito_origen_id = d_origen.id
          WHERE r.deposito_destino_id = ${sectorSeleccionado} AND r.estado = 'RECIBIDO'
          ORDER BY r.fecha_creacion DESC
        `)
      ]);
      setEtiquetasLocales(etiqRes || []);
      setRemitosPendientes(remitosRes || []);
      setRemitosHistoricos(historialRes || []);
    } catch (e) { 
        console.error(e); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleBajaConsumo = async (e: React.FormEvent) => {
     e.preventDefault();
     if(!bajaEtiqueta) return;
     if(bajaCantidad <= 0 || bajaCantidad > bajaEtiqueta.cantidad_actual) {
         toast.error("Cantidad inválida"); return;
     }

     try {
         const remaining = bajaEtiqueta.cantidad_actual - bajaCantidad;
         let q = `
            UPDATE Stock_Etiquetas SET cantidad_actual = ${remaining} WHERE id = ${bajaEtiqueta.id};
            INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, usuario_id)
            VALUES ('${bajaEtiqueta.id}', 'baja_consumo', ${bajaCantidad}, ${sectorSeleccionado}, '${user?.id || 'Operario'}');
         `;
         await executeAWSQuery(q);
         toast.success("Baja procesada correctamente");
         setBajaEtiqueta(null);
         fetchDataRelacional();
     } catch (err: any) {
         toast.error("Error al registrar baja: " + err.message);
     }
  };

  const handleRecibirRemitoEntero = async (remitoId: string) => {
     if(!window.confirm("¿Confirmas la recepción completa de este remito?")) return;
     try {
         // Marcar items como recibidos
         let q1 = `
           DECLARE @remitoId INT = ${remitoId};
           
           -- Insertar las etiquetas para el destino
           DECLARE @ItemCursor CURSOR;
           DECLARE @ItemVarId INT;
           DECLARE @ItemQty DECIMAL(18,4);
           DECLARE @ItemDestino INT = ${sectorSeleccionado};
           DECLARE @NuevoLoteId INT;
           
           BEGIN
               SET @ItemCursor = CURSOR FOR SELECT variante_id, cantidad_enviada FROM wms_remitos_internos_items WHERE remito_id = @remitoId;
               OPEN @ItemCursor;
               FETCH NEXT FROM @ItemCursor INTO @ItemVarId, @ItemQty;
               
               WHILE @@FETCH_STATUS = 0
               BEGIN
                  INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, estado)
                  VALUES (CONVERT(varchar(255), NEWID()), CAST(@ItemVarId AS varchar), @ItemDestino, @ItemQty, @ItemQty, 'activo');
                  
                  SET @NuevoLoteId = SCOPE_IDENTITY();
                  
                  INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id)
                  VALUES (@NuevoLoteId, 'traslado_ingreso', @ItemQty, @ItemDestino);
                  
                  FETCH NEXT FROM @ItemCursor INTO @ItemVarId, @ItemQty;
               END;
               
               CLOSE @ItemCursor;
               DEALLOCATE @ItemCursor;
               
               UPDATE wms_remitos_internos_items SET estado = 'RECIBIDO_OK', cantidad_recibida = cantidad_enviada WHERE remito_id = @remitoId;
               UPDATE wms_remitos_internos SET estado = 'RECIBIDO' WHERE id = @remitoId;
           END;
         `;
         await executeAWSQuery(q1);
         toast.success("¡Remito ingresado con éxito al sector!");
         fetchDataRelacional();
     } catch(e: any) {
         toast.error("Fallo al ingresar remito: " + e.message);
     }
  };


  
    const handleVerDetalles = async (remitoId: string, estado: string) => {
      setSelectedActiveRemitoId(remitoId);
      setSelectedRemitoEstado(estado);
      try {
          const detailRes = await executeAWSQuery(`
              SELECT i.*, v.nombre_variante as nombre_variante, p.nombre as producto_nombre 
              FROM wms_remitos_internos_items i
              JOIN Stock_Variantes v ON i.variante_id = v.id
              JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
              WHERE i.remito_id = ${remitoId}
          `);
          if (detailRes) {
              const mapped = detailRes.map((r:any) => ({
                  ...r,
                  edit_cantidad_recibida: estado === 'EN_TRANSITO' ? r.cantidad_enviada : r.cantidad_recibida
              }));
              setRemitoDetalleItems(mapped);
          } else {
              setRemitoDetalleItems([]);
          }
      } catch (err:any) {
          toast.error("Error cargando detalle: " + err.message);
      }
  };

  const handleProcesarRecepcion = async () => {
      if(!remitoDetalleItems || !selectedActiveRemitoId) return;
      
      const invalid = remitoDetalleItems.some(i => i.edit_cantidad_recibida < 0 || i.edit_cantidad_recibida > i.cantidad_enviada);
      if(invalid) return toast.error("No puedes recibir más de lo enviado ni cantidades negativas.");
      
      setIsReceiving(true);
      try {
          let queries = [`
             DECLARE @RemitoDestino INT = ${sectorSeleccionado};
          `];
          
          for (let i = 0; i < remitoDetalleItems.length; i++) {
              const item = remitoDetalleItems[i];
              const cantToReceive = Number(item.edit_cantidad_recibida);
              
              if (cantToReceive > 0) {
                  queries.push(`
                      DECLARE @NuevoLote_${i} INT;
                      INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, estado)
                      VALUES (CONVERT(varchar(255), NEWID()), ${item.variante_id}, @RemitoDestino, ${cantToReceive}, ${cantToReceive}, 'activo');
                      
                      SET @NuevoLote_${i} = SCOPE_IDENTITY();
                      
                      INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id)
                      VALUES (@NuevoLote_${i}, 'traslado_ingreso', ${cantToReceive}, @RemitoDestino);
                      
                      UPDATE wms_remitos_internos_items SET estado = 'RECIBIDO_OK', cantidad_recibida = ${cantToReceive} WHERE id = ${item.id};
                  `);
              } else {
                  // Received nothing of this line
                  queries.push(`UPDATE wms_remitos_internos_items SET estado = 'CANCELADO', cantidad_recibida = 0 WHERE id = ${item.id};`);
              }
          }
          
          queries.push(`UPDATE wms_remitos_internos SET estado = 'RECIBIDO' WHERE id = ${selectedActiveRemitoId};`);
          
          await executeAWSQuery(`BEGIN TRY BEGIN TRANSACTION; ${queries.join('\n')} COMMIT TRANSACTION; END TRY BEGIN CATCH ROLLBACK TRANSACTION; THROW; END CATCH`);
          toast.success("Recepción procesada. Etiquetas generadas en su stock físico.");
          setRemitoDetalleItems(null);
          setSelectedActiveRemitoId(null);
          setSelectedRemitoEstado(null);
          fetchDataRelacional();
      } catch (err:any) {
          toast.error("Error al procesar recepción: " + err.message);
      } finally {
          setIsReceiving(true); // Is ok to leave it true? Let's just reset
          setIsReceiving(false);
      }
  };

  if(loading) return <div className="p-10 text-center font-bold text-slate-500 animate-pulse">Autenticando Sector...</div>;

  const currentSectorObj = depositos.find(d => d.id.toString() === sectorSeleccionado);

  const openCatalog = async () => {
      try {
          const res = await executeAWSQuery(`
              SELECT c.id as cat_id, c.nombre as cat_name, 
                     c.id as fam_id, c.nombre as fam_name, 
                     p.id as prod_id, p.nombre as prod_name, p.codigo_sku as prod_sku, p.requiere_lote,
                     v.id as var_id, v.nombre_variante as var_name, v.codigo_barras as var_sku
              FROM Stock_Variantes v
              INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
              LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
          `);
          if (res) {
              const cats = Array.from(new Set(res.map((r:any) => JSON.stringify({ id: r.cat_id, nombre: r.cat_name })))).map((s:any) => JSON.parse(s));
              setCatalogCategorias(cats);
              setCatalogProductos(res);
              setIsCatalogOpen(true);
          }
      } catch (e: any) {
          toast.error("Error cargando catálogo global: " + e.message);
      }
  };

  const handleCatalogSelection = (item: any) => {
      if (!solicitudCart.find(c => c.var_id === item.var_id)) {
          setSolicitudCart([...solicitudCart, { ...item, cantidad: 1 }]);
          toast.success("Agregado a la solicitud");
      } else {
          toast.error("Variante ya agregada en la solicitud actual");
      }
      setIsCatalogOpen(false); // Can stay open if preferred, but simpler to close
  };

  const enviarSolicitud = async () => {
      if (solicitudCart.length === 0) return toast.error("El carrito está vacío");
      if (!sectorSeleccionado) return toast.error("Sin sector origen");

      setIsRequesting(true);
      try {
          const reqCode = 'REQ-' + Date.now().toString().slice(-6);
          let queries = [`
             INSERT INTO wms_solicitudes (numeracion, deposito_solicitante_id, creado_por, estado)
             VALUES ('${reqCode}', ${sectorSeleccionado}, '${user?.id || 'Op'}', 'PENDIENTE');
             DECLARE @ReqId INT = SCOPE_IDENTITY();
          `];

          for (const item of solicitudCart) {
              queries.push(`
                 INSERT INTO wms_solicitudes_items (solicitud_id, variante_id, cantidad_solicitada)
                 VALUES (@ReqId, ${item.var_id}, ${item.cantidad});
              `);
          }

          await executeAWSQuery(`BEGIN TRY BEGIN TRANSACTION; ${queries.join('\n')} COMMIT TRANSACTION; END TRY BEGIN CATCH ROLLBACK TRANSACTION; THROW; END CATCH`);
          toast.success("¡Solicitud enviada a la Central Logística!");
          setSolicitudCart([]);
          setActiveTab('recepcion' as any);
      } catch (err:any) {
          toast.error("Fallo al enviar solicitud: " + err.message);
      } finally {
          setIsRequesting(false);
      }
  };


  const activeRem = (remitosPendientes.find(r => String(r.id) === String(selectedActiveRemitoId)) || remitosHistoricos.find(r => String(r.id) === String(selectedActiveRemitoId))) as any;

  return (
    <>
    <div className="space-y-8 max-w-7xl mx-auto print:hidden">

      {/* HEADER DE MI SECTOR */}
      <div className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <MapPin className="w-64 h-64 text-slate-900 dark:text-white" />
        </div>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">Mi Sector de Operaciones</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-xl">Supervisa el inventario disponible en tiempo real para tu área o punto de recarga. Registra el material operado y recibe remitos transferidos por Logística Central.</p>
          </div>
          <div className="w-full md:w-80">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Sector Asignado en Base</label>
            <button 
               type="button"
               onClick={() => isSuperUser ? setIsSectorModalOpen(true) : toast("Debes pedirle a un administrador que asigne tu cuenta a otra área.")}
               className={cn("input-nexus w-full mt-1 flex items-center justify-between text-left h-[46px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950", isSuperUser ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : 'cursor-not-allowed opacity-80')}
            >
               <span className="font-black text-sm text-slate-800 dark:text-white flex items-center gap-2 truncate">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  {currentSectorObj?.nombre || 'Ninguno'}
               </span>
               {isSuperUser && <ArrowDownRight className="w-4 h-4 opacity-50 text-slate-400" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'stock', label: 'Mi Stock Físico', count: etiquetasLocales.length },
          { id: 'recepcion', label: 'Remitos Entrantes', count: remitosPendientes.length, alert: remitosPendientes.length > 0 },
          { id: 'solicitar', label: 'Pedir Insumos', count: solicitudCart.length },
          { id: 'historial', label: 'Remitos Recibidos', count: remitosHistoricos.length }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 relative",
              activeTab === tab.id 
                ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-sm" 
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            )}
          >
            {tab.label} 
            <span className={cn("px-2 py-0.5 text-[10px] rounded-full", activeTab === tab.id ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300" : "bg-slate-200 text-slate-600 dark:bg-slate-800")}>{tab.count}</span>
            {tab.alert && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping" />}
            {tab.alert && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />}
          </button>
        ))}
      </div>

      {activeTab === 'stock' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-2xl">
               <h3 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-2">
                   <Box className="w-5 h-5 text-indigo-500" />
                   Listado de Material en el Área
               </h3>
               <div className="relative w-full sm:w-64">
                   <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                   <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Buscar por Variante o Maestro..." className="input-nexus w-full h-10 pl-9 bg-slate-50 dark:bg-slate-950 font-bold text-sm focus:ring-indigo-500" />
               </div>
           </div>

           <div className="space-y-8">
              {etiquetasLocales.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                      <PackageCheck className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                      <p className="font-bold text-slate-500 text-lg">Área sin existencias reportadas.</p>
                      <p className="text-sm text-slate-400">Todo el material consumido, o a espera de remito central.</p>
                  </div>
              )}
              {etiquetasLocales.length > 0 && (() => {
                  const filteredEtiquetas = etiquetasLocales.filter(et => {
                      if (!searchQuery) return true;
                      const term = searchQuery.toLowerCase();
                      return (et.producto_nombre?.toLowerCase().includes(term) || et.producto_sku?.toLowerCase().includes(term));
                  });

                  if (searchQuery) {
                      if (filteredEtiquetas.length === 0) {
                          return <div className="text-center p-10 text-slate-500 font-bold bg-slate-50 dark:bg-slate-900 rounded-3xl">No se encontraron productos físicos que coincidan con tu búsqueda.</div>;
                      }
                      return (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {filteredEtiquetas.map((et: any) => (
                                  <div key={et.id} className="card-nexus p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 transition-colors flex flex-col group">
                                      <div className="flex justify-between items-start mb-3">
                                          <div>
                                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">{et.producto_sku || 'Artículo'}</span>
                                              <h4 className="font-black text-slate-900 dark:text-white mt-1.5 leading-tight pr-4">{et.producto_nombre}</h4>
                                          </div>
                                      </div>
                                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                                          <div>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Saldo Físico Actual</p>
                                              <p className="font-black text-2xl text-slate-800 dark:text-white">
                                                  {et.cantidad_actual} <span className="text-sm text-slate-500">{et.unidad}</span>
                                              </p>
                                          </div>
                                          <button onClick={() => { setBajaEtiqueta(et); setBajaCantidad(1); }} className="opacity-100 lg:opacity-0 group-hover:opacity-100 btn-secondary bg-red-50 text-red-600 hover:bg-red-100 border-none transition-all h-9 text-xs px-3 shadow-none flex items-center gap-1">
                                             <MinusCircle className="w-3.5 h-3.5" /> Consumir
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      );
                  }

                  const grouped = etiquetasLocales.reduce((acc: any, curr: any) => {
                      const fam = curr.familia_nombre || 'Sin Familia Asignada';
                      if (!acc[fam]) acc[fam] = [];
                      acc[fam].push(curr);
                      return acc;
                  }, {});
                  
                  if (!selectedCategory) {
                      return (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                              {Object.entries(grouped).map(([familia, tags]: [string, any]) => (
                                  <button
                                      key={familia}
                                      onClick={() => setSelectedCategory(familia)}
                                      className="flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all rounded-[2rem] group"
                                  >
                                      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-500 rounded-2xl flex items-center justify-center mb-4 transition-colors">
                                          <Box className="w-7 h-7" />
                                      </div>
                                      <h4 className="font-black text-slate-800 dark:text-white text-lg tracking-tight">{familia}</h4>
                                      <span className="text-xs font-bold text-slate-500 mt-2 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">{tags.length} Lotes físicos</span>
                                  </button>
                              ))}
                          </div>
                      );
                  }

                  const tags = grouped[selectedCategory] || [];
                  return (
                      <div className="bg-slate-50/50 dark:bg-slate-950/20 rounded-3xl border border-slate-100 dark:border-slate-800/60 p-6">
                          <div className="flex items-center gap-4 mb-6">
                              <button 
                                 onClick={() => setSelectedCategory(null)}
                                 className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors shrink-0 shadow-sm"
                              >
                                  <ArrowRight className="w-5 h-5 opacity-70 rotate-180" />
                              </button>
                              <div>
                                  <h4 className="font-black text-slate-700 dark:text-slate-300 text-2xl flex items-center gap-3">
                                      <div className="w-2 h-6 bg-indigo-400 rounded-full"></div>
                                      {selectedCategory}
                                  </h4>
                                  <p className="text-sm font-bold text-slate-500">{tags.length} lotes encontrados</p>
                              </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {tags.map((et: any) => (
                                  <div key={et.id} className="card-nexus p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 transition-colors flex flex-col group">
                                      <div className="flex justify-between items-start mb-3">
                                          <div>
                                              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded">{et.producto_sku || 'Artículo'}</span>
                                              <h4 className="font-black text-slate-900 dark:text-white mt-1.5 leading-tight pr-4">{et.producto_nombre}</h4>
                                          </div>
                                      </div>
                                      
                                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between">
                                          <div>
                                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Saldo Físico Actual</p>
                                              <p className="font-black text-2xl text-slate-800 dark:text-white">
                                                  {et.cantidad_actual} <span className="text-sm text-slate-500">{et.unidad}</span>
                                              </p>
                                          </div>
                                          
                                          <button 
                                             onClick={() => { setBajaEtiqueta(et); setBajaCantidad(1); }}
                                             className="opacity-100 lg:opacity-0 group-hover:opacity-100 btn-secondary bg-red-50 text-red-600 hover:bg-red-100 border-none transition-all h-9 text-xs px-3 shadow-none flex items-center gap-1"
                                          >
                                             <MinusCircle className="w-3.5 h-3.5" /> Consumir
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  );
              })()}
           </div>
        </motion.div>
      )}

      {activeTab === 'recepcion' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-2">
                        <Truck className="w-5 h-5 text-amber-500" />
                        Tránsitos y Envíos Centrales a la espera de Control
                    </h3>
               </div>
               
               <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                   {remitosPendientes.length === 0 && (
                       <div className="py-20 text-center">
                           <ShieldCheck className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                           <p className="font-bold text-slate-500 text-lg">No hay despachos en tránsito logístico hacia tu puerta.</p>
                       </div>
                   )}
                   {remitosPendientes.map(rem => (
                       <div key={rem.id} onClick={() => handleVerDetalles(rem.id, 'EN_TRANSITO')} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors cursor-pointer">
                           <div className="flex items-center gap-5">
                               <div className="w-14 h-14 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                                   <ClipboardList className="w-6 h-6" />
                               </div>
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                       <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">{rem.numeracion}</span>
                                       <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 rounded py-0.5">{new Date(rem.fecha_creacion).toLocaleDateString()}</span>
                                   </div>
                                   <h4 className="font-black text-slate-900 dark:text-white text-lg">Origen: {rem.origen_nombre}</h4>
                                   <p className="text-sm font-bold text-slate-500">Contiene {rem.total_items} artículos despachados.</p>
                               </div>
                           </div>
                           
                           <div className="flex flex-col sm:flex-row gap-3">
                                
                                <button onClick={(e) => { e.stopPropagation(); handleVerDetalles(rem.id, 'EN_TRANSITO'); }} className="btn-primary flex items-center gap-2 h-11 bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20">
                                     <PackageCheck className="w-4 h-4" /> Controlar y Recibir
                                </button>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
        </motion.div>
      )}

      {activeTab === 'historial' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
           <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-indigo-500" />
                        Historial de Recepciones
                    </h3>
               </div>
               
               <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                   {remitosHistoricos.length === 0 && (
                       <div className="py-20 text-center">
                           <ClipboardList className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                           <p className="font-bold text-slate-500 text-lg">No hay historial de recepciones reportado.</p>
                       </div>
                   )}
                   {remitosHistoricos.map(rem => (
                       <div key={rem.id} onClick={() => handleVerDetalles(rem.id, 'RECIBIDO')} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition-colors cursor-pointer">
                           <div className="flex items-center gap-5">
                               <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0">
                                   <PackageCheck className="w-6 h-6" />
                               </div>
                               <div>
                                   <div className="flex items-center gap-2 mb-1">
                                       <span className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-sm">{rem.numeracion}</span>
                                       <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 rounded py-0.5">{new Date(rem.fecha_creacion).toLocaleDateString()}</span>
                                   </div>
                                   <h4 className="font-black text-slate-900 dark:text-white text-lg">Origen: {rem.origen_nombre}</h4>
                                   <p className="text-sm font-bold text-slate-500">Contiene {rem.total_items} artículos registrados.</p>
                               </div>
                           </div>
                           
                           <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={(e) => { e.stopPropagation(); handleVerDetalles(rem.id, 'RECIBIDO'); }} className="btn-secondary flex items-center gap-2 h-11">
                                     <Search className="w-4 h-4" /> Ver Detalles
                                </button>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
        </motion.div>
      )}

      {/* MODAL DE CONSUMO */}
      <AnimatePresence>
          {bajaEtiqueta && (
             <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                 <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setBajaEtiqueta(null)}/>
                 <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800">
                     <div className="p-6 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center text-red-600 dark:text-red-400">
                         <h3 className="font-black flex items-center gap-2"><MinusCircle className="w-5 h-5"/> Sacar Stock por Uso Operario</h3>
                     </div>
                     <form onSubmit={handleBajaConsumo} className="p-6 space-y-5">
                         <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800">
                             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{bajaEtiqueta.producto_sku}</p>
                             <p className="font-black text-slate-900 dark:text-white leading-tight">{bajaEtiqueta.producto_nombre}</p>
                             <p className="text-sm font-bold text-emerald-600 mt-2">Saldo Disp: {bajaEtiqueta.cantidad_actual} {bajaEtiqueta.unidad}</p>
                         </div>
                         
                         <div>
                             <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Cantidad Extirpada</label>
                             <input type="number" min="0.01" step="0.01" max={bajaEtiqueta.cantidad_actual} value={bajaCantidad} onChange={e => setBajaCantidad(Number(e.target.value))} className="input-nexus w-full h-14 text-center text-3xl font-black text-slate-900 dark:text-white focus:ring-red-500 focus:border-red-500 selection:bg-red-200" required />
                         </div>
                         <div className="flex gap-2 pt-2">
                             <button type="button" onClick={() => setBajaEtiqueta(null)} className="btn-secondary flex-1 py-3.5">Cancelar</button>
                             <button type="submit" className="btn-primary bg-red-600 hover:bg-red-700 shadow-red-600/30 flex-1 py-3.5">Confirmar Baja</button>
                         </div>
                     </form>
                 </motion.div>
             </div>
          )}
      </AnimatePresence>

      
      {remitoDetalleItems && !isViewingFullscreenPDF && (
          <Modal isOpen={true} onClose={() => { setRemitoDetalleItems(null); setSelectedActiveRemitoId(null); setSelectedRemitoEstado(null); }} title={selectedRemitoEstado === 'EN_TRANSITO' ? "Controlar Recepción" : "Detalle de Remito"}>
              <div className="space-y-4">
                 {selectedRemitoEstado === 'EN_TRANSITO' && (
                     <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 p-4 border border-amber-200 dark:border-amber-800 text-sm font-bold rounded-2xl">
                        Por favor verifique que las cantidades físicas coincidan con lo enviado. Si llegaron menos, modifique el "Recibido".
                     </div>
                 )}
              
                 {remitoDetalleItems.length === 0 ? (
                     <div className="p-8 text-center text-slate-500 font-bold">No hay ítems registrados en este remito.</div>
                 ) : (
                     remitoDetalleItems.map((item, idx) => (
                         <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
                             <div className="flex-1">
                                 <h5 className="font-black text-slate-800 dark:text-white leading-tight mb-1">{item.producto_nombre}</h5>
                                 <span className="text-xs font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded">{item.nombre_variante}</span>
                             </div>
                             <div className="flex items-center gap-6 shrink-0">
                                 <div className="text-right">
                                     <p className="font-bold text-slate-500">{item.cantidad_enviada}</p>
                                     <p className="text-[10px] uppercase font-bold text-slate-400">Enviados</p>
                                 </div>
                                 
                                 <div className="flex flex-col items-center">
                                     {selectedRemitoEstado === 'EN_TRANSITO' ? (
                                         <input 
                                            type="number" 
                                            min="0" max={item.cantidad_enviada} step="0.01" 
                                            value={item.edit_cantidad_recibida} 
                                            onChange={e => setRemitoDetalleItems(remitoDetalleItems.map(i => i.id === item.id ? {...i, edit_cantidad_recibida: Number(e.target.value)} : i))}
                                            className="w-20 text-center font-black text-lg bg-white dark:bg-slate-950 border border-emerald-500 rounded p-1"
                                         />
                                     ) : (
                                         <p className="font-black text-lg text-emerald-600 dark:text-emerald-400">{item.cantidad_recibida}</p>
                                     )}
                                     <p className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mt-1">Recibidos</p>
                                 </div>
                             </div>
                         </div>
                     ))
                 )}
                 
                 <div className="flex gap-3 pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 flex-wrap">
                     {activeRem && (
                        <button onClick={() => { setIsViewingFullscreenPDF(true); }} className="flex-none bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 px-6 rounded-xl flex items-center justify-center gap-2">
                            <ClipboardList className="w-5 h-5"/> VER HOJA REMITO
                        </button>
                     )}
                     <button onClick={() => { setRemitoDetalleItems(null); setSelectedActiveRemitoId(null); setSelectedRemitoEstado(null); }} className="flex-1 min-w-[120px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-black py-4 rounded-xl">Cerrar</button>
                     {selectedRemitoEstado === 'EN_TRANSITO' && remitoDetalleItems.length > 0 && (
                         <button onClick={handleProcesarRecepcion} disabled={isReceiving} className="flex-1 min-w-[200px] bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-xl disabled:opacity-50">
                             {isReceiving ? 'PROCESANDO...' : 'SÍ, INGRESAR STOCK'}
                         </button>
                     )}
                 </div>
              </div>
          </Modal>
      )}

      <ModalSelector
         title="Cambiar Mi Sector de Prueba"
         isOpen={isSectorModalOpen}
         onClose={() => setIsSectorModalOpen(false)}
         selectedValue={sectorSeleccionado}
         onSelect={setSectorSeleccionado}
         options={depositos.map(d => ({ value: d.id.toString(), label: d.nombre, icon: MapPin }))}
      />
    </div>

    {isViewingFullscreenPDF && activeRem && (
        <div className="fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 sm:p-10 flex justify-center print:static print:w-full print:bg-white print:p-0 print:block">
            <div className="fixed top-6 right-6 flex gap-4 z-[110] print:hidden">
              <button onClick={() => { setTimeout(() => window.print(), 100); }} className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-transform hover:scale-110 flex items-center justify-center">
                 <span className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Printer className="w-4 h-4"/> Imprimir Hoja</span>
              </button>
              <button onClick={() => { setIsViewingFullscreenPDF(false); }} className="bg-white text-slate-900 p-4 rounded-full shadow-2xl hover:bg-slate-200 transition-transform hover:scale-110 flex items-center justify-center">
                 <span className="font-black text-xs uppercase tracking-widest">X Cerrar</span>
              </button>
            </div>
            <div id="print-root" className="w-full max-w-[900px] bg-white text-slate-800 font-sans p-12 min-h-[1056px] shadow-2xl relative border border-slate-100 rounded-3xl my-10 flex flex-col print:shadow-none print:border-none print:m-0 print:p-0 print:w-full print:max-w-full print:rounded-none">
                <div className="flex justify-between items-start border-b border-slate-100 pb-8 mb-8 relative">
                    <div className="w-1/2 pr-6">
                        <h1 className="text-4xl font-black mb-2 tracking-tighter text-slate-900 leading-none">REMITO DE MOVIMIENTO</h1>
                        <p className="font-bold text-sm text-slate-400 uppercase tracking-widest">SISTEMA LOGÍSTICO INTERNO · WMS</p>
                    </div>
                    <div className="w-1/2 pl-6 text-right">
                        <div className="inline-block text-left bg-slate-50 p-5 rounded-2xl border border-slate-100 w-full">
                            <div className="flex justify-between mb-3 border-b border-slate-100 pb-3">
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">N° Documento</span>
                                <span className="font-mono font-black text-slate-700">{activeRem.rem_code || activeRem.numeracion || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between mb-3 border-b border-slate-100 pb-3">
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Fecha Operación</span>
                                <span className="font-mono font-bold text-slate-700">{new Date(activeRem.fecha_creacion).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-xs uppercase font-bold text-slate-400 tracking-widest">Estado</span>
                                <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-xs">{activeRem.estado}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="border border-slate-100 p-6 rounded-2xl bg-white shadow-[0_0_40px_-15px_rgba(0,0,0,0.05)]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ArrowUpRight className="w-3 h-3 text-rose-400"/> Sale desde (Origen Logístico)</p>
                        <p className="font-black text-2xl text-slate-800 leading-tight">{depositos.find(d=>d.id===activeRem.deposito_origen_id)?.nombre || 'Bodega Principal'}</p>
                    </div>
                    <div className="border border-slate-100 p-6 rounded-2xl bg-white shadow-[0_0_40px_-15px_rgba(0,0,0,0.05)]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2"><ArrowRightLeft className="w-3 h-3 text-indigo-400"/> Llega a (Destino Físico)</p>
                        <p className="font-black text-2xl text-slate-800 leading-tight">{depositos.find(d=>d.id===activeRem.deposito_destino_id)?.nombre || 'Ubicación'}</p>
                    </div>
                </div>

                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden mb-16">
                    <table className="w-full text-left">
                       <thead>
                          <tr className="border-b border-slate-200">
                              <th className="py-4 px-6 w-24 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center border-r border-slate-100">C. ENV</th>
                              <th className="py-4 px-6 w-24 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center border-r border-slate-100">C. REC</th>
                              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold border-r border-slate-100">ARTÍCULO / DESCRIPCIÓN</th>
                              <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold text-center w-40">VAR / LOTE</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-slate-100">
                          {remitoDetalleItems.map((c:any, idx:number)=>(
                             <tr key={idx} className="bg-white hover:bg-slate-50 transition-colors">
                                <td className="text-center py-4 px-6 border-r border-slate-100 font-black text-lg text-slate-700">{c.cantidad_enviada}</td>
                                <td className="text-center py-4 px-6 border-r border-slate-100 font-black text-lg text-emerald-600">{c.cantidad_recibida || '-'}</td>
                                <td className="py-4 px-6 border-r border-slate-100 font-black tracking-tight text-slate-800">{c.producto_nombre}</td>
                                <td className="text-center py-4 px-6 font-bold text-[10px] uppercase bg-slate-50/50 tracking-widest text-slate-500">{c.nombre_variante}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>
                </div>

                <div className="grid grid-cols-2 gap-24 mt-auto pt-20 px-10">
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
    </>
  );
}
