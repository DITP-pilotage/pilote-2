import { Session } from "next-auth";
import { configuration } from "@/config";
import { loadRapportDetailleSearchParams } from "@/client/searchParams/accueilSearchParams";
import { getAnneeDateDeBascule } from "@/components/_commons/IndicateursChantier/Bloc/ValeurEtDate/getAnneeDateDeBascule";
import { TRI_CHANTIERS_PAR_DEFAUT } from "@/server/chantiers/app/contrats/TriChantiers";
import {
  FiltreQueryParams,
  SortingParams,
} from "@/server/chantiers/app/contrats/FiltreQueryParams";
import { MailleChantierContrat } from "@/server/chantiers/app/contrats/ChantierAccueilContratV2";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";

export type FiltresAlertesRapportDetaille = {
  estEnAlerteTauxAvancementNonCalculé: boolean;
  estEnAlerteÉcart: boolean;
  estEnAlerteBaisse: boolean;
  estEnAlerteMétéoNonRenseignée: boolean;
  estEnAlerteAbscenceTauxAvancementDepartemental: boolean;
  estEnAlertePossedePropositionsValeurAvancement: boolean;
};

export type ContexteRapportDetaille = {
  session: Session;
  territoireCode: string;
  codeInseeSelectionne: string;
  mailleSelectionnee: MailleInterne;
  mailleChantier: MailleChantierContrat;
  jalon: number;
  jalonParDefaut: number;
  filtres: FiltreQueryParams;
  filtresAlertes: FiltresAlertesRapportDetaille;
  sorting: SortingParams;
  afficherDetail: boolean;
};

export type QueryRapportDetaille = Record<
  string,
  string | string[] | undefined
>;

export function aUnFiltreAlerte(
  filtresAlertes: FiltresAlertesRapportDetaille,
): boolean {
  return Object.values(filtresAlertes).some(Boolean);
}

export function construireContexteRapportDetaille(
  query: QueryRapportDetaille,
  territoireCode: string,
  session: Session,
  maintenant: Date = new Date(),
): ContexteRapportDetaille {
  const searchParams = loadRapportDetailleSearchParams(query);
  const { maille, codeInsee } =
    territoireCodeVersMailleCodeInsee(territoireCode);

  const jalonParDefaut = getAnneeDateDeBascule(
    maintenant,
    configuration().dateBasculeAffichageValeursAnneePrecedente,
  );

  const mailleSelectionnee: MailleInterne =
    maille === "NAT"
      ? searchParams.maille
      : maille === "DEPT"
        ? "departementale"
        : "regionale";

  const [sorting = TRI_CHANTIERS_PAR_DEFAUT] = searchParams.sort;

  return {
    session,
    territoireCode,
    codeInseeSelectionne: codeInsee,
    mailleSelectionnee,
    mailleChantier: maille === "NAT" ? "nationale" : mailleSelectionnee,
    jalon: searchParams.jalon ?? jalonParDefaut,
    jalonParDefaut,
    filtres: {
      perimetres: searchParams.perimetres,
      axes: searchParams.axes,
      statut:
        searchParams.statut === "BROUILLON_ET_PUBLIE"
          ? ["BROUILLON", "PUBLIE"]
          : searchParams.statut
            ? [searchParams.statut]
            : ["PUBLIE"],
      meteos: searchParams.meteos,
      territorialisation: searchParams.territorialisation,
      estBarometre: searchParams.estBarometre,
      valeurDeLaRecherche: searchParams.q,
    },
    filtresAlertes: {
      estEnAlerteTauxAvancementNonCalculé:
        searchParams.estEnAlerteTauxAvancementNonCalculé,
      estEnAlerteÉcart: searchParams.estEnAlerteÉcart,
      estEnAlerteBaisse: searchParams.estEnAlerteBaisse,
      estEnAlerteMétéoNonRenseignée: searchParams.estEnAlerteMétéoNonRenseignée,
      estEnAlerteAbscenceTauxAvancementDepartemental:
        searchParams.estEnAlerteAbscenceTauxAvancementDepartemental,
      estEnAlertePossedePropositionsValeurAvancement:
        searchParams.estEnAlertePossedePropositionsValeurAvancement,
    },
    sorting,
    afficherDetail: query.detail === "true",
  };
}
