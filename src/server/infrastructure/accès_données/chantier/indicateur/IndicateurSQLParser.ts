import { indicateur_territoire as PrismaIndicateurTerritoire, indicateur_territoire_jalon as PrismaIndicateurTerritoireJalon, indicateur_identite as PrismaIndicateurIdentite, territoire as PrismaTerritoire } from '@prisma/client';
import {
  DétailsIndicateurMailles,
  DétailsIndicateurTerritoire,
} from '@/server/domain/indicateur/DétailsIndicateur.interface';
import { comparerDates } from '@/client/utils/date/date';
import {
  getAnneeAffichageDateDeBascule,
} from '@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getDateBasculeAffichageValeursAnneePrecedente';
import { configuration } from '@/config';
import { historique_valeurs } from './IndicateurSQLRepository';

export function créerDonnéesTerritoires(territoires: Pick<PrismaTerritoire, 'code' | 'code_insee'>[], indicateurRows: (PrismaIndicateurTerritoire & {
  indicateur_identite: PrismaIndicateurIdentite
  indicateur_territoire_jalon: PrismaIndicateurTerritoireJalon[]
})[]) {
  let donnéesTerritoires: DétailsIndicateurTerritoire = {};
  let estDateDuJourCorrespondantALanneeValeurCible: boolean;

  const dateBascule = configuration.dateBasculeAffichageValeursAnneePrecedente;

  territoires.forEach(territoire => {
    const indicateurRow = indicateurRows.find(indicateur => indicateur.territoire_code === territoire.code);
    estDateDuJourCorrespondantALanneeValeurCible = indicateurRow?.indicateur_territoire_jalon.at(0)?.date_valeur_cible ? getAnneeAffichageDateDeBascule(new Date(), dateBascule) === indicateurRow?.indicateur_territoire_jalon.at(0)?.date_valeur_cible?.getFullYear() : false;

    donnéesTerritoires[territoire.code] = {
      codeInsee: territoire.code_insee,
      dateValeurCible: indicateurRow?.date_valeur_cible_mandat?.toLocaleString() ?? null,
      dateValeurInitiale: indicateurRow?.date_valeur_initiale?.toLocaleString() ?? null,
      dateValeurActuelle: indicateurRow?.date_valeur_actuelle?.toLocaleString() ?? null,
      dateValeurCibleAnnuelle: estDateDuJourCorrespondantALanneeValeurCible ? indicateurRow?.indicateur_territoire_jalon.at(0)?.date_valeur_cible?.toLocaleString() ?? null : null,
      // TODO(Tristan-10/10/2024) : Trouver une moyen de se débarasser du as unknown
      historiquesValeurs: indicateurRow ? 
        (indicateurRow.evolution_valeur_actuelle as unknown as historique_valeurs[] || []).sort((a, b) => comparerDates(a.date, b.date)) :
        [],
      valeurCible: indicateurRow?.valeur_cible_mandat ?? null,
      valeurInitiale: indicateurRow?.valeur_initiale ?? null,
      valeurActuelle: indicateurRow?.valeur_actuelle ?? null,
      valeurCibleAnnuelle: estDateDuJourCorrespondantALanneeValeurCible ? indicateurRow?.indicateur_territoire_jalon.at(0)?.valeur_cible ?? null : null,
      avancement: {
        annuel: estDateDuJourCorrespondantALanneeValeurCible ? indicateurRow?.indicateur_territoire_jalon.at(0)?.taux_avancement ?? null : null,
        global: indicateurRow?.taux_avancement_mandat ?? null,
      },
      proposition: indicateurRow?.valeur_actuelle_proposition !== null && indicateurRow?.valeur_actuelle_proposition !== undefined ? { // Pour autoriser une valeur actuelle proposé à 0
        valeurActuelle: indicateurRow?.valeur_actuelle_proposition,
        tauxAvancement: indicateurRow?.taux_avancement_mandat_proposition,
        tauxAvancementIntermediaire: estDateDuJourCorrespondantALanneeValeurCible && indicateurRow?.indicateur_territoire_jalon.at(0)?.taux_avancement_proposition !== null && indicateurRow?.indicateur_territoire_jalon.at(0)?.taux_avancement_proposition !== undefined ? indicateurRow?.indicateur_territoire_jalon.at(0)?.taux_avancement_proposition! : null,
        auteur: indicateurRow?.auteur_proposition,
        motif: indicateurRow?.motif_proposition,
        sourceDonneeEtMethodeCalcul: indicateurRow?.source_donnee_methode_calcul_proposition,
        dateProposition: indicateurRow?.date_proposition?.toLocaleString() ?? null,
      } : null,
      unité: indicateurRow?.indicateur_identite.unite_mesure ?? null,
      est_applicable: indicateurRow?.est_applicable ?? null,
      dateImport: indicateurRow?.indicateur_identite.dernier_import_date_indic?.toLocaleString() ?? null,
      pondération: indicateurRow?.ponderation_zone_reel ?? null,
      prochaineDateMaj: indicateurRow?.prochaine_date_maj?.toLocaleString() ?? null,
      prochaineDateMajJours: indicateurRow?.prochaine_date_maj_jours ?? null,
      prochaineDateValeurActuelle: indicateurRow?.prochaine_date_valeur_actuelle?.toLocaleString() ?? null,
      estAJour: indicateurRow?.est_a_jour ?? null,
      tendance: indicateurRow?.tendance ?? null,
    };
  });

  return donnéesTerritoires;
}

export function parseDétailsIndicateur(prismaIndicateurTerritoire: (PrismaIndicateurTerritoire & { indicateur_identite: PrismaIndicateurIdentite, indicateur_territoire_jalon: PrismaIndicateurTerritoireJalon[] } )[], territoires: PrismaTerritoire[]): DétailsIndicateurMailles {
  const indicateurMailleNationale = prismaIndicateurTerritoire.filter(indicateur => indicateur.maille === 'NAT');
  const indicateurMailleDépartementale = prismaIndicateurTerritoire.filter(indicateur => indicateur.maille === 'DEPT');
  const indicateurMailleRégionale = prismaIndicateurTerritoire.filter(indicateur => indicateur.maille === 'REG');

  return {
    nationale: créerDonnéesTerritoires(territoires.filter(territoire => territoire.maille === 'NAT'), indicateurMailleNationale),
    departementale: créerDonnéesTerritoires(territoires.filter(territoire => territoire.maille === 'DEPT'), indicateurMailleDépartementale),
    regionale: créerDonnéesTerritoires(territoires.filter(territoire => territoire.maille === 'REG'), indicateurMailleRégionale),
  };
}
