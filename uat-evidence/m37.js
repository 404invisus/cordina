const L = require('./lib');
const fs = require('fs');
const TASK = JSON.parse(fs.readFileSync('task-href.json', 'utf8')).href;

(async () => {
  const { browser } = await L.launch();

  // ===== 3.7.1-1 & 3.7.2-1: tetapkan assignee -> notifikasi in-app + Telegram =====
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = L.watch(page, 'assign');
    await L.loginOk(page, 'po@test.com');
    await L.go(page, TASK);
    const sTask = await L.shot(page, '3.7.1-1a_detail-task');

    await page.locator('button:has-text("Assign")').first().click().catch(() => {});
    await page.waitForTimeout(2000);
    // pilih anggota proyek yang punya telegram_chat_id
    const rows = page.locator('div.cursor-pointer, button');
    let picked = '';
    for (const n of ['Scrum Master', 'Kepala Balai', 'Staff Satu']) {
      const el = page.locator(`text=${n}`).last();
      if (await el.count() && await el.isVisible().catch(() => false)) {
        await el.click().catch(() => {});
        picked = n;
        await page.waitForTimeout(700);
        break;
      }
    }
    console.log('  assignee dipilih:', picked || '(gagal)');
    const sPick = await L.shot(page, '3.7.1-1b_pilih-assignee');
    // konfirmasi
    for (const s of ['button:has-text("Assign")', 'button:has-text("Save")', 'button:has-text("Confirm")']) {
      const b = page.locator(s).last();
      if (await b.count() && await b.isEnabled().catch(() => false)) { await b.click().catch(() => {}); break; }
    }
    await page.waitForTimeout(4000);
    await L.settle(page, 20000);
    const sAssigned = await L.shot(page, '3.7.1-1c_task-ditetapkan');
    console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 5).join(' | ') || 'tidak ada');
    fs.writeFileSync('assign-ctx.json', JSON.stringify({ picked, shots: [sTask, sPick, sAssigned] }));
    await ctx.close();
  }

  // ===== 3.7.1-2 badge unread + 3.7.1-1 daftar notifikasi + 3.7.1-3 tandai dibaca =====
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = L.watch(page, 'notif');
    await L.loginOk(page, 'staff@test.com');
    // badge di sidebar sebelum dibuka
    const sideTxt = await page.locator('nav, aside').first().innerText().catch(() => '');
    const badge = (sideTxt.match(/Notifications\s*\n?\s*(\d+)/) || [])[1];
    console.log('  badge unread di sidebar:', badge);
    const sBadge = await L.shot(page, '3.7.1-2_badge-unread-sidebar');

    await L.go(page, '/notifications');
    const sList = await L.shotFull(page, '3.7.1-1d_daftar-notifikasi');
    const nTxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
    console.log('  isi notifikasi:', JSON.stringify(nTxt.slice(0, 26)));

    // 3.7.1-3 tandai semua dibaca
    await page.locator('button:has-text("Mark all as read")').first().click().catch(() => {});
    await page.waitForTimeout(3500);
    await L.settle(page, 20000);
    const sRead = await L.shotFull(page, '3.7.1-3_setelah-tandai-dibaca');
    const sideAfter = await page.locator('nav, aside').first().innerText().catch(() => '');
    const badgeAfter = (sideAfter.match(/Notifications\s*\n?\s*(\d+)/) || [])[1];
    console.log('  badge setelah ditandai dibaca:', badgeAfter === undefined ? '(hilang)' : badgeAfter);
    console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 5).join(' | ') || 'tidak ada');

    fs.writeFileSync('notif-ctx.json', JSON.stringify({
      badge, badgeAfter: badgeAfter === undefined ? null : badgeAfter,
      nTxt: nTxt.slice(0, 26), shots: { sBadge, sList, sRead },
    }, null, 2));
    await ctx.close();
  }

  await browser.close();
})();
