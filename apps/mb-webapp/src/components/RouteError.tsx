import type { ErrorComponentProps } from '@tanstack/react-router'
import { Link } from '@tanstack/react-router'
import { HTTPError } from 'ky'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/Button'

const isNotFoundError = (error: Error): boolean => {
  return error instanceof HTTPError && error.response.status === 404
}

export function RouteError({ error, reset }: ErrorComponentProps) {
  if (isNotFoundError(error)) {
    return (
      <div className="space-y-3">
        <div className="rounded border border-amber-200 bg-amber-50 p-6 text-amber-900">
          <p className="font-medium">Ressource introuvable</p>
          <p className="mt-1 text-sm">La ressource demandée n'existe pas ou a été supprimée.</p>
        </div>
        <Button variant="tertiary" size="sm" asChild>
          <Link to="/indicateurs" search={{}}>
            <ArrowLeft />
            Retour à la liste
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded border border-red-200 bg-red-50 p-6 text-red-800">
      <p className="font-medium">Erreur lors du chargement</p>
      <p className="mt-1 text-sm">{error.message}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700"
      >
        Réessayer
      </button>
    </div>
  )
}
