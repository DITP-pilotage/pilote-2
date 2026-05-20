import { Section } from '@/components/ui/Section'

type RouteLoadingProps = {
  message?: string
}

export function RouteLoading({ message = 'Chargement…' }: RouteLoadingProps) {
  return (
    <Section>
      <p className="text-sm text-text-muted">{message}</p>
    </Section>
  )
}
