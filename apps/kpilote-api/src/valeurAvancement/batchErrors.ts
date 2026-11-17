import {
  type BatchInvalidErrorEntryApiModel,
  type UpsertValeursAvancementBatchBody,
} from '@pilote/kpilote-shared/valeurAvancement'
import { type Result } from 'neverthrow'

import { type RequestedModalite, type SaisieModalitesError } from '@/axe/requestedModalites'

// Erreurs d'un lot de valeurs, calculées sans base : chaque fonction reçoit les
// items et, pour chacun, le résultat de la validation de ses modalités.

type BatchItems = UpsertValeursAvancementBatchBody['items']
export type ModalitesByItem = ReadonlyArray<Result<RequestedModalite[], SaisieModalitesError>>

// Détecte les cellules `(individu, modalites, date)` qui apparaissent plus d'une fois dans
// le payload. Un import « propre » n'a pas de doublon ; on refuse explicitement plutôt que
// de laisser passer un last-write-wins silencieux qui dépendrait de l'ordre d'apparition.
// Les modalités validées sont dans l'ordre des axes : leur ordre dans l'item ne compte pas.
// Les items dont les modalités sont invalides ont déjà leur erreur : ils sont ignorés ici.
export const detectDuplicateKeys = ({
  items,
  modalitesByItem,
}: {
  items: BatchItems
  modalitesByItem: ModalitesByItem
}): BatchInvalidErrorEntryApiModel[] => {
  const KEY_SEP = '\u0000'
  const entreesParCle = new Map<
    string,
    { indices: number[]; individu: string; modalites: string[]; date: string }
  >()
  items.forEach((item, index) => {
    const modalites = modalitesByItem[index]!
    if (modalites.isErr()) return
    const publicIds = modalites.value.map((modalite) => modalite.publicId)
    const cle = [item.individu, ...publicIds, item.date].join(KEY_SEP)
    const entree = entreesParCle.get(cle)
    if (entree) entree.indices.push(index)
    else
      entreesParCle.set(cle, {
        indices: [index],
        individu: item.individu,
        modalites: publicIds,
        date: item.date,
      })
  })
  return [...entreesParCle.values()]
    .filter((entree) => entree.indices.length > 1)
    .map(({ indices, individu, modalites, date }) => ({
      code: 'DUPLICATE_KEY',
      indices,
      individu,
      ...(modalites.length > 0 ? { modalites } : {}),
      date,
    }))
}

// Comme pour les individus inconnus : une entrée par cause et par modalité (ou
// par axe), qui pointe toutes les lignes concernées.
export const aggregateModalitesErrors = ({
  modalitesByItem,
}: {
  modalitesByItem: ModalitesByItem
}): BatchInvalidErrorEntryApiModel[] => {
  const entrees = new Map<string, BatchInvalidErrorEntryApiModel>()
  const addIndex = ({
    key,
    index,
    create,
  }: {
    key: string
    index: number
    create: () => BatchInvalidErrorEntryApiModel
  }) => {
    const entree = entrees.get(key) ?? create()
    if (!entree.indices.includes(index)) entree.indices.push(index)
    entrees.set(key, entree)
  }
  modalitesByItem.forEach((resultat, index) => {
    if (resultat.isOk()) return
    const erreur = resultat.error
    switch (erreur.type) {
      case 'MODALITE_INCONNUE':
      case 'AXE_NON_DECLARE':
      case 'MODALITE_NON_FEUILLE':
        for (const modalite of erreur.modalites) {
          addIndex({
            key: `${erreur.type}|${modalite}`,
            index,
            create: () => ({ code: erreur.type, indices: [], modalite }),
          })
        }
        return
      case 'MODALITES_MEME_AXE':
        addIndex({
          key: `${erreur.type}|${erreur.axe}`,
          index,
          create: () => ({ code: erreur.type, indices: [], axe: erreur.axe }),
        })
        return
      case 'MODALITE_MANQUANTE':
        for (const axe of erreur.axes) {
          addIndex({
            key: `${erreur.type}|${axe}`,
            index,
            create: () => ({ code: erreur.type, indices: [], axe }),
          })
        }
        return
    }
  })
  return [...entrees.values()]
}
