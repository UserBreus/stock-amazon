const fetch = globalThis.fetch;

async function executeSql(query) {
    const res = await fetch('http://3.85.26.173:5005/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const json = await res.json();
    if(json.error) throw new Error(json.error);
    return json.data;
}

async function check() {
    const res = await executeSql(`SELECT TOP 1 id, simbolo, nombre FROM Config_Monedas`);
    console.table(res);
}
check();
