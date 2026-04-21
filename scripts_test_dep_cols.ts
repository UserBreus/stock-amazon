import { executeAWSQuery } from './src/lib/aws-client.ts';
executeAWSQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_Depositos'")
  .then(console.log)
  .catch(console.error);
