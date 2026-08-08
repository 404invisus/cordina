// Tangkapan layar tambahan untuk Buku Panduan Penggunaan ConnectOne.
// Melengkapi modul yang belum terpotret pada pengujian UAT sebelumnya.
// Jalankan: node m_panduan_shots.js
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

  // ============ sesi 1: peran kepala_balai (menu ruang kerja lengkap) ======
  const page = await ctx.newPage();
  L.watch(page, 'panduan-po');
  await L.loginOk(page, 'po@test.com');

  await L.go(page, '/daily-brief');
  await L.shot(page, P('daily-brief'));

  await L.go(page, '/storage');
  await L.shot(page, P('storage'));

  await L.go(page, '/assets');
  await L.shot(page, P('assets'));

  await L.go(page, '/settings');
  await L.shot(page, P('settings-profile'));

  await L.go(page, '/notifications');
  await L.shot(page, P('notifications'));
  const openedPrefs = await clickText(page, 'Preferences');
  if (openedPrefs) {
    await page.waitForTimeout(1200);
    await L.settle(page, 15000);
    await L.shot(page, P('notif-preferences'));
  } else {
    console.log('  [!] tombol Preferences tidak ditemukan');
  }

  // roadmap: dipotret belakangan, perlu daftar id proyek dari sesi admin

  // ============ sesi 2: peran administrator ===============================
  const admin = await ctx.newPage();
  L.watch(admin, 'panduan-admin');
  await L.loginOk(admin, 'admin@test.com');

  for (const [route, name] of [
    ['/admin/user-groups', 'admin-user-groups'],
    ['/admin/projects', 'admin-projects'],
    ['/admin/calendar', 'admin-calendar'],
    ['/admin/telegram', 'admin-telegram'],
  ]) {
    await L.go(admin, route);
    await L.shot(admin, P(name));
  }

  // monitor beban kerja: cari kombinasi proyek+sprint yang ada datanya
  await L.go(admin, '/admin/workload');
  const projSel = admin.locator('select').first();
  const projects = (await projSel.locator('option').evaluateAll((os) =>
    os.map((o) => ({ id: o.value, name: o.textContent.trim() })))).filter((o) => o.id);

  let picked = null;
  for (const p of projects) {
    await projSel.selectOption(p.id);
    await admin.waitForTimeout(2000);
    await L.settle(admin, 20000);
    const sprintSel = admin.locator('select').nth(1);
    const sprints = (await sprintSel.locator('option').evaluateAll((os) =>
      os.map((o) => ({ v: o.value, t: o.textContent.trim() })))).filter((o) => o.v);
    for (const s of sprints) {
      await sprintSel.selectOption(s.v);
      await admin.waitForTimeout(2000);
      await L.settle(admin, 20000);
      const ok = await admin.evaluate(() =>
        !/No active sprint|No workload data|Select a sprint/i.test(document.body.innerText));
      if (ok) { picked = `${p.name} / ${s.t}`; break; }
    }
    if (picked) break;
  }
  console.log('  [info] beban kerja:', picked || 'tidak ada data, dipotret apa adanya');
  await L.shot(admin, P('admin-workload'));

  // ---- roadmap: pakai id proyek dari dropdown admin, dibuka sebagai kepala_balai
  for (const p of projects) {
    await L.go(page, `/projects/${p.id}/roadmap`);
    const n = await page.evaluate(() => {
      const m = document.body.innerText.match(/(\d+)\s+sprint/i);
      return m ? parseInt(m[1], 10) : 0;
    });
    if (n > 0) {
      await L.shot(page, P('roadmap'));
      console.log('  [info] roadmap:', p.name);
      break;
    }
  }

  await browser.close();
  console.log('\nselesai.');
})();
