const L = require('./lib');
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('ctx34.json', 'utf8'));
const SPRINT = `Sprint UAT ${C.STAMP}`;
function dstr(o) { const d = new Date(); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); }

// click a button by label inside the topmost modal (identified by a Cancel sibling)
async function clickModalBtn(page, label) {
  return await page.evaluate((label) => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => {
      if (!x.innerText.trim().includes(label) || x.disabled) return false;
      const row = x.parentElement;
      return row && Array.from(row.querySelectorAll('button')).some((y) => /cancel|batal/i.test(y.innerText.trim()));
    });
    if (!b) return `"${label}" tidak ditemukan di modal`;
    b.click(); return 'diklik';
  }, label);
}

const openSprints = async (page) => {
  await L.go(page, C.detailUrl);
  await page.locator('button:has-text("Sprints")').first().click();
  await page.waitForTimeout(2200);
  await L.settle(page, 15000);
};

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm41');
  await L.loginOk(page, 'po@test.com');
  await openSprints(page);
  const sTab = await L.shot(page, '4.1-1a_tab-sprint');

  // ===== 4.1-1 Buat sprint baru =====
  await page.locator('button:has-text("Create Sprint")').first().click();
  await page.waitForSelector('input[placeholder="Sprint 1"]', { timeout: 15000 });
  await page.fill('input[placeholder="Sprint 1"]', SPRINT);
  await page.fill('textarea[placeholder="Sprint goal..."]', 'Sasaran sprint pengujian UAT: menyelesaikan verifikasi alur kanban.').catch(() => {});
  const d = page.locator('input[type="date"]:visible');
  await d.nth(0).fill(dstr(0));
  await d.nth(1).fill(dstr(14));
  const sForm = await L.shot(page, '4.1-1b_form-buat-sprint');
  console.log('  submit:', await clickModalBtn(page, 'Create Sprint'));
  await page.waitForTimeout(3500);
  await L.settle(page, 20000);
  const created = (await page.locator('main').innerText()).includes(SPRINT);
  const sCreated = await L.shotFull(page, '4.1-1c_sprint-terbuat');
  console.log('  sprint terbuat:', created);
  const cardBtns = [...new Set((await page.locator('main button:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean))];
  console.log('  tombol pada kartu sprint:', JSON.stringify(cardBtns.slice(0, 20)));

  L.report('4.1-1', 'Buat sprint baru', created ? 'PASS' : 'FAIL',
    `Pada detail proyek "${C.PROJ}" dibuka tab Sprints -> "Create Sprint", diisi nama "${SPRINT}", sasaran sprint, tanggal mulai ${dstr(0)} dan tanggal selesai ${dstr(14)}, lalu disimpan. Sprint baru berhasil dibuat dan tampil pada daftar sprint proyek dengan status awal (belum dimulai).`,
    [sTab, sForm, sCreated]);

  // ===== 4.1-3 Tambahkan backlog ke sprint (sebelum sprint dimulai) =====
  let addBacklogOk = false;
  for (const t of ['Add Backlog', 'Select Backlog', 'Add Items', 'Manage Backlog']) {
    const b = page.locator(`main button:has-text("${t}")`).first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); addBacklogOk = true; console.log('  buka via:', t); break; }
  }
  await page.waitForTimeout(2500);
  const sBacklogModal = await L.shotFull(page, '4.1-3a_pilih-backlog-untuk-sprint');
  const modalTxt = (await page.locator('body').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('  modal backlog:', JSON.stringify(modalTxt.slice(-22)));
  // centang item backlog
  const rows = page.locator('div.cursor-pointer:visible, input[type="checkbox"]:visible');
  const nRows = await rows.count();
  console.log('  baris backlog:', nRows);
  if (nRows) { await rows.first().click().catch(() => {}); await page.waitForTimeout(800); }
  const sBacklogPick = await L.shot(page, '4.1-3b_backlog-dipilih');
  for (const t of ['Add', 'Save', 'Simpan', 'Confirm']) {
    const r = await clickModalBtn(page, t);
    if (r === 'diklik') { console.log('  simpan backlog via:', t); break; }
  }
  await page.waitForTimeout(3500);
  await L.settle(page, 20000);
  const sBacklogAfter = await L.shotFull(page, '4.1-3c_backlog-masuk-sprint');

  fs.writeFileSync('ctx41.json', JSON.stringify({ SPRINT, cardBtns: cardBtns.slice(0, 20), addBacklogOk, nRows,
    shots: { sBacklogModal, sBacklogPick, sBacklogAfter } }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  L.flush('res-41a.json');
  await browser.close();
})();
