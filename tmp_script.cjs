async function run() {
    const q1 = "IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = 'progreso' AND Object_ID = Object_ID('Stock_Compras')) BEGIN ALTER TABLE Stock_Compras ADD progreso VARCHAR(50) DEFAULT 'realizada'; END;";
    const q2 = "IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = 'puerto_intermedio_desc' AND Object_ID = Object_ID('Stock_Compras')) BEGIN ALTER TABLE Stock_Compras ADD puerto_intermedio_desc VARCHAR(255); END;";
    
    let r = await fetch("http://3.85.26.173:5005/sql", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({query: q1})});
    console.log("Q1:", await r.json());
    
    r = await fetch("http://3.85.26.173:5005/sql", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({query: q2})});
    console.log("Q2:", await r.json());
}
run();
