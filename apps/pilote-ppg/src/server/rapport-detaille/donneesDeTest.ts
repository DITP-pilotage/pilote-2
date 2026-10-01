import { ChantierRapportDetailleContrat } from "@/server/chantiers/app/contrats/ChantierRapportDetailleContratV2";
import { Territoire } from "@/server/domain/territoire/Territoire.interface";

type DonnéeTerritoire =
  ChantierRapportDetailleContrat["mailles"]["nationale"][string];

export function donnéeTerritoireDeTest(
  surcharges: Partial<DonnéeTerritoire> = {},
): DonnéeTerritoire {
  return {
    estApplicable: true,
    ecart: { annuel: null, jalonParDefaut: null },
    tendance: null,
    dateDeMàjDonnéesQualitatives: null,
    dateDeMàjDonnéesQuantitatives: null,
    dateTauxAvancementAnnuel: null,
    avancement: { global: null, annuel: null, jalonParDefaut: null },
    avancementPrecedent: null,
    responsableLocal: [],
    coordinateurTerritorial: [],
    météo: "NON_RENSEIGNEE",
    aUnePropositionsValeurAvancement: false,
    dateTauxAvancementMandatValeurPrecedente: null,
    ...surcharges,
  };
}

export function chantierDeTest(
  surcharges: Partial<ChantierRapportDetailleContrat> = {},
): ChantierRapportDetailleContrat {
  return {
    id: "CH-001",
    nom: "Chantier de test",
    statut: "PUBLIE",
    cibleAttendu: false,
    mailles: {
      nationale: { "NAT-FR": donnéeTerritoireDeTest() },
      regionale: {},
      departementale: {},
    },
    périmètreIds: [],
    estTerritorialisé: false,
    estBaromètre: false,
    axe: "",
    ppg: "",
    tauxAvancementDonnéeTerritorialisée: {
      regionale: false,
      departementale: false,
    },
    météoDonnéeTerritorialisée: { regionale: false, departementale: false },
    responsables: {
      porteur: null,
      coporteurs: [],
      directeursAdminCentrale: [],
      directeursProjet: [],
    },
    dateDeMàjDonnéesQuantitatives: null,
    dateDeMàjDonnéesQualitatives: null,
    dateTauxAvancementAnnuel: null,
    ecart: null,
    ecartJalonParDefaut: null,
    tendance: null,
    météo: "NON_RENSEIGNEE",
    avancement: null,
    avancementJalonParDefaut: null,
    avancementPrecedent: null,
    responsableLocalTerritoireSélectionné: [],
    coordinateurTerritorialTerritoireSélectionné: [],
    aUnePropositionsValeurAvancement: false,
    maillesApplicables: ["nationale"],
    dateTauxAvancementMandatValeurPrecedente: null,
    aUnTauxAvancementDepartemental: false,
    ...surcharges,
  };
}

export const TERRITOIRE_NATIONAL: Territoire = {
  code: "NAT-FR",
  nom: "France",
  nomAffiché: "France",
  codeInsee: "FR",
  codeParent: null,
  maille: "nationale",
};

export const TERRITOIRE_PARIS: Territoire = {
  code: "DEPT-75",
  nom: "Paris",
  nomAffiché: "Paris (75)",
  codeInsee: "75",
  codeParent: "REG-11",
  maille: "departementale",
};
