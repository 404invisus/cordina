const L = require('./lib');
const fs = require('fs');
const TASK = JSON.parse(fs.readFileSync('task-href.json', 'utf8')).href;

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm37b');
  await L.loginOk(page, 'po@test.com');
  await L.go(page, TASK);
  const sTask = await L.shot(page, '3.7.1-1a_detail-task');

  await page.locator('button:has-text("Assign")').first().click();
  await page.waitForTimeout(2200);

  // assignee rows are buttons; pick Scrum Master (has telegram_chat_id via group)
  const row = page.locator('button').filter({ hasText: 'Scrum Master' }).first();
  console.log('  baris Scrum Master ditemukan:', await row.count());
  await row.scrollIntoViewIfNeeded().catch(() => {});
  await row.click();
  await page.waitForTimeout(900);
  const sPick = await L.shot(page, '3.7.1-1b_pilih-assignee');

  const save = page.locator('button').filter({ hasText: /^Save \(/ }).first();
  console.log('  tombol simpan:', await save.count(), '| aktif:', await save.isEnabled().catch(() => false));
  await save.click();
  await page.waitForTimeout(5000);
  await L.settle(page, 20000);
  const sAssigned = await L.shot(page, '3.7.1-1c_task-ditetapkan');
  console.log('  HTTP:', errs.filter((e) => e.startsWith('http')).slice(0, 5).join(' | ') || 'tidak ada');
  fs.writeFileSync('assign-ctx.json', JSON.stringify({ picked: 'Scrum Master', shots: [sTask, sPick, sAssigned] }, null, 2));
  await browser.close();
})();
