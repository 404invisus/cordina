const L = require('./lib');
const fs = require('fs');
const PASSPHRASE = process.env.TTE_PASSPHRASE;
const U = JSON.parse(fs.readFileSync('esign-ui.json', 'utf8'));

(async () => {
  const browser = await require('playwright').chromium.launch({ args: ['--no-sandbox'] });

  // ===== 3.6.3-1 Verifikasi keaslian dokumen TTE =====
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    const page = await ctx.newPage();
    const errs = L.watch(page, 'verify');
    const vresp = [];
    page.on('response', async (r) => {
      if (r.url().includes('verify')) { let b = ''; try { b = (await r.text()).slice(0, 400); } catch (e) {} vresp.push({ s: r.status(), b }); }
    });
    await L.loginOk(page, 'pm@test.com');
    await L.go(page, '/esign');
    const sBefore = await L.shot(page, '3.6.3-1a_daftar-dokumen-tte');

    await page.locator('main button:has-text("Verify"), main a:has-text("Verify")').first().click();
    console.log('  menunggu hasil verifikasi ...');
    await page.waitForTimeout(20000);
    await L.settle(page, 40000);
    const sAfter = await L.shotFull(page, '3.6.3-1b_hasil-verifikasi');
    const vtxt = (await page.locator('body').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
    console.log('  respons verify:', JSON.stringify(vresp).slice(0, 500));
    console.log('  teks halaman:', JSON.stringify(vtxt.slice(0, 30)));
    fs.writeFileSync('verify-result.json', JSON.stringify({ vresp, vtxt: vtxt.slice(0, 30), shots: [sBefore, sAfter] }, null, 2));
    console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 5).join(' | ') || 'tidak ada');
    await ctx.close();
  }

  // ===== 3.6.2-1 Multi penanda tangan berurutan: tanda tangani sebagai penandatangan ke-1 =====
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
    const page = await ctx.newPage();
    const errs = L.watch(page, 'multi');
    await L.loginOk(page, 'po@test.com');            // Kepala Balai = urutan 1
    await L.go(page, '/tte-sign');
    const sList = await L.shotFull(page, '3.6.2-1a_daftar-esign-multi-pihak');

    await page.locator('text=tes dokumen UAT').first().click();
    await page.waitForTimeout(2500);
    await L.settle(page, 15000);
    const sDetail = await L.shotFull(page, '3.6.2-1b_urutan-penandatangan');
    const btns = [...new Set((await page.locator('button:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean))];
    console.log('  tombol pada detail:', JSON.stringify(btns.slice(0, 18)));

    // cari tombol tanda tangan
    let opened = false;
    for (const s of ['button:has-text("Sign")', 'button:has-text("Tanda")']) {
      const b = page.locator(s).first();
      if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); opened = true; break; }
    }
    console.log('  dialog tanda tangan dibuka:', opened);
    await page.waitForTimeout(2000);
    const pass = page.locator('input[type="password"]:visible').first();
    if (await pass.count()) {
      await pass.fill(PASSPHRASE);
      const sSign = await L.shot(page, '3.6.2-1c_dialog-tanda-tangan');
      const clicked = await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => {
          if (!/sign|tanda/i.test(x.innerText.trim()) || x.disabled) return false;
          const row = x.parentElement;
          return row && Array.from(row.querySelectorAll('button')).some((y) => /cancel|batal/i.test(y.innerText.trim()));
        });
        if (!b) return 'tidak ditemukan';
        b.click(); return 'diklik';
      });
      console.log('  konfirmasi:', clicked);
      try {
        await page.waitForSelector('input[type="password"]', { state: 'detached', timeout: 180000 });
        console.log('  dialog tertutup (selesai)');
      } catch (e) { console.log('  dialog masih terbuka'); }
      await page.waitForTimeout(4000);
    } else {
      console.log('  tidak ada input passphrase pada detail ini');
    }
    await L.settle(page, 20000);
    await L.go(page, '/tte-sign');
    const sAfter = await L.shotFull(page, '3.6.2-1d_setelah-penandatangan-pertama');
    const atxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
    console.log('  status setelah:', JSON.stringify(atxt.slice(0, 16)));
    fs.writeFileSync('multi-sign-result.json', JSON.stringify({ atxt: atxt.slice(0, 16), shots: [sList, sDetail, sAfter] }, null, 2));
    console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 5).join(' | ') || 'tidak ada');
    await ctx.close();
  }

  await browser.close();
})();
