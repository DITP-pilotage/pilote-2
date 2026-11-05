const ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&#x27;': "'",
}

/**
 * Les commentaires sont saisis en HTML. Rendus tels quels, le modèle recopiait les balises
 * et les imitait dans ses réponses (constat PPG, PIL-1900) : les outils renvoient du texte.
 */
export const textFromHtml = (html: string): string =>
  html
    .replace(/<br\s*\/?>/giu, '\n')
    .replace(/<li[^<>]*>/giu, '\n• ')
    .replace(/<\/(p|div|h[1-6]|blockquote)>/giu, '\n\n')
    .replace(/<\/(ul|ol)>/giu, '\n')
    // `[^<>]` : sur une suite de `<` sans fermeture, `[^>]` backtrackait sur tout le reste.
    .replace(/<[^<>]*>/gu, '')
    .replace(/&(nbsp|amp|lt|gt|quot|#39|#x27);/gu, (entity) => ENTITIES[entity] ?? entity)
    .replace(/[ \t]{2,}/gu, ' ')
    .replace(/[ \t]+\n/gu, '\n')
    .replace(/\n{3,}/gu, '\n\n')
    .trim()
