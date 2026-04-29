const queries = [
    "DELETE FROM Stock_Compras_Detalle;",
    "DELETE FROM Stock_Compras;"
];

async function run() {
    for (let q of queries) {
        console.log("Running:", q);
        try {
            let res = await fetch('http://localhost:3000/api/sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: q })
            });
            let data = await res.json();
            if (!data.success) {
                console.error("Error on", q, data.error);
            } else {
                console.log("Success");
            }
        } catch(e) {
            console.error(e);
        }
    }
}
run();
