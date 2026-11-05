// Types mdast minimaux : seuls ces nœuds sont manipulés ici.
export type MarkdownNode = {
  type: string
  value?: string
  url?: string
  children?: MarkdownNode[]
}

// Un modèle openweight n'emploie pas toujours le tiret ASCII (« IND‑42 » avec U+2011) :
// on accepte toute la famille, et l'URL est reconstruite depuis l'identifiant canonique.
const DASHES = '-‐‑‒–—−'
const ENTITY_PATTERN = new RegExp(`\\b(IND|COL)[${DASHES}](\\d+)\\b`, 'gu')

const PATHS: Record<string, string> = { IND: '/indicateurs', COL: '/collections' }

const splitText = (text: string): MarkdownNode[] | null => {
  const nodes: MarkdownNode[] = []
  let cursor = 0
  for (const match of text.matchAll(ENTITY_PATTERN)) {
    const [whole, prefix = '', digits = ''] = match
    const start = match.index
    if (start > cursor) nodes.push({ type: 'text', value: text.slice(cursor, start) })
    nodes.push({
      type: 'link',
      url: `${PATHS[prefix] ?? ''}/${prefix}-${digits}`,
      children: [{ type: 'text', value: whole }],
    })
    cursor = start + whole.length
  }
  if (nodes.length === 0) return null
  if (cursor < text.length) nodes.push({ type: 'text', value: text.slice(cursor) })
  return nodes
}

const linkify = (node: MarkdownNode): void => {
  if (!node.children) return
  node.children = node.children.flatMap((child) => {
    if (child.type === 'link' || child.type === 'linkReference') return [child]
    if (child.type === 'text' && child.value !== undefined) return splitText(child.value) ?? [child]
    linkify(child)
    return [child]
  })
}

/** Relie à leur page les indicateurs et collections que la réponse cite. */
export const remarkEntityLinks = () => (tree: MarkdownNode) => {
  linkify(tree)
}
