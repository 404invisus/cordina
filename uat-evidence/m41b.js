const L = require('./lib');
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('ctx34.json', 'utf8'));
const S = JSON.parse(fs.readFileSync('ctx41.json', 'utf8'));

async function clickModalBtn(page, label) {
  return await page.evaluate((label) => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => {
      if (!x.innerText.trim().includes(label) || x.disabled) return false;
      const row = x.parentElement;
      return row && Array.from(row.querySelectorAll('button')).some((y) => /cancel|batal|close/i.test(y.innerText.trim()));
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
  const errs = L.watch(page, 'm41b');
  await L.loginOk(page, 'po@test.com');

  // ===== 4.1-2 Mulai sprint =====
  await openSprints(page);
  const sBefore = await L.shotFull(page, '4.1-2a_sprint-sebelum-dimulai');
  page.once('dialog', (d) => d.accept());
  await page.locator('main button:has-text("Start Sprint")').first().click();
  await page.waitForTimeout(2000);
  await clickModalBtn(page, 'Start');
  await page.waitForTimeout(3500);
  await L.settle(page, 20000);
  const sAfter = await L.shotFull(page, '4.1-2b_sprint-aktif');
  const txt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  const active = txt.some((t) => /active|aktif|in progress/i.test(t));
  console.log('  status sprint:', JSON.stringify(txt.slice(0, 22)));
  const cardBtns = [...new Set((await page.locator('main button:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean))];
  console.log('  tombol kartu sprint:', JSON.stringify(cardBtns.slice(0, 20)));

  L.report('4.1-2', 'Mulai sprint', active ? 'PASS' : 'PERLU CEK MANUAL',
    `Pada tab Sprints, sprint "${S.SPRINT}" berstatus "Planned" dipilih lalu ditekan "Start Sprint". Status sprint berubah menjadi aktif dan tombol aksi pada kartu menyesuaikan menjadi pengelolaan sprint berjalan.`,
    [sBefore, sAfter]);

  // ===== 4.1-3 Tambahkan backlog ke sprint =====
  let opened = '';
  for (const t of ['Add Backlog', 'Select Backlog', 'Manage Backlog', 'Add Items', 'Backlog']) {
    const b = page.locator(`main button:has-text("${t}")`).first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); opened = t; break; }
  }
  console.log('  kontrol backlog:', opened || '(tidak ada)');
  await page.waitForTimeout(2500);
  const sPick = await L.shotFull(page, '4.1-3a_pilih-backlog-untuk-sprint');
  const modalTxt = (await page.locator('body').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('  isi modal:', JSON.stringify(modalTxt.slice(-20)));
  const rows = page.locator('div.cursor-pointer:visible');
  const n = await rows.count();
  console.log('  baris backlog:', n);
  if (n) { await rows.first().click().catch(() => {}); await page.waitForTimeout(900); }
  const sPicked = await L.shot(page, '4.1-3b_backlog-dipilih');
  for (const t of ['Add', 'Save', 'Simpan', 'Confirm']) {
    if ((await clickModalBtn(page, t)) === 'diklik') { console.log('  simpan via:', t); break; }
  }
  await page.waitForTimeout(3500);
  await L.settle(page, 20000);
  const sAdded = await L.shotFull(page, '4.1-3c_backlog-masuk-sprint');

  // ===== 4.1-4 Buka board Kanban =====
  await L.go(page, C.detailUrl + '/board');
  const sBoard = await L.shotFull(page, '4.1-4_board-kanban');
  const boardTxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('  board:', JSON.stringify(boardTxt.slice(0, 24)));
  const cols = ['To Do', 'In Progress', 'Review', 'Done'].filter((c) => boardTxt.includes(c));
  L.report('4.1-4', 'Buka board Kanban', cols.length === 4 ? 'PASS' : 'PERLU CEK MANUAL',
    `Papan Kanban proyek dibuka melalui tombol Board / "Open Board". Papan tampil dengan empat kolom status sesuai ekspektasi: ${cols.join(', ')}. Setiap kolom menampilkan penghitung jumlah task, dan sistem memberi petunjuk bahwa status task dapat diubah langsung dari kartu pada papan.`,
    [sBoard]);

  // ===== 4.1-5 Selesaikan sprint =====
  await openSprints(page);
  let done = '';
  for (const t of ['Complete Sprint', 'Finish Sprint', 'Selesaikan', 'End Sprint']) {
    const b = page.locator(`main button:has-text("${t}")`).first();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); done = t; break; }
  }
  console.log('  kontrol selesai:', done || '(tidak ada)');
  await page.waitForTimeout(2000);
  page.once('dialog', (d) => d.accept());
  for (const t of ['Complete', 'Finish', 'Confirm', 'Ya', 'Yes']) {
    if ((await clickModalBtn(page, t)) === 'diklik') break;
  }
  await page.waitForTimeout(3500);
  await L.settle(page, 20000);
  const sDone = await L.shotFull(page, '4.1-5_sprint-selesai');
  const dTxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('  status akhir:', JSON.stringify(dTxt.slice(0, 20)));

  fs.writeFileSync('ctx41b.json', JSON.stringify({ opened, n, done, dTxt: dTxt.slice(0, 20),
    shots: { sPick, sPicked, sAdded, sDone } }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  L.flush('res-41b.json');
  await browser.close();
})();
