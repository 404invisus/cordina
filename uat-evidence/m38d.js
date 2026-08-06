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

async function openPrivileges(page) {
  await L.go(page, '/admin/users');
  await openRowMenu(page, C.NAME);
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Manage Privileges")').last().click().catch(() => {});
  await page.waitForTimeout(3000);
  await L.settle(page, 15000);
}

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm38d');
  await L.loginOk(page, 'admin@test.com');

  // ===== 3.8.2-1 Kelola privilege tambahan =====
  await openPrivileges(page);
  const sBefore = await L.shotFull(page, '3.8.2-1a_kelola-privilege');

  // toggles are icon-only switch buttons (w-11 h-6 rounded-full), no text
  const toggles = page.locator('button.w-11.h-6');
  const n = await toggles.count();
  console.log('  jumlah toggle izin:', n);
  const flipped = [];
  for (let i = 0; i < Math.min(n, 2); i++) {
    await toggles.nth(i).scrollIntoViewIfNeeded().catch(() => {});
    await toggles.nth(i).click().catch(() => {});
    flipped.push(i);
    await page.waitForTimeout(1800);
  }
  console.log('  toggle diubah:', flipped.length);
  await L.settle(page, 15000);
  const sAfter = await L.shotFull(page, '3.8.2-1b_privilege-diubah');
  const bodyTxt = (await page.locator('div.fixed').last().innerText().catch(() => '')).split('\n').map((s) => s.trim()).filter(Boolean);
  const hasOverride = bodyTxt.some((t) => /DIBERIKAN|DICABUT/i.test(t));
  console.log('  penanda override tampil:', hasOverride);
  await page.locator('button:has-text("Selesai")').last().click().catch(() => {});
  await page.waitForTimeout(2000);

  fs.writeFileSync('priv-set.json', JSON.stringify({ n, flipped: flipped.length, hasOverride, sBefore, sAfter }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  await browser.close();
})();
