fetch('http://3.85.26.173:5005/sql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  // SQL Server check: @@version
  body: JSON.stringify({ query: "SELECT @@version as version, db_name() as dbname" })
}).then(r => r.json()).then(data => {
  console.log("SQL SERVER DB Check:", data);
  if(data.error) {
    // If it fails, try PG
    return fetch('http://3.85.26.173:5005/sql', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ query: "SELECT version(), current_database()" })
    }).then(r=>r.json()).then(console.log);
  }
}).catch(console.error);
