import React, { useEffect, useState } from 'react';
import { Settings, Box, Network, Truck, Search, Folder, ArrowLeft, Palette, LayoutDashboard, Tag, Layers, ArchiveRestore, History, Edit3, Trash2, Banknote, FileText, ChevronRight , AlertOctagon, DollarSign, AlertCircle, Workflow, Anchor, Ship, MapPin, CheckCircle2, Plus} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { IconManager } from '../components/IconManager';

const ALL_LUCIDE_ICONS = Object.keys(LucideIcons).filter(name => 
    /^[A-Z][a-zA-Z0-9]*$/.test(name) && 
    typeof (LucideIcons as any)[name] !== 'undefined' &&
    name !== 'default'
);

const COMMON_ICONS = [
    'Package', 'Factory', 'Truck', 'Anchor', 'Ship', 'MapPin', 'CheckCircle2', 'FileText', 
    'AlertTriangle', 'Calendar', 'Globe', 'Activity', 'Clock', 'Settings', 'DollarSign', 
    'Database', 'User', 'Users', 'Shield', 'Lock', 'Key', 'Search', 'Home', 'Info', 
    'File', 'Folder', 'Inbox', 'Mail', 'Phone', 'Bell', 'ShoppingCart', 'CreditCard'
];

const PREDEFINED_STEPS = [
    { label: 'Realizada', key: 'realizada', icon: 'Package', desc: 'Compra u orden inicializada' },
    { label: 'En Fabricación', key: 'en_fabricacion', icon: 'Factory', desc: 'Los productos se están manufacturando' },
    { label: 'En Depósito Traslado', key: 'en_deposito_traslado', icon: 'Truck', desc: 'Mercancía en bodega intermedia o terrestre' },
    { label: 'Esperando Embarque', key: 'esperando_embarque', icon: 'Anchor', desc: 'Listo en puerto/aeropuerto de origen' },
    { label: 'Embarcado', key: 'embarcado', icon: 'Ship', desc: 'En tránsito marítimo o aéreo' },
    { label: 'Puerto de Origen', key: 'puerto_origen', icon: 'Anchor', desc: 'Salida de aduana origen' },
    { label: 'Puerto Intermedio', key: 'puerto_intermedio', icon: 'MapPin', desc: 'Tránsito internacional' },
    { label: 'Puerto de Destino', key: 'puerto_destino', icon: 'Anchor', desc: 'Llegada local' },
    { label: 'En Aduana', key: 'en_aduana', icon: 'FileText', desc: 'Procesamiento de importación' },
    { label: 'Esperando Envío', key: 'esperando_envio', icon: 'Truck', desc: 'Listo para transporte local' },
    { label: 'Recibido', key: 'recibido', icon: 'CheckCircle2', desc: 'Mercadería ingresada en depósito central' },
    { label: 'En Tránsito', key: 'en_transito', icon: 'Truck', desc: 'Flete en ruta terrestre' }
];
import { useUIConfig, DynamicUIIcon } from '../context/UIContext';
import { useAuth } from '../context/AuthContext';

import { executeAWSQuery } from '../lib/aws-client';
import { cn, getVisualName } from '../lib/utils';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { ModalSelector } from '../components/ui/ModalSelector';
import { CategoryDrillDownModal } from '../components/ui/CategoryDrillDownModal';

import { GestionUsuarios } from '../components/gestion/GestionUsuarios';
import { GestionHistoricos } from '../components/gestion/GestionHistoricos';
import { GestionAlertasStock } from '../components/gestion/GestionAlertasStock';
import { GestionCostosCero } from '../components/gestion/GestionCostosCero';

export function ConfiguracionMaestros() {
  const [activeTab, setActiveTab] = useState<'hub'|'categorias'|'titulos_base'|'diccionario'|'modelos'|'proveedores'|'rendimientos'|'iconos'|'almacenes'|'monedas'|'usuarios'|'historicos'|'tipos_facturas'|'alertas_stock'|'costos_cero'|'plantillas_progreso'>('hub');
  const { isEditMode, setEditingComponentId, uiConfigs, updateConfigLocal } = useUIConfig();
  const { hasSubAccess } = useAuth();
  
  // Categorias
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [categorias, setCategorias] = useState<any[]>([]);
  const [editCatId, setEditCatId] = useState<number|null>(null);
  const [deleteCatToMove, setDeleteCatToMove] = useState<number|null>(null);
  const [transferTargetId, setTransferTargetId] = useState('');
  
  const [deleteVarToMove, setDeleteVarToMove] = useState<any>(null);
  const [transferVarTargetId, setTransferVarTargetId] = useState<string>('');
  const [varDependencies, setVarDependencies] = useState<any>(null);

  // Monedas
  const [monedas, setMonedas] = useState<any[]>([]);
  const [monNombre, setMonNombre] = useState('');
  const [monCodigo, setMonCodigo] = useState('');
  const [monSimbolo, setMonSimbolo] = useState('');
  const [editMonId, setEditMonId] = useState<number|null>(null);
  
  // Proveedores
  const [provName, setProvName] = useState('');
  const [provDoc, setProvDoc] = useState('');
  const [provContacto, setProvContacto] = useState('');
  const [provCiudad, setProvCiudad] = useState('');
  const [provRazon, setProvRazon] = useState('');
  const [proveedores, setProveedores] = useState<any[]>([]);
  const [editProvId, setEditProvId] = useState<string|null>(null);

  // Almacenes
  const [almacenes, setAlmacenes] = useState<any[]>([]);
  const [almName, setAlmName] = useState('');
  const [almUbicacion, setAlmUbicacion] = useState('');
  const [editAlmId, setEditAlmId] = useState<number | null>(null);

  // Productos Maestros (Padres)
  const [editProdId, setEditProdId] = useState<string|null>(null);
  const [pmSKU, setPmSKU] = useState('');
  const [pmNombre, setPmNombre] = useState('');
  const [pmUnidad, setPmUnidad] = useState('ud');
  const [pmCatId, setPmCatId] = useState('');
  const [pmTipoGestion, setPmTipoGestion] = useState('granel');
  const [pmSearchQuery, setPmSearchQuery] = useState('');
  const [pmSelectedCategory, setPmSelectedCategory] = useState<string | null>(null);
  const [productos, setProductos] = useState<any[]>([]);

  // Variantes (Hijos)
  const [varProdIds, setVarProdIds] = useState<string[]>([]);
  const [varNombre, setVarNombre] = useState('');
  const [varSku, setVarSku] = useState('');
  const [variantes, setVariantes] = useState<any[]>([]);

  // Odoo-style Matrix Generator
  const [atributos, setAtributos] = useState<{nombre: string, valores: string[]}[]>([]);
  const [nuevoAtributo, setNuevoAtributo] = useState('');
  const [variantesGeneradas, setVariantesGeneradas] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Memorización de Etiquetas
  const [atributosBase, setAtributosBase] = useState<{id: number, nombre: string}[]>([]);
  const [valoresBase, setValoresBase] = useState<{id: number, atributo_id: number, valor: string}[]>([]);
  const [unidadesMedida, setUnidadesMedida] = useState<{id: number, nombre: string}[]>([]);

  // Plantillas de Progreso Logístico
  const [plantillas, setPlantillas] = useState<any[]>([]);
  const [selectedPlantillaId, setSelectedPlantillaId] = useState<number | null>(null);
  const [platName, setPlatName] = useState('');
  const [platDesc, setPlatDesc] = useState('');
  const [platSteps, setPlatSteps] = useState<{ id?: number; clave: string; etiqueta: string; icono: string; tempId?: string }[]>([]);
  const [stepName, setStepName] = useState('');
  const [stepIcon, setStepIcon] = useState('Package');
  const [isIconModalOpen, setIsIconModalOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isSavingPlantilla, setIsSavingPlantilla] = useState(false);

  const handleDragStartStep = (e: React.DragEvent, index: number) => {
      setDraggedIndex(index);
      e.dataTransfer.setData('text/plain', index.toString());
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverStep = (e: React.DragEvent, idx: number) => {
      e.preventDefault();
      if (draggedIndex === null || draggedIndex === idx) return;
      
      const updatedSteps = [...platSteps];
      const [draggedItem] = updatedSteps.splice(draggedIndex, 1);
      updatedSteps.splice(idx, 0, draggedItem);
      
      // Auto re-sequence keys
      const resequenced = updatedSteps.map((s, i) => ({ ...s, clave: (i + 1).toString() }));
      setPlatSteps(resequenced);
      setDraggedIndex(idx);
  };

  const handleDragEndStep = () => {
      setDraggedIndex(null);
  };

  const fetchPlantillas = async () => {
      try {
          const pRes = await executeAWSQuery("SELECT * FROM Stock_Plantillas_Progreso ORDER BY nombre");
          const sRes = await executeAWSQuery("SELECT * FROM Stock_Plantillas_Progreso_Pasos ORDER BY plantilla_id, orden");
          
          const stepsByPlantilla: Record<number, any[]> = {};
          if (sRes) {
              sRes.forEach((s: any) => {
                  if (!stepsByPlantilla[s.plantilla_id]) stepsByPlantilla[s.plantilla_id] = [];
                  stepsByPlantilla[s.plantilla_id].push(s);
              });
          }
          
          if (pRes) {
              setPlantillas(pRes.map((p: any) => ({
                  ...p,
                  pasos: stepsByPlantilla[p.id] || []
              })));
          }
      } catch(e) { console.error('Error fetching plantillas', e); }
  };

  const savePlantilla = async (e: React.FormEvent, forceNew: boolean = false) => {
      e.preventDefault();
      if (!platName.trim()) return toast.error("Por favor ingrese un nombre para la plantilla.");
      if (platSteps.length === 0) return toast.error("La plantilla debe tener al menos un paso.");
      
      setIsSavingPlantilla(true);
      try {
          let query = 'SET XACT_ABORT ON;\nBEGIN TRANSACTION;\n';
          const isUpdating = selectedPlantillaId && !forceNew;
          if (isUpdating) {
              query += `
                  UPDATE Stock_Plantillas_Progreso 
                  SET nombre = '${platName.replace(/'/g, "''")}', descripcion = '${platDesc.replace(/'/g, "''")}'
                  WHERE id = ${selectedPlantillaId};
                  DELETE FROM Stock_Plantillas_Progreso_Pasos WHERE plantilla_id = ${selectedPlantillaId};
              `;
              platSteps.forEach((s: any, idx: number) => {
                  query += `
                      INSERT INTO Stock_Plantillas_Progreso_Pasos (plantilla_id, clave, etiqueta, icono, orden)
                      VALUES (${selectedPlantillaId}, '${(idx + 1).toString()}', '${s.etiqueta.replace(/'/g, "''")}', '${s.icono.replace(/'/g, "''")}', ${idx + 1});
                  `;
              });
          } else {
              query += `
                  DECLARE @NewPlatId INT;
                  INSERT INTO Stock_Plantillas_Progreso (nombre, descripcion)
                  VALUES ('${platName.replace(/'/g, "''")}', '${platDesc.replace(/'/g, "''")}');
                  SET @NewPlatId = SCOPE_IDENTITY();
              `;
              platSteps.forEach((s: any, idx: number) => {
                  query += `
                      INSERT INTO Stock_Plantillas_Progreso_Pasos (plantilla_id, clave, etiqueta, icono, orden)
                      VALUES (@NewPlatId, '${(idx + 1).toString()}', '${s.etiqueta.replace(/'/g, "''")}', '${s.icono.replace(/'/g, "''")}', ${idx + 1});
                  `;
              });
          }
          query += 'COMMIT TRANSACTION;\n';
          
          await executeAWSQuery(query);
          toast.success(isUpdating ? "Plantilla actualizada!" : "Plantilla creada!");
          setSelectedPlantillaId(null);
          setPlatName('');
          setPlatDesc('');
          setPlatSteps([]);
          await fetchPlantillas();
      } catch(err: any) {
          toast.error("Error al guardar plantilla: " + err.message);
      } finally {
          setIsSavingPlantilla(false);
      }
  };

  const deletePlantilla = async (id: number) => {
      try {
          // Check if there are active purchases or imports linked to this template
          const checkDeps = await executeAWSQuery(`
              SELECT 
                (SELECT COUNT(*) FROM Stock_Compras WHERE plantilla_progreso_id = ${id}) as compras_count,
                (SELECT COUNT(*) FROM Stock_Importaciones WHERE plantilla_progreso_id = ${id}) as importaciones_count
          `);
          
          const deps = checkDeps[0];
          const totalDeps = deps.compras_count + deps.importaciones_count;
          
          if (totalDeps > 0) {
              const confirmMigrate = window.confirm(
                  `Esta plantilla está asignada a ${deps.compras_count} compra(s) y ${deps.importaciones_count} importación(es).\n` +
                  `Si continúas, estos registros se migrarán automáticamente a la Plantilla Estándar (Nativa).\n` +
                  `¿Deseas continuar y eliminar la plantilla?`
              );
              if (!confirmMigrate) return;
              
              // Migrate linked records and delete the template in a single transaction
              const query = `
                  SET XACT_ABORT ON;
                  BEGIN TRANSACTION;
                  
                  -- Reset purchases to default template (1) and reset their progress step to 'realizada'
                  UPDATE Stock_Compras 
                  SET plantilla_progreso_id = 1, 
                      progreso = 'realizada' 
                  WHERE plantilla_progreso_id = ${id};
                  
                  -- Reset imports to default template (1) and reset progress
                  UPDATE Stock_Importaciones 
                  SET plantilla_progreso_id = 1, 
                      progreso = 'realizada' 
                  WHERE plantilla_progreso_id = ${id};
                  
                  -- Delete steps and template
                  DELETE FROM Stock_Plantillas_Progreso_Pasos WHERE plantilla_id = ${id};
                  DELETE FROM Stock_Plantillas_Progreso WHERE id = ${id};
                  
                  COMMIT TRANSACTION;
              `;
              await executeAWSQuery(query);
          } else {
              if (!window.confirm("¿Está seguro de eliminar esta plantilla de progreso?")) return;
              
              // Delete directly inside transaction
              const query = `
                  SET XACT_ABORT ON;
                  BEGIN TRANSACTION;
                  DELETE FROM Stock_Plantillas_Progreso_Pasos WHERE plantilla_id = ${id};
                  DELETE FROM Stock_Plantillas_Progreso WHERE id = ${id};
                  COMMIT TRANSACTION;
              `;
              await executeAWSQuery(query);
          }
          
          toast.success("Plantilla eliminada correctamente!");
          await fetchPlantillas();
      } catch(err: any) {
          toast.error("Error al eliminar la plantilla: " + err.message);
      }
  };

  // Rendimientos
  const [rendProdId, setRendProdId] = useState('');
  const [rendGramos, setRendGramos] = useState('');
  const [equivalencias, setEquivalencias] = useState<any[]>([]);

  const fetchRendimientos = async () => {
      try {
          const res = await executeAWSQuery(`
            SELECT e.id, e.producto_maestro_id, e.gramos_por_metro_lineal, p.nombre as producto_nombre
            FROM wms_equivalencias_metricas e
            JOIN Stock_Productos_Maestros p ON e.producto_maestro_id = p.id
          `);
          if (res) setEquivalencias(res);
      } catch (e) { console.error('Error fetching rendimientos', e); }
  };

  const saveRendimiento = async (e: any) => {
      e.preventDefault();
      if(!rendProdId || !rendGramos) return;
      try {
          // INSERT or UPDATE
          await executeAWSQuery(`
              IF EXISTS (SELECT 1 FROM wms_equivalencias_metricas WHERE producto_maestro_id = '${rendProdId}')
              BEGIN
                 UPDATE wms_equivalencias_metricas SET gramos_por_metro_lineal = ${rendGramos} WHERE producto_maestro_id = '${rendProdId}'
              END
              ELSE
              BEGIN
                 INSERT INTO wms_equivalencias_metricas (producto_maestro_id, gramos_por_metro_lineal) VALUES ('${rendProdId}', ${rendGramos})
              END
          `);
          toast.success("Rendimiento guardado correctamente");
          setRendGramos('');
          setRendProdId('');
          fetchRendimientos();
      } catch(err) {
          toast.error("Error al guardar rendimiento");
      }
  };

  useEffect(() => {
     if(activeTab === 'rendimientos') {
         fetchRendimientos();
     }
     if(activeTab === 'monedas') {
         executeAWSQuery("SELECT * FROM Stock_Monedas ORDER BY id ASC")
            .then((m) => { if (m) setMonedas(m); })
            .catch(console.error);
     }
     if(activeTab === 'almacenes') {
         executeAWSQuery("SELECT * FROM Stock_Depositos ORDER BY id ASC")
            .then((deps) => { if (deps) setAlmacenes(deps); })
            .catch(console.error);
     }
     if(activeTab === 'plantillas_progreso') {
         fetchPlantillas();
     }
  }, [activeTab]);

  // Modals state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);

  const handleAddAtributo = async (nombreRaw: string) => {
      const nm = nombreRaw.trim();
      if(!nm) return;
      if(atributos.find(a => a.nombre.toLowerCase() === nm.toLowerCase())) {
          setNuevoAtributo(''); return;
      }
      setAtributos([...atributos, {nombre: nm, valores: []}]);
      setNuevoAtributo('');
      
      if(!atributosBase.find(ab => ab.nombre.toLowerCase() === nm.toLowerCase())) {
          try {
              await executeAWSQuery(`
                  IF OBJECT_ID('wms_atributos_base', 'U') IS NULL BEGIN
                      CREATE TABLE wms_atributos_base (id INT IDENTITY(1,1) PRIMARY KEY, nombre VARCHAR(255) NOT NULL UNIQUE);
                  END
                  IF OBJECT_ID('wms_atributos_valores_base', 'U') IS NULL BEGIN
                      CREATE TABLE wms_atributos_valores_base (id INT IDENTITY(1,1) PRIMARY KEY, atributo_id INT REFERENCES wms_atributos_base(id) ON DELETE CASCADE, valor VARCHAR(255) NOT NULL, CONSTRAINT UQ_atributo_valor UNIQUE(atributo_id, valor));
                  END
              `);
              const data = await executeAWSQuery(`INSERT INTO wms_atributos_base (nombre) OUTPUT inserted.* VALUES ('${nm}')`);
              if(data && data.length > 0) setAtributosBase(prev => [...prev, data[0]]);
          } catch(e) { console.error("Error creating attribute", e) }
      }
  };

  const handleAddValor = async (indexAtributo: number, valorRaw: string) => {
      const val = valorRaw.trim();
      if(!val) return;
      
      const na = [...atributos];
      if(na[indexAtributo].valores.includes(val)) return;
      
      na[indexAtributo].valores.push(val);
      setAtributos(na);

      const aNombre = na[indexAtributo].nombre;
      const baseAttr = atributosBase.find(ab => ab.nombre.toLowerCase() === aNombre.toLowerCase());
      
      if(baseAttr) {
          const existeValor = valoresBase.find(vb => vb.atributo_id === baseAttr.id && vb.valor.toLowerCase() === val.toLowerCase());
          if(!existeValor) {
              try {
                  const data = await executeAWSQuery(`INSERT INTO wms_atributos_valores_base (atributo_id, valor) OUTPUT inserted.* VALUES (${baseAttr.id}, '${val}')`);
                  if(data && data.length > 0) setValoresBase(prev => [...prev, data[0]]);
              } catch(e) { console.error("Error creating value", e) }
          }
      }
  };

  useEffect(() => {
    if (editProdId) return; // Si estamos editando, el SKU se bloquea al original.
    if (pmNombre && pmCatId) {
      const cat = categorias.find(c => c.id.toString() === pmCatId);
      const catPrefix = cat ? cat.nombre.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') : 'GEN';
      const nomPrefix = pmNombre.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '');
      
      const baseSKU = `${catPrefix}-${nomPrefix}`;
      
      // Auto-sequence generator to prevent naming collisions
      const matching = productos.filter(p => p.sku && p.sku.startsWith(baseSKU));
      let maxNum = 0;
      matching.forEach(p => {
        const suffix = p.sku.substring(baseSKU.length + 1);
        const num = parseInt(suffix, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      });
      let nextNum = maxNum + 1;
      while (productos.some(p => p.sku === `${baseSKU}-${nextNum}`)) {
        nextNum++;
      }
      setPmSKU(`${baseSKU}-${nextNum}`);
    } else {
      setPmSKU('');
    }
  }, [pmNombre, pmCatId, categorias, productos]);

  useEffect(() => {
    if (varProdIds && varProdIds.length > 0) {
       const mergedAtributos: {nombre: string, valores: string[]}[] = [];
       
       varProdIds.forEach(pid => {
           const prod = productos.find(p => p.id.toString() === pid);
           if (prod && prod.atributos_config) {
               try {
                   const config = JSON.parse(prod.atributos_config);
                   if (Array.isArray(config)) {
                       config.forEach(attr => {
                           const existing = mergedAtributos.find(a => a.nombre.toLowerCase() === attr.nombre.toLowerCase());
                           if (existing) {
                               attr.valores.forEach(v => {
                                   if (!existing.valores.includes(v)) {
                                       existing.valores.push(v);
                                   }
                               });
                           } else {
                               mergedAtributos.push({...attr});
                           }
                       });
                   }
               } catch(e) { console.error("Error parsing config", e); }
           }
       });
       setAtributos(mergedAtributos);
    } else {
       setAtributos([]);
    }
    setVariantesGeneradas([]);
  }, [varProdIds, productos]);

  const fetchMemorizados = async () => {
      try {
          await executeAWSQuery(`
              IF OBJECT_ID('wms_atributos_base', 'U') IS NULL BEGIN
                  CREATE TABLE wms_atributos_base (id INT IDENTITY(1,1) PRIMARY KEY, nombre VARCHAR(255) NOT NULL UNIQUE);
              END
              IF OBJECT_ID('wms_atributos_valores_base', 'U') IS NULL BEGIN
                  CREATE TABLE wms_atributos_valores_base (id INT IDENTITY(1,1) PRIMARY KEY, atributo_id INT REFERENCES wms_atributos_base(id) ON DELETE CASCADE, valor VARCHAR(255) NOT NULL, CONSTRAINT UQ_atributo_valor UNIQUE(atributo_id, valor));
              END
          `);
          const atrs = await executeAWSQuery(`SELECT id, nombre FROM wms_atributos_base ORDER BY nombre`);
          if(atrs) setAtributosBase(atrs);

          const vals = await executeAWSQuery(`SELECT id, atributo_id, valor FROM wms_atributos_valores_base ORDER BY valor`);
          if(vals) setValoresBase(vals);
          const uni = await executeAWSQuery(`SELECT * FROM wms_unidades_medida ORDER BY nombre`);
          if(uni) setUnidadesMedida(uni);
      } catch(e) { console.log('Sin BD de memoria aún', e); }
  };

  useEffect(() => {
    if (activeTab === 'modelos' || activeTab === 'diccionario' || activeTab === 'titulos_base') {
      fetchMemorizados();
    }
  }, [activeTab]);

  const deleteAtributoBase = async (id: number) => {
    try {
        await executeAWSQuery(`DELETE FROM wms_atributos_base WHERE id = ${id}`);
        setAtributosBase(prev => prev.filter(ab => ab.id !== id));
        setValoresBase(prev => prev.filter(vb => vb.atributo_id !== id));
        toast.success("Categoría de rasgo eliminada");
    } catch(e) { toast.error("Error al eliminar"); console.error(e); }
  };

  const deleteValorBase = async (id: number) => {
    try {
        await executeAWSQuery(`DELETE FROM wms_atributos_valores_base WHERE id = ${id}`);
        setValoresBase(prev => prev.filter(vb => vb.id !== id));
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
     if(atributos.length === 0) {
        setVariantesGeneradas([]);
        return;
     }     
     if(!atributos.some(a => a.valores.length > 0)) {
         setVariantesGeneradas([]);
         return;
     }
     const combinaciones = atributos.reduce((acc, curr) => {
         if (curr.valores.length === 0) return acc;
         if (acc.length === 0) return curr.valores.map(v => [v]);
         const newAcc: string[][] = [];
         acc.forEach(prev => {
             curr.valores.forEach(v => {
                 newAcc.push([...prev, v]);
             });
         });
         return newAcc;
     }, [] as string[][]);

     const generadas: any[] = [];
     varProdIds.forEach(pid => {
         const prod = productos.find(p => p.id.toString() === pid);
         const prefixBase = prod?.sku || (prod?.nombre ? prod.nombre.substring(0, 3).toUpperCase() : 'VAR');
         
         combinaciones.forEach(comb => {
             const suffix = comb.map(v => v.substring(0,3).toUpperCase().replace(/[^A-Z0-9]/g, '')).join('-');
             const nombreVar = comb.join(' - ');
             const skuVar = `${prefixBase}-${suffix}`;
             
             // Buscar si ya existe para este producto maestro específico
             const existe = variantes.find(v => v.producto_maestro_id.toString() === pid && v.nombre_variante === nombreVar);
             
             generadas.push({ 
                 prodId: pid,
                 prodNombre: prod?.nombre || 'Desconocido',
                 nombre: nombreVar, 
                 sku: skuVar, 
                 activa: !existe,
                 yaExiste: !!existe,
                 metadata: comb
             });
         });
     });

     setVariantesGeneradas(generadas);
   }, [atributos, varProdIds, productos, variantes]);

  const createVariantesMasivas = async () => {
    if(varProdIds.length === 0) return toast.error("Selecciona al menos un artículo base.");
    const validas = variantesGeneradas.filter(v => v.activa && !v.yaExiste);
    if(validas.length === 0) return toast.error("No hay modelos activos o todos ya existen.");
    setIsSaving(true);
    try {
       const attrJson = JSON.stringify(atributos).replace(/'/g, "''");
       let q = '';
       varProdIds.forEach(pid => {
           q += `UPDATE Stock_Productos_Maestros SET atributos_config = '${attrJson}' WHERE id = ${pid};\n`;
       });
       validas.forEach(v => {
          q += `INSERT INTO Stock_Variantes (producto_maestro_id, codigo_variante, nombre_variante, metadata_json) VALUES (${v.prodId}, '${v.sku || ''}', '${v.nombre.replace(/'/g, "''")}', '${JSON.stringify(v.metadata).replace(/'/g, "''")}');\n`;
       });
       await executeAWSQuery(q);
       toast.success(`${validas.length} Modelos Creados Exitosamente.`);
       fetchData();
       setVarProdIds([]);
       setNuevoAtributo('');
       setAtributos([]);
       setVariantesGeneradas([]);
       setIsProdModalOpen(false);
    } catch (err: any) {
       toast.error("Error al registrar modelos: " + err.message);
    } finally {
       setIsSaving(false);
    }
  };

  const updateVarianteInline = async (id: any, nuevoNombre: string, nuevoSku: string) => {
      try {
          await executeAWSQuery(`UPDATE Stock_Variantes SET nombre_variante='${nuevoNombre.replace(/'/g, "''")}', codigo_variante='${nuevoSku.replace(/'/g, "''")}' WHERE id = '${id}'`);
          toast.success('Variante actualizada.');
          fetchData();
      } catch (e: any) {
          toast.error('Error al actualizar variante.');
          console.error(e);
      }
  };

  const deleteVariante = async (v: any) => {
      try {
          toast.loading('Analizando dependencias de variante...', { id: 'del-var' });
          const res = await executeAWSQuery(`
              SELECT 
                (SELECT COUNT(*) FROM Stock_Etiquetas WHERE variante_id = ${v.id}) as stock_count,
                (SELECT COUNT(*) FROM wms_remitos_internos_items WHERE variante_id = ${v.id}) as remitos_count,
                (SELECT COUNT(*) FROM Stock_Compras_Detalle WHERE variante_id = ${v.id}) as compras_count,
                (SELECT COUNT(*) FROM Stock_Consumo_Historico WHERE variante_id = ${v.id}) as consumo_count,
                (SELECT COUNT(*) FROM wms_solicitudes_items WHERE variante_id = ${v.id}) as sol_count
          `);
          
          const deps = res[0];
          const totalDeps = deps.stock_count + deps.remitos_count + deps.compras_count + deps.consumo_count + deps.sol_count;
          
          toast.dismiss('del-var');
          if (totalDeps > 0) {
              setVarDependencies(deps);
              setDeleteVarToMove(v);
          } else {
              // Si no tiene NADA, lo elimina silenciosamente como quería el usuario
              toast.loading('Eliminando variante vacía...', { id: 'del-var-clean' });
              await executeAWSQuery(`DELETE FROM Stock_Variantes WHERE id = ${v.id}`);
              toast.success('Variante eliminada exitosamente.', { id: 'del-var-clean' });
              fetchData();
          }
      } catch (e: any) {
          toast.error('Error al analizar si la variante tiene stock o movimientos.', { id: 'del-var' });
          console.error(e);
      }
  };

  const executeVarTransferOrDelete = async (action: 'migrate' | 'delete') => {
      if (!deleteVarToMove) return;
      if (action === 'migrate' && !transferVarTargetId) {
          toast.error("Selecciona una variante de destino.");
          return;
      }
      
      const vId = deleteVarToMove.id;
      const tId = transferVarTargetId;
      
      try {
          toast.loading(action === 'migrate' ? 'Migrando stock e historial...' : 'Eliminando registro en cascada...', { id: 'del-var-action' });
          
          if (action === 'migrate') {
              await executeAWSQuery(`
                  UPDATE Stock_Etiquetas SET variante_id = ${tId} WHERE variante_id = ${vId};
                  UPDATE Stock_Compras_Detalle SET variante_id = ${tId} WHERE variante_id = ${vId};
                  UPDATE wms_remitos_internos_items SET variante_id = ${tId} WHERE variante_id = ${vId};
                  UPDATE wms_solicitudes_items SET variante_id = ${tId} WHERE variante_id = ${vId};
                  UPDATE Stock_Consumo_Historico SET variante_id = ${tId} WHERE variante_id = ${vId};
                  DELETE FROM Stock_Variantes WHERE id = ${vId};
              `);
          } else {
              await executeAWSQuery(`
                  DELETE FROM Stock_Movimientos WHERE etiqueta_id IN (SELECT id FROM Stock_Etiquetas WHERE variante_id = ${vId});
                  DELETE FROM wms_remitos_internos_items WHERE variante_id = ${vId};
                  DELETE FROM wms_solicitudes_items WHERE variante_id = ${vId};
                  DELETE FROM Stock_Consumo_Historico WHERE variante_id = ${vId};
                  DELETE FROM Stock_Compras_Detalle WHERE variante_id = ${vId};
                  DELETE FROM Stock_Etiquetas WHERE variante_id = ${vId};
                  DELETE FROM Stock_Variantes WHERE id = ${vId};
              `);
          }
          
          toast.success('Variante y dependencias procesadas exitosamente.', { id: 'del-var-action' });
          setDeleteVarToMove(null);
          setTransferVarTargetId('');
          setVarDependencies(null);
          fetchData();
      } catch(e: any) {
          toast.error("Error crítico de base de datos. Transacción abortada.", { id: 'del-var-action' });
          console.error(e);
      }
  };

  const deleteProductoMaestro = async (id: any) => {
      try {
          toast.loading('Eliminando artículo...', { id: 'del-pm' });
          await executeAWSQuery(`DELETE FROM Stock_Productos_Maestros WHERE id = '${id}'`);
          toast.success('Artículo eliminado exitosamente.', { id: 'del-pm' });
          fetchData();
      } catch (e: any) {
          toast.error('No se pudo eliminar. Puede tener variantes, stock o movimientos.', { id: 'del-pm' });
          console.error(e);
      }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      const [cats, provs, prods, vars] = await Promise.all([
        executeAWSQuery("SELECT * FROM Stock_Categorias ORDER BY nombre"),
        executeAWSQuery("SELECT * FROM Stock_Proveedores ORDER BY nombre"),
        executeAWSQuery("SELECT p.*, c.nombre as cat_nombre FROM Stock_Productos_Maestros p LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id ORDER BY p.nombre"),
        executeAWSQuery("SELECT v.id, v.nombre_variante, v.codigo_variante, v.producto_maestro_id, p.nombre as prod_nombre, c.nombre as categoria_nombre FROM Stock_Variantes v INNER JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id LEFT JOIN Stock_Categorias c ON p.categoria_id = c.id ORDER BY p.nombre, v.nombre_variante")
      ]);
      if(cats) setCategorias(cats);
      if(provs) setProveedores(provs);
      if(prods) setProductos(prods);
      if(vars) setVariantes(vars);
    } catch(e) { console.error(e); }
  };

  const createCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editCatId) {
          await executeAWSQuery(`UPDATE Stock_Categorias SET nombre = '${catName.replace(/'/g, "''")}', descripcion = '${catDesc.replace(/'/g, "''")}' WHERE id = ${editCatId}`);
          toast.success("Familia Actualizada");
      } else {
          await executeAWSQuery(`INSERT INTO Stock_Categorias (nombre, descripcion) VALUES ('${catName.replace(/'/g, "''")}', '${catDesc.replace(/'/g, "''")}')`);
          toast.success("Agrupador Guardado");
      }
      setCatName(''); setCatDesc(''); setEditCatId(null); fetchData();
    } catch (err: any) {
      toast.error("Error al guardar categoría: " + (err.message || "Es posible que este nombre ya exista."));
    }
  };

  const handleDeleteCatAttempt = async (catId: number) => {
      const prodsToMove = await executeAWSQuery(`SELECT COUNT(*) as c FROM Stock_Productos_Maestros WHERE categoria_id = ${catId}`);
      if(prodsToMove && prodsToMove[0] && prodsToMove[0].c > 0) {
          setDeleteCatToMove(catId);
      } else {
          if(window.confirm('¿Seguro quieres borrar esta familia sin artículos vinculados?')) {
              try {
                  await executeAWSQuery(`DELETE FROM Stock_Categorias WHERE id = ${catId}`);
                  toast.success("Familia Eliminada");
                  fetchData();
              } catch(e) {
                  toast.error("No se pudo eliminar la familia.");
              }
          }
      }
  };

  const executeCatTransferAndDelete = async () => {
    if(!transferTargetId) return toast.error("Debes elegir un destino para la migración.");
    try {
        await executeAWSQuery(`
            BEGIN TRANSACTION;
            UPDATE Stock_Productos_Maestros SET categoria_id = ${transferTargetId} WHERE categoria_id = ${deleteCatToMove};
            DELETE FROM Stock_Categorias WHERE id = ${deleteCatToMove};
            COMMIT;
        `);
        toast.success("Artículos migrados y Familia eliminada exitosamente.");
        setDeleteCatToMove(null);
        setTransferTargetId('');
        fetchData();
    } catch(err) {
        toast.error("Error en el traspaso de base de datos.");
    }
  };

  const saveMoneda = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editMonId) {
          await executeAWSQuery(`UPDATE Stock_Monedas SET nombre='${monNombre.replace(/'/g, "''")}', codigo='${monCodigo.replace(/'/g, "''")}', simbolo='${monSimbolo.replace(/'/g, "''")}' WHERE id=${editMonId}`);
          toast.success("Moneda Actualizada");
      } else {
          await executeAWSQuery(`INSERT INTO Stock_Monedas (nombre, codigo, simbolo) VALUES ('${monNombre.replace(/'/g, "''")}', '${monCodigo.replace(/'/g, "''")}', '${monSimbolo.replace(/'/g, "''")}')`);
          toast.success("Moneda Creada");
      }
      setMonNombre(''); setMonCodigo(''); setMonSimbolo(''); setEditMonId(null);
      const m = await executeAWSQuery("SELECT * FROM Stock_Monedas ORDER BY id ASC");
      if(m) setMonedas(m);
    } catch(err) {
      toast.error("Error al guardar moneda");
    }
  };

  const deleteMoneda = async (id: number) => {
    if(!window.confirm("¿Seguro que deseas eliminar esta moneda?")) return;
    try {
        await executeAWSQuery(`DELETE FROM Stock_Monedas WHERE id = ${id}`);
        toast.success("Moneda Eliminada");
        const m = await executeAWSQuery("SELECT * FROM Stock_Monedas ORDER BY id ASC");
        if(m) setMonedas(m);
    } catch(err) {
        toast.error("No se pudo eliminar, es posible que esté en uso.");
    }
  };

  const renameUnidad = async (id: number, current: string) => {
      const val = window.prompt("Editar Unidad de Medida:", current);
      if(!val || val.trim() === current) return;
      try {
          await executeAWSQuery(`UPDATE wms_unidades_medida SET nombre = '${val.trim().toLowerCase()}' WHERE id = ${id}`);
          setUnidadesMedida(prev => prev.map(u => u.id === id ? { ...u, nombre: val.trim().toLowerCase() } : u));
          toast.success("Unidad renombrada");
      } catch(e) { toast.error("Error al renombrar"); }
  };
  const renameAtributo = async (id: number, current: string) => {
      const val = window.prompt("Editar Categoría de Rasgo:", current);
      if(!val || val.trim() === current) return;
      try {
          await executeAWSQuery(`UPDATE wms_atributos_base SET nombre = '${val.trim()}' WHERE id = ${id}`);
          setAtributosBase(prev => prev.map(u => u.id === id ? { ...u, nombre: val.trim() } : u));
          toast.success("Categoría renombrada");
      } catch(e) { toast.error("Error al renombrar"); }
  };
  const renameValor = async (id: number, current: string) => {
      const val = window.prompt("Editar Valor de Rasgo:", current);
      if(!val || val.trim() === current) return;
      try {
          await executeAWSQuery(`UPDATE wms_atributos_valores_base SET valor = '${val.trim()}' WHERE id = ${id}`);
          setValoresBase(prev => prev.map(u => u.id === id ? { ...u, valor: val.trim() } : u));
          toast.success("Valor renombrado");
      } catch(e) { toast.error("Error al renombrar"); }
  };

  const createProveedor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editProvId) {
          await executeAWSQuery(`UPDATE Stock_Proveedores SET nombre='${provName.replace(/'/g, "''")}', documento='${provDoc.replace(/'/g, "''")}', contacto='${provContacto.replace(/'/g, "''")}', ciudad='${provCiudad.replace(/'/g, "''")}', razon_social='${provRazon.replace(/'/g, "''")}' WHERE id='${editProvId}'`);
          toast.success("Proveedor Actualizado");
      } else {
          await executeAWSQuery(`INSERT INTO Stock_Proveedores (nombre, documento, contacto, ciudad, razon_social) VALUES ('${provName.replace(/'/g, "''")}', '${provDoc.replace(/'/g, "''")}', '${provContacto.replace(/'/g, "''")}', '${provCiudad.replace(/'/g, "''")}', '${provRazon.replace(/'/g, "''")}')`);
          toast.success("Proveedor Guardado");
      }
      setProvName(''); setProvDoc(''); setProvContacto(''); setProvCiudad(''); setProvRazon(''); setEditProvId(null);
      fetchData();
    } catch (err: any) {
      toast.error("Error al guardar proveedor: " + (err.message || "Es posible que ya esté registrado."));
    }
  };

  const saveProductoMaestro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pmCatId) return toast.error("Por favor, selecciona una familia primero.");
    
    const normalizedName = pmNombre.trim().toLowerCase();
    const exists = productos.some(p => p.nombre.toLowerCase() === normalizedName && p.id.toString() !== editProdId);
    if (exists) {
        return toast.error(`El artículo maestro "${pmNombre.trim()}" ya existe.`);
    }

    try {
      if (editProdId) {
          await executeAWSQuery(`UPDATE Stock_Productos_Maestros SET nombre='${pmNombre.replace(/'/g, "''").trim()}', categoria_id=${pmCatId}, unidad_base='${pmUnidad.replace(/'/g, "''")}', tipo_gestion='${pmTipoGestion}' WHERE id=${editProdId}`);
          toast.success("Producto Actualizado");
      } else {
          await executeAWSQuery(`INSERT INTO Stock_Productos_Maestros (sku, nombre, categoria_id, unidad_base, tipo_gestion) VALUES ('${pmSKU.replace(/'/g, "''")}', '${pmNombre.replace(/'/g, "''").trim()}', ${pmCatId}, '${pmUnidad.replace(/'/g, "''")}', '${pmTipoGestion}')`);
          toast.success("Producto Registrado");
      }
      setPmSKU(''); setPmNombre(''); setPmCatId(''); setPmTipoGestion('granel'); setPmUnidad('ud'); setEditProdId(null); 
      fetchData();
    } catch (err: any) {
      toast.error("Error al guardar artículo: " + (err.message || "Posible duplicado."));
    }
  };

  const cancelEditPM = () => {
      setPmSKU(''); setPmNombre(''); setPmCatId(''); setPmTipoGestion('granel'); setPmUnidad('ud'); setEditProdId(null);
  };

  const createVariante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (varProdIds.length === 0) return toast.error("Por favor, selecciona un maestro primero.");
    try {
      await executeAWSQuery(`INSERT INTO Stock_Variantes (producto_maestro_id, codigo_variante, nombre_variante) VALUES ('${varProdIds[0]}', '${varSku.replace(/'/g, "''")}', '${varNombre.replace(/'/g, "''")}')`);
      setVarNombre(''); setVarSku(''); toast.success("Variante Creada"); fetchData();
    } catch (err: any) {
       toast.error("Error al crear variante: " + (err.message || "Posible duplicado."));
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
      if (!isEditMode) return;
      e.dataTransfer.setData('text/plain', id);
      e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e: React.DragEvent) => {
      if (!isEditMode) return;
      e.preventDefault();
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
      if (!isEditMode) return;
      e.preventDefault();
      const draggedId = e.dataTransfer.getData('text/plain');
      if (draggedId && draggedId !== targetId) {
          const dObj = uiConfigs[draggedId] || { order_index: 99 };
          const tObj = uiConfigs[targetId] || { order_index: 99 };
          updateConfigLocal(draggedId, { order_index: tObj.order_index });
          updateConfigLocal(targetId, { order_index: dObj.order_index });
      }
  };

  return (
    <div className="space-y-6">
      
      {activeTab === 'hub' ? (
      <div className="space-y-10">
          <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-sm mb-10 w-full md:w-auto items-center justify-between">
              <div className="flex items-center gap-3 px-4 py-2">
                 <div className="bg-slate-900 text-white p-2 rounded-xl"><Settings className="w-5 h-5"/></div>
                 <h1 className="text-xl font-black tracking-tighter">Gestión de Sistema</h1>
              </div>
          </div>

  <motion.div initial={{opacity:0, y:20}} animate={{opacity:1, y:0}} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6 gap-4 max-w-[1400px] mx-auto py-4 px-4">
      {hasSubAccess('sidebar_sistema', 'gestion_productos') !== 'none' && (
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_maestros')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_maestros')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_maestros'); }
               else { setActiveTab('titulos_base'); }
           }} 
           style={{ order: uiConfigs['btn_sys_maestros']?.order_index || 1 }}
           className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
        >
            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
               <DynamicUIIcon id="btn_sys_maestros" fallback={Network} className={`w-6 h-6 ${uiConfigs['btn_sys_maestros']?.icon_color || ''}`} />
            </div>
            <div className="flex-1 flex flex-col items-center">
               <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_maestros']?.label || 'Artículos Maestros'}</h3>
               <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_maestros']?.sub_label || 'Matrices principales.'}</p>
            </div>
      </button>
      )}

      {hasSubAccess('sidebar_sistema', 'gestion_productos') !== 'none' && (
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_variantes')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_variantes')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_variantes'); }
               else { setActiveTab('modelos'); }
           }} 
           style={{ order: uiConfigs['btn_sys_variantes']?.order_index || 2 }}
           className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
        >
            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
               <DynamicUIIcon id="btn_sys_variantes" fallback={Box} className={`w-6 h-6 ${uiConfigs['btn_sys_variantes']?.icon_color || ''}`} />
            </div>
            <div className="flex-1 flex flex-col items-center">
               <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_variantes']?.label || 'Variantes (SKU)'}</h3>
               <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_variantes']?.sub_label || 'Generador de matrices.'}</p>
            </div>
      </button>
      )}

      {hasSubAccess('sidebar_sistema', 'gestion_productos') !== 'none' && (
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_rasgos')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_rasgos')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_rasgos'); }
               else { setActiveTab('diccionario'); }
           }} 
           style={{ order: uiConfigs['btn_sys_rasgos']?.order_index || 3 }}
           className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
        >
            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
               <DynamicUIIcon id="btn_sys_rasgos" fallback={Tag} className={`w-6 h-6 ${uiConfigs['btn_sys_rasgos']?.icon_color || ''}`} />
            </div>
            <div className="flex-1 flex flex-col items-center">
               <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_rasgos']?.label || 'Rasgos y Atributos'}</h3>
               <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_rasgos']?.sub_label || 'Diccionario Variantes.'}</p>
            </div>
      </button>
      )}

      {hasSubAccess('sidebar_sistema', 'gestion_productos') !== 'none' && (
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_familias')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_familias')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_familias'); }
               else { setActiveTab('categorias'); }
           }} 
           style={{ order: uiConfigs['btn_sys_familias']?.order_index || 4 }}
           className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
        >
            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
               <DynamicUIIcon id="btn_sys_familias" fallback={Layers} className={`w-6 h-6 ${uiConfigs['btn_sys_familias']?.icon_color || ''}`} />
            </div>
            <div className="flex-1 flex flex-col items-center">
               <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_familias']?.label || 'Familias'}</h3>
               <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_familias']?.sub_label || 'Categorías globales.'}</p>
            </div>
      </button>
      )}

      {hasSubAccess('sidebar_sistema', 'gestion_productos') !== 'none' && (
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_proveedores')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_proveedores')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_proveedores'); }
               else { setActiveTab('proveedores'); }
           }} 
           style={{ order: uiConfigs['btn_sys_proveedores']?.order_index || 5 }}
           className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
        >
            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
               <DynamicUIIcon id="btn_sys_proveedores" fallback={Truck} className={`w-6 h-6 ${uiConfigs['btn_sys_proveedores']?.icon_color || ''}`} />
            </div>
            <div className="flex-1 flex flex-col items-center">
               <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_proveedores']?.label || 'Proveedores'}</h3>
               <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_proveedores']?.sub_label || 'Directorio importadores.'}</p>
            </div>
      </button>
      )}

      {hasSubAccess('sidebar_sistema', 'gestion_productos') !== 'none' && (
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_almacenes')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_almacenes')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_almacenes'); }
               else { setActiveTab('almacenes'); }
           }} 
           style={{ order: uiConfigs['btn_sys_almacenes']?.order_index || 6 }}
           className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
        >
            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
               <DynamicUIIcon id="btn_sys_almacenes" fallback={ArchiveRestore} className={`w-6 h-6 ${uiConfigs['btn_sys_almacenes']?.icon_color || ''}`} />
            </div>
            <div className="flex-1 flex flex-col items-center">
               <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_almacenes']?.label || 'Almacenes'}</h3>
               <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_almacenes']?.sub_label || 'Depositos de stock.'}</p>
            </div>
      </button>
      )}

      {hasSubAccess('sidebar_sistema', 'gestion_productos') !== 'none' && (
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_monedas')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_monedas')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_monedas'); }
               else { setActiveTab('monedas'); }
           }} 
           style={{ order: uiConfigs['btn_sys_monedas']?.order_index || 7 }}
           className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
        >
            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
               <DynamicUIIcon id="btn_sys_monedas" fallback={Banknote} className={`w-6 h-6 ${uiConfigs['btn_sys_monedas']?.icon_color || ''}`} />
            </div>
            <div className="flex-1 flex flex-col items-center">
               <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_monedas']?.label || 'Monedas'}</h3>
               <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_monedas']?.sub_label || 'Divisas en compras.'}</p>
            </div>
      </button>
      )}

      {hasSubAccess('sidebar_sistema', 'gestion_productos') !== 'none' && (
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_tipos_facturas')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_tipos_facturas')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_tipos_facturas'); }
               else { setActiveTab('tipos_facturas'); }
           }} 
           style={{ order: uiConfigs['btn_sys_tipos_facturas']?.order_index || 8 }}
           className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
        >
            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
               <DynamicUIIcon id="btn_sys_tipos_facturas" fallback={FileText} className={`w-6 h-6 ${uiConfigs['btn_sys_tipos_facturas']?.icon_color || ''}`} />
            </div>
            <div className="flex-1 flex flex-col items-center">
               <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_tipos_facturas']?.label || 'Tipos Comprobantes'}</h3>
               <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_tipos_facturas']?.sub_label || 'Tipos de facturas.'}</p>
            </div>
      </button>
      )}

      {hasSubAccess('sidebar_sistema', 'gestion_usuarios') !== 'none' && (
      <button 
           draggable={isEditMode}
           onDragStart={(e) => handleDragStart(e, 'btn_sys_usuarios')}
           onDragOver={handleDragOver}
           onDrop={(e) => handleDrop(e, 'btn_sys_usuarios')}
           onClick={(e) => {
               if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_usuarios'); }
               else { setActiveTab('usuarios'); }
           }} 
           style={{ order: uiConfigs['btn_sys_usuarios']?.order_index || 9 }}
           className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
        >
            <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
               <DynamicUIIcon id="btn_sys_usuarios" fallback={Network} className={`w-6 h-6 ${uiConfigs['btn_sys_usuarios']?.icon_color || ''}`} />
            </div>
            <div className="flex-1 flex flex-col items-center">
               <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_usuarios']?.label || 'Usuarios'}</h3>
               <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_usuarios']?.sub_label || 'Gestión y Permisos.'}</p>
            </div>
      </button>
      )}

        {hasSubAccess('sidebar_sistema', 'gestion_productos') !== 'none' && (
      <button 
             draggable={isEditMode}
             onDragStart={(e) => handleDragStart(e, 'btn_sys_historicos')}
             onDragOver={handleDragOver}
             onDrop={(e) => handleDrop(e, 'btn_sys_historicos')}
             onClick={(e) => {
                 if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_historicos'); }
                 else { setActiveTab('historicos'); }
             }} 
             style={{ order: uiConfigs['btn_sys_historicos']?.order_index || 10 }}
             className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
          >
              <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
                 <DynamicUIIcon id="btn_sys_historicos" fallback={History} className={`w-6 h-6 ${uiConfigs['btn_sys_historicos']?.icon_color || ''}`} />
              </div>
              <div className="flex-1 flex flex-col items-center">
                 <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_historicos']?.label || 'Históricos'}</h3>
                 <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_historicos']?.sub_label || 'Egresos manuales.'}</p>
              </div>
        </button>
      )}


        {hasSubAccess('sidebar_sistema', 'gestion_alertas') !== 'none' && (
      <button 
             draggable={isEditMode}
             onDragStart={(e) => handleDragStart(e, 'btn_sys_alertas_stock')}
             onDragOver={handleDragOver}
             onDrop={(e) => handleDrop(e, 'btn_sys_alertas_stock')}
             onClick={(e) => {
                 if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_alertas_stock'); }
                 else { setActiveTab('alertas_stock'); }
             }} 
             style={{ order: uiConfigs['btn_sys_alertas_stock']?.order_index || 11 }}
             className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
          >
              <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
                 <DynamicUIIcon id="btn_sys_alertas_stock" fallback={AlertOctagon} className={`w-6 h-6 ${uiConfigs['btn_sys_alertas_stock']?.icon_color || ''}`} />
              </div>
              <div className="flex-1 flex flex-col items-center">
                 <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_alertas_stock']?.label || 'Alertas Stock'}</h3>
                 <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_alertas_stock']?.sub_label || 'Límites críticos.'}</p>
              </div>
        </button>
      )}


        {hasSubAccess('sidebar_sistema', 'gestion_productos') !== 'none' && (
      <button 
             draggable={isEditMode}
             onDragStart={(e) => handleDragStart(e, 'btn_sys_costos_cero')}
             onDragOver={handleDragOver}
             onDrop={(e) => handleDrop(e, 'btn_sys_costos_cero')}
             onClick={(e) => {
                 if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_costos_cero'); }
                 else { setActiveTab('costos_cero'); }
             }} 
             style={{ order: uiConfigs['btn_sys_costos_cero']?.order_index || 12 }}
             className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
          >
              <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
                 <DynamicUIIcon id="btn_sys_costos_cero" fallback={DollarSign} className={`w-6 h-6 ${uiConfigs['btn_sys_costos_cero']?.icon_color || ''}`} />
              </div>
              <div className="flex-1 flex flex-col items-center">
                 <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_costos_cero']?.label || 'Artículos sin costo'}</h3>
                 <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_costos_cero']?.sub_label || 'Asignar costos.'}</p>
              </div>
        </button>
      )}


        {hasSubAccess('sidebar_sistema', 'gestion_productos') !== 'none' && (
      <button 
             draggable={isEditMode}
             onDragStart={(e) => handleDragStart(e, 'btn_sys_plantillas_progreso')}
             onDragOver={handleDragOver}
             onDrop={(e) => handleDrop(e, 'btn_sys_plantillas_progreso')}
             onClick={(e) => {
                 if (isEditMode) { e.preventDefault(); setEditingComponentId('btn_sys_plantillas_progreso'); }
                 else { setActiveTab('plantillas_progreso'); }
             }} 
             style={{ order: uiConfigs['btn_sys_plantillas_progreso']?.order_index || 13 }}
             className={`${isEditMode ? 'ring-2 ring-indigo-500 hover:ring-indigo-500/50 cursor-move border-dashed shadow-[0_0_15px_rgba(99,102,241,0.5)]' : ''} bg-white dark:bg-slate-900 border border-slate-200 hover:border-slate-400 dark:border-slate-800 dark:hover:border-slate-600 p-4 rounded-2xl text-center transition-all h-full group flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5`}
          >
              <div className="p-3 bg-transparent text-slate-700 dark:text-slate-300 group-hover:scale-110 transition-transform flex items-center justify-center">
                 <DynamicUIIcon id="btn_sys_plantillas_progreso" fallback={Workflow} className={`w-6 h-6 ${uiConfigs['btn_sys_plantillas_progreso']?.icon_color || ''}`} />
              </div>
              <div className="flex-1 flex flex-col items-center">
                 <h3 className="text-xs font-black text-slate-800 dark:text-white mb-1 leading-tight text-center">{uiConfigs['btn_sys_plantillas_progreso']?.label || 'Plantillas Progreso'}</h3>
                 <p className="text-slate-400 font-medium text-[10px] leading-tight text-center line-clamp-2 max-w-[120px]">{uiConfigs['btn_sys_plantillas_progreso']?.sub_label || 'Flujos de progreso.'}</p>
              </div>
        </button>
      )}


      </motion.div>

        </div>
        ) : (
          <div className="mb-6">
              <button onClick={()=>setActiveTab('hub')} className="text-sm font-black text-slate-500 hover:text-indigo-600 transition-colors flex items-center gap-2">← VOLVER AL PANEL DE SISTEMA</button>
          </div>
      )}

      {activeTab === 'iconos' && <IconManager />}

      {activeTab === 'monedas' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                
                {editMonId && (
                   <div className="absolute top-6 right-6">
                      <button type="button" onClick={() => { setEditMonId(null); setMonNombre(''); setMonCodigo(''); setMonSimbolo(''); }} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">Cancelar Edición</button>
                   </div>
                )}

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Banknote className="w-5 h-5 text-green-500"/> {editMonId ? 'Editar Moneda' : 'Nueva Moneda'}</h3>
                <form className="space-y-4" onSubmit={saveMoneda}>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Nombre (Ej: Dólares)</label>
                        <input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900" required value={monNombre} onChange={e=>setMonNombre(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Código ISO (Ej: USD)</label>
                        <input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900" required value={monCodigo} onChange={e=>setMonCodigo(e.target.value.toUpperCase().substring(0,3))} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Símbolo (Ej: U$S)</label>
                        <input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900" required value={monSimbolo} onChange={e=>setMonSimbolo(e.target.value)} />
                    </div>
                    <button type="submit" className={`${editMonId ? 'bg-green-600 hover:bg-green-700' : 'btn-primary'} text-white w-full py-3.5 mt-2 font-black rounded-xl transition-all shadow-lg`}>{editMonId ? 'Actualizar Moneda' : 'Añadir Moneda'}</button>
                </form>
            </div>
            <div className="lg:col-span-8 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Monedas Configuradas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {monedas.map(m => (
                        <div key={m.id} className="group p-4 border border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 rounded-xl hover:border-green-200 dark:hover:border-green-900/50 transition-colors flex justify-between items-center relative">
                            
                            <div className="flex flex-col">
                                <p className="font-black text-slate-900 dark:text-slate-200 mb-0.5 pr-8">{m.nombre}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{m.codigo} • {m.simbolo}</p>
                            </div>
                            
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                               <button onClick={() => { 
                                   setEditMonId(m.id); 
                                   setMonNombre(m.nombre || ''); 
                                   setMonCodigo(m.codigo || ''); 
                                   setMonSimbolo(m.simbolo || ''); 
                               }} className="p-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-green-600 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" title="Editar">
                                   <Edit3 className="w-4 h-4"/>
                               </button>
                               <button onClick={() => deleteMoneda(m.id)} className="p-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" title="Eliminar">
                                   <Trash2 className="w-4 h-4"/>
                               </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
      )}

      {activeTab === 'almacenes' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-5xl mx-auto mt-10">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3"><ArchiveRestore className="w-6 h-6 text-rose-500"/> Almacenes y Sectores</h3>
            <p className="text-slate-500 font-medium mb-10">Creación lógica de locaciones de stock.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
               <div className="border border-slate-100 dark:border-slate-800 p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 sticky top-10">
                  <div className="flex items-center justify-between mb-4">
                      <h4 className="font-black text-sm uppercase tracking-widest text-slate-400">{editAlmId ? 'Editar Almacén' : 'Añadir Nuevo'}</h4>
                      {editAlmId && <button onClick={() => { setEditAlmId(null); setAlmName(''); setAlmUbicacion(''); }} className="text-xs font-bold text-red-500 hover:text-red-600 bg-red-100/50 px-2 py-1 rounded">Cancelar Edición</button>}
                  </div>
                  
                  <form className="space-y-4" onSubmit={async (e) => {
                      e.preventDefault();
                      if(!almName.trim()) return;
                      try {
                          if (editAlmId) {
                              await executeAWSQuery(`UPDATE Stock_Depositos SET nombre = '${almName.replace(/'/g, "''")}', ubicacion = '${almUbicacion.replace(/'/g, "''")}' WHERE id = ${editAlmId}`);
                              toast.success("Almacén modificado correctamente");
                          } else {
                              try { await executeAWSQuery("ALTER TABLE Stock_Depositos ADD ubicacion VARCHAR(255)"); } catch(e){}
                              await executeAWSQuery(`INSERT INTO Stock_Depositos (nombre, ubicacion) VALUES ('${almName.replace(/'/g, "''")}', '${almUbicacion.replace(/'/g, "''")}')`);
                              toast.success("Almacén creado correctamente");
                          }
                          setAlmName('');
                          setAlmUbicacion('');
                          setEditAlmId(null);
                          const deps = await executeAWSQuery("SELECT * FROM Stock_Depositos ORDER BY id ASC");
                          if(deps) setAlmacenes(deps);
                      } catch (e) {
                          toast.error("Error al guardar almacén");
                      }
                  }}>
                     <input required value={almName} onChange={e=>setAlmName(e.target.value)} placeholder="Nombre del Almacén (Ej: Depósito Central)" className="input-nexus w-full bg-white dark:bg-slate-900" />
                     <input value={almUbicacion} onChange={e=>setAlmUbicacion(e.target.value)} placeholder="Ubicación Física (Ej: Pasillo A)" className="input-nexus w-full bg-white dark:bg-slate-900" />
                     <button className={`${editAlmId ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20' : 'btn-primary'} w-full py-3.5 mt-2 font-black text-white rounded-xl transition-all`} type="submit">{editAlmId ? 'Actualizar Almacén' : 'Guardar Almacén'}</button>
                  </form>
               </div>
               
               <div className="border border-slate-100 dark:border-slate-800 p-6 rounded-2xl bg-white dark:bg-slate-900 h-full max-h-[600px] overflow-y-auto custom-scrollbar">
                   <h4 className="font-black text-sm uppercase tracking-widest text-slate-400 mb-4 flex justify-between items-center">
                      Directorio Actual
                      <button onClick={async () => {
                         const deps = await executeAWSQuery("SELECT * FROM Stock_Depositos ORDER BY id ASC");
                         if(deps) setAlmacenes(deps);
                      }} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400"><History className="w-4 h-4"/></button>
                   </h4>
                   
                   {almacenes.length === 0 ? (
                       <div className="text-center py-10 text-slate-400 font-bold">Base de Datos de Almacenes Vacía</div>
                   ) : (
                       <div className="flex flex-col gap-3">
                           {almacenes.map(a => (
                               <div key={a.id} className={`p-4 rounded-xl border flex items-center justify-between group transition-colors ${editAlmId === a.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 bg-slate-50 dark:bg-slate-950'}`}>
                                   <div>
                                       <p className="font-black text-slate-900 dark:text-white">{a.nombre}</p>
                                       {a.ubicacion && <p className="text-xs font-bold text-slate-500 mt-0.5"><span className="text-blue-500">📍</span> {a.ubicacion}</p>}
                                   </div>
                                   
                                   <div className="flex gap-2 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={() => { setAlmName(a.nombre); setAlmUbicacion(a.ubicacion || ''); setEditAlmId(a.id); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg" title="Editar">
                                           <Edit3 className="w-4 h-4"/>
                                       </button>
                                       <button onClick={async () => {
                                          if(!window.confirm("¿Eliminar este almacén?")) return;
                                          try {
                                              await executeAWSQuery(`DELETE FROM Stock_Depositos WHERE id = ${a.id}`);
                                              toast.success("Eliminado");
                                              const deps = await executeAWSQuery("SELECT * FROM Stock_Depositos ORDER BY id ASC");
                                              if(deps) setAlmacenes(deps);
                                          } catch(e) { toast.error("No se puede eliminar"); }
                                       }} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg" title="Eliminar">
                                           <Trash2 className="w-4 h-4"/>
                                       </button>
                                   </div>
                               </div>
                           ))}
                       </div>
                   )}
               </div>
            </div>
        </motion.div>
      )}

      {activeTab === 'proveedores' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                
                {editProvId && (
                   <div className="absolute top-6 right-6">
                      <button type="button" onClick={() => { setEditProvId(null); setProvName(''); setProvDoc(''); setProvContacto(''); setProvCiudad(''); setProvRazon(''); }} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">Cancelar Edición</button>
                   </div>
                )}

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Truck className="w-5 h-5 text-blue-500"/> {editProvId ? 'Editar Proveedor' : 'Nuevo Proveedor'}</h3>
                <form className="space-y-4" onSubmit={createProveedor}>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Nombre Fantasía</label>
                        <input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900" required value={provName} onChange={e=>setProvName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Razón Social</label>
                        <input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900" value={provRazon} onChange={e=>setProvRazon(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div>
                           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">RUT / ID</label>
                           <input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900" value={provDoc} onChange={e=>setProvDoc(e.target.value)} />
                       </div>
                       <div>
                           <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Ciudad / País</label>
                           <input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900" value={provCiudad} onChange={e=>setProvCiudad(e.target.value)} />
                       </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 block">Persona de Contacto / Tel.</label>
                        <input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900" value={provContacto} onChange={e=>setProvContacto(e.target.value)} />
                    </div>
                    <button type="submit" className={`${editProvId ? 'bg-indigo-600 hover:bg-indigo-700' : 'btn-primary'} text-white w-full py-3.5 mt-2 font-black rounded-xl transition-all shadow-lg`}>{editProvId ? 'Actualizar Proveedor' : 'Registrar Proveedor'}</button>
                </form>
            </div>
            <div className="lg:col-span-8 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Directorio de Proveedores</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                    {proveedores.map(p => (
                        <div key={p.id} className="group p-4 border border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 rounded-xl hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors flex flex-col justify-between relative">
                            
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { 
                                   setEditProvId(p.id); 
                                   setProvName(p.nombre || ''); 
                                   setProvDoc(p.documento || ''); 
                                   setProvContacto(p.contacto || ''); 
                                   setProvCiudad(p.ciudad || ''); 
                                   setProvRazon(p.razon_social || ''); 
                               }} className="p-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" title="Editar">
                                   <Edit3 className="w-4 h-4"/>
                               </button>
                            </div>

                            <div>
                                <p className="font-black text-slate-900 dark:text-slate-200 mb-0.5 pr-8">{p.nombre}</p>
                                {p.razon_social && <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">{p.razon_social}</p>}
                            </div>
                            <div className="mt-4 space-y-1">
                                <p className="text-[10px] font-bold text-slate-500"><b className="text-slate-400">RUT:</b> {p.documento || '-'}</p>
                                <p className="text-[10px] font-bold text-slate-500"><b className="text-slate-400">CIUDAD:</b> {p.ciudad || '-'}</p>
                                <p className="text-[10px] font-bold text-slate-500"><b className="text-slate-400">CONTACTO:</b> {p.contacto || '-'}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
      )}

      {activeTab === 'categorias' && (
        <>
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
                
                {editCatId && (
                   <div className="absolute top-6 right-6">
                      <button type="button" onClick={() => { setEditCatId(null); setCatName(''); setCatDesc(''); }} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors">Cancelar Edición</button>
                   </div>
                )}

                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-blue-500"/> {editCatId ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
                <form className="space-y-5" onSubmit={createCategoria}>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre (Ej. Remeras)</label>
                        <input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900" required value={catName} onChange={e=>setCatName(e.target.value)} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Referencia Interna</label>
                        <input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900" value={catDesc} onChange={e=>setCatDesc(e.target.value)} />
                    </div>
                    <button type="submit" className={`${editCatId ? 'bg-indigo-600 hover:bg-indigo-700' : 'btn-primary'} text-white w-full py-3.5 mt-2 font-black rounded-xl transition-all shadow-lg`}>{editCatId ? 'Actualizar Agrupador' : 'Crear Agrupador'}</button>
                </form>
            </div>
            <div className="lg:col-span-8 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Lista de Familias Mantenidas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorias.map(c => (
                        <div key={c.id} className="group p-4 border border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 rounded-xl hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors flex justify-between items-center">
                            <p className="font-black text-sm text-slate-900 dark:text-slate-200">{c.nombre}</p>
                            
                            <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                               <button onClick={() => { setEditCatId(c.id); setCatName(c.nombre); setCatDesc(c.descripcion || ''); }} className="p-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-indigo-600 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" title="Editar">
                                   <Edit3 className="w-4 h-4"/>
                               </button>
                               <button onClick={() => handleDeleteCatAttempt(c.id)} className="p-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" title="Eliminar y Migrar">
                                   <Trash2 className="w-4 h-4"/>
                               </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>

        {deleteCatToMove && (
            <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative ring-1 ring-black/5">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 flex items-center justify-center"><Layers className="w-6 h-6"/></div>
                      <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white">Migración Requerida</h3>
                          <p className="text-sm font-bold text-slate-500">La familia posee artículos vinculados</p>
                      </div>
                   </div>
                   
                   <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-2xl border border-amber-200/50 mb-6 font-medium text-amber-800 dark:text-amber-200/70 text-sm">
                       Para salvaguardar la integridad de la base de datos, debes seleccionar un <b>Agrupador de Destino</b>. Todos los artículos que estaban categorizados bajo "{categorias.find(c=>c.id === deleteCatToMove)?.nombre}" serán movidos a esta nueva categoría de forma automática antes de borrarla de forma definitiva.
                   </div>

                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Nueva Familia de Destino</label>
                   <select className="input-nexus w-full mb-6 font-bold" value={transferTargetId} onChange={(e) => setTransferTargetId(e.target.value)}>
                       <option value="">Selecciona dónde alojar los artículos...</option>
                       {categorias.filter(c => c.id !== deleteCatToMove).map(c => (
                           <option key={c.id} value={c.id}>{c.nombre}</option>
                       ))}
                   </select>

                   <div className="flex justify-end gap-3">
                       <button onClick={() => { setDeleteCatToMove(null); setTransferTargetId(''); }} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancelar</button>
                       <button onClick={executeCatTransferAndDelete} className="px-6 py-3 rounded-xl font-black bg-amber-500 hover:bg-amber-600 text-white shadow-lg shadow-amber-500/30 transition-transform hover:scale-105">Proceder Atómicamente</button>
                   </div>
               </div>
            </div>
        )}
        </>
      )}

      {activeTab === 'titulos_base' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Network className="w-5 h-5 text-blue-500"/> Nuevo Producto Maestro</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold">Crea el nombre matriz de tu artículo (Ej. "Short").</p>
                
                <form className="space-y-5" onSubmit={saveProductoMaestro}>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Código Base (Auto)</label>
                        <div className="input-nexus w-full bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 font-black tracking-widest flex items-center h-[46px] select-all cursor-not-allowed">
                            {pmSKU || '...' }
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre Físico Principal</label>
                        <input className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold" required value={pmNombre} onChange={e=>setPmNombre(e.target.value)} placeholder="Ej: Pantalón Chino Verano" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Unidad de Medida</label>
                        <select className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold h-[46px]" required value={pmUnidad} onChange={e=>setPmUnidad(e.target.value)}>
                            <option value="ud">Unidades (ud)</option>
                            <option value="kg">Kilogramos (kg)</option>
                            <option value="mts">Metros (mts)</option>
                            <option value="lts">Litros (lts)</option>
                            <option value="paquetes">Paquetes</option>
                            <option value="cajas">Cajas</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Familia</label>
                        <button 
                            type="button" 
                            onClick={() => setIsCatModalOpen(true)}
                            className="input-nexus w-full flex items-center justify-between bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-left h-[46px]"
                        >
                            <span className={pmCatId ? "font-bold text-slate-800 dark:text-slate-200" : "text-slate-400 font-bold"}>
                                {pmCatId ? categorias.find(c => c.id.toString() === pmCatId)?.nombre : "Seleccionar familia..."}
                            </span>
                            <Settings className="w-4 h-4 text-slate-400" />
                        </button>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Comportamiento Logístico WMS</label>
                        <select className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold h-[46px]" value={pmTipoGestion} onChange={e=>setPmTipoGestion(e.target.value)}>
                            <option value="granel">Agrupado (Granel general)</option>
                            <option value="lote_individual">Lotes Únicos (Ej. Rollos serializados)</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        {editProdId && <button type="button" onClick={cancelEditPM} className="btn-secondary w-full py-3.5 mt-2 font-black">Cancelar</button>}
                        <button type="submit" className="btn-primary w-full py-3.5 mt-2 font-black">{editProdId ? 'Guardar Cambios' : 'Registrar Artículo Matriz'}</button>
                    </div>
                </form>
            </div>
            
            <div className="lg:col-span-7 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white shrink-0">Productos Creados</h3>
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Buscar maestro o SKU..." 
                            className="input-nexus w-full pl-9 h-10 text-sm bg-slate-50 dark:bg-slate-950" 
                            value={pmSearchQuery} 
                            onChange={(e) => setPmSearchQuery(e.target.value)} 
                        />
                    </div>
                </div>

                <div className="flex-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 space-y-6">
                    {(() => {
                        const isSearching = pmSearchQuery.trim() !== '';
                        const filtered = productos.filter(p => isSearching ? (p.nombre.toLowerCase().includes(pmSearchQuery.toLowerCase()) || p.sku.toLowerCase().includes(pmSearchQuery.toLowerCase())) : true);
                        
                        const grouped = filtered.reduce((acc, p) => {
                            const cat = p.cat_nombre || 'Sin Familia';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(p);
                            return acc;
                        }, {} as Record<string, any[]>);

                        if(Object.keys(grouped).length === 0) return <div className="text-center py-10 font-bold text-slate-400">No se encontraron artículos.</div>;

                        if (!isSearching && !pmSelectedCategory) {
                            return (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {Object.keys(grouped).sort().map(cat => (
                                        <button 
                                            key={cat} 
                                            onClick={() => setPmSelectedCategory(cat)}
                                            className="p-5 border border-slate-200 dark:border-slate-800 bg-slate-50 hover:bg-white dark:bg-slate-900 shadow-sm rounded-2xl flex flex-col items-center justify-center gap-3 transition-all hover:border-blue-300 hover:shadow-md group text-center"
                                        >
                                            <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Folder className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-sm text-slate-800 dark:text-slate-200">{cat}</h4>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{grouped[cat].length} Maestros</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            );
                        }

                        let categoriesToRender = Object.keys(grouped).sort();
                        if (!isSearching && pmSelectedCategory) {
                             categoriesToRender = categoriesToRender.filter(c => c === pmSelectedCategory);
                        }

                        return (
                           <div className="space-y-6">
                              {!isSearching && pmSelectedCategory && (
                                  <button 
                                     onClick={() => setPmSelectedCategory(null)}
                                     className="flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 px-4 py-2 rounded-lg transition-colors w-fit"
                                  >
                                      <ArrowLeft className="w-4 h-4" /> Volver a Familias
                                  </button>
                              )}
                              
                              {categoriesToRender.map(cat => (
                                 <div key={cat} className="space-y-3">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                        <span className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></span>
                                        {cat}
                                        <span className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></span>
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {grouped[cat].map(p => (
                                            <div key={p.id} className="p-4 border border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 rounded-xl flex flex-col hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors relative group">
                                                
                                                <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                    <button onClick={() => deleteProductoMaestro(p.id)} className="bg-white dark:bg-slate-900 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Eliminar Maestro">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => {
                                                        setEditProdId(p.id.toString());
                                                        setPmNombre(p.nombre);
                                                        setPmCatId(p.categoria_id?.toString() || '');
                                                        setPmUnidad(p.unidad_base || 'ud');
                                                        setPmTipoGestion(p.tipo_gestion || 'granel');
                                                        setPmSKU(p.sku);
                                                    }} className="bg-white dark:bg-slate-900 p-1.5 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm hover:text-blue-500 transition-colors">
                                                        <Settings className="w-4 h-4" />
                                                    </button>
                                                </div>

                                                <span className="font-black text-sm text-slate-900 dark:text-slate-200 mb-2 pr-8 leading-tight">{p.nombre}</span>
                                                <div className="flex items-center justify-between mt-auto">
                                                    <span className="text-[10px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-md font-black text-slate-500 dark:text-slate-400 tracking-widest">{p.sku}</span>
                                                    <span className={cn("text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border", p.tipo_gestion === 'lote_individual' ? "bg-amber-50 text-amber-600 border-amber-200" : "bg-blue-50 text-blue-600 border-blue-200")}>
                                                        {p.tipo_gestion === 'lote_individual' ? 'Lotes Ui' : 'Granel'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                 </div>
                              ))}
                           </div>
                        );
                    })()}
                </div>
            </div>
        </motion.div>
      )}

      {activeTab === 'rendimientos' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-green-500"/> Conversor Kg a Metros</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold">Asigna cuántos gramos pesa 1 metro lineal de cada producto base.</p>
                
                <form className="space-y-5" onSubmit={saveRendimiento}>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Producto Maestro (Rollo/Tela)</label>
                        <select className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold h-[46px]" required value={rendProdId} onChange={e=>setRendProdId(e.target.value)}>
                            <option value="">Selecciona un producto matriz...</option>
                            {productos.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Peso Bruto (Gramos x Metro Lineal)</label>
                        <input type="number" step="0.01" className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold" required value={rendGramos} onChange={e=>setRendGramos(e.target.value)} placeholder="Ej: 150" />
                    </div>
                    <button type="submit" className="btn-primary w-full py-3.5 mt-2 font-black !bg-green-600 hover:!bg-green-700">Guardar Rendimiento</button>
                </form>
            </div>
            
            <div className="lg:col-span-7 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Equivalencias de Rinde Registradas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
                    {equivalencias.map((e, idx) => (
                        <div key={idx} className="p-4 border border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950 rounded-xl flex flex-col hover:border-green-200 dark:hover:border-green-900/50 transition-colors relative group">
                            
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button onClick={() => { 
                                   setRendProdId(e.producto_maestro_id?.toString() || ''); 
                                   setRendGramos(e.gramos_por_metro_lineal?.toString() || ''); 
                               }} className="p-2 bg-white dark:bg-slate-900 text-slate-400 hover:text-green-600 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700" title="Editar Rendimiento">
                                   <Edit3 className="w-4 h-4"/>
                               </button>
                            </div>

                            <span className="font-black text-sm text-slate-900 dark:text-slate-200 mb-2 pr-8">{e.producto_nombre}</span>
                            <div className="flex items-center justify-between mt-auto">
                                <span className="text-xs text-green-600 dark:text-green-400 font-black tracking-widest">≈ {e.gramos_por_metro_lineal} g / Mts</span>
                            </div>
                        </div>
                    ))}
                    {equivalencias.length === 0 && (
                        <div className="col-span-2 p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-bold">
                            No hay rendimientos configurados.
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
      )}

      {activeTab === 'diccionario' && (

        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-4 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-28">
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2"><Settings className="w-5 h-5 text-indigo-500"/> Diccionario Maestro</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold">Crea las opciones maestras (Talle, Color) que usarás en el paso 3.</p>
                
                {/* Formulario rápido para categoría base */}
                <form className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6" onSubmit={async (e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('nuevoRasgo') as HTMLInputElement;
                    const nm = input.value.trim();
                    if(nm && !atributosBase.find(ab => ab.nombre.toLowerCase() === nm.toLowerCase())) {
                        try {
                            const data = await executeAWSQuery(`INSERT INTO wms_atributos_base (nombre) OUTPUT inserted.* VALUES ('${nm}')`);
                            if(data && data.length > 0) {
                                setAtributosBase(prev => [...prev, data[0]]);
                                toast.success("Categoría matriz registrada");
                                input.value = '';
                            }
                        } catch (err) { toast.error("Error creando"); }
                    } else if (nm) {
                        toast.error("El rasgo ya existe.");
                    }
                }}>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Nueva Categoría de Rasgo</label>
                        <input name="nuevoRasgo" className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold h-12" required placeholder="Ej: Color, Talle, Tamaño..." />
                    </div>
                    <button type="submit" className="btn-primary w-full py-3 mt-2 font-black">Crear Categoría</button>
                </form>
                
                <form className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6 mt-6" onSubmit={async (e) => {
                    e.preventDefault();
                    const input = e.currentTarget.elements.namedItem('nuevaUnidad') as HTMLInputElement;
                    const nm = input.value.trim().toLowerCase();
                    if(nm && !unidadesMedida.find(u => u.nombre.toLowerCase() === nm)) {
                        try {
                            const data = await executeAWSQuery(`INSERT INTO wms_unidades_medida (nombre) OUTPUT inserted.* VALUES ('${nm}')`);
                            if(data && data.length > 0) {
                                setUnidadesMedida(prev => [...prev, data[0]]);
                                toast.success("Unidad registrada");
                                input.value = '';
                            }
                        } catch (err) { toast.error("Error creando unidad"); }
                    } else if (nm) {
                        toast.error("La unidad ya existe.");
                    }
                }}>
                    <div>
                        <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Unidades de Medida</label>
                        <input name="nuevaUnidad" className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold h-12" required placeholder="Ej: kg, litros, cajas..." />
                    </div>
                    <button type="submit" className="btn-primary w-full py-3 mt-2 font-black">Agregar Unidad</button>
                </form>
                
                <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-6">
                    <label className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">Unidades Activas</label>
                    <div className="flex flex-wrap gap-2">
                        {unidadesMedida.map(u => (
                            <span key={u.id} className="text-[10px] font-black uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2.5 py-1.5 rounded flex items-center gap-1 border border-emerald-100 dark:border-emerald-800/30">
                                <span className="cursor-pointer hover:underline" onClick={() => renameUnidad(u.id, u.nombre)}>{u.nombre}</span>
                                <button type="button" onClick={async() => {
                                    try {
                                        await executeAWSQuery(`DELETE FROM wms_unidades_medida WHERE id = ${u.id}`);
                                        setUnidadesMedida(prev => prev.filter(x => x.id !== u.id));
                                    } catch(e) { toast.error("Error al eliminar"); }
                                }} className="text-emerald-500/50 hover:text-red-500 ml-1 transition-colors">&times;</button>
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="lg:col-span-8 space-y-6">
                <div className="card-nexus p-8 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 shadow-inner min-h-[400px]">
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 border-b border-slate-200 dark:border-slate-700/50 pb-4">Estructuras Registradas</h3>
                    {atributosBase.length === 0 ? (
                         <div className="flex h-32 items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-950/30">
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">No hay diccionarios registrados.</p>
                         </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            {atributosBase.map(ab => (
                                <div key={ab.id} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col hover:border-indigo-300 dark:hover:border-indigo-900/60 transition-all">
                                    <div className="px-4 py-3 bg-indigo-50/50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30 flex justify-between items-center group/cat">
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-indigo-900 dark:text-indigo-400 text-sm">{ab.nombre}</span>
                                            <button onClick={() => renameAtributo(ab.id, ab.nombre)} className="opacity-0 group-hover/cat:opacity-100 text-indigo-400 hover:text-indigo-600 transition-opacity" title="Editar nombre de categoría"><Edit3 className="w-3.5 h-3.5"/></button>
                                        </div>
                                        <button onClick={() => deleteAtributoBase(ab.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Eliminar categoría entera">&times;</button>
                                    </div>
                                    <div className="p-4 flex-1">
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {valoresBase.filter(vb => vb.atributo_id === ab.id).map(vb => (
                                                <span key={vb.id} className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md flex items-center gap-1 group/val">
                                                    {vb.valor}
                                                    <button onClick={() => renameValor(vb.id, vb.valor)} className="opacity-0 group-hover/val:opacity-100 text-slate-400 hover:text-indigo-500 ml-1 transition-opacity"><Edit3 className="w-3 h-3"/></button>
                                                    <button onClick={() => deleteValorBase(vb.id)} className="text-slate-400 hover:text-red-500 ml-1">&times;</button>
                                                </span>
                                            ))}
                                            {valoresBase.filter(vb => vb.atributo_id === ab.id).length === 0 && (
                                                <span className="text-[10px] text-slate-400 font-bold">Sin valores asignados.</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800">
                                        <input 
                                            placeholder="+ Ingresar valor y presionar Enter" 
                                            onKeyDown={async(e) => {
                                                if(e.key === 'Enter') {
                                                    e.preventDefault();
                                                    const input = e.currentTarget;
                                                    const val = input.value.trim();
                                                    if(val && !valoresBase.find(v => v.atributo_id === ab.id && v.valor.toLowerCase() === val.toLowerCase())) {
                                                        try {
                                                            const data = await executeAWSQuery(`INSERT INTO wms_atributos_valores_base (atributo_id, valor) OUTPUT inserted.* VALUES (${ab.id}, '${val}')`);
                                                            if(data && data.length > 0) setValoresBase(prev => [...prev, data[0]]);
                                                            input.value = '';
                                                        } catch (e) { toast.error("Error insertando valor"); }
                                                    }
                                                }
                                            }}
                                            className="w-full text-xs font-bold bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 py-1.5 px-3 rounded-md outline-none focus:border-indigo-500" 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
      )}

      {activeTab === 'modelos' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full space-y-6">
            
            {/* Toolbar Superior: Setup Compacto */}
            <div className="card-nexus p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-6 items-center w-full">
                <div className="flex items-center gap-3 w-full xl:w-auto xl:border-r border-slate-200 dark:border-slate-800 xl:pr-6">
                    <Box className="w-8 h-8 text-blue-500 hidden sm:block"/>
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">Generador Maestro</h3>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Configuración de Matriz</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 w-full items-start mt-6">
                    <div className="xl:col-span-5">
                        <label className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest block mb-2">1. Seleccionar Artículo Base</label>
                        <button 
                            type="button" 
                            onClick={() => setIsProdModalOpen(true)}
                            className="input-nexus w-full flex items-center justify-between border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-left h-[42px] px-4"
                        >
                            <span className={varProdIds.length > 0 ? "font-black text-blue-700 dark:text-blue-400 text-sm truncate" : "text-slate-400 font-bold text-sm"}>
                                {varProdIds.length > 0 ? productos.find(p => p.id.toString() === varProdIds[0])?.nombre : "Buscar..."}
                            </span>
                            <Network className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        </button>
                    </div>

                    <div className="xl:col-span-7 flex flex-col h-full border-l border-transparent xl:border-slate-200 dark:xl:border-slate-800 xl:pl-8">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 transition-colors duration-300" style={{ color: varProdIds.length > 0 ? 'inherit' : '' }}>2. Categoría de Rasgo (Ej. Talle, Color)</label>
                        
                        <div className="flex gap-2">
                             <input 
                                disabled={varProdIds.length === 0}
                                value={nuevoAtributo} 
                                onChange={e=>setNuevoAtributo(e.target.value)} 
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') {
                                        e.preventDefault();
                                        handleAddAtributo(nuevoAtributo);
                                    }
                                }} 
                                placeholder={varProdIds.length > 0 ? "Escribe un nuevo rasgo y presiona Enter..." : "Bloqueado"} 
                                className="input-nexus flex-1 h-[42px] px-4 text-sm disabled:opacity-50" 
                             />
                             <button disabled={varProdIds.length === 0 || !nuevoAtributo.trim()} type="button" onClick={() => handleAddAtributo(nuevoAtributo)} className="btn-primary px-6 shadow-sm font-black text-xs disabled:opacity-50 h-[42px]">
                                Añadir
                             </button>
                        </div>

                        {varProdIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                                <span className="w-full text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5"><Box className="w-3.5 h-3.5" /> Rasgos Guardados en Memoria:</span>
                                {atributosBase.filter(ab => !atributos.find(a => a.nombre.toLowerCase() === ab.nombre.toLowerCase())).map(ab => (
                                    <button 
                                        key={ab.id}
                                        type="button"
                                        onClick={() => handleAddAtributo(ab.nombre)}
                                        className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-black uppercase tracking-widest rounded-lg transition-colors border border-slate-200 dark:border-slate-700 shadow-sm"
                                    >
                                        + {ab.nombre}
                                    </button>
                                ))}
                                {atributosBase.length === 0 && <span className="text-xs text-slate-400 font-medium italic">No hay rasgos en BD aún.</span>}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Espacio de Trabajo Principal (Ancho Completo) */}
            {varProdIds.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full">
                
                {/* Panel Izquierdo: Carga de Valores */}
                <div className="xl:col-span-5 card-nexus p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm h-fit">
                    <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">3. Llenar Valores (Matriz)</h4>
                    
                    {atributos.length === 0 ? (
                        <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950/30">
                            <p className="text-slate-400 font-bold text-xs text-center px-4">Añade Categorías de Rasgos en el paso 2 para comenzar a definir valores. Nota: Puedes administrar tu diccionario de rasgos desde la pestaña 2.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {atributos.map((a, i) => {
                                const baseAttr = atributosBase.find(ab => ab.nombre.toLowerCase() === a.nombre.toLowerCase());
                                const opciones = baseAttr ? valoresBase.filter(vb => vb.atributo_id === baseAttr.id) : [];
                                const opcionesDisponibles = opciones.filter(o => !a.valores.includes(o.valor));

                                return (
                                <div key={i} className="border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 rounded-xl p-4 shadow-sm">
                                    <div className="flex justify-between items-center mb-4">
                                        <span className="font-black text-[11px] uppercase tracking-widest bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-1 rounded">{a.nombre}</span>
                                        <button title="Quitar Rasgo" onClick={()=>setAtributos(atributos.filter((_,idx)=>idx!==i))} className="text-slate-400 hover:text-red-500 font-bold p-1">&times;</button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-4 min-h-[32px]">
                                        {a.valores.map((v,k) => (
                                            <span key={k} className="text-xs font-black bg-blue-600 text-white px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
                                                {v} 
                                                <button onClick={()=>{
                                                    const na = [...atributos]; na[i].valores = na[i].valores.filter((_,idx)=>idx!==k); setAtributos(na);
                                                }} className="text-blue-200 hover:text-white">&times;</button>
                                            </span>
                                        ))}
                                    </div>
                                    
                                    <input 
                                        type="text" 
                                        placeholder="+ Nuevo Valor y Enter (Ej: XL)" 
                                        onKeyDown={(e) => {
                                            if(e.key==='Enter') {
                                                e.preventDefault();
                                                handleAddValor(i, e.currentTarget.value);
                                                e.currentTarget.value = '';
                                            }
                                        }} 
                                        className="w-full text-xs font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2.5 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all" 
                                    />
                                    
                                    {opcionesDisponibles.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5"><Box className="w-3 h-3"/> Valores Guardados:</p>
                                            <div className="flex flex-wrap gap-2">
                                                {opcionesDisponibles.map(o => (
                                                    <button 
                                                        key={o.id}
                                                        onClick={() => handleAddValor(i, o.valor)}
                                                        className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 text-[11px] font-black uppercase tracking-widest rounded-lg shadow-sm transition-colors"
                                                    >
                                                        + {o.valor}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )})}
                        </div>
                    )}
                </div>

                {/* Panel Derecho: Vista de Resultados y Generación */}
                <div className="xl:col-span-7 card-nexus p-6 bg-slate-50 border border-slate-200 dark:bg-slate-900/50 dark:border-slate-800 shadow-inner flex flex-col">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
                        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2 border-b border-transparent">
                            Nuevas Combinaciones a Generar ({variantesGeneradas.filter(v=>v.activa).length})
                        </h4>
                        {variantesGeneradas.length > 0 && (
                            <button disabled={isSaving || variantesGeneradas.filter(v=>v.activa).length === 0} type="button" onClick={createVariantesMasivas} className="btn-primary px-6 py-2.5 shadow-sm font-black text-xs disabled:opacity-50 whitespace-nowrap">
                                Guardar {variantesGeneradas.filter(v=>v.activa).length} Combinaciones
                            </button>
                        )}
                    </div>
                    
                    {variantesGeneradas.length > 0 && (
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col mb-8">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 grid grid-cols-[auto_1fr_auto] gap-4 items-center border-b border-blue-100 dark:border-blue-800">
                                <span className="text-[10px] uppercase font-black text-blue-600 w-5 text-center">Inc</span>
                                <span className="text-[10px] uppercase font-black text-blue-600">Nuevas Combinaciones sugeridas por Matriz</span>
                                <span className="text-[10px] uppercase font-black text-blue-600">Cód. sugerido</span>
                            </div>
                            <div className="overflow-y-auto max-h-[350px] custom-scrollbar p-2 space-y-1">
                                {variantesGeneradas.map((vg, i) => (
                                    <div key={i} className={cn("grid grid-cols-[auto_1fr_auto] gap-4 items-center p-2.5 rounded-lg border transition-all", vg.activa ? "bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900" : "bg-slate-50/50 dark:bg-slate-900/30 border-transparent opacity-40")}>
                                        <div className="flex items-center justify-center w-5">
                                            <input type="checkbox" checked={vg.activa} disabled={vg.yaExiste} onChange={(e)=>{
                                                const ng = [...variantesGeneradas]; ng[i].activa = e.target.checked; setVariantesGeneradas(ng);
                                            }} className="w-4 h-4 cursor-pointer accent-blue-600 rounded" />
                                        </div>
                                        <div className="flex flex-col truncate pr-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{vg.prodNombre}</span>
                                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                                                {vg.nombre} {vg.yaExiste && <span className="ml-2 text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-black border border-amber-200">[YA EXISTE]</span>}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-black px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded cursor-copy" title="Doble clic para copiar" onDoubleClick={() => navigator.clipboard.writeText(vg.sku)}>{vg.sku}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* SECCIÓN DE VARIANTES EXISTENTES */}
                    {varProdIds.length > 0 && (
                        <div className="flex-1 flex flex-col min-h-0">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <Box className="w-3 h-3"/> Modelos actuales en Sistema ({variantes.filter(v => varProdIds.includes(v.producto_maestro_id.toString())).length})
                                </h5>
                            </div>
                            <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm flex flex-col">
                                <div className="bg-slate-100 dark:bg-slate-800 p-3 grid grid-cols-[1fr_auto_auto] gap-4 items-center border-b border-slate-200 dark:border-slate-700">
                                    <span className="text-[10px] uppercase font-black text-slate-500">Nombre de Variante</span>
                                    <span className="text-[10px] uppercase font-black text-slate-500">Código</span>
                                    <span className="text-[10px] uppercase font-black text-slate-500 w-10 text-center">Acción</span>
                                </div>
                                <div className="overflow-y-auto max-h-[400px] custom-scrollbar p-2 space-y-1">
                                    {variantes.filter(v => varProdIds.includes(v.producto_maestro_id.toString())).length === 0 ? (
                                        <div className="py-8 text-center text-slate-400 text-xs font-bold italic">No hay modelos creados aún para este artículo.</div>
                                    ) : (
                                        variantes.filter(v => varProdIds.includes(v.producto_maestro_id.toString())).map((v, i) => (
                                            <div key={v.id} className="grid grid-cols-[1fr_auto_auto] gap-4 items-center p-2.5 rounded-lg border border-slate-50 dark:border-slate-800/50 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all group">
                                                <div className="flex flex-col min-w-0">
                                                    {varProdIds.length > 1 && <span className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">{v.prod_nombre}</span>}
                                                    <input 
                                                        className="font-bold text-xs bg-transparent border-none p-0 focus:ring-0 text-slate-800 dark:text-slate-200 w-full"
                                                        defaultValue={v.nombre_variante}
                                                        onBlur={(e) => {
                                                            if(e.target.value !== v.nombre_variante) updateVarianteInline(v.id, e.target.value, v.codigo_variante);
                                                        }}
                                                    />
                                                </div>
                                                <input 
                                                    className="text-[10px] font-black px-2 py-1 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded border-none focus:ring-0 text-right w-32"
                                                    defaultValue={v.codigo_variante}
                                                    onBlur={(e) => {
                                                        if(e.target.value !== v.codigo_variante) updateVarianteInline(v.id, v.nombre_variante, e.target.value);
                                                    }}
                                                />
                                                <div className="flex items-center justify-center w-10">
                                                    <button 
                                                        onClick={() => deleteVariante(v)}
                                                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                        title="Eliminar Variante"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            ) : (
                <div className="flex-1 w-full" /> 
            )}
        </motion.div>
      )}

      <ModalSelector
        title="Selecciona la Familia"
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        selectedValue={pmCatId}
        onSelect={setPmCatId}
        options={categorias.map(c => ({ value: c.id.toString(), label: c.nombre, icon: Settings }))}
      />

      <CategoryDrillDownModal
        title="Selecciona un Artículo"
        isOpen={isProdModalOpen}
        onClose={() => setIsProdModalOpen(false)}
        categorias={categorias}
        productos={productos}
        selectedValue="" multiSelect={true} onSelectMultiple={setVarProdIds} activeItemIds={varProdIds}
        onSelect={() => {}}
      />

      <IconSelectorModal
        isOpen={isIconModalOpen}
        onClose={() => setIsIconModalOpen(false)}
        onSelect={setStepIcon}
        currentIcon={stepIcon}
      />

      {activeTab === 'tipos_facturas' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2"><FileText className="w-5 h-5 text-emerald-500"/> Tipos de Comprobantes</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 font-bold">Gestión de tipos de facturas y comprobantes para el sistema.</p>
          <div className="flex-1 min-h-[300px] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
             <p className="text-slate-400 font-bold text-xs">Módulo en construcción.</p>
          </div>
        </motion.div>
      )}
              {activeTab === 'usuarios' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full">
              <GestionUsuarios />
          </motion.div>
        )}

        {activeTab === 'historicos' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full">
              <GestionHistoricos />
          </motion.div>
        )}

        {activeTab === 'alertas_stock' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full">
              <GestionAlertasStock />
          </motion.div>
        )}

        {activeTab === 'costos_cero' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full">
              <GestionCostosCero />
          </motion.div>
        )}

        {activeTab === 'plantillas_progreso' && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-8">
              
              {/* CREADOR / EDITOR DE PLANTILLA */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* COLUMNA IZQUIERDA: CONFIGURACIÓN Y BOTONERA */}
                  <div className="lg:col-span-6 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative space-y-6">
                      {selectedPlantillaId && (
                         <div className="absolute top-6 right-6">
                            <button type="button" onClick={() => { setSelectedPlantillaId(null); setPlatName(''); setPlatDesc(''); setPlatSteps([]); }} className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-100 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer">Cancelar Edición</button>
                         </div>
                      )}

                      <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                              <Workflow className="w-5 h-5 text-indigo-500"/> 
                              {selectedPlantillaId ? 'Editar Plantilla' : 'Nueva Plantilla de Progreso'}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold">Configura el nombre y selecciona las etapas logísticas presionando sobre ellas.</p>
                      </div>

                      {/* Header Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Nombre de la Plantilla *</label>
                              <input type="text" className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold" required value={platName} onChange={e=>setPlatName(e.target.value)} placeholder="Ej: Aéreo Express, Marítimo Estándar..." />
                          </div>
                          <div>
                              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1.5 block">Descripción</label>
                              <input type="text" className="input-nexus w-full bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold" value={platDesc} onChange={e=>setPlatDesc(e.target.value)} placeholder="Ej: Usar para compras aéreas..." />
                          </div>
                      </div>

                      {/* Botonera de Selección Rápida */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                          <h4 className="font-black text-xs text-indigo-600 uppercase tracking-widest">Seleccionar Etapas Rápidas</h4>
                          <p className="text-[10px] text-slate-400 font-bold">Presiona sobre las etapas en el orden que desees para añadirlas al flujo.</p>
                          
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                              {PREDEFINED_STEPS.map((step) => {
                                  const IconComponent = (LucideIcons as any)[step.icon] || LucideIcons.Package;
                                  const isAlreadyAdded = platSteps.some(s => s.etiqueta === step.label);
                                  return (
                                      <button
                                          key={step.key}
                                          type="button"
                                          disabled={isAlreadyAdded}
                                          onClick={() => {
                                              if (isAlreadyAdded) return;
                                              const newStep = {
                                                  clave: '',
                                                  etiqueta: step.label,
                                                  icono: step.icon,
                                                  tempId: `temp-${Math.random()}-${Date.now()}`
                                              };
                                              setPlatSteps(prev => {
                                                  const next = [...prev, newStep];
                                                  return next.map((s, idx) => ({ ...s, clave: (idx + 1).toString() }));
                                              });
                                          }}
                                          className={cn(
                                              "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all group relative cursor-pointer",
                                              isAlreadyAdded 
                                                  ? "bg-slate-50 dark:bg-slate-900 border-slate-150 dark:border-slate-800 opacity-40 cursor-not-allowed" 
                                                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-400 hover:bg-indigo-50/20 dark:hover:bg-indigo-950/20 active:scale-95"
                                          )}
                                      >
                                          <IconComponent className={cn("w-5 h-5 mb-1.5 transition-transform group-hover:scale-110", isAlreadyAdded ? "text-slate-400" : "text-indigo-500")} />
                                          <span className="text-[11px] font-black text-slate-700 dark:text-slate-200 leading-none">{step.label}</span>
                                      </button>
                                  );
                              })}
                          </div>
                      </div>

                      {/* Creación de Etapa Personalizada */}
                      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-4">
                          <div className="flex justify-between items-center">
                              <h4 className="font-black text-xs text-emerald-600 uppercase tracking-widest">Etapa Personalizada</h4>
                              <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded font-black">Opcional</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-3 items-end">
                              <div className="col-span-2">
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Etiqueta de Etapa *</label>
                                  <input 
                                      type="text" 
                                      className="input-nexus w-full text-xs font-bold py-2 px-3 bg-slate-50 dark:bg-slate-950" 
                                      value={stepName} 
                                      onChange={e=>setStepName(e.target.value)} 
                                      placeholder="Ej: Control de Calidad" 
                                  />
                              </div>
                              <div>
                                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Ícono</label>
                                  <button
                                      type="button"
                                      onClick={() => setIsIconModalOpen(true)}
                                      className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl transition-all font-bold text-xs cursor-pointer h-[34px]"
                                  >
                                      {React.createElement((LucideIcons as any)[stepIcon] || LucideIcons.Package, { className: "w-4 h-4 text-indigo-500" })}
                                      <span className="truncate">{stepIcon}</span>
                                  </button>
                              </div>
                          </div>
                          <button 
                              type="button" 
                              onClick={() => {
                                  if (!stepName.trim()) return toast.error("La etiqueta de la etapa es obligatoria.");
                                  
                                  const newStep = { 
                                      clave: '', 
                                      etiqueta: stepName, 
                                      icono: stepIcon,
                                      tempId: `temp-${Math.random()}-${Date.now()}`
                                  };
                                  setPlatSteps(prev => {
                                      const next = [...prev, newStep];
                                      return next.map((s, idx) => ({ ...s, clave: (idx + 1).toString() }));
                                  });
                                  setStepName('');
                                  setStepIcon('Package');
                              }}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black py-2.5 rounded-xl transition-all shadow-sm shadow-emerald-500/20 cursor-pointer flex items-center justify-center gap-1.5 h-[38px]"
                          >
                              <Plus className="w-4 h-4" /> Agregar Etapa Personalizada
                          </button>
                      </div>
                  </div>

                  {/* COLUMNA DERECHA: ORDENACIÓN DE ETAPAS */}
                  <div className="lg:col-span-6 card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between min-h-[500px]">
                      
                      <div className="space-y-4">
                          <div>
                              <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-widest">Estructura del Flujo ({platSteps.length} Pasos)</h3>
                              <p className="text-[10px] text-slate-400 font-bold mt-1">Arrastra las tarjetas para ordenar los pasos logísticos.</p>
                          </div>
                          
                          <div className="space-y-2 max-h-[350px] overflow-y-auto custom-scrollbar pr-2">
                              {platSteps.length === 0 && (
                                  <div className="py-12 text-center text-slate-400 font-medium italic border border-dashed border-slate-100 dark:border-slate-850 rounded-2xl">
                                      No has seleccionado etapas aún. Presiona los botones de la izquierda para construir el flujo.
                                  </div>
                              )}
                              {platSteps.map((step, idx) => {
                                  const IconComponent = (LucideIcons as any)[step.icono] || LucideIcons.Package;
                                  const isDragging = idx === draggedIndex;
                                  return (
                                      <div 
                                          key={step.tempId || step.clave}
                                          draggable={true}
                                          onDragStart={(e) => handleDragStartStep(e, idx)}
                                          onDragOver={(e) => handleDragOverStep(e, idx)}
                                          onDragEnd={handleDragEndStep}
                                          className={cn(
                                              "flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-955 border rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-900/60 cursor-grab active:cursor-grabbing transition-all select-none shadow-sm hover:shadow",
                                              isDragging 
                                                  ? "opacity-30 border-dashed border-indigo-500 scale-95 rotate-1 bg-indigo-50/10" 
                                                  : "border-slate-150/70 dark:border-slate-850"
                                          )}
                                      >
                                          <div className="flex items-center gap-3">
                                              <span className="text-xs font-mono font-black text-indigo-500 bg-indigo-50 dark:bg-indigo-955/40 w-6 h-6 rounded-full flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
                                                  {idx + 1}
                                              </span>
                                              <IconComponent className="w-4.5 h-4.5 text-slate-500 shrink-0" />
                                              <div className="flex flex-col">
                                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{step.etiqueta}</span>
                                                  <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest font-black">Clave: {step.clave}</span>
                                              </div>
                                          </div>
                                          <button 
                                              type="button" 
                                              onClick={() => {
                                                  setPlatSteps(prev => {
                                                      const next = prev.filter((_, i) => i !== idx);
                                                      return next.map((s, i) => ({ ...s, clave: (i + 1).toString() }));
                                                  });
                                              }} 
                                              className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-955/20 text-slate-350 hover:text-rose-500 cursor-pointer transition-colors"
                                              title="Quitar Etapa"
                                          >
                                              <Trash2 className="w-3.5 h-3.5" />
                                          </button>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                          {selectedPlantillaId ? (
                              <>
                                  <button 
                                      type="button"
                                      disabled={isSavingPlantilla}
                                      onClick={(e) => { e.preventDefault(); savePlantilla(e as any, false); }} 
                                      className="btn-primary flex-1 py-3.5 font-black !bg-indigo-600 hover:!bg-indigo-700 shadow-lg shadow-indigo-500/20 text-sm tracking-wide transition-all cursor-pointer disabled:opacity-50"
                                  >
                                      {isSavingPlantilla ? 'Guardando...' : 'Actualizar Plantilla'}
                                  </button>
                                  <button 
                                      type="button"
                                      disabled={isSavingPlantilla}
                                      onClick={(e) => { e.preventDefault(); savePlantilla(e as any, true); }} 
                                      className="btn-secondary flex-1 py-3.5 font-black bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-sm tracking-wide transition-all cursor-pointer disabled:opacity-50 border border-slate-200 dark:border-slate-700 rounded-xl"
                                  >
                                      Guardar como Nueva
                                  </button>
                              </>
                          ) : (
                              <button 
                                  type="button"
                                  disabled={isSavingPlantilla}
                                  onClick={(e) => { e.preventDefault(); savePlantilla(e as any, false); }} 
                                  className="btn-primary w-full py-3.5 font-black !bg-indigo-600 hover:!bg-indigo-700 shadow-lg shadow-indigo-500/20 text-sm tracking-wide transition-all cursor-pointer disabled:opacity-50"
                              >
                                  {isSavingPlantilla ? 'Guardando...' : 'Crear Plantilla de Progreso'}
                              </button>
                          )}
                      </div>
                  </div>
              </div>

              {/* VISTA PREVIA HORIZONTAL EN TIEMPO REAL */}
              <div className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
                  <div>
                      <h4 className="font-black text-xs text-indigo-600 uppercase tracking-widest text-center md:text-left">Vista Previa del Progreso (Formación Real)</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-1 text-center md:text-left">Así es como el usuario final visualizará la línea de tiempo en el sistema.</p>
                  </div>
                  
                  {platSteps.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 font-bold italic">Selecciona etapas arriba para previsualizar la línea de tiempo.</div>
                  ) : (
                      <div className="relative pt-4 pb-12 overflow-x-auto custom-scrollbar">
                          <div className="min-w-[700px] flex items-center justify-between px-16 relative">
                              {/* Línea horizontal trasera conectora */}
                              <div className="absolute left-[80px] right-[80px] top-6 h-1 bg-slate-200 dark:bg-slate-850 rounded-full z-0"></div>
                              {/* Línea horizontal pintada (activa hasta la mitad como demo) */}
                              <div 
                                  className="absolute left-[80px] top-6 h-1 bg-indigo-500 rounded-full z-0 transition-all duration-700"
                                  style={{ width: `calc(${Math.max(0, platSteps.length - 2) / Math.max(1, platSteps.length - 1) * 100}% - 10px)` }}
                              ></div>

                              {platSteps.map((step, idx) => {
                                  const IconComponent = (LucideIcons as any)[step.icono] || LucideIcons.Package;
                                  const isDemoActive = idx < platSteps.length - 1;
                                  const isDemoCurrent = idx === Math.max(0, platSteps.length - 2);
                                  return (
                                      <div key={step.tempId || step.clave} className="flex flex-col items-center gap-3 relative z-10 shrink-0">
                                          <div className={cn(
                                              "w-12 h-12 rounded-2xl flex items-center justify-center border-4 transition-all shadow-sm",
                                              isDemoCurrent ? "bg-indigo-50 border-indigo-500 text-indigo-600 scale-110 shadow-lg shadow-indigo-500/20" : 
                                              isDemoActive ? "bg-indigo-500 border-indigo-500 text-white" : 
                                              "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400"
                                          )}>
                                              <IconComponent className="w-5 h-5" />
                                          </div>
                                          <div className="text-center w-28 absolute top-14">
                                              <p className={cn("text-[10px] font-black uppercase tracking-wider leading-tight", isDemoCurrent ? "text-indigo-600" : isDemoActive ? "text-slate-800 dark:text-slate-200" : "text-slate-400")}>
                                                  {step.etiqueta}
                                              </p>
                                              <p className="text-[8px] font-mono text-slate-400 mt-0.5">Etapa {idx + 1}</p>
                                          </div>
                                      </div>
                                  );
                              })}
                          </div>
                      </div>
                  )}
              </div>

              {/* LISTADO DE PLANTILLAS ACTIVAS */}
              <div className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6">Plantillas Activas en el Sistema</h3>
                  <div className="space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar pr-2">
                      {plantillas.map((p, idx) => (
                          <div key={p.id || idx} className="p-5 border border-slate-105 dark:border-slate-80/60 bg-slate-50 dark:bg-slate-950 rounded-2xl flex flex-col hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-colors relative group">
                              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                  <button 
                                      onClick={() => { 
                                          setSelectedPlantillaId(p.id); 
                                          setPlatName(p.nombre); 
                                          setPlatDesc(p.descripcion || ''); 
                                          setPlatSteps(p.pasos.map((s: any) => ({ 
                                              id: s.id,
                                              clave: s.clave, 
                                              etiqueta: s.etiqueta, 
                                              icono: s.icono,
                                              tempId: s.id ? `db-${s.id}` : `temp-${Math.random()}-${Date.now()}`
                                          })));
                                      }} 
                                      className="p-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 hover:text-blue-500 rounded-lg shadow-sm cursor-pointer"
                                      title="Editar Plantilla"
                                  >
                                      <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  {p.id !== 1 && (
                                      <button 
                                          onClick={() => deletePlantilla(p.id)} 
                                          className="p-1.5 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800 hover:text-red-500 rounded-lg shadow-sm cursor-pointer"
                                          title="Eliminar Plantilla"
                                      >
                                          <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                  )}
                              </div>

                              <div>
                                  <h4 className="font-black text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
                                      <Workflow className="w-4 h-4 text-indigo-500" />
                                      {p.nombre}
                                      {p.id === 1 && <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-black border border-slate-300 dark:border-slate-700">[NATIVO]</span>}
                                  </h4>
                                  {p.descripcion && <p className="text-xs text-slate-400 font-medium mt-1 pr-16">{p.descripcion}</p>}
                              </div>

                              {/* Timeline mini-trazabilidad */}
                              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-900 flex items-center flex-wrap gap-2">
                                  {p.pasos.map((s: any, sIdx: number) => {
                                      const miniIcon = (LucideIcons as any)[s.icono] || LucideIcons.Package;
                                      return (
                                          <div key={s.id || sIdx} className="flex items-center gap-1">
                                              <span className="text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 flex items-center gap-1.5 shadow-sm">
                                                  {React.createElement(miniIcon, { className: "w-3 h-3 text-indigo-500 shrink-0" })}
                                                  {s.etiqueta}
                                              </span>
                                              {sIdx < p.pasos.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300 animate-pulse" />}
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      ))}
                      {plantillas.length === 0 && (
                          <div className="py-12 text-center text-slate-400 font-bold italic">No hay plantillas de progreso configuradas en el sistema.</div>
                      )}
                  </div>
              </div>
          </motion.div>
        )}


        {deleteVarToMove && (
            <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4">
               <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-xl w-full shadow-2xl border border-slate-100 dark:border-slate-800 relative ring-1 ring-black/5">
                   <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400 flex items-center justify-center"><AlertCircle className="w-6 h-6"/></div>
                      <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-white">Eliminación Bloqueada</h3>
                          <p className="text-sm font-bold text-slate-500">La variante "{deleteVarToMove.nombre_variante}" posee vínculos en la base de datos.</p>
                      </div>
                   </div>
                   
                   <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50 mb-6 font-medium text-slate-700 dark:text-slate-300 text-sm space-y-2">
                       <p className="font-bold border-b border-slate-200 dark:border-slate-700 pb-2 mb-2">Se encontraron los siguientes registros:</p>
                       <ul className="list-disc pl-5 space-y-1 text-xs">
                           {varDependencies?.stock_count > 0 && <li><b>{varDependencies.stock_count}</b> Etiquetas de Stock Físico (Bultos / Lotes / Granel)</li>}
                           {varDependencies?.compras_count > 0 && <li><b>{varDependencies.compras_count}</b> Registros en Órdenes de Compra</li>}
                           {varDependencies?.remitos_count > 0 && <li><b>{varDependencies.remitos_count}</b> Registros en Traslados/Remitos Internos</li>}
                           {varDependencies?.sol_count > 0 && <li><b>{varDependencies.sol_count}</b> Registros en Solicitudes de Insumos</li>}
                           {varDependencies?.consumo_count > 0 && <li><b>{varDependencies.consumo_count}</b> Registros de Consumo Histórico</li>}
                       </ul>
                   </div>

                   <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 block">OPCIÓN 1: Migrar registros (Recomendado)</label>
                   <select className="input-nexus w-full mb-6 font-bold" value={transferVarTargetId} onChange={(e) => setTransferVarTargetId(e.target.value)}>
                       <option value="">Selecciona el nuevo Artículo/Variante que heredará estos datos...</option>
                       {variantes.filter(v => v.id !== deleteVarToMove.id).map(v => (
                           <option key={v.id} value={v.id}>{getVisualName(v.categoria_nombre, v.prod_nombre, v.nombre_variante)}</option>
                       ))}
                   </select>

                   <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 mt-2">
                       <button onClick={() => { setDeleteVarToMove(null); setTransferVarTargetId(''); setVarDependencies(null); }} className="px-6 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors">Cancelar</button>
                       <button onClick={() => executeVarTransferOrDelete('delete')} className="px-4 py-3 rounded-xl font-black bg-rose-100 text-rose-700 hover:bg-rose-200 shadow-sm transition-colors text-xs" title="Esto eliminará todo el stock, compras y remitos asociados a esta variante">Eliminar TODO (Cascada)</button>
                       <button onClick={() => executeVarTransferOrDelete('migrate')} className="px-6 py-3 rounded-xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 transition-transform hover:scale-105">Migrar Registros</button>
                   </div>
               </div>
            </div>
        )}

</div>
  );
}


// ==========================================
// SUB-COMPONENTE: SELECTOR DE ICONOS MODAL
// ==========================================

interface IconSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (iconName: string) => void;
    currentIcon: string;
}

function IconSelectorModal({ isOpen, onClose, onSelect, currentIcon }: IconSelectorModalProps) {
    const [search, setSearch] = useState('');
    
    if (!isOpen) return null;
    
    const filteredIcons = ALL_LUCIDE_ICONS.filter(name => 
        name.toLowerCase().includes(search.toLowerCase())
    );
    
    const visibleIcons = filteredIcons.slice(0, 200);
    
    return (
        <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[80vh] ring-1 ring-black/5">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white">Seleccionar Ícono</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Elige entre más de mil íconos de Lucide</p>
                    </div>
                    <button 
                        type="button" 
                        onClick={() => { setSearch(''); onClose(); }} 
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-black hover:bg-slate-100 dark:hover:bg-slate-850 p-2 rounded-xl transition-all cursor-pointer text-xs"
                    >
                        ✕ Cerrar
                    </button>
                </div>
                
                {/* Search Box */}
                <div className="relative mb-5">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input 
                        type="text" 
                        placeholder="Buscar ícono por nombre (ej: ship, box, check)..." 
                        className="input-nexus w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-950 focus:bg-white dark:focus:bg-slate-900 font-bold"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                
                {/* Icon Grid Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-5">
                    
                    {/* Common Icons */}
                    {!search && (
                        <div className="space-y-2">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Íconos Frecuentes</h4>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {COMMON_ICONS.map(name => {
                                    const IconComponent = (LucideIcons as any)[name] || LucideIcons.Package;
                                    const isSelected = currentIcon === name;
                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => {
                                                onSelect(name);
                                                setSearch('');
                                                onClose();
                                            }}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer group hover:scale-105 active:scale-95",
                                                isSelected 
                                                    ? "bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900" 
                                                    : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-850 hover:border-indigo-400 dark:hover:border-indigo-900/60"
                                            )}
                                        >
                                            <IconComponent className={cn("w-5 h-5 mb-1 group-hover:scale-110 transition-transform", isSelected ? "text-indigo-600" : "text-slate-500 dark:text-slate-400")} />
                                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-full leading-none">{name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {/* General Grid */}
                    <div className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {search ? `Resultados de búsqueda (${filteredIcons.length})` : 'Todos los Íconos'}
                        </h4>
                        
                        {visibleIcons.length === 0 ? (
                            <p className="text-xs text-slate-400 italic text-center py-6">No se encontraron íconos con ese nombre.</p>
                        ) : (
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {visibleIcons.map(name => {
                                    const IconComponent = (LucideIcons as any)[name];
                                    if (!IconComponent) return null;
                                    const isSelected = currentIcon === name;
                                    return (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => {
                                                onSelect(name);
                                                setSearch('');
                                                onClose();
                                            }}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer group hover:scale-105 active:scale-95",
                                                isSelected 
                                                    ? "bg-indigo-50 border-indigo-500 text-indigo-600 dark:bg-indigo-950/40 dark:border-indigo-900" 
                                                    : "bg-white dark:bg-slate-900 border-slate-150 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-900/60"
                                            )}
                                        >
                                            <IconComponent className={cn("w-5 h-5 mb-1 group-hover:scale-110 transition-transform", isSelected ? "text-indigo-600" : "text-slate-500 dark:text-slate-400")} />
                                            <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-full leading-none">{name}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        
                        {filteredIcons.length > 200 && (
                            <p className="text-[10px] text-slate-400 text-center py-2">Mostrando los primeros 200 resultados. Refina tu búsqueda para encontrar más.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
