// Smoke test UI + tangkapan layar tiga fitur baru:
// 1) form CR tanpa Pelaksana + panel penetapan pelaksana oleh penilai
// 2) pemilihan penanda tangan e-Sign tanpa pembuat otomatis
// 3) modal tambah anggota proyek dengan opsi perorangan dan grup
const L = require('./lib');
const P = (n) => 'panduan-' + n;

async function clickByText(page, re) {
  return await page.evaluate((src) => {
    const rx = new RegExp(src, 'i');
    const el = Array.from(document.querySelectorAll('button,a')).find(
      (x) => !x.disabled && rx.test((x.innerText || '').trim()));
    if (!el) return false;
    el.click();
    return true;
  }, re);
}

(async () => {
  const { browser, ctx } = await L.launch();
  const errs = [];

  // ===== 1. Change Request =====
  const page = await ctx.newPage();
  L.watch(page, 'cr');
  await L.loginOk(page, 'po@test.com');

  await L.go(page, '/change-management');
  const opened = await clickByText(page, 'permintaan perubahan|change request|buat|create|new');
  await page.waitForTimeout(1500);
  await L.settle(page, 20000);
  const hasPelaksanaField = await page.evaluate(() =>
    /pelaksana|implementers/i.test(document.querySelector('[role="dialog"], .fixed')?.innerText || ''));
  console.log('  form CR terbuka:', opened, '| masih ada field Pelaksana:', hasPelaksanaField);
  if (hasPelaksanaField) errs.push('field Pelaksana masih ada di form pembuatan CR');
  await L.shot(page, P('cr-form-tanpa-pelaksana'));
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(800);

  // panel pelaksana pada CR yang sedang ditinjau, dilihat sebagai penilai
  const pm = await ctx.newPage();
  L.watch(pm, 'cr-pm');
  await L.loginOk(pm, 'pm@test.com');
  await L.go(pm, '/change-management');
  await pm.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /menunggu saya|awaiting me/i.test(x.innerText));
    if (b) b.click();
  });
  await pm.waitForTimeout(1200);
  await L.settle(pm, 20000);
  // buka kartu CR pertama
  await pm.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /uji pelaksana|detail|selengkapnya/i.test(x.innerText));
    if (b) b.click();
  });
  await pm.waitForTimeout(1500);
  await L.settle(pm, 20000);
  const panel = await pm.evaluate(() => /pelaksana|implementers/i.test(document.body.innerText));
  console.log('  panel Pelaksana terlihat oleh penilai:', panel);
  if (!panel) errs.push('panel Pelaksana tidak terlihat pada detail CR');
  await L.shot(pm, P('cr-panel-pelaksana'));

  // ===== 2. e-Sign Distribution =====
  await L.go(page, '/tte-sign');
  await clickByText(page, 'permintaan e-sign baru|new e-sign request');
  await page.waitForTimeout(1500);
  await L.settle(page, 20000);
  const note = await page.evaluate(() => {
    const m = document.body.innerText.match(/.*(urutan tanda tangan|signing order).*/i);
    return m ? m[0].trim() : '(tidak ditemukan)';
  });
  console.log('  keterangan penanda tangan:', note);
  await L.shot(page, P('esign-pilih-penandatangan'));
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(800);

  // ===== 3. Tambah anggota proyek: perorangan + grup =====
  await L.go(page, '/projects');
  await page.locator('div.cursor-pointer').first().click();
  await page.waitForURL(/\/projects\/[0-9a-f-]+/i, { timeout: 25000 }).catch(() => {});
  await L.settle(page, 25000);
  await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => /members|anggota/i.test(x.innerText.trim()));
    if (b) b.click();
  });
  await page.waitForTimeout(1200);
  await clickByText(page, 'add member|tambah anggota');
  await page.waitForTimeout(1500);
  await L.settle(page, 20000);
  const modal = await page.evaluate(() => document.body.innerText);
  const hasIndiv = /perorangan|individuals/i.test(modal);
  const hasGroup = /grup pengguna|user groups/i.test(modal);
  console.log('  modal anggota -> perorangan:', hasIndiv, '| grup:', hasGroup);
  if (!hasIndiv || !hasGroup) errs.push('modal tambah anggota belum menampilkan opsi perorangan/grup');
  await L.shot(page, P('proyek-tambah-anggota-grup'));

  console.log('\n=== hasil smoke test ===');
  if (errs.length === 0) console.log('  semua tampilan sesuai harapan');
  else errs.forEach((e) => console.log('  MASALAH:', e));

  const consoleErrs = [...(page._errs || []), ...(pm._errs || [])].filter(
    (e) => !/404|favicon/i.test(e));
  if (consoleErrs.length) {
    console.log('\n  galat konsol/HTTP:');
    consoleErrs.slice(0, 8).forEach((e) => console.log('   -', e));
  } else {
    console.log('  tidak ada galat konsol/HTTP');
  }

  await browser.close();
})();
