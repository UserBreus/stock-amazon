import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Scan, AlertCircle, ArchiveRestore, Printer, Search, CreditCard, Activity, 
  Box, ArrowUpRight, ChevronDown, ChevronRight, Layers, Receipt, Network, X, Trash2, 
  Package, ShoppingCart, ListChecks, Tags, Camera, ArrowDownToLine, 
  ArrowRightLeft, ArrowUpFromLine, LayoutDashboard, History, MapPin, Send, ClipboardList, CheckCircle, PackageCheck, ScanBarcode, ArrowLeft, User, Scale 
} from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { printRemito } from '../lib/printRemito';
import { cn, getVisualName } from '../lib/utils';
import { Modal } from '../components/ui/Modal';
import { BarcodeScanner } from '../components/ui/BarcodeScanner';
import { useAuth } from '../context/AuthContext';
import { DespachoEgresos } from '../components/DespachoEgresos';
import { RecepcionAuditoria } from '../components/RecepcionAuditoria';
import { RegistroPesos } from '../components/RegistroPesos';
import { AlertSummaryPanel } from '../components/ui/AlertSummaryPanel';

import toast from 'react-hot-toast';

export function InventarioGerencial() {
  const { user, hasAccess, hasSubAccess, isAdminStock } = useAuth();
  const mainAccess = hasAccess('sidebar_inventario');
  const ingresarAcc = hasSubAccess('sidebar_inventario', 'hub_ingresar');
  const trasladarAcc = hasSubAccess('sidebar_inventario', 'hub_trasladar');
  const solAcc = hasSubAccess('sidebar_inventario', 'hub_solicitudes');
  const retiroAcc = hasSubAccess('sidebar_inventario', 'hub_retirar');
  const etiqAcc = hasSubAccess('sidebar_inventario', 'hub_etiquetas');
  const pesoAcc = hasSubAccess('sidebar_inventario', 'hub_pesos');
  const tabInvAcc = hasSubAccess('sidebar_inventario', 'tab_inventario');
  const tabHistAcc = hasSubAccess('sidebar_inventario', 'tab_historial');
  const [loading, setLoading] = useState(true);

  // Tabs Visuales Originales
  const [activeTab, setActiveTab] = useState<'panel' | 'inventario' | 'historial' | 'catalogo' | 'compras'>('panel');
  const [panelView, setPanelView] = useState<'hub' | 'ingreso' | 'traslado' | 'retiro' | 'etiquetas' | 'solicitudes' | 'pesos'>('hub');

  // Stock and Filters
  const [stockConsolidado, setStockConsolidado] = useState<any[]>([]);
  const [capitalActivo, setCapitalActivo] = useState<any[]>([]);
  const [depositos, setDepositos] = useState<any[]>([]);
  const [tiposProducto, setTiposProducto] = useState<any[]>([]);
  const [comprasPendientes, setComprasPendientes] = useState<any[]>([]);

  const [warehouseFilterId, setWarehouseFilterId] = useState<string | null>(null);
  const [globalHistorial, setGlobalHistorial] = useState<any[]>([]);
  const [selectedHistorialRemito, setSelectedHistorialRemito] = useState<any>(null);
  const [historialSearch, setHistorialSearch] = useState('');
  const [historialDate, setHistorialDate] = useState('');
  const [historialLoaded, setHistorialLoaded] = useState(false);
  const [globalEgresos, setGlobalEgresos] = useState<any[]>([]);
  const [egresosLoaded, setEgresosLoaded] = useState(false);
  const [historialSubTab, setHistorialSubTab] = useState<'remitos' | 'egresos'>('remitos');
  const filterRef = useRef<string | null>(null);

  // Solicitudes & Historial Global states restored
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [solicitudItems, setSolicitudItems] = useState<{ [key: string]: any[] }>({});
  const [selectedModalSol, setSelectedModalSol] = useState<any>(null);
  const [solicitudOrigenSel, setSolicitudOrigenSel] = useState<{ [solId: number]: string[] }>({});
  const [isSubModalOriginOpen, setIsSubModalOriginOpen] = useState(false);
  const [stockCoverage, setStockCoverage] = useState<Record<number, {status: "FULL"|"PARTIAL"|"NONE"}>>({});
  const [isLoadingCoverage, setIsLoadingCoverage] = useState(false);
  const [remitoPDFInfo, setRemitoPDFInfo] = useState<any>(null);
  const [isViewingFullscreenPDF, setIsViewingFullscreenPDF] = useState(false);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState<string | null>(null);


  const [filterMode, setFilterMode] = useState<'all' | 'activos' | 'inactivos'>('activos');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<{ [key: string]: boolean }>({});

    // Generador de Etiquetas / Cajas
  const [isLabelModalOpen, setIsLabelModalOpen] = useState(false);
  const [newLabel, setNewLabel] = useState({ variante_id: '', cantidad_por_etiqueta: 1, numero_etiquetas: 1, deposito_id: '' });

  // Hub States
  const [manualCart, setManualCart] = useState<any[]>([]);

  // Modals
  const [isLabelDrillDownOpen, setIsLabelDrillDownOpen] = useState(false);
  const [labelCatalog, setLabelCatalog] = useState<any[]>([]);
  const [variationChartProduct, setVariationChartProduct] = useState<any | null>(null);

  const [isLabelCompraModalOpen, setIsLabelCompraModalOpen] = useState(false);
  const [selectedCompraId, setSelectedCompraId] = useState<string | null>(null);

  // Egreso auto
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [egresoProduct, setEgresoProduct] = useState<any | null>(null);
  const [egresoAutoMonto, setEgresoAutoMonto] = useState(0);
  const [egresoEtiquetas, setEgresoEtiquetas] = useState<any[]>([]);
  const [egresoAmounts, setEgresoAmounts] = useState<{ [key: string]: number }>({});

  // Cost editing states
  const [editingVariant, setEditingVariant] = useState<any | null>(null);
  const [editingGroup, setEditingGroup] = useState<any | null>(null);
  const [newCosto, setNewCosto] = useState<string>('');
  const [updateExistingStock, setUpdateExistingStock] = useState<boolean>(true);
  const [savingCosto, setSavingCosto] = useState(false);

  const openEditCostoGroupModal = (variant: any, group: any) => {
    setEditingVariant(variant);
    setEditingGroup(group);
    setNewCosto(group.costo_unitario.toString());
    setUpdateExistingStock(true);
  };

  const handleSaveCosto = async () => {
    if (!editingVariant || !editingGroup) return;
    const costNum = parseFloat(newCosto);
    if (isNaN(costNum) || costNum < 0) {
      return toast.error("Por favor ingrese un costo válido (mayor o igual a 0).");
    }

    setSavingCosto(true);
    try {
      let query = `
        UPDATE e
        SET e.costo_unitario_real = ${costNum}
        FROM Stock_Etiquetas e
        INNER JOIN Stock_Variantes v ON e.variante_id = v.id
        WHERE e.variante_id = ${editingVariant.variante_id}
          AND e.estado = 'activo'
          AND e.cantidad_actual > 0
          AND COALESCE(NULLIF(e.costo_unitario_real, 0), v.costo, 0) = ${editingGroup.costo_unitario}
          AND COALESCE(CONVERT(VARCHAR(10), e.ultima_actualizacion, 103), 'Sin fecha') = '${editingGroup.fecha_ingreso}';
      `;

      if (updateExistingStock) {
        query += `
          UPDATE Stock_Variantes 
          SET costo = ${costNum} 
          WHERE id = ${editingVariant.variante_id};
        `;
      }

      await executeAWSQuery(query);
      toast.success("Costo de lote actualizado con éxito");
      setEditingVariant(null);
      setEditingGroup(null);
      fetchData();
      if (variationChartProduct) {
        await reloadLabelCatalog(variationChartProduct.variante_id);
      }
    } catch (err: any) {
      toast.error("Error al actualizar el costo: " + err.message);
    } finally {
      setSavingCosto(false);
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  
  const fetchGlobalSolicitudes = async () => {
      try {
          const res = await executeAWSQuery(`
              SELECT s.*, d.nombre as sector_nombre, u.nombre_completo as operario_nombre 
              FROM wms_solicitudes s
              LEFT JOIN Stock_Depositos d ON s.deposito_solicitante_id = d.id
              LEFT JOIN Usuarios u ON CAST(u.id AS VARCHAR(255)) = CAST(s.creado_por AS VARCHAR(255))
              WHERE s.estado = 'PENDIENTE'
              ORDER BY s.fecha_creacion DESC
          `);
          setSolicitudes(res || []);
      } catch (err: any) { toast.error("Carga de solicitudes fallida: " + err.message) }
  };

  const handleCancelarSolicitud = async (solicitudId: number) => {
     const motivo = window.prompt("Por favor, especifique el motivo de la cancelación de esta orden:");
     if (motivo === null) return;
     if (!motivo.trim()) {
        toast.error("Debes ingresar un motivo para cancelar la orden.");
        return;
     }
     if (!window.confirm("¿Estás seguro de que deseas cancelar esta orden?")) {
        return;
     }
     try {
         const q = `
            USE Ventas_Dev;
            UPDATE wms_solicitudes
            SET estado = 'CANCELADO',
                motivo_cancelacion = '${motivo.replace(/'/g, "''")}',
                cancelado_por = '${user?.nombre_completo || user?.usuario || user?.id || 'Administración'}',
                fecha_cancelacion = GETDATE()
            WHERE id = ${solicitudId};
         `;
         await executeAWSQuery(q);
         toast.success("¡Orden cancelada con éxito!");
         fetchGlobalSolicitudes();
         setSelectedModalSol(null);
     } catch (e: any) {
         toast.error("Fallo al cancelar orden: " + e.message);
     }
  };

  const fetchGlobalHistorial = async () => {
    try {
      const res = await executeAWSQuery(`
        SELECT TOP 50 r.*, d_origen.nombre as origen_nombre, d_destino.nombre as destino_nombre, u.nombre_completo as usuario_emisor,
          (SELECT SUM(cantidad_enviada) FROM wms_remitos_internos_items i WHERE i.remito_id = r.id) as total_unidades
        FROM wms_remitos_internos r
        LEFT JOIN Usuarios u ON CAST(u.id AS VARCHAR(255)) = CAST(r.creado_por AS VARCHAR(255))
        LEFT JOIN Stock_Depositos d_origen ON r.deposito_origen_id = d_origen.id
        LEFT JOIN Stock_Depositos d_destino ON r.deposito_destino_id = d_destino.id
        ORDER BY r.fecha_creacion DESC
      `);
      setGlobalHistorial(res || []);
      setHistorialLoaded(true);
    } catch (error: any) { toast.error("Historial WMS: " + error.message) }
  };

  const fetchGlobalEgresos = async () => {
    try {
      const res = await executeAWSQuery(`
        SELECT TOP 200 
            m.id, 
            m.fecha, 
            m.tipo_movimiento, 
            m.cantidad_afectada, 
            m.usuario_id,
            e.codigo_barras, 
            v.nombre_variante, 
            pm.nombre as producto_nombre, 
            c.nombre as categoria_nombre, 
            d_origen.nombre as origen_nombre, 
            CAST(u.nombre_completo AS VARCHAR(255)) as usuario_nombre
        FROM Stock_Movimientos m
        INNER JOIN Stock_Etiquetas e ON m.etiqueta_id = e.id
        INNER JOIN Stock_Variantes v ON e.variante_id = v.id
        INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
        LEFT JOIN Stock_Categorias c ON pm.categoria_id = c.id
        LEFT JOIN Stock_Depositos d_origen ON m.deposito_origen_id = d_origen.id
        LEFT JOIN usuarios u ON CAST(m.usuario_id AS VARCHAR(255)) = CAST(u.id AS VARCHAR(255))
        WHERE m.tipo_movimiento IN ('baja_consumo', 'egreso_final', 'egreso_auto', 'egreso_venta_web')
        ORDER BY m.fecha DESC
      `);
      setGlobalEgresos(res || []);
      setEgresosLoaded(true);
    } catch (error: any) { toast.error("Historial Egresos: " + error.message) }
  };

  useEffect(() => {
    if (activeTab === 'historial') {
      if (!historialLoaded) fetchGlobalHistorial();
      if (!egresosLoaded) fetchGlobalEgresos();
    }
  }, [activeTab]);

  const handleOpenSolicitud = async (sol: any) => {
      setSelectedModalSol(sol);
      try {
          const res = await executeAWSQuery(`
             SELECT i.*, v.nombre_variante, p.nombre as producto_nombre, c.nombre as cat_nombre
             FROM wms_solicitudes_items i
             JOIN Stock_Variantes v ON i.variante_id = v.id
             JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
             LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
             WHERE i.solicitud_id = ${sol.id}
          `);
          setSolicitudItems(prev => ({ ...prev, [sol.id]: res || [] }));
      } catch (err) { }
  };

  const openOriginSubModal = async () => {
     setIsSubModalOriginOpen(true);
     if (!selectedModalSol) return;
     const items = solicitudItems[selectedModalSol.id];
     if (!items || items.length === 0) return;
     
     setIsLoadingCoverage(true);
     try {
       const qs = items.map((i:any) => i.variante_id).join(',');
       const stock = await executeAWSQuery(`
          SELECT deposito_id, variante_id, SUM(cantidad_actual) as stock_total 
          FROM Stock_Etiquetas 
          WHERE variante_id IN (${qs}) AND estado = 'activo' AND cantidad_actual > 0
          GROUP BY deposito_id, variante_id
       `);
       
       const availability: Record<number, {status: "FULL"|"PARTIAL"|"NONE"}> = {};
       depositos.forEach((d:any) => {
          let hasSufficientAll = true;
          let hasAny = false;
          for(const rq of items) {
             const found = (stock||[]).find((s:any) => s.deposito_id === d.id && s.variante_id === rq.variante_id);
             const qty = found ? found.stock_total : 0;
             if (qty > 0) hasAny = true;
             if (qty < rq.cantidad_solicitada) hasSufficientAll = false;
          }
          if (hasSufficientAll) availability[d.id] = { status: "FULL" };
          else if (hasAny) availability[d.id] = { status: "PARTIAL" };
          else availability[d.id] = { status: "NONE" };
       });
       setStockCoverage(availability);
     } catch (e) { } finally { setIsLoadingCoverage(false); }
  };

  const handleEnviarSolicitud = async (sol: any) => {
    const origenIdsArray = solicitudOrigenSel[sol.id] || [];
    if (origenIdsArray.length === 0) return toast.error('Seleccioná al menos un almacén de origen primero');
    const items = solicitudItems[sol.id];
    if (!items || items.length === 0) return toast.error('Cargá los ítems primero');

    setEnviandoSolicitud(sol.id);
    try {
      const remitoCode = 'REM-' + Date.now().toString().slice(-6) + Math.floor(Math.random() * 100);
      const destino = sol.deposito_solicitante_id;
      const primaryOrigen = origenIdsArray[0];
      const userId = (user as any)?.id || '';

      // PASO 1: Crear el remito y obtener su ID con OUTPUT INSERTED.id
      const remitoRes = await executeAWSQuery(`
        INSERT INTO wms_remitos_internos (numeracion, deposito_origen_id, deposito_destino_id, creado_por, estado)
        OUTPUT INSERTED.id
        VALUES ('${remitoCode}', ${primaryOrigen}, ${destino}, '${userId}', 'EN_TRANSITO');
      `);
      const remitoId = remitoRes?.[0]?.id;
      if (!remitoId) throw new Error('No se pudo crear el remito interno (OUTPUT INSERTED.id vació)');

      // PASO 2: Para cada item, iterar FIFO por almacenes de origen
      const pdfItemsExtracted: any[] = [];
      const labelsToPrint: any[] = [];
      const missingStockErrors: string[] = [];

      for (const item of items) {
        let remaining = Number(item.cantidad_solicitada);
        let localTaken = 0;

        for (const oId of origenIdsArray) {
          if (remaining <= 0) break;

          const etqs = await executeAWSQuery(`
            SELECT TOP 100 id, cantidad_actual, codigo_barras
            FROM Stock_Etiquetas
            WHERE variante_id = ${item.variante_id}
              AND deposito_id = ${oId}
              AND estado = 'activo'
              AND cantidad_actual > 0
            ORDER BY ultima_actualizacion ASC
          `);

          if (!etqs || etqs.length === 0) continue;

          for (const etq of etqs) {
            if (remaining <= 0) break;
            const toTake = Math.min(Number(etq.cantidad_actual), remaining);
            remaining -= toTake;
            localTaken += toTake;

            if (toTake === Number(etq.cantidad_actual)) {
              // Lote completo: mover directamente
              await executeAWSQuery(`
                SET NOCOUNT ON;
                UPDATE Stock_Etiquetas SET deposito_id = ${destino}, estado = 'trasladando' WHERE id = ${etq.id};
                INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                VALUES (${etq.id}, 'traslado_salida', ${toTake}, ${oId}, ${destino}, ${remitoId}, '${userId}');
                INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
                VALUES (${remitoId}, ${item.variante_id}, ${toTake}, ${etq.id}, 'PENDIENTE');
              `);
            } else {
              // Fraccionamiento: descontar y crear nuevo lote
              const newCode = `${etq.codigo_barras}-F${Math.floor(Math.random() * 9999)}`;
              labelsToPrint.push({ codigo_barras: newCode, producto_nombre: item.producto_nombre, nombre_variante: item.nombre_variante, cantidad_actual: toTake });

              await executeAWSQuery(`
                BEGIN TRY
                  BEGIN TRANSACTION;
                  
                  UPDATE Stock_Etiquetas SET cantidad_actual = cantidad_actual - ${toTake} WHERE id = ${etq.id};
                  
                  DECLARE @NewLoteTable TABLE (id INT);
                  INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, estado)
                  OUTPUT INSERTED.id INTO @NewLoteTable
                  VALUES ('${newCode}', ${item.variante_id}, ${destino}, ${toTake}, ${toTake}, 'trasladando');
                  
                  DECLARE @NewLoteId INT;
                  SELECT @NewLoteId = id FROM @NewLoteTable;
                  
                  INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                  VALUES (@NewLoteId, 'fraccionamiento_ingreso', ${toTake}, ${oId}, ${destino}, ${remitoId}, '${userId}');
                  
                  INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_origen_id, deposito_destino_id, remito_id, usuario_id)
                  VALUES (${etq.id}, 'fraccionamiento_salida', ${toTake}, ${oId}, ${destino}, ${remitoId}, '${userId}');
                  
                  INSERT INTO wms_remitos_internos_items (remito_id, variante_id, cantidad_enviada, etiqueta_generada_id, estado)
                  VALUES (${remitoId}, ${item.variante_id}, ${toTake}, @NewLoteId, 'PENDIENTE');
                  
                  COMMIT TRANSACTION;
                END TRY
                BEGIN CATCH
                  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                  THROW;
                END CATCH
              `);
            }
          }
        }

        if (localTaken > 0) pdfItemsExtracted.push({ id: item.variante_id + '-' + Date.now(), codigo_barras: 'MULTI-SEQ', cantidad_a_extraer: localTaken, producto_nombre: item.producto_nombre, nombre_variante: item.nombre_variante });
        if (remaining > 0) missingStockErrors.push(`Faltaron ${remaining} uds de "${item.nombre_variante}"`);
      }

      // PASO 3: Marcar solicitud como aprobada
      await executeAWSQuery(`UPDATE wms_solicitudes SET estado = 'APROBADA', remito_id = ${remitoId} WHERE id = ${sol.id};`);

      if (missingStockErrors.length > 0) toast.error(`Stock insuficiente: ${missingStockErrors.join('. ')}`, { duration: 6000 });

      setRemitoPDFInfo({ cart: pdfItemsExtracted, origen: 'Consolidado (Multi-Origen)', destino: sol.sector_nombre, codigo: remitoCode, fecha: new Date().toLocaleString(), nuevasEtiquetas: labelsToPrint });
      toast.success(`✅ Remito ${remitoCode} generado y en tránsito`);
      setSelectedModalSol(null);
      fetchGlobalSolicitudes();
    } catch (e: any) { toast.error('Error al despachar: ' + e.message); } finally { setEnviandoSolicitud(null); }
  };

  const handleVerHistorialDetalles = async (rem: any) => {
      try {
          const detailRes = await executeAWSQuery(`
              SELECT i.*, v.nombre_variante as nombre_variante, p.nombre as producto_nombre, c.nombre as cat_nombre, e.codigo_barras
              FROM wms_remitos_internos_items i
              JOIN Stock_Variantes v ON i.variante_id = v.id
              JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
              LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
              LEFT JOIN Stock_Etiquetas e ON i.etiqueta_generada_id = e.id
              WHERE i.remito_id = ${rem.id}
          `);
          setSelectedHistorialRemito({
             cart: detailRes || [],
             origen: rem.origen_nombre,
             destino: rem.destino_nombre,
             estado: rem.estado,
             codigo: rem.numeracion,
             fecha: new Date(rem.fecha_creacion).toLocaleString()
          });
      } catch (err: any) { toast.error("Error cargando detalle: " + err.message); }
  };

  const fetchData = async () => {
    try {
      const advancedQuery = `
           SELECT 
               pm.id as maestro_id,
               pm.nombre as producto_nombre,
               cat.nombre as categoria_nombre,
               pm.unidad_base,
               v.id as variante_id,
               v.nombre_variante,
               v.codigo_variante as sku,
               ISNULL(v.costo, 0) as costo,
               v.moneda,
               COUNT(e.id) as variaciones_etiquetas,
               SUM(e.cantidad_actual) as cantidad_total,
               ISNULL(SUM(COALESCE(NULLIF(e.costo_unitario_real, 0), v.costo, 0) * e.cantidad_actual), 0) as capital_total,
               MAX(ProvData.proveedor_nombre) as proveedor_nombre
           FROM Stock_Productos_Maestros pm
           LEFT JOIN Stock_Categorias cat ON pm.categoria_id = cat.id
           INNER JOIN Stock_Variantes v ON pm.id = v.producto_maestro_id
           LEFT JOIN Stock_Etiquetas e ON v.id = e.variante_id AND e.estado = 'activo' ${filterRef.current ? `AND e.deposito_id = ${filterRef.current}` : ''}
           OUTER APPLY (
               SELECT TOP 1 prov_inner.nombre as proveedor_nombre
               FROM Stock_Movimientos m_inner
               LEFT JOIN Stock_Compras c_inner ON m_inner.referencia_compra_id = c_inner.id
               LEFT JOIN Stock_Proveedores prov_inner ON c_inner.proveedor_id = prov_inner.id
               WHERE m_inner.etiqueta_id = e.id AND m_inner.tipo_movimiento LIKE '%ingreso%'
           ) ProvData
           GROUP BY 
               pm.id, pm.nombre, cat.nombre, pm.unidad_base,
               v.id, v.nombre_variante, v.codigo_variante, v.costo, v.moneda
           ORDER BY pm.nombre ASC
      `;
      const [stockRes, capRes, depRes, catRes, compRes] = await Promise.all([
        executeAWSQuery(advancedQuery),
        executeAWSQuery("SELECT * FROM Vista_Capital_Activo"),
        executeAWSQuery("SELECT * FROM Stock_Depositos"),
        executeAWSQuery("SELECT * FROM Stock_Categorias ORDER BY nombre"),
        executeAWSQuery("SELECT c.*, p.nombre as proveedor_nombre FROM Stock_Compras c LEFT JOIN Stock_Proveedores p ON c.proveedor_id = p.id WHERE c.estado = 'pendiente' ORDER BY c.fecha_creacion DESC")
      ]);
      
      setStockConsolidado(stockRes || []);
      setCapitalActivo(capRes || []);
      setDepositos(depRes || []);
      setTiposProducto(catRes || []);
      setComprasPendientes(compRes || []);
      fetchGlobalHistorial();
      fetchGlobalSolicitudes();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const reloadLabelCatalog = async (varianteId: string) => {
    try {
      const q = `
        SELECT 
            COALESCE(NULLIF(e.costo_unitario_real, 0), v.costo, 0) as costo_unitario,
            COALESCE(CONVERT(VARCHAR(10), e.ultima_actualizacion, 103), 'Sin fecha') as fecha_ingreso,
            COUNT(e.id) as cantidad_lotes,
            SUM(e.cantidad_actual) as cantidad_total
        FROM Stock_Etiquetas e
        INNER JOIN Stock_Variantes v ON e.variante_id = v.id
        WHERE e.variante_id = '${varianteId}' AND e.estado = 'activo' AND e.cantidad_actual > 0
          ${filterRef.current ? `AND e.deposito_id = ${filterRef.current}` : ''}
        GROUP BY 
            COALESCE(NULLIF(e.costo_unitario_real, 0), v.costo, 0),
            COALESCE(CONVERT(VARCHAR(10), e.ultima_actualizacion, 103), 'Sin fecha')
        ORDER BY fecha_ingreso DESC, costo_unitario DESC
      `;
      const res = await executeAWSQuery(q);
      setLabelCatalog(res || []);
    } catch(e) {
      console.error(e);
    }
  };

  const openLabelDrillDown = async (prod: any) => {
    setVariationChartProduct(prod);
    await reloadLabelCatalog(prod.variante_id);
    setIsLabelDrillDownOpen(true);
  };

    const handleGenerateLabels = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!newLabel.variante_id || !newLabel.deposito_id) return alert("Complete todos los campos.");
    try {
      const vResult = await executeAWSQuery(`SELECT * FROM Stock_Variantes WHERE id = ${newLabel.variante_id}`);
      const vObj = vResult?.[0];
      if(!vObj) return alert("Variante no existe");

      const prefix = vObj.codigo_variante || 'SKU';
      const values = Array.from({ length: newLabel.numero_etiquetas }).map((_, i) => 
        `('${prefix}-${Date.now().toString().slice(-4)}-${i+1}', ${vObj.id}, ${newLabel.deposito_id}, ${newLabel.cantidad_por_etiqueta}, 'activo')`
      ).join(',');

      const inserted = await executeAWSQuery(`INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_actual, estado) OUTPUT INSERTED.id VALUES ${values}`);
      
      if (inserted && inserted.length > 0) {
        const movValues = inserted.map((row:any) => 
          `(${row.id}, 'ingreso', ${newLabel.cantidad_por_etiqueta}, '${user?.id || 1}')`
        ).join(',');
        await executeAWSQuery(`INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad, usuario_id) VALUES ${movValues}`);
      }
      setIsLabelModalOpen(false);
      fetchData();
      alert(`${newLabel.numero_etiquetas} etiqueta(s) generadas con éxito.`);
    } catch(err) {
      console.error(err);
      alert("Error al generar las etiquetas. Revise la consola.");
    }
  };

  const openEgresoAuto = async (prod: any) => {
    setEgresoProduct(prod);
    setEgresoAutoMonto(1);
    try {
      const etqs = await executeAWSQuery(`
        SELECT e.*, pm.tipo_gestion
        FROM Stock_Etiquetas e
        JOIN Stock_Variantes v ON v.id = e.variante_id
        JOIN Stock_Productos_Maestros pm ON pm.id = v.producto_maestro_id
        WHERE e.variante_id = '${prod.variante_id}' AND e.estado = 'activo' AND e.cantidad_actual > 0
        ORDER BY e.ultima_actualizacion ASC
      `);
      setEgresoEtiquetas(etqs || []);
      
      const amounts: {[key:string]:number} = {};
      (etqs || []).forEach((e:any) => amounts[e.id] = 0);
      setEgresoAmounts(amounts);
      setIsEgresoModalOpen(true);
    } catch(e) {
      console.error(e);
    }
  };

  const applyAutoFIFO = () => {
    const amounts: {[key:string]:number} = {};
    let rem = egresoAutoMonto;
    egresoEtiquetas.forEach(e => {
       if (rem > 0) {
          if (e.cantidad_actual >= rem) { amounts[e.id] = rem; rem = 0; }
          else { amounts[e.id] = e.cantidad_actual; rem -= e.cantidad_actual; }
       } else {
          amounts[e.id] = 0;
       }
    });
    setEgresoAmounts(amounts);
    if (rem > 0) alert("No hay suficiente stock físico para completar la cantidad automática.");
  };

  const confirmarEgreso = async () => {
    const ids = Object.keys(egresoAmounts).filter(k => egresoAmounts[k] > 0);
    if(ids.length === 0) return;
    try {
      for (const id of ids) {
         const am = egresoAmounts[id];
         const eq = egresoEtiquetas.find(e => e.id.toString() === id);
         // lote_individual: marcar la etiqueta completa como consumida (no descuento parcial)
         if (eq?.tipo_gestion === 'lote_individual') {
             await executeAWSQuery(`
                BEGIN TRY
                   BEGIN TRANSACTION;
                   UPDATE Stock_Etiquetas SET cantidad_actual = 0, estado = 'consumido' WHERE id = ${id};
                   INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, usuario_id) VALUES (${id}, 'egreso_lote_individual', 1, '${user?.id || 1}');
                   COMMIT TRANSACTION;
                END TRY
                BEGIN CATCH
                   IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                   THROW;
                END CATCH
             `);
         } else {
            const n = eq.cantidad_actual - am;
            await executeAWSQuery(`
                BEGIN TRY
                   BEGIN TRANSACTION;
                   UPDATE Stock_Etiquetas SET cantidad_actual = ${n}, estado = '${n===0?'agotado':'activo'}' WHERE id = ${id};
                   INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, usuario_id) VALUES (${id}, 'egreso_auto', ${am}, '${user?.id || 1}');
                   COMMIT TRANSACTION;
                END TRY
                BEGIN CATCH
                   IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
                   THROW;
                END CATCH
             `);
         }
      }
      setIsEgresoModalOpen(false);
      fetchData();
      alert("Egreso exitoso mediante AutoFIFO distribuido.");
    } catch(e){
      console.error(e);
    }
  };

  const formatCurrency = (val: number, currency: string = 'USD') => {
    if(!val) val = 0;
    const cleanCurrency = (currency || 'USD').toUpperCase();
    const num = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);
    if (cleanCurrency === 'UYU') return `$ ${num}`;
    if (cleanCurrency === 'USD') return `U$S ${num}`;
    return `${cleanCurrency} ${num}`;
  };

  let filteredStock = stockConsolidado;
  if (filterMode === 'activos') filteredStock = filteredStock.filter(p => p.cantidad_total > 0);
  if (filterMode === 'inactivos') filteredStock = filteredStock.filter(p => !p.cantidad_total || p.cantidad_total === 0);

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filteredStock = filteredStock.filter(p => p.producto_nombre.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q)) || p.nombre_variante?.toLowerCase().includes(q));
  }

  const groupedStock = Object.values(filteredStock.reduce((acc, curr) => {
      if(!acc[curr.maestro_id]) {
          acc[curr.maestro_id] = {
              maestro_id: curr.maestro_id,
              producto_nombre: curr.producto_nombre,
              categoria_nombre: curr.categoria_nombre,
              variaciones_etiquetas: 0,
              capital_por_moneda: {},
              variantes: []
          };
      }
      acc[curr.maestro_id].variaciones_etiquetas += curr.variaciones_etiquetas;
      
      const mon = (curr.moneda || 'USD').toUpperCase();
      if (!acc[curr.maestro_id].capital_por_moneda[mon]) {
          acc[curr.maestro_id].capital_por_moneda[mon] = 0;
      }
      acc[curr.maestro_id].capital_por_moneda[mon] += (curr.capital_total || 0);

      acc[curr.maestro_id].variantes.push(curr);
      return acc;
  }, {} as any));

  const qtyActivos = groupedStock.filter((p:any) => p.variantes.some((v:any) => v.cantidad_total > 0)).length;
  const qtyInactivos = stockConsolidado.filter(p => !p.cantidad_total || p.cantidad_total === 0).length;

  const totalUSD = capitalActivo.find(c => c.moneda === 'USD')?.capital_total || 0;
  const totalUYU = capitalActivo.find(c => c.moneda === 'UYU')?.capital_total || 0;

  if (mainAccess === 'none') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-slate-50 dark:bg-slate-900 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Acceso Denegado</h2>
        <p className="text-slate-500 font-medium">No tienes permiso para ver el módulo de Inventario.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Activity className="w-12 h-12 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-32 w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 bg-slate-50 dark:bg-slate-950 min-h-screen">
      
      {/* HEADER VISUAL CON BOTONERA INCLUIDA (Restaurado a la versión "Tarjetas") */}
            {(activeTab !== 'panel' || panelView === 'hub') && (
      <div className="flex bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 shadow-sm mb-8 w-full items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-3 px-4 py-2">
             <div className="bg-slate-900 text-white p-2 rounded-xl"><Package className="w-5 h-5"/></div>
             <h1 className="text-xl font-black tracking-tighter">StockControl</h1>
          </div>
          <div className="flex flex-wrap bg-slate-50 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
            {[
              { id: 'panel', label: 'Panel', icon: LayoutDashboard, render: true },
              { id: 'inventario', label: 'Inventario', icon: Box, render: tabInvAcc !== 'none' },
              { id: 'historial', label: 'Historial', icon: History, render: tabHistAcc !== 'none' },
              
            ].filter(t => t.render).map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setPanelView('hub'); }}
                className={cn(
                  "px-6 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2",
                  activeTab === tab.id 
                    ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-sm ring-1 ring-slate-200 dark:ring-slate-700" 
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                )}
              >
                <tab.icon className="w-4 h-4"/> {tab.label}
              </button>
            ))}
          </div>
      </div>
      )}

      {/* PANEL HUB CON TARJETAS GIGANTES */}
      {activeTab === 'panel' && panelView === 'hub' && (
         <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="w-full">
            <AlertSummaryPanel />
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 py-4">
            
            {ingresarAcc !== 'none' && (
            <button onClick={() => setPanelView('ingreso')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-blue-200 dark:border-slate-800 dark:hover:border-blue-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-blue-500/5">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <ArrowDownToLine className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Ingresar Stock</h3>
                   <p className="text-slate-500 font-medium text-sm">Registrar nueva mercadería al sistema WMS mediante escaneo o compra.</p>
                </div>
            </button>
            )}
            
            {trasladarAcc !== 'none' && (
            <button onClick={() => setPanelView('traslado')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-purple-200 dark:border-slate-800 dark:hover:border-purple-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-purple-500/5">
                <div className="p-4 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <ArrowRightLeft className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Trasladar</h3>
                   <p className="text-slate-500 font-medium text-sm">Mover artículos entre diferentes sectores y almacenes físicos.</p>
                </div>
            </button>
            )}

            
            {/* NUEVO BOTON SOLICITUDES EN PANEL */}
            {solAcc !== 'none' && (
            <button onClick={() => setPanelView('solicitudes')} className={"relative bg-white dark:bg-slate-900 border-2 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl " + (solicitudes.length > 0 ? "border-rose-400 dark:border-rose-500/50 shadow-rose-500/10 hover:shadow-rose-500/20" : "border-slate-100 hover:border-emerald-200 dark:border-slate-800 dark:hover:border-emerald-900 hover:shadow-emerald-500/5")}>
                {solicitudes.length > 0 && (
                   <span className="absolute top-4 right-4 bg-rose-500 text-white font-black text-xs px-3 py-1 rounded-full shadow-lg shadow-rose-500/40 animate-pulse border-2 border-white dark:border-slate-900 z-10 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4"/> {solicitudes.length} PENDIENTES
                   </span>
                )}
                <div className={"p-4 rounded-2xl group-hover:scale-110 transition-transform " + (solicitudes.length > 0 ? "bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400" : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400")}>
                   <Send className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Órdenes Solicitadas</h3>
                   <p className="text-slate-500 font-medium text-sm">Aprobar, gestionar origen logístico y descontar envíos pedidos por otros sectores.</p>
                </div>
            </button>
            )}
            
            {retiroAcc !== 'none' && (
            <button onClick={() => setPanelView('retiro')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-orange-200 dark:border-slate-800 dark:hover:border-orange-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-orange-500/5">
                <div className="p-4 bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <ArrowUpFromLine className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Retirar Stock</h3>
                   <p className="text-slate-500 font-medium text-sm">Registrar ventas, consumos libres, mermas o salidas definitivas del patrimonio.</p>
                </div>
            </button>
            )}

            {etiqAcc !== 'none' && (
            <button onClick={() => setIsLabelModalOpen(true)} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-indigo-200 dark:border-slate-800 dark:hover:border-indigo-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-indigo-500/5">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl group-hover:scale-110 transition-transform">
                   <ScanBarcode className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Generar Etiqueta</h3>
                   <p className="text-slate-500 font-medium text-sm">Generador súper rápido de códigos de barras con lotes físicos (cajas, bidones, paletas).</p>
                </div>
            </button>
            )}

            {pesoAcc !== 'none' && (
            <button onClick={() => setPanelView('pesos')} className="bg-white dark:bg-slate-900 border-2 border-slate-100 hover:border-teal-200 dark:border-slate-800 dark:hover:border-teal-900 p-8 rounded-3xl text-left transition-all group flex flex-col items-start gap-6 hover:shadow-xl hover:shadow-teal-500/5">
                <div className="p-4 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 rounded-2xl group-hover:scale-110 transition-transform">
                   <Scale className="w-8 h-8" />
                </div>
                <div>
                   <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Registro de Peso</h3>
                   <p className="text-slate-500 font-medium text-sm">Cargar y vincular peso físico exacto a lotes y unidades mediante báscula o manualmente.</p>
                </div>
            </button>
            )}

         </div>
         </motion.div>
      )}

      
      {/* HEADER DINÁMICO DE RETORNO A OPERACIONES PARA SUB-MÓDULOS */}
      {activeTab === 'panel' && panelView !== 'hub' && (
         <div className="print:hidden mb-6 flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <div className="flex items-center gap-4">
                 <button onClick={()=>setPanelView('hub')} className="p-2.5 bg-slate-100 hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl transition-all shadow-sm">
                     <ArrowLeft className="w-5 h-5" />
                 </button>
                 <div>
                    <h2 className="font-black text-xl text-slate-800 dark:text-white leading-tight">
                        {panelView === 'ingreso' && "Ingreso de Mercadería"}
                        {panelView === 'traslado' && "Traslado Interno"}
                        {panelView === 'retiro' && "Retiro o Consumo Libre"}
                        {panelView === 'pesos' && "Registro de Peso Físico"}
                    </h2>
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-[0.2em] mt-0.5">Operación en proceso</p>
                 </div>
             </div>
         </div>
      )}

      {activeTab === 'panel' && panelView === 'ingreso' && (
         <div className="mt-4"><RecepcionAuditoria onRecargaRequerida={fetchData} onCartChange={setManualCart} /></div>
      )}

      {activeTab === 'panel' && panelView === 'traslado' && (
         <div className="mt-4"><DespachoEgresos initialOperationType="traslado" initialMode="lote" onComplete={fetchData} /></div>
      )}
      {activeTab === 'panel' && panelView === 'retiro' && (
         <div className="mt-4"><DespachoEgresos initialOperationType="venta_consumo" initialMode="lote" onComplete={fetchData} /></div>
      )}

      {/* PANEL PESOS */}
      {activeTab === 'panel' && panelView === 'pesos' && (
         <RegistroPesos />
      )}

      {/* PESTAÑA INVENTARIO */}
      {activeTab === 'inventario' && (
      <AnimatePresence>
      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}}>
      
      {/* FILTROS GEOGRÁFICOS AQUÍ */}
      <h3 className="text-sm font-black uppercase text-slate-400 tracking-widest mb-4">Filtrar por Locación (Almacenes)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          <button 
            onClick={() => { filterRef.current = null; setWarehouseFilterId(null); fetchData(); }}
            className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border-2 ${warehouseFilterId === null ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg dark:bg-indigo-900/40 dark:border-indigo-500 dark:text-indigo-300" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"}`}
          >
             <Network className="w-8 h-8 opacity-90" />
             <span className="font-black tracking-widest uppercase text-xs">Uso Global</span>
          </button>
          {depositos.map(dep => (
            <button 
              key={dep.id}
              onClick={() => { filterRef.current = dep.id.toString(); setWarehouseFilterId(dep.id.toString()); fetchData(); }}
              className={`p-4 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all border-2 ${warehouseFilterId === dep.id.toString() ? "bg-indigo-50 border-indigo-500 text-indigo-700 shadow-lg dark:bg-indigo-900/40 dark:border-indigo-500 dark:text-indigo-300" : "bg-white border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700"}`}
            >
               <Box className="w-8 h-8 opacity-90" />
               <span className="font-black uppercase tracking-widest text-xs text-center">{dep.nombre}</span>
            </button>
          ))}
      </div>

      <div className="card-nexus overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 flex gap-2">
           <div className="relative max-w-md flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
             <input type="text" placeholder="Buscar por Nombre o SKU..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="input-nexus pl-10 w-full" />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-900">
                <th className="px-8 py-5">Familia Maestro</th>
                <th className="px-8 py-5 text-right">Cantidad Física</th>
                <th className="px-8 py-5 text-center">Gestiones Lotes</th>
                {isAdminStock && <th className="px-8 py-5 text-right">Patrimonio</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
              {groupedStock.map((maestro: any, index: number) => {
                const isExpanded = !!expandedRows[maestro.maestro_id];
                return (
                <React.Fragment key={maestro.maestro_id+"_"+index}>
                <tr onClick={() => toggleRow(maestro.maestro_id)} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors group cursor-pointer">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <button className="p-1 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg">{isExpanded ? <ChevronDown className="w-5 h-5"/> : <ChevronRight className="w-5 h-5"/>}</button>
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-blue-950 dark:text-white uppercase">{maestro.producto_nombre}</p>
                        <p className="text-xs text-slate-500 font-medium tracking-tight mt-1">
                           <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400">{maestro.categoria_nombre}</span>
                           <span className="text-indigo-500 font-medium ml-2">{maestro.variantes.length} Variantes Inferiores</span>
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <span className="font-black text-xl text-blue-950 dark:text-white tracking-tighter">
                      {maestro.variantes.reduce((sum: number, v: any) => sum + (v.cantidad_total || 0), 0)} <span className="text-xs font-medium text-slate-400 uppercase">{maestro.unidad_base}</span>
                    </span>
                  </td>
                  <td className="px-8 py-6 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20">
                      <Layers className="w-3 h-3" /> {maestro.variaciones_etiquetas} Lotes Internos
                    </span>
                  </td>
                  {isAdminStock && (
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end gap-1">
                        {Object.keys(maestro.capital_por_moneda).length === 0 ? (
                          <span className="font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs block">
                            {formatCurrency(0, 'USD')}
                          </span>
                        ) : (
                          Object.entries(maestro.capital_por_moneda).map(([mon, total]: any) => (
                            <span key={mon} className="font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800 text-xs block">
                              {formatCurrency(total, mon)}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                  )}
                </tr>
                {isExpanded && maestro.variantes.map((v: any, vIdx: number) => (
                  <tr key={v.variante_id + "_" + vIdx} className="bg-slate-50/50 dark:bg-slate-900/50">
                    <td className="px-8 py-4 pl-24">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div> {getVisualName(v.categoria_nombre, v.producto_nombre, v.nombre_variante)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono tracking-widest mt-1 uppercase">{v.sku}</span>
                      </div>
                    </td>
                    <td className="px-8 py-4 text-right">
                       <span className={cn("font-bold", v.cantidad_total > 0 ? "text-emerald-600" : "text-rose-500")}>
                          {v.cantidad_total || 0}
                       </span>
                    </td>
                    <td className="px-8 py-4 text-center">
                       <div className="flex justify-center gap-2">
                         {v.cantidad_total > 0 && (
                          <button onClick={() => openLabelDrillDown(v)} className="btn-secondary text-[10px] py-1.5 px-3 border-emerald-200 text-emerald-700 hover:bg-emerald-50">Explorar Cajas</button>
                         )}
                         <button onClick={() => openEgresoAuto(v)} disabled={mainAccess === 'read'} title={mainAccess === 'read' ? 'No tienes permiso de escritura' : ''} className="btn-secondary text-[10px] py-1.5 px-3 disabled:opacity-50">Extraer AutoFIFO</button>
                       </div>
                    </td>
                    {isAdminStock && (
                      <td className="px-8 py-4 text-right">
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                          {formatCurrency(v.capital_total, v.moneda)}
                        </span>
                      </td>
                    )}
                  </tr>
                ))}
                </React.Fragment>
              )})}
            </tbody>
          </table>
        </div>
      </div>
      </motion.div>
      </AnimatePresence>
      )}

      


      
      {/* PANEL SOLICITUDES */}
      {activeTab === 'panel' && panelView === 'solicitudes' && (
         <div className="space-y-6 animate-in slide-in-from-right-4 w-full">
            <button onClick={() => setPanelView('hub')} className="bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-black px-6 py-3 rounded-xl mb-4 hover:bg-slate-300 dark:hover:bg-slate-700 transition">Volver al Panel Central</button>
            
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-black text-2xl text-slate-800 dark:text-white flex items-center gap-2">
                    <Send className="w-8 h-8 text-emerald-500" /> Cola de Órdenes Solicitadas ({solicitudes.length})
                </h3>
            </div>
            
            {solicitudes.length === 0 ? (
                 <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-6 py-12 text-center rounded-3xl border-2 border-emerald-100 dark:border-emerald-800">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4" />
                    <h3 className="text-2xl font-black mb-2">Todo al día</h3>
                    <p className="font-bold max-w-sm mx-auto">No hay ninguna solicitud operativa de mercadería en espera.</p>
                 </div>
            ) : (
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                     {solicitudes.map((sol: any) => (
                         <div key={sol.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-2xl flex justify-between flex-col transition hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-700">
                             <div className="flex justify-between mb-4">
                                <div>
                                   <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-1">Sector Solicitante / Usuario</p>
                                   <h4 className="font-black text-lg text-slate-800 dark:text-white leading-tight">{sol.sector_nombre || 'N/A'}</h4>
                                   <p className="font-bold text-slate-500 text-xs mt-1"><User className="w-3 h-3 inline pb-0.5"/> {sol.operario_nombre}</p>
                                </div>
                                <div className="text-right">
                                   <span className="font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-black uppercase shadow-sm border border-emerald-100">{sol.numeracion}</span>
                                </div>
                             </div>
                             <p className="font-bold text-slate-400 text-xs mb-6">Fecha Pedido: {new Date(sol.fecha_creacion).toLocaleString()}</p>
                             
                                                           <div className="flex gap-3">
                                 <button onClick={() => handleCancelarSolicitud(sol.id)} className="bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40 p-4 rounded-xl transition flex items-center justify-center shadow-sm" title="Cancelar Orden">
                                     <Trash2 className="w-5 h-5" />
                                 </button>
                                 <button onClick={() => handleOpenSolicitud(sol)} className="flex-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black py-4 rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition">
                                    EVALUAR Y ASIGNAR STOCK
                                 </button>
                              </div>
                         </div>
                     ))}
                 </div>
            )}
         </div>
      )}

      {/* MODAL: ÓRDENES SOLICITADAS Y COBERTURAS */}
      <Modal isOpen={!!selectedModalSol} onClose={() => { setSelectedModalSol(null); setRemitoPDFInfo(null); }} title={`Asignar Stock para Orden: ${selectedModalSol?.numeracion || ''}`}>
         {selectedModalSol && (
            <div className="space-y-6">
               <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-xl border border-amber-200 dark:border-amber-900/30 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-800 dark:text-amber-500">
                       Orígenes de Extracción
                    </span>
                 </div>
                 <button
                    onClick={openOriginSubModal}
                    className="bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 hover:border-amber-500 text-xs font-bold text-slate-700 dark:text-slate-200 py-1.5 px-4 rounded-lg shadow-sm transition-all flex items-center gap-2"
                 >
                    {solicitudOrigenSel[selectedModalSol.id]?.length > 0
                        ? `${solicitudOrigenSel[selectedModalSol.id].length} Almacén(es) Elegido(s) - Cambiar`
                        : 'Elegir Origen...'}
                 </button>
               </div>

               <div className="flex bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 items-center justify-between mt-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Destino Físico</p>
                    <p className="font-black text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-500" /> {selectedModalSol.sector_nombre}
                    </p>
                  </div>
               </div>

               <div>
                 <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3 pb-2 border-b border-slate-100">Artículos Solicitados</h4>
                 {!solicitudItems[selectedModalSol.id] ? (
                    <div className="py-8 text-center text-slate-400 text-sm animate-pulse">Cargando...</div>
                 ) : (
                    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Artículo</th>
                            <th className="px-5 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Req.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {solicitudItems[selectedModalSol.id].map((item: any) => (
                            <tr key={item.id} className="hover:bg-slate-50">
                              <td className="px-5 py-3">
                                 <p className="font-bold text-slate-800">
                                     {getVisualName(item.cat_nombre, item.producto_nombre, item.nombre_variante)}
                                 </p>
                              </td>
                              <td className="px-5 py-3 text-center">
                                 <input 
                                   type="number" 
                                   min="1"
                                   className="w-20 text-center font-black text-lg text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg p-1 outline-none focus:ring-2 focus:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                   value={item.cantidad_solicitada}
                                   onChange={(e) => {
                                      const val = parseInt(e.target.value) || 1;
                                      setSolicitudItems(prev => ({
                                        ...prev,
                                        [selectedModalSol.id]: prev[selectedModalSol.id].map((it: any) => 
                                          it.id === item.id ? { ...it, cantidad_solicitada: val } : it
                                        )
                                      }));
                                   }}
                                 />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                 )}
               </div>

                               <div className="flex gap-3 mt-4">
                   <button onClick={() => handleCancelarSolicitud(selectedModalSol.id)} className="bg-rose-600 hover:bg-rose-500 text-white font-black py-4 px-6 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-transform">
                       <Trash2 className="w-5 h-5"/> CANCELAR ORDEN
                   </button>
                   <button disabled={enviandoSolicitud === selectedModalSol.id || !solicitudOrigenSel[selectedModalSol.id]?.length || solAcc === 'read'} title={solAcc === 'read' ? 'No tienes permiso de escritura' : ''} onClick={() => handleEnviarSolicitud(selectedModalSol)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all disabled:opacity-50">
                      {enviandoSolicitud === selectedModalSol.id ? 'CREANDO REMITO...' : 'ENTREGAR Y GENERAR REMITO'}
                   </button>
                </div>
            </div>
         )}
      </Modal>

      {/* MODAL REMITO CREADO */}
      <Modal isOpen={remitoPDFInfo !== null && !selectedModalSol} onClose={() => setRemitoPDFInfo(null)} title="Remito Generado">
          {remitoPDFInfo && (
              <div className="text-center p-4 space-y-6">
                  <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto" />
                  <div>
                    <h3 className="text-2xl font-black mb-1 text-slate-800 dark:text-white">¡Despacho Registrado!</h3>
                    <p className="text-sm text-slate-500 font-medium">La mercadería ya entró en tránsito logístico y el remito fue creado con éxito.</p>
                  </div>
                  <button
                    onClick={() => {
                      printRemito(
                        remitoPDFInfo.cart,
                        { codigo: remitoPDFInfo.codigo, fecha: remitoPDFInfo.fecha, estado: 'EN_TRÁNSITO', origen: remitoPDFInfo.origen, destino: remitoPDFInfo.destino },
                        'despacho'
                      );
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-4 uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-indigo-600/30"
                  >
                      <ClipboardList className="w-6 h-6"/> IMPRIMIR REMITO A4
                  </button>
                  <button onClick={() => setRemitoPDFInfo(null)} className="w-full py-4 uppercase font-bold tracking-widest text-xs border-2 border-slate-200 rounded-2xl hover:bg-slate-50">Cerrar</button>
              </div>
          )}
      </Modal>

      {/* SUB-MODAL ORÍGENES */}
      {isSubModalOriginOpen && selectedModalSol && (
        <Modal isOpen={true} onClose={() => setIsSubModalOriginOpen(false)} title="Elegir Almacén Físico">
          <div className="space-y-6">
             <p className="text-sm font-medium text-slate-500">Selecciona desde qué almacenes saldrá la mercadería. Si el primero no alcanza, selecciona más en secuencia.</p>
             {isLoadingCoverage ? ( <div className="py-8 text-center">Calculando cobertura...</div> ) : (
             <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
               {depositos.filter((d:any) => String(d.id) !== String(selectedModalSol.deposito_solicitante_id)).map((d:any) => {
                  const sels = solicitudOrigenSel[selectedModalSol.id] || [];
                  const idx = sels.indexOf(String(d.id));
                  const isSelected = idx !== -1;
                  const coverage = stockCoverage[d.id];
                  
                  let isLockedOut = false;
                  for (let i = 0; i < sels.length; i++) {
                     if (String(sels[i]) !== String(d.id) && stockCoverage[Number(sels[i])]?.status === "FULL" && i <= idx) break; 
                     if (String(sels[i]) !== String(d.id) && stockCoverage[Number(sels[i])]?.status === "FULL" && !isSelected) isLockedOut = true;
                  }

                  return (
                    <button key={d.id} disabled={isLockedOut || (!isSelected && coverage?.status === "NONE")}
                      onClick={() => setSolicitudOrigenSel(prev => {
                            const cur = prev[selectedModalSol.id] || [];
                            return isSelected ? { ...prev, [selectedModalSol.id]: cur.filter(x => x !== String(d.id)) } : { ...prev, [selectedModalSol.id]: [...cur, String(d.id)] };
                      })}
                      className={"relative flex flex-col items-center justify-center p-4 border-2 rounded-2xl transition-all " + (isSelected ? "bg-indigo-50 border-indigo-500 text-indigo-700" : isLockedOut || coverage?.status === "NONE" ? "bg-slate-50 border-slate-100 text-slate-300 opacity-60 cursor-not-allowed" : "bg-white border-slate-200 hover:border-indigo-300")}
                    >
                       <MapPin className={"w-8 h-8 mb-2 " + (isSelected ? "text-indigo-500" : coverage?.status === "NONE" ? "text-slate-300" : "text-amber-500")} />
                       <span className="font-black text-[10px] tracking-widest text-center uppercase leading-tight mb-2 h-6">{d.nombre}</span>
                       <span className={"text-[9px] font-bold px-2 py-0.5 rounded-full border uppercase mt-auto " + (coverage?.status==="FULL" ? "bg-emerald-100 text-emerald-700 border-emerald-200" : coverage?.status==="PARTIAL" ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-400 border-slate-200")}>
                          {coverage?.status==="FULL" ? "COMPLETA 100%" : coverage?.status==="PARTIAL" ? "INCOMPLETA STOCK" : "SIN STOCK"}
                       </span>
                       {isSelected && (<div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-indigo-500 text-white font-black text-xs flex items-center justify-center border-2 border-white">{idx + 1}</div>)}
                    </button>
                  )
               })}
             </div>
             )}
             <button onClick={() => setIsSubModalOriginOpen(false)} className="w-full bg-slate-900 text-white font-black py-4 uppercase text-sm rounded-xl">Hecho</button>
          </div>
        </Modal>
      )}

{/* HISTORIAL GLOBAL */}
      {activeTab === 'historial' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="font-black text-2xl flex items-center gap-3 text-slate-800 dark:text-white">
                     <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-xl">
                        <History className="w-8 h-8" />
                     </div>
                     Trazabilidad y Emisiones (Historial WMS)
                 </h3>
                 <button onClick={() => { fetchGlobalHistorial(); fetchGlobalEgresos(); }} className="font-bold border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition">Sincronizar</button>
             </div>

             <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 max-w-md mb-6">
                <button 
                   onClick={() => setHistorialSubTab('remitos')} 
                   className={cn(
                     "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", 
                     historialSubTab === 'remitos' 
                       ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-sm ring-1 ring-slate-200/50" 
                       : "text-slate-500 hover:text-slate-700"
                   )}
                >
                   Traslados (Remitos)
                </button>
                <button 
                   onClick={() => setHistorialSubTab('egresos')} 
                   className={cn(
                     "flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all", 
                     historialSubTab === 'egresos' 
                       ? "bg-white dark:bg-slate-800 text-blue-900 dark:text-white shadow-sm ring-1 ring-slate-200/50" 
                       : "text-slate-500 hover:text-slate-700"
                   )}
                >
                   Egresos / Bajas de Stock
                </button>
             </div>

             <div className="flex flex-col md:flex-row gap-4 mb-8">
                 <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 dark:text-slate-500" />
                    <input 
                       type="text" 
                       placeholder={historialSubTab === 'remitos' ? "Buscar por código de remito, almacén de origen o destino..." : "Buscar por artículo, lote, almacén o responsable..."} 
                       value={historialSearch} 
                       onChange={e=>setHistorialSearch(e.target.value)} 
                       className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-white" 
                    />
                 </div>
                 <div className="w-full md:w-64 relative">
                    <input type="date" value={historialDate} onChange={e=>setHistorialDate(e.target.value)} className="w-full px-4 py-4 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm text-slate-800 dark:text-white" />
                 </div>
             </div>

             {historialSubTab === 'remitos' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
                     {globalHistorial.filter(r => (!historialDate || r.fecha_creacion.startsWith(historialDate)) && (!historialSearch || r.numeracion?.toLowerCase().includes(historialSearch.toLowerCase()) || r.origen_nombre?.toLowerCase().includes(historialSearch.toLowerCase()) || r.destino_nombre?.toLowerCase().includes(historialSearch.toLowerCase()))).map((rem:any) => (
                            <div key={rem.id} onClick={() => { handleVerHistorialDetalles(rem); setIsViewingFullscreenPDF(true); }} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col justify-between gap-6 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer group">
                                <div className="flex items-start gap-5">
                                    <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <PackageCheck className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md shadow-sm">{rem.numeracion}</span>
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">{new Date(rem.fecha_creacion).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-rose-400"/> Salida: {rem.origen_nombre}</p>
                                          {rem.estado === 'EGRESO' ? (
                                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><ArrowRightLeft className="w-3 h-3 text-slate-400"/> Retiro Libre (Egreso)</p>
                                          ) : (
                                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1"><ArrowRightLeft className="w-3 h-3 text-indigo-400"/> Destino: {rem.destino_nombre}</p>
                                          )}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{rem.total_unidades || 0} Unidades Físicas</p>
                                        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mt-0.5">Resp: {rem.usuario_emisor || rem.creado_por || 'Sistema'}</p>
                                    </div>
                                    <span className="text-[10px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 border border-emerald-100 dark:border-emerald-800 px-2.5 py-1 rounded-full font-black uppercase tracking-widest">{rem.estado}</span>
                                </div>
                            </div>
                     ))}
                     {globalHistorial.filter(r => (!historialDate || r.fecha_creacion.startsWith(historialDate)) && (!historialSearch || r.numeracion?.toLowerCase().includes(historialSearch.toLowerCase()) || r.origen_nombre?.toLowerCase().includes(historialSearch.toLowerCase()) || r.destino_nombre?.toLowerCase().includes(historialSearch.toLowerCase()))).length === 0 && (
                         <div className="col-span-full py-20 text-center">
                             <History className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                             <p className="font-bold text-slate-500 text-lg">No se encontraron remitos con los filtros seleccionados.</p>
                         </div>
                     )}
                 </div>
             )}

             {historialSubTab === 'egresos' && (
                 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in duration-300">
                     {globalEgresos.filter(r => (!historialDate || r.fecha.startsWith(historialDate)) && (!historialSearch || r.producto_nombre?.toLowerCase().includes(historialSearch.toLowerCase()) || r.nombre_variante?.toLowerCase().includes(historialSearch.toLowerCase()) || r.usuario_id?.toLowerCase().includes(historialSearch.toLowerCase()) || r.usuario_nombre?.toLowerCase().includes(historialSearch.toLowerCase()) || r.codigo_barras?.toLowerCase().includes(historialSearch.toLowerCase()))).map((egr: any) => {
                         const isApi = !egr.usuario_nombre && egr.usuario_id && (egr.usuario_id.includes('-') || egr.usuario_id.length > 20);
                         const sourceLabel = isApi ? "API Externa" : "Sistema WMS";
                         const sourceColor = isApi 
                           ? "bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30" 
                           : "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
                         const displayUser = egr.usuario_nombre || egr.usuario_id || "Sistema";

                         return (
                             <div key={egr.id} className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl flex flex-col justify-between gap-6 hover:shadow-xl hover:border-slate-200 dark:hover:border-slate-700 transition-all select-none">
                                 <div className="flex items-start gap-5">
                                     <div className="w-14 h-14 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-2xl flex items-center justify-center shrink-0">
                                         <ArrowUpRight className="w-6 h-6" />
                                     </div>
                                     <div className="flex-1 min-w-0">
                                         <div className="flex items-center gap-2 mb-2 flex-wrap">
                                             <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", sourceColor)}>{sourceLabel}</span>
                                             <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                                                {new Date(egr.fecha).toLocaleDateString()} {new Date(egr.fecha).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                             </span>
                                         </div>
                                         <h4 className="font-black text-slate-800 dark:text-white text-base leading-tight truncate" title={getVisualName(egr.categoria_nombre, egr.producto_nombre, egr.nombre_variante)}>
                                             {getVisualName(egr.categoria_nombre, egr.producto_nombre, egr.nombre_variante)}
                                         </h4>
                                         <p className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">Lote: {egr.codigo_barras}</p>
                                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-1">
                                             <Box className="w-3.5 h-3.5 text-slate-400"/> Almacén: {egr.origen_nombre || 'N/A'}
                                         </p>
                                     </div>
                                 </div>
                                 <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                                     <div className="flex-1 min-w-0 mr-3">
                                         <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Responsable</p>
                                         <p className="text-xs font-black text-slate-700 dark:text-slate-300 mt-0.5 truncate" title={displayUser}>{displayUser}</p>
                                     </div>
                                     <div className="text-right shrink-0">
                                         <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Cantidad</p>
                                         <span className="text-lg font-black text-rose-500 tracking-tighter">
                                             -{egr.cantidad_afectada}
                                         </span>
                                     </div>
                                 </div>
                             </div>
                         );
                     })}
                     {globalEgresos.filter(r => (!historialDate || r.fecha.startsWith(historialDate)) && (!historialSearch || r.producto_nombre?.toLowerCase().includes(historialSearch.toLowerCase()) || r.nombre_variante?.toLowerCase().includes(historialSearch.toLowerCase()) || r.usuario_id?.toLowerCase().includes(historialSearch.toLowerCase()) || r.usuario_nombre?.toLowerCase().includes(historialSearch.toLowerCase()) || r.codigo_barras?.toLowerCase().includes(historialSearch.toLowerCase()))).length === 0 && (
                         <div className="col-span-full py-20 text-center">
                             <History className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
                             <p className="font-bold text-slate-500 text-lg">No se encontraron egresos o bajas con los filtros seleccionados.</p>
                         </div>
                     )}
                 </div>
             )}
          </div>
      )}

            {/* FULLSCREEN PDF VISOR HISTORIAL */}
      {isViewingFullscreenPDF && selectedHistorialRemito && (
        <div id="print-root" className="fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 flex flex-col items-center">
            <div className="hide-on-print fixed top-6 right-6 flex gap-4 z-[110]">
              <button onClick={() => {
                  printRemito(
                    selectedHistorialRemito.cart,
                    {
                      codigo: selectedHistorialRemito.codigo,
                      fecha: selectedHistorialRemito.fecha,
                      estado: selectedHistorialRemito.estado,
                      origen: selectedHistorialRemito.origen,
                      destino: selectedHistorialRemito.destino,
                    },
                    'despacho'
                  );
              }} className="bg-indigo-600 text-white p-4 rounded-full hover:bg-indigo-700 flex items-center shadow-lg"><span className="font-black text-xs uppercase">Imprimir A4</span></button>
              <button onClick={() => { setIsViewingFullscreenPDF(false); setSelectedHistorialRemito(null); }} className="bg-white text-slate-900 p-4 rounded-full hover:bg-slate-200"><span className="font-black text-xs uppercase">Cerrar</span></button>
            </div>
            {(selectedHistorialRemito.cart.length > 0 ? selectedHistorialRemito.cart.reduce((acc:any, curr:any, i:number) => { if (i % 30 === 0) acc.push([]); acc[acc.length - 1].push(curr); return acc; }, []) : [[]]).map((pageItems:any, pageIndex:number) => (
                    <div key={pageIndex} className="w-[794px] min-h-[1123px] bg-white text-slate-800 font-sans p-10 mb-4 shrink-0 shadow-xl" style={{ pageBreakAfter: 'always' }}>
                        <div className="flex justify-between border-b pb-5 mb-5 align-top">
                            <div>
                                <h1 className="text-3xl font-black mb-1">REMITO DE MOVIMIENTO</h1>
                            </div>
                            <div className="text-right">
                                <span className="font-mono font-black border border-slate-200 px-3 py-1 rounded-md">{selectedHistorialRemito.codigo}</span>
                                <p className="font-bold text-xs mt-2">{selectedHistorialRemito.fecha}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="border border-slate-200 p-4 rounded-xl"><p className="text-[10px] font-bold text-slate-400">Origen</p><p className="font-black">{selectedHistorialRemito.origen}</p></div>
                            <div className="border border-slate-200 p-4 rounded-xl"><p className="text-[10px] font-bold text-slate-400">Destino</p><p className="font-black">{selectedHistorialRemito.estado === 'EGRESO' ? 'Retiro Libre (Egreso)' : selectedHistorialRemito.destino}</p></div>
                        </div>
                        <table className="w-full text-left bg-white border border-slate-200 rounded-xl border-collapse">
                            <thead><tr className="border-b"><th className="py-2 px-3 text-[10px] border-r">Cantidad</th><th className="py-2 px-3 text-[10px] border-r">Lotes (Multi-Secuencia)</th><th className="py-2 px-3 text-[10px]">Artículo</th></tr></thead>
                            <tbody className="divide-y">
                                {pageItems.map((c:any, idx:number)=>(
                                   <tr key={idx} className="bg-white"><td className="py-2 px-3 border-r font-black text-center">{c.cantidad_a_extraer || c.cantidad_enviada}</td><td className="py-2 px-3 border-r font-mono text-xs text-slate-500">{c.codigo_barras || 'N/A'}</td><td className="py-2 px-3 font-bold">{getVisualName(c.cat_nombre, c.producto_nombre, c.nombre_variante)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
            ))}
        </div>
      )}

      {/* FULLSCREEN PDF PARA NUEVO REMITO */}
      {isViewingFullscreenPDF && remitoPDFInfo && !selectedHistorialRemito && (
        <div id="print-root" className="fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 flex flex-col items-center">
            <div className="hide-on-print fixed top-6 right-6 flex gap-4 z-[110]">
              <button onClick={() => {
                  printRemito(
                    remitoPDFInfo.cart,
                    {
                      codigo: remitoPDFInfo.codigo,
                      fecha: remitoPDFInfo.fecha,
                      estado: 'DESPACHADO',
                      origen: remitoPDFInfo.origen,
                      destino: remitoPDFInfo.destino,
                    },
                    'despacho'
                  );
              }} className="bg-indigo-600 text-white p-4 rounded-full flex items-center shadow-lg"><span className="font-black text-xs">Imprimir A4</span></button>
              <button onClick={() => { setIsViewingFullscreenPDF(false); setRemitoPDFInfo(null); setSelectedModalSol(null); }} className="bg-white p-4 rounded-full"><span className="font-black text-xs">Cerrar</span></button>
            </div>
            
            {(remitoPDFInfo.cart.length > 0 ? remitoPDFInfo.cart.reduce((acc:any, curr:any, i:number) => { if (i % 30 === 0) acc.push([]); acc[acc.length - 1].push(curr); return acc; }, []) : [[]]).map((pageItems:any, pageIndex:number) => (
                    <div key={pageIndex} className="w-[794px] min-h-[1123px] bg-white text-slate-800 font-sans p-10 mb-4 shrink-0 shadow-xl" style={{ pageBreakAfter: 'always' }}>
                        <div className="flex justify-between border-b pb-5 mb-5 align-top">
                            <div><h1 className="text-3xl font-black mb-1">REMITO DESPACHO (NUEVO)</h1></div>
                            <div className="text-right">
                                <span className="font-mono font-black border border-slate-200 px-3 py-1 rounded-md">{remitoPDFInfo.codigo}</span>
                                <p className="font-bold text-xs mt-2">{remitoPDFInfo.fecha}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="border border-slate-200 p-4 rounded-xl"><p className="text-[10px] font-bold text-slate-400">Origen Consolidado</p><p className="font-black">{remitoPDFInfo.origen}</p></div>
                            <div className="border border-slate-200 p-4 rounded-xl"><p className="text-[10px] font-bold text-slate-400">Destino</p><p className="font-black">{remitoPDFInfo.destino}</p></div>
                        </div>
                        <table className="w-full text-left border rounded-xl border-collapse">
                            <thead><tr className="border-b"><th className="py-2 px-3 text-[10px] border-r">Cantidad</th><th className="py-2 px-3 text-[10px] border-r">Lotes (Multi-Secuencia)</th><th className="py-2 px-3 text-[10px]">Artículo</th></tr></thead>
                            <tbody className="divide-y">
                                {pageItems.map((c:any, idx:number)=>(
                                   <tr key={idx} className="bg-white"><td className="py-2 px-3 border-r font-black text-center">{c.cantidad_a_extraer}</td><td className="py-2 px-3 border-r font-mono text-xs">{c.codigo_barras}</td><td className="py-2 px-3 font-bold">{getVisualName(c.cat_nombre, c.producto_nombre, c.nombre_variante)}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
            ))}
        </div>
      )}

      {/* MODALES CLAVE */}
      
      {/* MODAL ETIQUETAS */}
      <Modal isOpen={isLabelModalOpen} onClose={() => setIsLabelModalOpen(false)} title="Generador de Rótulos / Cajas Físicas">
         <form onSubmit={handleGenerateLabels} className="space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Variante a Imprimir (Seleccione de Base Existente)</label>
               <select required value={newLabel.variante_id} onChange={e => setNewLabel({...newLabel, variante_id: e.target.value})} className="input-nexus w-full bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200">
                  <option value="" disabled>Seleccione una variante mapeada...</option>
                  {stockConsolidado.flatMap(c => c.variantes || []).filter(Boolean).map(v => <option key={v.variante_id} value={v.variante_id}>{v.nombre_variante} ({v.sku})</option>)}
               </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volumen por Unidad/Caja</label>
                 <input type="number" min="0.01" step="0.01" required value={newLabel.cantidad_por_etiqueta} onChange={e => setNewLabel({...newLabel, cantidad_por_etiqueta: Number(e.target.value)})} className="input-nexus w-full bg-transparent" />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Número de Códigos a Generar</label>
                 <input type="number" min="1" required value={newLabel.numero_etiquetas} onChange={e => setNewLabel({...newLabel, numero_etiquetas: Number(e.target.value)})} className="input-nexus w-full font-black text-indigo-600 bg-transparent" />
              </div>
            </div>
            <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Asignar a Almacén Local</label>
                 <select required value={newLabel.deposito_id} onChange={e => setNewLabel({...newLabel, deposito_id: e.target.value})} className="input-nexus w-full bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200">
                    <option value="" disabled>Seleccione almacén de destino...</option>
                    {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                 </select>
            </div>
            <button type="submit" disabled={etiqAcc === 'read'} title={etiqAcc === 'read' ? 'No tienes permiso de escritura' : ''} className="w-full btn-primary py-4 uppercase tracking-widest font-black shadow-lg shadow-indigo-500/20 disabled:opacity-50">Imprimir Lotes y Agregar a Base de Datos</button>
         </form>
      </Modal>

      {/* MODAL DE EXPLORACION DE CAJAS (Lotes) */}
      <Modal isOpen={isLabelDrillDownOpen} onClose={() => setIsLabelDrillDownOpen(false)} title={isAdminStock ? `Distribución de Costos y Lotes: ${variationChartProduct?.nombre_variante}` : `Distribución de Lotes: ${variationChartProduct?.nombre_variante}`}>
         <div className="space-y-4 text-left">
              {labelCatalog.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No hay stock activo para esta variante.</p>
              ) : (
                labelCatalog.map((group: any, i: number) => (
                   <div key={i} className="flex flex-col bg-slate-50 dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 gap-2">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                         <div>
                            <span className="font-black text-sm text-slate-800 dark:text-white block">
                               {group.cantidad_total} unidad(es)
                            </span>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                               Ingreso: {group.fecha_ingreso}
                            </span>
                         </div>
                         {isAdminStock && (
                           <div className="flex items-center gap-2">
                             <span className="font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1 rounded text-sm">
                                {formatCurrency(group.costo_unitario, variationChartProduct?.moneda)} c/u
                             </span>
                             <button 
                               onClick={() => openEditCostoGroupModal(variationChartProduct, group)} 
                               className="btn-secondary text-[10px] py-1 px-2.5 border-blue-200 text-blue-700 hover:bg-blue-50"
                             >
                               Editar Costo
                             </button>
                           </div>
                         )}
                      </div>
                      <div className="flex justify-end items-center text-xs">
                         <span className="text-[10px] text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded font-bold">
                            {group.cantidad_lotes} lote(s) / caja(s)
                         </span>
                      </div>
                   </div>
                ))
              )}
          </div>
       </Modal>

      {/* MODAL EDITAR COSTO */}
      <Modal isOpen={editingVariant !== null && editingGroup !== null} onClose={() => { setEditingVariant(null); setEditingGroup(null); }} title={`Editar Costo de Lote: ${editingVariant?.nombre_variante || ''}`}>
        <div className="space-y-6 text-left">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl space-y-1.5 text-xs text-slate-500 font-medium">
            <p><strong>Fecha Ingreso:</strong> {editingGroup?.fecha_ingreso}</p>
            <p><strong>Costo Actual:</strong> {formatCurrency(editingGroup?.costo_unitario, editingVariant?.moneda)}</p>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nuevo Costo Unitario ({editingVariant?.moneda})</label>
            <input 
              type="number" 
              min="0" 
              step="0.01" 
              value={newCosto} 
              onChange={e => setNewCosto(e.target.value)} 
              className="input-nexus w-full bg-slate-50 dark:bg-slate-900 border-none ring-1 ring-slate-200" 
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
            <input 
              type="checkbox" 
              id="updateExistingStock" 
              checked={updateExistingStock} 
              onChange={e => setUpdateExistingStock(e.target.checked)} 
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="updateExistingStock" className="text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
              Actualizar también el costo predeterminado de la variante (para futuros ingresos).
            </label>
          </div>

          <div className="flex gap-4">
            <button 
              onClick={() => { setEditingVariant(null); setEditingGroup(null); }} 
              className="w-1/2 py-3 border-2 border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition font-black text-xs uppercase"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSaveCosto} 
              disabled={savingCosto} 
              className="w-1/2 btn-primary py-3 uppercase tracking-widest font-black shadow-lg shadow-blue-500/20 disabled:opacity-50 text-xs"
            >
              {savingCosto ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL DE EXTRACCION AUTOFIFO */}
      <Modal isOpen={isEgresoModalOpen} onClose={() => setIsEgresoModalOpen(false)} title={`Extracción FIFO Automática: ${egresoProduct?.nombre_variante}`}>
         <div className="space-y-6">
             <div className="flex items-end gap-4 p-6 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border-2 border-emerald-100 dark:border-emerald-900/30">
                 <div className="flex-1 space-y-2">
                    <label className="text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">Ingrese la cantidad necesaria</label>
                    <input type="number" min="1" value={egresoAutoMonto} onChange={e => setEgresoAutoMonto(Number(e.target.value))} className="w-full text-center text-3xl font-black bg-transparent border-b-2 border-emerald-300 dark:border-emerald-700 outline-none text-emerald-900" />
                 </div>
                 <button onClick={applyAutoFIFO} className="px-6 py-4 rounded-xl font-bold uppercase tracking-widest bg-emerald-600 shadow-lg text-white hover:bg-emerald-700">Trazar Algoritmo FIFO</button>
             </div>

             <div className="space-y-3">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trazabilidad Predictiva</p>
                 {Object.keys(egresoAmounts).filter(k => egresoAmounts[k] > 0).map(id => {
                     const etq = egresoEtiquetas.find(e => e.id.toString() === id);
                     return (
                         <div key={id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                             <div className="flex items-center gap-2">
                                <span className="font-mono text-xs">{etq?.codigo_barras}</span>
                                <span className="text-[9px] bg-slate-200 dark:bg-slate-800 px-2 rounded-full font-medium">Lote Físico: {etq?.cantidad_actual}</span>
                             </div>
                             <span className="font-black text-sm text-rose-500">
                                - {egresoAmounts[id]} uds
                             </span>
                         </div>
                     );
                 })}
             </div>

             <button onClick={confirmarEgreso} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-4 uppercase tracking-widest rounded-xl shadow-lg transition-all disabled:opacity-50" title={mainAccess === 'read' ? 'No tienes permiso de escritura' : ''} disabled={Object.keys(egresoAmounts).filter(k => egresoAmounts[k] > 0).length === 0 || mainAccess === 'read'}>
                Descontar Mercadería Definitivamente
             </button>
         </div>
      </Modal>

    
      {/* GLOBAL VIEW HISTORIAL PORTAL */}
      {selectedHistorialRemito && (
        <div className="fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 sm:p-10 flex flex-col items-center gap-8 print:static print:inset-auto print:h-auto print:w-auto print:overflow-visible print:block print:p-0 print:bg-white hide-scrollbar">
            <div className="hide-on-print fixed top-6 right-6 flex gap-4 z-[110]">
              <button
                onClick={() => {
                  printRemito(
                    selectedHistorialRemito.cart,
                    {
                      codigo: selectedHistorialRemito.codigo,
                      fecha: selectedHistorialRemito.fecha,
                      estado: selectedHistorialRemito.estado,
                      origen: selectedHistorialRemito.origen,
                      destino: selectedHistorialRemito.destino,
                    },
                    'despacho'
                  );
                }}
                className="bg-indigo-600 text-white p-4 rounded-full shadow-2xl hover:bg-indigo-700 transition-transform hover:scale-110 flex items-center justify-center"
              >
                 <span className="font-black text-xs uppercase tracking-widest flex items-center gap-2"><Printer className="w-4 h-4"/> Imprimir Hoja</span>
              </button>
              <button onClick={() => setSelectedHistorialRemito(null)} className="bg-white text-slate-900 p-4 rounded-full shadow-2xl hover:bg-slate-200 transition-transform hover:scale-110 flex items-center justify-center">
                 <span className="font-black text-xs uppercase tracking-widest">X Cerrar</span>
              </button>
            </div>
            
            <div id="print-root" className="w-full flex flex-col items-center gap-12 print:block print:static print:w-full print:h-auto print:overflow-visible">
                {(selectedHistorialRemito.cart.length > 0 ? selectedHistorialRemito.cart.reduce((acc, curr, i) => { if (i % 30 === 0) acc.push([]); acc[acc.length - 1].push(curr); return acc; }, []) : [[]]).map((pageItems, pageIndex, pagesArray) => (
                    <div key={pageIndex} className="w-[794px] min-h-[1123px] bg-white text-slate-800 font-sans p-10 shadow-2xl relative border border-slate-100 flex flex-col shrink-0 " style={{ pageBreakAfter: 'always' }}>
                        <div className="flex justify-between items-start border-b border-slate-100 pb-5 mb-5 relative">
                            <div className="w-1/2 pr-6">
                                <h1 className="text-3xl font-black mb-1 tracking-tighter text-slate-900 leading-none">REMITO DE MOVIMIENTO</h1>
                                <p className="font-bold text-xs text-slate-400 uppercase tracking-widest">SISTEMA LOGÍSTICO INTERNO · WMS</p>
                            </div>
                            <div className="w-1/2 pl-6 text-right">
                                <div className="inline-block text-left bg-slate-50 p-4 rounded-xl border border-slate-100 w-full">
                                    <div className="flex justify-between mb-2 border-b border-slate-100 pb-2">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">N° Documento</span>
                                        <span className="font-mono font-black text-slate-700 text-sm">{selectedHistorialRemito.codigo}</span>
                                    </div>
                                    <div className="flex justify-between mb-2 border-b border-slate-100 pb-2">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Fecha Operación</span>
                                        <span className="font-mono font-bold text-slate-700 text-xs">{selectedHistorialRemito.fecha}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">Estado</span>
                                        <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">{selectedHistorialRemito.estado}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <div className="border border-slate-100 p-4 rounded-xl bg-white shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-rose-400"/> Sale desde (Origen Logístico)</p>
                                <p className="font-black text-lg text-slate-800 leading-tight">{selectedHistorialRemito.origen}</p>
                            </div>
                            <div className="border border-slate-100 p-4 rounded-xl bg-white shadow-sm">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1"><ArrowRightLeft className="w-3 h-3 text-indigo-400"/> {selectedHistorialRemito.estado === 'EGRESO' ? 'Tipo de Operación' : 'Llega a (Destino Físico)'}</p>
                                <p className="font-black text-lg text-slate-800 leading-tight">{selectedHistorialRemito.destino}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden mb-auto">
                            <table className="w-full text-left">
                               <thead>
                                  <tr className="border-b border-slate-200 bg-slate-50">
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100 text-center w-24">C. ENV</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100 text-center w-24">C. REC</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black border-r border-slate-100">ARTÍCULO / DESCRIPCIÓN</th>
                                      <th className="py-2 px-3 text-[9px] uppercase tracking-widest text-slate-500 font-black text-center w-40">VAR / LOTE</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100">
                                  {pageItems.map((c, idx)=>(
                                     <tr key={c.id + '-' + idx} className="bg-white hover:bg-slate-50">
                                        <td className="text-center py-1.5 px-3 border-r border-slate-100 font-black text-[11px] text-slate-700">{c.cantidad_a_extraer || c.cantidad_enviada}</td>
                                        <td className="text-center py-1.5 px-3 border-r border-slate-100 font-black text-[11px] text-emerald-600">-</td>
                                        <td className="py-1.5 px-3 border-r border-slate-100 font-bold tracking-tight text-slate-800 text-[11px]">{c.producto_nombre}</td>
                                        <td className="text-center py-1.5 px-2 font-bold text-[9px] uppercase tracking-widest text-slate-500">{c.nombre_variante}</td>
                                     </tr>
                                  ))}
                               </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-2 gap-16 mt-6 pt-6 px-6">
                            <div className="border-t border-dashed border-slate-300 text-center pt-2">
                                <p className="font-black uppercase tracking-widest text-[10px] text-slate-800">Firma de Entrega (Origen)</p>
                                <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-0.5">ACLARACIÓN Y DNI</p>
                            </div>
                            <div className="border-t border-dashed border-slate-300 text-center pt-2">
                                <p className="font-black uppercase tracking-widest text-[10px] text-slate-800">Firma de Recepción (Destino)</p>
                                <p className="text-[8px] text-slate-400 font-bold tracking-widest mt-0.5">ACLARACIÓN Y FECHA</p>
                            </div>
                        </div>
                        
                        <div className="mt-6 pt-3 flex justify-between items-center opacity-40 px-6">
                             <p className="text-[9px] uppercase font-mono text-slate-900 font-bold tracking-widest flex items-center gap-1.5">
                                <CheckCircle className="w-3 h-3" />
                                WMS · DOC. DIGITAL
                             </p>
                             <p className="text-[9px] uppercase font-mono text-slate-900 font-bold tracking-widest">
                                HOJA {pageIndex + 1} DE {pagesArray.length}
                             </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      )}

    </div>
  );
}