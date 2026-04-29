async function test() {
    const r = await fetch('http://3.85.26.173:5005/sql', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:"SELECT TABLE_NAME, COLUMN_NAME, IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='wms_remitos_internos' AND COLUMN_NAME='deposito_destino_id'"})});
    const d = await r.json();
    console.log(JSON.stringify(d, null, 2));
}
test();
