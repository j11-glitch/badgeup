// Quick picks for badge emoji, built from code points so the source stays ASCII.
const e = (...codePoints: number[]) => String.fromCodePoint(...codePoints)

export const EMOJI_CHOICES = [
  e(0x2b50), // star
  e(0x1f3c6), // trophy
  e(0x1f947), // gold medal
  e(0x1f3c5), // sports medal
  e(0x1f525), // fire
  e(0x1f680), // rocket
  e(0x1f4a1), // light bulb
  e(0x1f4da), // books
  e(0x1f91d), // handshake
  e(0x2764, 0xfe0f), // heart
  e(0x1f3af), // target
  e(0x1f3a8), // palette
  e(0x1f3b5), // music note
  e(0x26bd), // football
  e(0x1f9e9), // puzzle piece
  e(0x1f463), // footprints
]
