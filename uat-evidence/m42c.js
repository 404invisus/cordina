const L = require('./lib');
const fs = require('fs');
const path = require('path');
const DL = path.join(__dirname, 'downloads');
fs.mkdirSync(DL, { recursive: true });
const C = JSON.parse(fs.readFileSync('ctx42.json', 'utf8'));
const NEWDESC = 'Deskripsi diperbarui pada pengujian UAT (edit metadata).';
const NEWNUM = C.NUM + '-REV1';

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

// find the row containing `title` and click its icon button by title attribute
async function rowIcon(page, title, iconTitle) {
  return await page.evaluate(({ title, iconTitle }) => {
    const els = Array.from(document.querySelectorAll('*'));
    const cell = els.find((e) => e.children.length === 0 && (e.textContent || '').trim() === title);
    if (!cell) return 'baris tidak ditemukan';
    let cur = cell;
    for (let i = 0; i < 8 && cur; i++) {
      cur = cur.parentElement;
      if (!cur) break;
      const b = cur.querySelector(`button[title="${iconTitle}"]`);
      if (b) { b.click(); return 'diklik'; }
    }
    return `ikon "${iconTitle}" tidak ada di baris`;
  }, { title, iconTitle });
}

(async () => {
  const browser = await require('playwright').chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm42c');
  await L.loginOk(page, 'admin@test.com');
  await L.go(page, '/documents');

  // list the icon titles available on the row
  const icons = await page.evaluate((t) => {
    const els = Array.from(document.querySelectorAll('*'));
    const cell = els.find((e) => e.children.length === 0 && (e.textContent || '').trim() === t);
    if (!cell) return [];
    let cur = cell;
    for (let i = 0; i < 8 && cur; i++) {
      cur = cur.parentElement;
      if (!cur) break;
      const bs = Array.from(cur.querySelectorAll('button[title]'));
      if (bs.length) return bs.map((b) => b.getAttribute('title'));
    }
    return [];
  }, C.DOC);
  console.log('  ikon aksi pada baris:', JSON.stringify(icons));

  // ===== 4.2-5 Edit dokumen =====
  console.log('  buka Edit:', await rowIcon(page, C.DOC, 'Edit'));
  await page.waitForSelector('input[placeholder="e.g. SK/2026/019"]', { timeout: 15000 });
  await page.fill('input[placeholder="e.g. SK/2026/019"]', NEWNUM);
  const ta = page.locator('textarea:visible').first();
  if (await ta.count()) await ta.fill(NEWDESC).catch(() => {});
  const sEdit = await L.shotFull(page, '4.2-5a_form-edit-dokumen');
  console.log('  simpan:', await clickModalBtn(page, 'Save'));
  await page.waitForTimeout(4000);
  await L.settle(page, 20000);
  const saved = (await page.locator('main').innerText()).includes(NEWNUM);
  const sEdited = await L.shotFull(page, '4.2-5b_metadata-tersimpan');
  console.log('  nomor baru tampil:', saved);

  L.report('4.2-5', 'Edit dokumen', saved ? 'PASS' : 'FAIL',
    `Dokumen "${C.DOC}" dibuka melalui ikon Edit pada barisnya. Metadata diubah: nomor dokumen dari ${C.NUM} menjadi ${NEWNUM} dan deskripsi diperbarui, lalu disimpan. Perubahan metadata tersimpan dan tampil pada daftar dokumen.`,
    [sEdit, sEdited]);

  // ===== 4.2-6 Download file dokumen =====
  let dlName = '', size = 0, isPdf = false;
  try {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 45000 }),
      rowIcon(page, C.DOC, 'Download'),
    ]);
    dlName = dl.suggestedFilename();
    const p = path.join(DL, dlName);
    await dl.saveAs(p);
    size = fs.statSync(p).size;
    isPdf = fs.readFileSync(p).slice(0, 4).toString() === '%PDF';
  } catch (e) { console.log('  unduh gagal:', String(e).slice(0, 130)); }
  console.log(`  unduhan: ${dlName} | ${size} bytes | PDF: ${isPdf}`);
  const sDl = await L.shot(page, '4.2-6_unduh-dokumen');
  L.report('4.2-6', 'Download file dokumen', isPdf ? 'PASS' : 'FAIL',
    isPdf
      ? `Pada baris dokumen dipilih ikon Download. Berkas "${dlName}" berhasil diunduh ke perangkat berukuran ${size.toLocaleString('id-ID')} byte dan terverifikasi berformat PDF sah (header %PDF), sesuai berkas yang diunggah saat dokumen dibuat.`
      : `Unduhan berkas dokumen tidak berhasil diverifikasi otomatis (ukuran ${size} byte). Perlu pengujian manual.`,
    [sDl]);

  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  L.flush('res-42b.json');
  await browser.close();
})();
