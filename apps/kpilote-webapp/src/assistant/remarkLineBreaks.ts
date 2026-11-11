import type { MarkdownNode } from './remarkEntityLinks'

const BR = /^<br\s*\/?>$/iu

const replace = (node: MarkdownNode): void => {
  if (!node.children) return
  node.children = node.children.map((child) =>
    child.type === 'html' && BR.test(child.value?.trim() ?? '') ? { type: 'break' } : child,
  )
  node.children.forEach(replace)
}

/**
 * Le modèle écrit `<br>` pour aller à la ligne, surtout dans une cellule de tableau. Le
 * HTML n'est pas interprété : seuls ces `<br>` deviennent de vrais retours à la ligne.
 */
export const remarkLineBreaks = () => (tree: MarkdownNode) => {
  replace(tree)
}
