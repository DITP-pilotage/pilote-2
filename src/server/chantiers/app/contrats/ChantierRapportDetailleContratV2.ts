import { Maille, MailleInterne } from "@/server/domain/maille/Maille.interface";
import { TypeStatut } from "@/server/domain/chantier/Chantier.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import { NOMS_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import {
  EntreePrismaChantier,
  PrismaChantier,
} from "@/server/chantiers/domain/PrismaChantier";

interface TerritoireAvancementRapportDetailleContrat {
  global: number | null;
  annuel: number | null;
}

interface TerritoireDonnéeRapportDetailleContrat {
  estApplicable: boolean | null;
  écart: number | null;
  tendance: "BAISSE" | "HAUSSE" | "STAGNATION" | null;
  dateDeMàjDonnéesQualitatives: string | null;
  dateDeMàjDonnéesQuantitatives: string | null;
  dateTauxAvancementAnnuel: string | null;
  avancement: TerritoireAvancementRapportDetailleContrat;
  avancementPrecedent: TerritoireAvancementRapportDetailleContrat["global"];
  responsableLocal: ResponsableLocalRapportDetailleContrat[];
  coordinateurTerritorial: CoordinateurTerritorialRapportDetailleContrat[];
  météo:
    | "NON_RENSEIGNEE"
    | "ORAGE"
    | "NUAGE"
    | "COUVERT"
    | "SOLEIL"
    | "NON_NECESSAIRE";
  aUnePropositionsValeurAvancement: boolean;
  dateTauxAvancementMandatValeurPrecedente: string | null;
}

export type ListeTerritoiresDonnéeRapportDetailleContrat = Record<
  string,
  TerritoireDonnéeRapportDetailleContrat
>;

export type MailleRapportDetailleContrat = Record<
  Maille,
  ListeTerritoiresDonnéeRapportDetailleContrat
>;

export interface MinisterePorteurRapportDetailleContrat {
  nom?: string;
  icône?: string | null;
  périmètresMinistériels: {
    id: string;
  }[];
}

export interface MinistereCoporteurRapportDetailleContrat {
  nom: string;
}

export interface DirecteurAdministrationCentraleRapportDetailleContrat {
  nom: string;
  direction: string;
}

export interface DirecteurProjetRapportDetailleContrat {
  nom: string;
  email: string | null;
}

export interface ResponsableRapportDetailleContrat {
  porteur: MinisterePorteurRapportDetailleContrat | null;
  coporteurs: MinistereCoporteurRapportDetailleContrat[];
  directeursAdminCentrale: DirecteurAdministrationCentraleRapportDetailleContrat[];
  directeursProjet: DirecteurProjetRapportDetailleContrat[];
}

export interface ResponsableLocalRapportDetailleContrat {
  nom: string;
  email: string;
}

export interface CoordinateurTerritorialRapportDetailleContrat {
  nom: string;
  email: string;
}

export interface ChantierRapportDetailleContrat {
  id: string;
  nom: string;
  statut: TypeStatut;
  cibleAttendu: boolean;
  mailles: MailleRapportDetailleContrat;
  périmètreIds: string[];
  estTerritorialisé: boolean;
  estBaromètre: boolean;
  axe: string;
  ppg: string;
  tauxAvancementDonnéeTerritorialisée: Record<MailleInterne, Boolean>;
  météoDonnéeTerritorialisée: Record<MailleInterne, Boolean>;
  responsables: ResponsableRapportDetailleContrat;
  dateDeMàjDonnéesQuantitatives: string | null;
  dateDeMàjDonnéesQualitatives: string | null;
  dateTauxAvancementAnnuel: string | null;
  écart: number | null;
  tendance: "BAISSE" | "HAUSSE" | "STAGNATION" | null;
  météo: Météo;
  avancementGlobal: TerritoireAvancementRapportDetailleContrat["global"];
  avancementPrecedent: TerritoireAvancementRapportDetailleContrat["global"];
  responsableLocalTerritoireSélectionné: ResponsableLocalRapportDetailleContrat[];
  coordinateurTerritorialTerritoireSélectionné: CoordinateurTerritorialRapportDetailleContrat[];
  aUnePropositionsValeurAvancement: boolean;
  maillesApplicables: Maille[];
  dateTauxAvancementMandatValeurPrecedente: string | null;
  aUnTauxAvancementDepartemental: boolean;
}

class ErreurChantierSansMailleNationale extends Error {
  constructor(idChantier: string) {
    super(`Erreur: le chantier '${idChantier}' n'a pas de maille nationale.`);
  }
}

export function créerDonnéesTerritoiresRapportDetailleNew(
  territoires: Territoire[],
  chantierRows: EntreePrismaChantier[],
  listeTerritoireEnfant?: Territoire[],
  chantierRowsMailleEnfant?: EntreePrismaChantier[],
) {
  let donnéesTerritoires: ListeTerritoiresDonnéeRapportDetailleContrat = {};

  territoires.forEach((t) => {
    const chantierRow = chantierRows.find((c) => c.territoire_code === t.code);

    let aUnePropositionDeValeurAvancement =
      chantierRow?.nombre_propositions_valeur_actuelle
        ? chantierRow.nombre_propositions_valeur_actuelle > 0
        : false;
    if (chantierRowsMailleEnfant && listeTerritoireEnfant) {
      const territoiresEnfantCodes = new Set(
        listeTerritoireEnfant
          .filter((territoireEnfant) => territoireEnfant.codeParent === t.code)
          .map((territoireEnfant) => territoireEnfant.code),
      );
      const chantierRowsTerritoiresEnfant = chantierRowsMailleEnfant.filter(
        (chantier) => territoiresEnfantCodes.has(chantier.territoire_code),
      );
      aUnePropositionDeValeurAvancement = aUnePropositionDeValeurAvancement
        ? true
        : chantierRowsTerritoiresEnfant.some(
            (chantier) => chantier.nombre_propositions_valeur_actuelle > 0,
          );
    }

    donnéesTerritoires[t.code] = {
      estApplicable: chantierRow?.est_applicable ?? null,
      écart: chantierRow?.ecart ?? null,
      tendance: chantierRow?.tendance || null,
      dateDeMàjDonnéesQualitatives:
        chantierRow?.derniere_maj_date_qualitative?.toISOString() || null,
      dateDeMàjDonnéesQuantitatives:
        chantierRow?.date_taux_avancement_mandat?.toISOString() ?? null,
      dateTauxAvancementAnnuel:
        chantierRow?.chantier_territoire_jalon
          .at(0)
          ?.date_taux_avancement?.toISOString() ?? null,
      avancement: {
        annuel:
          chantierRow?.chantier_territoire_jalon.at(0)?.taux_avancement ?? null,
        global: chantierRow?.taux_avancement_mandat ?? null,
      },
      avancementPrecedent:
        chantierRow?.taux_avancement_mandat_valeur_precedente ?? null,
      météo: (chantierRow?.meteo as Météo) ?? "NON_RENSEIGNEE",
      responsableLocal: (chantierRow?.responsables_locaux || []).map(
        (value, index) => ({
          nom: value,
          email: chantierRow?.responsables_locaux_mails[index]!,
        }),
      ),
      coordinateurTerritorial: (
        chantierRow?.coordinateurs_territoriaux || []
      ).map((value, index) => ({
        nom: value,
        email: chantierRow?.coordinateurs_territoriaux_mails[index]!,
      })),
      aUnePropositionsValeurAvancement: aUnePropositionDeValeurAvancement,
      dateTauxAvancementMandatValeurPrecedente:
        chantierRow?.date_taux_avancement_mandat_valeur_precedente?.toISOString() ??
        null,
    };
  });

  return donnéesTerritoires;
}

export const presenterEnChantierRapportDetaille = (
  chantierIdentite: PrismaChantier,
  territoires: Territoire[],
  ministères: Ministère[],
  territoireCode: string,
  profil: ProfilCode,
): ChantierRapportDetailleContrat => {
  const mailleChantier = territoireCode.startsWith("NAT")
    ? "nationale"
    : territoireCode.startsWith("REG")
      ? "regionale"
      : "departementale";

  const chantierMailleNationale = chantierIdentite.chantier_territoire.find(
    (c) => c.maille === "NAT",
  );
  const listeChantiersMailleDépartementale =
    chantierIdentite.chantier_territoire.filter((c) => c.maille === "DEPT");
  const listeChantiersMailleRégionale =
    chantierIdentite.chantier_territoire.filter((c) => c.maille === "REG");

  const listeChantiersMailleDepartementaleApplicables =
    listeChantiersMailleDépartementale.filter(
      (chantier) => chantier.est_applicable,
    );

  if (!chantierMailleNationale) {
    throw new ErreurChantierSansMailleNationale(chantierIdentite.id);
  }

  const listeTerritoireDept = territoires.filter((territoire) =>
    territoire.code.startsWith("DEPT"),
  );
  const listeTerritoireReg = territoires.filter((territoire) =>
    territoire.code.startsWith("REG"),
  );

  const newMaille: MailleRapportDetailleContrat = {
    nationale: {
      "NAT-FR":
        profil === ProfilEnum.DROM &&
        !chantierIdentite.perimetre_ids.includes("PER-018")
          ? {
              avancement: { annuel: null, global: null },
              avancementPrecedent: null,
              météo: "NON_RENSEIGNEE",
              écart: null,
              tendance: chantierMailleNationale.tendance,
              dateDeMàjDonnéesQualitatives:
                chantierMailleNationale.derniere_maj_date_qualitative?.toISOString() ??
                null,
              dateDeMàjDonnéesQuantitatives:
                chantierMailleNationale.date_taux_avancement_mandat?.toISOString() ??
                null,
              dateTauxAvancementAnnuel: null,
              estApplicable: chantierMailleNationale.est_applicable,
              responsableLocal: [],
              coordinateurTerritorial: [],
              aUnePropositionsValeurAvancement: [
                ...listeChantiersMailleDépartementale,
                ...listeChantiersMailleRégionale,
              ].some(
                (chantier) => chantier.nombre_propositions_valeur_actuelle > 0,
              ),
              dateTauxAvancementMandatValeurPrecedente:
                chantierMailleNationale?.date_taux_avancement_mandat_valeur_precedente?.toISOString() ??
                null,
            }
          : {
              avancement: {
                annuel: verifyValeurIsNotNullOrUndefined(
                  chantierMailleNationale.chantier_territoire_jalon.at(0)
                    ?.taux_avancement,
                ),
                global: chantierMailleNationale.taux_avancement_mandat,
              },
              avancementPrecedent:
                chantierMailleNationale?.taux_avancement_mandat_valeur_precedente ??
                null,
              météo:
                (chantierMailleNationale?.meteo as Météo) ?? "NON_RENSEIGNEE",
              écart: null,
              tendance: chantierMailleNationale.tendance,
              dateDeMàjDonnéesQualitatives:
                chantierMailleNationale.derniere_maj_date_qualitative?.toISOString() ??
                null,
              dateDeMàjDonnéesQuantitatives:
                chantierMailleNationale.date_taux_avancement_mandat?.toISOString() ??
                null,
              dateTauxAvancementAnnuel:
                chantierMailleNationale.chantier_territoire_jalon
                  .at(0)
                  ?.date_taux_avancement?.toISOString() ?? null,
              estApplicable: chantierMailleNationale.est_applicable,
              coordinateurTerritorial: [],
              responsableLocal: [],
              aUnePropositionsValeurAvancement: [
                ...listeChantiersMailleDépartementale,
                ...listeChantiersMailleRégionale,
              ].some(
                (chantier) => chantier.nombre_propositions_valeur_actuelle > 0,
              ),
              dateTauxAvancementMandatValeurPrecedente:
                chantierMailleNationale?.date_taux_avancement_mandat_valeur_precedente?.toISOString() ??
                null,
            },
    },
    departementale: créerDonnéesTerritoiresRapportDetailleNew(
      listeTerritoireDept,
      listeChantiersMailleDépartementale,
    ),
    regionale: créerDonnéesTerritoiresRapportDetailleNew(
      listeTerritoireReg,
      listeChantiersMailleRégionale,
      listeTerritoireDept,
      listeChantiersMailleDépartementale,
    ),
  };

  const porteur =
    ministères.find(
      (ministere) => ministere.id === chantierIdentite.ministeres[0],
    ) ?? null;

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
    maillesApplicables: chantierIdentite.mailles_applicables.map(
      (maille) => NOMS_MAILLES[maille],
    ),
    responsables: {
      porteur: {
        nom: porteur?.nom,
        icône: porteur?.icône,
        périmètresMinistériels: (porteur?.périmètresMinistériels || []).map(
          ({ id }) => ({ id }),
        ),
      },
      coporteurs: chantierIdentite.ministeres
        .slice(1)
        .map(
          (coporteurId) => ministères.find((m) => m.id === coporteurId) ?? null,
        )
        .filter((coporteur): coporteur is Ministère => coporteur !== null),
      directeursAdminCentrale: (
        chantierIdentite.directeurs_administration_centrale || []
      ).map((value, index) => ({
        nom: value,
        direction: chantierIdentite.directions_administration_centrale[index],
      })),
      directeursProjet: (chantierIdentite.directeurs_projet || []).map(
        (value, index) => ({
          nom: value,
          email: chantierIdentite.directeurs_projet_mails[index],
        }),
      ),
    },
    tauxAvancementDonnéeTerritorialisée: {
      departementale: !!chantierIdentite.possede_taux_avancement_departemental,
      regionale: !!chantierIdentite.possede_taux_avancement_regional,
    },
    météoDonnéeTerritorialisée: {
      departementale: !!chantierIdentite.possede_meteo_departemental,
      regionale: !!chantierIdentite.possede_meteo_regional,
    },
    dateDeMàjDonnéesQuantitatives:
      newMaille[mailleChantier][territoireCode].dateDeMàjDonnéesQuantitatives,
    dateDeMàjDonnéesQualitatives:
      newMaille[mailleChantier][territoireCode].dateDeMàjDonnéesQualitatives,
    dateTauxAvancementAnnuel:
      newMaille[mailleChantier][territoireCode].dateTauxAvancementAnnuel,
    écart: newMaille[mailleChantier][territoireCode].écart,
    tendance: newMaille[mailleChantier][territoireCode].tendance,
    météo: newMaille[mailleChantier][territoireCode].météo,
    avancementGlobal:
      newMaille[mailleChantier][territoireCode].avancement.global,
    avancementPrecedent:
      newMaille[mailleChantier][territoireCode].avancementPrecedent,
    responsableLocalTerritoireSélectionné:
      newMaille[mailleChantier][territoireCode].responsableLocal,
    coordinateurTerritorialTerritoireSélectionné:
      newMaille[mailleChantier][territoireCode].coordinateurTerritorial,
    aUnePropositionsValeurAvancement:
      newMaille[mailleChantier][territoireCode]
        .aUnePropositionsValeurAvancement,
    dateTauxAvancementMandatValeurPrecedente:
      newMaille[mailleChantier][territoireCode]
        .dateTauxAvancementMandatValeurPrecedente,
    aUnTauxAvancementDepartemental:
      listeChantiersMailleDepartementaleApplicables.length === 0 ||
      listeChantiersMailleDepartementaleApplicables.some(
        (chantier) => chantier.taux_avancement_mandat !== null,
      ),
  };
};
