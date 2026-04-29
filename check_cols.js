async function checkColumns() {
    const API_URL = "http://3.85.26.173:5005/sql";
    async function executeQuery(query) {
        const r = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        return await r.json();
    }

    try {
        const res = await executeQuery("SELECT TOP 1 * FROM Stock_Variantes;");
        console.log("COLUMNS:", Object.keys(res.data[0]));
    } catch (e) {
        console.error(e);
    }
}
checkColumns();
