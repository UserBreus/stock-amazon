import fetch from 'node-fetch';

async function executeAWSQuery(query) {
  const proxyUrl = 'http://3.85.26.173:5005/sql';
  const response = await fetch(proxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  if (!response.ok) throw new Error(\`Error en AWS Proxy: \${await response.text()}\`);
  const data = await response.json();
  return data;
}

async function main() {
  try {
    const res = await executeAWSQuery("SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME IN ('Stock_Productos_Maestros', 'Stock_Variantes', 'Stock_Etiquetas') AND COLUMN_NAME = 'id'");
    console.log(JSON.stringify(res, null, 2));
  } catch (e) {
    console.error(e);
  }
}
main();
