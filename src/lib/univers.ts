/** Les univers du salon (confirmés par sa présentation publique). */
export const UNIVERS = [
  { name: 'Coiffure', icon: 'scissors', text: 'Coiffure mixte pour hommes et femmes.' },
  { name: 'Soins du visage', icon: 'sparkle', text: 'Soins esthétiques pour une peau nette et éclatante.' },
  { name: 'Hammam', icon: 'steam', text: 'Chaleur, vapeur et détente profonde.' },
  { name: 'Gommage', icon: 'leaf', text: 'Exfoliation et soins du corps.' },
  { name: 'Manucure & pédicure', icon: 'hand', text: 'Soins des mains et des pieds.' },
  { name: 'Massages', icon: 'lotus', text: 'Massages de bien-être pour relâcher les tensions.' },
] as const

/** Catégories proposées à l'admin pour les soins et la galerie. */
export const CATEGORIES = [...UNIVERS.map((u) => u.name), 'Formules']

/** Ordre d'affichage : univers d'abord, puis catégories libres éventuelles. */
export function sortCategories(cats: string[]): string[] {
  const rank = (c: string) => {
    const i = CATEGORIES.indexOf(c)
    return i === -1 ? 99 : i
  }
  return [...new Set(cats)].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}
