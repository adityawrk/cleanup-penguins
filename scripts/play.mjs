// Plays the whole harbor loop in headless Chrome and fails loudly if anything breaks.
// Usage: npm run dev (in another terminal), then: node scripts/play.mjs [http://localhost:5173/]
// It never touches the disk beyond the dev API's read-only scans; every throw in the game is a practice throw.
import puppeteer from 'puppeteer-core'

const url = process.argv[2] ?? 'http://localhost:5173/'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
const errors = []
page.on('pageerror', (error) => errors.push(String(error)))
page.on('console', (message) => {
  if (message.type() === 'error' && !/404|Failed to load resource/.test(message.text())) errors.push(message.text())
})

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const state = () => page.evaluate(() => ({
  room: document.querySelector('#fit')?.dataset.room,
  card: !document.querySelector('#card')?.hidden ? document.querySelector('#card-title')?.textContent : null,
  carrying: Boolean(document.querySelector('.prop.is-held:not([hidden])')),
  bubbles: [...document.querySelectorAll('.being .bubble')].filter((b) => !b.hidden).map((b) => b.textContent),
  locker: document.querySelector('#locker-count')?.textContent,
}))
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}
async function until(test, ms = 8000) {
  const start = Date.now()
  while (Date.now() - start < ms) {
    const s = await state()
    if (test(s)) return s
    await wait(150)
  }
  return state()
}

await page.goto(url, { waitUntil: 'networkidle2' })
await wait(800)
check('title card shows', await page.evaluate(() => !document.querySelector('#hello')?.hidden))
await page.keyboard.press('Enter')
await wait(1500)
check('quay loads with both characters', await page.evaluate(() => document.querySelectorAll('#room-quay .being:not([hidden])').length >= 2))

await page.keyboard.press('1')
let s = await until((x) => x.room === 'hold')
check('boarding the caches boat reaches the hold', s.room === 'hold')

await wait(500)
await page.keyboard.press('e')
s = await until((x) => x.carrying)
check('E picks up an item', s.carrying)

await page.keyboard.press('x')
s = await until((x) => Boolean(x.card))
check('carrying to the sea opens the first card', /in the sea\?/.test(s.card ?? ''), s.card)
await page.keyboard.press('y')
s = await until((x) => /for good/.test(x.card ?? ''), 3000)
check('the second card says it would be for good', /for good/.test(s.card ?? ''), s.card)
await wait(900)
await page.keyboard.press('y')
s = await until((x) => x.bubbles.some((b) => /still on your disk/i.test(b)), 5000)
check('the throw is honest: still on your disk', s.bubbles.some((b) => /still on your disk/i.test(b)))

await page.keyboard.press('e')
s = await until((x) => x.carrying, 15000)
check('E picks up a second item across the hold', s.carrying)
await page.keyboard.press('b')
s = await until((x) => Boolean(x.card), 15000)
check('carrying to the bin opens a Locker card', /^Trash /.test(s.card ?? ''), s.card)
await page.keyboard.press('y')
s = await until((x) => x.locker && x.locker !== 'empty', 4000)
check('the Locker counts what you kept', Boolean(s.locker) && s.locker !== 'empty', s.locker)

await page.keyboard.press('m')
await wait(400)
check('M opens the map', await page.evaluate(() => !document.querySelector('#map')?.hidden))
await page.evaluate(() => document.querySelector('.map-keys [data-go=glasshouse]')?.click())
s = await until((x) => x.room === 'glasshouse')
check('the map travels to the Glasshouse', s.room === 'glasshouse')

await page.keyboard.press('q')
s = await until((x) => x.room === 'quay')
check('Q goes back to the quay', s.room === 'quay')
await page.keyboard.press('d')
await wait(300)
check('D dances', await page.evaluate(() => document.querySelector('.being.you')?.classList.contains('is-dancing')))

const fps = await page.evaluate(() => new Promise((resolve) => {
  const times = []
  let last = performance.now()
  const frame = (now) => {
    times.push(now - last)
    last = now
    if (times.length < 120) requestAnimationFrame(frame)
    else resolve(times.sort((a, b) => a - b)[108])
  }
  requestAnimationFrame(frame)
}))
check('frames stay smooth (p90 under 20 ms)', fps < 20, `${fps.toFixed(1)} ms`)
check('no page errors', errors.length === 0, errors.slice(0, 3).join(' | '))

await browser.close()
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
