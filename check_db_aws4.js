fetch("http://3.85.26.173:5005/sql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "SELECT count(*) FROM Stock_Movimientos WHERE variante_id = 226;" })
}).then(r => r.json()).then(data => console.log('Movimientos:', JSON.stringify(data, null, 2))).catch(console.error);

fetch("http://3.85.26.173:5005/sql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "SELECT count(*) FROM Stock_Lotes_Etiquetas WHERE variante_id = 226;" })
}).then(r => r.json()).then(data => console.log('Lotes:', JSON.stringify(data, null, 2))).catch(console.error);
