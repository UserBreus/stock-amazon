import fetch from 'node-fetch';

const query = `IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Stock_Sesiones_Login' and xtype='U') CREATE TABLE Stock_Sesiones_Login (id INT IDENTITY(1,1) PRIMARY KEY, usuario_id NVARCHAR(255) NOT NULL, deposito_id INT NOT NULL, fecha_ingreso DATETIME NOT NULL DEFAULT GETDATE());`;

async function execute() {
  const res = await fetch('http://3.85.26.173:5005/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query })
  });
  
  const data = await res.json();
  console.log(data);
}
execute();
