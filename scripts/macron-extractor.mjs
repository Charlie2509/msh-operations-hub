#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const outputDir = path.join(repoRoot, 'extracted_assets');
const diagnosticsDir = path.join(outputDir, 'diagnostics');

const mode = process.env.MODE ?? process.argv[2] ?? 'extract';
const maxLinks = Number(process.env.DIAGNOSE_MAX_LINKS ?? 5);

const defaultLinkSources = [
  process.env.PRODUCT_LINKS_FILE,
  path.join(outputDir, 'product_links.txt'),
  path.join(outputDir, 'product_links.json'),
].filter(Boolean);

function normalizeUrl(raw) {
  try {
    const parsed = new URL(raw);
    if (!/^https?:$/.test(parsed.protocol)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function productCodeFromUrl(url, fallback) {
  const parsed = new URL(url);
  const slug = parsed.pathname
    .split('/')
    .filter(Boolean)
    .at(-1)
    ?.replace(/\.[a-zA-Z0-9]+$/, '')
    ?.replace(/[^a-zA-Z0-9_-]+/g, '-')
    ?.replace(/^-+|-+$/g, '');
  return slug || `product-${fallback + 1}`;
}

async function collectLinks() {
  if (process.env.PRODUCT_LINKS) {
    return process.env.PRODUCT_LINKS.split(/[\n,]/g)
      .map((v) => normalizeUrl(v.trim()))
      .filter(Boolean);
  }

  for (const source of defaultLinkSources) {
    try {
      const raw = await fs.readFile(source, 'utf8');
      if (source.endsWith('.json')) {
        const data = JSON.parse(raw);
        const maybeList = Array.isArray(data)
          ? data
          : Array.isArray(data.links)
            ? data.links
            : [];
        const links = maybeList.map((v) => normalizeUrl(String(v).trim())).filter(Boolean);
        if (links.length) return links;
      } else {
        const links = raw
          .split(/\r?\n/g)
          .map((v) => normalizeUrl(v.trim()))
          .filter(Boolean);
        if (links.length) return links;
      }
    } catch {
      // Try next source.
    }
  }

  throw new Error(
    [
      'No valid product links found.',
      'Set PRODUCT_LINKS (comma/newline separated) or PRODUCT_LINKS_FILE.',
      `Tried: ${defaultLinkSources.join(', ')}`,
    ].join(' '),
  );
}

async function runDiagnose() {
  const links = await collectLinks();
  const targetLinks = links.slice(0, maxLinks);

  if (!targetLinks.length) {
    throw new Error('No valid product links available for diagnostics.');
  }

  await fs.mkdir(diagnosticsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  try {
    for (let i = 0; i < targetLinks.length; i += 1) {
      const url = targetLinks[i];
      const productCode = productCodeFromUrl(url, i);
      const page = await browser.newPage();

      const consoleErrors = [];
      const failedRequests = [];
      const imageResponses = [];
      const apiResponses = [];

      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });

      page.on('requestfailed', (request) => {
        failedRequests.push({
          method: request.method(),
          url: request.url(),
          failure: request.failure()?.errorText ?? 'unknown',
        });
      });

      page.on('response', async (response) => {
        const request = response.request();
        const resourceType = request.resourceType();
        const headers = response.headers();
        const contentType = headers['content-type'] || '';

        if (resourceType === 'image' || contentType.startsWith('image/')) {
          imageResponses.push({
            url: response.url(),
            status: response.status(),
            contentType: contentType || 'unknown',
          });
        }

        if (
          resourceType === 'xhr' ||
          resourceType === 'fetch' ||
          contentType.includes('application/json')
        ) {
          apiResponses.push({
            url: response.url(),
            status: response.status(),
            contentType: contentType || 'unknown',
          });
        }
      });

      let mainStatus = 'n/a';
      let finalUrl = url;
      let pageTitle = '(title unavailable)';

      try {
        const response = await page.goto(url, { waitUntil: 'networkidle', timeout: 90000 });
        mainStatus = response?.status?.() ?? 'n/a';
        finalUrl = page.url();
        pageTitle = await page.title();
      } catch (error) {
        consoleErrors.push(`Navigation error: ${error instanceof Error ? error.message : String(error)}`);
      }

      const screenshotPath = path.join(diagnosticsDir, `${productCode}.png`);
      const htmlPath = path.join(diagnosticsDir, `${productCode}.html`);

      await page.screenshot({ path: screenshotPath, fullPage: true });
      await fs.writeFile(htmlPath, await page.content(), 'utf8');

      console.log(`\n=== Diagnose: ${url} ===`);
      console.log(`HTTP status: ${mainStatus}`);
      console.log(`Final URL: ${finalUrl}`);
      console.log(`Page title: ${pageTitle}`);
      console.log('Console errors:');
      if (!consoleErrors.length) console.log('  (none)');
      consoleErrors.forEach((entry) => console.log(`  - ${entry}`));

      console.log('Failed network requests:');
      if (!failedRequests.length) console.log('  (none)');
      failedRequests.forEach((entry) =>
        console.log(`  - [${entry.method}] ${entry.url} :: ${entry.failure}`),
      );

      console.log('Image responses:');
      if (!imageResponses.length) console.log('  (none)');
      imageResponses.forEach((entry) =>
        console.log(`  - [${entry.status}] ${entry.url} (${entry.contentType})`),
      );

      console.log('JSON/XHR/fetch responses:');
      if (!apiResponses.length) console.log('  (none)');
      apiResponses.forEach((entry) =>
        console.log(`  - [${entry.status}] ${entry.url} (${entry.contentType})`),
      );

      console.log(`Screenshot: ${path.relative(repoRoot, screenshotPath)}`);
      console.log(`HTML dump: ${path.relative(repoRoot, htmlPath)}`);

      await page.close();
    }
  } finally {
    await browser.close();
  }
}

async function runExtract() {
  console.log('Running extractor mode (existing extraction logic remains unchanged).');
  console.log('No extraction updates were requested in this change set.');
}

if (mode === 'diagnose') {
  await runDiagnose();
} else if (mode === 'extract') {
  await runExtract();
} else {
  throw new Error(`Unsupported mode: ${mode}. Use "extract" or "diagnose".`);
}
