import {
  CATEGORIES_PROBLEME,
  LIBELLES_CATEGORIES,
  type CategorieProbleme,
} from '@pilote/kpilote-shared/assistant/feedback'
import { Button } from '@pilote/kpilote-ui/Button'
import { useState } from 'react'

import { apiClient } from '@/api/client'
import { clsxm } from '@/lib/clsxm'

type Etat = 'inactif' | 'positif' | 'negatif' | 'envoye'

export function BarreFeedback({ conversationId }: { conversationId: string }) {
  const [etat, setEtat] = useState<Etat>('inactif')
  const [categories, setCategories] = useState<CategorieProbleme[]>([])
  const [commentaire, setCommentaire] = useState('')

  const envoyer = async (corps: Record<string, unknown>) => {
    await apiClient.post(`assistant/conversations/${conversationId}/evaluation`, { json: corps })
    setEtat('envoye')
  }

  // « Autre » sans texte n'apprend rien : on bloque l'envoi plutôt que de collecter du bruit.
  const envoiNegatifBloque =
    categories.length === 0 || (categories.includes('AUTRE') && commentaire.trim().length === 0)

  if (etat === 'envoye') return <p className="text-sm text-text-subtle">Merci pour votre retour.</p>

  if (etat === 'inactif') {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-text-subtle">Cette réponse vous a-t-elle aidé ?</span>
        <Button variant="tertiary" size="sm" onClick={() => setEtat('positif')}>
          Oui
        </Button>
        <Button variant="tertiary" size="sm" onClick={() => setEtat('negatif')}>
          Non
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-border p-3">
      {etat === 'negatif' && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">
            Quel type de problème avez-vous rencontré ?
          </legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES_PROBLEME.map((categorie) => {
              const coche = categories.includes(categorie)
              return (
                <button
                  key={categorie}
                  type="button"
                  aria-pressed={coche}
                  onClick={() =>
                    setCategories((precedentes) =>
                      coche
                        ? precedentes.filter((valeur) => valeur !== categorie)
                        : [...precedentes, categorie],
                    )
                  }
                  className={clsxm(
                    'rounded border px-2 py-1 text-left text-sm',
                    coche ? 'border-border-strong bg-surface' : 'border-border',
                  )}
                >
                  <span className="block font-medium">{LIBELLES_CATEGORIES[categorie].titre}</span>
                  <span className="block text-xs text-text-subtle">
                    {LIBELLES_CATEGORIES[categorie].aide}
                  </span>
                </button>
              )
            })}
          </div>
        </fieldset>
      )}

      <label className="flex flex-col gap-1 text-sm">
        {etat === 'positif' ? "Qu'avez-vous apprécié ? (optionnel)" : 'Décrivez le problème'}
        <textarea
          value={commentaire}
          onChange={(evenement) => setCommentaire(evenement.target.value)}
          className="rounded border border-border p-2"
          rows={3}
        />
      </label>

      <div className="flex justify-end gap-2">
        <Button variant="tertiary" size="sm" onClick={() => setEtat('inactif')}>
          Annuler
        </Button>
        <Button
          size="sm"
          disabled={etat === 'negatif' && envoiNegatifBloque}
          onClick={() =>
            void envoyer(
              etat === 'positif'
                ? { evaluation: 'POSITIVE', commentaire: commentaire || undefined }
                : { evaluation: 'NEGATIVE', categories, commentaire: commentaire || undefined },
            )
          }
        >
          Envoyer
        </Button>
      </div>
    </div>
  )
}
