const L = require('./lib');
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('ctx38.json', 'utf8'));

async function openRowMenu(page, name) {
  return await page.evaluate((name) => {
    const els = Array.from(document.querySelectorAll('*'));
    const cell = els.find((e) => e.children.length === 0 && (e.textContent || '').trim() === name);
    if (!cell) return 'baris tidak ditemukan';
    let cur = cell;
    for (let i = 0; i < 8 && cur; i++) {
      cur = cur.parentElement;
      if (!cur) break;
      const btns = Array.from(cur.querySelectorAll('button'));
      if (btns.length) { btns[btns.length - 1].click(); return 'menu dibuka'; }
    }
    return 'tombol aksi tidak ditemukan';
  }, name);
}

const clickByText = (page, t) => page.locator(`button:has-text("${t}")`).last().click().catch(() => {});

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm38b');
  await L.loginOk(page, 'admin@test.com');
  await L.go(page, '/admin/users');

  // ===== 3.8.1-3 Ubah role pengguna =====
  console.log('  menu:', await openRowMenu(page, C.NAME));
  await page.waitForTimeout(1500);
  await clickByText(page, 'Change Role');
  await page.waitForTimeout(2000);
  const sel = page.locator('select:visible').first();
  const opts = await sel.locator('option').evaluateAll((os) => os.map((o) => o.value));
  console.log('  opsi role:', JSON.stringify(opts));
  await sel.selectOption('project_manager').catch(() => {});
  const sRole = await L.shot(page, '3.8.1-3a_form-ubah-role');
  for (const t of ['Save', 'Update', 'Change Role', 'Confirm']) {
    const b = page.locator(`button:has-text("${t}")`).last();
    if (await b.count() && await b.isEnabled().catch(() => false)) { await b.click().catch(() => {}); break; }
  }
  await page.waitForTimeout(3500);
  await L.settle(page, 20000);
  const sRoleAfter = await L.shotFull(page, '3.8.1-3b_role-terupdate');

  // ===== 3.8.2-1 Kelola privilege tambahan =====
  console.log('  menu:', await openRowMenu(page, C.NAME));
  await page.waitForTimeout(1500);
  await clickByText(page, 'Manage Privileges');
  await page.waitForTimeout(2500);
  const sPrivBefore = await L.shotFull(page, '3.8.2-1a_kelola-privilege');
  const privTxt = (await page.locator('body').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('  panel privilege:', JSON.stringify(privTxt.slice(-30)));
  // toggle beberapa izin
  const toggles = page.locator('input[type="checkbox"]:visible, button[role="switch"]:visible');
  const nT = await toggles.count();
  console.log('  jumlah toggle izin:', nT);
  let toggled = 0;
  for (let i = 0; i < Math.min(nT, 2); i++) {
    await toggles.nth(i).click().catch(() => {});
    toggled++;
    await page.waitForTimeout(400);
  }
  const sPrivPick = await L.shot(page, '3.8.2-1b_izin-dipilih');
  for (const t of ['Save', 'Simpan', 'Update', 'Apply']) {
    const b = page.locator(`button:has-text("${t}")`).last();
    if (await b.count() && await b.isEnabled().catch(() => false)) { await b.click().catch(() => {}); break; }
  }
  await page.waitForTimeout(3500);
  await L.settle(page, 20000);
  const sPrivAfter = await L.shotFull(page, '3.8.2-1c_privilege-tersimpan');

  // ===== 3.8.2-2 Reset privilege ke default =====
  console.log('  menu:', await openRowMenu(page, C.NAME));
  await page.waitForTimeout(1500);
  await clickByText(page, 'Manage Privileges');
  await page.waitForTimeout(2500);
  let resetFound = false;
  for (const t of ['Reset to Default', 'Reset', 'Default']) {
    const b = page.locator(`button:has-text("${t}")`).last();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); resetFound = true; console.log('  reset via:', t); break; }
  }
  await page.waitForTimeout(3000);
  await L.settle(page, 20000);
  const sReset = await L.shotFull(page, '3.8.2-2_reset-privilege');

  // ===== 3.8.1-4 Nonaktifkan pengguna =====
  await L.go(page, '/admin/users');
  console.log('  menu:', await openRowMenu(page, C.NAME));
  await page.waitForTimeout(1500);
  const sBeforeDeact = await L.shot(page, '3.8.1-4a_menu-nonaktifkan');
  await clickByText(page, 'Deactivate');
  await page.waitForTimeout(2000);
  for (const t of ['Deactivate', 'Confirm', 'Yes', 'Ya']) {
    const b = page.locator(`button:has-text("${t}")`).last();
    if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); break; }
  }
  await page.waitForTimeout(3500);
  await L.settle(page, 20000);
  const sDeact = await L.shotFull(page, '3.8.1-4b_pengguna-nonaktif');

  // ===== 3.8.3-1 Riwayat login dan aktivitas =====
  await L.go(page, '/admin/activity');
  const sAct = await L.shotFull(page, '3.8.3-1_riwayat-login-aktivitas');
  const actTxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('  aktivitas:', JSON.stringify(actTxt.slice(0, 30)));

  fs.writeFileSync('ctx38b.json', JSON.stringify({
    toggled, resetFound, privTxt: privTxt.slice(-30), actTxt: actTxt.slice(0, 30),
    shots: { sRole, sRoleAfter, sPrivBefore, sPrivPick, sPrivAfter, sReset, sBeforeDeact, sDeact, sAct },
  }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  await browser.close();
})();
