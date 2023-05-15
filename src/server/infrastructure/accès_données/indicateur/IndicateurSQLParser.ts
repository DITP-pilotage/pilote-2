import { indicateur, territoire } from '@prisma/client';
import {
  DétailsIndicateurCodeInsee,
  DétailsIndicateurTerritoire,
} from '@/server/domain/indicateur/DétailsIndicateur.interface';

function créerDonnéesTerritoires(territoires: territoire[], indicateurRows: indicateur[]) {
  let donnéesTerritoires: DétailsIndicateurCodeInsee = {};

  territoires.forEach(t => {
    const indicateurRow = indicateurRows.find(c => c.code_insee === t.code_insee);

    donnéesTerritoires[t.code_insee] = {
      codeInsee: t.code_insee,
      dateValeurCible:  indicateurRow?.objectif_date_valeur_cible ?? null,
      dateValeurInitiale:  indicateurRow?.date_valeur_actuelle ? indicateurRow?.date_valeur_actuelle.toLocaleString() : null,
      dateValeurs: indicateurRow?.evolution_date_valeur_actuelle ? indicateurRow?.evolution_date_valeur_actuelle.map(date => ( date.toLocaleString())) : [],
      valeurs: indicateurRow?.evolution_valeur_actuelle ?? [],
      valeurCible: indicateurRow?.objectif_valeur_cible ?? null,
      valeurInitiale: indicateurRow?.valeur_initiale ?? null,
      avancement: { annuel: null, global: indicateurRow?.valeur_actuelle ?? null },
    };
  });

  return donnéesTerritoires;
}

export function parseDétailsIndicateur(indicateurRows: indicateur[], territoires: territoire[]): DétailsIndicateurTerritoire {
  const indicateurMailleNationale = indicateurRows.find(c => c.maille === 'NAT');
  const indicateurMailleDépartementale = indicateurRows.filter(c => c.maille === 'DEPT');
  const indicateurMailleRégionale = indicateurRows.filter(c => c.maille === 'REG');


  const result: DétailsIndicateurTerritoire = {
    nationale: {
      FR: {
        codeInsee: 'FR',
        dateValeurCible:  indicateurMailleNationale?.objectif_date_valeur_cible ?? null,
        dateValeurInitiale:  indicateurMailleNationale?.date_valeur_actuelle ? indicateurMailleNationale?.date_valeur_actuelle.toLocaleString() : null,
        dateValeurs: indicateurMailleNationale?.evolution_date_valeur_actuelle ? indicateurMailleNationale?.evolution_date_valeur_actuelle.map(date => ( date.toLocaleString())) : [],
        valeurs: indicateurMailleNationale?.evolution_valeur_actuelle ?? [],
        valeurCible: indicateurMailleNationale?.objectif_valeur_cible ?? null,
        valeurInitiale: indicateurMailleNationale?.valeur_initiale ?? null,
        avancement: { annuel: null, global: indicateurMailleNationale?.valeur_actuelle ?? null },
      },
    },
    départementale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'DEPT'), indicateurMailleDépartementale),
    régionale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'REG'), indicateurMailleRégionale),
  };

  return result;
}
