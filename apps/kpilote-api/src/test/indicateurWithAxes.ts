import { IndicateurPermissionAction } from '@/generated/prisma/enums'

import { db } from '@/framework/persistence/dbStore'
import { fixtures } from '@/test/fixtures'
import {
  testAxeId,
  testDeptId,
  testIndicateurId,
  testModaliteId,
  testReferentielId,
} from '@/test/randomIds'

// Mises en place partagées par les tests des écritures avec modalités.

// Indicateur à deux axes, dans cet ordre :
//  - Opérateur : Orange, SFR (un niveau) ;
//  - Type de fraude : Fiscale > TVA, IR (deux niveaux).
// Un troisième axe existe sans être déclaré sur l'indicateur (modalité `autre`).
// La clé API renvoyée peut écrire sur l'indicateur.
export const indicateurWithTwoAxes = async () => {
  const indicateurId = testIndicateurId()
  const referentiel = { publicId: testReferentielId() }
  const individuId = testDeptId()
  await fixtures.indicateurReferentiel({ indicateur: { publicId: indicateurId }, referentiel })
  await fixtures.individu({ publicId: individuId, referentiel })

  const operateur = { publicId: testAxeId() }
  const fraude = { publicId: testAxeId() }
  const ids = {
    orange: testModaliteId(),
    sfr: testModaliteId(),
    fiscale: testModaliteId(),
    tva: testModaliteId(),
    ir: testModaliteId(),
    autre: testModaliteId(),
  }
  await fixtures.modalite(
    { publicId: ids.orange, nom: 'Orange', niveau: { axe: operateur } },
    { publicId: ids.sfr, nom: 'SFR', niveau: { axe: operateur } },
    { publicId: ids.fiscale, nom: 'Fiscale', niveau: { axe: fraude, ordre: 1 } },
    {
      publicId: ids.tva,
      nom: 'TVA',
      niveau: { axe: fraude, ordre: 2 },
      parent: { publicId: ids.fiscale },
    },
    {
      publicId: ids.ir,
      nom: 'IR',
      niveau: { axe: fraude, ordre: 2 },
      parent: { publicId: ids.fiscale },
    },
    { publicId: ids.autre, nom: 'Autre', niveau: { axe: { publicId: testAxeId() } } },
  )
  await fixtures.indicateurAxe(
    { indicateur: { publicId: indicateurId }, axe: operateur, ordre: 1 },
    { indicateur: { publicId: indicateurId }, axe: fraude, ordre: 2 },
  )
  const apiKey = await fixtures.apiKey({
    permissions: [
      { indicateur: { publicId: indicateurId }, action: IndicateurPermissionAction.WRITE_DATA },
    ],
  })
  return { indicateurId, individuId, apiKey, axes: { operateur, fraude }, ids }
}

// Indicateur sans axe, et une modalité d'un axe qu'il ne déclare pas.
export const indicateurWithoutAxe = async () => {
  const indicateurId = testIndicateurId()
  const referentiel = { publicId: testReferentielId() }
  const individuId = testDeptId()
  await fixtures.indicateurReferentiel({ indicateur: { publicId: indicateurId }, referentiel })
  await fixtures.individu({ publicId: individuId, referentiel })
  const orange = await fixtures.modalite({ niveau: { axe: { publicId: testAxeId() } } })
  const apiKey = await fixtures.apiKey({
    permissions: [
      { indicateur: { publicId: indicateurId }, action: IndicateurPermissionAction.WRITE_DATA },
    ],
  })
  return { indicateurId, individuId, apiKey, orange: orange.publicId }
}

// Clé de lecture d'une valeur par ses modalités, quel que soit leur ordre.
export const modalitesKey = (...publicIds: string[]): string => [...publicIds].sort().join('+')

// Les valeurs de l'indicateur, par modalités de leur combinaison (`modalitesKey`).
export const valeursByModalites = async (indicateurPublicId: string) => {
  const valeurs = await db().valeurAvancement.findMany({
    where: { indicateur: { publicId: indicateurPublicId } },
    include: { combinaison: { include: { modalites: { include: { modalite: true } } } } },
  })
  return new Map(
    valeurs.map((valeur) => [
      modalitesKey(...valeur.combinaison.modalites.map(({ modalite }) => modalite.publicId)),
      Number(valeur.valeur),
    ]),
  )
}
