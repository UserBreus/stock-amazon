import { executeAWSQuery } from './src/lib/aws-client.ts';

async function run() {
  try {
    const res = await executeAWSQuery("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES");
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error(e);
  }
}
run();
