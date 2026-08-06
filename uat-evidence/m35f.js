const L = require('./lib');
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('ctx35.json', 'utf8'));

async function clickInCard(page, title, label) {
  return await page.evaluate(({ title, label }) => {
    const els = Array.from(document.querySelectorAll('*'));
    const t = els.find((e) => e.children.length === 0 && (e.textContent || '').trim() === title);
    if (!t) return 'judul tidak ditemukan';
    let cur = t;
    for (let i = 0; i < 8 && cur; i++) {
      cur = cur.parentElement;
      if (!cur) break;
      const b = Array.from(cur.querySelectorAll('button')).find((x) => x.innerText.trim() === label);
      if (b) { b.click(); return 'diklik'; }
    }
    return `tombol "${label}" tidak ada`;
  }, { title, label });
}

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'reject2');
  await L.loginOk(page, 'pdm@test.com');
  await L.go(page, '/change-management');
  await page.locator('button:has-text("Awaiting me")').first().click().catch(() => {});
  await page.waitForTimeout(2500);
  await L.settle(page, 20000);
  const sBefore = await L.shotFull(page, '3.5.2-2a_cr-sebelum-ditolak');

  console.log('  buka Reject:', await clickInCard(page, C.CR_REJ, 'Reject'));
  await page.waitForSelector('textarea[placeholder="Rejection note (required)"]', { timeout: 15000 });
  await page.fill('textarea[placeholder="Rejection note (required)"]',
    'Ditolak. Rencana rollback belum memadai dan waktu pelaksanaan bertabrakan dengan jadwal layanan.');
  await page.waitForTimeout(600);
  const sNote = await L.shot(page, '3.5.2-2b_form-penolakan');

  const confirm = page.locator('button:has-text("Reject CR")').first();
  console.log('  tombol "Reject CR" aktif:', await confirm.isEnabled().catch(() => false));
  await confirm.click();
  await page.waitForTimeout(4500);
  await L.settle(page, 20000);
  const sAfter = await L.shotFull(page, '3.5.2-2c_status-ditolak');
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).join(' | ') || 'tidak ada');
  fs.writeFileSync('reject-shots.json', JSON.stringify({ sBefore, sNote, sAfter }));
  await browser.close();
})();
