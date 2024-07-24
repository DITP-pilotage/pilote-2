import { indicateur, territoire } from '@prisma/client';
import {
  DétailsIndicateurMailles,
  DétailsIndicateurTerritoire,
} from '@/server/domain/indicateur/DétailsIndicateur.interface';

function créerDonnéesTerritoires(territoires: territoire[], indicateurRows: indicateur[]) {
  let donnéesTerritoires: DétailsIndicateurTerritoire = {};
  let IntermediaireEstAnnéeEnCours: boolean;
  territoires.forEach(t => {
    const indicateurRow = indicateurRows.find(c => c.code_insee === t.code_insee);
    IntermediaireEstAnnéeEnCours = indicateurRow?.objectif_date_valeur_cible_intermediaire?.getFullYear() === new Date().getFullYear();

    donnéesTerritoires[t.code_insee] = {
      codeInsee: t.code_insee,
      dateValeurCible: indicateurRow?.objectif_date_valeur_cible?.toLocaleString() ?? null,
      dateValeurInitiale: indicateurRow?.date_valeur_initiale?.toLocaleString() ?? null,
      dateValeurActuelle: indicateurRow?.date_valeur_actuelle?.toLocaleString() ?? null,
      dateValeurCibleAnnuelle: IntermediaireEstAnnéeEnCours ?  indicateurRow?.objectif_date_valeur_cible_intermediaire?.toLocaleString() ?? null : null,
      dateValeurs: indicateurRow?.evolution_date_valeur_actuelle ? indicateurRow?.evolution_date_valeur_actuelle.map(date => ( date.toLocaleString())) : [],
      valeurs: indicateurRow?.evolution_valeur_actuelle ?? [],
      valeurCible: indicateurRow?.objectif_valeur_cible ?? null,
      valeurInitiale: indicateurRow?.valeur_initiale ?? null,
      valeurActuelle: indicateurRow?.valeur_actuelle ?? null,
      valeurActuelleProposee: indicateurRow?.valeur_actuelle_propose ?? null,
      valeurCibleAnnuelle: IntermediaireEstAnnéeEnCours ? indicateurRow?.objectif_valeur_cible_intermediaire ?? null : null,
      avancement: {
        annuel: IntermediaireEstAnnéeEnCours ? indicateurRow?.objectif_taux_avancement_intermediaire ?? null : null, 
        annuelPropose: IntermediaireEstAnnéeEnCours ? indicateurRow?.objectif_taux_avancement_intermediaire_propose ?? null : null,
        global: indicateurRow?.objectif_taux_avancement ?? null,
        globalPropose: indicateurRow?.objectif_taux_avancement_propose ?? null,
      },
      unité: indicateurRow?.unite_mesure ?? null,
      est_applicable: indicateurRow?.est_applicable ?? null,
      dateImport: indicateurRow?.dernier_import_date_indic?.toLocaleString() ?? null,
      pondération: indicateurRow?.ponderation_zone_reel ?? null,
      prochaineDateMaj: indicateurRow?.prochaine_date_maj_jours?.toLocaleString() ?? null,
      prochaineDateMajJours: indicateurRow?.prochaine_date_maj_jours ?? null,
      estAJour: indicateurRow?.est_a_jour ?? null,
      tendance: indicateurRow?.tendance ?? null,
    };
  });

  return donnéesTerritoires;
}

export function parseDétailsIndicateur(indicateurRows: indicateur[], territoires: territoire[]): DétailsIndicateurMailles {
  const indicateurMailleNationale = indicateurRows.filter(c => c.maille === 'NAT');
  const indicateurMailleDépartementale = indicateurRows.filter(c => c.maille === 'DEPT');
  const indicateurMailleRégionale = indicateurRows.filter(c => c.maille === 'REG');

  return {
    nationale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'NAT'), indicateurMailleNationale),
    départementale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'DEPT'), indicateurMailleDépartementale),
    régionale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'REG'), indicateurMailleRégionale),
  };
}
