import { clsxm } from '../clsxm'
import { registreIcones } from './registreIcones'

export function IconeCentreAide({ type, className }: { type: string; className?: string }) {
  const Icone = registreIcones[type]
  if (!Icone) return null
  return <Icone className={clsxm('inline-block size-5 align-middle', className)} />
}
