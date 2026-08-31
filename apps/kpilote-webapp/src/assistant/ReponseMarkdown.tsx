import { Link } from '@tanstack/react-router'
import { memo } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { nettoyerPseudoAppels } from './nettoyerPseudoAppels'

const remarkPlugins = [remarkGfm]

// Les éléments sont stylés un par un plutôt que par un plugin typographique : la palette
// vient des tokens du projet, et le rendu d'une réponse d'assistant n'a pas les mêmes
// besoins qu'un article — pas de grands titres, des marges resserrées.
const COMPOSANTS: Components = {
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
  a: ({ href, children }) =>
    // Un lien interne reste dans l'application ; l'externe s'ouvre à côté.
    href?.startsWith('/') ? (
      <Link to={href} className="text-primary underline underline-offset-2">
        {children}
      </Link>
    ) : (
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className="text-primary underline underline-offset-2"
      >
        {children}
      </a>
    ),
}

export const ReponseMarkdown = memo(function ReponseMarkdown({ texte }: { texte: string }) {
  const nettoye = nettoyerPseudoAppels(texte)
  if (nettoye.length === 0) return null

  return (
    <div className="text-text">
      <ReactMarkdown remarkPlugins={remarkPlugins} components={COMPOSANTS}>
        {nettoye}
      </ReactMarkdown>
    </div>
  )
})
