const L = require('./lib');
const fs = require('fs');
const PASSPHRASE = process.env.TTE_PASSPHRASE;

(async () => {
  const browser = await require('playwright').chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm36f');
  await L.loginOk(page, 'po@test.com');            // Kepala Balai = penandatangan urutan 1
  await L.go(page, '/tte-sign');
  const sList = await L.shotFull(page, '3.6.2-1a_daftar-esign-multi-pihak');

  await page.locator('text=tes dokumen UAT').first().click();
  await page.waitForTimeout(2500);
  await L.settle(page, 15000);
  const sDetail = await L.shotFull(page, '3.6.2-1b_urutan-penandatangan');

  // the detail opens in an overlay modal; scope clicks inside it or the
  // overlay intercepts them
  const modal = page.locator('div.fixed.inset-0').last();
  // exact match: has-text("Sign") also matches the "Info & Signatories" tab
  await modal.getByRole('button', { name: 'Sign', exact: true }).first().click();
  await page.waitForSelector('input[placeholder="e-Sign passphrase"]', { timeout: 15000 });
  await page.locator('input[placeholder="e-Sign passphrase"]').scrollIntoViewIfNeeded().catch(() => {});
  await page.fill('input[placeholder="e-Sign passphrase"]', PASSPHRASE);
  await page.waitForTimeout(600);
  const sSign = await L.shot(page, '3.6.2-1c_dialog-tanda-tangan');

  const confirm = modal.locator('button:has-text("Confirm Signature")').first();
  console.log('  tombol konfirmasi aktif:', await confirm.isEnabled().catch(() => false));
  await confirm.click();
  console.log('  menunggu BSrE ...');
  try {
    await page.waitForSelector('input[placeholder="e-Sign passphrase"]', { state: 'detached', timeout: 180000 });
    console.log('  panel tertutup (selesai)');
  } catch (e) { console.log('  panel masih terbuka setelah 180 detik'); }
  await page.waitForTimeout(4000);
  await L.settle(page, 25000);

  const sAfterDetail = await L.shotFull(page, '3.6.2-1d_setelah-penandatangan-pertama');
  await L.go(page, '/tte-sign');
  const atxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('  status daftar:', JSON.stringify(atxt.slice(0, 18)));
  const sAfterList = await L.shotFull(page, '3.6.2-1e_status-daftar-setelah');

  fs.writeFileSync('multi-sign-result.json', JSON.stringify({ atxt: atxt.slice(0, 18), shots: [sList, sDetail, sSign, sAfterDetail, sAfterList] }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 5).join(' | ') || 'tidak ada');
  await browser.close();
})();
