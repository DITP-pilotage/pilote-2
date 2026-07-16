import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { HTTPError } from 'ky'

import { BackLink } from '@pilote/kpilote-ui/BackLink'
import { Button } from '@pilote/kpilote-ui/Button'
import { EmptyState } from '@pilote/kpilote-ui/EmptyState'
import { Section } from '@pilote/kpilote-ui/Section'

const isNotFoundError = (error: Error): boolean => {
  return error instanceof HTTPError && error.response.status === 404
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  if (isNotFoundError(error)) {
    return (
      <div className="space-y-4">
        <Section>
          <EmptyState
            title="Ressource introuvable"
            description="La ressource demandée n'existe pas ou a été supprimée."
          />
        </Section>
        <BackLink asChild>
          <Link to="/indicateurs" search={{}}>
            Retour à la liste
          </Link>
        </BackLink>
      </div>
    )
  }

  return (
    <Section>
      <div className="space-y-4">
        <EmptyState title="Erreur lors du chargement" description={error.message} />
        <div className="flex justify-center">
          <Button type="button" onClick={reset}>
            Réessayer
          </Button>
        </div>
      </div>
    </Section>
  )
}
