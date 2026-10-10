import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const BASE_URL = 'https://schools-management-parent.vercel.app';
const ARTIFACTS_DIR = 'C:\\Users\\ltc\\.gemini\\antigravity-ide\\brain\\10e19e7f-7ba8-4757-88f5-4cdfb8b90de2';
const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';

async function takeScreenshot(page: any, name: string): Promise<string> {
  const filePath = path.join(ARTIFACTS_DIR, `${name}.png`);
  await page.screenshot({ path: filePath, fullPage: false });
  console.log(`Saved screenshot: ${filePath}`);
  return filePath;
}

async function performLogin(page: any, email: string, pass: string) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
  
  const emailInput = await page.waitForSelector('input[type="email"]', { timeout: 15000 });
  await emailInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await emailInput.type(email, { delay: 20 });

  const passInput = await page.waitForSelector('input[type="password"]', { timeout: 15000 });
  await passInput.click({ clickCount: 3 });
  await page.keyboard.press('Backspace');
  await passInput.type(pass, { delay: 20 });

  await new Promise(r => setTimeout(r, 400));
  const submitBtn = await page.waitForSelector('button[type="submit"]', { timeout: 15000 });
  await submitBtn.click();

  // Wait for redirect to dashboard
  await new Promise(r => setTimeout(r, 6000));
}

async function main() {
  console.log('🚀 Testing Live Browser Login for Dedicated QA-E2E-2026 Accounts...');
  
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const testAccounts = [
    {
      role: 'Principal',
      email: 'qa.principal@methqal.tech',
      pass: 'Principal@NewPass2026!',
      expectedDashboard: '/dashboard/principal',
      screenName: 'QA_VERIFIED_Principal_Dashboard'
    },
    {
      role: 'Teacher',
      email: 'qa.teacher01@methqal.tech',
      pass: 'Teacher@NewPass2026!',
      expectedDashboard: '/dashboard/teacher',
      screenName: 'QA_VERIFIED_Teacher_Dashboard'
    },
    {
      role: 'Student',
      email: 'qa.student01@methqal.tech',
      pass: 'Student@NewPass2026!',
      expectedDashboard: '/dashboard/student',
      screenName: 'QA_VERIFIED_Student_Dashboard'
    },
    {
      role: 'Parent',
      email: 'qa.parent01@methqal.tech',
      pass: 'Parent@NewPass2026!',
      expectedDashboard: '/dashboard/parent',
      screenName: 'QA_VERIFIED_Parent_Dashboard'
    },
    {
      role: 'Accountant',
      email: 'qa.accountant@methqal.tech',
      pass: 'Accountant@NewPass2026!',
      expectedDashboard: '/dashboard/accountant',
      screenName: 'QA_VERIFIED_Accountant_Dashboard'
    }
  ];

  const results: any[] = [];

  try {
    for (const acc of testAccounts) {
      console.log(`\n--- Logging in as ${acc.role} (${acc.email}) ---`);
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport({ width: 1440, height: 900 });

      try {
        await performLogin(page, acc.email, acc.pass);
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        const passed = currentUrl.includes(acc.expectedDashboard);
        const screenshotPath = await takeScreenshot(page, acc.screenName);

        results.push({
          role: acc.role,
          email: acc.email,
          expectedUrl: acc.expectedDashboard,
          actualUrl: currentUrl,
          passed,
          screenshot: screenshotPath
        });

        console.log(`Result: ${passed ? '✅ PASS' : '❌ FAIL'}`);
      } catch (err: any) {
        console.error(`Error during login for ${acc.role}:`, err.message);
        results.push({
          role: acc.role,
          email: acc.email,
          error: err.message,
          passed: false
        });
      } finally {
        await context.close();
      }
    }

    console.log('\n--- BROWSER LOGIN VERIFICATION SUMMARY ---');
    console.table(results);

    // Save summary
    fs.writeFileSync(
      path.join(ARTIFACTS_DIR, 'qa_browser_login_verification.json'),
      JSON.stringify(results, null, 2),
      'utf-8'
    );
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
