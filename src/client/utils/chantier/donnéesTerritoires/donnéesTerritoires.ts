import { Maille, mailles, Territoire, TerritoireIdentifiant } from '@/server/domain/chantier/Chantier.interface';
import { Agrégation } from '@/client/utils/types';
import { territoires } from '@/components/_commons/SélecteurDeTerritoire/SélecteurDeTerritoire';

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
export type TerritoireSansCodeInsee = Omit<Territoire, 'codeInsee'>;

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

export function récupérerAvancement(donnéesTerritoires: DonnéesTerritoires<TerritoireSansCodeInsee>, maille: Maille, codeInsee: string) {
  return donnéesTerritoires && donnéesTerritoires[maille] && donnéesTerritoires[maille][codeInsee] && donnéesTerritoires[maille][codeInsee].avancement
    ? donnéesTerritoires[maille][codeInsee].avancement
    : { annuel: null, global: null };
}

export function récupérerMétéo(donnéesTerritoires: DonnéesTerritoires<TerritoireSansCodeInsee>, maille: Maille, codeInsee: string) {
  return donnéesTerritoires && donnéesTerritoires[maille] && donnéesTerritoires[maille][codeInsee] && donnéesTerritoires[maille][codeInsee].météo
    ? donnéesTerritoires[maille][codeInsee].météo
    : 'NON_RENSEIGNEE';
}

export const récupérerNomTerritoire = (périmètreGéographique: TerritoireIdentifiant) => (
  territoires[périmètreGéographique.maille].find(territoire => territoire.codeInsee === périmètreGéographique.codeInsee)?.nom ?? 'NC'
);

export function initialiserDonnéesTerritoiresAgrégésVide() {
  return initialiserDonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>({
    avancement: [],
    météo: [],
  });
}

export function agrégerDonnéesTerritoiresÀUnAgrégat(
  donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>,
  donnéesTerritoires: DonnéesTerritoires<TerritoireSansCodeInsee>,
): DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>> {
  const agrégat = { ...donnéesTerritoiresAgrégées };

  for (const maille of mailles) {
    for (const codeInsee of codes[maille]) {
      agrégat[maille][codeInsee] = {
        avancement: [
          ...agrégat[maille][codeInsee].avancement,
          récupérerAvancement(donnéesTerritoires, maille, codeInsee),
        ],
        météo: [
          ...agrégat[maille][codeInsee].météo,
          récupérerMétéo(donnéesTerritoires, maille, codeInsee),
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
  donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>,
  fonctionDeRéduction: (territoiresAgrégés: Agrégation<TerritoireSansCodeInsee>) => T,
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
