const L = require('./lib');
const fs = require('fs');

const EV = JSON.parse(fs.readFileSync('ctx33admin.json', 'utf8')).EV;
const NEW_TITLE = EV + ' [DIUBAH]';
const NEW_LOC = 'Ruang Rapat Lantai 5 (lokasi diubah)';
function dstr(o) { const d = new Date(); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); }

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm33edit');
  await L.loginOk(page, 'admin@test.com');
  await L.go(page, '/admin/calendar');

  // open the event drawer
  await page.locator(`text=${EV}`).first().click();
  await page.waitForTimeout(2200);
  const sDrawer = await L.shot(page, '3.3.2-2a_detail-kegiatan');

  // the drawer header holds icon-only buttons: pencil (edit), trash, close
  const pencil = page.locator('button:has(svg.lucide-pencil), button:has(svg[class*="pencil"])').first();
  console.log('  pencil buttons:', await pencil.count());
  await pencil.click();
  await page.waitForTimeout(2000);
  const heading = await page.locator('h2').allInnerTexts().catch(() => []);
  console.log('  modal heading:', JSON.stringify(heading));

  const ti = page.locator('input[placeholder="Event title"]').first();
  const before = await ti.inputValue().catch(() => '(kosong)');
  console.log('  judul terisi otomatis:', JSON.stringify(before));

  await ti.fill(NEW_TITLE);
  await page.fill('input[placeholder="Online / Meeting Room A"]', NEW_LOC);
  const dates = page.locator('input[type="date"]:visible');
  await dates.nth(0).fill(dstr(2));
  await dates.nth(1).fill(dstr(2));
  const sEdit = await L.shot(page, '3.3.2-2b_form-edit-kegiatan');

  await page.locator('button:has-text("Save")').first().click().catch(() => {});
  await page.waitForTimeout(3200);
  await page.keyboard.press('Escape');
  await L.settle(page, 15000);

  const isEditModal = heading.some((h) => h.includes('Edit'));
  console.log('  modal benar "Edit Event":', isEditModal);

  // verify on /calendar in the month the event moved to
  await L.go(page, '/calendar');
  if (new Date(dstr(2)).getMonth() !== new Date().getMonth()) {
    await page.locator('button.w-\\[26px\\]').nth(1).click();
    await L.settle(page, 15000);
  }
  const period = await page.locator('span.font-display').first().innerText().catch(() => '?');
  const shown = (await page.locator('body').innerText()).includes(NEW_TITLE);
  const sSaved = await L.shot(page, '3.3.2-2c_perubahan-tersimpan');

  console.log(`  periode: ${period} | judul baru tampil: ${shown}`);
  console.log('  HTTP errors:', errs.filter((e) => e.startsWith('http')).join(' | ') || 'tidak ada');

  fs.writeFileSync('edit-result.json', JSON.stringify({ isEditModal, shown, period, NEW_TITLE, NEW_LOC, newDate: dstr(2), shots: [sDrawer, sEdit, sSaved] }, null, 2));
  await browser.close();
})();
