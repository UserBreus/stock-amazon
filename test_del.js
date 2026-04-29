async function testDel() {
    const API_URL = "http://3.85.26.173:5005/sql";
    async function executeQuery(query) {
        const r = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query })
        });
        return await r.json();
    }
    const res = await executeQuery("DELETE FROM Stock_Variantes WHERE id = '107'");
    console.log(res);
}
testDel();
