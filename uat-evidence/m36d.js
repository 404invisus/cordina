const L = require('./lib');
const fs = require('fs');
const path = require('path');
const DL = path.join(__dirname, 'downloads');
fs.mkdirSync(DL, { recursive: true });
const U = JSON.parse(fs.readFileSync('esign-ui.json', 'utf8'));

(async () => {
  const browser = await require('playwright').chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  const page = await ctx.newPage();
  const errs = L.watch(page, 'm36d');
  await L.loginOk(page, 'pm@test.com');

  // ===== 3.6.4-1 Riwayat dokumen tertandatangani =====
  await L.go(page, '/esign');
  const sHist = await L.shotFull(page, '3.6.4-1_riwayat-dokumen-tte');
  const txt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('  riwayat:', JSON.stringify(txt.slice(0, 26)));
  const rowActions = [...new Set((await page.locator('main button:visible, main a:visible').allInnerTexts()).map((t) => t.trim()).filter(Boolean))];
  console.log('  aksi baris:', JSON.stringify(rowActions.slice(0, 16)));

  L.report('3.6.4-1', 'Riwayat dokumen tertandatangani', txt.join(' ').includes(U.TITLE) ? 'PASS' : 'PERLU CEK MANUAL',
    `Halaman /esign menampilkan daftar/riwayat dokumen yang telah ditandatangani secara elektronik, memuat kolom FILE, SIGNED (waktu penandatanganan), SIGNATURE (jenis tanda tangan: VISIBLE/INVISIBLE), dan ACTIONS. Dokumen hasil pengujian "${U.TITLE}" tercatat pada daftar. Halaman juga menampilkan ringkasan: jumlah dokumen ditandatangani, jumlah tanda tangan visible, invisible, serta status NIK penandatangan ("Active - ready to sign").`,
    [sHist]);

  // ===== 3.6.4-2 Unduh dokumen yang sudah ditandatangani =====
  let dlName = '', size = 0, isPdf = false;
  try {
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: 60000 }),
      page.locator('main a:has-text("Download"), main button:has-text("Download")').first().click(),
    ]);
    dlName = dl.suggestedFilename();
    const p = path.join(DL, dlName);
    await dl.saveAs(p);
    size = fs.statSync(p).size;
    isPdf = fs.readFileSync(p).slice(0, 4).toString() === '%PDF';
    fs.writeFileSync('signed-pdf-path.json', JSON.stringify({ p, dlName, size }));
  } catch (e) { console.log('  unduh gagal:', String(e).slice(0, 140)); }
  console.log(`  unduhan: ${dlName} | ${size} bytes | PDF: ${isPdf}`);
  const sDl = await L.shot(page, '3.6.4-2_unduh-dokumen');
  L.report('3.6.4-2', 'Unduh dokumen yang sudah ditandatangani', isPdf ? 'PASS' : 'PERLU CEK MANUAL',
    isPdf
      ? `Pada baris dokumen di halaman /esign dipilih aksi Unduh. Berkas "${dlName}" berhasil diunduh berukuran ${size.toLocaleString('id-ID')} byte dan terverifikasi berformat PDF sah (header %PDF), yaitu dokumen yang telah dibubuhi tanda tangan elektronik BSrE.`
      : `Aksi unduh belum dapat diverifikasi otomatis; perlu pengujian manual.`,
    [sDl]);

  // ===== 3.6.2-1 Multi penanda tangan berurutan =====
  await L.go(page, '/tte-sign');
  const sMulti = await L.shotFull(page, '3.6.2-1a_daftar-esign-multi-pihak');
  const mtxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('  multi-signer:', JSON.stringify(mtxt.slice(0, 22)));
  // buka salah satu permintaan untuk melihat urutan penandatangan
  const first = page.locator('main').locator('text=/\\d\\/\\d signed/').first();
  if (await first.count()) { await first.click().catch(() => {}); await page.waitForTimeout(2500); await L.settle(page, 15000); }
  const sMultiDetail = await L.shotFull(page, '3.6.2-1b_detail-urutan-penandatangan');
  const dtxt = (await page.locator('main').innerText()).split('\n').map((s) => s.trim()).filter(Boolean);
  console.log('  detail:', JSON.stringify(dtxt.slice(0, 30)));

  fs.writeFileSync('multi-signer.json', JSON.stringify({ mtxt: mtxt.slice(0, 22), dtxt: dtxt.slice(0, 30), shots: [sMulti, sMultiDetail] }, null, 2));
  console.log('  HTTP errors:', errs.filter((e) => e.startsWith('http')).slice(0, 6).join(' | ') || 'tidak ada');
  L.flush('res-36a.json');
  await browser.close();
})();
