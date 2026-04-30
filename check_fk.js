async function test() {
    const r = await fetch('http://3.85.26.173:5005/sql', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:"SELECT object_name(parent_object_id) AS TableName, name AS ForeignKeyName FROM sys.foreign_keys WHERE referenced_object_id = object_id('usuarios')"})});
    const d = await r.json();
    console.log(JSON.stringify(d, null, 2));
}
test();
