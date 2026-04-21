const url = 'http://3.85.26.173:5005/sql';

async function updateDB() {
    const q1 = "ALTER TABLE Stock_Variantes ADD costo DECIMAL(18,2) DEFAULT 0;";
    const r1 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q1 })
    });
    const d1 = await r1.json();
    console.log("costo result:", d1);

    const q2 = "UPDATE Stock_Variantes SET costo = 0 WHERE costo IS NULL;";
    const r2 = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q2 })
    });
    const d2 = await r2.json();
    console.log("costo update result:", d2);
}

updateDB();
