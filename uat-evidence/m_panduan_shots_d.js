// Ambil ulang tangkapan layar halaman yang tombol matinya sudah dihapus:
// login (ConnectIDN), notifikasi (CTA), dokumen (banner + ikon lihat),
// beban kerja (Rebalance), laporan (Schedule).
const L = require('./lib');
const P = (n) => 'panduan-' + n;

async function pickFirstOption(page, index) {
  const sel = page.locator('select').nth(index);
  if (!(await sel.count())) return null;
  const vals = (await sel.locator('option').evaluateAll((os) => os.map((o) => o.value))).filter(Boolean);
  if (!vals.length) return null;
  await sel.selectOption(vals[0]);
  await page.waitForTimeout(2000);
  await L.settle(page, 20000);
  return vals[0];
}

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  L.watch(page, 'recapture');

  // --- halaman login (tanpa tombol ConnectIDN) ---
  await L.go(page, '/login');
  await page.fill('input[type="email"]', 'po@test.com');
  await page.fill('input[type="password"]', 'UatCheck#2026');
  await L.settle(page, 15000);
  await L.shot(page, P('login'));

  // --- masuk, lalu potret halaman-halaman terdampak ---
  await L.loginOk(page, 'po@test.com');

  await L.go(page, '/notifications');
  await L.shot(page, P('notifications'));

  await L.go(page, '/documents');
  await L.shot(page, P('documents'));

  await L.go(page, '/workload');
  await pickFirstOption(page, 0);
  await pickFirstOption(page, 1);
  await L.shot(page, P('workload-charts'));

  await L.go(page, '/reports');
  await pickFirstOption(page, 0);
  await pickFirstOption(page, 1);
  await L.settle(page, 20000);
  await L.shot(page, P('reports'));

  // --- keluar: halaman login setelah logout ---
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button,a')).find((x) =>
      /sign out|keluar/i.test((x.innerText || '').trim()));
    if (b) b.click();
  });
  await page.waitForURL(/\/login/, { timeout: 20000 }).catch(() => {});
  await L.settle(page, 15000);
  await L.shot(page, P('setelah-logout'));

  await browser.close();
  console.log('\nselesai.');
})();
