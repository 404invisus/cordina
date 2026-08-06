const L = require('./lib');
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('ctx35.json', 'utf8'));
const PASSPHRASE = process.env.TTE_PASSPHRASE;

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
  const errs = L.watch(page, 'm36b');
  const signResp = [];
  page.on('response', async (r) => {
    if (r.url().includes('/sign') || r.url().includes('esign')) {
      let b = ''; try { b = (await r.text()).slice(0, 400); } catch (e) {}
      signResp.push({ url: r.url().split('/api')[1] || r.url(), status: r.status(), body: b });
    }
  });

  await L.loginOk(page, 'pm@test.com');
  await L.go(page, '/change-management');
  const sBefore = await L.shotFull(page, '3.6.1-1a_cr-menunggu-tanda-tangan');

  console.log('  buka dialog Sign:', await clickInCard(page, C.CR_SIGN, 'Sign'));
  await page.waitForSelector('input[placeholder="Enter your e-Sign passphrase"]', { timeout: 20000 });
  await page.fill('input[placeholder="Enter your e-Sign passphrase"]', PASSPHRASE);
  await page.waitForTimeout(600);
  const sModal = await L.shot(page, '3.6.1-1b_dialog-tanda-tangan');

  // The modal's confirm button is also labelled "Sign"; disambiguate by
  // requiring a sibling "Cancel" button in the same row.
  const clicked = await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const sign = btns.find((b) => {
      if (b.innerText.trim() !== 'Sign' || b.disabled) return false;
      const row = b.parentElement;
      return row && Array.from(row.querySelectorAll('button')).some((x) => x.innerText.trim() === 'Cancel');
    });
    if (!sign) return 'tombol konfirmasi tidak ditemukan';
    sign.click();
    return 'diklik';
  });
  console.log('  konfirmasi tanda tangan:', clicked);

  console.log('  menunggu respons layanan BSrE (hingga 90 detik) ...');
  for (let i = 0; i < 18 && signResp.length === 0; i++) await page.waitForTimeout(5000);
  await L.settle(page, 30000);
  const sAfter = await L.shotFull(page, '3.6.1-1c_hasil-tanda-tangan');

  console.log('  respons endpoint sign:', JSON.stringify(signResp, null, 1).slice(0, 900));
  console.log('  HTTP errors:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  fs.writeFileSync('sign-result.json', JSON.stringify({ signResp, shots: [sBefore, sModal, sAfter] }, null, 2));
  await browser.close();
})();
