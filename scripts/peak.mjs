// Measures the peak level on the master bus with music, ambience and stacked effects, to check the mix without ears.
// Needs npm run dev on :5174 (edit the URL below if it differs).
import puppeteer from 'puppeteer-core'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })
await page.goto('http://localhost:5174/', { waitUntil: 'networkidle2' })
await page.keyboard.press('Enter')
await page.mouse.click(640, 650)
await new Promise(r => setTimeout(r, 2500))
const result = await page.evaluate(async () => {
  const a = window.harborAudio
  const sample = async (ms) => { let m = 0; const t0 = performance.now(); while (performance.now() - t0 < ms) { m = Math.max(m, a.peak()); await new Promise(r => setTimeout(r, 30)) } return m }
  const bed = await sample(1500)
  a.bell(); a.splash(); a.horn(); a.chomp(); a.card(); a.flap()
  const stacked = await sample(1500)
  return { state: a.ctx?.state, bed: bed.toFixed(3), stacked: stacked.toFixed(3) }
})
console.log(JSON.stringify(result))
await browser.close()
