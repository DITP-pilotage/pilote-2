import { TypeStatut } from "@/shared/chantier/Chantier.interface";
import { Meteo } from "@/shared/meteo/Meteo.interface";
import { Ministère } from "@/shared/ministere/Ministere.interface";
import { ProfilCode } from "@/shared/utilisateur/Utilisateur.interface";
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { verifyValeurIsNotNullOrUndefined } from "@/server/utils/VerifyValeurIsNotNullOrUndefined";
import { NOMS_MAILLES } from "@/shared/maille/mailleSQLParser";
import { Maille } from "@/shared/maille/Maille.interface";
import {
  EntreePrismaChantier,
  PrismaChantierPourTerritoire,
} from "@/server/chantiers/domain/PrismaChantier";

interface TerritoireAvancementAccueilContrat {
  global: number | null;
  annuel: number | null;
  jalonParDefaut: number | null;
}

interface TerritoireDonnéeAccueilContrat {
  estApplicable: boolean | null;
  ecart: {
    annuel: number | null;
    jalonParDefaut: number | null;
  };
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
  "nationale" | "regionale" | "departementale";

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
  ecart: number | null;
  ecartJalonParDefaut: number | null;
  tendance: "BAISSE" | "HAUSSE" | "STAGNATION" | null;
  météo: Meteo;
  avancement: number | null;
  avancementJalonParDefaut: number | null;
  aUnePropositionsValeurAvancement: boolean;
  aUnTauxAvancementDepartemental: boolean;
}

const chantierTerritoireVide = (): TerritoireDonnéeAccueilContrat => ({
  estApplicable: null,
  ecart: { annuel: null, jalonParDefaut: null },
  tendance: null,
  dateDeMàjDonnéesQualitatives: null,
  dateDeMàjDonnéesQuantitatives: null,
  avancement: { annuel: null, jalonParDefaut: null, global: null },
  météo: "NON_RENSEIGNEE",
  aUnePropositionsValeurAvancement: false,
});

const presenterTerritoireNational = (
  chantierTerritoire: EntreePrismaChantier,
  chantier: PrismaChantierPourTerritoire,
  profil: ProfilCode,
  jalonSelectionne: number,
  jalonParDefaut: number,
): TerritoireDonnéeAccueilContrat => {
  const aUnePropositionsValeurAvancement =
    chantier.aUnePropositionValeurAvancementDansUnTerritoireEnfant;

  if (
    profil === ProfilEnum.DROM &&
    !chantier.perimetre_ids.includes("PER-018")
  ) {
    return {
      ...chantierTerritoireVide(),
      tendance: chantierTerritoire.tendance,
      estApplicable: chantierTerritoire.est_applicable,
      aUnePropositionsValeurAvancement,
    };
  }

  const jalon = chantierTerritoire.chantier_territoire_jalon.find(
    (chantierJalon) => chantierJalon.jalon === jalonSelectionne,
  );
  return {
    avancement: {
      annuel: verifyValeurIsNotNullOrUndefined(jalon?.taux_avancement),
      jalonParDefaut: verifyValeurIsNotNullOrUndefined(
        chantierTerritoire.chantier_territoire_jalon.find(
          (chantierJalon) => chantierJalon.jalon === jalonParDefaut,
        )?.taux_avancement,
      ),
      global: verifyValeurIsNotNullOrUndefined(
        chantierTerritoire.taux_avancement_mandat,
      ),
    },
    météo: (chantierTerritoire.meteo as Meteo) ?? "NON_RENSEIGNEE",
    ecart: {
      jalonParDefaut: null,
      annuel: null,
    },
    tendance: chantierTerritoire.tendance,
    dateDeMàjDonnéesQualitatives:
      chantierTerritoire.derniere_maj_date_qualitative?.toISOString() ?? null,
    dateDeMàjDonnéesQuantitatives:
      jalon?.date_taux_avancement?.toISOString() ?? null,
    estApplicable: chantierTerritoire.est_applicable,
    aUnePropositionsValeurAvancement,
  };
};

const presenterTerritoireLocal = (
  chantierTerritoire: EntreePrismaChantier,
  chantier: PrismaChantierPourTerritoire,
  jalonSelectionne: number,
  jalonParDefaut: number,
): TerritoireDonnéeAccueilContrat => {
  const jalon = chantierTerritoire.chantier_territoire_jalon.find(
    (chantierJalon) => chantierJalon.jalon === jalonSelectionne,
  );
  const jalonParDefautTrouve =
    chantierTerritoire.chantier_territoire_jalon.find(
      (chantierJalon) => chantierJalon.jalon === jalonParDefaut,
    );
  return {
    estApplicable: chantierTerritoire.est_applicable ?? null,
    ecart: {
      annuel: jalon?.ecart ?? null,
      jalonParDefaut: jalonParDefautTrouve?.ecart ?? null,
    },
    tendance: chantierTerritoire.tendance || null,
    dateDeMàjDonnéesQualitatives:
      chantierTerritoire.derniere_maj_date_qualitative?.toISOString() || null,
    dateDeMàjDonnéesQuantitatives:
      jalon?.date_taux_avancement?.toISOString() ?? null,
    avancement: {
      annuel: verifyValeurIsNotNullOrUndefined(jalon?.taux_avancement),
      jalonParDefaut: verifyValeurIsNotNullOrUndefined(
        jalonParDefautTrouve?.taux_avancement,
      ),
      global: verifyValeurIsNotNullOrUndefined(
        chantierTerritoire.taux_avancement_mandat,
      ),
    },
    météo: (chantierTerritoire.meteo as Meteo) ?? "NON_RENSEIGNEE",
    aUnePropositionsValeurAvancement:
      chantierTerritoire.nombre_propositions_valeur_actuelle > 0 ||
      chantier.aUnePropositionValeurAvancementDansUnTerritoireEnfant,
  };
};

/**
 * `mailles` ne contient que le territoire affiché : c'est le seul que lisent
 * l'accueil (tri, alertes, compteurs) et la liste de chantiers.
 */
export const presenterEnChantierAccueilContratV2 = (
  chantier: PrismaChantierPourTerritoire,
  ministères: Ministère[],
  territoireCode: string,
  profil: ProfilCode,
  jalonSelectionne: number,
  jalonParDefaut: number,
): ChantierAccueilContratV2 => {
  const mailleChantier: MailleChantierContrat = territoireCode.startsWith("NAT")
    ? "nationale"
    : territoireCode.startsWith("REG")
      ? "regionale"
      : "departementale";

  const chantierTerritoire = chantier.chantier_territoire.find(
    (row) => row.territoire_code === territoireCode,
  );
  const territoireAffiche = !chantierTerritoire
    ? chantierTerritoireVide()
    : mailleChantier === "nationale"
      ? presenterTerritoireNational(
          chantierTerritoire,
          chantier,
          profil,
          jalonSelectionne,
          jalonParDefaut,
        )
      : presenterTerritoireLocal(
          chantierTerritoire,
          chantier,
          jalonSelectionne,
          jalonParDefaut,
        );

  const mailles: MailleAccueilContrat = {
    nationale: {},
    regionale: {},
    departementale: {},
  };
  mailles[mailleChantier][territoireCode] = territoireAffiche;

  const porteur =
    ministères.find((ministere) => ministere.id === chantier.ministeres[0]) ??
    null;

  return {
    id: chantier.id,
    nom: chantier.nom,
    statut: chantier.statut,
    cibleAttendu: chantier.cible_attendue,
    mailles,
    périmètreIds: chantier.perimetre_ids,
    estTerritorialisé: !!chantier.est_territorialise,
    estBaromètre: !!chantier.est_barometre,
    axe: chantier.axe,
    ppg: chantier.ppg,
    maillesApplicables: chantier.mailles_applicables.map(
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
      departementale: !!chantier.possede_taux_avancement_departemental,
      regionale: !!chantier.possede_taux_avancement_regional,
    },
    météoDonnéeTerritorialisée: {
      departementale: !!chantier.possede_meteo_departemental,
      regionale: !!chantier.possede_meteo_regional,
    },
    dateDeMàjDonnéesQuantitatives:
      territoireAffiche.dateDeMàjDonnéesQuantitatives,
    dateDeMàjDonnéesQualitatives:
      territoireAffiche.dateDeMàjDonnéesQualitatives,
    ecart: territoireAffiche.ecart.annuel,
    ecartJalonParDefaut: territoireAffiche.ecart.jalonParDefaut,
    tendance: territoireAffiche.tendance,
    météo: territoireAffiche.météo,
    avancement: territoireAffiche.avancement.annuel,
    avancementJalonParDefaut: null,
    aUnePropositionsValeurAvancement:
      territoireAffiche.aUnePropositionsValeurAvancement,
    aUnTauxAvancementDepartemental: chantier.aUnTauxAvancementDepartemental,
  };
};
