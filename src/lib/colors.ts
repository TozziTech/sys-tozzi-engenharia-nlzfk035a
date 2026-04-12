/**
 * Calculates whether black or white text provides better contrast
 * for a given hex background color using the YIQ formula.
 */
export function getContrastYIQ(hexcolor: string): 'black' | 'white' {
  if (!hexcolor) return 'black'
  hexcolor = hexcolor.replace('#', '')

  // Handle 3-digit hex codes
  if (hexcolor.length === 3) {
    hexcolor = hexcolor
      .split('')
      .map((c) => c + c)
      .join('')
  }

  const r = parseInt(hexcolor.substr(0, 2), 16)
  const g = parseInt(hexcolor.substr(2, 2), 16)
  const b = parseInt(hexcolor.substr(4, 2), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) return 'black'

  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  return yiq >= 128 ? 'black' : 'white'
}
