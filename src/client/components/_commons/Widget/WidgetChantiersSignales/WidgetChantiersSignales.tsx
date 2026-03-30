import { Suspense, useCallback } from "react";
import { parseAsBoolean, parseAsInteger, useQueryState } from "nuqs";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { ChantiersSignalesContrat } from "@/server/chantiers/app/contrats/ChantiersSignalesContrat";
import { sauvegarderFiltres } from "@/client/stores/useFiltresStoreNew/useFiltresStoreNew";
import { clsxm } from "@/utils/clsxm";
import api from "@/server/infrastructure/api/trpc/api";
import Bloc from "@/components/_commons/Bloc/Bloc";
import Titre from "@/components/_commons/Titre/Titre";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import BadgeIcône from "@/components/_commons/BadgeIcône/BadgeIcône";

type AlerteDefinition = {
  nomCritère: TypeAlerteChantier;
  libellé: string;
};

const alertesNationales: AlerteDefinition[] = [
  {
    nomCritère: "estEnAlerteTauxAvancementNonCalculé",
    libellé:
      "Taux d'avancement non calculé(s) en raison d'indicateurs non renseignés",
  },
  {
    nomCritère: "estEnAlerteAbscenceTauxAvancementDepartemental",
    libellé: "Chantier(s) sans taux d'avancement au niveau départemental",
  },
  {
    nomCritère: "estEnAlerteMétéoNonRenseignée",
    libellé: "Chantier(s) avec météo et synthèse des résultats non renseignés",
  },
  {
    nomCritère: "estEnAlertePossedePropositionsValeurAvancement",
    libellé: "Chantier(s) avec proposition(s) de valeur d'avancement",
  },
];

const alertesTerritoriales = (mailleChantier: string): AlerteDefinition[] => [
  {
    nomCritère: "estEnAlerteÉcart",
    libellé: `Chantier(s) avec un retard de 10 points par rapport à leur médiane ${mailleChantier}`,
  },
  {
    nomCritère: "estEnAlerteBaisse",
    libellé: "Chantier(s) avec tendance en baisse",
  },
  {
    nomCritère: "estEnAlerteMétéoNonRenseignée",
    libellé: "Chantier(s) avec météo et synthèse des résultats non renseignés",
  },
  {
    nomCritère: "estEnAlertePossedePropositionsValeurAvancement",
    libellé: "Chantier(s) avec proposition(s) de valeur d'avancement",
  },
];

export const WidgetChantiersSignales = ({
  chantierIds,
  territoireCode,
  jalonParDefaut,
}: {
  chantierIds: string[];
  territoireCode: string;
  jalonParDefaut: number;
}) => {
  return (
    <section className="h-full">
      <Bloc
        className="h-full"
        contenuClassesSupplémentaires="fr-py-2w fr-px-3w"
      >
        <TitreInfobulleConteneur className="justify-between fr-mb-2w">
          <div className="flex items-center gap-2">
            <BadgeIcône type="warning" />
            <Titre
              baliseHtml="h2"
              className="fr-text--lg fr-mb-0 fr-py-1v !text-dsfr-warning-425"
              estInline
            >
              Chantiers signalés
            </Titre>
          </div>
          <Infobulle classNameBouton="!text-dsfr-warning-425">
            {INFOBULLE_CONTENUS.chantiers.alertes}
          </Infobulle>
        </TitreInfobulleConteneur>
        <Suspense>
          <ChantiersSignalesContenu
            chantierIds={chantierIds}
            territoireCode={territoireCode}
            jalonParDefaut={jalonParDefaut}
          />
        </Suspense>
      </Bloc>
    </section>
  );
};

const ChantiersSignalesContenu = ({
  chantierIds,
  territoireCode,
  jalonParDefaut,
}: {
  chantierIds: string[];
  territoireCode: string;
  jalonParDefaut: number;
}) => {
  const [compteurs] = api.chantier.recupererChantiersSignales.useSuspenseQuery({
    chantierIds,
    territoireCode,
    jalonParDefaut,
  });

  return (
    <TuilesAlertes compteurs={compteurs} territoireCode={territoireCode} />
  );
};

const TuilesAlertes = ({
  compteurs,
  territoireCode,
}: {
  compteurs: ChantiersSignalesContrat;
  territoireCode: string;
}) => {
  const { maille } = territoireCodeVersMailleCodeInsee(territoireCode);

  const mailleChantier =
    maille === "NAT"
      ? "nationale"
      : maille === "REG"
        ? "regionale"
        : "departementale";

  const alertes =
    mailleChantier === "nationale"
      ? alertesNationales
      : alertesTerritoriales(mailleChantier);

  return (
    <ul className="list-none p-0 m-0 flex flex-col gap-3 max-w-[360px] sm:grid sm:grid-cols-2 sm:max-w-none">
      {alertes.map((alerte) => (
        <li key={alerte.nomCritère}>
          <TuileAlerte
            nomCritère={alerte.nomCritère}
            libellé={alerte.libellé}
            nombre={compteurs[alerte.nomCritère]}
          />
        </li>
      ))}
    </ul>
  );
};

const TuileAlerte = ({
  nomCritère,
  libellé,
  nombre,
}: {
  nomCritère: TypeAlerteChantier;
  libellé: string;
  nombre: number;
}) => {
  const [filtreAlerte, setFiltreAlerte] = useQueryState(
    nomCritère,
    parseAsBoolean.withDefault(false).withOptions({
      shallow: false,
      clearOnDefault: true,
      history: "push",
    }),
  );

  const [, setPagination] = useQueryState(
    "pageIndex",
    parseAsInteger.withDefault(1).withOptions({
      shallow: false,
    }),
  );

  const onClick = useCallback(() => {
    setPagination(1);
    sauvegarderFiltres({ [nomCritère]: !filtreAlerte });
    setFiltreAlerte(!filtreAlerte);
  }, [nomCritère, filtreAlerte, setFiltreAlerte, setPagination]);

  return (
    <button
      className={clsxm(
        "w-full h-full border border-dsfr-warning-925 rounded-lg bg-white shadow-lg cursor-pointer transition-colors hover:bg-dsfr-warning-950 flex items-center gap-3 py-4 px-5 sm:flex-col sm:items-start sm:gap-1",
        {
          "border-dsfr-warning-425 bg-dsfr-warning-950": filtreAlerte,
        },
      )}
      onClick={onClick}
      title={libellé}
      type="button"
      aria-pressed={filtreAlerte}
    >
      <span className="text-[1.75rem] font-bold text-dsfr-warning-425 min-w-[2.5rem] text-center">
        {nombre}
      </span>
      <span className="text-sm text-dsfr-grey-200 leading-tight">
        {libellé}
      </span>
    </button>
  );
};
