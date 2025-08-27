import { TypeStatut } from "@/server/domain/chantier/Chantier.interface";
import { Météo } from "@/server/domain/météo/Météo.interface";
import Ministère from "@/server/domain/ministère/Ministère.interface";
import { ProfilCode } from "@/server/domain/utilisateur/Utilisateur.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import { NOMS_MAILLES } from "@/server/infrastructure/accès_données/maille/mailleSQLParser";
import { Maille } from "@/server/domain/maille/Maille.interface";
import {
  EntreePrismaChantier,
  PrismaChantier,
} from "@/server/chantiers/domain/PrismaChantier";

interface TerritoireAvancementAccueilContrat {
  global: number | null;
  annuel: number | null;
}

interface TerritoireDonnéeAccueilContrat {
  estApplicable: boolean | null;
  écart: number | null;
  tendance: "BAISSE" | "HAUSSE" | "STAGNATION" | null;
  dateDeMàjDonnéesQualitatives: string | null;
  dateDeMàjDonnéesQuantitatives: string | null;
  avancement: TerritoireAvancementAccueilContrat;
  météo:
    | "NON_RENSEIGNEE"
    | "ORAGE"
    | "NUAGE"
    | "COUVERT"
    | "SOLEIL"
    | "NON_NECESSAIRE";
  aUnePropositionsValeurAvancement: boolean;
}

export type ListeTerritoiresDonnéeAccueilContrat = Record<
  string,
  TerritoireDonnéeAccueilContrat
>;

export type MailleChantierContrat =
  | "nationale"
  | "regionale"
  | "departementale";

type MailleAccueilContrat = Record<
  MailleChantierContrat,
  ListeTerritoiresDonnéeAccueilContrat
>;

export interface MinistereAccueilPorteur {
  nom?: string;
  icône?: string | null;
  périmètresMinistériels: {
    id: string;
  }[];
}

export interface ChantierAccueilContratV2 {
  id: string;
  nom: string;
  statut: TypeStatut;
  cibleAttendu: boolean;
  mailles: MailleAccueilContrat;
  périmètreIds: string[];
  estTerritorialisé: boolean;
  estBaromètre: boolean;
  axe: string;
  ppg: string;
  tauxAvancementDonnéeTerritorialisée: Record<
    "regionale" | "departementale",
    Boolean
  >;
  météoDonnéeTerritorialisée: Record<"regionale" | "departementale", Boolean>;
  maillesApplicables: Maille[];
  responsables: {
    porteur: MinistereAccueilPorteur | null;
  };
  dateDeMàjDonnéesQuantitatives: string | null;
  dateDeMàjDonnéesQualitatives: string | null;
  écart: number | null;
  tendance: "BAISSE" | "HAUSSE" | "STAGNATION" | null;
  météo: Météo;
  avancementGlobal: number | null;
  aUnePropositionsValeurAvancement: boolean;
  aUnTauxAvancementDepartemental: boolean;
}

class ErreurChantierSansMailleNationale extends Error {
  constructor(idChantier: string) {
    super(`Erreur: le chantier '${idChantier}' n'a pas de maille nationale.`);
  }
}

export function créerDonnéesTerritoiresV2(
  territoires: Territoire[],
  chantierRows: EntreePrismaChantier[],
  listeTerritoireEnfant?: Territoire[],
  chantierRowsMailleEnfant?: EntreePrismaChantier[],
) {
  let donnéesTerritoires: ListeTerritoiresDonnéeAccueilContrat = {};

  territoires.forEach((t) => {
    const chantierRow = chantierRows.find(
      (chantier) => chantier.territoire_code === t.code,
    );

    let aUnePropositionDeValeurAvancement =
      chantierRow?.nombre_propositions_valeur_actuelle_v2
        ? chantierRow.nombre_propositions_valeur_actuelle_v2 > 0
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
            (chantier) => chantier.nombre_propositions_valeur_actuelle_v2 > 0,
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
      avancement: {
        annuel: verifyValeurIsNotNullOrUndefined(
          chantierRow?.chantier_territoire_jalon.at(0)?.taux_avancement,
        ),
        global: verifyValeurIsNotNullOrUndefined(
          chantierRow?.taux_avancement_mandat,
        ),
      },
      météo: (chantierRow?.meteo as Météo) ?? "NON_RENSEIGNEE",
      aUnePropositionsValeurAvancement: aUnePropositionDeValeurAvancement,
    };
  });

  return donnéesTerritoires;
}

export const presenterEnChantierAccueilContratV2 = (
  chantierIdentite: PrismaChantier,
  territoires: Territoire[],
  ministères: Ministère[],
  territoireCode: string,
  profil: ProfilCode,
): ChantierAccueilContratV2 => {
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

  const newMaille: MailleAccueilContrat = {
    nationale: {
      "NAT-FR":
        profil === ProfilEnum.DROM &&
        !chantierIdentite.perimetre_ids.includes("PER-018")
          ? {
              avancement: { annuel: null, global: null },
              météo: "NON_RENSEIGNEE",
              écart: null,
              tendance: chantierMailleNationale.tendance,
              dateDeMàjDonnéesQualitatives:
                chantierMailleNationale.derniere_maj_date_qualitative?.toISOString() ??
                null,
              dateDeMàjDonnéesQuantitatives:
                chantierMailleNationale.date_taux_avancement_mandat?.toISOString() ??
                null,
              estApplicable: chantierMailleNationale.est_applicable,
              aUnePropositionsValeurAvancement: [
                ...listeChantiersMailleDépartementale,
                ...listeChantiersMailleRégionale,
              ].some(
                (chantier) =>
                  chantier.nombre_propositions_valeur_actuelle_v2 > 0,
              ),
            }
          : {
              avancement: {
                annuel: verifyValeurIsNotNullOrUndefined(
                  chantierMailleNationale.chantier_territoire_jalon.at(0)
                    ?.taux_avancement,
                ),
                global: verifyValeurIsNotNullOrUndefined(
                  chantierMailleNationale.taux_avancement_mandat,
                ),
              },
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
              estApplicable: chantierMailleNationale.est_applicable,
              aUnePropositionsValeurAvancement: [
                ...listeChantiersMailleDépartementale,
                ...listeChantiersMailleRégionale,
              ].some(
                (chantier) =>
                  chantier.nombre_propositions_valeur_actuelle_v2 > 0,
              ),
            },
    },
    departementale: créerDonnéesTerritoiresV2(
      listeTerritoireDept,
      listeChantiersMailleDépartementale,
    ),
    regionale: créerDonnéesTerritoiresV2(
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
    écart: newMaille[mailleChantier][territoireCode].écart,
    tendance: newMaille[mailleChantier][territoireCode].tendance,
    météo: newMaille[mailleChantier][territoireCode].météo,
    avancementGlobal:
      newMaille[mailleChantier][territoireCode].avancement.global,
    aUnePropositionsValeurAvancement:
      newMaille[mailleChantier][territoireCode]
        .aUnePropositionsValeurAvancement,
    aUnTauxAvancementDepartemental:
      listeChantiersMailleDepartementaleApplicables.length === 0 ||
      listeChantiersMailleDepartementaleApplicables.some(
        (chantier) => chantier.taux_avancement_mandat !== null,
      ),
  };
};
