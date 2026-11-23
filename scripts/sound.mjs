// Plays every sound effect alone in headless Chrome and measures it on the master bus: each must be audible
// over the ambient bed, and nothing may clip. A machine check, not a substitute for listening.
// Usage: npm run dev, then: node scripts/sound.mjs [http://localhost:5173/]
import puppeteer from 'puppeteer-core'

const url = process.argv[2] ?? 'http://localhost:5173/'
const browser = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true, args: ['--autoplay-policy=no-user-gesture-required'] })
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle2' })
await page.keyboard.press('Enter')
await page.mouse.click(640, 650)
await new Promise((resolve) => setTimeout(resolve, 1500))
const report = await page.evaluate(async () => {
  const a = window.harborAudio
  if (a.musicOn) a.toggleMusic()
  const sample = async (ms) => {
    let max = 0
    const start = performance.now()
    while (performance.now() - start < ms) {
      max = Math.max(max, a.peak())
      await new Promise((resolve) => setTimeout(resolve, 20))
    }
    return max
  }
  await new Promise((resolve) => setTimeout(resolve, 900))
  const bed = await sample(800)
  const out = { bed: +bed.toFixed(3), effects: {} }
  for (const name of ['pop', 'card', 'tide', 'heave', 'setDown', 'chirp', 'flap', 'oof', 'snore', 'splash', 'creak', 'bell', 'gullCall', 'horn', 'chomp', 'meow', 'chime', 'rustle']) {
    a[name]()
    out.effects[name] = +(await sample(name === 'bell' || name === 'horn' ? 1400 : 700)).toFixed(3)
    await new Promise((resolve) => setTimeout(resolve, 250))
  }
  a.toggleMusic()
  out.music = +(await sample(2500)).toFixed(3)
  return out
})
await browser.close()
let failed = 0
console.log(`ambient bed peak ${report.bed}`)
for (const [name, peak] of Object.entries({ ...report.effects, music: report.music })) {
  const audible = peak > report.bed * 1.15 || peak > 0.05
  const ok = audible && peak < 0.98
  if (!ok) failed += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name.padEnd(9)} peak ${peak}${!audible ? '  (not audible over the bed)' : ''}${peak >= 0.98 ? '  (clips)' : ''}`)
}
process.exit(failed ? 1 : 0)
