const AWS_URL = '/api/sql';

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
