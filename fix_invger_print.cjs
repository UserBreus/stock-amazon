const fs = require('fs');

try {
    let code = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

    // we don't know the exact string, so we'll just grab the root div after return
    const search = '<div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 flex flex-col">';
    const search2 = '<div className="w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">';
    
    if (code.includes(search)) {
        code = code.replace(search, '<div className="print:hidden w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 flex flex-col">');
    } else if (code.includes(search2)) {
        code = code.replace(search2, '<div className="print:hidden w-full h-full overflow-y-auto bg-slate-50 dark:bg-slate-950 p-4 sm:p-8">');
    } else {
        const rootIndex = code.indexOf('return (\n    <>');
        if (rootIndex !== -1) {
             const divIndex = code.indexOf('<div', rootIndex);
             code = code.slice(0, divIndex) + code.slice(divIndex).replace('className="', 'className="print:hidden ');
        }
    }
    
    fs.writeFileSync('src/pages/InventarioGerencial.tsx', code);
    console.log('Fixed InventarioGerencial visibility!');
} catch(e) {
    console.error(e);
}
