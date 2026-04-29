async function main() {
  const res = await fetch('http://3.85.26.173:5005/sql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: "SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_TiposFactura'" })
  });
  const data = await res.json();
  console.log(data);
}
main();
