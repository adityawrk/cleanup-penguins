import type { Item } from './sim'

/**
 * Drawn objects for items in the hold. Every item is an SVG in a 120×100 box with its base at (60, 96),
 * so the prop element's bottom center is where it stands on the floor.
 * The size is stamped on the object itself, so the object reads before its label.
 */

const INK = '#1a2332'

/** Burlap tints, picked by name so the same cache always looks the same. */
const SACKS = [
  { body: '#d9b47c', shade: '#b98b51', patch: '#f3e3bf' },
  { body: '#cfa66c', shade: '#a87a45', patch: '#f6ead0' },
  { body: '#e2c28e', shade: '#c09a5e', patch: '#fff6e4' },
  { body: '#c9a06a', shade: '#9e7442', patch: '#f3e3bf' },
]
const TIES = ['#e24b3f', '#3aa0f2', '#5bb04b', '#f4c534', '#9b6bd6', '#f08a2c']

function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return Math.abs(h)
}

function esc(text: string): string {
  return text.replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]!)
}

/** Bigger on disk means bigger on the floor: 0.1 GB is 0.78×, 50 GB is about 1.2×. */
export function sizeScale(tenths: number): number {
  const t = Math.min(1, Math.log10(1 + tenths / 10) / Math.log10(50))
  return 0.78 + t * 0.42
}

export function stampText(tenths: number): string {
  const gb = tenths / 10
  if (gb >= 10) return `${Math.round(gb)}`
  return gb.toFixed(1)
}

function sack(item: Pick<Item, 'name' | 'tenths'>): string {
  const h = hash(item.name)
  const c = SACKS[h % SACKS.length]
  const tie = TIES[(h >> 3) % TIES.length]
  const stamp = esc(stampText(item.tenths))
  return `
  <ellipse cx="60" cy="95" rx="40" ry="6" fill="${INK}" opacity=".18"/>
  <g stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M60 30C34 30 20 52 20 72C20 88 34 96 60 96C86 96 100 88 100 72C100 52 86 30 60 30Z" fill="${c.body}" stroke-width="4.4"/>
    <path d="M86 40C96 52 100 62 100 72C100 88 86 96 60 96C74 90 84 80 86 62C87 54 87 46 86 40Z" fill="${c.shade}" stroke="none"/>
    <path d="M30 60C34 50 40 44 46 40" fill="none" stroke="#fff" stroke-width="3.4" opacity=".55"/>
    <path d="M60 30C34 30 20 52 20 72C20 88 34 96 60 96C86 96 100 88 100 72C100 52 86 30 60 30Z" fill="none" stroke-width="4.4"/>
    <path d="M46 32C40 22 44 12 52 10C54 16 58 18 60 18C62 18 66 16 68 10C76 12 80 22 74 32Z" fill="${c.body}" stroke-width="3.6"/>
    <path d="M66 14C72 16 76 24 72 32H64C68 26 68 20 66 14Z" fill="${c.shade}" stroke="none"/>
    <path d="M46 32C40 22 44 12 52 10C54 16 58 18 60 18C62 18 66 16 68 10C76 12 80 22 74 32Z" fill="none" stroke-width="3.6"/>
    <path d="M44 30C52 35 68 35 76 30" fill="none" stroke="${tie}" stroke-width="7"/>
    <path d="M44 30C52 35 68 35 76 30" fill="none" stroke-width="2" opacity=".5"/>
    <path d="M74 31l8 8M74 31l10 2" stroke="${tie}" stroke-width="4"/>
    <rect x="34" y="56" width="52" height="28" rx="6" fill="${c.patch}" stroke-width="2.8" transform="rotate(-4 60 70)"/>
    <text x="60" y="77" text-anchor="middle" transform="rotate(-4 60 70)" class="stamp" fill="${INK}" stroke="none">${stamp}</text>
  </g>`
}

function packed(item: Pick<Item, 'name' | 'tenths'>): string {
  const stamp = esc(stampText(item.tenths))
  const mini = (x: number, y: number, s: number, fill: string, shade: string, tie: string) => `
    <g transform="translate(${x} ${y}) scale(${s})">
      <path d="M0 -26C-14 -26 -22 -14 -22 -2C-22 8 -14 12 0 12C14 12 22 8 22 -2C22 -14 14 -26 0 -26Z" fill="${fill}" stroke-width="4"/>
      <path d="M12 -20C20 -12 22 -6 22 -2C22 8 14 12 0 12C8 8 12 2 13 -8Z" fill="${shade}" stroke="none"/>
      <path d="M0 -26C-14 -26 -22 -14 -22 -2C-22 8 -14 12 0 12C14 12 22 8 22 -2C22 -14 14 -26 0 -26Z" fill="none" stroke-width="4"/>
      <path d="M-7 -25C-9 -32 -4 -36 0 -34C4 -36 9 -32 7 -25Z" fill="${fill}" stroke-width="3.4"/>
      <path d="M-8 -25h16" stroke="${tie}" stroke-width="5"/>
    </g>`
  return `
  <ellipse cx="60" cy="95" rx="48" ry="6" fill="${INK}" opacity=".18"/>
  <g stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    ${mini(34, 66, 0.95, '#cfa66c', '#a87a45', '#3aa0f2')}
    ${mini(84, 68, 0.9, '#e2c28e', '#c09a5e', '#e24b3f')}
    ${mini(58, 48, 0.85, '#d9b47c', '#b98b51', '#5bb04b')}
    ${mini(40, 86, 0.8, '#e2c28e', '#c09a5e', '#f4c534')}
    ${mini(78, 88, 0.82, '#c9a06a', '#9e7442', '#9b6bd6')}
    <path d="M14 58C24 40 44 26 60 24C78 26 98 40 106 60C108 76 102 92 92 96H28C18 92 12 76 14 58Z" fill="none" stroke="#c9a46a" stroke-width="3"/>
    <path d="M22 50L98 90M18 72L80 98M38 34L104 74M60 24L108 62M98 50L28 96M84 34L18 80M62 26L14 62" fill="none" stroke="#c9a46a" stroke-width="2.2" opacity=".9"/>
    <path d="M14 58C24 40 44 26 60 24C78 26 98 40 106 60C108 76 102 92 92 96H28C18 92 12 76 14 58Z" fill="none" stroke-width="1.6" opacity=".45"/>
    <rect x="72" y="14" width="40" height="22" rx="5" fill="#fff6e4" stroke-width="2.6" transform="rotate(8 92 25)"/>
    <text x="92" y="30" text-anchor="middle" transform="rotate(8 92 25)" class="stamp small" fill="${INK}" stroke="none">${stamp}</text>
    <path d="M72 22l-8-6" stroke-width="2"/>
  </g>`
}

function crate(item: Pick<Item, 'name' | 'tenths'>): string {
  const stamp = esc(stampText(item.tenths))
  return `
  <ellipse cx="60" cy="95" rx="48" ry="6" fill="${INK}" opacity=".18"/>
  <g stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M16 38L34 24H104L86 38Z" fill="#f0cd8a" stroke-width="4"/>
    <path d="M86 38L104 24V80L86 96Z" fill="#b07a3c" stroke-width="4"/>
    <path d="M95 31V88" stroke="#8d5a32" stroke-width="3"/>
    <rect x="16" y="38" width="70" height="58" rx="2" fill="#e0b56a" stroke-width="4.4"/>
    <path d="M18 57h66M18 77h66" stroke="#b07a3c" stroke-width="3"/>
    <path d="M24 42v50M78 42v50" stroke="#c48945" stroke-width="7"/>
    <path d="M24 42v50M78 42v50" stroke="${INK}" stroke-width="1.6" opacity=".35"/>
    <rect x="16" y="38" width="70" height="58" rx="2" fill="none" stroke-width="4.4"/>
    <path d="M30 48l42 40M72 48L30 88" stroke="#b07a3c" stroke-width="0"/>
    <rect x="30" y="52" width="42" height="28" rx="4" fill="#fff6e4" stroke-width="2.6" transform="rotate(-3 51 66)"/>
    <text x="51" y="73" text-anchor="middle" transform="rotate(-3 51 66)" class="stamp" fill="#b03329" stroke="none">${stamp}</text>
    <path d="M40 30c10-6 30-6 40 0" fill="none" stroke="#c9a46a" stroke-width="3.4"/>
  </g>`
}

function trunk(item: Pick<Item, 'name' | 'tenths'>): string {
  const stamp = esc(stampText(item.tenths))
  return `
  <ellipse cx="60" cy="95" rx="50" ry="6" fill="${INK}" opacity=".18"/>
  <g stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M12 52C12 34 26 28 60 28C94 28 108 34 108 52Z" fill="#a85f45" stroke-width="4.2"/>
    <path d="M80 29C100 31 108 38 108 52H86C86 42 84 34 80 29Z" fill="#8d4f3a" stroke="none"/>
    <path d="M12 52C12 34 26 28 60 28C94 28 108 34 108 52Z" fill="none" stroke-width="4.2"/>
    <rect x="12" y="52" width="96" height="44" rx="5" fill="#8d4f3a" stroke-width="4.4"/>
    <rect x="84" y="54" width="22" height="40" fill="#6f3a2a" stroke="none"/>
    <rect x="12" y="52" width="96" height="44" rx="5" fill="none" stroke-width="4.4"/>
    <path d="M32 30v66M88 30v66" stroke="#c99a4a" stroke-width="8"/>
    <path d="M32 30v66M88 30v66" stroke="${INK}" stroke-width="1.6" opacity=".4"/>
    <path d="M12 52h96" stroke="#c99a4a" stroke-width="5"/>
    <path d="M12 52h96" stroke-width="1.6" opacity=".4"/>
    <rect x="52" y="46" width="16" height="16" rx="3" fill="#f0d78c" stroke-width="2.8"/>
    <circle cx="60" cy="55" r="2.2" fill="${INK}" stroke="none"/>
    <circle cx="44" cy="76" r="9" fill="#3aa0f2" stroke-width="2.4"/>
    <path d="M38 76h12M44 70v12" stroke="#fff" stroke-width="2"/>
    <rect x="58" y="68" width="24" height="18" rx="3" fill="#ffd23f" stroke-width="2.4" transform="rotate(8 70 77)"/>
    <text x="70" y="81" text-anchor="middle" transform="rotate(8 70 77)" class="stamp tiny" fill="${INK}" stroke="none">${stamp}</text>
    <path d="M14 92h8v-8M106 92h-8v-8M14 56h8M106 56h-8" fill="none" stroke="#f0d78c" stroke-width="3"/>
  </g>`
}

function disk(item: Pick<Item, 'name' | 'tenths'>): string {
  const stamp = esc(stampText(item.tenths))
  return `
  <ellipse cx="60" cy="95" rx="42" ry="6" fill="${INK}" opacity=".18"/>
  <g stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M30 96L38 80H82L90 96Z" fill="#9a6236" stroke-width="3.6"/>
    <circle cx="60" cy="56" r="40" fill="#dfe8ef" stroke-width="4.4"/>
    <path d="M60 16A40 40 0 0 1 100 56A40 40 0 0 1 60 96A40 40 0 0 0 86 56A40 40 0 0 0 60 16Z" fill="#b9c9d6" stroke="none"/>
    <path d="M34 34A34 34 0 0 1 56 22" fill="none" stroke="#9cc7e3" stroke-width="5"/>
    <path d="M30 46A32 32 0 0 1 36 36" fill="none" stroke="#f2a6c4" stroke-width="5"/>
    <path d="M86 74A32 32 0 0 1 74 84" fill="none" stroke="#ffe27a" stroke-width="5"/>
    <circle cx="60" cy="56" r="40" fill="none" stroke-width="4.4"/>
    <circle cx="60" cy="56" r="13" fill="#fff6e4" stroke-width="3"/>
    <circle cx="60" cy="56" r="4.5" fill="#1a2332" stroke="none"/>
    <path d="M26 64c4 10 12 18 22 22" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/>
    <rect x="66" y="8" width="44" height="22" rx="5" fill="#fff6e4" stroke-width="2.6" transform="rotate(10 88 19)"/>
    <text x="88" y="24" text-anchor="middle" transform="rotate(10 88 19)" class="stamp small" fill="${INK}" stroke="none">${stamp}</text>
  </g>`
}

export function itemSvg(item: Pick<Item, 'form' | 'name' | 'tenths'>): string {
  const body =
    item.form === 'packed' ? packed(item)
    : item.form === 'crate' ? crate(item)
    : item.form === 'trunk' ? trunk(item)
    : item.form === 'disk' ? disk(item)
    : sack(item)
  return `<svg viewBox="0 0 120 100" class="item-art" aria-hidden="true">${body}</svg>`
}
