import DOMPurify from 'dompurify'
import { createElement, Fragment, type ReactNode } from 'react'

import { clsxm } from '../clsxm'
import { registreBlocs } from './registreBlocs'

export const classesRenduBase =
  '[&_p]:mb-3 [&_a]:text-primary [&_a]:underline [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:mt-6 [&_h1]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mt-6 [&_h2]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:mt-4 [&_h4]:mb-1 [&_h5]:text-base [&_h5]:font-semibold [&_h5]:mt-3 [&_h5]:mb-1 [&_h6]:text-sm [&_h6]:font-semibold [&_h6]:uppercase [&_h6]:tracking-wide [&_h6]:text-text-muted [&_h6]:mt-3 [&_h6]:mb-1 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-border-strong [&_blockquote]:pl-4 [&_blockquote]:italic [&_hr]:my-4 [&>*+*]:mt-2'

const ATTRS_DATA = ['data-type', 'data-color', 'data-title', 'data-icon-type', 'data-src']

const rendreEnfants = (element: Element): ReactNode =>
  Array.from(element.childNodes).map((enfant, index) => (
    <Fragment key={index}>{rendreNoeud(enfant)}</Fragment>
  ))

const rendreNoeud = (noeud: Node): ReactNode => {
  if (noeud.nodeType === Node.TEXT_NODE) return noeud.textContent
  if (noeud.nodeType !== Node.ELEMENT_NODE) return null

  const element = noeud as Element
  const dataType = element.getAttribute('data-type')
  if (dataType && registreBlocs[dataType]) {
    return registreBlocs[dataType].rendreDepuisElement(element, rendreEnfants)
  }

  const tag = element.tagName.toLowerCase()
  const props: Record<string, unknown> = {}
  for (const attr of Array.from(element.attributes)) {
    if (attr.name === 'class') props.className = attr.value
    else if (attr.name === 'data-type') continue
    // React attend un objet pour `style`, pas une string : on l'ignore ici.
    else if (attr.name === 'style') continue
    else props[attr.name] = attr.value
  }
  if (tag === 'br' || tag === 'img' || tag === 'hr') {
    return createElement(tag, props)
  }
  return createElement(tag, props, ...toArray(rendreEnfants(element)))
}

const toArray = (noeud: ReactNode): ReactNode[] => (Array.isArray(noeud) ? noeud : [noeud])

export function RenduContenuCentreAide({ html, className }: { html: string; className?: string }) {
  if (!html) return null
  const propre = DOMPurify.sanitize(html, { ADD_ATTR: ATTRS_DATA })
  const doc = new DOMParser().parseFromString(propre, 'text/html')
  return <div className={clsxm(classesRenduBase, className)}>{rendreEnfants(doc.body)}</div>
}
