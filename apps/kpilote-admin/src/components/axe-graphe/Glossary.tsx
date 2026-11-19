import { type NiveauAxeApiModel } from '@pilote/kpilote-shared/axe'
import { MousePointerClick, Plus } from 'lucide-react'
import { type ReactNode } from 'react'

import { KindMarker } from '@/components/axe-graphe/KindMarker'
import { Note } from '@/components/axe-graphe/Note'
import { Button } from '@pilote/kpilote-ui/Button'
import { type Arbre, type Kind, nodesOfKind } from '@/lib/axeArbre'

export function Glossary({
  axeNom,
  niveaux,
  arbre,
  isEditing,
  locked,
  onAddRoot,
}: {
  axeNom: string
  niveaux: ReadonlyArray<NiveauAxeApiModel>
  arbre: Arbre
  isEditing: boolean
  locked: boolean
  onAddRoot: () => void
}) {
  const exampleOf = (kind: Kind) => nodesOfKind({ arbre, kind })[0]?.nom
  const isEmpty = arbre.size === 1
  return (
    <section className="flex flex-col gap-4">
      {isEmpty && isEditing ? (
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-primary/40 p-4">
          <p className="text-sm text-text">Cet axe n’a encore aucune modalité.</p>
          <Button size="sm" disabled={locked} onClick={onAddRoot} className="self-start">
            <Plus /> Ajouter la première
          </Button>
        </div>
      ) : null}
      <h3 className="text-sm font-semibold text-text">Comment lire ce graphe</h3>
      <dl className="flex flex-col gap-3.5 text-sm">
        <Definition term="Axe" example={axeNom}>
          Une façon de découper un indicateur, en plus des individus.
        </Definition>
        <Definition term="Niveau" example={niveaux.map((niveau) => niveau.nom).join(' → ')}>
          Un étage de l’axe, du plus large au plus fin. Chaque colonne est un niveau.
        </Definition>
        <Definition term="Modalité">
          Une valeur possible de l’axe. Chaque boîte est une modalité, rangée dans la colonne de son
          niveau.
        </Definition>
        <Definition term="Feuille" kind="feuille" example={exampleOf('feuille')}>
          Une modalité sans enfant : c’est la seule où l’on saisit des valeurs.
        </Definition>
        <Definition term="Parente" kind="parente" example={exampleOf('parente')}>
          Une modalité avec des enfants : sa valeur en est la somme ou la moyenne, jamais saisie.
        </Definition>
        <Definition term="Tous" kind="tous">
          L’ensemble de l’axe, calculé à partir du premier niveau. C’est la valeur lue quand on ne
          précise aucune modalité.
        </Definition>
      </dl>
      <Note icon={<MousePointerClick className="size-4" />}>
        {isEditing
          ? 'Cliquez sur une boîte ou sur l’en-tête d’une colonne pour l’expliquer ou la modifier. Le « + » d’une boîte lui ajoute un enfant.'
          : 'Cliquez sur une boîte ou sur l’en-tête d’une colonne pour l’expliquer.'}
      </Note>
    </section>
  )
}

function Definition({
  term,
  kind,
  example,
  children,
}: {
  term: string
  kind?: Kind
  example?: string | undefined
  children: ReactNode
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 font-medium text-text">
        {kind ? <KindMarker kind={kind} shape="large-dot" /> : null}
        {term}
      </dt>
      <dd className="text-text-muted">
        {children}
        {example ? <span className="text-text-subtle"> Ex. : {example}.</span> : null}
      </dd>
    </div>
  )
}
