import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PackageOpen, QrCode, FileText, CheckCircle2, Scan, ArrowLeft, Plus, X, Box, HelpCircle, Printer, AlertTriangle } from 'lucide-react';
import { executeAWSQuery } from '../lib/aws-client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { ModalSelector } from './ui/ModalSelector';
import { cn } from '../lib/utils';
import { CategoryDrillDownModal } from './ui/CategoryDrillDownModal';
import { PrintLabelsModal, PrintLabelEntry } from './ui/PrintLabelsModal';

interface RecepcionAuditoriaProps {
  onRecargaRequerida: () => void;
  onCartChange?: (cart: any[]) => void;
}

export function RecepcionAuditoria({ onRecargaRequerida, onCartChange }: RecepcionAuditoriaProps) {
  const { user, isAdminStock, isGerente } = useAuth();
  
  const [contexto, setContexto] = useState<'compra' | 'libre' | null>(null);

  // Datos base
  const [comprasPendientes, setComprasPendientes] = useState<any[]>([]);
  const [compraSeleccionada, setCompraSeleccionada] = useState<any>(null);
  
  // Detalle Esperado (Si es desde Compra) o Construido (Si es Libre)
  const [lineasAuditoria, setLineasAuditoria] = useState<any[]>([]);
  const [etiquetasEscaneadas, setEtiquetasEscaneadas] = useState<string[]>([]);
  const [pendingExternalCode, setPendingExternalCode] = useState<string | null>(null);
  const [externalCodeMap, setExternalCodeMap] = useState<{code: string, variante_id: string}[]>([]);
  
  // Novedades WMS: tracking the pre-minted IDs
  const [etiquetasPreMinted, setEtiquetasPreMinted] = useState<{id: number, codigo_barras?: string, variante_id: string, tipo_gestion?: string, cantidad_inicial?: number}[]>([]);
  const [scannedLoteIds, setScannedLoteIds] = useState<string[]>([]);
  
  // Datos Auxiliares para Selección Libre
  const [categorias, setCategorias] = useState<any[]>([]);
  const [productos, setProductos] = useState<any[]>([]);
  const [depositos, setDepositos] = useState<any[]>([]);
  const [selectedAlmacenId, setSelectedAlmacenId] = useState<number | null>(user?.sucursal_activa_id || null);
  
  const [isCompraModalOpen, setIsCompraModalOpen] = useState(false);
  const [isProdDrillDownOpen, setIsProdDrillDownOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isPrintLabelsOpen, setIsPrintLabelsOpen] = useState(false);
  const [postIngressLabels, setPostIngressLabels] = useState<PrintLabelEntry[]>([]);
  const [qrCodeBuffer, setQrCodeBuffer] = useState('');

  useEffect(() => {
     if (onCartChange) onCartChange(lineasAuditoria);
  }, [lineasAuditoria]);

  useEffect(() => {
     fetchFoundation();
  }, []);

  const fetchFoundation = async () => {
      try {
          const [compras, cats, prods, deps] = await Promise.all([
             executeAWSQuery(`
                SELECT c.*, p.nombre as proveedor_nombre 
                FROM Stock_Compras c 
                LEFT JOIN Stock_Proveedores p ON c.proveedor_id = p.id
                WHERE c.estado = 'pendiente'
                ORDER BY c.fecha_creacion DESC
             `),
             executeAWSQuery("SELECT * FROM Stock_Categorias ORDER BY nombre"),
             executeAWSQuery(`
                SELECT v.id as variante_id, v.nombre_variante, p.nombre as producto_nombre, p.categoria_id, c.nombre as cat_nombre,
                       p.unidad_base, m.gramos_por_metro_lineal, p.tipo_gestion, p.id as producto_maestro_id
                FROM Stock_Variantes v 
                INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id
                LEFT JOIN wms_equivalencias_metricas m ON p.id = m.producto_maestro_id
             `),
             executeAWSQuery("SELECT id, nombre FROM Stock_Depositos ORDER BY id ASC")
          ]);
          setComprasPendientes(compras || []);
          setCategorias(cats || []);
          
          if(prods) {
              setProductos(prods.map((p:any) => ({
                  id: p.variante_id,
                  nombre: `${p.producto_nombre} (${p.nombre_variante})`,
                  producto_maestro_id: p.producto_maestro_id,
                  producto_nombre: p.producto_nombre,
                  nombre_variante: p.nombre_variante,
                  categoria_id: p.categoria_id,
                  cat_nombre: p.cat_nombre,
                  unidad_base: p.unidad_base || 'ud',
                  gramos_por_metro_lineal: p.gramos_por_metro_lineal || null,
                  tipo_gestion: p.tipo_gestion || 'granel'
              })));
          }
          setDepositos(deps || []);
      } catch(e) {
          console.error("Error base", e);
      }
  };

  const seleccionarCompraParaAuditoria = async (compraId: string) => {
      const c = comprasPendientes.find(x => x.id === compraId);
      setCompraSeleccionada(c);
      
      // Get lineas
      try {
          const [rs, preMintedRes] = await Promise.all([
              executeAWSQuery(`
                  SELECT d.variante_id, d.cantidad as esperada, d.precio_unitario, v.nombre_variante, p.nombre as producto_nombre, p.unidad_base, m.gramos_por_metro_lineal, p.tipo_gestion
                  FROM Stock_Compras_Detalle d
                  INNER JOIN Stock_Variantes v ON d.variante_id = v.id
                  INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                  LEFT JOIN wms_equivalencias_metricas m ON p.id = m.producto_maestro_id
                  WHERE d.compra_id = '${compraId}'
              `),
              executeAWSQuery(`
                  SELECT e.id, e.codigo_barras, e.variante_id, e.cantidad_inicial, p.tipo_gestion 
                  FROM Stock_Etiquetas e
                  INNER JOIN Stock_Variantes v ON e.variante_id = v.id
                  INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                  WHERE e.compra_id = '${compraId}' AND e.estado = 'pendiente_recepcion'
              `)
          ]);
          
          if(preMintedRes) {
              setEtiquetasPreMinted(preMintedRes.map((r: any) => ({ 
                  id: r.id, 
                  codigo_barras: r.codigo_barras,
                  variante_id: r.variante_id,
                  tipo_gestion: r.tipo_gestion,
                  cantidad_inicial: r.cantidad_inicial
              })));
          }

          if(rs) {
              setLineasAuditoria(rs.map((r:any) => {
                  const prem = (preMintedRes || []).filter((e:any) => e.variante_id.toString().toLowerCase() === r.variante_id.toString().toLowerCase());
                  
                  let aud = 0;
                  let audSec = 0;
                  
                  if (prem.length > 0) {
                      aud = prem.length;
                      audSec = prem[0].cantidad_inicial || 0;
                  }

                  const l = {
                      variante_id: r.variante_id,
                      descripcion: `${r.producto_nombre} - ${r.nombre_variante}`,
                      esperada: r.esperada,
                      Auditada: aud,
                      cantidadSecundaria: audSec,
                      estado: 'pendiente',
                      unidad_base: r.unidad_base || 'ud',
                      gramos_por_metro_lineal: r.gramos_por_metro_lineal || null,
                      tipo_gestion: r.tipo_gestion || 'granel',
                      precio_unitario: r.precio_unitario || 0
                  };
                  
                  const totalAud = r.tipo_gestion === 'lote_individual' ? l.Auditada : l.Auditada * (l.cantidadSecundaria || 1);
                  if (totalAud === r.esperada && r.esperada > 0) l.estado = 'listo';
                  else if (totalAud > r.esperada) l.estado = 'excedente';
                  
                  return l;
              }));
          }
      } catch(e) { console.error(e); }
  };

  const marcarOrdenCompleta = () => {
      const nw = lineasAuditoria.map(l => {
          let aud = l.Auditada;
          let audSec = l.cantidadSecundaria;
          
          if (l.tipo_gestion === 'lote_individual') {
             aud = l.esperada;
          } else {
             if (aud === 0) aud = l.esperada;
             if (audSec === 0) audSec = 1;
             if (aud * audSec !== l.esperada) {
                 aud = l.esperada;
                 audSec = 1;
             }
          }
          return { ...l, Auditada: aud, cantidadSecundaria: audSec, estado: 'listo' };
      });
      setLineasAuditoria(nw);
      toast.success("Toda la orden de compra fue marcada como completa.");
  };

  const updateAuditoriaManual = (idx: number, cantidad: number) => {
      const nw = [...lineasAuditoria];
      nw[idx].Auditada = cantidad;
      
      const totalAud = nw[idx].tipo_gestion === 'lote_individual' ? nw[idx].Auditada : nw[idx].Auditada * (nw[idx].cantidadSecundaria || 1);
      if (totalAud === nw[idx].esperada && nw[idx].esperada > 0) nw[idx].estado = 'listo';
      else if (totalAud > nw[idx].esperada) nw[idx].estado = 'excedente';
      else nw[idx].estado = 'pendiente';
      
      setLineasAuditoria(nw);
  };

  const updateCantidadSecundaria = (idx: number, cantidad: number) => {
      const nw = [...lineasAuditoria];
      nw[idx].cantidadSecundaria = cantidad;
      
      const totalAud = nw[idx].tipo_gestion === 'lote_individual' ? nw[idx].Auditada : nw[idx].Auditada * (nw[idx].cantidadSecundaria || 1);
      if (totalAud === nw[idx].esperada && nw[idx].esperada > 0) nw[idx].estado = 'listo';
      else if (totalAud > nw[idx].esperada) nw[idx].estado = 'excedente';
      else nw[idx].estado = 'pendiente';
      
      setLineasAuditoria(nw);
  };

  const procesarEscaneoQR = (codigo: string) => {
      if (etiquetasEscaneadas.includes(codigo.toUpperCase())) {
          return toast.error("Este código ya fue escaneado en esta sesión.");
      }

      let foundVarianteId: string | null = null;
      let matchedLoteId: string | null = null;

      // 1. Check if code is an exact ID from our pre-minted tags (Lote Individual tag)
      const preMintedMatch = etiquetasPreMinted.find(e => (e.codigo_barras || e.id.toString()) === codigo.trim());
      if (preMintedMatch) {
          foundVarianteId = preMintedMatch.variante_id.toString();
          matchedLoteId = preMintedMatch.id.toString();
      } else {
          // 2. Check if code maps directly to a variant_id (direct catalogue barcode / granel)
          const isDirect = lineasAuditoria.find(l => l.variante_id.toUpperCase() === codigo.toUpperCase() || codigo.includes(l.variante_id));
          if (isDirect) foundVarianteId = isDirect.variante_id;
      }

      if (!foundVarianteId) {
         // Open mapping modal for external code
         setPendingExternalCode(codigo);
         return;
      }

      if (matchedLoteId) {
          setScannedLoteIds(prev => [...prev, matchedLoteId!]);
      }
      setEtiquetasEscaneadas(prev => [...prev, codigo.toUpperCase()]);
      
      const cantidadASumar = (preMintedMatch && preMintedMatch.tipo_gestion === 'granel') 
            ? preMintedMatch.cantidad_inicial 
            : 1;

      const nw = lineasAuditoria.map(l => {
          if (l.variante_id.toString() === foundVarianteId?.toString()) {
              return { ...l, Auditada: l.Auditada + (cantidadASumar || 1) };
          }
          return l;
      });
      setLineasAuditoria(nw);
  };
  
  const mapExternalCode = (varianteId: string) => {
      if(!pendingExternalCode) return;
      setExternalCodeMap(prev => [...prev, { code: pendingExternalCode.toUpperCase(), variante_id: varianteId }]);
      setEtiquetasEscaneadas(prev => [...prev, pendingExternalCode.toUpperCase()]);
      
      const nw = lineasAuditoria.map(l => {
          if (l.variante_id === varianteId) {
              return { ...l, Auditada: l.Auditada + 1 };
          }
          return l;
      });
      setLineasAuditoria(nw);
      setPendingExternalCode(null);
      toast.success("Código externo enlazado y sumado");
  };

  const agregarLineaLibre = (varianteId: string) => {
      const p = productos.find(x => x.id.toString() === varianteId.toString());
      if(!p) {
          toast.error("Error técnico: Variante no encontrada en memoria.");
          return;
      }
      
      const existe = lineasAuditoria.findIndex(x => x.variante_id.toString() === varianteId.toString());
      if(existe >= 0) {
          const nw = [...lineasAuditoria];
          nw[existe].Auditada += 1;
          setLineasAuditoria(nw);
      } else {
          setLineasAuditoria([
              { 
                  variante_id: varianteId, descripcion: p.nombre, esperada: 0, Auditada: 1, estado: 'listo',
                  unidad_base: p.unidad_base, gramos_por_metro_lineal: p.gramos_por_metro_lineal, cantidadSecundaria: 0,
                  tipo_gestion: p.tipo_gestion
              },
              ...lineasAuditoria
          ]);
      }
  };

  const eliminarLineaAuditoria = (idx: number) => {
      setLineasAuditoria(lineasAuditoria.filter((_, i) => i !== idx));
  };

  const asentarIngreso = async () => {
      if(lineasAuditoria.length === 0) return toast.error("No hay líneas auditadas");
      const incompletas = lineasAuditoria.filter(l => {
         const totalAud = l.tipo_gestion === 'lote_individual' ? l.Auditada : l.Auditada * (l.cantidadSecundaria || 1);
         return totalAud < l.esperada;
      });
      
      if (incompletas.length > 0 && contexto === 'compra') {
          toast.custom(
            (t) => (
              <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} flex flex-col gap-4 bg-slate-900 border-2 border-amber-500 p-6 rounded-3xl shadow-2xl max-w-md w-full pointer-events-auto mt-[40vh]`}>
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-amber-500/20 text-amber-400 rounded-full flex-shrink-0 mt-1">
                     <AlertTriangle className="w-8 h-8"/>
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-white mb-2">Líneas Incompletas</h1>
                    <p className="text-slate-300 font-medium text-sm leading-relaxed">
                       Hay <b className="text-amber-400 text-base">{incompletas.length} artículos</b> reportando faltantes en tu físico vs lo esperado en la factura original.<br/><br/>
                       ¿Estás seguro que querés asentar al sistema SÓLO las cantidades que contaste y cerrar la compra igual?
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 justify-end mt-4">
                  <button onClick={() => toast.dismiss(t.id)} className="px-5 py-3 rounded-xl font-bold bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors w-full text-center">
                      Esperar, voy a revisar
                  </button>
                  <button onClick={() => { toast.dismiss(t.id); procederAsentarIngreso(); }} className="px-5 py-3 w-full text-center rounded-xl font-black bg-amber-500 text-amber-950 hover:bg-amber-400 transition-colors shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                      Sí, Cerrar Ingreso
                  </button>
                </div>
              </div>
            ),
            { duration: Infinity, id: 'incomplete-warning' }
          );
          return;
      }
      
      procederAsentarIngreso();
  };

  const procederAsentarIngreso = async () => {

      if(!selectedAlmacenId) return toast.error("Por favor, seleccione el almacén o sector de destino.");
      const almacenId = selectedAlmacenId;

      // Separar líneas por tipo de gestión
      const lineasGranel = lineasAuditoria.filter(l => l.Auditada > 0 && l.tipo_gestion !== 'lote_individual');
      const lineasLoteInd = lineasAuditoria.filter(l => l.Auditada > 0 && l.tipo_gestion === 'lote_individual');

      let q = '';

      if (contexto === 'compra' && compraSeleccionada) {
          q += `UPDATE Stock_Compras SET estado = 'completada' WHERE id = '${compraSeleccionada.id}';\n`;
      }

      // GRANEL: procesar cada bulto escaneado y las mermas manuales
      for(const item of lineasGranel) {
         if (contexto === 'compra') {
             const pendingForThis = etiquetasPreMinted.filter(e => e.variante_id.toString() === item.variante_id.toString());
             let idsToActivate = scannedLoteIds.filter(id => pendingForThis.some(p => p.id.toString() === id.toString()));
             
             // Si hay sumas manuales no basadas en código QR, intentamos tomarlas al azar
             // Ojo: Para granel, Auditada es SUMA de unidades, pero pendingForThis.length son N Bultos!
             // Así que tomaremos las etiquetas que sumen para completar, u optamos por todas las necesarias
             
             const sumEscaneados = pendingForThis
                .filter(p => idsToActivate.includes(p.id.toString()))
                .reduce((acc, curr) => acc + (curr.cantidad_inicial || 0), 0);

             if (item.Auditada > sumEscaneados) {
                // Faltan unidades por asignar a etiquetas físicas.
                const untouched = pendingForThis.filter(p => !idsToActivate.includes(p.id.toString()));
                let currentMissing = item.Auditada - sumEscaneados;
                
                for (const u of untouched) {
                    if (currentMissing <= 0) break;
                    idsToActivate.push(u.id.toString());
                    currentMissing -= (u.cantidad_inicial || 0);
                }
             }

             if (idsToActivate.length > 0) {
                 q += `
                   UPDATE Stock_Etiquetas SET deposito_id = ${almacenId}, estado = 'activo', cantidad_actual = cantidad_inicial WHERE id IN (${idsToActivate.join(',')});
                   INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id, referencia_compra_id, usuario_id)
                   SELECT id, 'ingreso_auditoria_compra', cantidad_inicial, ${almacenId}, '${compraSeleccionada.id}', '${user?.id}' FROM Stock_Etiquetas WHERE id IN (${idsToActivate.join(',')});
                 `;
             }
         } else {
             // Libre ingress fallback
             const randomVar = Math.random().toString(36).substring(2, 9);
             q += `
               DECLARE @Fisico_${randomVar} INT;
               INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, costo_unitario_real, estado) 
               VALUES (CONVERT(varchar(255), NEWID()), '${item.variante_id}', ${almacenId}, ${item.Auditada}, ${item.Auditada}, ${item.precio_unitario || 0}, 'activo');
               SET @Fisico_${randomVar} = SCOPE_IDENTITY();
               INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id, usuario_id)
               VALUES (@Fisico_${randomVar}, 'ingreso_auditoria_libre', ${item.Auditada}, ${almacenId}, '${user?.id}');
             `;
         }
      }

      // LOTE INDIVIDUAL: actualizar específicamente las etiquetas físicas pre-creadas asignándoles cantidad 0 (peso diferido) y activándolas
      for(const item of lineasLoteInd) {
         if (contexto === 'compra') {
             // Obtenemos los IDs pre-minted para esto y activamos n de ellos
             const pendingForThis = etiquetasPreMinted.filter(e => e.variante_id.toString() === item.variante_id.toString());
             
             // Priorizamos los IDs que SÍ fueron escaneados usando la pistolita
             let idsToActivate = scannedLoteIds.filter(id => pendingForThis.some(p => p.id.toString() === id.toString()));
             
             // Si el usuario simplemente apretó el botón "+" manualmente sin escanear, tomamos IDs aleatorios
             let remainingNeeded = item.Auditada - idsToActivate.length;
             if (remainingNeeded > 0) {
                 const untouched = pendingForThis.filter(p => !idsToActivate.includes(p.id.toString()));
                 idsToActivate = [...idsToActivate, ...untouched.slice(0, remainingNeeded).map(x => x.id.toString())];
             }

             if (idsToActivate.length > 0) {
                 q += `
                    UPDATE Stock_Etiquetas SET deposito_id = ${almacenId}, estado = 'activo', cantidad_actual = cantidad_inicial WHERE id IN (${idsToActivate.join(',')});
                    INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id, referencia_compra_id, usuario_id)
                    SELECT id, 'ingreso_auditoria_compra', cantidad_inicial, ${almacenId}, '${compraSeleccionada.id}', '${user?.id}' FROM Stock_Etiquetas WHERE id IN (${idsToActivate.join(',')});
                 `;
             }
         } else {
             // Libre ingress fallback
             const randomVar = Math.random().toString(36).substring(2, 9);
             q += `
               DECLARE @Iter_${randomVar} INT = 0;
               WHILE @Iter_${randomVar} < ${item.Auditada}
               BEGIN
                 INSERT INTO Stock_Etiquetas (codigo_barras, variante_id, deposito_id, cantidad_inicial, cantidad_actual, costo_unitario_real, estado)
                 VALUES (CONVERT(varchar(255), NEWID()), '${item.variante_id}', ${almacenId}, 1, 1, ${item.precio_unitario || 0}, 'activo');
                 DECLARE @FisicoId_${randomVar} INT = SCOPE_IDENTITY();
                 INSERT INTO Stock_Movimientos (etiqueta_id, tipo_movimiento, cantidad_afectada, deposito_destino_id, usuario_id)
                 VALUES (@FisicoId_${randomVar}, 'ingreso_auditoria_libre', 1, ${almacenId}, '${user?.id}');
                 SET @Iter_${randomVar} = @Iter_${randomVar} + 1;
               END
             `;
         }
      }

      try {
          const result = await executeAWSQuery(q);
          toast.success("¡Stock ingresado exitosamente al inventario!");

          setCompraSeleccionada(null);
          setLineasAuditoria([]);
          setEtiquetasEscaneadas([]);
          setEtiquetasPreMinted([]);
          setScannedLoteIds([]);
          onRecargaRequerida();
          fetchFoundation();
      } catch(e:any) {
          toast.error("Error aplicando ingreso físico: " + e.message);
      }
  };



  if (contexto === null) {
      return (
          <div className="space-y-6 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl text-slate-900 dark:text-white mb-6 shadow-sm border border-slate-200 dark:border-slate-800">
                  <div>
                     <h2 className="text-xl font-black uppercase flex items-center gap-2"><PackageOpen className="w-5 h-5 text-emerald-500 dark:text-emerald-400"/> Auditoría de Ingreso WMS</h2>
                     <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">Seleccione un flujo logístico para comenzar la descarga.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button onClick={() => setContexto('compra')} className="card-nexus p-8 border-indigo-100 bg-indigo-50/20 hover:border-indigo-500 transition-all text-left group">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <FileText className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400 uppercase">Orden de Compra Pendiente</h3>
                      <p className="text-xs text-slate-500 font-medium mt-2">Cruzar contra un documento de compra previamente ingresado en administración. {comprasPendientes.length} órdenes en espera.</p>
                  </button>
                  <button onClick={() => { setContexto('libre'); setLineasAuditoria([]); }} className="card-nexus p-8 border-emerald-100 bg-emerald-50/20 hover:border-emerald-500 transition-all text-left group">
                      <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <Plus className="w-8 h-8" />
                      </div>
                      <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-400 uppercase">Ingresar a mano</h3>
                      <p className="text-xs text-slate-500 font-medium mt-2">Armar la lista de ingreso de stock desde cero inyectando artículos sueltos al almacén.</p>
                  </button>
              </div>
          </div>
      );
  }

  // === VISTAS SECUNDARIAS ===
  return (
      <div className="space-y-6">
          {/* Header secundario global */}
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-6 rounded-2xl text-slate-900 dark:text-white mb-6 shadow-sm border border-slate-200 dark:border-slate-800">
             <div>
                <button onClick={() => { setContexto(null); setCompraSeleccionada(null); }} className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-2 font-bold text-xs transition-colors"><ArrowLeft className="w-3 h-3 inline mr-1"/> Volver al inicio</button>
                <h2 className="text-xl font-black uppercase flex items-center gap-2">
                    {contexto === 'compra' ? <FileText className="w-5 h-5 text-indigo-500 dark:text-indigo-400"/> : <Plus className="w-5 h-5 text-emerald-500 dark:text-emerald-400"/>} 
                    {contexto === 'compra' ? 'Órdenes de Compra Pendientes' : 'Ingreso a Mano'}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                    {contexto === 'compra' ? 'Seleccione la orden que desea procesar y descargar al almacén central.' : 'Construyendo un lote de ingreso de forma libre.'}
                </p>
             </div>
             {contexto === 'libre' && lineasAuditoria.length > 0 && (
                 <div className="flex items-center gap-4">
                    <select 
                        disabled={!(isAdminStock || isGerente)}
                        value={selectedAlmacenId || ''} 
                        onChange={(e) => setSelectedAlmacenId(Number(e.target.value))}
                        className={`border border-slate-200 dark:border-slate-700 text-sm font-bold px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none ${!(isAdminStock || isGerente) ? 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 cursor-not-allowed' : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-white'}`}
                    >
                        <option value="" disabled>Seleccionar Destino...</option>
                        {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                    </select>
                    <button 
                        onClick={asentarIngreso} 
                        className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-emerald-500/30 shadow-lg transition-transform hover:scale-[1.02] flex items-center gap-2 border border-emerald-400"
                    >
                        <CheckCircle2 className="w-4 h-4"/> INGRESAR STOCK
                    </button>
                 </div>
             )}
          </div>

          {/* LISTA NATIVA DE ORDENES DE COMPRA PENDIENTES */}
          {contexto === 'compra' && !compraSeleccionada && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
                  {comprasPendientes.length === 0 ? (
                      <div className="col-span-full text-center py-10 font-black tracking-widest text-slate-400 uppercase">No hay órdenes pendientes en el sistema.</div>
                  ) : comprasPendientes.map(c => (
                      <button key={c.id} onClick={() => seleccionarCompraParaAuditoria(c.id)} className="card-nexus p-6 border-indigo-100 hover:border-indigo-500 text-left transition-all group">
                         <div className="flex justify-between items-start mb-4">
                             <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform"><FileText className="w-6 h-6"/></div>
                             <span className="text-xs font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-3 py-1 rounded-full uppercase tracking-widest">En Espera</span>
                         </div>
                         <h4 className="font-black text-lg text-slate-800 dark:text-white uppercase mb-1">{c.proveedor_nombre}</h4>
                         <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-4">Ref: {c.referencia_factura}</p>
                         <div className="flex justify-between items-center text-xs font-bold text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4 mt-2">
                            <span>{new Date(c.fecha_creacion).toLocaleDateString()}</span>
                            <span>Total: ${Number(c.total_compra).toFixed(2)}</span>
                         </div>
                      </button>
                  ))}
              </div>
          )}

            {/* MODAL DE ORDEN DE COMPRA (INCLUYE ESCANER Y TABLA) */}
            <AnimatePresence>
                {contexto === 'compra' && compraSeleccionada && (
                    <div className="fixed inset-0 z-[50] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setCompraSeleccionada(null)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-slate-50 dark:bg-slate-950 w-full max-w-6xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                            
                            {/* Cabecera del Modal de Compra */}
                            <div className="p-6 bg-indigo-900 text-white flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-xl font-black uppercase flex items-center gap-2"><FileText className="w-6 h-6 text-indigo-400"/> Revisión de Compra</h2>
                                    <p className="text-xs text-indigo-300 font-medium tracking-widest mt-1">Ref: {compraSeleccionada.referencia_factura} • Proveedor: {compraSeleccionada.proveedor_nombre}</p>
                                </div>
                                <div className="flex gap-3 items-center flex-wrap">
                                    <select 
                                        disabled={!(isAdminStock || isGerente)}
                                        value={selectedAlmacenId || ''} 
                                        onChange={(e) => setSelectedAlmacenId(Number(e.target.value))}
                                        className={`border border-indigo-700 text-sm font-bold px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none ${!(isAdminStock || isGerente) ? 'bg-indigo-900/50 text-indigo-400 cursor-not-allowed' : 'bg-indigo-950 text-white'}`}
                                    >
                                        <option value="" disabled>Destino Logístico...</option>
                                        {depositos.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
                                    </select>
                                    <button
                                        onClick={() => setIsPrintLabelsOpen(true)}
                                        className="flex items-center gap-2 px-4 py-3 bg-indigo-700 hover:bg-indigo-600 text-white text-sm font-bold rounded-xl transition-colors border border-indigo-500"
                                        title="Imprimir etiquetas QR de esta orden"
                                    >
                                        <Printer className="w-4 h-4" />
                                        Imprimir Etiquetas
                                    </button>
                                    <button onClick={asentarIngreso} className="bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-sm shadow-emerald-500/20 shadow-lg border border-emerald-400">
                                        Cerrar Ingreso Completo
                                    </button>
                                    <button onClick={() => setCompraSeleccionada(null)} className="bg-white/10 hover:bg-white/20 p-3 rounded-xl transition-colors"><X className="w-5 h-5"/></button>
                                </div>
                            </div>

                            {/* Campo de Escaneo del Modal de Compra */}
                            <div className="p-6 shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                <div className="relative">
                                    <Scan className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-indigo-500" />
                                    <input 
                                        autoFocus
                                        type="text"
                                        placeholder="Escanee código de un artículo que vino en la caja para tacharlo..."
                                        value={qrCodeBuffer}
                                        onChange={e => setQrCodeBuffer(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                procesarEscaneoQR(qrCodeBuffer);
                                                setQrCodeBuffer('');
                                            }
                                        }}
                                        className="w-full text-lg font-black tracking-widest bg-slate-50 dark:bg-slate-950 border-2 border-indigo-500/30 focus:border-indigo-500 rounded-2xl p-4 pl-16 outline-none text-slate-800 dark:text-white transition-colors"
                                    />
                                </div>
                            </div>

                            {/* Tabla de Detalle dentro del Modal */}
                            <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 p-6 custom-scrollbar">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-900/50">
                                            <th className="px-6 py-4">Artículo</th>
                                            <th className="px-6 py-4 text-center">Esperado</th>
                                            <th className="px-6 py-4 text-center cursor-help" title="Cantidad de contenedores físicos a ingresar (Cajas, Pallets, Rollos)">
                                                <div className="flex items-center justify-center gap-1">Cant. de Bultos <HelpCircle className="w-3 h-3 text-slate-300"/></div>
                                            </th>
                                            <th className="px-6 py-4 text-center cursor-help" title="Lo que trae CADA bulto por dentro (Unidades, Litros, Kilos)">
                                                <div className="flex items-center justify-center gap-1">Contenido del Bulto <HelpCircle className="w-3 h-3 text-slate-300"/></div>
                                            </th>
                                            <th className="px-6 py-4 text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-900/50">
                                        {lineasAuditoria.map((l, index) => (
                                            <tr key={index} className={cn("transition-colors", l.estado === 'listo' ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "")}>
                                                <td className="px-6 py-4 font-black text-sm text-slate-700 dark:text-slate-300">
                                                    {l.descripcion}
                                                </td>
                                                <td className="px-6 py-4 text-center font-bold text-slate-400">
                                                    {l.esperada}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="number" 
                                                                min="0"
                                                                className="input-nexus w-20 text-center font-black text-lg bg-white dark:bg-slate-900"
                                                                value={l.Auditada}
                                                                onChange={e => updateAuditoriaManual(index, Number(e.target.value))}
                                                            />
                                                            <span className="text-xs font-bold text-slate-400 uppercase">ud</span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 font-medium leading-tight max-w-[120px]">
                                                            {(() => {
                                                                if (l.tipo_gestion === 'lote_individual') return 'Físico: ¿Cuántos rollos entraron?';
                                                                const epms = etiquetasPreMinted.filter(e => e.variante_id.toString().toLowerCase() === l.variante_id.toString().toLowerCase());
                                                                return `¿Cuántos paquetes/bultos entraron? (Esperados: ${epms.length || '?'})`;
                                                            })()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex flex-col items-center justify-center gap-1">
                                                        <div className="flex items-center gap-2">
                                                            {l.tipo_gestion === 'lote_individual' ? (
                                                                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold text-xs text-slate-500 uppercase tracking-wider">
                                                                    Pesaje Diferido
                                                                </div>
                                                            ) : (
                                                                <input 
                                                                    type="number" 
                                                                    min="0"
                                                                    className="input-nexus w-24 text-center font-bold text-base bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400"
                                                                    value={l.cantidadSecundaria || ''}
                                                                    placeholder={(l.Auditada * (l.gramos_por_metro_lineal ? (1000/l.gramos_por_metro_lineal) : 0)).toFixed(2)}
                                                                    onChange={e => updateCantidadSecundaria(index, Number(e.target.value))}
                                                                />
                                                            )}
                                                            <span className="text-xs font-bold text-slate-400 uppercase">{l.unidad_base !== 'ud' ? l.unidad_base : '-'}</span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-400 font-medium leading-tight max-w-[140px] mt-1 text-center">
                                                            {l.tipo_gestion === 'lote_individual' ? 'El peso de cada rollo se asignará luego en la balanza.' : '¿Qué cantidad trae CADA paquete por dentro?'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center flex flex-col items-center gap-2">
                                                   {l.estado === 'listo' && <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center justify-center gap-1 mx-auto w-fit"><CheckCircle2 className="w-3 h-3"/> Listo</span>}
                                                   {l.estado === 'excedente' && <span className="bg-amber-100 text-amber-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mx-auto w-fit">Excedente Físico</span>}
                                                   {l.estado === 'pendiente' && <span className="bg-slate-100 text-slate-500 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full mx-auto w-fit">Incompleto</span>}
                                                   
                                                   {l.estado === 'pendiente' && (
                                                       <button onClick={() => updateAuditoriaManual(index, l.esperada)} className="mt-1 text-[9px] uppercase tracking-widest font-bold text-blue-500 hover:text-blue-600 border border-blue-200 bg-blue-50 px-2 py-1 rounded">
                                                           Completar Fila
                                                       </button>
                                                   )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal de selección de etiquetas a imprimir */}

            <PrintLabelsModal
                isOpen={isPrintLabelsOpen}
                onClose={() => setIsPrintLabelsOpen(false)}
                detalles={lineasAuditoria.map(l => {
                    const epms = etiquetasPreMinted.filter(e => e.variante_id.toString().toLowerCase() === l.variante_id.toString().toLowerCase());
                    return {
                        variante_id: l.variante_id,
                        producto_nombre: l.descripcion.split(' - ')[0] || l.descripcion,
                        nombre_variante: l.descripcion.split(' - ')[1] || '',
                        cantidad: l.esperada || l.Auditada,
                        sku: null,
                        tipo_gestion: l.tipo_gestion,
                        etiqueta_id: epms[0]?.codigo_barras || epms[0]?.id,
                        etiqueta_ids: epms.map(e => e.codigo_barras || e.id),
                        compra_id: compraSeleccionada?.id,
                        // Siempre desde el conteo real de etiquetas en DB
                        bultos_predefinidos: epms.length > 0 ? epms.length : (l.esperada || 1)
                    };
                })}
            />

            {/* TABLA BASE DE INGRESO A MANO */}
            {contexto === 'libre' && (
                <div className="space-y-4 animate-in fade-in zoom-in-95">
                    <div className="flex flex-col md:flex-row gap-4 mb-4">
                        <button onClick={() => setIsScannerModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-xl flex-[2] font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30 uppercase tracking-widest text-xs transition-transform hover:scale-[1.02]">
                            <Scan className="w-5 h-5"/> Abrir Escáner Continuo
                        </button>
                        <button onClick={() => setIsProdDrillDownOpen(true)} className="bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 p-4 rounded-xl flex-1 font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-colors uppercase tracking-widest text-xs">
                            <Plus className="w-5 h-5"/> Cargar artículo manual
                        </button>
                    </div>

                    <div className="card-nexus overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-50 dark:border-slate-900">
                                    <th className="px-6 py-4">Artículo</th>
                                    <th className="px-6 py-4 text-center cursor-help" title="Cantidad de contenedores físicos a ingresar (Cajas, Pallets, Rollos)">
                                        <div className="flex items-center justify-center gap-1">Cant. de Bultos <HelpCircle className="w-3 h-3 text-slate-300"/></div>
                                    </th>
                                    <th className="px-6 py-4 text-center cursor-help" title="Lo que trae CADA bulto por dentro (Unidades, Litros, Kilos)">
                                        <div className="flex items-center justify-center gap-1">Contenido del Bulto <HelpCircle className="w-3 h-3 text-slate-300"/></div>
                                    </th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-4 py-4 text-center w-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-900/50">
                                {lineasAuditoria.length === 0 && (
                                    <tr><td colSpan={5} className="text-center py-10 font-bold text-slate-400 uppercase tracking-widest">No hay artículos cargados a mano aún.</td></tr>
                                )}
                                {lineasAuditoria.map((l, index) => (
                                    <tr key={index} className={cn("transition-colors", l.estado === 'listo' ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "")}>
                                        <td className="px-6 py-4 font-black text-sm text-slate-700 dark:text-slate-300">
                                            {l.descripcion}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        className="input-nexus w-20 text-center font-black text-lg bg-white dark:bg-slate-900"
                                                        value={l.Auditada}
                                                        onChange={e => updateAuditoriaManual(index, Number(e.target.value))}
                                                    />
                                                    <span className="text-xs font-bold text-slate-400 uppercase">ud</span>
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-medium leading-tight max-w-[120px]">
                                                    {l.tipo_gestion === 'lote_individual' ? 'Físico: ¿Cuántos rollos entraron?' : '¿Cuántos paquetes/bultos idénticos entraron?'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <div className="flex items-center gap-2">
                                                    {l.tipo_gestion === 'lote_individual' ? (
                                                        <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded font-bold text-xs text-slate-500 uppercase tracking-wider">
                                                            Pesaje Diferido
                                                        </div>
                                                    ) : (
                                                        <input 
                                                            type="number" 
                                                            min="0"
                                                            className="input-nexus w-24 text-center font-bold text-base bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400"
                                                            value={l.cantidadSecundaria || ''}
                                                            placeholder={(l.Auditada * (l.gramos_por_metro_lineal ? (1000/l.gramos_por_metro_lineal) : 0)).toFixed(2)}
                                                            onChange={e => updateCantidadSecundaria(index, Number(e.target.value))}
                                                        />
                                                    )}
                                                    <span className="text-xs font-bold text-slate-400 uppercase">{l.unidad_base !== 'ud' ? l.unidad_base : '-'}</span>
                                                </div>
                                                <span className="text-[9px] text-slate-400 font-medium leading-tight max-w-[140px] mt-1 text-center">
                                                    {l.tipo_gestion === 'lote_individual' ? 'El peso de cada rollo se asignará luego en la balanza.' : '¿Qué cantidad trae CADA paquete por dentro?'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center flex flex-col items-center gap-2">
                                           {l.estado === 'listo' && <span className="bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center justify-center gap-1 mx-auto w-fit"><CheckCircle2 className="w-3 h-3"/> Listo</span>}
                                        </td>
                                        <td className="px-4 py-4 text-center">
                                            <div className="flex flex-col gap-1 items-center justify-center">
                                                <button onClick={() => eliminarLineaAuditoria(index)} className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-900/30 text-rose-500 flex items-center justify-center mx-auto hover:bg-rose-500 hover:text-white transition-colors" title="Eliminar Artículo">
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>


                </div>
            )}

            <CategoryDrillDownModal 
               isOpen={isProdDrillDownOpen}
               onClose={() => setIsProdDrillDownOpen(false)}
               title="Buscar Artículo a Ingresar Manual"
               categorias={categorias}
               productos={productos}
               onSelect={(id) => {
                   agregarLineaLibre(id);
               }}
               multiSelect={true}
               onSelectMultiple={(ids) => {
                   const previousIds = lineasAuditoria.map(l => l.variante_id.toString());
                   const filtrados = ids.filter(id => !previousIds.includes(id.toString()));
                   
                   if (filtrados.length > 0) {
                       filtrados.forEach(id => agregarLineaLibre(id));
                       toast.success(`${filtrados.length} artículos añadidos a la lista.`);
                   } else if (ids.length > 0) {
                       toast.error('Estos artículos ya están en la lista.');
                   }
               }}
               activeItemIds={lineasAuditoria.map(l => l.variante_id.toString())}
            />

            <AnimatePresence>
                {isScannerModalOpen && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsScannerModalOpen(false)} />
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative bg-white dark:bg-slate-950 w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
                            <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0">
                                <div>
                                    <h2 className="text-xl font-black uppercase flex items-center gap-2"><Scan className="w-6 h-6 text-blue-400"/> Escáner en Vivo</h2>
                                    <p className="text-xs text-slate-400 font-medium">Capture códigos con la pistola. Se agruparán automáticamente.</p>
                                </div>
                                <button onClick={() => setIsScannerModalOpen(false)} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"><X className="w-5 h-5"/></button>
                            </div>
                            <div className="p-6 shrink-0 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                <div className="relative">
                                    <input 
                                        autoFocus
                                        type="text"
                                        placeholder="Apunte al código de barras o QR..."
                                        value={qrCodeBuffer}
                                        onChange={e => setQrCodeBuffer(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') {
                                                procesarEscaneoQR(qrCodeBuffer);
                                                setQrCodeBuffer('');
                                            }
                                        }}
                                        className="w-full text-center text-2xl font-black tracking-[0.2em] uppercase bg-white dark:bg-slate-900 border-4 border-blue-500 rounded-2xl p-6 outline-none shadow-blue-500/20 shadow-xl focus:scale-[1.01] transition-transform text-slate-800 dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-100 dark:bg-black">
                                {lineasAuditoria.length === 0 ? (
                                    <div className="text-center py-10 opacity-50">Esperando primera lectura...</div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {[...lineasAuditoria].reverse().map((l, i) => (
                                            <div key={i} className="bg-white dark:bg-slate-900 p-4 rounded-2xl flex justify-between items-center shadow-sm border border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 fade-in">
                                                <div>
                                                    <p className="font-black text-slate-800 dark:text-white text-lg">{l.descripcion}</p>
                                                    <p className="text-xs text-slate-500 font-bold">Código Interno: {l.variante_id}</p>
                                                </div>
                                                <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl text-xl font-black">
                                                    +{l.Auditada}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            {/* Modal post-ingreso — etiquetas lote_individual con IDs reales */}
            <PrintLabelsModal
                isOpen={isPrintLabelsOpen && postIngressLabels.length > 0}
                onClose={() => { setIsPrintLabelsOpen(false); setPostIngressLabels([]); }}
                detalles={postIngressLabels}
            />
      </div>
  );
}
