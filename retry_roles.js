fetch('http://3.85.26.173:5005/sql', { 
    method: 'POST', 
    headers: { 'Content-Type': 'application/json' }, 
    body: JSON.stringify({ query: `
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE CAST(rol AS VARCHAR(MAX))='administrativo_stock') 
        INSERT INTO usuarios (id, pass, rol, nombre_completo, cedula) VALUES ('AdminStock', 'admin123', 'administrativo_stock', 'Administrador General', '00000000'); 
        
        IF NOT EXISTS (SELECT 1 FROM usuarios WHERE CAST(rol AS VARCHAR(MAX))='operario_stock') 
        INSERT INTO usuarios (id, pass, rol, nombre_completo, cedula) VALUES ('OpeStock', 'ope123', 'operario_stock', 'Operario Deposito', '11111111');
    ` }) 
}).then(r=>r.json()).then(console.log);
