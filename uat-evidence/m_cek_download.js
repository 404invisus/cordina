// Uji end-to-end seluruh tombol unduh/ekspor di UI: klik tombolnya, pastikan
// peramban benar-benar menerima berkas. Jalankan: node m_cek_download.js
const L = require('./lib');

const results = [];

function rec(page, label, file, note) {
  results.push({ page, label, ok: !!file, file: file || '-', note: note || '' });
  console.log(`  ${file ? 'OK  ' : 'GAGAL'} ${page} > ${label}  ${file || note || ''}`);
}

// klik elemen berdasarkan teks lalu tunggu unduhan
async function clickAndExpectDownload(page, matcher, label, pageName, timeout = 60000) {
  const dl = page.waitForEvent('download', { timeout }).catch(() => null);
  const clicked = await page.evaluate((m) => {
    const els = Array.from(document.querySelectorAll('button,a'));
    const el = els.find((x) => {
      if (x.disabled) return false;
      const txt = (x.innerText || '').trim().toLowerCase();
      const title = (x.getAttribute('title') || '').toLowerCase();
      return txt === m || title === m;
    });
    if (!el) return false;
    el.click();
    return true;
  }, matcher.toLowerCase());
  if (!clicked) {
    rec(pageName, label, null, 'tombol tidak ditemukan / nonaktif');
    return null;
  }
  const d = await dl;
  rec(pageName, label, d ? await d.suggestedFilename() : null, d ? '' : 'tidak ada unduhan');
  return d;
}

// klik tombol ikon unduh pertama di dalam tabel (tidak punya label teks)
async function clickIconDownload(page, label, pageName) {
  const dl = page.waitForEvent('download', { timeout: 60000 }).catch(() => null);
  const btn = page.locator('button:has(svg.lucide-download), a:has(svg.lucide-download)').first();
  if (!(await btn.count())) {
    const alt = page.locator('[title="Download"], [title="Unduh"]').first();
    if (!(await alt.count())) return rec(pageName, label, null, 'ikon unduh tidak ada');
    await alt.click();
  } else {
    await btn.click();
  }
  const d = await dl;
  rec(pageName, label, d ? await d.suggestedFilename() : null, d ? '' : 'tidak ada unduhan');
}

async function pickFirstOption(page, index) {
  const sel = page.locator('select').nth(index);
  if (!(await sel.count())) return null;
  const vals = (await sel.locator('option').evaluateAll((os) =>
    os.map((o) => o.value))).filter(Boolean);
  if (!vals.length) return null;
  await sel.selectOption(vals[0]);
  await page.waitForTimeout(2000);
  await L.settle(page, 20000);
  return vals[0];
}

(async () => {
  const { browser, ctx } = await L.launch();

  // ================= peran Product Owner (menu ruang kerja + arsip) =========
  const page = await ctx.newPage();
  L.watch(page, 'po');
  await L.loginOk(page, 'po@test.com');

  // Beban Kerja
  await L.go(page, '/workload');
  await pickFirstOption(page, 0);
  await pickFirstOption(page, 1);
  await clickAndExpectDownload(page, 'Export PDF', 'Export PDF', '/workload');

  // Kalender
  await L.go(page, '/calendar');
  await clickAndExpectDownload(page, 'Export PDF', 'Export PDF', '/calendar');

  // Laporan: tiap tab
  for (const tab of ['Workload', 'Sprint', 'Velocity', 'Time Tracking']) {
    await L.go(page, '/reports');
    await page.evaluate((tb) => {
      const b = Array.from(document.querySelectorAll('button')).find(
        (x) => x.innerText.trim() === tb);
      if (b) b.click();
    }, tab);
    await page.waitForTimeout(1200);
    await pickFirstOption(page, 0);
    await pickFirstOption(page, 1);
    await L.settle(page, 20000);
    await clickAndExpectDownload(page, 'Export PDF', `Export PDF (tab ${tab})`, '/reports');
  }

  // Penyimpanan / Dokumen / e-Sign
  await L.go(page, '/storage');
  await clickIconDownload(page, 'unduh berkas', '/storage');

  await L.go(page, '/documents');
  await clickIconDownload(page, 'unduh dokumen', '/documents');

  await L.go(page, '/esign');
  await clickAndExpectDownload(page, 'Download', 'unduh dokumen tertandatangani', '/esign');

  // ================= peran Administrator ===================================
  const admin = await ctx.newPage();
  L.watch(admin, 'admin');
  await L.loginOk(admin, 'admin@test.com');

  await L.go(admin, '/admin/users');
  await clickAndExpectDownload(admin, 'Export PDF', 'Export PDF', '/admin/users');

  await L.go(admin, '/admin/projects');
  await clickAndExpectDownload(admin, 'Export PDF', 'Export PDF', '/admin/projects');

  await L.go(admin, '/admin/workload');
  await pickFirstOption(admin, 0);
  await clickAndExpectDownload(admin, 'Export PDF', 'Export PDF', '/admin/workload');

  await L.go(admin, '/admin/calendar');
  await admin.evaluate(() => {
    const b = Array.from(document.querySelectorAll('button')).find(
      (x) => x.innerText.trim() === 'Export PDF');
    if (b) b.click();
  });
  await admin.waitForTimeout(1200);
  await clickAndExpectDownload(admin, 'Download PDF', 'Download PDF', '/admin/calendar');

  console.log('\n================ RINGKASAN ================');
  const bad = results.filter((r) => !r.ok);
  for (const r of results) {
    console.log(`${r.ok ? 'OK   ' : 'GAGAL'} ${r.page.padEnd(18)} ${r.label.padEnd(32)} ${r.file}${r.note ? ' (' + r.note + ')' : ''}`);
  }
  console.log(`\n${results.length - bad.length}/${results.length} tombol menghasilkan berkas`);

  await browser.close();
})();
