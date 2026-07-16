import DOMPurify from 'dompurify'

import { Text } from '@pilote/kpilote-ui/Typography'
import { clsxm } from '@/lib/clsxm'

const classesRendu =
  '[&_p]:my-0 [&_p+p]:mt-2 [&_a]:text-primary [&_a]:underline [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5'

export function RenduContenuHtml({ html, className }: { html: string; className?: string }) {
  if (!html) {
    return <Text tone="muted">Aucun contenu.</Text>
  }
  // Le contenu est du HTML stocké côté API : on le sanitize (DOMPurify) avant
  // injection pour neutraliser tout script/handler malveillant.
  const htmlPropre = DOMPurify.sanitize(html)
  return (
    <div
      className={clsxm(classesRendu, className)}
      dangerouslySetInnerHTML={{ __html: htmlPropre }}
    />
  )
}
