const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = 'http://localhost:3000';
const PASS = 'UatCheck#2026';
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });

const LOG = [];

const HIDE_DEV_CSS = `
  nextjs-portal, [data-nextjs-toast], #__next-build-watcher,
  [data-next-badge-root], [data-nextjs-dev-tools-button] { display: none !important; }
`;

async function launch() {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  return { browser, ctx };
}

function watch(page, tag) {
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errs.push('pageerror: ' + String(e).slice(0, 300)));
  page.on('response', (r) => {
    if (r.status() >= 400) errs.push(`http ${r.status()} ${r.request().method()} ${r.url().replace(BASE, '')}`);
  });
  page._errs = errs;
  page._tag = tag;
  return errs;
}

// Network quiet + no spinners + dev overlay hidden. A screenshot with a
// spinner in it is not usable evidence.
async function settle(page, timeout = 30000) {
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  await page
    .waitForFunction(
      () => document.querySelectorAll('.animate-spin,[class*="animate-spin"]').length === 0,
      { timeout }
    )
    .catch(() => {});
  await page.addStyleTag({ content: HIDE_DEV_CSS }).catch(() => {});
  await page.waitForTimeout(700);
}

async function shot(page, name) {
  const file = path.join(SHOTS, name + '.png');
  await page.addStyleTag({ content: HIDE_DEV_CSS }).catch(() => {});
  await page.screenshot({ path: file, fullPage: false });
  console.log('  [shot] ' + name + '.png');
  return 'shots/' + name + '.png';
}

async function shotFull(page, name) {
  const file = path.join(SHOTS, name + '.png');
  await page.addStyleTag({ content: HIDE_DEV_CSS }).catch(() => {});
  await page.screenshot({ path: file, fullPage: true });
  console.log('  [shot] ' + name + '.png (full)');
  return 'shots/' + name + '.png';
}

// Gateway rate-limits the auth zone to 10r/m (burst 5); each login costs ~3
// auth calls. Pace logins so a 429 never gets mistaken for an app failure.
let lastLogin = 0;
async function paceAuth(page) {
  const need = 20000 - (Date.now() - lastLogin);
  if (lastLogin && need > 0) {
    console.log(`  [pace] menunggu ${Math.ceil(need / 1000)}s (rate limit auth gateway)`);
    await page.waitForTimeout(need);
  }
  lastLogin = Date.now();
}

async function login(page, email, password = PASS) {
  await paceAuth(page);
  await page.goto(BASE + '/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 30000 });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
}

async function loginOk(page, email, password = PASS) {
  await login(page, email, password);
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 30000 });
  await settle(page);
  return page.url();
}

async function go(page, route) {
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
  await settle(page);
  return new URL(page.url()).pathname;
}

function report(id, scenario, verdict, notes, shots) {
  const rec = { id, scenario, verdict, notes, shots: shots || [] };
  LOG.push(rec);
  console.log(`\n=== ${id} | ${verdict} | ${scenario}`);
  console.log('    ' + notes);
  return rec;
}

function flush(file) {
  const out = path.join(__dirname, file);
  fs.writeFileSync(out, JSON.stringify(LOG, null, 2));
  console.log('\n[flushed] ' + out + ' (' + LOG.length + ' records)');
}

module.exports = { BASE, PASS, SHOTS, launch, watch, settle, shot, shotFull, login, loginOk, go, report, flush, LOG };
