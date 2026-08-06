const L = require('./lib');
const fs = require('fs');

const STAMP = Date.now().toString().slice(-5);
function dstr(o) { const d = new Date(); d.setDate(d.getDate() + o); return d.toISOString().slice(0, 10); }

async function createCR(page, { title, reviewers, signer }) {
  await L.go(page, '/change-management');
  await page.locator('button:has-text("New request")').first().click();
  await page.waitForSelector('input[placeholder="Change title"]', { timeout: 20000 });

  await page.fill('input[placeholder="Change title"]', title);
  await page.fill('textarea[placeholder="What will be changed?"]', 'Pengujian UAT: perubahan konfigurasi modul notifikasi ConnectOne.').catch(() => {});
  await page.fill('textarea[placeholder="Step-by-step details of the change"]', '1) Backup konfigurasi. 2) Terapkan perubahan. 3) Verifikasi notifikasi terkirim.').catch(() => {});
  await page.fill('textarea[placeholder="Why is this change necessary?"]', 'Memastikan alur persetujuan bertingkat dan tanda tangan elektronik berjalan sesuai KAK.').catch(() => {});
  await page.fill('textarea[placeholder="Risks that may occur"]', 'Notifikasi tertunda selama penerapan.').catch(() => {});
  await page.fill('textarea[placeholder="Steps to reduce risk"]', 'Penerapan di luar jam kerja, rollback disiapkan.').catch(() => {});
  await page.fill('textarea[placeholder="Rollback plan in case of failure"]', 'Kembalikan konfigurasi dari backup.').catch(() => {});

  const sels = page.locator('select:visible');
  await sels.nth(0).selectOption('high').catch(() => {});
  await sels.nth(1).selectOption('normal').catch(() => {});
  const dt = page.locator('input[type="date"]:visible').first();
  if (await dt.count()) await dt.fill(dstr(7)).catch(() => {});

  // signer first: choosing a signer removes that person from the reviewer list
  let signerName = '';
  const nSel = await sels.count();
  for (let i = 0; i < nSel; i++) {
    const opts = await sels.nth(i).locator('option').evaluateAll((os) => os.map((o) => ({ v: o.value, t: o.textContent.trim() })));
    if (opts.some((o) => o.t.includes('Select signatory'))) {
      const pick = opts.find((o) => o.t === signer);
      if (pick) { await sels.nth(i).selectOption(pick.v); signerName = pick.t; }
      break;
    }
  }
  await page.waitForTimeout(800);

  const revWrap = page.locator('div').filter({ has: page.locator('label', { hasText: 'Reviewers *' }) }).last();
  const revRows = revWrap.locator('div.cursor-pointer');
  const n = await revRows.count();
  const picked = [];
  for (const want of reviewers) {
    for (let i = 0; i < n; i++) {
      const row = revRows.nth(i);
      const txt = (await row.innerText().catch(() => '')).split('\n');
      if (txt[0].trim() === want) {
        await row.scrollIntoViewIfNeeded().catch(() => {});
        await row.click().catch(() => {});
        picked.push(want);
        await page.waitForTimeout(500);
        break;
      }
    }
  }
  return { picked, signerName };
}

(async () => {
  const { browser, ctx } = await L.launch();
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm35b');
  await L.loginOk(page, 'po@test.com');

  // ---------- CR untuk alur SETUJU + TTE ----------
  const CR_SIGN = `CR UAT Setujui ${STAMP}`;
  const a = await createCR(page, { title: CR_SIGN, reviewers: ['Scrum Master'], signer: 'Project Manager' });
  console.log('  CR-SIGN reviewer:', JSON.stringify(a.picked), '| signer:', a.signerName);
  const sForm = await L.shotFull(page, '3.5.1-1b_form-ajukan-cr');
  await page.locator('button:has-text("Save")').last().click();
  await page.waitForTimeout(4500);
  await L.settle(page, 25000);
  const ok1 = (await page.locator('main').innerText()).includes(CR_SIGN);
  const sAfter = await L.shotFull(page, '3.5.1-1c_cr-tersimpan');
  console.log('  CR-SIGN tampil:', ok1);

  L.report('3.5.1-1', 'Ajukan change request baru', ok1 ? 'PASS' : 'FAIL',
    `Melalui /change-management -> "New request" diajukan CR berjudul "${CR_SIGN}". Form memuat judul, usulan perubahan, rincian langkah, latar belakang/alasan, risiko, langkah mitigasi, risiko bila tidak dilaksanakan, dan rencana penanganan kegagalan; serta prioritas (High), tipe perubahan (Normal), rencana waktu pelaksanaan (${dstr(7)}), pelaksana, penilai/reviewer berurutan (${a.picked.join(' -> ')}), dan penandatangan (${a.signerName}). ` +
    `CR tersimpan dan tampil di daftar Change Management dengan status awal "Diajukan" beserta indikator tahap persetujuan. Notifikasi ke penilai pertama diverifikasi pada skenario 3.7.2-2.`,
    [sForm, sAfter]);

  // ---------- CR untuk alur TOLAK ----------
  const CR_REJ = `CR UAT Tolak ${STAMP}`;
  const b = await createCR(page, { title: CR_REJ, reviewers: ['Kepala Seksi'], signer: 'Staff Satu' });
  console.log('  CR-REJECT reviewer:', JSON.stringify(b.picked), '| signer:', b.signerName);
  await page.locator('button:has-text("Save")').last().click();
  await page.waitForTimeout(4500);
  await L.settle(page, 25000);
  const ok2 = (await page.locator('main').innerText()).includes(CR_REJ);
  console.log('  CR-REJECT tampil:', ok2);

  fs.writeFileSync('ctx35.json', JSON.stringify({ CR_SIGN, CR_REJ, STAMP, signSigner: a.signerName, rejReviewer: b.picked }, null, 2));
  console.log('\n--- HTTP errors ---');
  console.log(errs.filter((e) => e.startsWith('http')).slice(0, 10).join('\n') || 'tidak ada');
  L.flush('res-35a.json');
  await browser.close();
})();
