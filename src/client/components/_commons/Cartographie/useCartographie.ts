/* eslint-disable unicorn/consistent-function-scoping */
import { Maille } from '@/server/domain/chantier/Chantier.interface';
import { Agrégation } from '@/client/utils/types';
import { DonnéesTerritoires, réduireDonnéesTerritoires, TerritoireSansCodeInsee } from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { CartographieDonnées, CartographieOptions, CartographieTerritoireAffiché, CartographieTerritoireCodeInsee, CartographieValeur, CartographieDépartementJSON, CartographieRégionJSON, CartographieBulleTerritoire } from '@/components/_commons/Cartographie/CartographieAffichage/CartographieAffichage.interface';
import { remplissageParDéfaut } from '@/client/constants/nuanciers/nuancier';
import untypedDépartementsJSON from './départements.json';
import untypedRégionsJSON from './régions.json';


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
      if (maille === 'nationale') {
        continue;
      }
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
    return départementsJSON
      .filter(département => département.codeInseeRégion === codeInseeRégion);
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
