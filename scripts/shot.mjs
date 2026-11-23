// Drives the running harbor in headless Chrome and saves screenshots. Steps: {wait} {key} {click:[x,y]} {type} {eval} {shot} {burst,n,every,clip}.
// usage: node shot.mjs url outprefix [script.json]  — script: list of {key|click:[x,y]|wait|eval|shot:name}
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const [url, out, scriptPath] = process.argv.slice(2)
const steps = scriptPath ? JSON.parse(fs.readFileSync(scriptPath, 'utf8')) : [{ wait: 800 }, { shot: 'hello' }, { key: 'Enter' }, { wait: 2500 }, { shot: 'quay' }]
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 })
const errs = []
page.on('pageerror', e => errs.push(String(e)))
page.on('console', m => { if (m.type() === 'error') errs.push(m.text()) })
await page.goto(url, { waitUntil: 'networkidle2' })
for (const s of steps) {
  if (s.wait) await new Promise(r => setTimeout(r, s.wait))
  if (s.key) await page.keyboard.press(s.key)
  if (s.click) await page.mouse.click(s.click[0], s.click[1])
  if (s.type) await page.keyboard.type(s.type)
  if (s.eval) console.log('eval:', JSON.stringify(await page.evaluate(s.eval)))
  if (s.shot) await page.screenshot({ path: `${out}-${s.shot}.png` })
  if (s.burst) {
    // A strip of frames for judging motion: {burst: 'walk', n: 12, every: 50, clip: [x, y, w, h]}
    const clip = s.clip ? { x: s.clip[0], y: s.clip[1], width: s.clip[2], height: s.clip[3] } : undefined
    for (let i = 0; i < (s.n ?? 12); i += 1) {
      await page.screenshot({ path: `${out}-${s.burst}-${String(i).padStart(2, '0')}.png`, clip })
      await new Promise(r => setTimeout(r, s.every ?? 50))
    }
  }
}
if (errs.length) console.log('ERRORS:', errs.join('\n'))
await browser.close()
