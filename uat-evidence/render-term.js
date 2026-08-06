// Render captured CLI / SQL output as a terminal-style PNG so backend
// verification can be embedded as visual evidence in the UAT document.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function renderTerm(name, title, blocks) {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1100, height: 400 } });

  const body = blocks
    .map((b) => `<div class="blk"><div class="cmd">$ ${esc(b.cmd)}</div><pre>${esc(b.out)}</pre></div>`)
    .join('');

  const html = `
  <style>
    * { box-sizing: border-box; }
    body { margin:0; background:#0f1b2a; font-family:'DejaVu Sans Mono',Menlo,monospace; }
    .bar { background:#14406a; color:#fff; padding:9px 14px; font-size:12.5px; font-weight:700;
           display:flex; align-items:center; gap:8px; }
    .dots { display:flex; gap:5px; margin-right:6px; }
    .dot { width:9px; height:9px; border-radius:50%; }
    .wrap { padding:14px 16px 18px; }
    .blk { margin-bottom:14px; }
    .cmd { color:#c9971b; font-size:12px; font-weight:700; margin-bottom:5px; white-space:pre-wrap; word-break:break-all; }
    pre { margin:0; color:#dbe4ee; font-size:11.5px; line-height:1.5; white-space:pre-wrap; word-break:break-word; }
  </style>
  <div class="bar">
    <div class="dots"><div class="dot" style="background:#ff5f57"></div><div class="dot" style="background:#febc2e"></div><div class="dot" style="background:#28c840"></div></div>
    ${esc(title)}
  </div>
  <div class="wrap">${body}</div>`;

  await page.setContent(html, { waitUntil: 'load' });
  const h = await page.evaluate(() => document.body.scrollHeight);
  await page.setViewportSize({ width: 1100, height: Math.min(h + 10, 2400) });
  await page.screenshot({ path: path.join(SHOTS, name + '.png') });
  console.log('  [term-shot]', name + '.png');
  await browser.close();
  return 'shots/' + name + '.png';
}

module.exports = { renderTerm };

if (require.main === module) {
  const spec = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  renderTerm(spec.name, spec.title, spec.blocks);
}
