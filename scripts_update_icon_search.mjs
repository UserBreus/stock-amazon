import fs from 'fs';

let p = fs.readFileSync('src/components/ui/UiEditorPanel.tsx', 'utf8');

// Replace the basic smart tags and search logic
const newSearchLogic = `
    const lucideKeys = Object.keys(LucideIcons).filter(k => k !== 'createLucideIcon' && k !== 'default');
    
    // Diccionario de traducción para buscar iconos en español
    const wmsDictionary: Record<string, string[]> = {
        'caja': ['box', 'package', 'archive', 'container'],
        'camion': ['truck', 'car', 'bus', 'van'],
        'transporte': ['truck', 'navigation', 'map', 'send'],
        'usuario': ['user', 'users', 'person', 'contact'],
        'dinero': ['dollar', 'coins', 'banknote', 'credit-card', 'wallet', 'piggy-bank'],
        'finanzas': ['trending-up', 'bar-chart', 'pie-chart', 'activity'],
        'documento': ['file', 'file-text', 'clipboard', 'book', 'folder'],
        'configuracion': ['settings', 'tool', 'wrench', 'slider', 'cog'],
        'alerta': ['alert', 'bell', 'triangle', 'warning'],
        'flecha': ['arrow', 'chevron', 'move'],
        'herramienta': ['hammer', 'wrench', 'scissors', 'pen', 'ruler'],
        'escaneo': ['scan', 'barcode', 'qr-code', 'maximize'],
        'compras': ['shopping-cart', 'shopping-bag', 'store', 'tag'],
        'tiempo': ['clock', 'watch', 'calendar', 'timer'],
        'red': ['network', 'wifi', 'share', 'globe', 'link'],
        'seguridad': ['shield', 'lock', 'key']
    };

    const smartTags = [
        { label: "Cajas", val: "caja" },
        { label: "Transporte", val: "camion" },
        { label: "Usuarios", val: "usuario" },
        { label: "Dinero", val: "dinero" },
        { label: "Finanzas", val: "finanzas" },
        { label: "Docs", val: "documento" },
        { label: "Flechas", val: "flecha" },
        { label: "Escaner", val: "escaneo" },
        { label: "Compras", val: "compras" },
        { label: "Ajustes", val: "configuracion" }
    ];

    // Buscador Mejorado bilingue
    const filteredLucide = lucideKeys.filter(k => {
        if (!searchTerm) return true;
        const lowTerm = searchTerm.toLowerCase();
        
        // Si la busqueda inglesa coincide directo
        if (k.toLowerCase().includes(lowTerm)) return true;

        // Si la busqueda española es parte de nuestras keys del diccionario
        for (const [esWord, enArray] of Object.entries(wmsDictionary)) {
            if (esWord.includes(lowTerm)) { // Si busco "caj" entra en "caja"
                if (enArray.some(en => k.toLowerCase().includes(en))) return true;
            }
        }
        return false;
    }).slice(0, 150);
`;

const oldLogic = /const lucideKeys = Object\.keys\(LucideIcons\)[\s\S]*?const smartTags = \["arr", "box", "user", "file", "chart", "shop", "settings"\];/;

p = p.replace(oldLogic, newSearchLogic.trim());

// We also need to update the rendering of smart tags
const oldSmartTagsJSX = /<div className="flex flex-wrap gap-2 mb-2">[\s\S]*?<\/div>/;

const newSmartTagsJSX = `
                            <div className="flex flex-wrap gap-2 mb-2">
                                {smartTags.map(tag => (
                                    <button 
                                        key={tag.val}
                                        onClick={() => setSearchTerm(tag.val)}
                                        className="text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded transition-colors"
                                    >
                                        {tag.label}
                                    </button>
                                ))}
                            </div>
`;

p = p.replace(oldSmartTagsJSX, newSmartTagsJSX.trim());

// Increase the grid height so it shows more 
p = p.replace('className="grid grid-cols-5 gap-2 h-48', 'className="grid grid-cols-5 gap-2 h-64');

fs.writeFileSync('src/components/ui/UiEditorPanel.tsx', p);
console.log('Buscador español enriquecido inyectado');
