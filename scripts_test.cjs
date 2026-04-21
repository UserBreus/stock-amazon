const { executeAWSQuery } = require('./dist/aws.cjs');
executeAWSQuery("SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Stock_Movimientos'").then(console.log).catch(console.error);
