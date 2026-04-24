const fs = require('fs');

try {
    let layout = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

    const mainBad = 'className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto w-full relative z-0"';
    const mainGood = 'className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto w-full relative z-0 print:h-auto print:overflow-visible print:block print:static"';
    layout = layout.replace(mainBad, mainGood);

    const motionBad = 'className="w-full h-full"';
    const motionGood = 'className="w-full h-full print:h-auto print:overflow-visible print:block print:static"';
    layout = layout.replace(motionBad, motionGood);

    const rootBad = 'className="bg-slate-50 dark:bg-slate-950 min-h-screen flex transition-colors duration-500 relative"';
    const rootGood = 'className="bg-slate-50 dark:bg-slate-950 min-h-screen flex transition-colors duration-500 relative print:block print:h-auto print:overflow-visible print:min-h-0 print:bg-white"';
    layout = layout.replace(rootBad, rootGood);

    const flex1Bad = 'className="flex-1 flex flex-col min-w-0 w-full"';
    const flex1Good = 'className="flex-1 flex flex-col min-w-0 w-full print:block print:h-auto print:overflow-visible print:static"';
    layout = layout.replace(flex1Bad, flex1Good);

    fs.writeFileSync('src/components/layout/Layout.tsx', layout);
    console.log('Patched layout root css!');
} catch (e) {
    console.error(e);
}
