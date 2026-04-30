import React, { useState, useEffect } from 'react';
import { executeAWSQuery } from '../../lib/aws-client';
import toast from 'react-hot-toast';
import { History, Save, Search, Archive, Trash2 } from 'lucide-react';
import { CategoryDrillDownModal } from '../ui/CategoryDrillDownModal';

export function GestionHistoricos() {
    const [mes, setMes] = useState<string>((new Date().getMonth() + 1).toString());
    const [anio, setAnio] = useState<string>(new Date().getFullYear().toString());
    const [cantidad, setCantidad] = useState<string>('');
    const [varianteSelected, setVarianteSelected] = useState<any>(null);
    const [catalogCategorias, setCatalogCategorias] = useState<any[]>([]);
    const [catalogProductos, setCatalogProductos] = useState<any[]>([]);
    const [isVarianteModalOpen, setIsVarianteModalOpen] = useState(false);
    const [historyList, setHistoryList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        initData();
    }, []);

    const initData = async () => {
        setIsLoading(true);
        try {
            // Aseguramos que la tabla existe
            await executeAWSQuery(`
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock_Consumo_Historico' and xtype='U')
                CREATE TABLE Stock_Consumo_Historico (
                    id INT IDENTITY(1,1) PRIMARY KEY,
                    variante_id INT NOT NULL,
                    mes INT NOT NULL,
                    anio INT NOT NULL,
                    cantidad_consumida FLOAT NOT NULL,
                    fecha_registro DATETIME DEFAULT GETDATE()
                )
            `);

                        // Fetch categorias and productos
            const catRes = await executeAWSQuery("SELECT id, nombre FROM Stock_Categorias ORDER BY nombre");
            const prodRes = await executeAWSQuery(`
                SELECT v.id, 
                       v.nombre_variante,
                       v.nombre_variante as nombre,
                       v.codigo_variante,
                       pm.id as producto_maestro_id, pm.nombre as producto_nombre, pm.categoria_id,
                       pm.tipo_gestion,
                       0 as stock_total
                FROM Stock_Variantes v
                INNER JOIN Stock_Productos_Maestros pm ON v.producto_maestro_id = pm.id
            `);
            if (catRes) setCatalogCategorias(catRes);
            if (prodRes) setCatalogProductos(prodRes);

            fetchHistory();
        } catch (error: any) {
            toast.error("Error inicializando: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchHistory = async () => {
        try {
            const hRes = await executeAWSQuery(`
                SELECT TOP 50 h.*, v.nombre_variante, p.nombre as producto_nombre
                FROM Stock_Consumo_Historico h
                JOIN Stock_Variantes v ON h.variante_id = v.id
                JOIN Stock_Productos_Maestros p ON v.producto_maestro_id = p.id
                ORDER BY h.id DESC
            `);
            if (hRes) setHistoryList(hRes);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!varianteSelected) return toast.error("Debes seleccionar un artículo.");
        if (!cantidad || Number(cantidad) <= 0) return toast.error("La cantidad debe ser mayor a 0.");

        try {
            await executeAWSQuery(`
                INSERT INTO Stock_Consumo_Historico (variante_id, mes, anio, cantidad_consumida)
                VALUES (${varianteSelected.id}, ${mes}, ${anio}, ${cantidad})
            `);
            toast.success("Consumo histórico registrado con éxito.");
            setCantidad('');
            setVarianteSelected(null);
            fetchHistory();
        } catch (error: any) {
            toast.error("Error al registrar: " + error.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("¿Seguro que deseas eliminar este registro histórico?")) return;
        try {
            await executeAWSQuery(`DELETE FROM Stock_Consumo_Historico WHERE id = ${id}`);
            toast.success("Registro eliminado.");
            fetchHistory();
        } catch (error: any) {
            toast.error("Error al eliminar: " + error.message);
        }
    };

    return (
        <div className="card-nexus p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm max-w-5xl mx-auto mt-10">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 p-3 rounded-xl">
                    <History className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">Históricos de Consumo</h3>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">Carga manual de egresos antiguos</p>
                </div>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-400 font-medium mb-8 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                Los registros ingresados aquí <strong>no afectan el stock físico real</strong>. Únicamente se utilizan para enriquecer la base de datos estadística, permitiendo mostrar cálculos y promedios reales en el Panel de Control correspondientes a los meses seleccionados.
            </p>

            <form onSubmit={handleSave} className="bg-slate-50 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 mb-10">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-2 flex flex-col justify-end">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Artículo</label>
                        <button type="button" onClick={() => setIsVarianteModalOpen(true)} className="h-14 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 flex items-center justify-between text-left focus:ring-2 focus:ring-indigo-500">
                            {varianteSelected ? (
                                <div className="flex items-center gap-3">
                                    <Archive className="w-5 h-5 text-indigo-500" />
                                    <div>
                                        <p className="text-sm font-black text-slate-800 dark:text-white leading-tight line-clamp-1">{varianteSelected.producto_nombre}</p>
                                        <p className="text-[10px] font-bold text-slate-500">{varianteSelected.nombre_variante} | {varianteSelected.codigo_variante}</p>
                                    </div>
                                </div>
                            ) : (
                                <span className="text-slate-400 font-bold flex items-center gap-2"><Search className="w-5 h-5" /> Seleccionar Artículo...</span>
                            )}
                        </button>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Período</label>
                        <div className="flex gap-2">
                            <select value={mes} onChange={(e) => setMes(e.target.value)} className="h-14 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                                {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                                    <option key={m} value={m}>{new Date(2000, m - 1).toLocaleString('es-ES', { month: 'long' })}</option>
                                ))}
                            </select>
                            <select value={anio} onChange={(e) => setAnio(e.target.value)} className="h-14 w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 font-bold focus:ring-2 focus:ring-indigo-500 outline-none">
                                {[2022, 2023, 2024, 2025, 2026, 2027].map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Cantidad Salida</label>
                        <input type="number" min="1" step="0.01" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="h-14 w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 font-black text-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="0" required />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button type="submit" className="h-14 px-8 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-transform hover:scale-[1.02]">
                        <Save className="w-5 h-5" /> Registrar Histórico
                    </button>
                </div>
            </form>

            <div>
                <h4 className="font-black text-slate-800 dark:text-white mb-4 uppercase tracking-widest text-xs">Últimos Registros</h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Artículo</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Período</th>
                                <th className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Cantidad</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {historyList.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">{item.producto_nombre}</p>
                                        <p className="text-[10px] text-slate-500 font-bold">{item.nombre_variante}</p>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-1 rounded text-xs font-bold uppercase tracking-widest">
                                            {new Date(item.anio, item.mes - 1).toLocaleString('es-ES', { month: 'short' })} {item.anio}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <span className="font-black text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded text-sm">
                                            -{item.cantidad_consumida}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button onClick={() => handleDelete(item.id)} className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {historyList.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center py-8 text-slate-400 font-bold">No hay registros cargados.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <CategoryDrillDownModal 
                isOpen={isVarianteModalOpen} 
                onClose={() => setIsVarianteModalOpen(false)} 
                title="Selección Manual: Artículo" 
                categorias={catalogCategorias} 
                productos={catalogProductos} 
                onSelect={(id) => {
                    setVarianteSelected(catalogProductos.find(v => v.id.toString() === id.toString()));
                    setIsVarianteModalOpen(false);
                }} 
                closeOnSelect={true}
            />
        </div>
    );
}
