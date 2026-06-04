import { useQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, BarChart3, ShoppingBasket } from 'lucide-react'
import type { ReactNode } from 'react'

import { fetchSharedMessage } from '@/api/sharedMessage'
import { Button } from '@/components/ui/Button'
import { Section } from '@/components/ui/Section'
import { Heading, Text } from '@/components/ui/Typography'

export const Route = createFileRoute('/')({
  component: HomeComponent,
})

function HomeComponent() {
  const { auth } = Route.useRouteContext()

  return (
    <div className="space-y-20 sm:space-y-28">
      <HeroSection isAuthenticated={auth.isAuthenticated} onLogin={() => auth.login()} />

      <CapabilitiesSection />

      <ConnectionStatusSection isAuthenticated={auth.isAuthenticated} />
    </div>
  )
}

function HeroSection({
  isAuthenticated,
  onLogin,
}: {
  isAuthenticated: boolean
  onLogin: () => void
}) {
  return (
    <section className="grid items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-8">
        <Text as="span" variant="kicker">
          Pilote
        </Text>
        <Heading as="h1" size="display-lg" className="text-balance">
          Piloter vos indicateurs publics, simplement.
        </Heading>
        <Text variant="lead" tone="muted" className="max-w-xl">
          Consultez, analysez et partagez les données qui structurent l'action publique. Une seule
          interface pour explorer indicateurs, paniers thématiques et territoires.
        </Text>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button asChild size="lg">
            <Link to="/indicateurs" search={{}}>
              Explorer les indicateurs
              <ArrowRight />
            </Link>
          </Button>
          {!isAuthenticated && (
            <Button variant="secondary" size="lg" type="button" onClick={onLogin}>
              Se connecter
            </Button>
          )}
        </div>
      </div>

      <HeroVisual />
    </section>
  )
}

function HeroVisual() {
  return (
    <div className="relative hidden lg:block">
      <div className="absolute inset-0 -m-8 rounded-3xl bg-surface-tinted" aria-hidden />
      <div className="relative space-y-4 rounded-2xl bg-surface p-6 shadow-[0_20px_40px_rgba(0,0,145,0.06)]">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <Text as="span" variant="kicker">
            Aperçu indicateur
          </Text>
          <div className="flex gap-1.5">
            <span className="size-2 rounded-full bg-border-strong" />
            <span className="size-2 rounded-full bg-border-strong" />
            <span className="size-2 rounded-full bg-border-strong" />
          </div>
        </div>

        <div className="space-y-1">
          <Text variant="caption" tone="muted">
            Taux d'accès aux services numériques
          </Text>
          <Heading as="p" size="display-md" tone="primary">
            87,4 %
          </Heading>
          <Text variant="caption" tone="positive">
            +2,1 pts sur 12 mois
          </Text>
        </div>

        <FakeChart />

        <div className="grid grid-cols-3 gap-3 border-t border-border pt-4">
          <MiniStat label="Min" value="62,1" />
          <MiniStat label="Médiane" value="84,9" />
          <MiniStat label="Max" value="98,3" />
        </div>
      </div>
    </div>
  )
}

function FakeChart() {
  const bars = [38, 52, 44, 61, 70, 58, 72, 84, 78, 88, 92, 87]
  return (
    <div className="flex h-32 items-end gap-1.5 pt-2">
      {bars.map((value, index) => (
        <div key={index} className="flex-1 rounded-t bg-primary/15" style={{ height: `${value}%` }}>
          <div
            className="h-full rounded-t bg-primary"
            style={{ opacity: index === bars.length - 1 ? 1 : 0.35 }}
          />
        </div>
      ))}
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <Text as="span" variant="caption" tone="subtle">
        {label}
      </Text>
      <Text as="p" weight="semibold">
        {value}
      </Text>
    </div>
  )
}

function CapabilitiesSection() {
  return (
    <Section
      tone="plain"
      kicker="Ce que vous pouvez faire"
      title="Deux entrées, une même boussole"
      description="Que vous partiez d'une mesure précise ou d'un thème transverse, l'application vous emmène jusqu'aux territoires."
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <CapabilityCard
          icon={<BarChart3 className="size-5" />}
          title="Indicateurs"
          description="Toutes les mesures suivies, avec leur historique, leurs valeurs remarquables et leur cartographie territoriale."
          to="/indicateurs"
          cta="Voir les indicateurs"
        />
        <CapabilityCard
          icon={<ShoppingBasket className="size-5" />}
          title="Paniers"
          description="Des collections thématiques d'indicateurs, conçues pour répondre à une question publique précise."
          to="/paniers"
          cta="Explorer les paniers"
        />
      </div>
    </Section>
  )
}

function CapabilityCard({
  icon,
  title,
  description,
  to,
  cta,
}: {
  icon: ReactNode
  title: string
  description: string
  to: '/indicateurs' | '/paniers'
  cta: string
}) {
  return (
    <Link
      to={to}
      search={{}}
      className="group flex flex-col gap-5 rounded-xl border border-border bg-surface p-8 transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_12px_24px_rgba(0,0,145,0.05)]"
    >
      <div className="flex size-12 items-center justify-center rounded-lg bg-primary-tinted text-primary">
        {icon}
      </div>
      <div className="space-y-3">
        <Heading as="h3" size="lg" className="group-hover:text-primary">
          {title}
        </Heading>
        <Text tone="muted">{description}</Text>
      </div>
      <div className="mt-auto flex items-center gap-1.5 text-sm font-semibold text-primary">
        {cta}
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </div>
    </Link>
  )
}

function ConnectionStatusSection({ isAuthenticated }: { isAuthenticated: boolean }) {
  const { data, isPending, isError } = useQuery({
    queryKey: ['shared-message'],
    queryFn: fetchSharedMessage,
  })

  const apiStatus = isPending
    ? { tone: 'muted' as const, label: 'Connexion en cours' }
    : isError
      ? { tone: 'negative' as const, label: 'API injoignable' }
      : { tone: 'positive' as const, label: 'API connectée' }

  const authStatus = isAuthenticated
    ? { tone: 'positive' as const, label: 'Session authentifiée' }
    : { tone: 'muted' as const, label: 'Session anonyme' }

  return (
    <Section tone="plain" kicker="Diagnostic" title="État de la liaison">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatusRow label="Backend" tone={apiStatus.tone}>
          {apiStatus.label}
          {data?.greeting && (
            <Text as="span" variant="caption" tone="subtle" className="ml-2">
              {data.greeting}
            </Text>
          )}
        </StatusRow>
        <StatusRow label="Authentification" tone={authStatus.tone}>
          {authStatus.label}
        </StatusRow>
      </div>
    </Section>
  )
}

function StatusRow({
  label,
  tone,
  children,
}: {
  label: string
  tone: 'positive' | 'negative' | 'muted'
  children: ReactNode
}) {
  const dotClass =
    tone === 'positive' ? 'bg-emerald-500' : tone === 'negative' ? 'bg-rose-500' : 'bg-text-subtle'

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-5 py-4">
      <div className="space-y-0.5">
        <Text as="span" variant="kicker" tone="muted">
          {label}
        </Text>
        <Text weight="medium">{children}</Text>
      </div>
      <span className={`size-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
    </div>
  )
}
