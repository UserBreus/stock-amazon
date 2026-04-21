import fetch from 'node-fetch';

async function main() { 
  const proxyParams = { 
    method: 'POST', 
    body: JSON.stringify({query: 'SELECT (SELECT COUNT(*) FROM Stock_Productos_Maestros) as pm, (SELECT COUNT(*) FROM Stock_Variantes) as v, (SELECT COUNT(*) FROM Stock_Etiquetas) as e, (SELECT COUNT(*) FROM Stock_Categorias) as c, (SELECT COUNT(*) FROM Stock_Proveedores) as p'}), 
    headers: {'Content-Type': 'application/json'} 
  }; 
  const res = await fetch('http://3.85.26.173:5005/sql', proxyParams); 
  console.log(await res.json()); 
} 
main();
