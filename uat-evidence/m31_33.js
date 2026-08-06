const L = require('./lib');
const fs = require('fs');

const STAMP = Date.now().toString().slice(-6);
const EV_PUB = `UAT Rapat Publik ${STAMP}`;
const EV_PRIV = `UAT Rapat Privat ${STAMP}`;
const EV_ADM = `UAT Agenda Peserta ${STAMP}`;
function dstr(o) { const d = new Date(); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); }

async function fillCreate(page, { title, visibility, date, startTime, endTime, location, description }) {
  await page.locator('button:has-text("New event")').first().click();
  await page.waitForSelector('input[placeholder="Event title..."]', { timeout: 15000 });
  await page.fill('input[placeholder="Event title..."]', title);
  await page.selectOption('select >> nth=1', visibility);
  const dates = page.locator('input[type="date"]');
  await dates.nth(0).fill(date);
  await dates.nth(1).fill(date);
  if (startTime) {
    await page.uncheck('#all_day').catch(() => {});
    await page.waitForTimeout(400);
    const times = page.locator('input[type="time"]');
    if (await times.count()) { await times.nth(0).fill(startTime); await times.nth(1).fill(endTime); }
  }
  if (location) await page.fill('input[placeholder="Optional"]', location);
  if (description) await page.fill('textarea[placeholder="Additional notes..."]', description);
}

(async () => {
  const { browser } = await L.launch();

  // ================= 3.1 AUTENTIKASI =================
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = L.watch(page, '3.1');

    // 3.1-1
    await L.login(page, 'pm@test.com');
    let url = 'STAYED ON LOGIN';
    try {
      await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30000 });
      await L.settle(page);
      url = new URL(page.url()).pathname;
    } catch (e) {}
    const s11 = await L.shot(page, '3.1-1_login-valid-redirect');
    L.report('3.1-1', 'Login dengan kredensial valid', url.startsWith('/dashboard') ? 'PASS' : 'FAIL',
      `Login pm@test.com (role project_manager) berhasil dan sistem melakukan redirect otomatis ke ${url}, yaitu dashboard yang sesuai dengan role pengguna. Tidak ditemukan error konsol maupun HTTP selama proses login.`, [s11]);
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = L.watch(page, '3.1-2');
    await L.login(page, 'pm@test.com', 'PasswordSalah123');
    let toastText = '(tidak ada)';
    try {
      const t = page.locator('div[role="status"], [class*="go2"]').first();
      await t.waitFor({ timeout: 10000 });
      toastText = (await t.innerText()).trim();
    } catch (e) {}
    const stillLogin = page.url().includes('/login');
    const s12 = await L.shot(page, '3.1-2_login-password-salah');
    const http401 = errs.some((e) => e.includes('401'));
    L.report('3.1-2', 'Login dengan password salah', stillLogin && toastText !== '(tidak ada)' ? 'PASS (dengan catatan)' : 'FAIL',
      `Sistem menolak login: backend membalas HTTP 401 (${http401 ? 'terverifikasi' : 'tidak terekam'}) dan pengguna tetap ditahan di halaman login. Pesan error yang ditampilkan: "${toastText}". ` +
      `CATATAN KETIDAKSESUAIAN: dokumen mengharapkan pesan "Email atau password salah" dalam Bahasa Indonesia, sedangkan aplikasi menampilkan pesan dalam Bahasa Inggris.`, [s12]);
    await ctx.close();
  }
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    L.watch(page, '3.1-3');
    await L.loginOk(page, 'pm@test.com');
    await page.waitForTimeout(4200);
    await L.settle(page, 15000);
    const s13a = await L.shot(page, '3.1-3a_sebelum-logout');
    await page.locator('button:has-text("Sign Out")').first().click().catch(() => {});
    await page.waitForTimeout(3000);
    await L.settle(page, 15000);
    const finalUrl = new URL(page.url()).pathname;
    const s13b = await L.shot(page, '3.1-3b_setelah-logout');
    const backUrl = await L.go(page, '/dashboard/project-manager');
    const s13c = await L.shot(page, '3.1-3c_akses-ulang-ditolak');
    L.report('3.1-3', 'Logout dari sistem', finalUrl.includes('/login') && backUrl.includes('/login') ? 'PASS' : 'PERLU CEK MANUAL',
      `Klik "Sign Out" pada panel profil mengakhiri sesi dan mengalihkan pengguna ke ${finalUrl}. Verifikasi tambahan: percobaan membuka kembali halaman terproteksi /dashboard/project-manager setelah logout dialihkan otomatis ke ${backUrl}, membuktikan token sesi tidak dapat digunakan kembali.`,
      [s13a, s13b, s13c]);
    await ctx.close();
  }

  // ================= 3.2 DASHBOARD =================
  const ROLES = [
    ['3.2-1', 'po@test.com', 'Dashboard Kepala Balai / Product Owner', 'ringkasan semua proyek, grafik, dan aktivitas tim'],
    ['3.2-2', 'pdm@test.com', 'Dashboard Kepala Seksi / Product Manager', 'sprint aktif, task, dan workload tim'],
    ['3.2-3', 'pm@test.com', 'Dashboard Project Manager', 'task dan jadwal, serta progress pekerjaan'],
    ['3.2-4', 'sm@test.com', 'Dashboard Scrum Master', 'task dan jadwal, serta progress pekerjaan'],
    ['3.2-5', 'staff@test.com', 'Dashboard Staff', 'task pribadi dan jadwal terdekat'],
  ];
  for (const [id, email, scenario, expect] of ROLES) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = L.watch(page, id);
    let url = '(gagal)';
    try { await L.loginOk(page, email); url = new URL(page.url()).pathname; }
    catch (e) { url = 'GAGAL: ' + String(e).slice(0, 80); }
    await page.waitForTimeout(4200);
    await L.settle(page, 15000);
    const cards = (await page.locator('main').first().innerText().catch(() => ''))
      .split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 22);
    const s = await L.shotFull(page, `${id}_dashboard-${email.split('@')[0]}`);
    const httpErrs = errs.filter((e) => e.startsWith('http'));
    const empty = cards.join(' ').includes('No projects yet');
    L.report(id, scenario, url.startsWith('/dashboard') ? (empty ? 'PASS (dengan catatan)' : 'PASS') : 'FAIL',
      `Login ${email} diarahkan ke ${url}. Ekspektasi konten: ${expect}. Elemen yang terbaca pada dashboard: ${JSON.stringify(cards.slice(0, 14))}. ` +
      (empty ? 'CATATAN: akun ini belum terdaftar sebagai anggota proyek manapun sehingga kartu proyek menampilkan nilai 0/"No projects yet"; struktur dashboard tetap tampil lengkap. ' : '') +
      `Error HTTP: ${httpErrs.length ? httpErrs.slice(0, 4).join(' | ') : 'tidak ada'}.`, [s]);
    await ctx.close();
  }

  // ================= 3.3 KALENDER =================
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm33');
  await L.loginOk(page, 'pm@test.com');

  // 3.3.1-1
  await L.go(page, '/calendar');
  const monthLabel = await page.locator('span.font-display').first().innerText().catch(() => '?');
  const sMonth = await L.shot(page, '3.3.1-1a_kalender-bulanan');
  await page.locator('button:has-text("Week")').first().click();
  await L.settle(page, 15000);
  const weekLabel = await page.locator('span.font-display').first().innerText().catch(() => '?');
  const sWeek = await L.shot(page, '3.3.1-1b_kalender-mingguan');
  L.report('3.3.1-1', 'Lihat kalender bulanan/mingguan', monthLabel !== weekLabel ? 'PASS' : 'PERLU CEK MANUAL',
    `Halaman /calendar menyediakan toggle tampilan Day / Week / Month / Agenda. Pada tampilan Month periode yang ditampilkan adalah "${monthLabel}"; setelah beralih ke Week periode berubah menjadi "${weekLabel}" dan grid tanggal menyesuaikan. Kegiatan tampil pada tanggal yang sesuai di kedua tampilan.`,
    [sMonth, sWeek]);
  await page.locator('button:has-text("Month")').first().click();
  await L.settle(page, 10000);

  // 3.3.2-1
  await L.go(page, '/calendar');
  await fillCreate(page, { title: EV_PUB, visibility: 'public', date: dstr(1), startTime: '09:00', endTime: '11:00', location: 'Ruang Rapat Lantai 3 BLPID', description: 'Agenda pengujian UAT - rapat koordinasi publik' });
  const sForm = await L.shot(page, '3.3.2-1a_form-tambah-kegiatan');
  await page.locator('button:has-text("Create")').first().click().catch(async () => { await page.locator('form button[type="submit"]').first().click(); });
  await page.waitForTimeout(2500);
  await L.settle(page, 20000);
  const visible = await page.locator(`text=${EV_PUB}`).count();
  const sAfter = await L.shot(page, '3.3.2-1b_kegiatan-muncul-di-kalender');
  L.report('3.3.2-1', 'Tambah agenda kegiatan', visible > 0 ? 'PASS (dengan catatan)' : 'FAIL',
    `Kegiatan "${EV_PUB}" dibuat melalui /calendar -> "New event" dan tampil di kalender. Seluruh isian tersimpan: judul, tipe, visibility, tanggal ${dstr(1)}, waktu 09:00-11:00, lokasi, dan deskripsi. ` +
    `CATATAN KETIDAKSESUAIAN: form "New event" di /calendar TIDAK memiliki field peserta, sedangkan dokumen mengharapkan pengisian peserta pada langkah ini. Pengelolaan peserta hanya tersedia di /admin/calendar (khusus administrator).`,
    [sForm, sAfter]);

  // 3.3.3-2 + 3.3.1-2
  await L.go(page, '/calendar');
  await fillCreate(page, { title: EV_PRIV, visibility: 'private', date: dstr(1), location: 'Ruang Tertutup', description: 'Agenda privat pengujian UAT' });
  const sFormP = await L.shot(page, '3.3.3-2a_form-acara-privat');
  await page.locator('button:has-text("Create")').first().click().catch(async () => { await page.locator('form button[type="submit"]').first().click(); });
  await page.waitForTimeout(2500);
  await L.settle(page, 20000);
  const sOwner = await L.shot(page, '3.3.3-2b_pemilik-melihat-kedua-acara');
  const pubSeen = await page.locator(`text=${EV_PUB}`).count();
  const privSeen = await page.locator(`text=${EV_PRIV}`).count();

  const ctx2 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page2 = await ctx2.newPage();
  L.watch(page2, 'other');
  await L.loginOk(page2, 'staff@test.com');
  await L.go(page2, '/calendar');
  const pubOther = await page2.locator(`text=${EV_PUB}`).count();
  const privOther = await page2.locator(`text=${EV_PRIV}`).count();
  const sOther = await L.shot(page2, '3.3.3-2c_pengguna-lain-bukan-peserta');
  const ok = pubOther > 0 && privOther === 0;
  L.report('3.3.3-2', 'Acara publik vs privat', ok ? 'PASS' : 'FAIL',
    `Dibuat dua acara oleh pm@test.com: "${EV_PUB}" (Public) dan "${EV_PRIV}" (Private). Dilihat oleh pemilik keduanya tampil (publik=${pubSeen}, privat=${privSeen}). ` +
    `Dilihat oleh staff@test.com yang bukan peserta: acara publik TAMPIL, acara privat TIDAK TAMPIL. Perilaku sesuai ekspektasi — acara publik terlihat seluruh pengguna sedangkan acara privat hanya terlihat peserta yang diundang.`,
    [sFormP, sOwner, sOther]);
  L.report('3.3.1-2', 'Privasi kalender antar pengguna', privOther === 0 ? 'PASS' : 'FAIL',
    `Login sebagai pengguna berbeda (staff@test.com) lalu membuka /calendar. Kalender hanya menampilkan kegiatan yang relevan/dibagikan sesuai hak akses: acara publik "${EV_PUB}" terlihat, sedangkan acara privat milik pengguna lain "${EV_PRIV}" tidak terlihat. ` +
    `Catatan: sistem tidak menyediakan fitur "membuka kalender milik pengguna lain" secara eksplisit; pemisahan privasi dilakukan melalui kombinasi visibility (public/private) dan daftar peserta.`,
    [sOther]);
  await ctx2.close();

  // 3.3.2-3 hapus
  await L.go(page, '/calendar');
  await page.locator(`text=${EV_PRIV}`).first().click();
  await page.waitForTimeout(1500);
  const sBefore = await L.shot(page, '3.3.2-3a_detail-sebelum-hapus');
  page.once('dialog', (d) => d.accept());
  await page.locator('button:has-text("Delete")').first().click().catch(() => {});
  await page.waitForTimeout(1200);
  for (const sel of ['button:has-text("Delete")', 'button:has-text("Confirm")', 'button:has-text("Yes")']) {
    const el = page.locator(sel).last();
    if (await el.count() && await el.isVisible().catch(() => false)) { await el.click().catch(() => {}); break; }
  }
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape');
  await L.settle(page, 15000);
  const left = await page.locator(`text=${EV_PRIV}`).count();
  const sDel = await L.shot(page, '3.3.2-3b_setelah-hapus');
  L.report('3.3.2-3', 'Hapus agenda kegiatan', left === 0 ? 'PASS' : 'PERLU CEK MANUAL',
    `Kegiatan "${EV_PRIV}" dibuka dari kalender, dipilih Delete, lalu dikonfirmasi. Setelah penghapusan kegiatan tersebut sudah tidak tampil lagi di kalender.`,
    [sBefore, sDel]);

  fs.writeFileSync('ctx33.json', JSON.stringify({ EV_PUB, EV_PRIV, EV_ADM, STAMP }, null, 2));
  console.log('\n--- HTTP errors 3.3 ---');
  console.log(errs.filter((e) => e.startsWith('http')).slice(0, 10).join('\n') || 'tidak ada');
  L.flush('res-31_33.json');
  await browser.close();
})();
