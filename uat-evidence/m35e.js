const L = require('./lib');
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('ctx35.json', 'utf8'));
const S = JSON.parse(fs.readFileSync('submit-shots.json', 'utf8'));

// Click a labelled button inside the CR card that carries `title`.
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
    return `tombol "${label}" tidak ada di kartu`;
  }, { title, label });
}

(async () => {
  const { browser } = await L.launch();

  // ============ 3.5.2-1 Setujui CR ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = L.watch(page, 'approve');
    await L.loginOk(page, 'sm@test.com');
    await L.go(page, '/change-management');
    await page.locator('button:has-text("Awaiting me")').first().click().catch(() => {});
    await page.waitForTimeout(2500);
    await L.settle(page, 20000);
    const sBefore = await L.shotFull(page, '3.5.2-1a_cr-menunggu-persetujuan');

    console.log('  approve:', await clickInCard(page, C.CR_SIGN, 'Approve'));
    await page.waitForTimeout(2000);
    const note = page.locator('textarea:visible').first();
    if (await note.count()) await note.fill('Disetujui. Perubahan sesuai prosedur dan risiko telah dimitigasi.').catch(() => {});
    const sNote = await L.shot(page, '3.5.2-1b_form-persetujuan');
    for (const s of ['button:has-text("Approve")', 'button:has-text("Confirm")', 'button:has-text("Submit")']) {
      const b = page.locator(s).last();
      if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); break; }
    }
    await page.waitForTimeout(4500);
    await L.settle(page, 20000);
    const sAfter = await L.shotFull(page, '3.5.2-1c_status-setelah-disetujui');
    console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).join(' | ') || 'tidak ada');
    fs.writeFileSync('approve-shots.json', JSON.stringify({ sBefore, sNote, sAfter }));
    await ctx.close();
  }

  // ============ 3.5.2-2 Tolak CR ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = L.watch(page, 'reject');
    await L.loginOk(page, 'pdm@test.com');
    await L.go(page, '/change-management');
    await page.locator('button:has-text("Awaiting me")').first().click().catch(() => {});
    await page.waitForTimeout(2500);
    await L.settle(page, 20000);
    const sBefore = await L.shotFull(page, '3.5.2-2a_cr-sebelum-ditolak');

    console.log('  reject:', await clickInCard(page, C.CR_REJ, 'Reject'));
    await page.waitForTimeout(2000);
    const note = page.locator('textarea:visible').first();
    if (await note.count()) await note.fill('Ditolak. Rencana rollback belum memadai dan jadwal bertabrakan dengan layanan.').catch(() => {});
    const sNote = await L.shot(page, '3.5.2-2b_form-penolakan');
    for (const s of ['button:has-text("Reject")', 'button:has-text("Confirm")', 'button:has-text("Submit")']) {
      const b = page.locator(s).last();
      if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); break; }
    }
    await page.waitForTimeout(4500);
    await L.settle(page, 20000);
    const sAfter = await L.shotFull(page, '3.5.2-2c_status-ditolak');
    console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).join(' | ') || 'tidak ada');
    fs.writeFileSync('reject-shots.json', JSON.stringify({ sBefore, sNote, sAfter }));
    await ctx.close();
  }

  // ============ 3.5.3-1 audit trail (khusus CR_SIGN) + 3.5.4-1 filter ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    L.watch(page, 'audit');
    await L.loginOk(page, 'po@test.com');
    await L.go(page, '/change-management');
    console.log('  view progress:', await clickInCard(page, C.CR_SIGN, 'View progress'));
    await page.waitForTimeout(3000);
    await L.settle(page, 20000);
    const sHist = await L.shotFull(page, '3.5.3-1_riwayat-audit-trail');
    const hist = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
    const i = hist.findIndex((h) => h.includes(C.CR_SIGN));
    console.log('  potongan riwayat CR_SIGN:', JSON.stringify(hist.slice(i, i + 22)));
    fs.writeFileSync('audit-shots.json', JSON.stringify({ sHist, hist: hist.slice(i, i + 22) }));

    await L.go(page, '/change-management');
    const sAll = await L.shotFull(page, '3.5.4-1a_daftar-sebelum-filter');
    const before = (await page.locator('main').innerText()).match(/(\d+) results?/);
    await page.locator('button:has-text("Closed")').first().click().catch(() => {});
    await page.waitForTimeout(2500);
    await L.settle(page, 20000);
    const after = (await page.locator('main').innerText()).match(/(\d+) results?/);
    const sFiltered = await L.shotFull(page, '3.5.4-1b_daftar-terfilter');
    console.log(`  jumlah hasil: semua=${before ? before[1] : '?'} -> Closed=${after ? after[1] : '?'}`);
    fs.writeFileSync('filter-shots.json', JSON.stringify({ sAll, sFiltered, before: before && before[1], after: after && after[1] }));
    await ctx.close();
  }

  await browser.close();
})();
