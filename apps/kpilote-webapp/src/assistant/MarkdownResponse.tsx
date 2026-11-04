import { Link } from '@tanstack/react-router'
import { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cleanPseudoCalls } from './cleanPseudoCalls'
import { flattenLatex } from './flattenLatex'
import { remarkEntityLinks } from './remarkEntityLinks'
import { remarkLineBreaks } from './remarkLineBreaks'

const remarkPlugins = [remarkGfm, remarkLineBreaks, remarkEntityLinks]

// Les éléments sont stylés un par un plutôt que par un plugin typographique : la palette
// vient des tokens du projet, et le rendu d'une réponse d'assistant n'a pas les mêmes
// besoins qu'un article — pas de grands titres, des marges resserrées.
const COMPONENTS: Components = {
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-text">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5">{children}</li>,
  h1: ({ children }) => <h4 className="mb-1 mt-4 font-semibold first:mt-0">{children}</h4>,
  h2: ({ children }) => <h4 className="mb-1 mt-4 font-semibold first:mt-0">{children}</h4>,
  h3: ({ children }) => <h4 className="mb-1 mt-4 font-semibold first:mt-0">{children}</h4>,
  h4: ({ children }) => <h4 className="mb-1 mt-4 font-semibold first:mt-0">{children}</h4>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-2 border-border-strong pl-3 text-text-muted">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-surface-tinted px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
  hr: () => <hr className="my-3 border-border" />,
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-border px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-border px-2 py-1">{children}</td>,
  // Seuls les liens internes sont cliquables. Le modèle ne doit pas écrire de lien, et un
  // contenu saisi pourrait lui en faire écrire un vers l'extérieur : il reste du texte, et
  // aucune image n'est chargée.
  a: ({ href, children }) =>
    href?.startsWith('/') && !href.startsWith('//') ? (
      <Link to={href} className="text-primary underline underline-offset-2">
        {children}
      </Link>
    ) : (
      <span>{children}</span>
    ),
  img: () => null,
}

// Un encart se lit comme une note : de vrais titres, des citations et des en-têtes marqués.
const REPORT_COMPONENTS: Components = {
  ...COMPONENTS,
  // Une note exportée ne porte aucun lien : il serait mort dans le PDF.
  a: ({ children }) => <span>{children}</span>,
  h1: ({ children }) => <h3 className="mb-3 mt-0 text-[22px] font-bold leading-8">{children}</h3>,
  h2: ({ children }) => <h4 className="mb-2 mt-5 text-[17px] font-bold">{children}</h4>,
  h3: ({ children }) => <h5 className="mb-1 mt-4 text-[15px] font-bold">{children}</h5>,
  hr: () => <hr className="my-5 border-border" />,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-4 border-primary bg-primary-tinted px-4 py-2 text-text">
      {children}
    </blockquote>
  ),
  th: ({ children }) => (
    <th className="border-b border-border bg-primary-tinted px-2 py-1.5 text-left font-semibold">
      {children}
    </th>
  ),
}

export const MarkdownResponse = memo(function MarkdownResponse({
  text,
  variant = 'answer',
}: {
  text: string
  variant?: 'answer' | 'report'
}) {
  const cleaned = flattenLatex(cleanPseudoCalls(text))
  if (cleaned.length === 0) return null

  return (
    <div className="text-text">
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        components={variant === 'report' ? REPORT_COMPONENTS : COMPONENTS}
      >
        {cleaned}
      </ReactMarkdown>
    </div>
  )
})
