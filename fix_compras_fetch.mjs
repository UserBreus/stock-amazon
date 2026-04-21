import fs from 'fs';

let txt = fs.readFileSync('src/pages/InventarioGerencial.tsx', 'utf8');

const targetStr = `const [stockRes, capRes, tiposRes, depRes, etqRes] = await Promise.all([
        executeAWSQuery(advancedQuery),
        executeAWSQuery("SELECT * FROM Vista_Capital_Activo"),
        executeAWSQuery("SELECT * FROM Stock_Categorias ORDER BY nombre"),
        executeAWSQuery("SELECT * FROM Stock_Depositos WHERE tipo='general'"),
        executeAWSQuery("SELECT * FROM Stock_Etiquetas WHERE estado='activo'")
      ]);
      setStockConsolidado(stockRes || []);
      setCapitalActivo(capRes || []);
      setTiposProducto(tiposRes);
      setDepositos(depRes);
      setEtiquetas(etqRes);`;

const newStr = `const [stockRes, capRes, tiposRes, depRes, etqRes, comprasR] = await Promise.all([
        executeAWSQuery(advancedQuery),
        executeAWSQuery("SELECT * FROM Vista_Capital_Activo"),
        executeAWSQuery("SELECT * FROM Stock_Categorias ORDER BY nombre"),
        executeAWSQuery("SELECT * FROM Stock_Depositos"),
        executeAWSQuery("SELECT * FROM Stock_Etiquetas WHERE estado='activo'"),
        executeAWSQuery("SELECT c.*, p.nombre as proveedor_nombre FROM Stock_Compras c LEFT JOIN Stock_Proveedores p ON c.proveedor_id = p.id WHERE c.estado = 'pendiente' ORDER BY c.fecha_creacion DESC")
      ]);
      setStockConsolidado(stockRes || []);
      setCapitalActivo(capRes || []);
      setTiposProducto(tiposRes || []);
      setDepositos(depRes || []);
      setEtiquetas(etqRes || []);
      setComprasPendientes(comprasR || []);`;

txt = txt.replace(targetStr, newStr);

fs.writeFileSync('src/pages/InventarioGerencial.tsx', txt);
console.log("InventarioGerencial.tsx fetch fixed!");
