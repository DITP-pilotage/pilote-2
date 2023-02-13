/* eslint-disable unicorn/consistent-function-scoping */
import { Maille, MailleInterne } from '@/server/domain/chantier/Chantier.interface';
import { Agrégation } from '@/client/utils/types';
import { DonnéesTerritoires, réduireDonnéesTerritoires, TerritoireSansCodeInsee } from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { NuancierRemplissage, remplissageParDéfaut } from '@/client/constants/nuanciers/nuancier';
import untypedDépartementsJSON from './départements.json';
import untypedRégionsJSON from './régions.json';

export type CartographieRégionJSON = {
  tracéSVG: string,
  codeInsee: CartographieTerritoireCodeInsee,
  nom: string
};

export type CartographieDépartementJSON = {
  tracéSVG: string,
  codeInsee: CartographieTerritoireCodeInsee,
  codeInseeRégion: CartographieTerritoireCodeInsee,
  nom: string
};

export type CartographieBulleTerritoire = Pick<CartographieTerritoire, 'codeInsee' | 'nom' | 'valeur' | 'maille'>;
export type CartographieTerritoireCodeInsee = string;
export type CartographieValeur = number | string | null;

export type CartographieTerritoire = {
  codeInsee: CartographieTerritoireCodeInsee,
  maille: Maille,
  nom: string,
  sousTerritoires: (CartographieTerritoire & {
    codeInseeParent: CartographieTerritoireCodeInsee;
  })[];
  tracéSVG: string;
  valeur: CartographieValeur,
};

export type CartographieTerritoireAffiché = {
  codeInsee: CartographieTerritoireCodeInsee,
  maille: 'nationale' | 'régionale',
};

export type CartographieOptions = {
  territoireAffiché: CartographieTerritoireAffiché,
  déterminerRemplissage: (valeur: CartographieValeur) => NuancierRemplissage,
  formaterValeur: (valeur: CartographieValeur) => string,
  territoireSélectionnable: boolean,
};

export type CartographieDonnées = Record<MailleInterne, Record<CartographieTerritoireCodeInsee, CartographieValeur>>;

export default function useCartographie() {
  function préparerDonnéesCartographieÀPartirDUneListe(
    donnéesTerritoiresAgrégées: DonnéesTerritoires<Agrégation<TerritoireSansCodeInsee>>,
    fonctionDeRéduction: (territoiresAgrégés: Agrégation<TerritoireSansCodeInsee>) => CartographieValeur,
  ): CartographieDonnées {
    return réduireDonnéesTerritoires<CartographieValeur>(
      donnéesTerritoiresAgrégées,
      fonctionDeRéduction,
      null,
    );
  }

  function préparerDonnéesCartographieÀPartirDUnÉlément(
    donnéesTerritoires: DonnéesTerritoires<TerritoireSansCodeInsee>,
    fonctionDExtraction: (territoire: TerritoireSansCodeInsee) => CartographieValeur,
  ): CartographieDonnées {
    const donnéesCartographie: CartographieDonnées = { départementale : {}, régionale: {} };
    let maille: Maille;

    for (maille in donnéesTerritoires) {
      if (maille === 'nationale') continue;
      for (const codeInsee in donnéesTerritoires[maille]) {
        donnéesCartographie[maille][codeInsee] = fonctionDExtraction(donnéesTerritoires[maille][codeInsee]);
      }
    }
    return donnéesCartographie;
  }

  const départementsJSON: CartographieDépartementJSON[] = untypedDépartementsJSON;
  const régionsJSON: CartographieRégionJSON[] = untypedRégionsJSON;

  function déterminerRégionsÀTracer(territoireAffiché: CartographieTerritoireAffiché) {
    return territoireAffiché.maille === 'régionale'
      ? régionsJSON.filter(régionJSON => régionJSON.codeInsee === territoireAffiché.codeInsee)
      : régionsJSON;
  }

  function récupérerDépartementsDUneRégion(codeInseeRégion: CartographieTerritoireCodeInsee) {
    return départementsJSON.filter(département => département.codeInseeRégion === codeInseeRégion);
  }

  function créerTerritoires(
    régionsÀTracer: CartographieRégionJSON[],
    données: CartographieDonnées,
    afficherDépartements: boolean,
  ) {
    return régionsÀTracer.map(région => ({
      codeInsee: région.codeInsee,
      maille: 'régionale' as const,
      nom: région.nom,
      tracéSVG: région.tracéSVG,
      valeur: données.régionale[région.codeInsee],
      sousTerritoires: afficherDépartements
        ? récupérerDépartementsDUneRégion(région.codeInsee)
          .map(département => ({
            codeInsee: département.codeInsee,
            maille: 'départementale' as const,
            nom: département.nom,
            tracéSVG: département.tracéSVG,
            valeur: données.départementale[département.codeInsee],
            codeInseeParent: département.codeInseeRégion,
            sousTerritoires: [],
          }))
        : [],
    }),
    );
  }
  
  function formaterBulleTitre(territoireSurvolé: CartographieBulleTerritoire) {
    return territoireSurvolé.maille === 'départementale'
      ? `${territoireSurvolé.codeInsee} – ${territoireSurvolé.nom}`
      : territoireSurvolé.nom;
  }
    
  const optionsParDéfaut: CartographieOptions = {
    territoireAffiché: {
      codeInsee: 'FR',
      maille: 'nationale',
    },
    déterminerRemplissage: () => remplissageParDéfaut,
    formaterValeur: (valeur) => valeur ? String(valeur) : '-',
    territoireSélectionnable: false,
  };
  

  return { 
    préparerDonnéesCartographieÀPartirDUneListe, 
    préparerDonnéesCartographieÀPartirDUnÉlément, 
    déterminerRégionsÀTracer,
    créerTerritoires,
    formaterBulleTitre,
    optionsParDéfaut,
  };
}
