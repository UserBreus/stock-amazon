fetch("http://3.85.26.173:5005/sql", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "SELECT * FROM Stock_Variantes WHERE producto_maestro_id = 84;" })
}).then(r => r.json()).then(data => console.log(JSON.stringify(data, null, 2))).catch(console.error);
