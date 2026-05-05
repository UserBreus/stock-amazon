import { executeAWSQuery } from './src/lib/aws-client';
async function test() {
  try {
    const r = await executeAWSQuery("SELECT TOP 5 a.variante_id, a.cantidad_ideal FROM Stock_Alertas_Depositos a");
    console.log(r);
  } catch (e) {
    console.error(e)
  }
}
test();
