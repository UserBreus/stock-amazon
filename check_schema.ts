import { executeAWSQuery } from './src/lib/aws-client';

async function check() {
  try {
      const q = await executeAWSQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_Compras_Detalle'");
      console.log('Stock_Compras_Detalle columns:', q);
      const v = await executeAWSQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_Variantes'");
      console.log('Stock_Variantes columns:', v);
  } catch(e) {
      console.error(e);
  }
}
check();
