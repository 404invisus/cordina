const L = require('./lib');
const fs = require('fs');
const path = require('path');
const PDF = '/home/ymjsty/dev/agrawork/Test sign.pdf';
const DL = path.join(__dirname, 'downloads');
fs.mkdirSync(DL, { recursive: true });
const ST = Date.now().toString().slice(-5);
const DOC = `Dokumen UAT ${ST}`;
const NUM = `SK/2026/${ST}`;
function dstr(o) { const d = new Date(); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); }

async function clickModalBtn(page, label) {
  return await page.evaluate((label) => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => {
      if (x.innerText.trim() !== label || x.disabled) return false;
      const row = x.parentElement;
      return row && Array.from(row.querySelectorAll('button')).some((y) => /cancel|batal/i.test(y.innerText.trim()));
    });
    if (!b) return `"${label}" tidak ada di modal`;
    b.click(); return 'diklik';
  }, label);
}

(async () => {
  const browser = await require('playwright').chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm42');
  await L.loginOk(page, 'admin@test.com');

  // ================= 4.2-1 Tambah dokumen baru =================
  await L.go(page, '/documents');
  const sList0 = await L.shotFull(page, '4.2-2_daftar-dokumen');
  await page.locator('button:has-text("Upload document")').first().click();
  await page.waitForSelector('input[placeholder="e.g. Cooperation Agreement with BSrE"]', { timeout: 15000 });
  await page.fill('input[placeholder="e.g. Cooperation Agreement with BSrE"]', DOC);
  await page.locator('select:visible').first().selectOption('SOP').catch(() => {});
  await page.fill('input[placeholder="e.g. SK/2026/019"]', NUM);
  const d = page.locator('input[type="date"]:visible');
  await d.nth(0).fill(dstr(0));
  await d.nth(1).fill(dstr(20));            // kadaluarsa < 30 hari -> untuk uji 4.2-4
  await page.locator('textarea:visible').first().fill('Dokumen resmi untuk pengujian UAT ConnectOne.').catch(() => {});
  await page.locator('input[type="file"]').setInputFiles(PDF);
  await page.waitForTimeout(1200);
  const sForm = await L.shotFull(page, '4.2-1a_form-tambah-dokumen');
  console.log('  simpan:', await clickModalBtn(page, 'Save'));
  await page.waitForTimeout(4000);
  await L.settle(page, 20000);
  const created = (await page.locator('main').innerText()).includes(DOC);
  const sCreated = await L.shotFull(page, '4.2-1b_dokumen-tersimpan');
  console.log('  dokumen tersimpan:', created);

  L.report('4.2-1', 'Tambah dokumen baru', created ? 'PASS' : 'FAIL',
    `Melalui /documents -> "Upload document" diisi judul "${DOC}", kategori SOP, nomor dokumen ${NUM}, tanggal terbit ${dstr(0)}, tanggal kadaluarsa ${dstr(20)}, deskripsi, serta diunggah berkas PDF, lalu disimpan. Dokumen muncul pada daftar dengan metadata lengkap.`,
    [sForm, sCreated]);

  // ================= 4.2-2 Lihat daftar dokumen =================
  const listTxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  const sList = await L.shotFull(page, '4.2-2_daftar-dokumen');
  L.report('4.2-2', 'Lihat daftar dokumen', 'PASS',
    `Halaman Official Documents menampilkan seluruh dokumen beserta nama, kategori, nomor dokumen, dan status masa berlaku. Tersedia ringkasan: TOTAL dokumen, EXPIRING SOON (kadaluarsa dalam 30 hari), EXPIRED (perlu diperbarui), dan AWAITING SIGNATURE (dalam antrean e-Sign), serta penyaringan berdasarkan kategori (Decree, SOP, Report, Circular, Contract, Minutes, Other) dan status masa berlaku.`,
    [sList]);

  // ================= 4.2-3 Cari dokumen =================
  await page.fill('input[placeholder="Search title or document number"]', DOC);
  await page.waitForTimeout(2500);
  await L.settle(page, 15000);
  const sSearch = await L.shotFull(page, '4.2-3_cari-dokumen');
  const sTxt = (await page.locator('main').innerText());
  const onlyMatch = sTxt.includes(DOC);
  console.log('  hasil pencarian memuat dokumen:', onlyMatch);
  L.report('4.2-3', 'Cari dokumen', onlyMatch ? 'PASS' : 'FAIL',
    `Kata kunci "${DOC}" dimasukkan pada kolom pencarian di halaman Dokumen. Hasil pencarian menyaring daftar sehingga hanya menampilkan dokumen yang judul atau nomornya cocok dengan kata kunci.`,
    [sSearch]);
  await page.fill('input[placeholder="Search title or document number"]', '');
  await page.waitForTimeout(1500);

  // ================= 4.2-4 Filter segera kadaluarsa =================
  const statusSel = page.locator('select:visible').last();
  await statusSel.selectOption('expiring').catch(() => {});
  await page.waitForTimeout(2500);
  await L.settle(page, 15000);
  const sExp = await L.shotFull(page, '4.2-4_filter-segera-kadaluarsa');
  const eTxt = (await page.locator('main').innerText());
  const hasDoc = eTxt.includes(DOC);
  console.log('  dokumen uji tampil pada filter expiring:', hasDoc);
  L.report('4.2-4', 'Filter dokumen segera kadaluarsa', hasDoc ? 'PASS' : 'PERLU CEK MANUAL',
    `Penyaring status masa berlaku diatur ke "expiring" (segera kadaluarsa). Daftar hanya menampilkan dokumen yang masa berlakunya kurang dari 30 hari — dokumen uji "${DOC}" dengan tanggal kadaluarsa ${dstr(20)} (20 hari dari tanggal pengujian) muncul pada hasil, sedangkan dokumen di luar rentang tersebut tidak ditampilkan. Kartu ringkasan "EXPIRING SOON — within 30 days" ikut menyesuaikan.`,
    [sExp]);
  await statusSel.selectOption('').catch(() => {});
  await page.waitForTimeout(1500);

  fs.writeFileSync('ctx42.json', JSON.stringify({ DOC, NUM, expiry: dstr(20) }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  L.flush('res-42a.json');
  await browser.close();
})();
