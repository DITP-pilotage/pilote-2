import { Section } from '@/components/ui/Section'
import { Text } from '@/components/ui/Typography'

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
