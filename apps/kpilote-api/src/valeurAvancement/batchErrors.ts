import {
  type BatchInvalidErrorEntryApiModel,
  type UpsertValeursAvancementBatchBody,
} from '@pilote/kpilote-shared/valeurAvancement'
import { type Result } from 'neverthrow'

import { type RequestedModalite } from '@/axe/requestedModalites'
import { type SaisieModalitesError } from '@/axe/rules'
import { type IndividuInconnuError } from '@/individu/rules'

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
  const entriesByKey = new Map<
    string,
    { indices: number[]; individu: string; modalites: string[]; date: string }
  >()
  items.forEach((item, index) => {
    const modalites = modalitesByItem[index]!
    if (modalites.isErr()) return
    const publicIds = modalites.value.map((modalite) => modalite.publicId)
    const key = [item.individu, ...publicIds, item.date].join(KEY_SEP)
    const entry = entriesByKey.get(key)
    if (entry) entry.indices.push(index)
    else
      entriesByKey.set(key, {
        indices: [index],
        individu: item.individu,
        modalites: publicIds,
        date: item.date,
      })
  })
  return [...entriesByKey.values()]
    .filter((entry) => entry.indices.length > 1)
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
  const entries = new Map<string, BatchInvalidErrorEntryApiModel>()
  const addIndex = ({
    key,
    index,
    create,
  }: {
    key: string
    index: number
    create: () => BatchInvalidErrorEntryApiModel
  }) => {
    const entry = entries.get(key) ?? create()
    if (!entry.indices.includes(index)) entry.indices.push(index)
    entries.set(key, entry)
  }
  modalitesByItem.forEach((result, index) => {
    if (result.isOk()) return
    const error = result.error
    switch (error.type) {
      case 'MODALITE_INCONNUE':
      case 'AXE_NON_DECLARE':
      case 'MODALITE_NON_FEUILLE':
        for (const modalite of error.modalites) {
          addIndex({
            key: `${error.type}|${modalite}`,
            index,
            create: () => ({ code: error.type, indices: [], modalite }),
          })
        }
        return
      case 'MODALITES_MEME_AXE':
        addIndex({
          key: `${error.type}|${error.axe}`,
          index,
          create: () => ({ code: error.type, indices: [], axe: error.axe }),
        })
        return
      case 'MODALITE_MANQUANTE':
        for (const axe of error.axes) {
          addIndex({
            key: `${error.type}|${axe}`,
            index,
            create: () => ({ code: error.type, indices: [], axe }),
          })
        }
        return
    }
  })
  return [...entries.values()]
}

// Une entrée par individu refusé par `checkIndividuRattache`, qui pointe toutes
// les lignes concernées (DX d'import).
export const aggregateIndividusErrors = ({
  individuByItem,
}: {
  individuByItem: ReadonlyArray<Result<unknown, IndividuInconnuError>>
}): BatchInvalidErrorEntryApiModel[] => {
  const indicesByIndividu = new Map<string, number[]>()
  individuByItem.forEach((result, index) => {
    if (result.isOk()) return
    const indices = indicesByIndividu.get(result.error.individu) ?? []
    indices.push(index)
    indicesByIndividu.set(result.error.individu, indices)
  })
  return [...indicesByIndividu].map(([individu, indices]) => ({
    code: 'INDIVIDU_INCONNU',
    individu,
    indices,
  }))
}
