fetch("http://3.85.26.173:5005/sql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "SELECT TOP 1 * FROM Stock_Movimientos;" })
}).then(r => r.json()).then(data => console.log('Movs:', JSON.stringify(data, null, 2))).catch(console.error);

fetch("http://3.85.26.173:5005/sql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "SELECT TOP 1 * FROM Stock_Etiquetas;" })
}).then(r => r.json()).then(data => console.log('Etiquetas:', JSON.stringify(data, null, 2))).catch(console.error);
