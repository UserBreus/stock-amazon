import { executeAWSQuery } from './src/lib/aws-client';

async function main() {
  try {
    const res = await executeAWSQuery("SELECT * FROM Stock_Monedas");
    console.log(res);
  } catch (e) {
    console.error(e);
  }
}

main();
