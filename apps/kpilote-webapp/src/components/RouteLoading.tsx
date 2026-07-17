import { Section } from '@pilote/kpilote-ui/Section'
import { Text } from '@pilote/kpilote-ui/Typography'

type RouteLoadingProps = {
  message?: string
}

export function RouteLoading({ message = 'Chargement…' }: RouteLoadingProps) {
  return (
    <Section>
      <Text tone="muted">{message}</Text>
    </Section>
  )
}
