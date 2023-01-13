import Titre from '@/components/_commons/Titre/Titre';
import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import { Maille, mailles, Territoire } from '@/server/domain/chantier/Chantier.interface';
import {
  CartographieValeur,
  CartographieTerritoireCodeInsee,
} from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';

import { Agrégation } from '@/client/utils/types';
import { CartographieDonnées } from '@/components/_commons/Cartographie/Cartographie.interface';
import RépartitionGéographiqueProps from './RépartitionGéographique.interface';

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

function calculerMoyenne(valeurs: (number | null)[]) {
  const valeursFiltrées = valeurs.filter((valeur): valeur is number => valeur !== null);
  const somme = valeursFiltrées.reduce(
    (accumulateur, valeur) => accumulateur + valeur,
    0,
  );

  return valeursFiltrées.length === 0 ? null : somme / valeursFiltrées.length;
}

export type DonnéesTerritoires<T> = Record<Maille, Record<CartographieTerritoireCodeInsee, T>>;
type TerritoireSansCodeInsee = Omit<Territoire, 'codeInsee'>;

function initialiserDonnéesTerritoires<T>(donnéesInitiales: T) {
  return Object.fromEntries(
    mailles.map(maille => ([
      maille,
      Object.fromEntries(
        codes[maille].map(codeInsee => ([
          codeInsee,
          donnéesInitiales,
        ] as [CartographieTerritoireCodeInsee, T])),
      ) as Record<CartographieTerritoireCodeInsee, T>,
    ])),
  ) as DonnéesTerritoires<T>;
}

function initialiserDonnéesTerritoiresAgrégésVide() {
  return initialiserDonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>({
    avancement: [],
  });
}

function agrégerDonnéesTerritoiresÀUnAgrégat(
  donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>,
  donnéesTerritoires: DonnéesTerritoires<TerritoireSansCodeInsee>,
): DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>> {
  const agrégat = { ...donnéesTerritoiresAgrégées };

  for (const maille of mailles) {
    for (const codeInsee of codes[maille]) {
      agrégat[maille][codeInsee] = {
        avancement: [
          ...agrégat[maille][codeInsee].avancement,
          donnéesTerritoires[maille][codeInsee].avancement,
        ],
      };
    }
  }

  return agrégat;
}

function agrégerDonnéesTerritoires(listeDonnéesTerritoires: DonnéesTerritoires<Territoire>[]) {
  const agrégat = initialiserDonnéesTerritoiresAgrégésVide();
  for (const donnéesTerritoires of listeDonnéesTerritoires) {
    agrégerDonnéesTerritoiresÀUnAgrégat(agrégat, donnéesTerritoires);
  }
  return agrégat;
}

function réduireDonnéesTerritoires<T>(
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

function réduireDonnéesTerritoiresPourCartographie(
  donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>,
  fonctionDeRéduction: (territoiresAgrégés: Agrégation<TerritoireSansCodeInsee>) => CartographieValeur,
): CartographieDonnées {
  return réduireDonnéesTerritoires<CartographieValeur>(
    donnéesTerritoiresAgrégées,
    fonctionDeRéduction,
    {
      brute: null,
      affichée: null,
    },
  );
}

export default function RépartitionGéographique({ chantiers }: RépartitionGéographiqueProps) {
  const donnéesTerritoires = chantiers.map(chantier => chantier.mailles);
  const donnéesTerritoiresAgrégés = agrégerDonnéesTerritoires(donnéesTerritoires);
  const donnéesCartographie = réduireDonnéesTerritoiresPourCartographie(
    donnéesTerritoiresAgrégés,
    (territoiresAgrégés) => {
      const valeurs = territoiresAgrégés.avancement.map(avancement => avancement.global);
      const valeurBrute = calculerMoyenne(valeurs);
      return {
        brute: valeurBrute,
        affichée: valeurBrute ? `${valeurBrute.toFixed(0)}%` : 'Non renseigné',
      };
    },
  );

  return (
    <>
      <Titre
        baliseHtml='h2'
        className='fr-h6'
      >
        Répartition géographique
      </Titre>
      <Cartographie
        données={donnéesCartographie}
        niveauDeMailleAffiché='départementale'
        territoireAffiché={{
          codeInsee: 'FR',
          divisionAdministrative: 'france',
        }}
      />
      <Cartographie
        données={donnéesCartographie}
        niveauDeMailleAffiché='régionale'
        territoireAffiché={{
          codeInsee: 'FR',
          divisionAdministrative: 'france',
        }}
      />
      <Cartographie
        données={donnéesCartographie}
        niveauDeMailleAffiché='départementale'
        territoireAffiché={{
          codeInsee: '84',
          divisionAdministrative: 'région',
        }}
      />
    </>
  );
}
