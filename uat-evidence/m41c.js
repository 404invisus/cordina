const L = require('./lib');
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('ctx34.json', 'utf8'));
const S = JSON.parse(fs.readFileSync('ctx41.json', 'utf8'));

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm41c');
  await L.loginOk(page, 'po@test.com');
  await L.go(page, C.detailUrl);
  await page.locator('button:has-text("Sprints")').first().click();
  await page.waitForTimeout(2200);
  await L.settle(page, 15000);
  const sBefore = await L.shotFull(page, '4.1-5a_sprint-aktif-sebelum-selesai');

  page.on('dialog', (d) => d.accept());
  await page.locator('main button:has-text("Complete")').first().click();
  await page.waitForTimeout(2500);
  // konfirmasi bila muncul modal
  const confirm = await page.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find((x) => {
      if (!/complete|selesai|confirm|ya|yes/i.test(x.innerText.trim()) || x.disabled) return false;
      const row = x.parentElement;
      return row && Array.from(row.querySelectorAll('button')).some((y) => /cancel|batal/i.test(y.innerText.trim()));
    });
    if (!b) return 'tanpa modal konfirmasi';
    b.click(); return 'dikonfirmasi';
  });
  console.log('  konfirmasi:', confirm);
  await page.waitForTimeout(4000);
  await L.settle(page, 20000);
  const sAfter = await L.shotFull(page, '4.1-5b_sprint-selesai');
  const txt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  const status = txt.find((t) => /completed|selesai|closed|finished/i.test(t)) || '(tidak ditemukan)';
  console.log('  status sprint:', JSON.stringify(txt.slice(10, 22)));
  console.log('  penanda selesai:', status);

  fs.writeFileSync('ctx41c.json', JSON.stringify({ status, txt: txt.slice(10, 22), sBefore, sAfter }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  await browser.close();
})();
