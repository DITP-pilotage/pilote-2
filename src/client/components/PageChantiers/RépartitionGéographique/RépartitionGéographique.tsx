import Titre from '@/components/_commons/Titre/Titre';
import Cartographie from '@/components/_commons/Cartographie/Cartographie';
import Chantier, { Maille, mailles, Territoire } from '@/server/domain/chantier/Chantier.interface';
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

function calculerLaMoyenne(valeurs: (number | null)[]) {
  const valeursFiltrées = valeurs.filter((valeur): valeur is number => valeur !== null);
  const somme = valeursFiltrées.reduce(
    (accumulateur, valeur) => accumulateur + valeur,
    0,
  );

  return valeursFiltrées.length === 0 ? null : somme / valeursFiltrées.length;
}

export type DonnéesTerritoires<T> = Record<Maille, Record<CartographieTerritoireCodeInsee, T>>;

function créerDonnéesTerritoires<T>(donnéesInitiales: T) {
  return Object.fromEntries(
    mailles.map(maille => ([
      maille,
      Object.fromEntries(
        codes[maille].map(codeInsee => ([
          codeInsee,
          donnéesInitiales,
        ])),
      ) as Record<CartographieTerritoireCodeInsee, T>,
    ])),
  ) as DonnéesTerritoires<T>;
}

function créerDonnéesChantiersAgrégésVide() {
  return Object.fromEntries(
    mailles.map(maille => ([
      maille,
      Object.fromEntries(
        codes[maille].map(codeInsee => ([
          codeInsee,
          {
            codeInsee: [],
            avancement: [],
          },
        ])),
      ) as Record<CartographieTerritoireCodeInsee, Agrégation<Territoire>>,
    ])),
  ) as DonnéesTerritoires<Agrégation<Territoire>>;
}

function créerCartographieDonnéesVide() {
  return Object.fromEntries(
    mailles.map(maille => ([
      maille,
      Object.fromEntries(
        codes[maille].map(codeInsee => ([
          codeInsee,
          {
            brute: null,
            affichée: null,
          },
        ])),
      ) as Record<CartographieTerritoireCodeInsee, CartographieValeur>,
    ])),
  ) as CartographieDonnées;
}

function agrégerUnChantierÀUnAgrégatDeChantier(
  chantiersAgrégés: DonnéesTerritoires<Agrégation<Territoire>>,
  chantier: DonnéesTerritoires<Territoire>,
): DonnéesTerritoires<Agrégation<Territoire>> {
  const donnéesChantiersAgrégés = { ...chantiersAgrégés };

  for (const maille of mailles) {
    for (const codeInsee of codes[maille]) {
      donnéesChantiersAgrégés[maille][codeInsee] = {
        codeInsee: [...donnéesChantiersAgrégés[maille][codeInsee].codeInsee, chantier[maille][codeInsee].codeInsee],
        avancement: [...donnéesChantiersAgrégés[maille][codeInsee].avancement, chantier[maille][codeInsee].avancement],
      };
    }
  }

  return donnéesChantiersAgrégés;
}

function agrégerChantiers(chantiers: Chantier[]) {
  const agrégat = créerDonnéesChantiersAgrégésVide();
  for (const chantier of chantiers) {
    agrégerUnChantierÀUnAgrégatDeChantier(agrégat, chantier.mailles);
  }
  return agrégat;
}

function réduireChantiersAgrégés(
  chantiersAgrégés: DonnéesTerritoires<Agrégation<Territoire>>,
  fonctionDeRéduction: (territoiresAgrégés: Agrégation<Territoire>) => CartographieValeur,
): CartographieDonnées {
  const donnéesRéduites = créerCartographieDonnéesVide();

  for (const maille of mailles) {
    if (maille === 'nationale')
      continue;
    for (const codeInsee of codes[maille]) {
      donnéesRéduites[maille][codeInsee] = fonctionDeRéduction(chantiersAgrégés[maille][codeInsee]);
    }
  }

  return donnéesRéduites;
}

export default function RépartitionGéographique({ chantiers }: RépartitionGéographiqueProps) {

  const chantiersAgrégés = agrégerChantiers(chantiers);
  const donnéesCartographie = réduireChantiersAgrégés(chantiersAgrégés, (territoiresAgrégés) => {
    const valeurBrute = calculerLaMoyenne(territoiresAgrégés.avancement.map(avancement => avancement.global));
    return {
      brute: valeurBrute,
      affichée: valeurBrute ? `${valeurBrute.toFixed(0)}%` : 'Non renseigné',
    };
  });

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
