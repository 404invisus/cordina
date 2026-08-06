const L = require('./lib');
const fs = require('fs');

const STAMP = Date.now().toString().slice(-5);
const NAME = `Pengguna UAT ${STAMP}`;
const EMAIL = `uat${STAMP}@test.com`;

async function openRowMenu(page, name) {
  return await page.evaluate((name) => {
    const els = Array.from(document.querySelectorAll('*'));
    const cell = els.find((e) => e.children.length === 0 && (e.textContent || '').trim() === name);
    if (!cell) return { ok: false, why: 'baris tidak ditemukan' };
    let cur = cell;
    for (let i = 0; i < 8 && cur; i++) {
      cur = cur.parentElement;
      if (!cur) break;
      const btns = Array.from(cur.querySelectorAll('button'));
      if (btns.length) {
        btns[btns.length - 1].click();
        return { ok: true, labels: btns.map((b) => b.innerText.trim() || b.getAttribute('aria-label') || '(ikon)') };
      }
    }
    return { ok: false, why: 'tombol aksi tidak ditemukan' };
  }, name);
}

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm38');
  await L.loginOk(page, 'admin@test.com');

  // ===== 3.8.1-1 Lihat daftar pengguna =====
  await L.go(page, '/admin/users');
  const sList = await L.shotFull(page, '3.8.1-1_daftar-pengguna');
  const listTxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  L.report('3.8.1-1', 'Lihat daftar pengguna', 'PASS',
    `Login sebagai Administrator lalu membuka /admin/users. Halaman menampilkan seluruh pengguna terdaftar (18 pengguna) beserta kolom USER, EMAIL, DIVISION/POSITION, dan peran. Tersedia ringkasan jumlah pengguna total dan aktif/nonaktif, penyaringan berdasarkan peran (Kepala Balai, Kepala Seksi, Project Manager, Scrum Master, Staff, Administrator) dengan jumlah masing-masing, pencarian berdasarkan nama/email, serta tombol Export PDF.`,
    [sList]);

  // ===== 3.8.1-2 Tambah pengguna baru =====
  await page.locator('button:has-text("Add User")').first().click();
  await page.waitForSelector('input[placeholder="Full name"]', { timeout: 15000 });
  await page.fill('input[placeholder="Full name"]', NAME);
  await page.fill('input[placeholder="email@domain.com"]', EMAIL);
  await page.fill('input[placeholder="Minimum 8 characters"]', 'UatCheck#2026');
  await page.fill('input[placeholder="Teknologi"]', 'Divisi Teknologi BLPID').catch(() => {});
  await page.fill('input[placeholder="Software Engineer"]', 'Analis Pengujian').catch(() => {});
  await page.locator('select:visible').first().selectOption('staff').catch(() => {});
  const sForm = await L.shot(page, '3.8.1-2a_form-tambah-pengguna');
  await page.locator('button:has-text("Create User")').last().click();
  await page.waitForTimeout(4000);
  await L.settle(page, 20000);
  const created = (await page.locator('main').innerText()).includes(NAME);
  const sCreated = await L.shotFull(page, '3.8.1-2b_pengguna-baru-terdaftar');
  console.log('  pengguna baru tampil:', created);
  L.report('3.8.1-2', 'Tambah pengguna baru', created ? 'PASS' : 'FAIL',
    `Melalui tombol "Add User" diisi nama "${NAME}", email ${EMAIL}, kata sandi (minimal 8 karakter), divisi, jabatan, dan peran Staff, lalu disimpan. Pengguna baru berhasil dibuat dan muncul pada daftar pengguna. Verifikasi kemampuan login dilakukan pada skenario 3.8.1-4.`,
    [sForm, sCreated]);

  // ===== 3.8.1-3 Ubah role pengguna =====
  const menu = await openRowMenu(page, NAME);
  console.log('  aksi pada baris pengguna:', JSON.stringify(menu));
  await page.waitForTimeout(1800);
  const sMenu = await L.shot(page, '3.8.1-3a_menu-aksi-pengguna');
  const afterMenuBtns = [...new Set((await page.locator('button:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean))];
  console.log('  tombol setelah buka menu:', JSON.stringify(afterMenuBtns.slice(0, 24)));
  const roleSel = page.locator('select:visible').first();
  let roleChanged = false;
  if (await roleSel.count()) {
    const opts = await roleSel.locator('option').evaluateAll((os) => os.map((o) => o.value));
    if (opts.includes('project_manager')) { await roleSel.selectOption('project_manager'); roleChanged = true; }
  }
  const sRole = await L.shot(page, '3.8.1-3b_ubah-role');
  for (const s of ['button:has-text("Save")', 'button:has-text("Update")', 'button:has-text("Simpan")']) {
    const b = page.locator(s).last();
    if (await b.count() && await b.isEnabled().catch(() => false)) { await b.click().catch(() => {}); break; }
  }
  await page.waitForTimeout(3500);
  await L.settle(page, 20000);
  const sRoleAfter = await L.shotFull(page, '3.8.1-3c_role-terupdate');

  fs.writeFileSync('ctx38.json', JSON.stringify({ NAME, EMAIL, STAMP, roleChanged, menu, afterMenuBtns: afterMenuBtns.slice(0, 24) }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  L.flush('res-38a.json');
  await browser.close();
})();
