const AWS_URL = '/api/sql';

export async function executeAWSQuery(query: string): Promise<any[]> {
    try {
        // Check if we are running in local development
        const isLocalhost = typeof window !== 'undefined' && 
            (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
            
        // Always use Ventas_Dev database
        const targetDb = 'Ventas_Dev';
        const finalQuery = `USE ${targetDb}; CREATE TABLE #WmsSecureTx_v17 (id INT); ${query}`;
        
        const response = await fetch(AWS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query: finalQuery })
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
