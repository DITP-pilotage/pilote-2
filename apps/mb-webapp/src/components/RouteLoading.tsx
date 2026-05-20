import { Body } from '@/components/ui/Body'
import { Section } from '@/components/ui/Section'

type RouteLoadingProps = {
  message?: string
}

export function RouteLoading({ message = 'Chargement…' }: RouteLoadingProps) {
  return (
    <Section>
      <Body tone="muted">{message}</Body>
    </Section>
  )
}
