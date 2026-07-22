import { type NormaliserValeursImportResponseApiModel } from '@pilote/kpilote-shared/valeurImport'

import { ErreursServeurBloc } from './ErreursServeurBloc'
import { NormalisationReviewView } from './NormalisationReviewView'

// Revue de l'extraction assistée par Albert avant import : erreurs serveur
// éventuelles + détail de la normalisation.
export function NormalisationRevue({
  revue,
  erreursServeur,
}: {
  revue: NormaliserValeursImportResponseApiModel
  erreursServeur: string[]
}) {
  return (
    <>
      <ErreursServeurBloc messages={erreursServeur} />
      <NormalisationReviewView response={revue} />
    </>
  )
}
