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

export type AlerteFilters = {
  estEnAlerteTauxAvancementNonCalculé: boolean;
  estEnAlerteÉcart: boolean;
  estEnAlerteBaisse: boolean;
  estEnAlerteMétéoNonRenseignée: boolean;
  estEnAlerteAbscenceTauxAvancementDepartemental: boolean;
  estEnAlertePossedePropositionsValeurAvancement: boolean;
};

export type RapportDetailleContext = {
  session: Session;
  territoireCode: string;
  selectedCodeInsee: string;
  selectedMaille: MailleInterne;
  chantierMaille: MailleChantierContrat;
  jalon: number;
  defaultJalon: number;
  filters: FiltreQueryParams;
  alerteFilters: AlerteFilters;
  sorting: SortingParams;
  showDetail: boolean;
  territorialiseFilter: boolean;
};

export type RapportDetailleQuery = Record<
  string,
  string | string[] | undefined
>;

export function hasAlerteFilter(alerteFilters: AlerteFilters): boolean {
  return Object.values(alerteFilters).some(Boolean);
}

export function buildRapportDetailleContext(
  query: RapportDetailleQuery,
  territoireCode: string,
  session: Session,
  now: Date = new Date(),
): RapportDetailleContext {
  const searchParams = loadRapportDetailleSearchParams(query);
  const { maille, codeInsee } =
    territoireCodeVersMailleCodeInsee(territoireCode);

  const defaultJalon = getAnneeDateDeBascule(
    now,
    configuration().dateBasculeAffichageValeursAnneePrecedente,
  );

  const selectedMaille: MailleInterne =
    maille === "NAT"
      ? searchParams.maille
      : maille === "DEPT"
        ? "departementale"
        : "regionale";

  const [sorting = TRI_CHANTIERS_PAR_DEFAUT] = searchParams.sort;

  return {
    session,
    territoireCode,
    selectedCodeInsee: codeInsee,
    selectedMaille,
    chantierMaille: maille === "NAT" ? "nationale" : selectedMaille,
    jalon: searchParams.jalon ?? defaultJalon,
    defaultJalon,
    filters: {
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
    alerteFilters: {
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
    showDetail: query.detail === "true",
    territorialiseFilter: query.estTerritorialise === "true",
  };
}
