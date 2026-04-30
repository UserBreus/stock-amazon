import { executeAWSQuery } from './src/lib/aws-client';
executeAWSQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_Variantes'")
.then(console.log)
.catch(console.error);
