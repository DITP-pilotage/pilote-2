import { type NiveauAxeApiModel } from '@pilote/kpilote-shared/axe'

import { Note } from '@/components/axe-graphe/Note'
import { type Arbre } from '@/lib/axeArbre'
import { axeWarningsOf, WARNINGS_LIMIT } from '@/lib/axeGraphe'

export function AxeWarnings({
  arbre,
  niveaux,
}: {
  arbre: Arbre
  niveaux: ReadonlyArray<NiveauAxeApiModel>
}) {
  const { emptyNiveaux, earlyFeuilles, singleChildParentes, count, isTruncated } = axeWarningsOf({
    arbre,
    niveaux,
  })
  if (count === 0) return null
  return (
    <section className="flex flex-col gap-2">
      <h3 className="text-sm font-semibold text-text">
        Points d’attention <span className="font-normal text-text-subtle">({count})</span>
      </h3>
      {emptyNiveaux.map((niveau) => (
        <Note key={niveau.ordre} tone="warning">
          Le niveau <strong>{niveau.nom}</strong> n’a aucune modalité.
        </Note>
      ))}
      {earlyFeuilles.slice(0, WARNINGS_LIMIT).map((feuille) => (
        <Note key={feuille.id} tone="warning">
          <strong>{feuille.nom}</strong> s’arrête avant le niveau « {niveaux.at(-1)?.nom} » : c’est
          une feuille, on saisira directement dessus.
        </Note>
      ))}
      {singleChildParentes.slice(0, WARNINGS_LIMIT).map((parente) => (
        <Note key={parente.id}>
          <strong>{parente.nom}</strong> n’a qu’un enfant : elle aura toujours la même valeur que
          lui.
        </Note>
      ))}
      {isTruncated ? <p className="text-xs text-text-subtle">Liste tronquée.</p> : null}
    </section>
  )
}
