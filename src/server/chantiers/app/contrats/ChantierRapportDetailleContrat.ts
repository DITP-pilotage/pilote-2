import { Maille, MailleInterne } from '@/server/domain/maille/Maille.interface';
import {
  TypeStatut,
} from '@/server/domain/chantier/Chantier.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { ProfilEnum } from '@/server/app/enum/profil.enum';
import {
  créerDonnéesTerritoiresRapportDetailleNew,
} from '@/server/infrastructure/accès_données/chantier/ChantierSQLParser';
import { PrismaChantier } from '@/server/infrastructure/accès_données/chantier/PrismaChantier';
import { ProfilCode } from '@/server/domain/utilisateur/Utilisateur.interface';
import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import { verifyValeurIsNotNullOrUndefined } from '@/server/utils/VerifyValeurIsNotNullOrUndefined';


interface TerritoireAvancementRapportDetailleContrat {
  global: number | null
  annuel: number | null
}

interface TerritoireDonnéeRapportDetailleContrat {
  estApplicable: boolean | null
  écart: number | null
  tendance: 'BAISSE' | 'HAUSSE' | 'STAGNATION' | null
  dateDeMàjDonnéesQualitatives: string | null
  dateDeMàjDonnéesQuantitatives: string | null
  avancement: TerritoireAvancementRapportDetailleContrat
  responsableLocal: ResponsableLocalRapportDetailleContrat[]
  coordinateurTerritorial: CoordinateurTerritorialRapportDetailleContrat[]
  météo: 'NON_RENSEIGNEE' | 'ORAGE' | 'NUAGE' | 'COUVERT' | 'SOLEIL' | 'NON_NECESSAIRE'
  nombrePropositionsValeurActuelle: number,
}

export type ListeTerritoiresDonnéeRapportDetailleContrat = Record<string, TerritoireDonnéeRapportDetailleContrat>;

export type MailleRapportDetailleContrat = Record<Maille, ListeTerritoiresDonnéeRapportDetailleContrat>;

export interface MinisterePorteurRapportDetailleContrat {
  nom?: string
  icône?: string | null
  périmètresMinistériels: {
    id: string
  }[];
}

export interface MinistereCoporteurRapportDetailleContrat {
  nom: string
}

export interface DirecteurAdministrationCentraleRapportDetailleContrat {
  nom: string
  direction: string
}

export interface DirecteurProjetRapportDetailleContrat {
  nom: string
  email: string | null
}

export interface ResponsableRapportDetailleContrat {
  porteur: MinisterePorteurRapportDetailleContrat | null;
  coporteurs: MinistereCoporteurRapportDetailleContrat[]
  directeursAdminCentrale: DirecteurAdministrationCentraleRapportDetailleContrat[]
  directeursProjet: DirecteurProjetRapportDetailleContrat[]
}

export interface ResponsableLocalRapportDetailleContrat {
  nom: string
  email: string
}

export interface CoordinateurTerritorialRapportDetailleContrat {
  nom: string
  email: string
}

export interface ChantierRapportDetailleContrat {
  id: string
  nom: string
  statut: TypeStatut,
  cibleAttendu: boolean,
  mailles: MailleRapportDetailleContrat;
  périmètreIds: string[]
  estTerritorialisé: boolean
  estBaromètre: boolean
  axe: string
  ppg: string
  tauxAvancementDonnéeTerritorialisée: Record<MailleInterne, Boolean>
  météoDonnéeTerritorialisée: Record<MailleInterne, Boolean>
  responsables: ResponsableRapportDetailleContrat
  dateDeMàjDonnéesQuantitatives: string | null;
  dateDeMàjDonnéesQualitatives: string | null;
  écart: number | null;
  tendance: 'BAISSE' | 'HAUSSE' | 'STAGNATION' | null;
  météo: Météo;
  avancementGlobal: number | null;
  responsableLocalTerritoireSélectionné: ResponsableLocalRapportDetailleContrat[]
  coordinateurTerritorialTerritoireSélectionné: CoordinateurTerritorialRapportDetailleContrat[]
  nombrePropositionsValeurActuelle: number,
}

class ErreurChantierSansMailleNationale extends Error {
  constructor(idChantier: string) {
    super(`Erreur: le chantier '${idChantier}' n'a pas de maille nationale.`);
  }
}

export const presenterEnChantierRapportDetaille = (
  chantierIdentite: PrismaChantier,
  territoires: Territoire[],
  ministères: Ministère[],
  territoireCode: string,
  profil: ProfilCode,
): ChantierRapportDetailleContrat => {
  const mailleChantier = territoireCode.startsWith('NAT') ? 'nationale' : territoireCode.startsWith('REG') ? 'regionale' : 'departementale';

  const chantierMailleNationale = chantierIdentite.chantier_territoire.find(c => c.maille === 'NAT');
  const listeChantiersMailleDépartementale = chantierIdentite.chantier_territoire.filter(c => c.maille === 'DEPT');
  const listeChantiersMailleRégionale = chantierIdentite.chantier_territoire.filter(c => c.maille === 'REG');

  if (!chantierMailleNationale) {
    throw new ErreurChantierSansMailleNationale(chantierIdentite.id);
  }

  const listeTerritoireDept = territoires.filter(territoire => territoire.code.startsWith('DEPT'));
  const listeTerritoireReg = territoires.filter(territoire => territoire.code.startsWith('REG'));

  const newMaille: MailleRapportDetailleContrat = {
    nationale: {
      'NAT-FR': profil === ProfilEnum.DROM && !chantierIdentite.perimetre_ids.includes('PER-018') ? {
        avancement: { annuel: null, global: null },
        météo: 'NON_RENSEIGNEE',
        écart: null,
        tendance: chantierMailleNationale.tendance,
        dateDeMàjDonnéesQualitatives: chantierMailleNationale.derniere_maj_date_qualitative?.toISOString() ?? null,
        dateDeMàjDonnéesQuantitatives: chantierMailleNationale.date_taux_avancement_mandat?.toISOString() ?? null,
        estApplicable: chantierMailleNationale.est_applicable,
        responsableLocal: [],
        coordinateurTerritorial: [],
        nombrePropositionsValeurActuelle: [...listeChantiersMailleDépartementale, ...listeChantiersMailleRégionale].some(chantier => chantier.nombre_propositions_valeur_actuelle > 0) ? 1 : 0,
      } : {
        avancement: { annuel: verifyValeurIsNotNullOrUndefined(chantierMailleNationale.chantier_territoire_jalon.at(0)?.taux_avancement), global: chantierMailleNationale.taux_avancement_mandat },
        météo: chantierMailleNationale?.meteo as Météo ?? 'NON_RENSEIGNEE',
        écart: null,
        tendance: chantierMailleNationale.tendance,
        dateDeMàjDonnéesQualitatives: chantierMailleNationale.derniere_maj_date_qualitative?.toISOString() ?? null,
        dateDeMàjDonnéesQuantitatives: chantierMailleNationale.date_taux_avancement_mandat?.toISOString() ?? null,
        estApplicable: chantierMailleNationale.est_applicable,
        coordinateurTerritorial: [],
        responsableLocal: [],
        nombrePropositionsValeurActuelle: [...listeChantiersMailleDépartementale, ...listeChantiersMailleRégionale].some(chantier => chantier.nombre_propositions_valeur_actuelle > 0) ? 1 : 0,
      },
    },
    departementale: créerDonnéesTerritoiresRapportDetailleNew(listeTerritoireDept, listeChantiersMailleDépartementale),
    regionale: créerDonnéesTerritoiresRapportDetailleNew(listeTerritoireReg, listeChantiersMailleRégionale),
  };

  const porteur = ministères.find(ministere => ministere.id === chantierIdentite.ministeres[0]) ?? null;

  return {
    id: chantierIdentite.id,
    nom: chantierIdentite.nom,
    statut: chantierIdentite.statut,
    cibleAttendu: chantierIdentite.cible_attendue,
    mailles: newMaille,
    périmètreIds: chantierIdentite.perimetre_ids,
    estTerritorialisé: !!chantierIdentite.est_territorialise,
    estBaromètre: !!chantierIdentite.est_barometre,
    axe: chantierIdentite.axe,
    ppg: chantierIdentite.ppg,
    responsables: {
      porteur: {
        nom: porteur?.nom,
        icône: porteur?.icône,
        périmètresMinistériels: (porteur?.périmètresMinistériels || []).map(({ id }) => ({ id })),
      },
      coporteurs: chantierIdentite.ministeres.slice(1)
        .map(coporteurId => (
          ministères.find(m => m.id === coporteurId) ?? null
        ))
        .filter((coporteur): coporteur is Ministère => coporteur !== null),
      directeursAdminCentrale: (chantierIdentite.directeurs_administration_centrale || []).map((value, index) => ({ nom: value, direction: chantierIdentite.directions_administration_centrale[index] })),
      directeursProjet: (chantierIdentite.directeurs_projet || []).map((value, index) => ({ nom: value, email: chantierIdentite.directeurs_projet_mails[index] })),
    },
    tauxAvancementDonnéeTerritorialisée: {
      'departementale': !!chantierIdentite.possede_taux_avancement_departemental,
      'regionale': !!chantierIdentite.possede_taux_avancement_regional,
    },
    météoDonnéeTerritorialisée: {
      'departementale': !!chantierIdentite.possede_meteo_departemental,
      'regionale': !!chantierIdentite.possede_meteo_regional,
    },
    dateDeMàjDonnéesQuantitatives: newMaille[mailleChantier][territoireCode].dateDeMàjDonnéesQuantitatives,
    dateDeMàjDonnéesQualitatives: newMaille[mailleChantier][territoireCode].dateDeMàjDonnéesQualitatives,
    écart: newMaille[mailleChantier][territoireCode].écart,
    tendance: newMaille[mailleChantier][territoireCode].tendance,
    météo: newMaille[mailleChantier][territoireCode].météo,
    avancementGlobal: newMaille[mailleChantier][territoireCode].avancement.global,
    responsableLocalTerritoireSélectionné: newMaille[mailleChantier][territoireCode].responsableLocal,
    coordinateurTerritorialTerritoireSélectionné: newMaille[mailleChantier][territoireCode].coordinateurTerritorial,
    nombrePropositionsValeurActuelle: newMaille[mailleChantier][territoireCode].nombrePropositionsValeurActuelle,
  };
};
