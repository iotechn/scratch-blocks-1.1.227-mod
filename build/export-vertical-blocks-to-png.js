#!/usr/bin/env node

const fs = require('fs/promises');
const http = require('http');
const path = require('path');
const puppeteer = require('puppeteer-core');

const ROOT_DIR = path.resolve(__dirname, '..');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const XML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const PADDING = 12;

const categoryArg = process.argv.find(arg => arg.startsWith('--category='));
const categoryFilter = categoryArg ? categoryArg.split('=')[1] : null;
const localeArg = process.argv.find(arg => arg.startsWith('--locale='));
const outputLocale = localeArg ? localeArg.split('=')[1] : 'en-US';
const scratchLocale = outputLocale.toLowerCase() === 'en-us' ? 'en' : outputLocale;
const PLAYGROUND_PATH = `/tests/vertical_playground_compressed.html?toolbox=categories&locale=${encodeURIComponent(scratchLocale)}`;
const OUTPUT_ROOT = path.resolve(ROOT_DIR, 'blocky-pngs', outputLocale, 'blocks-png');

const sanitizeName = name => String(name || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
const getContentType = filePath => {
  const ext = path.extname(filePath).toLowerCase();
  const types = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.ico': 'image/x-icon'
  };
  return types[ext] || 'application/octet-stream';
};

const createStaticServer = rootDir => {
  const server = http.createServer(async (req, res) => {
    const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
    let filePath = path.join(rootDir, requestPath);
    if (filePath.endsWith(path.sep)) filePath = path.join(filePath, 'index.html');

    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
      const content = await fs.readFile(filePath);
      res.writeHead(200, {'Content-Type': getContentType(filePath)});
      res.end(content);
    } catch (error) {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server);
    });
  });
};

const closeServer = server => new Promise((resolve, reject) => {
  server.close(error => {
    if (error) reject(error);
    else resolve();
  });
});

const run = async () => {
  await fs.mkdir(OUTPUT_ROOT, {recursive: true});

  const server = await createStaticServer(ROOT_DIR);
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;

  let browser;
  try {
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({width: 1600, height: 1200, deviceScaleFactor: 2});
    await page.goto(`${baseUrl}${PLAYGROUND_PATH}`, {waitUntil: 'networkidle0'});
    await page.waitForFunction(() => Boolean(window.workspace && window.Blockly), {timeout: 15000});

    await page.evaluate(() => {
      document.body.style.background = 'transparent';
      document.documentElement.style.background = 'transparent';
      const blocklySvg = document.querySelector('.blocklySvg');
      if (blocklySvg) {
        blocklySvg.style.backgroundColor = 'transparent';
      }
      const mainBackground = document.querySelector('.blocklyMainBackground');
      if (mainBackground) {
        mainBackground.style.fill = 'transparent';
      }
    });

    const blockEntries = await page.evaluate(filterCategory => {
      const toolboxXml = workspace.options.languageTree;
      const categories = Array.from(toolboxXml.children).filter(node => node.tagName === 'category');
      const items = [];

      categories.forEach(categoryNode => {
        const categoryId = categoryNode.getAttribute('id') || 'uncategorized';
        if (filterCategory && categoryId !== filterCategory) return;

        const blocks = Array.from(categoryNode.children).filter(node => node.tagName === 'block');
        blocks.forEach(blockNode => {
          items.push({
            categoryId,
            blockType: blockNode.getAttribute('type') || 'unknown',
            blockId: blockNode.getAttribute('id') || '',
            blockXml: Blockly.Xml.domToText(blockNode)
          });
        });
      });

      return items;
    }, categoryFilter);

    if (blockEntries.length === 0) {
      throw new Error(categoryFilter ?
        `No blocks found for category "${categoryFilter}"` :
        'No blocks found in default toolbox');
    }

    let okCount = 0;
    let failCount = 0;

    for (const entry of blockEntries) {
      const safeCategory = sanitizeName(entry.categoryId);
      const safeBlockName = sanitizeName(entry.blockId || entry.blockType);
      const outDir = path.join(OUTPUT_ROOT, safeCategory);
      const outFile = path.join(outDir, `${safeBlockName}.png`);

      try {
        await fs.mkdir(outDir, {recursive: true});
        const clip = await page.evaluate(async (xmlText, namespace, padding) => {
          const workspace = window.workspace;
          workspace.clear();

          const docText = `<xml xmlns="${namespace}">${xmlText}</xml>`;
          const dom = Blockly.Xml.textToDom(docText);
          Blockly.Xml.domToWorkspace(dom, workspace);

          const topBlock = workspace.getTopBlocks(true)[0];
          if (!topBlock) {
            throw new Error('No top block rendered');
          }
          topBlock.moveBy(40, 40);
          topBlock.initSvg();
          topBlock.render();
          workspace.render();
          workspace.resizeContents();
          const imageElements = Array.from(topBlock.getSvgRoot().querySelectorAll('image'));
          const imageHrefs = imageElements
              .map(imageEl => imageEl.getAttribute('href') || imageEl.getAttribute('xlink:href'))
              .filter(Boolean);
          await Promise.all(imageHrefs.map(async href => {
            try {
              const response = await window.fetch(href, {cache: 'no-store'});
              if (!response.ok) {
                throw new Error(`Asset ${href} returned ${response.status}`);
              }
            } catch (error) {
              throw new Error(`Asset load failed: ${href}`);
            }
          }));
          await Promise.all(imageElements.map(imageEl => {
            if (imageEl.complete && imageEl.naturalWidth > 0) return Promise.resolve();
            return new Promise(resolve => {
              const done = () => resolve();
              imageEl.addEventListener('load', done, {once: true});
              imageEl.addEventListener('error', done, {once: true});
              window.setTimeout(done, 1500);
            });
          }));
          await new Promise(resolve => window.requestAnimationFrame(resolve));
          await new Promise(resolve => window.requestAnimationFrame(resolve));

          const bounds = topBlock.getSvgRoot().getBoundingClientRect();
          if (bounds.width < 1 || bounds.height < 1) {
            throw new Error('Rendered block has empty bounds');
          }
          return {
            x: Math.max(0, Math.floor(bounds.x - padding)),
            y: Math.max(0, Math.floor(bounds.y - padding)),
            width: Math.ceil(bounds.width + padding * 2),
            height: Math.ceil(bounds.height + padding * 2)
          };
        }, entry.blockXml, XML_NAMESPACE, PADDING);

        await page.screenshot({
          path: outFile,
          clip,
          omitBackground: true
        });

        okCount += 1;
      } catch (error) {
        failCount += 1;
        console.warn(`Failed: ${entry.categoryId}/${entry.blockType} -> ${error.message}`);
      }
    }

    console.log(`Exported ${okCount} block PNG files to ${OUTPUT_ROOT} (failed: ${failCount}, locale: ${outputLocale})`);
  } finally {
    if (browser) await browser.close();
    await closeServer(server);
  }
};

run().catch(error => {
  console.error('Failed to export block PNG files:', error);
  process.exit(1);
});
