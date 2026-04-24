const fs = require('fs');

try {
    let desp = fs.readFileSync('src/components/DespachoEgresos.tsx', 'utf8');

    // The main loop replaces the print portal in Despacho and moves it outside
    const printContentStart = desp.indexOf('{/* GLOBAL PRINT PORTAL */}');
    const printContentEnd = desp.indexOf('</>', printContentStart);
    const printPortalBlock = desp.substring(printContentStart, printContentEnd);

    // Remove it from its current position
    desp = desp.replace(printPortalBlock, '');

    // Append it right before </>
    desp = desp.replace('</>', printPortalBlock + '\n    </>');

    // Replace the CSS classes for both to allow proper pagination (remove fixed during print)
    const badClass = 'fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 sm:p-10 flex flex-col items-center gap-8 print:block print:p-0 print:bg-white hide-scrollbar';
    const goodClass = 'fixed inset-0 z-[100] bg-slate-800/90 backdrop-blur-sm overflow-y-auto p-4 sm:p-10 flex flex-col items-center gap-8 print:static print:inset-auto print:h-auto print:w-auto print:overflow-visible print:block print:p-0 print:bg-white hide-scrollbar';

    desp = desp.replace(badClass, goodClass);

    let inv = fs.readFileSync('src/pages/InventarioOperativo.tsx', 'utf8');
    inv = inv.replace(badClass, goodClass);

    // let's also make sure print-root is block and static
    const printRootBad = 'id="print-root" className="w-full flex flex-col items-center gap-12 print:block print:w-full"';
    const printRootGood = 'id="print-root" className="w-full flex flex-col items-center gap-12 print:block print:static print:w-full print:h-auto print:overflow-visible"';
    inv = inv.replace(printRootBad, printRootGood);
    desp = desp.replace(printRootBad, printRootGood);

    fs.writeFileSync('src/pages/InventarioOperativo.tsx', inv);
    fs.writeFileSync('src/components/DespachoEgresos.tsx', desp);

    console.log('Fixed nesting and CSS paginator bugs!');
} catch (e) {
    console.error(e);
}
