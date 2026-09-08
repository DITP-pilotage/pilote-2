import Alerte from "@/server/domain/alerte/Alerte";
import { ChantierVueDEnsemble } from "@/server/domain/chantier/Chantier.interface";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import type { ChantierTerritoireSignale } from "@/server/chantiers/infrastructure/queries/ChantiersSignalesDataFetcher";

export function estEnAlerteTypeAlerte(
  typeAlerte: TypeAlerteChantier,
  ctx: {
    chantierTerritoire: ChantierTerritoireSignale;
    maille: string;
    ecart: number | null;
    tauxAvancement: number | null;
    pvaIds: Set<string>;
    chantiersAvecDept: Set<string>;
    chantiersAvecTaux: Set<string>;
  },
): boolean {
  const {
    chantierTerritoire,
    maille,
    ecart,
    tauxAvancement,
    pvaIds,
    chantiersAvecDept,
    chantiersAvecTaux,
  } = ctx;

  switch (typeAlerte) {
    case "estEnAlerteÉcart":
      return Alerte.estEnAlerteÉcart(ecart);
    case "estEnAlerteBaisse":
      return Alerte.estEnAlerteBaisse(chantierTerritoire.tendance);
    case "estEnAlerteTauxAvancementNonCalculé":
      return Alerte.estEnAlerteTauxAvancementNonCalculé(
        tauxAvancement,
        chantierTerritoire.chantier_identite.cible_attendue,
      );
    case "estEnAlerteAbscenceTauxAvancementDepartemental": {
      const aUnTauxAvancementDepartemental =
        !chantiersAvecDept.has(chantierTerritoire.id) ||
        chantiersAvecTaux.has(chantierTerritoire.id);
      return Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(
        aUnTauxAvancementDepartemental,
        chantierTerritoire.chantier_identite.cible_attendue,
      );
    }
    case "estEnAlerteMétéoNonRenseignée":
      return Alerte.estEnAlerteMétéoNonRenseignée(
        (chantierTerritoire.meteo ??
          "NON_RENSEIGNEE") as ChantierVueDEnsemble["météo"],
      );
    case "estEnAlertePossedePropositionsValeurAvancement": {
      const aUnePropositionValeurAvancement =
        maille === "DEPT"
          ? chantierTerritoire.nombre_propositions_valeur_actuelle > 0
          : pvaIds.has(chantierTerritoire.id);
      return Alerte.estEnAlertePossedePropositionsValeurAvancement(
        aUnePropositionValeurAvancement,
      );
    }
  }
}
