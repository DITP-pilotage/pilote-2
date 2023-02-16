/* eslint-disable unicorn/consistent-function-scoping */
import { départementsTerritoiresStore, régionsTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import { Maille } from '@/server/domain/chantier/Chantier.interface';
import { Agrégation } from '@/client/utils/types';
import { DonnéesTerritoires, réduireDonnéesTerritoires, TerritoireSansCodeInsee } from '@/client/utils/chantier/donnéesTerritoires/donnéesTerritoires';
import { remplissageParDéfaut } from '@/client/constants/nuanciers/nuancier';
import { CartographieValeur, CartographieDonnées, CartographieTerritoireAffiché, CartographieTerritoireCodeInsee, CartographieBulleTerritoire, CartographieOptions, CartographieTerritoire } from './useCartographie.interface';

export default function useCartographie() {
  const régions = régionsTerritoiresStore();
  const départements = départementsTerritoiresStore();

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
  
  function formaterBulleTitre(territoireSurvolé: CartographieBulleTerritoire) {
    return territoireSurvolé.maille === 'départementale'
      ? `${territoireSurvolé.codeInsee} – ${territoireSurvolé.nom}`
      : territoireSurvolé.nom;
  }
  
  function déterminerRégionsÀTracer(territoireAffiché: CartographieTerritoireAffiché) {
    return territoireAffiché.maille === 'régionale'
      ? régions.filter(région => région.codeInsee === territoireAffiché.codeInsee)
      : régions;
  }

  function récupérerDépartementsDUneRégion(codeInseeRégion: CartographieTerritoireCodeInsee) {
    return départements.filter(département => département.codeInseeParent === codeInseeRégion);
  }

  function créerTerritoires(
    régionsÀTracer: typeof régions,
    données: CartographieDonnées,
    afficherDépartements: boolean,
  ): CartographieTerritoire[] {
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
            codeInseeParent: département.codeInseeParent!,
            sousTerritoires: [],
          }))
        : [],
    }),
    );
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
