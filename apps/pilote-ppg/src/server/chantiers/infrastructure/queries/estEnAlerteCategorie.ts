import Alerte from "@/server/domain/alerte/Alerte";
import {
  ChantierTendance,
  ChantierVueDEnsemble,
} from "@/server/domain/chantier/Chantier.interface";
import { CategorieAlerteChantier } from "@/server/chantiers/app/contrats/CategorieAlerteChantier";
import type { ChantierTerritoireSignale } from "./ChantiersSignalesDataFetcher";

export function estEnAlerteCategorie(
  categorie: CategorieAlerteChantier,
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

  switch (categorie) {
    case "ecart":
      return Alerte.estEnAlerteÉcart(ecart);
    case "baisse":
      return Alerte.estEnAlerteBaisse(ct.tendance as ChantierTendance | null);
    case "taux_non_calcule":
      return Alerte.estEnAlerteTauxAvancementNonCalculé(
        tauxAvancement,
        ct.chantier_identite.cible_attendue,
      );
    case "absence_taux_departemental": {
      const aUnTauxAvancementDepartemental =
        !chantiersAvecDept.has(ct.id) || chantiersAvecTaux.has(ct.id);
      return Alerte.estEnAlerteAbscenceTauxAvancementDepartemental(
        aUnTauxAvancementDepartemental,
        ct.chantier_identite.cible_attendue,
      );
    }
    case "meteo_non_renseignee":
      return Alerte.estEnAlerteMétéoNonRenseignée(
        ct.meteo as ChantierVueDEnsemble["météo"],
      );
    case "pva": {
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
