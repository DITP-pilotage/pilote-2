// Les blocs custom transportent leurs URLs dans des attributs data-* (ex. data-src
// de la vidéo) que DOMPurify ne valide PAS comme des URLs. On revalide donc le
// schéma nous-mêmes avant d'injecter dans un iframe : http/https absolus uniquement.
export const estUrlHttpSure = (url: string): boolean => {
  try {
    const parsee = new URL(url)
    return parsee.protocol === 'https:' || parsee.protocol === 'http:'
  } catch {
    return false
  }
}
