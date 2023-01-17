import Chantier, { Maille, mailles, Territoire } from '@/server/domain/chantier/Chantier.interface';
import { Agrégation } from '@/client/utils/types';

const codes = {
  nationale: [
    'FR',
  ],
  départementale: [
    '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13',
    '14', '15', '16', '17', '18', '19', '21', '22', '23', '24', '25', '26', '27',
    '28', '29', '2A', '2B', '30', '31', '32', '33', '34', '35', '36', '37', '38',
    '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51',
    '52', '53', '54', '55', '56', '57', '58', '59', '60', '61', '62', '63', '64',
    '65', '66', '67', '68', '69', '70', '71', '72', '73', '74', '75', '76', '77',
    '78', '79', '80', '81', '82', '83', '84', '85', '86', '87', '88', '89', '90',
    '91', '92', '93', '94', '95', '971', '972', '973', '974', '976',
  ],
  régionale: [
    '01', '02', '03', '04', '06', '11', '24', '27', '28', '32', '44', '52', '53', '75',
    '76', '84', '93', '94',
  ],
};

type CodeInsee = string;
export type DonnéesTerritoires<T> = Record<Maille, Record<CodeInsee, T>>;
export type TerritoireSansCodeInseeNiMétéo = Omit<Territoire, 'codeInsee' | 'météo'>;

function initialiserDonnéesTerritoires<T>(donnéesInitiales: T) {
  return Object.fromEntries(
    mailles.map(maille => ([
      maille,
      Object.fromEntries(
        codes[maille].map(codeInsee => ([
          codeInsee,
          donnéesInitiales,
        ] as [CodeInsee, T])),
      ) as Record<CodeInsee, T>,
    ])),
  ) as DonnéesTerritoires<T>;
}

function initialiserDonnéesTerritoiresAgrégésVide() {
  return initialiserDonnéesTerritoires<Agrégation<TerritoireSansCodeInseeNiMétéo>>({
    avancement: [],
  });
}

function agrégerDonnéesTerritoiresÀUnAgrégat(
  donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInseeNiMétéo>>,
  donnéesTerritoires: DonnéesTerritoires<TerritoireSansCodeInseeNiMétéo>,
): DonnéesTerritoires<Agrégation<TerritoireSansCodeInseeNiMétéo>> {
  const agrégat = { ...donnéesTerritoiresAgrégées };

  for (const maille of mailles) {
    for (const codeInsee of codes[maille]) {
      const avancementTerritoire = donnéesTerritoires[maille] && donnéesTerritoires[maille][codeInsee]
        ? donnéesTerritoires[maille][codeInsee].avancement
        : { annuel: null, global: null };

      agrégat[maille][codeInsee] = {
        avancement: [
          ...agrégat[maille][codeInsee].avancement,
          avancementTerritoire,
        ],
      };
    }
  }

  return agrégat;
}

export function agrégerDonnéesTerritoires(listeDonnéesTerritoires: DonnéesTerritoires<Territoire>[]) {
  const agrégat = initialiserDonnéesTerritoiresAgrégésVide();
  for (const donnéesTerritoires of listeDonnéesTerritoires) {
    agrégerDonnéesTerritoiresÀUnAgrégat(agrégat, donnéesTerritoires);
  }
  return agrégat;
}

export function réduireDonnéesTerritoires<T>(
  donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInseeNiMétéo>>,
  fonctionDeRéduction: (territoiresAgrégés: Agrégation<TerritoireSansCodeInseeNiMétéo>) => T,
  donnéesInitiales: T,
): DonnéesTerritoires<T> {
  const donnéesRéduites = initialiserDonnéesTerritoires<T>(donnéesInitiales);

  for (const maille of mailles) {
    for (const codeInsee of codes[maille]) {
      donnéesRéduites[maille][codeInsee] = fonctionDeRéduction(donnéesTerritoiresAgrégées[maille][codeInsee]);
    }
  }

  return donnéesRéduites;
}

///
// Expé

export function sélectionneLesChantiersDesPérimètres(chantiers: Chantier[], périmètreIds: string[]): Chantier[] {
  if (périmètreIds.length === 0) {
    return chantiers;
  }
  const result = [];
  for (const chantier of chantiers) {
    for (const pid of chantier.périmètreIds) {
      if (périmètreIds.includes(pid)) {
        result.push(chantier);
        break;
      }
    }
  }
  return result;
}

export function extraitLesAvancementsGlobauxDépartementaux(chantiers: Chantier[]): Record<string, number[]> {
  const result: Record<string, number[]> = {};

  for (const chantier of chantiers) {
    const données = chantier.mailles.départementale;
    for (const codeInsee in données) {
      result[codeInsee] ||= [];
      const avancementsGlobaux = result[codeInsee];
      const avancementGlobal = données[codeInsee]?.avancement?.global;
      if (avancementGlobal != undefined) {
        avancementsGlobaux.push(avancementGlobal);
      }
    }
  }

  return result;
}

function moyenne(valeurs: number[]) {
  if (valeurs.length === 0) {
    throw new Error("Erreur: une liste vide n'a pas de moyenne");
  }
  let somme = 0;
  for (const valeur of valeurs) {
    somme += valeur;
  }
  return somme / valeurs.length;
}

export function moyennesParCodeInsee(valeursParCodeInsee: Record<string, number[]>): Record<string, number | null> {
  const result: Record<string, number | null> = {};
  for (const codeInsee in valeursParCodeInsee) {
    const valeurs = valeursParCodeInsee[codeInsee];
    result[codeInsee] = (valeurs && valeurs.length > 0)
      ? moyenne(valeurs)
      : null;
  }
  return result;
}
