fetch('http://3.85.26.173:5005/sql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Stock_Productos_Maestros'" })
}).then(r => r.json()).then(data => {
  console.log(data);
}).catch(console.error);
