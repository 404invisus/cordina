const L = require('./lib');
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('ctx35.json', 'utf8'));

// Click a button by label inside the CR card that carries `title`.
async function clickInCard(page, title, label) {
  return await page.evaluate(({ title, label }) => {
    const els = Array.from(document.querySelectorAll('*'));
    const titleEl = els.find((e) => e.children.length === 0 && (e.textContent || '').trim() === title);
    if (!titleEl) return 'judul tidak ditemukan';
    let cur = titleEl;
    for (let i = 0; i < 8 && cur; i++) {
      cur = cur.parentElement;
      if (!cur) break;
      const btn = Array.from(cur.querySelectorAll('button')).find((b) => b.innerText.trim() === label);
      if (btn) { btn.click(); return 'diklik'; }
    }
    return 'tombol "' + label + '" tidak ada di kartu';
  }, { title, label });
}

(async () => {
  const { browser } = await L.launch();

  // ---------- Submit kedua draft sebagai pengaju ----------
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = L.watch(page, 'submit');
    await L.loginOk(page, 'po@test.com');
    await L.go(page, '/change-management');
    const sDraft = await L.shotFull(page, '3.5.1-1d_cr-status-draft');

    for (const t of [C.CR_SIGN, C.CR_REJ]) {
      const r = await clickInCard(page, t, 'Submit');
      console.log(`  submit "${t}": ${r}`);
      await page.waitForTimeout(3500);
      await L.settle(page, 20000);
    }
    const sSubmitted = await L.shotFull(page, '3.5.1-1e_cr-setelah-submit');
    console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).join(' | ') || 'tidak ada');
    fs.writeFileSync('submit-shots.json', JSON.stringify({ sDraft, sSubmitted }));
    await ctx.close();
  }

  await browser.close();
})();
