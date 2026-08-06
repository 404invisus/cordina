const L = require('./lib');
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('ctx42.json', 'utf8'));
const NEWDESC = 'Deskripsi diperbarui pada pengujian UAT (edit metadata).';
const NEWNUM = C.NUM + '-REV1';

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
    return `ikon "${iconTitle}" tidak ada`;
  }, { title, iconTitle });
}

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm42d');
  await L.loginOk(page, 'admin@test.com');
  await L.go(page, '/documents');

  console.log('  buka Edit:', await rowIcon(page, C.DOC, 'Edit'));
  await page.waitForTimeout(2500);
  const heading = await page.locator('h2,h3').allInnerTexts().catch(() => []);
  console.log('  judul modal:', JSON.stringify(heading.slice(0, 4)));

  // periksa isian yang terisi otomatis
  const state = await page.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map((i) => ({ ph: i.placeholder, v: i.value }));
    const sels = Array.from(document.querySelectorAll('select')).map((s) => s.value);
    const save = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim() === 'Save');
    return { inputs: inputs.slice(0, 8), sels, saveDisabled: save ? save.disabled : 'tidak ada tombol Save' };
  });
  console.log('  isian modal:', JSON.stringify(state));

  // isi ulang field wajib bila kosong
  if (!state.sels[0]) { await page.locator('select:visible').first().selectOption('SOP').catch(() => {}); console.log('  kategori diisi ulang'); }
  await page.fill('input[placeholder="e.g. SK/2026/019"]', NEWNUM).catch(() => {});
  const ta = page.locator('textarea:visible').first();
  if (await ta.count()) await ta.fill(NEWDESC).catch(() => {});
  await page.waitForTimeout(700);
  const sEdit = await L.shotFull(page, '4.2-5a_form-edit-dokumen');

  const after = await page.evaluate(() => {
    const save = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim() === 'Save');
    if (!save) return 'tidak ada tombol Save';
    if (save.disabled) return 'tombol Save NONAKTIF';
    save.click(); return 'diklik';
  });
  console.log('  simpan:', after);
  await page.waitForTimeout(4500);
  await L.settle(page, 20000);
  const saved = (await page.locator('main').innerText()).includes(NEWNUM);
  const sEdited = await L.shotFull(page, '4.2-5b_metadata-tersimpan');
  console.log('  nomor baru tampil:', saved);

  fs.writeFileSync('ctx42edit.json', JSON.stringify({ saved, NEWNUM, NEWDESC, sEdit, sEdited }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  await browser.close();
})();
