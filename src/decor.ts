/**
 * Standing decor: drawn objects that live among the characters (not in the painted background), so the
 * penguin walks behind or in front of them by depth. Pure decoration; they take no clicks and change no rule.
 */
import type { Room } from './sim'

const INK = '#1a2332'

const SNOWMAN = `<svg viewBox="0 0 120 150" aria-hidden="true" style="overflow:visible">
  <ellipse cx="60" cy="146" rx="44" ry="7" fill="${INK}" opacity=".13"/>
  <g stroke="${INK}" stroke-linejoin="round" stroke-linecap="round">
    <path d="M22 116C22 92 40 82 60 82C80 82 98 92 98 116C98 136 82 146 60 146C38 146 22 136 22 116Z" fill="#fff" stroke-width="4.6"/>
    <path d="M86 94C94 102 98 112 96 124C94 138 80 146 64 146C80 138 90 124 88 110C88 104 87 99 86 94Z" fill="#d6ecf9" stroke="none"/>
    <path d="M22 116C22 92 40 82 60 82C80 82 98 92 98 116C98 136 82 146 60 146C38 146 22 136 22 116Z" fill="none" stroke-width="4.6"/>
    <path d="M34 60C34 44 46 36 60 36C74 36 86 44 86 60C86 76 74 86 60 86C46 86 34 76 34 60Z" fill="#fff" stroke-width="4.4"/>
    <path d="M78 46C84 52 86 60 84 68C82 78 74 84 64 86C74 78 80 68 80 58C80 54 79 50 78 46Z" fill="#d6ecf9" stroke="none"/>
    <path d="M34 60C34 44 46 36 60 36C74 36 86 44 86 60C86 76 74 86 60 86C46 86 34 76 34 60Z" fill="none" stroke-width="4.4"/>
    <circle cx="52" cy="56" r="3.4" fill="${INK}" stroke="none"/><circle cx="68" cy="56" r="3.4" fill="${INK}" stroke="none"/>
    <path d="M60 62l18 4l-18 4z" fill="#f08a2c" stroke-width="2.4"/>
    <path d="M50 74c6 4 14 4 20 0" fill="none" stroke-width="2.4"/>
    <path d="M36 80C46 88 74 88 84 80L86 90C74 98 46 98 34 90Z" fill="#e24b3f" stroke-width="3.4"/>
    <path d="M70 90l6 22l10-2l-6-20z" fill="#e24b3f" stroke-width="3.2"/>
    <path d="M44 86h4M56 88h4M68 87h4" stroke="#fff" stroke-width="3"/>
    <circle cx="60" cy="104" r="3.4" fill="${INK}" stroke="none"/><circle cx="60" cy="118" r="3.4" fill="${INK}" stroke="none"/>
    <path d="M26 100L4 82M8 86L0 80M8 86l2-9" fill="none" stroke="#7a4a27" stroke-width="4"/>
    <path d="M94 100L112 78" fill="none" stroke="#7a4a27" stroke-width="4"/>
    <path d="M40 40C40 26 50 20 60 20C70 20 80 26 80 40Z" fill="#3d4d63" stroke-width="4"/>
    <path d="M32 40H88V46H32Z" fill="#2a3646" stroke-width="3.4"/>
    <path d="M40 34h40" stroke="#e24b3f" stroke-width="4"/>
    <path d="M102 54h34v22h-34z" fill="#f3d7a1" stroke-width="3.2" transform="rotate(-8 119 65)"/>
    <path d="M112 76l2 8" stroke="#7a4a27" stroke-width="3"/>
    <text x="119" y="69" text-anchor="middle" transform="rotate(-8 119 65)" font-family="Fredoka" font-weight="700" font-size="10" fill="${INK}" stroke="none">HELLO!</text>
    <path d="M30 128l4 2M84 132l-3 3M48 96l2 3" fill="none" stroke-width="1.8"/>
  </g>
</svg>`

const DECOR: { room: Room; x: number; y: number; w: number; h: number; svg: string }[] = [
  { room: 'quay', x: 790, y: 606, w: 96, h: 120, svg: SNOWMAN },
]

/** Place the decor once. Each piece sorts by its base y among the characters. */
export function createDecor(objectsFor: (room: Room) => HTMLElement) {
  for (const piece of DECOR) {
    const el = document.createElement('div')
    el.className = 'decor'
    el.style.cssText = `position:absolute;left:${piece.x - piece.w / 2}px;top:${piece.y - piece.h}px;width:${piece.w}px;height:${piece.h}px;z-index:${piece.y};pointer-events:none`
    el.innerHTML = piece.svg
    objectsFor(piece.room).appendChild(el)
  }
}
