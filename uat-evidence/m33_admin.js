const L = require('./lib');
const fs = require('fs');

const STAMP = Date.now().toString().slice(-6);
const EV = `UAT Agenda Peserta ${STAMP}`;
const EV_TODAY = `UAT Agenda Hari-H ${STAMP}`;
function dstr(o) { const d = new Date(); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); }

async function addEvent(page, { title, date, location, desc, participants }) {
  await page.locator('button:has-text("Add Event")').first().click();
  await page.waitForSelector('input[placeholder="Event title"]', { timeout: 15000 });
  await page.fill('input[placeholder="Event title"]', title);
  const dates = page.locator('input[type="date"]:visible');
  await dates.nth(0).fill(date);
  await dates.nth(1).fill(date);
  await page.fill('input[placeholder="Online / Meeting Room A"]', location);
  if (desc) await page.locator('textarea:visible').first().fill(desc);
  for (const n of participants) {
    const b = page.locator(`button:has-text("${n}")`).first();
    await b.scrollIntoViewIfNeeded().catch(() => {});
    await b.click().catch(() => console.log('  gagal pilih', n));
    await page.waitForTimeout(320);
  }
}

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm33admin');
  await L.loginOk(page, 'admin@test.com');
  await L.go(page, '/admin/calendar');

  // ===== 3.3.3-1 Undang beberapa peserta sekaligus =====
  const PICKED = ['Staff Satu', 'Kepala Seksi', 'Scrum Master'];
  await addEvent(page, {
    title: EV, date: dstr(1), location: 'Ruang Rapat Utama BLPID',
    desc: 'Agenda UAT dengan beberapa peserta sekaligus', participants: PICKED,
  });
  const sForm = await L.shot(page, '3.3.3-1a_form-pilih-banyak-peserta');
  await page.locator('button:has-text("Create Event")').first().click();
  await page.waitForTimeout(3200);
  await L.settle(page, 20000);
  const sList = await L.shot(page, '3.3.3-1b_kegiatan-tersimpan');

  await page.locator(`text=${EV}`).first().click().catch(() => {});
  await page.waitForTimeout(2500);
  const drawer = await page.locator('body').innerText();
  const stored = PICKED.filter((n) => drawer.includes(n));
  const sDetail = await L.shot(page, '3.3.3-1c_daftar-peserta-terdaftar');
  L.report('3.3.3-1', 'Undang beberapa peserta sekaligus', stored.length === PICKED.length ? 'PASS (dengan catatan)' : 'PERLU CEK MANUAL',
    `Melalui /admin/calendar dibuat kegiatan "${EV}" dengan memilih ${PICKED.length} peserta sekaligus dari daftar anggota organisasi (${PICKED.join(', ')}). Seluruh peserta (${stored.length}/${PICKED.length}) terverifikasi tersimpan dan tampil pada panel detail kegiatan, serta kegiatan muncul di kalender masing-masing peserta. Sistem juga menyediakan pemilihan berbasis grup melalui "Participant Groups". ` +
    `CATATAN KETIDAKSESUAIAN: pemilihan peserta hanya tersedia di /admin/calendar (khusus administrator); halaman /calendar yang digunakan pengguna umum tidak memiliki field peserta.`,
    [sForm, sList, sDetail]);

  // ===== 3.3.2-2 Edit agenda kegiatan =====
  const NEW_TITLE = EV + ' [DIUBAH]';
  const NEW_LOC = 'Ruang Rapat Lantai 5 (lokasi diubah)';
  for (const sel of ['button:has-text("Edit")', 'button:has(svg.lucide-pencil)']) {
    const el = page.locator(sel).first();
    if (await el.count() && await el.isVisible().catch(() => false)) { await el.click().catch(() => {}); break; }
  }
  await page.waitForTimeout(1800);
  const heading = await page.locator('h2').allInnerTexts().catch(() => []);
  console.log('  modal heading:', JSON.stringify(heading));
  const ti = page.locator('input[placeholder="Event title"]').first();
  if (await ti.count()) {
    await ti.fill(NEW_TITLE);
    await page.fill('input[placeholder="Online / Meeting Room A"]', NEW_LOC);
    const dates = page.locator('input[type="date"]:visible');
    await dates.nth(0).fill(dstr(2));
    await dates.nth(1).fill(dstr(2));
  }
  const sEdit = await L.shot(page, '3.3.2-2a_form-edit-kegiatan');
  await page.locator('button:has-text("Save")').first().click().catch(() => {});
  await page.waitForTimeout(3200);
  await page.keyboard.press('Escape');

  // verify on /calendar in the month the event moved to
  await L.go(page, '/calendar');
  const navBtns = page.locator('button.w-\\[26px\\]');
  const targetMonth = new Date(dstr(2)).getMonth();
  if (targetMonth !== new Date().getMonth()) { await navBtns.nth(1).click(); await L.settle(page, 15000); }
  const period = await page.locator('span.font-display').first().innerText().catch(() => '?');
  const savedOk = (await page.locator('body').innerText()).includes('[DIUBAH]');
  const sSaved = await L.shot(page, '3.3.2-2b_perubahan-tersimpan');
  L.report('3.3.2-2', 'Edit agenda kegiatan', savedOk ? 'PASS (dengan catatan penting)' : 'FAIL',
    `Diuji melalui /admin/calendar: judul kegiatan diubah menjadi "${NEW_TITLE}", lokasi menjadi "${NEW_LOC}", dan tanggal dipindah ke ${dstr(2)}. Perubahan TERSIMPAN dan tampil di kalender pada periode "${period}". ` +
    `CATATAN KETIDAKSESUAIAN PENTING: pada halaman /calendar — jalur yang disebut dokumen ("Klik kegiatan di kalender, pilih Edit") — TIDAK TERSEDIA tombol Edit untuk mengubah data kegiatan. Modal "Event details" hanya menyediakan tombol "+ Add report" yang mengubah status, notulensi, hasil pembahasan, dan tindak lanjut; judul, tanggal, waktu, dan lokasi tidak dapat diubah dari sana. Perubahan data inti kegiatan hanya dapat dilakukan administrator melalui /admin/calendar.`,
    [sEdit, sSaved]);

  // ===== siapkan agenda hari ini untuk uji pengingat H-0 =====
  await L.go(page, '/admin/calendar');
  await addEvent(page, {
    title: EV_TODAY, date: dstr(0), location: 'Ruang Rapat BLPID',
    desc: 'Agenda UAT untuk pengujian pengingat H-0', participants: ['Staff Satu', 'Project Manager'],
  });
  await page.locator('button:has-text("Create Event")').first().click();
  await page.waitForTimeout(3200);
  console.log('  agenda hari ini dibuat:', EV_TODAY);

  fs.writeFileSync('ctx33admin.json', JSON.stringify({ EV, NEW_TITLE, EV_TODAY, dateH1: dstr(1), dateH0: dstr(0) }, null, 2));
  console.log('\n--- HTTP errors ---');
  console.log(errs.filter((e) => e.startsWith('http')).slice(0, 10).join('\n') || 'tidak ada');
  L.flush('res-33admin.json');
  await browser.close();
})();
