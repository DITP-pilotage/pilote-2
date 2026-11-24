import { type NormaliserValeursImportResponseApiModel } from '@pilote/kpilote-shared/valeurNormalisation'

import { ErreursServeurBloc } from '../ErreursServeurBloc'
import { type AxeImport } from './lecture/matriceVersRows'
import { NormalisationReviewView } from './NormalisationReviewView'

// Revue de l'extraction assistée par Albert avant import : erreurs serveur
// éventuelles + détail de la normalisation.
export function NormalisationRevue({
  revue,
  axes,
  erreursServeur,
}: {
  revue: NormaliserValeursImportResponseApiModel
  axes: ReadonlyArray<AxeImport>
  erreursServeur: string[]
}) {
  return (
    <>
      <ErreursServeurBloc messages={erreursServeur} />
      <NormalisationReviewView response={revue} axes={axes} />
    </>
  )
}
