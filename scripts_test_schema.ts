import { executeAWSQuery } from './src/lib/aws-client.ts';

async function verify() {
  try {
     const colsMovs = await executeAWSQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_Movimientos'");
     console.log("Stock_Movimientos cols: ", colsMovs);

     const colsVars = await executeAWSQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_Variantes'");
     console.log("Stock_Variantes cols: ", colsVars);
  } catch(e) { console.error(e); }
}
verify();
