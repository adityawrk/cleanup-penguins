// Tiles frames into one contact sheet: node scripts/sheet.mjs out.png cols frame1.png frame2.png ...
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const [out, cols, ...frames] = process.argv.slice(2)
const html = `<html><body style="margin:0;background:#222;display:grid;grid-template-columns:repeat(${cols},auto);gap:4px;width:max-content">${frames.map((f, i) => `<div style="position:relative"><img src="file://${fs.realpathSync(f)}" style="display:block"><b style="position:absolute;left:4px;top:2px;color:#fff;font:12px monospace;background:#000a;padding:0 3px">${i}</b></div>`).join('')}</body></html>`
fs.writeFileSync(out + '.html', html)
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--allow-file-access-from-files'] })
const page = await browser.newPage()
await page.setViewport({ width: 400, height: 300 })
await page.goto('file://' + fs.realpathSync(out + '.html'))
await page.evaluate(() => Promise.all([...document.images].map(i => i.complete ? 0 : new Promise(r => (i.onload = r)))))
const body = await page.$('body')
await body.screenshot({ path: out })
await browser.close()
fs.unlinkSync(out + '.html')
