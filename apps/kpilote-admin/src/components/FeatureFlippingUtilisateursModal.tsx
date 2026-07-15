import type { UtilisateurApiModel } from '@pilote/kpilote-shared/utilisateur'
import { useQuery } from '@tanstack/react-query'
import { Search, X } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Button } from '@/components/ui/Button'
import { clsxm } from '@/lib/clsxm'
import { utilisateursAllQueryOptions } from '@/queries/utilisateurs'

export function FeatureFlippingUtilisateursModal({
  utilisateursInitiaux,
  pending,
  onValider,
  onClose,
}: {
  utilisateursInitiaux: UtilisateurApiModel[]
  pending: boolean
  onValider: (utilisateurIds: string[]) => void
  onClose: () => void
}) {
  const query = useQuery(utilisateursAllQueryOptions())
  const utilisateurs = query.data
  const [recherche, setRecherche] = useState('')
  const [selection, setSelection] = useState<Set<string>>(
    () => new Set(utilisateursInitiaux.map((u) => u.id)),
  )

  const filtres = useMemo(() => {
    const liste = utilisateurs ?? []
    const terme = recherche.trim().toLowerCase()
    if (!terme) return liste
    return liste.filter((u) => `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(terme))
  }, [utilisateurs, recherche])

  const toggle = (id: string) =>
    setSelection((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-24"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl border border-border bg-surface p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text">Utilisateurs autorisés</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="text-text-muted hover:text-text"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-subtle" />
          <input
            autoFocus
            placeholder="Rechercher par nom ou email…"
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            className="w-full rounded-md border border-border bg-surface py-2.5 pl-9 pr-3 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query.isLoading ? (
            <p className="py-6 text-center text-sm text-text-muted">Chargement…</p>
          ) : filtres.length === 0 ? (
            <p className="py-6 text-center text-sm text-text-muted">Aucun utilisateur.</p>
          ) : (
            <ul className="divide-y divide-border">
              {filtres.map((utilisateur) => {
                const coche = selection.has(utilisateur.id)
                return (
                  <li key={utilisateur.id}>
                    <label
                      className={clsxm(
                        'flex cursor-pointer items-center gap-3 px-2 py-3 hover:bg-border/30',
                        coche && 'bg-primary/5',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={coche}
                        onChange={() => toggle(utilisateur.id)}
                        className="size-4 accent-primary"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-text">
                          {utilisateur.prenom} {utilisateur.nom}
                        </span>
                        <span className="block truncate text-xs text-text-muted">
                          {utilisateur.email}
                        </span>
                      </span>
                    </label>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-sm text-text-muted">{selection.size} sélectionné(s)</span>
          <span className="flex gap-2">
            <Button variant="tertiary" type="button" onClick={onClose}>
              Annuler
            </Button>
            <Button type="button" disabled={pending} onClick={() => onValider([...selection])}>
              {pending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </span>
        </div>
      </div>
    </div>
  )
}
