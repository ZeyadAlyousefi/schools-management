import fs from 'fs';
import path from 'path';

const ARTIFACTS_DIR = 'C:\\Users\\ltc\\.gemini\\antigravity-ide\\brain\\10e19e7f-7ba8-4757-88f5-4cdfb8b90de2';

async function trigger() {
  const url = 'https://schools-management-parent.vercel.app/api/system/test-qa-operations';
  console.log('Target URL:', url);

  let attempts = 0;
  const maxAttempts = 15;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`\nAttempt ${attempts}/${maxAttempts}: Fetching ${url}...`);
    try {
      const res = await fetch(url);
      console.log('HTTP Status:', res.status);
      if (res.status === 200) {
        const data = await res.json();
        console.log('\n✅ Successfully executed QA-E2E-2026 operations on Turso Cloud!');
        console.log(`Total Operations: ${data.totalOperations}, Passed: ${data.passed}, Failed: ${data.failed}`);
        console.log(`School ID: ${data.schoolId}`);
        
        console.log('\n--- DETAILED OPERATIONS LOG ---');
        data.operationsLog?.forEach((op: any) => {
          console.log(`[${op.status}] #${op.id} (${op.role}) ${op.page} -> ${op.operation}`);
          console.log(`   Result: ${op.result}`);
          console.log(`   Details: ${op.details}`);
        });

        console.log('\n--- CREATED QA ACCOUNTS TABLE ---');
        console.table(data.qaAccounts);

        // Save results to artifacts directory
        fs.writeFileSync(
          path.join(ARTIFACTS_DIR, 'qa_e2e_2026_acceptance_results.json'),
          JSON.stringify(data, null, 2),
          'utf-8'
        );
        console.log(`\nSaved results to: ${path.join(ARTIFACTS_DIR, 'qa_e2e_2026_acceptance_results.json')}`);
        return data;
      } else {
        console.log('Deployment still in progress (Status ' + res.status + '). Waiting 10s...');
      }
    } catch (err: any) {
      console.log('Fetch error:', err.message, '- Waiting 10s...');
    }
    await new Promise(r => setTimeout(r, 10000));
  }

  throw new Error('Timeout waiting for deployment of test-qa-operations route.');
}

trigger().catch(console.error);
