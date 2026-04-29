const fs = require('fs');

let c = fs.readFileSync('src/pages/ConfiguracionMaestros.tsx', 'utf8');

const badBlock = `{activeTab === 'modelos' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="w-full space-y-6">
            
            {/* Toolbar Superior: Setup Compacto */}
                                onChange={e=>setNuevoAtributo(e.target.value)} `;

const goodBlock = `{activeTab === 'modelos' && (
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
                            <span className={(varProdIds.length > 0) ? "font-black text-blue-700 dark:text-blue-400 text-sm truncate" : "text-slate-400 font-bold text-sm"}>
                                {varProdIds.length === 0 ? 'Buscar...' : varProdIds.length === 1 ? productos.find(p => p.id.toString() === varProdIds[0])?.nombre : \`\${varProdIds.length} artículos seleccionados\`}
                            </span>
                            <Network className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        </button>
                    </div>

                    <div className="xl:col-span-7 flex flex-col h-full border-l border-transparent xl:border-slate-200 dark:xl:border-slate-800 xl:pl-8">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 transition-colors duration-300" style={{ color: (varProdIds.length > 0) ? 'inherit' : '' }}>2. Categoría de Rasgo (Ej. Talle, Color)</label>
                        
                        <div className="flex gap-2">
                             <input 
                                disabled={(varProdIds.length === 0)}
                                value={nuevoAtributo} 
                                onChange={e=>setNuevoAtributo(e.target.value)} `;

if (c.indexOf(badBlock) !== -1) {
    c = c.replace(badBlock, goodBlock);
    fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
    console.log("Fixed the block.");
} else {
    // If exact replace failed, try regex or replacing parts
    c = c.replace(/\{\/\* Toolbar Superior: Setup Compacto \*\/\}\s*onChange=\{e=>setNuevoAtributo/g, `{/* Toolbar Superior: Setup Compacto */}
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
                            <span className={(varProdIds.length > 0) ? "font-black text-blue-700 dark:text-blue-400 text-sm truncate" : "text-slate-400 font-bold text-sm"}>
                                {varProdIds.length === 0 ? 'Buscar...' : varProdIds.length === 1 ? productos.find(p => p.id.toString() === varProdIds[0])?.nombre : \`\${varProdIds.length} artículos seleccionados\`}
                            </span>
                            <Network className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        </button>
                    </div>

                    <div className="xl:col-span-7 flex flex-col h-full border-l border-transparent xl:border-slate-200 dark:xl:border-slate-800 xl:pl-8">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2 transition-colors duration-300" style={{ color: (varProdIds.length > 0) ? 'inherit' : '' }}>2. Categoría de Rasgo (Ej. Talle, Color)</label>
                        
                        <div className="flex gap-2">
                             <input 
                                disabled={(varProdIds.length === 0)}
                                value={nuevoAtributo} 
                                onChange={e=>setNuevoAtributo`);
    fs.writeFileSync('src/pages/ConfiguracionMaestros.tsx', c);
    console.log("Fixed the block using regex fallback.");
}
