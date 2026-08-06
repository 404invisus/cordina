const L = require('./lib');
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('ctx38.json', 'utf8'));

async function openRowMenu(page, name) {
  return await page.evaluate((name) => {
    const els = Array.from(document.querySelectorAll('*'));
    const cell = els.find((e) => e.children.length === 0 && (e.textContent || '').trim() === name);
    if (!cell) return 'baris tidak ditemukan';
    let cur = cell;
    for (let i = 0; i < 8 && cur; i++) {
      cur = cur.parentElement;
      if (!cur) break;
      const btns = Array.from(cur.querySelectorAll('button'));
      if (btns.length) { btns[btns.length - 1].click(); return 'menu dibuka'; }
    }
    return 'tombol aksi tidak ditemukan';
  }, name);
}

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm38e');
  await L.loginOk(page, 'admin@test.com');

  // ===== 3.8.2-2 Reset privilege ke default =====
  await L.go(page, '/admin/users');
  console.log('menu:', await openRowMenu(page, C.NAME));
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Manage Privileges")').last().click().catch(() => {});
  await page.waitForTimeout(3000);
  await L.settle(page, 15000);
  const sBefore = await L.shotFull(page, '3.8.2-2a_sebelum-reset');

  page.once('dialog', (d) => d.accept());
  await page.locator('button:has-text("Reset ke default")').last().click().catch(() => {});
  await page.waitForTimeout(4000);
  await L.settle(page, 20000);
  const sAfter = await L.shotFull(page, '3.8.2-2b_setelah-reset');
  const modalTxt = (await page.locator('div.fixed').last().innerText().catch(() => '')).split('\n').map((s) => s.trim()).filter(Boolean);
  const stillOverridden = modalTxt.some((t) => /DIBERIKAN|DICABUT/i.test(t));
  console.log('  masih ada override setelah reset:', stillOverridden);
  await page.locator('button:has-text("Selesai")').last().click().catch(() => {});

  fs.writeFileSync('priv-reset.json', JSON.stringify({ stillOverridden, sBefore, sAfter }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  await browser.close();
})();
