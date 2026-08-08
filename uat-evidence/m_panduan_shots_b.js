// Tangkapan layar susulan: tab Keamanan, burndown/velositas, ekspor beban kerja,
// dan detail proyek dengan tombol Roadmap yang baru ditambahkan.
const L = require('./lib');
const P = (n) => 'panduan-' + n;

async function clickText(page, text) {
  return await page.evaluate((t) => {
    const b = Array.from(document.querySelectorAll('button,a')).find(
      (x) => x.innerText.trim().toLowerCase() === t.toLowerCase() && !x.disabled);
    if (!b) return false;
    b.click();
    return true;
  }, text);
}

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  L.watch(page, 'susulan');
  await L.loginOk(page, 'po@test.com');

  // ---- 3.6 Ubah Kata Sandi: Settings -> Security ----
  await L.go(page, '/settings');
  if (await clickText(page, 'Security')) {
    await page.waitForTimeout(1200);
    await L.settle(page, 15000);
    await L.shot(page, P('settings-security'));
  } else {
    console.log('  [!] tab Security tidak ditemukan');
  }

  // ---- 8.x Beban Kerja: pilih proyek + sprint yang ada datanya ----
  await L.go(page, '/workload');
  const selects = page.locator('select');
  const nSel = await selects.count();
  console.log('  [info] jumlah dropdown workload:', nSel);

  let chosen = null;
  if (nSel > 0) {
    const projSel = selects.first();
    const projects = (await projSel.locator('option').evaluateAll((os) =>
      os.map((o) => ({ v: o.value, t: o.textContent.trim() })))).filter((o) => o.v);
    for (const p of projects) {
      await projSel.selectOption(p.v);
      await page.waitForTimeout(2000);
      await L.settle(page, 20000);
      const sprSel = page.locator('select').nth(1);
      const sprints = (await sprSel.locator('option').evaluateAll((os) =>
        os.map((o) => ({ v: o.value, t: o.textContent.trim() })))).filter((o) => o.v);
      for (const s of sprints) {
        await sprSel.selectOption(s.v);
        await page.waitForTimeout(2200);
        await L.settle(page, 20000);
        const info = await page.evaluate(() => ({
          txt: document.body.innerText,
          paths: document.querySelectorAll('svg path[d]').length,
        }));
        const hasChart = info.paths > 8 && !/No velocity data|Tidak ada data velositas/i.test(info.txt);
        console.log(`    ${p.t} / ${s.t}: svgpath=${info.paths} chart=${hasChart}`);
        if (hasChart) { chosen = `${p.t} / ${s.t}`; break; }
      }
      if (chosen) break;
    }
  }
  console.log('  [info] workload dipakai:', chosen || 'tidak ada data grafik');
  await L.shot(page, P('workload-charts'));

  // ekspor PDF beban kerja
  const dl = page.waitForEvent('download', { timeout: 45000 }).catch(() => null);
  await clickText(page, 'Export PDF');
  await page.waitForTimeout(1500);
  await L.shot(page, P('workload-export'));
  const d = await dl;
  console.log('  [info] unduhan:', d ? await d.suggestedFilename() : 'tidak terdeteksi');

  // ---- detail proyek dengan tombol Roadmap baru ----
  await L.go(page, '/projects');
  await page.locator('div.cursor-pointer').first().click();
  await page.waitForURL(/\/projects\/[0-9a-f-]+/i, { timeout: 25000 }).catch(() => {});
  await L.settle(page, 25000);
  await L.shot(page, P('project-detail-roadmap-btn'));
  console.log('  [info] detail proyek:', new URL(page.url()).pathname);

  await browser.close();
  console.log('\nselesai.');
})();
