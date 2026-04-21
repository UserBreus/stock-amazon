const AWS_URL = '/api/sql';

export async function executeAWSQuery(query: string): Promise<any[]> {
    try {
        const response = await fetch(AWS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ query })
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
