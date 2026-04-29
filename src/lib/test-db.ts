import { executeAWSQuery } from './aws-client';

async function check() {
    try {
        const res = await executeAWSQuery("SELECT * FROM Stock_Variantes WHERE nombre_variante LIKE '%1,60%'");
        console.log("VARIANTES EN BASE DE DATOS:");
        console.log(JSON.stringify(res, null, 2));
    } catch(e) {
        console.error(e);
    }
}
check();
