const fs = require('fs');
let c = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

c = c.replace(/activeTab === 'panel' && panelView === 'traslado'[\s\S]*?<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">/, `activeTab === 'panel' && panelView === 'traslado' && (
         <div className="mt-4"><DespachoEgresos initialOperationType="traslado" initialMode="lote" /></div>
      )}
      {activeTab === 'panel' && panelView === 'retiro' && (
         <div className="mt-4"><DespachoEgresos initialOperationType="venta_consumo" initialMode="lote" /></div>
      )}

      {/* PESTAÑA INVENTARIO */}
      {activeTab === 'inventario' && (
      <AnimatePresence>
      <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} exit={{opacity:0}}>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">`);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', c);
console.log("FIXED using regex!");
