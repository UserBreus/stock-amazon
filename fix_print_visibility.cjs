const fs = require('fs');

try {
    let sb = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
    sb = sb.replace('className="bg-slate-900 border-r', 'className="print:hidden bg-slate-900 border-r');
    sb = sb.replace('className="fixed inset-y-0 left-0 z-50', 'className="print:hidden fixed inset-y-0 left-0 z-50');
    fs.writeFileSync('src/components/layout/Sidebar.tsx', sb);

    let tb = fs.readFileSync('src/components/layout/TopBar.tsx', 'utf8');
    tb = tb.replace('className="bg-white dark:bg-slate-950 border-b', 'className="print:hidden bg-white dark:bg-slate-950 border-b');
    fs.writeFileSync('src/components/layout/TopBar.tsx', tb);

    let op = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');
    op = op.replace('className="w-full h-[calc(100vh-4rem)] overflow-hidden flex font-sans"', 'className="print:hidden w-full h-[calc(100vh-4rem)] overflow-hidden flex font-sans"');
    fs.writeFileSync('src/pages/InventarioOperativo.tsx', op);

    console.log('Added print:hidden successfully');
} catch(e) {
    console.error(e);
}
