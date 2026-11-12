/**
 * Un lien vers une page de l'application : un chemin. Ni `//autre-site`, ni antislash ou
 * blanc (tabulation, retour à la ligne), que les navigateurs retirent ou lisent comme une
 * barre : `/\autre-site` mène ailleurs.
 */
export const isInternalHref = (href: string | undefined): href is string =>
  href !== undefined && /^\/(?![/\\])/.test(href) && !/[\\\s]/.test(href)
