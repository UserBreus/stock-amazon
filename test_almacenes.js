async function executeDirectQuery(query) {
    const response = await fetch('http://3.85.26.173:5005/sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
    });
    const json = await response.json();
    return json;
}

async function run() {
    const res = await executeDirectQuery(`
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock_Alertas_Depositos' AND xtype='U') 
        CREATE TABLE Stock_Alertas_Depositos (
            variante_id INT NOT NULL, 
            deposito_id INT NOT NULL, 
            cantidad_alerta INT NOT NULL DEFAULT 0, 
            cantidad_critica INT NOT NULL DEFAULT 0, 
            PRIMARY KEY (variante_id, deposito_id)
        )
    `);
    console.log(res);
}
run();
