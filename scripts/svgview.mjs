// Renders one art SVG to a PNG with the game fonts, for checking art outside the game.
// usage: node svgview.mjs file.svg out.png [width height]
import puppeteer from 'puppeteer-core'
import fs from 'node:fs'
const [file, out, w = 1280, h = 708] = process.argv.slice(2)
const nm = new URL('../node_modules/@fontsource', import.meta.url).pathname
const svg = fs.readFileSync(file, 'utf8')
const html = `<html><head><style>
@font-face{font-family:Fredoka;font-weight:500;src:url(file://${nm}/fredoka/files/fredoka-latin-500-normal.woff2)}
@font-face{font-family:Fredoka;font-weight:600;src:url(file://${nm}/fredoka/files/fredoka-latin-600-normal.woff2)}
@font-face{font-family:Fredoka;font-weight:700;src:url(file://${nm}/fredoka/files/fredoka-latin-700-normal.woff2)}
body{margin:0;background:#fff;font-family:Fredoka}
svg{display:block;width:${w}px;height:${h}px}
.hull-name{font:700 17px Fredoka;letter-spacing:.06em}.hull-size{font:700 15px Fredoka}
.sign-word{font:700 20px Fredoka;letter-spacing:.12em}.tag-word{font:600 14px Fredoka}.tag-word.strong{font-weight:700;letter-spacing:.08em;font-size:13px}
</style></head><body>${svg}</body></html>`
const tmp = out + '.html'
fs.writeFileSync(tmp, html)
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--allow-file-access-from-files'] })
const page = await browser.newPage()
await page.setViewport({ width: Number(w), height: Number(h) })
await page.goto('file://' + tmp)
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: out })
await browser.close()
