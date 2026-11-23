// Measures glyph positions in the title wordmark, for placing the snow caps.
import puppeteer from 'puppeteer-core'
import os from 'node:os'
const root = new URL('../../', import.meta.url).pathname
import fs from 'node:fs'
const nm = root + 'node_modules/@fontsource'
const svg = fs.readFileSync(root + 'src/art/hello.svg', 'utf8')
const html = `<html><head><style>@font-face{font-family:Fredoka;font-weight:700;src:url(file://${nm}/fredoka/files/fredoka-latin-700-normal.woff2)}body{margin:0}svg{width:760px;height:470px}</style></head><body>${svg}</body></html>`
const tmp = os.tmpdir() + '/hello-measure.html'
fs.writeFileSync(tmp, html)
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--allow-file-access-from-files'] })
const p = await b.newPage(); await p.goto('file://' + tmp); await p.evaluate(() => document.fonts.ready)
const r = await p.evaluate(() => {
  const t = [...document.querySelectorAll('text')].find(t => t.textContent === 'CLEANUP HARBOR' && !t.closest('clipPath') && t.getAttribute('transform') === 'translate(0 0)')
  const out = []
  for (let i = 0; i < 14; i++) { const s = t.getStartPositionOfChar(i), e = t.getEndPositionOfChar(i), x = t.getExtentOfChar(i); out.push([t.textContent[i], +s.x.toFixed(1), +s.y.toFixed(1), +e.x.toFixed(1), +e.y.toFixed(1), +t.getRotationOfChar(i).toFixed(1), +x.y.toFixed(1)]) }
  return out
})
console.log(r.map(a => a.join(' ')).join('\n'))
await b.close()
