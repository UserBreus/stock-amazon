const queries = [
    `DECLARE @ConstraintName nvarchar(200); 
     SELECT @ConstraintName = Name FROM sys.default_constraints WHERE PARENT_OBJECT_ID = OBJECT_ID('Stock_Categorias') AND PARENT_COLUMN_ID = (SELECT column_id FROM sys.columns WHERE NAME = 'config_json' AND object_id = OBJECT_ID('Stock_Categorias')); 
     IF @ConstraintName IS NOT NULL EXEC('ALTER TABLE Stock_Categorias DROP CONSTRAINT ' + @ConstraintName); 
     ALTER TABLE Stock_Categorias DROP COLUMN config_json;`,

     `DECLARE @C2 nvarchar(200); 
     SELECT @C2 = Name FROM sys.default_constraints WHERE PARENT_OBJECT_ID = OBJECT_ID('Stock_Productos') AND PARENT_COLUMN_ID = (SELECT column_id FROM sys.columns WHERE NAME = 'factor_conversion' AND object_id = OBJECT_ID('Stock_Productos')); 
     IF @C2 IS NOT NULL EXEC('ALTER TABLE Stock_Productos DROP CONSTRAINT ' + @C2); 
     ALTER TABLE Stock_Productos DROP COLUMN factor_conversion;`
];

async function runQueries() {
    for (const q of queries) {
        console.log("Running:", q);
        try {
            const r = await fetch('http://3.85.26.173:5005/sql', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ query: q }) 
            });
            const text = await r.text();
            if(!JSON.parse(text).success) {
               console.error("Failed:", text);
            }
        } catch(e) {
            console.error("HTTP Err:", e);
        }
    }
    console.log("COLS DROPPED");
}

runQueries();
