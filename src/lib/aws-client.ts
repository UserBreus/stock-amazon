// Si estamos en desarrollo local (PC), conectamos directo a la IP de Amazon.
// Si estamos en producción (Amazon, empaquetado), usamos el proxy de Nginx.
const AWS_URL = import.meta.env.PROD 
    ? '/api/sql' 
    : 'http://3.85.26.173:5005/sql';

export async function executeAWSQuery(query: string): Promise<any[]> {
    try {
        // Enforce the use of the duplicated development database
        const devQuery = `USE Ventas_Dev; ${query}`;
        
        const response = await fetch(AWS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: devQuery })
        });
        const json = await response.json();
        if (json.error) {
            console.error("AWS Error:", json.error, query);
            throw new Error(json.error);
        }
        return json.data || [];
    } catch (e) {
        console.error("Network or SQL Error to AWS Proxy:", e);
        throw e;
    }
}
