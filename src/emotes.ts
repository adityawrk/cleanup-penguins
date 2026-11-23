/** Emote icons the player can pop over their head from the dock. Drawn, not font emoji. */
const INK = '#1a2332'

const face = (mouth: string, extra = '') => `
  <circle cx="20" cy="20" r="16" fill="#ffd23f" stroke="${INK}" stroke-width="3"/>
  <path d="M30 10a16 16 0 0 1 2 18" fill="none" stroke="#e9a913" stroke-width="4" stroke-linecap="round"/>
  ${extra}${mouth}`

export const EMOTES: { id: string; label: string; svg: string }[] = [
  {
    id: 'happy',
    label: 'Happy',
    svg: face(
      '<path d="M12 22c3 6 13 6 16 0" fill="none" stroke="#1a2332" stroke-width="3" stroke-linecap="round"/>',
      '<ellipse cx="14" cy="15" rx="2.4" ry="3.2" fill="#1a2332"/><ellipse cx="26" cy="15" rx="2.4" ry="3.2" fill="#1a2332"/>',
    ),
  },
  {
    id: 'laugh',
    label: 'Laugh',
    svg: face(
      '<path d="M11 20h18c0 7-4 11-9 11s-9-4-9-11z" fill="#fff" stroke="#1a2332" stroke-width="2.6" stroke-linejoin="round"/><path d="M14 27c3 3 9 3 12 0" fill="#f27d32"/>',
      '<path d="M11 15l4-3l-4-3M29 15l-4-3l4-3" fill="none" stroke="#1a2332" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    ),
  },
  {
    id: 'heart',
    label: 'Heart',
    svg: '<path d="M20 34C8 26 4 19 4 13C4 8 8 4 13 4C16 4 18 6 20 9C22 6 24 4 27 4C32 4 36 8 36 13C36 19 32 26 20 34Z" fill="#e24b3f" stroke="#1a2332" stroke-width="3" stroke-linejoin="round"/><path d="M10 12c0-3 2-5 4-5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/>',
  },
  {
    id: 'fish',
    label: 'Fish',
    svg: '<path d="M4 20C10 10 24 8 31 20C24 32 10 30 4 20Z" fill="#f27d32" stroke="#1a2332" stroke-width="3" stroke-linejoin="round"/><path d="M31 20L38 13V27Z" fill="#f27d32" stroke="#1a2332" stroke-width="3" stroke-linejoin="round"/><circle cx="12" cy="18" r="2" fill="#1a2332"/><path d="M18 14c2 4 2 8 0 12" fill="none" stroke="#c4661a" stroke-width="2.4" stroke-linecap="round"/>',
  },
  {
    id: 'wow',
    label: 'Wow',
    svg: face(
      '<ellipse cx="20" cy="25" rx="4" ry="5" fill="#1a2332"/>',
      '<circle cx="14" cy="15" r="3.4" fill="#fff" stroke="#1a2332" stroke-width="2"/><circle cx="26" cy="15" r="3.4" fill="#fff" stroke="#1a2332" stroke-width="2"/><circle cx="14" cy="15" r="1.4" fill="#1a2332"/><circle cx="26" cy="15" r="1.4" fill="#1a2332"/>',
    ),
  },
  {
    id: 'sparkle',
    label: 'Clean!',
    svg: '<path d="M20 3L24 16L37 20L24 24L20 37L16 24L3 20L16 16Z" fill="#8fd2f6" stroke="#1a2332" stroke-width="3" stroke-linejoin="round"/><path d="M33 4l1.6 4.4L39 10l-4.4 1.6L33 16l-1.6-4.4L27 10l4.4-1.6Z" fill="#ffd23f" stroke="#1a2332" stroke-width="2" stroke-linejoin="round"/>',
  },
]

export function emoteSvg(id: string): string {
  const found = EMOTES.find((emote) => emote.id === id) ?? EMOTES[0]
  return `<svg viewBox="0 0 40 40" aria-hidden="true">${found.svg}</svg>`
}
