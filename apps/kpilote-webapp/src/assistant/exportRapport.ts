/** Les éléments de l'encart à ne pas imprimer, comme ses boutons. */
export const NO_PRINT = { 'data-no-print': '' }

// L'encart sort de la colonne de discussion : sur papier, il occupe la page.
const PRINT_STYLES = `
  @page { margin: 16mm 14mm; }
  html, body { margin: 0; background: #ffffff; }
  body {
    font-size: 15px;
    line-height: 1.5rem;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  [data-rapport] {
    margin: 0 !important;
    padding: 24px 0 0 !important;
    border-left: 0 !important;
    border-right: 0 !important;
    border-bottom: 0 !important;
    box-shadow: none !important;
  }
  [data-rapport] div { overflow: visible !important; }
  [data-rapport] table { table-layout: fixed; font-size: 11px; }
  h3, h4, h5 { break-after: avoid; }
  tr, li, blockquote { break-inside: avoid; }
`

const loaded = (link: HTMLLinkElement): Promise<void> =>
  new Promise((resolve) => {
    link.addEventListener('load', () => resolve())
    link.addEventListener('error', () => resolve())
  })

/**
 * Le PDF d'un encart : l'encart tel qu'affiché, avec les styles de la page, imprimé par le
 * navigateur dans un cadre invisible. Le titre du document nomme le fichier proposé.
 */
export const printRapport = async ({
  element,
  title,
}: {
  element: HTMLElement
  title: string
}): Promise<void> => {
  const frame = document.createElement('iframe')
  frame.setAttribute('aria-hidden', 'true')
  frame.tabIndex = -1
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;'
  document.body.append(frame)

  const view = frame.contentWindow
  const printed = frame.contentDocument
  if (view === null || printed === null) {
    frame.remove()
    throw new Error("Le cadre d'impression n'a pas pu être créé")
  }

  const base = printed.createElement('base')
  base.href = document.baseURI
  const styles = [...document.querySelectorAll('link[rel="stylesheet"], style')].map((node) =>
    printed.importNode(node, true),
  )
  const printStyles = printed.createElement('style')
  printStyles.textContent = PRINT_STYLES
  printed.head.append(base, ...styles, printStyles)

  const content = printed.importNode(element, true)
  content.querySelectorAll('[data-no-print]').forEach((node) => node.remove())
  printed.body.append(content)
  printed.documentElement.lang = 'fr'
  printed.title = title

  await Promise.all(
    styles
      .filter((node): node is HTMLLinkElement => node.nodeName === 'LINK')
      .map((link) => loaded(link)),
  )
  await printed.fonts.ready

  // Chrome nomme le PDF d'après le titre de la page, pas celui du cadre.
  const pageTitle = document.title
  document.title = title
  view.addEventListener('afterprint', () => {
    document.title = pageTitle
    frame.remove()
  })
  view.focus()
  view.print()
}
