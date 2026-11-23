// Builds src/art/hello.svg. Characters are lifted verbatim from index.html templates.
import fs from 'node:fs'
const root = new URL('../../', import.meta.url).pathname.replace(/\/$/, '')
const html = fs.readFileSync(root + '/index.html', 'utf8')

function tplSvg(id) {
  const t = html.slice(html.indexOf(`<template id="${id}">`))
  const s = t.slice(t.indexOf('<svg'), t.indexOf('</svg>'))
  return s.slice(s.indexOf('>') + 1)
}
let you = tplSvg('tpl-you').replace(/youClip/g, 't-youClip')
let cl = tplSvg('tpl-claude').replace(/clClip/g, 't-clClip')

// Strip template classes (eyes/flipper/foot are styled by game CSS) only where we re-wrap; keep the rest as-is.
// Pose: wrap the right flipper of the penguin in a static rotate, with an inner hook group for CSS.
const P = JSON.parse(process.env.POSE || '{}')
const waveAng = P.wave ?? 100
const waveCx = P.wcx ?? 74, waveCy = P.wcy ?? 100
function wrapGroup(src, cls, before, after) {
  const i = src.indexOf(`<g class="${cls}">`)
  // find matching </g>
  let depth = 0, j = i
  const re = /<g\b|<\/g>/g
  re.lastIndex = i
  let m
  while ((m = re.exec(src))) {
    if (m[0] === '<g') depth++
    else { depth--; if (depth === 0) { j = m.index + 4; break } }
  }
  return src.slice(0, i) + before + src.slice(i, j) + after + src.slice(j)
}
you = wrapGroup(you, 'flipper r', `<g transform="rotate(${waveAng} ${waveCx} ${waveCy})"><g class="t-wave">`, `</g></g>`)
const scoutAng = P.sw ?? -115
if (scoutAng) cl = wrapGroup(cl, 'flipper r', `<g transform="rotate(${scoutAng} 106 80)"><g class="t-scout-wave">`, `</g></g>`)
// drop the game-side classes so page CSS (walk/wave) never touches the title art
// template classes kept verbatim: .eyes blinks via the global rule; .being-scoped walk rules never match here


const INK = '#1a2332'
const W = 760, H = 470
const HZ = 262 // horizon
const DECK = 372 // deck back edge (meets the water)

// ---------- deck planks converging toward a vanishing point ----------
function deck() {
  const vx = 380, n = 18
  const topW = 46, botW = 62
  let fills = '', seams = '', joints = ''
  for (let i = -n / 2; i < n / 2; i++) {
    const tx0 = vx + i * topW, tx1 = tx0 + topW
    const bx0 = vx + i * botW, bx1 = bx0 + botW
    fills += `<path d="M${tx0} ${DECK}L${tx1} ${DECK}L${bx1} ${H + 4}L${bx0} ${H + 4}Z" fill="${(i & 1) ? '#e0ac6b' : '#e8b878'}"/>`
    seams += `M${tx0} ${DECK}L${bx0} ${H + 4}`
  }
  // staggered butt joints
  const rows = [394, 418, 446]
  for (let i = -n / 2; i < n / 2; i++) {
    const y = rows[((i % 3) + 3) % 3]
    const t = (y - DECK) / (H + 4 - DECK)
    const x0 = vx + i * (topW + (botW - topW) * t)
    const x1 = x0 + topW + (botW - topW) * t
    joints += `M${(x0 + 2).toFixed(1)} ${y}L${(x1 - 2).toFixed(1)} ${y}`
  }
  return `<g stroke="none">${fills}</g>
  <path d="${seams}" stroke="#a8713c" stroke-width="3" fill="none"/>
  <path d="${joints}" stroke="#a8713c" stroke-width="3" fill="none"/>
  <path d="M0 ${DECK}H${W}V${DECK + 12}Q380 ${DECK + 19} 0 ${DECK + 12}Z" fill="#c9915a"/>
  <rect x="-4" y="${DECK - 12}" width="${W + 8}" height="12" fill="#9a6236" stroke="${INK}" stroke-width="4"/>
  <path d="M0 ${DECK - 2}H${W}" stroke="#6e4322" stroke-width="3"/>`
}

// ---------- wordmark ----------
const WM = { size: +(P.size ?? 72), sp: +(P.sp ?? 1.5) }
const arc = `M24 132Q380 70 736 132`
function word(dy, fill, extra = '') {
  return `<text font-family="Fredoka" font-weight="700" font-size="${WM.size}" letter-spacing="${WM.sp}" ${extra} transform="translate(0 ${dy})"><textPath href="#t-arc" startOffset="50%" text-anchor="middle" fill="${fill}">CLEANUP HARBOR</textPath></text>`
}
function cap(sx, sy, a, x0, w) {
  const f = n => n.toFixed(1)
  const d = `M${x0} -46C${x0 - 3} -54 ${x0 + 2} -61 ${f(x0 + w * .3)} -60C${f(x0 + w * .4)} -66 ${f(x0 + w * .68)} -66 ${f(x0 + w * .74)} -60C${x0 + w + 2} -61 ${x0 + w + 4} -52 ${x0 + w} -46C${x0 + w - 3} -42 ${f(x0 + w * .72)} -42 ${f(x0 + w * .64)} -44C${f(x0 + w * .6)} -36 ${f(x0 + w * .44)} -36 ${f(x0 + w * .42)} -44C${f(x0 + w * .28)} -41 ${x0 + 4} -41 ${x0} -46Z`
  return `<g transform="translate(${sx} ${sy}) rotate(${a})"><path d="${d}" fill="#fff" stroke="${INK}" stroke-width="3.2" stroke-linejoin="round"/><path d="M${x0 + 5} -50C${f(x0 + w * .4)} -54 ${f(x0 + w * .7)} -54 ${x0 + w - 5} -50" fill="none" stroke="#d6ecf9" stroke-width="2.6" stroke-linecap="round"/></g>`
}
const CAPS = `<g class="t-caps">${cap(61.6, 125.7, -8.2, 5, 38)}${cap(347.2, 101.1, -0.3, 2, 34)}${cap(653.9, 119.2, 8.2, 2, 34)}</g>`
const EX = +(P.ex ?? 8)
let sweep = ''
for (let d = 1; d <= EX; d++) sweep += word(d, '#e9a913')
const wordmark = `
  <g class="t-title"><g class="t-title-in">
    ${word(EX, INK, `stroke="${INK}" stroke-width="14" stroke-linejoin="round"`)}
    ${word(0, INK, `stroke="${INK}" stroke-width="14" stroke-linejoin="round"`)}
    ${sweep}
    ${word(0, '#fff6c2', `stroke="${INK}" stroke-width="4.4" stroke-linejoin="round" paint-order="stroke"`)}
    <g clip-path="url(#t-wordclip)">${word(3.4, '#ffd23f')}</g>
    ${CAPS}
  </g></g>`

// ---------- boat lifted from the quay trawler ----------
const quay = fs.readFileSync(root + '/src/art/quay.svg', 'utf8')
function quayGroup(marker) {
  const i = quay.indexOf(marker)
  const gi = quay.indexOf('<g', i)
  let depth = 0, j = gi
  const re = /<g\b|<\/g>/g
  re.lastIndex = gi
  let m
  while ((m = re.exec(quay))) { if (m[0] === '<g') depth++; else { depth--; if (depth === 0) { j = m.index + 4; break } } }
  return quay.slice(gi, j)
}
function strokeBoost(src, k) { return src.replace(/stroke-width="([\d.]+)"/g, (_, w) => `stroke-width="${(+w * k).toFixed(2)}"`) }
function clean(src) {
  return src.replace(/<title>.*?<\/title>/g, '').replace(/<text[^>]*>.*?<\/text>/g, '').replace(/ (class|data-act|data-hold|data-room|id)="[^"]*"/g, '')
}
let boat = clean(quayGroup('<!-- BOAT 1'))
// drop the waterline foam squiggle (first path) — we draw our own
boat = strokeBoost(boat, 1.3)
let tug = clean(quayGroup('<!-- BOAT 3'))
tug = strokeBoost(tug, 1.45)

function flake(x, y, r) {
  const a = [0, 60, 120].map(d => { const t = d * Math.PI / 180; return `M${(x - r * Math.cos(t)).toFixed(1)} ${(y - r * Math.sin(t)).toFixed(1)}L${(x + r * Math.cos(t)).toFixed(1)} ${(y + r * Math.sin(t)).toFixed(1)}` }).join('')
  return `<path d="${a}" stroke="${INK}" stroke-width="5.4"/><path d="${a}" stroke="#fff" stroke-width="2.4"/>`
}
const flakes = [[48, 40, 6], [252, 26, 5], [470, 22, 5.5], [734, 46, 5.5], [34, 118, 4.5], [128, 232, 5], [304, 214, 4], [738, 232, 4.5], [452, 178, 4], [700, 330, 4.5], [214, 186, 4]]
const SNOW = `<g class="t-snow" fill="none" stroke-linecap="round">${flakes.map(f => flake(...f)).join('')}</g>`
const RIBBON = `
  <g class="t-ribbon" stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M250 138L222 140L234 154L220 168L262 166Z" fill="#b03329" stroke-width="3.8"/>
    <path d="M510 138L538 140L526 154L540 168L498 166Z" fill="#b03329" stroke-width="3.8"/>
    <path d="M250 138L262 160L262 166Z" fill="#7d1f19" stroke-width="2.4"/>
    <path d="M510 138L498 160L498 166Z" fill="#7d1f19" stroke-width="2.4"/>
    <path d="M250 130Q380 112 510 130L510 156Q380 138 250 156Z" fill="#d9493e" stroke-width="4"/>
    <path d="M254 150Q380 133 506 150L506 154Q380 137 254 154Z" fill="#b03329" stroke="none"/>
    <path d="M250 130Q380 112 510 130L510 156Q380 138 250 156Z" fill="none" stroke-width="4"/>
    <path d="M262 133Q380 117 498 133" fill="none" stroke="#f06a5e" stroke-width="2.4"/>
    <path id="t-ribbon-line" d="M250 149Q380 131 510 149" fill="none" stroke="none"/>
    <text font-family="Fredoka" font-weight="700" font-size="16" letter-spacing="2.4" fill="#fff6e4" stroke="none"><textPath href="#t-ribbon-line" startOffset="50%" text-anchor="middle">TIDY UP YOUR MAC</textPath></text>
  </g>`
const GULL = `
  <g class="t-gull" stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M494 182Q506 166 520 178Q534 166 546 182Q532 176 522 186Q516 184 520 180Q510 174 494 182Z" fill="#fff" stroke-width="3"/>
    <path d="M516 182q4 4 10 0" fill="none" stroke-width="2.4"/>
    <path d="M525 183l5 1.6l-5 1.6z" fill="#f4a024" stroke-width="1.6"/>
  </g>
  <g class="t-gull t-gull-b" stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M566 186Q573 177 581 184Q589 177 596 186Q588 182 582 188Q576 182 566 186Z" fill="#fff" stroke-width="2.6"/>
  </g>`
const BOATS = `<g transform="translate(-190 99) scale(.62)">${boat}</g>`
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" class="hello-art" role="img" aria-label="Cleanup Harbor">
  <defs>
    <path id="t-arc" d="${arc}"/>
    <clipPath id="t-wordclip"><text font-family="Fredoka" font-weight="700" font-size="${WM.size}" letter-spacing="${WM.sp}"><textPath href="#t-arc" startOffset="50%" text-anchor="middle">CLEANUP HARBOR</textPath></text></clipPath>
  </defs>

  <!-- SKY -->
  <rect width="${W}" height="${HZ + 4}" fill="#4fb2ee"/>
  <rect y="150" width="${W}" height="${HZ - 146}" fill="#6cc2f2"/>
  <rect y="214" width="${W}" height="${HZ - 210}" fill="#8fd2f6"/>

  <!-- CLOUDS -->
  <g stroke="${INK}" stroke-linejoin="round">
    <g class="t-cloud"><g transform="translate(-6 128) scale(.78)">
      <path d="M60 92C40 92 36 70 54 66C50 48 74 38 90 48C98 30 128 26 142 44C156 34 182 42 180 62C198 62 204 90 184 92Z" fill="#fff" stroke-width="4.4"/>
      <path d="M48 84C80 88 160 88 194 82C192 90 188 92 182 92H62C54 92 50 89 48 84Z" fill="#d3ecfa" stroke="none"/>
      <path d="M60 92C40 92 36 70 54 66C50 48 74 38 90 48C98 30 128 26 142 44C156 34 182 42 180 62C198 62 204 90 184 92Z" fill="none" stroke-width="4.4"/>
    </g></g>
    <g class="t-cloud t-cloud-b"><g transform="translate(70 -8) scale(.9)">
      <path d="M520 62C504 62 500 46 514 43C511 30 530 22 543 30C550 16 574 14 584 28C596 20 616 28 613 42C628 42 632 62 616 62Z" fill="#fff" stroke-width="3.8"/>
      <path d="M509 56C540 59 594 59 624 54C622 60 619 62 614 62H522C515 62 511 60 509 56Z" fill="#d3ecfa" stroke="none"/>
      <path d="M520 62C504 62 500 46 514 43C511 30 530 22 543 30C550 16 574 14 584 28C596 20 616 28 613 42C628 42 632 62 616 62Z" fill="none" stroke-width="3.8"/>
    </g></g>
  </g>

  <!-- FAR MOUNTAINS -->
  <g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
    <path d="M150 ${HZ}L232 196L270 218L338 164L402 214L436 196L512 ${HZ}Z" fill="#f4faff"/>
    <path d="M338 164L372 206L350 ${HZ}H424L402 214Z" fill="#c7e4f6" stroke="none"/>
    <path d="M232 196L248 236L226 ${HZ}H262L270 218Z" fill="#c7e4f6" stroke="none"/>
    <path d="M436 196L460 232L448 ${HZ}H512Z" fill="#c7e4f6" stroke="none"/>
    <path d="M150 ${HZ}L232 196L270 218L338 164L402 214L436 196L512 ${HZ}" fill="none"/>
    <path d="M470 ${HZ}L530 208L560 226L612 176L660 220L690 206L760 ${HZ}Z" fill="#f4faff"/>
    <path d="M612 176L640 214L622 ${HZ}H684L660 220Z" fill="#c7e4f6" stroke="none"/>
    <path d="M530 208L544 240L528 ${HZ}H556L560 226Z" fill="#c7e4f6" stroke="none"/>
    <path d="M470 ${HZ}L530 208L560 226L612 176L660 220L690 206L760 ${HZ}" fill="none"/>
  </g>

  <!-- SEA -->
  <rect y="${HZ}" width="${W}" height="${DECK - HZ}" fill="#2a87d6"/>
  <rect y="${HZ}" width="${W}" height="18" fill="#62b8ee"/>
  <rect y="${HZ + 18}" width="${W}" height="26" fill="#3f9be0"/>

  <!-- LIGHTHOUSE ON ITS ROCK -->
  <g stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    <g class="t-beam"><path d="M676 166L760 140L760 196Z" fill="#fff" stroke="none" opacity=".45"/></g>
    <path d="M600 ${HZ + 8}C610 246 640 238 656 240C676 232 712 238 734 ${HZ + 8}Z" fill="#7d8c99" stroke-width="3.6"/>
    <path d="M664 258C686 248 716 250 730 ${HZ + 6}H660Z" fill="#5e6c79" stroke="none"/>
    <path d="M606 258C620 244 640 240 656 241C676 234 696 236 708 242C690 244 672 250 660 246C644 244 624 250 606 258Z" fill="#fff" stroke-width="2.6"/>
    <path d="M650 244L656 176H684L690 244Z" fill="#f5f1e8" stroke-width="3.8"/>
    <path d="M672 176H684L690 244H676Z" fill="#e2dccf" stroke="none"/>
    <path d="M652 222L688 222L689.5 236L650.5 236Z" fill="#e24b3f" stroke="none"/>
    <path d="M654.4 196L685.6 196L686.8 210L653.2 210Z" fill="#e24b3f" stroke="none"/>
    <path d="M676 222H688.5L689.5 236H677Z M675 196H685.6L686.8 210H676Z" fill="#b03329" stroke="none"/>
    <path d="M650 244L656 176H684L690 244Z" fill="none" stroke-width="3.8"/>
    <path d="M660 190L659 236" stroke="#fff" stroke-width="2.6" opacity=".9"/>
    <rect x="648" y="172" width="44" height="7" rx="3" fill="#3d5670" stroke-width="3"/>
    <rect x="656" y="150" width="28" height="22" rx="4" fill="#ffe27a" stroke-width="3.6"/>
    <path d="M670 150V172" stroke-width="2.4"/>
    <path d="M650 152L670 134L690 152Z" fill="#e24b3f" stroke-width="3.6"/>
    <path d="M670 134L690 152H678Z" fill="#b03329" stroke="none"/>
    <path d="M652 151C658 144 664 140 670 136C676 140 684 146 688 151C682 148 676 148 672 151C666 147 658 148 652 151Z" fill="#fff" stroke-width="2.4"/>
    <path d="M650 152L670 134L690 152" fill="none" stroke-width="3.6"/>
    <circle cx="670" cy="130" r="3.4" fill="#ffd23f" stroke-width="2.4"/>
  </g>

  <!-- small iceberg -->
  <g stroke="${INK}" stroke-width="3" stroke-linejoin="round">
    <path d="M196 ${HZ + 22}L216 ${HZ + 2}L230 ${HZ + 10}L246 ${HZ - 4}L268 ${HZ + 22}Z" fill="#f4faff"/>
    <path d="M246 ${HZ - 4}L256 ${HZ + 14}L250 ${HZ + 22}H268Z" fill="#c7e4f6" stroke="none"/>
    <path d="M196 ${HZ + 22}L216 ${HZ + 2}L230 ${HZ + 10}L246 ${HZ - 4}L268 ${HZ + 22}" fill="none"/>
    <path d="M190 ${HZ + 24}H274" stroke="#c9ecff" stroke-width="3"/>
  </g>

  <!-- waves and glints -->
  <g class="t-waves" fill="none" stroke="#c9ecff" stroke-width="3" stroke-linecap="round">
    <path d="M300 300q8-6 16 0t16 0"/><path d="M520 292q6-5 12 0t12 0"/><path d="M590 330q10-7 20 0t20 0"/>
    <path d="M440 336q8-6 16 0t16 0"/><path d="M700 300q8-6 16 0t16 0"/><path d="M180 312q6-5 12 0t12 0"/>
  </g>
  <g class="t-sparkle" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round">
    <path d="M560 300l3 -9l3 9l9 3l-9 3l-3 9l-3 -9l-9 -3z"/>
  </g>
  <g fill="#fff"><circle cx="380" cy="284" r="2.2"/><circle cx="626" cy="316" r="2"/><circle cx="260" cy="340" r="2.4"/></g>

  <!-- BUOY -->
  <g class="t-bob" stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M500 326c0-12 9-19 16-19s16 7 16 19z" fill="#e24b3f" stroke-width="3.4"/>
    <path d="M502 318h28" stroke="#fff" stroke-width="5"/>
    <path d="M500 326c0-12 9-19 16-19s16 7 16 19z" fill="none" stroke-width="3.4"/>
    <path d="M516 307v-8" stroke-width="3"/><circle cx="516" cy="297" r="3" fill="#ffd23f" stroke-width="2.4"/>
    <path d="M494 327h44" stroke="#c9ecff" stroke-width="3"/>
  </g>

  ${'' /* BOAT placeholder */}
  BOAT_HERE

  <!-- DECK -->
  ${deck()}

  REST_HERE

  ${SNOW}
  ${GULL}
  ${RIBBON}
  ${wordmark}
</svg>
`
fs.writeFileSync(root + '/src/art/hello.svg', svg.replace('BOAT_HERE', BOATS).replace('REST_HERE', fs.readFileSync(new URL('./rest.svgpart', import.meta.url), 'utf8').replace('YOU_HERE', you).replace('CL_HERE', cl)))
console.log('ok')
