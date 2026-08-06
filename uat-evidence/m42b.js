const L = require('./lib');
const fs = require('fs');
const path = require('path');
const PDF = '/home/ymjsty/dev/agrawork/Test sign.pdf';
const DL = path.join(__dirname, 'downloads');
fs.mkdirSync(DL, { recursive: true });
const C = JSON.parse(fs.readFileSync('ctx42.json', 'utf8'));
const NEWDESC = 'Deskripsi diperbarui pada pengujian UAT (edit metadata).';

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

// open the row action menu for a document title
async function openRowMenu(page, title) {
  return await page.evaluate((title) => {
    const els = Array.from(document.querySelectorAll('*'));
    const cell = els.find((e) => e.children.length === 0 && (e.textContent || '').trim() === title);
    if (!cell) return 'baris tidak ditemukan';
    let cur = cell;
    for (let i = 0; i < 8 && cur; i++) {
      cur = cur.parentElement;
      if (!cur) break;
      const btns = Array.from(cur.querySelectorAll('button'));
      if (btns.length) { btns[btns.length - 1].click(); return 'menu dibuka: ' + btns.map((b) => b.innerText.trim() || '(ikon)').join(','); }
    }
    return 'tidak ada tombol';
  }, title);
}

(async () => {
  const browser = await require('playwright').chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm42b');
  await L.loginOk(page, 'admin@test.com');

  // ================= 4.2-5 Edit dokumen =================
  await L.go(page, '/documents');
  console.log('  menu baris:', await openRowMenu(page, C.DOC));
  await page.waitForTimeout(1800);
  const sMenu = await L.shot(page, '4.2-5a_menu-aksi-dokumen');
  const btnsNow = [...new Set((await page.locator('button:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean))];
  console.log('  tombol tersedia:', JSON.stringify(btnsNow.slice(0, 20)));

  await page.locator('button:has-text("Edit")').last().click().catch(() => {});
  await page.waitForTimeout(2500);
  const ta = page.locator('textarea:visible').first();
  if (await ta.count()) await ta.fill(NEWDESC).catch(() => {});
  const sEdit = await L.shotFull(page, '4.2-5b_form-edit-dokumen');
  console.log('  simpan:', await clickModalBtn(page, 'Save'));
  await page.waitForTimeout(4000);
  await L.settle(page, 20000);
  const sEdited = await L.shotFull(page, '4.2-5c_metadata-tersimpan');

  // ================= 4.2-6 Download file dokumen =================
  console.log('  menu baris:', await openRowMenu(page, C.DOC));
  await page.waitForTimeout(1500);
  let dlName = '', size = 0, isPdf = false;
  try {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 45000 }),
      page.locator('button:has-text("Download"), a:has-text("Download")').last().click(),
    ]);
    dlName = dl.suggestedFilename();
    const p = path.join(DL, dlName);
    await dl.saveAs(p);
    size = fs.statSync(p).size;
    isPdf = fs.readFileSync(p).slice(0, 4).toString() === '%PDF';
  } catch (e) { console.log('  unduh gagal:', String(e).slice(0, 120)); }
  console.log(`  unduhan: ${dlName} | ${size} bytes | PDF: ${isPdf}`);
  const sDl = await L.shot(page, '4.2-6_unduh-dokumen');

  fs.writeFileSync('ctx42b.json', JSON.stringify({ dlName, size, isPdf, NEWDESC,
    shots: { sMenu, sEdit, sEdited, sDl } }, null, 2));

  // ================= 4.3 STORAGE =================
  await L.go(page, '/storage');
  const sStore0 = await L.shotFull(page, '4.3-1a_storage-sebelum-upload');
  await page.locator('button:has-text("Upload")').first().click();
  await page.waitForTimeout(2000);
  await page.waitForSelector('input[type="file"]', { state: 'attached', timeout: 15000 });
  await page.locator('input[type="file"]').setInputFiles(PDF);
  await page.waitForTimeout(1500);
  const sPick = await L.shotFull(page, '4.3-1b_pilih-berkas');
  for (const t of ['Upload', 'Save', 'Confirm', 'Simpan']) {
    if ((await clickModalBtn(page, t)) === 'diklik') { console.log('  konfirmasi upload via:', t); break; }
  }
  await page.waitForTimeout(4500);
  await L.settle(page, 25000);
  const sUploaded = await L.shotFull(page, '4.3-1c_berkas-terunggah');
  const stTxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('  storage:', JSON.stringify(stTxt.slice(0, 24)));

  fs.writeFileSync('ctx43.json', JSON.stringify({ stTxt: stTxt.slice(0, 24), shots: { sStore0, sPick, sUploaded } }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  await browser.close();
})();
