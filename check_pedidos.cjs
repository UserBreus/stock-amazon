const sql = "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME LIKE '%pedid%'";
fetch('http://localhost:3000/api/sql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: sql })
})
.then(res => res.json())
.then(data => console.log('Tables:', JSON.stringify(data, null, 2)))
.catch(err => console.error('Error:', err));
