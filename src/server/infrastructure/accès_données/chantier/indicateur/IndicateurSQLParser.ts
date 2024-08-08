import { indicateur as PrismaIndicateur, territoire as PrismaTerritoire } from '@prisma/client';
import {
  DétailsIndicateurMailles,
  DétailsIndicateurTerritoire,
} from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { MailleInterne } from '@/server/domain/maille/Maille.interface';

function créerDonnéesTerritoires(territoires: PrismaTerritoire[], indicateurRows: PrismaIndicateur[]) {
  let donnéesTerritoires: DétailsIndicateurTerritoire = {};
  let IntermediaireEstAnnéeEnCours: boolean;
  territoires.forEach(territoire => {
    const indicateurRow = indicateurRows.find(indicateur => indicateur.code_insee === territoire.code_insee);
    IntermediaireEstAnnéeEnCours = indicateurRow?.objectif_date_valeur_cible_intermediaire?.getFullYear() === new Date().getFullYear();

    donnéesTerritoires[territoire.code_insee] = {
      codeInsee: territoire.code_insee,
      dateValeurCible: indicateurRow?.objectif_date_valeur_cible?.toLocaleString() ?? null,
      dateValeurInitiale: indicateurRow?.date_valeur_initiale?.toLocaleString() ?? null,
      dateValeurActuelle: indicateurRow?.date_valeur_actuelle?.toLocaleString() ?? null,
      dateValeurCibleAnnuelle: IntermediaireEstAnnéeEnCours ?  indicateurRow?.objectif_date_valeur_cible_intermediaire?.toLocaleString() ?? null : null,
      dateValeurs: indicateurRow?.evolution_date_valeur_actuelle ? indicateurRow?.evolution_date_valeur_actuelle.map(date => ( date.toLocaleString())) : [],
      valeurs: indicateurRow?.evolution_valeur_actuelle ?? [],
      valeurCible: indicateurRow?.objectif_valeur_cible ?? null,
      valeurInitiale: indicateurRow?.valeur_initiale ?? null,
      valeurActuelle: indicateurRow?.valeur_actuelle ?? null,
      valeurCibleAnnuelle: IntermediaireEstAnnéeEnCours ? indicateurRow?.objectif_valeur_cible_intermediaire ?? null : null,
      avancement: {
        annuel: IntermediaireEstAnnéeEnCours ? indicateurRow?.objectif_taux_avancement_intermediaire ?? null : null,
        global: indicateurRow?.objectif_taux_avancement ?? null,
      },
      proposition: indicateurRow?.valeur_actuelle_proposition !== null && indicateurRow?.valeur_actuelle_proposition !== undefined ? { // Pour autoriser une valeur actuelle proposé à 0
        valeurActuelle: indicateurRow?.valeur_actuelle_proposition,
        tauxAvancement: indicateurRow?.objectif_taux_avancement_proposition,
        tauxAvancementIntermediaire: IntermediaireEstAnnéeEnCours ? indicateurRow?.objectif_taux_avancement_intermediaire_proposition : null,
        auteur: indicateurRow?.auteur_proposition,
        motif: indicateurRow?.motif_proposition,
        sourceDonneeEtMethodeCalcul: indicateurRow?.source_donnee_methode_calcul_proposition,
        dateProposition: indicateurRow?.date_proposition?.toLocaleString() ?? null,
      } : null,
      unité: indicateurRow?.unite_mesure ?? null,
      est_applicable: indicateurRow?.est_applicable ?? null,
      dateImport: indicateurRow?.dernier_import_date_indic?.toLocaleString() ?? null,
      pondération: indicateurRow?.ponderation_zone_reel ?? null,
      prochaineDateMaj: indicateurRow?.prochaine_date_maj_jours?.toLocaleString() ?? null,
      prochaineDateMajJours: indicateurRow?.prochaine_date_maj_jours ?? null,
      prochaineDateValeurActuelle: indicateurRow?.prochaine_date_valeur_actuelle?.toLocaleString() ?? null,
      estAJour: indicateurRow?.est_a_jour ?? null,
      tendance: indicateurRow?.tendance ?? null,
    };
  });

  return donnéesTerritoires;
}

export function parseDétailsIndicateur(indicateurRows: PrismaIndicateur[], territoires: PrismaTerritoire[]): DétailsIndicateurMailles {
  const indicateurMailleNationale = indicateurRows.filter(c => c.maille === 'NAT');
  const indicateurMailleDépartementale = indicateurRows.filter(c => c.maille === 'DEPT');
  const indicateurMailleRégionale = indicateurRows.filter(c => c.maille === 'REG');

  return {
    nationale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'NAT'), indicateurMailleNationale),
    départementale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'DEPT'), indicateurMailleDépartementale),
    régionale: créerDonnéesTerritoires(territoires.filter(t => t.maille === 'REG'), indicateurMailleRégionale),
  };
}

export function parseDétailsIndicateurNew(indicateurRows: PrismaIndicateur[], territoires: PrismaTerritoire[], mailleInterne: MailleInterne): DétailsIndicateurTerritoire {
  const maille = mailleInterne === 'départementale' ? 'DEPT' : mailleInterne === 'régionale' ? 'REG' : 'NAT';

  const listeIndicateurTerritoire = indicateurRows.filter(c => c.maille === maille);
  const listeTerritoires = territoires.filter(t => t.maille === maille);

  return créerDonnéesTerritoires(listeTerritoires, listeIndicateurTerritoire);
}
