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

// Click a button by its exact label inside the topmost overlay/modal.
async function clickInModal(page, label) {
  return await page.evaluate((label) => {
    const overlays = Array.from(document.querySelectorAll('div.fixed'));
    const scope = overlays.length ? overlays[overlays.length - 1] : document.body;
    const b = Array.from(scope.querySelectorAll('button')).find((x) => x.innerText.trim() === label);
    if (!b) return `"${label}" tidak ada di modal`;
    b.click(); return 'diklik';
  }, label);
}

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm38c');
  await L.loginOk(page, 'admin@test.com');
  await L.go(page, '/admin/users');

  // ===== 3.8.1-3 Ubah role: opsi peran berupa tombol, bukan <select> =====
  console.log('menu:', await openRowMenu(page, C.NAME));
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Change Role")').last().click().catch(() => {});
  await page.waitForTimeout(2200);
  const sRoleForm = await L.shot(page, '3.8.1-3a_form-ubah-role');
  console.log('  pilih Project Manager:', await clickInModal(page, 'Project Manager'));
  await page.waitForTimeout(1200);
  const sRolePick = await L.shot(page, '3.8.1-3b_pilih-role-baru');
  for (const t of ['Save', 'Update', 'Change Role', 'Confirm', 'Simpan']) {
    const r = await clickInModal(page, t);
    if (r === 'diklik') { console.log('  simpan via:', t); break; }
  }
  await page.waitForTimeout(3500);
  await L.settle(page, 20000);
  const sRoleAfter = await L.shotFull(page, '3.8.1-3c_role-terupdate');

  // ===== 3.8.2-1 Kelola privilege tambahan =====
  await L.go(page, '/admin/users');
  console.log('menu:', await openRowMenu(page, C.NAME));
  await page.waitForTimeout(1500);
  await page.locator('button:has-text("Manage Privileges")').last().click().catch(() => {});
  await page.waitForTimeout(3000);
  await L.settle(page, 15000);
  const sPrivBefore = await L.shotFull(page, '3.8.2-1a_kelola-privilege');

  const info = await page.evaluate(() => {
    const overlays = Array.from(document.querySelectorAll('div.fixed'));
    const scope = overlays.length ? overlays[overlays.length - 1] : document.body;
    return {
      heading: (scope.querySelector('h2,h3') || {}).innerText || '',
      buttons: Array.from(scope.querySelectorAll('button')).map((b) => b.innerText.trim()).filter(Boolean).slice(0, 30),
      checkboxes: scope.querySelectorAll('input[type=checkbox]').length,
      clickableRows: scope.querySelectorAll('div.cursor-pointer, label').length,
      text: (scope.innerText || '').split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 26),
    };
  });
  console.log('  panel privilege:', JSON.stringify(info, null, 1).slice(0, 900));

  fs.writeFileSync('priv-probe.json', JSON.stringify({ info, shots: { sRoleForm, sRolePick, sRoleAfter, sPrivBefore } }, null, 2));
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  await browser.close();
})();
