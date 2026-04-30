async function test() {
    const r = await fetch('http://3.85.26.173:5005/sql', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:"SELECT * FROM usuarios"})});
    const d = await r.json();
    console.log(JSON.stringify(d, null, 2));
}
test();
