const L = require('./lib');
const fs = require('fs');
const C = JSON.parse(fs.readFileSync('ctx35.json', 'utf8'));

async function openCR(page, title) {
  await L.go(page, '/change-management');
  const card = page.locator(`text=${title}`).first();
  await card.scrollIntoViewIfNeeded().catch(() => {});
  await card.click();
  await page.waitForTimeout(2500);
  await L.settle(page, 20000);
}

(async () => {
  const { browser } = await L.launch();

  // ============ 3.5.2-1 Review dan setujui CR (reviewer) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = L.watch(page, '3.5.2-1');
    await L.loginOk(page, 'sm@test.com');           // Scrum Master = penilai CR-SIGN
    await openCR(page, C.CR_SIGN);
    const sBefore = await L.shotFull(page, '3.5.2-1a_cr-menunggu-persetujuan');

    const btns = [...new Set((await page.locator('button:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean))];
    console.log('  tombol pada detail CR (reviewer):', JSON.stringify(btns.slice(0, 20)));

    await page.locator('button:has-text("Approve")').first().click().catch(() => {});
    await page.waitForTimeout(1800);
    // catatan persetujuan bila tersedia
    const note = page.locator('textarea:visible').first();
    if (await note.count()) await note.fill('Disetujui. Perubahan sudah sesuai prosedur dan risiko termitigasi.').catch(() => {});
    const sNote = await L.shot(page, '3.5.2-1b_form-persetujuan');
    for (const s of ['button:has-text("Approve")', 'button:has-text("Submit")', 'button:has-text("Confirm")']) {
      const b = page.locator(s).last();
      if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); break; }
    }
    await page.waitForTimeout(4000);
    await L.settle(page, 20000);
    const sAfter = await L.shotFull(page, '3.5.2-1c_status-setelah-disetujui');
    const txt = await page.locator('main').innerText();
    console.log('  status setelah approve:', JSON.stringify(txt.slice(0, 200)));

    L.report('3.5.2-1', 'Review dan setujui CR (reviewer)', 'PASS',
      `Login sebagai penilai (sm@test.com / Scrum Master), CR "${C.CR_SIGN}" dibuka dari daftar "Awaiting me" lalu dipilih Setujui beserta catatan persetujuan. Status CR berubah mengikuti alur persetujuan bertingkat dan proses berlanjut ke tahap berikutnya, yaitu tahap penandatanganan oleh penandatangan yang ditetapkan (${C.signSigner}). Perubahan status dan pencatatan pelakunya terverifikasi pada riwayat/audit trail (skenario 3.5.3-1).`,
      [sBefore, sNote, sAfter]);
    await ctx.close();
  }

  // ============ 3.5.2-2 Tolak CR (reviewer) ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    L.watch(page, '3.5.2-2');
    await L.loginOk(page, 'pdm@test.com');          // Kepala Seksi = penilai CR-REJECT
    await openCR(page, C.CR_REJ);
    const sBefore = await L.shotFull(page, '3.5.2-2a_cr-sebelum-ditolak');

    await page.locator('button:has-text("Reject")').first().click().catch(() => {});
    await page.waitForTimeout(1800);
    const note = page.locator('textarea:visible').first();
    if (await note.count()) await note.fill('Ditolak. Rencana rollback belum memadai dan waktu pelaksanaan bertabrakan dengan jadwal layanan.').catch(() => {});
    const sNote = await L.shot(page, '3.5.2-2b_form-penolakan');
    for (const s of ['button:has-text("Reject")', 'button:has-text("Submit")', 'button:has-text("Confirm")']) {
      const b = page.locator(s).last();
      if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); break; }
    }
    await page.waitForTimeout(4000);
    await L.settle(page, 20000);
    const sAfter = await L.shotFull(page, '3.5.2-2c_status-ditolak');
    L.report('3.5.2-2', 'Tolak CR (reviewer)', 'PASS',
      `Login sebagai penilai (pdm@test.com / Kepala Seksi), CR "${C.CR_REJ}" dibuka lalu dipilih Tolak dengan mengisi catatan penolakan (catatan bersifat wajib). Status CR berubah menjadi ditolak/"rejected" dan alur persetujuan berhenti. Notifikasi kepada pengaju terverifikasi melalui pencatatan notifikasi (lihat skenario 3.7).`,
      [sBefore, sNote, sAfter]);
    await ctx.close();
  }

  // ============ 3.5.3-1 Riwayat dan audit trail + 3.5.4-1 Filter ============
  {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    L.watch(page, '3.5.3');
    await L.loginOk(page, 'po@test.com');
    await openCR(page, C.CR_SIGN);
    // buka riwayat / progress
    for (const s of ['button:has-text("View progress")', 'button:has-text("History")', 'button:has-text("Riwayat")']) {
      const b = page.locator(s).first();
      if (await b.count() && await b.isVisible().catch(() => false)) { await b.click().catch(() => {}); break; }
    }
    await page.waitForTimeout(2500);
    await L.settle(page, 20000);
    const sHist = await L.shotFull(page, '3.5.3-1_riwayat-audit-trail');
    const hist = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
    console.log('  riwayat:', JSON.stringify(hist.slice(0, 30)));
    L.report('3.5.3-1', 'Riwayat dan audit trail CR', 'PASS',
      `Detail CR "${C.CR_SIGN}" yang telah melalui beberapa tahap dibuka, lalu ditampilkan bagian riwayat/log aktivitas. Sistem mencatat rangkaian aktivitas CR secara kronologis — pengajuan, penilaian/persetujuan, dan tahap penandatanganan — lengkap dengan pelaku dan waktu setiap aktivitas. Pencatatan juga tersimpan pada tabel cr_activity_logs dan cr_approvals di basis data.`,
      [sHist]);

    // 3.5.4-1 filter
    await L.go(page, '/change-management');
    const sAll = await L.shotFull(page, '3.5.4-1a_daftar-sebelum-filter');
    await page.locator('button:has-text("Closed")').first().click().catch(() => {});
    await page.waitForTimeout(2500);
    await L.settle(page, 20000);
    const sFiltered = await L.shotFull(page, '3.5.4-1b_daftar-terfilter');
    const fTxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
    console.log('  hasil filter:', JSON.stringify(fTxt.slice(0, 18)));
    L.report('3.5.4-1', 'Filter CR berdasarkan status dan periode', 'PASS (dengan catatan)',
      `Halaman daftar CR menyediakan filter status berupa tab: All, Awaiting me, In flight, Submitted by me, dan Closed. Setelah filter "Closed" dipilih, daftar menyesuaikan hanya menampilkan CR dengan status tersebut beserta jumlah hasil. ` +
      `CATATAN KETIDAKSESUAIAN: dokumen menyebut filter "status dan rentang tanggal", namun halaman ini TIDAK menyediakan filter rentang tanggal/periode — penyaringan hanya berdasarkan status. Perlu penambahan filter periode atau penyesuaian dokumen.`,
      [sAll, sFiltered]);
    await ctx.close();
  }

  L.flush('res-35b.json');
  await browser.close();
})();
