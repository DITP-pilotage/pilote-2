import Alerte from "@/server/domain/alerte/Alerte";
import { ChantierVueDEnsemble } from "@/server/domain/chantier/Chantier.interface";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import type { ChantierTerritoireSignale } from "@/server/chantiers/infrastructure/queries/ChantiersSignalesDataFetcher";

export function estEnAlerteTypeAlerte(
  typeAlerte: TypeAlerteChantier,
  ctx: {
    ct: ChantierTerritoireSignale;
    maille: string;
    ecart: number | null;
    tauxAvancement: number | null;
    pvaIds: Set<string>;
    chantiersAvecDept: Set<string>;
    chantiersAvecTaux: Set<string>;
  },
): boolean {
  const {
    ct,
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
      return Alerte.estEnAlerteBaisse(ct.tendance);
    case "estEnAlerteTauxAvancementNonCalculé":
      return Alerte.estEnAlerteTauxAvancementNonCalculé(
        tauxAvancement,
        ct.chantier_identite.cible_attendue,
      );
    case "estEnAlerteAbscenceTauxAvancementDepartemental": {
      const aUnTauxAvancementDepartemental =
        !chantiersAvecDept.has(ct.id) || chantiersAvecTaux.has(ct.id);
      return Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(
        aUnTauxAvancementDepartemental,
        ct.chantier_identite.cible_attendue,
      );
    }
    case "estEnAlerteMétéoNonRenseignée":
      return Alerte.estEnAlerteMétéoNonRenseignée(
        (ct.meteo ?? "NON_RENSEIGNEE") as ChantierVueDEnsemble["météo"],
      );
    case "estEnAlertePossedePropositionsValeurAvancement": {
      const aUnePropositionValeurAvancement =
        maille === "DEPT"
          ? ct.nombre_propositions_valeur_actuelle > 0
          : pvaIds.has(ct.id);
      return Alerte.estEnAlertePossedePropositionsValeurAvancement(
        aUnePropositionValeurAvancement,
      );
    }
  }
}
