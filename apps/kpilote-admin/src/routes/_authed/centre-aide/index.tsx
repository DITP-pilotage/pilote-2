import type { ArticleCentreAideApiModel } from '@pilote/kpilote-shared/centreAide'
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Eye, EyeOff, FilePlus2, FolderPlus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import {
  basculerVisibiliteArticleCentreAide,
  creerArticleCentreAide,
  modifierBrouillonArticleCentreAide,
  publierArticleCentreAide,
  supprimerArticleCentreAide,
} from '@/api/centreAide'
import { Breadcrumb } from '@/components/Breadcrumb'
import { EditeurCentreAide } from '@/components/centre-aide/EditeurCentreAide'
import { aDesModificationsNonPubliees, construireArbre } from '@/components/centre-aide/arbre'
import { PageHeading } from '@/components/PageHeading'
import { Button } from '@pilote/kpilote-ui/Button'
import { useToast } from '@pilote/kpilote-ui/Toast'
import { clsxm } from '@/lib/clsxm'
import { extractApiError } from '@/lib/apiError'
import { articlesCentreAideQueryOptions } from '@/queries/centreAide'

export const Route = createFileRoute('/_authed/centre-aide/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(articlesCentreAideQueryOptions()),
  component: CentreAideComponent,
})

function CentreAideComponent() {
  const { data: articles } = useSuspenseQuery(articlesCentreAideQueryOptions())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const rafraichir = () => queryClient.invalidateQueries({ queryKey: ['centre-aide'] })
  const surErreur = (erreur: unknown) => toast({ title: extractApiError(erreur), variant: 'error' })

  const arbre = construireArbre(articles)
  const selectionne = articles.find((article) => article.id === selectedId) ?? null
  const parentPourCreation =
    selectionne?.type === 'GROUPE' ? selectionne.id : (selectionne?.parentId ?? null)

  const creation = useMutation({
    mutationFn: (type: 'GROUPE' | 'PAGE') =>
      creerArticleCentreAide({
        type,
        parentId: parentPourCreation,
        titre: type === 'GROUPE' ? 'Nouveau groupe' : 'Nouvelle page',
      }),
    onSuccess: async (article) => {
      await rafraichir()
      setSelectedId(article.id)
    },
    onError: surErreur,
  })

  const suppression = useMutation({
    mutationFn: (id: string) => supprimerArticleCentreAide(id),
    onSuccess: async () => {
      await rafraichir()
      setSelectedId(null)
      toast({ title: 'Article supprimé.' })
    },
    onError: surErreur,
  })

  const visibilite = useMutation({
    mutationFn: (article: ArticleCentreAideApiModel) =>
      basculerVisibiliteArticleCentreAide(article.id, { estMasque: !article.estMasque }),
    onSuccess: rafraichir,
    onError: surErreur,
  })

  return (
    <div>
      <Breadcrumb>
        <Link to="/fonctionnalites" className="hover:text-primary">
          Fonctionnalités
        </Link>
        <span className="font-medium text-text">Centre d’aide</span>
      </Breadcrumb>
      <PageHeading
        title="Centre d’aide"
        subtitle="Rédigez les articles tels qu’ils s’afficheront, puis publiez."
      />

      <div className="flex gap-6">
        <aside className="w-72 shrink-0">
          <div className="mb-3 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => creation.mutate('GROUPE')}>
              <FolderPlus className="size-4" /> Groupe
            </Button>
            <Button size="sm" variant="secondary" onClick={() => creation.mutate('PAGE')}>
              <FilePlus2 className="size-4" /> Page
            </Button>
          </div>
          <ul className="space-y-0.5">
            {arbre.map((noeud) => (
              <NoeudLigne
                key={noeud.id}
                noeud={noeud}
                profondeur={0}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onSupprimer={(id) => suppression.mutate(id)}
                onVisibilite={(article) => visibilite.mutate(article)}
              />
            ))}
            {arbre.length === 0 ? (
              <li className="px-2 py-6 text-center text-sm text-text-subtle">
                Aucun article. Créez un groupe ou une page.
              </li>
            ) : null}
          </ul>
        </aside>

        <section className="min-w-0 flex-1">
          {selectionne && selectionne.type === 'PAGE' ? (
            <EditionArticle key={selectionne.id} article={selectionne} onEnregistre={rafraichir} />
          ) : (
            <div className="rounded-md border border-dashed border-border p-10 text-center text-sm text-text-muted">
              {selectionne?.type === 'GROUPE'
                ? 'Les groupes organisent l’arborescence — sélectionnez une page pour l’éditer.'
                : 'Sélectionnez une page à gauche pour l’éditer.'}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function NoeudLigne({
  noeud,
  profondeur,
  selectedId,
  onSelect,
  onSupprimer,
  onVisibilite,
}: {
  noeud: ReturnType<typeof construireArbre>[number]
  profondeur: number
  selectedId: string | null
  onSelect: (id: string) => void
  onSupprimer: (id: string) => void
  onVisibilite: (article: ArticleCentreAideApiModel) => void
}) {
  return (
    <li>
      <div
        className={clsxm(
          'group flex items-center gap-1 rounded px-2 py-1.5 text-sm',
          selectedId === noeud.id ? 'bg-primary-tinted text-primary' : 'hover:bg-surface-tinted',
        )}
        style={{ paddingLeft: `${8 + profondeur * 16}px` }}
      >
        <button
          type="button"
          onClick={() => onSelect(noeud.id)}
          className="flex-1 truncate text-left"
          title={noeud.titreBrouillon || noeud.titre}
        >
          {noeud.type === 'GROUPE' ? '📁 ' : ''}
          {noeud.titreBrouillon || noeud.titre || '(sans titre)'}
        </button>
        {noeud.estPublie ? (
          <span className="size-1.5 rounded-full bg-success" title="Publié" aria-label="Publié" />
        ) : (
          <span
            className="size-1.5 rounded-full bg-warning"
            title="Brouillon"
            aria-label="Brouillon"
          />
        )}
        <button
          type="button"
          onClick={() => onVisibilite(noeud)}
          title={noeud.estMasque ? 'Masqué' : 'Visible'}
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          {noeud.estMasque ? (
            <EyeOff className="size-3.5 text-text-muted" />
          ) : (
            <Eye className="size-3.5 text-text-muted" />
          )}
        </button>
        <button
          type="button"
          onClick={() => onSupprimer(noeud.id)}
          title="Supprimer"
          className="opacity-0 transition-opacity group-hover:opacity-100"
        >
          <Trash2 className="size-3.5 text-red-marianne" />
        </button>
      </div>
      {noeud.enfants.length > 0 ? (
        <ul className="space-y-0.5">
          {noeud.enfants.map((enfant) => (
            <NoeudLigne
              key={enfant.id}
              noeud={enfant}
              profondeur={profondeur + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              onSupprimer={onSupprimer}
              onVisibilite={onVisibilite}
            />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function EditionArticle({
  article,
  onEnregistre,
}: {
  article: ArticleCentreAideApiModel
  onEnregistre: () => Promise<unknown>
}) {
  const toast = useToast()
  const [titre, setTitre] = useState(article.titreBrouillon || article.titre)
  const [contenu, setContenu] = useState(article.contenuBrouillon || article.contenu)

  const surErreur = (erreur: unknown) => toast({ title: extractApiError(erreur), variant: 'error' })

  const enregistrer = useMutation({
    mutationFn: () =>
      modifierBrouillonArticleCentreAide(article.id, {
        titreBrouillon: titre,
        titreAfficheBrouillon: titre,
        contenuBrouillon: contenu,
      }),
    onSuccess: async () => {
      await onEnregistre()
      toast({ title: 'Brouillon enregistré.' })
    },
    onError: surErreur,
  })

  const publier = useMutation({
    mutationFn: async () => {
      await modifierBrouillonArticleCentreAide(article.id, {
        titreBrouillon: titre,
        titreAfficheBrouillon: titre,
        contenuBrouillon: contenu,
      })
      return publierArticleCentreAide(article.id)
    },
    onSuccess: async () => {
      await onEnregistre()
      toast({ title: 'Article publié.' })
    },
    onError: surErreur,
  })

  const enAttente = enregistrer.isPending || publier.isPending

  return (
    <div>
      <div className="mb-3 flex items-center gap-3">
        <input
          value={titre}
          onChange={(event) => setTitre(event.target.value)}
          placeholder="Titre de la page"
          className="flex-1 rounded-md border border-border px-3 py-2 text-lg font-bold outline-none focus:border-primary"
        />
        <Button variant="secondary" onClick={() => enregistrer.mutate()} disabled={enAttente}>
          Enregistrer
        </Button>
        <Button onClick={() => publier.mutate()} disabled={enAttente}>
          Publier
        </Button>
      </div>
      {aDesModificationsNonPubliees(article) ? (
        <p className="mb-2 text-xs text-warning">Modifications non publiées</p>
      ) : null}
      <EditeurCentreAide contenu={contenu} onChange={setContenu} />
    </div>
  )
}
