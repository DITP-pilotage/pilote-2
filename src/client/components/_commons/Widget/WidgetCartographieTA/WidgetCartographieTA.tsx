import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useRef,
} from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import {
  BaseCartographieWidgetLayout,
  TitreWidget,
} from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import api from "@/server/infrastructure/api/trpc/api";
import { useSelectionTerritoires } from "@/components/_commons/Widget/WidgetCartographieMeteo/useSelectionTerritoires";
import { AjouterTerritoirePicker } from "@/components/_commons/Widget/AjouterTerritoirePicker";
import { ValeursRemarquables } from "@/components/_commons/Widget/ValeursRemarquables";
import { ComplementsCartographie } from "@/components/_commons/Widget/ComplementsCartographie";
import {
  SelecteurVueWidget,
  VueWidget,
} from "@/components/_commons/Widget/SelecteurVueWidget";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";
import { buildJalons } from "@/client/utils/jalons";
import { AvancementsStatistiques } from "@/components/_commons/Avancements/Avancements.interface";
import { WidgetCartographieTitle } from "@/components/_commons/Widget/WidgetCartographieTitle";
import { ExportCartographieButtons } from "@/components/_commons/Widget/ExportCartographieButtons";
import { useDonneesCartographieTA } from "./useDonneesCartographieTA";
import { useLegendeTA } from "./useLegendeTA";
import { SuiviTauxAvancement } from "./SuiviTauxAvancement";
import { TableauEvolutionTA } from "./TableauEvolutionTA";
import { EvolutionCourbesTauxAvancement } from "./EvolutionCourbesTauxAvancement";

const WidgetCartographieTAContext = createContext<{
  territoiresAvancement: TauxAvancementComparaisonTerritoireViewModel[];
  statistiques: AvancementsStatistiques;
} | null>(null);

const useWidgetCartographieTAContext = () => {
  const ctx = useContext(WidgetCartographieTAContext);
  if (!ctx) {
    throw new Error(
      "useWidgetCartographieTAContext must be used within a WidgetCartographieTA provider",
    );
  }
  return ctx;
};

const ChantiersProvider = ({
  chantierIds,
  maille,
  jalon,
  children,
}: {
  chantierIds: string[];
  maille: MailleInterne;
  jalon: number;
  children: ReactNode;
}) => {
  const [[territoiresAvancement, statistiques]] = api.useSuspenseQueries(
    (t) => [
      t.chantier.recupererTauxAvancementTerritoires(
        { chantierIds, jalon },
        { staleTime: WIDGET_STALE_TIME },
      ),
      t.chantier.recupererStatistiquesAvancement(
        { chantierIds, maille, jalon },
        { staleTime: WIDGET_STALE_TIME },
      ),
    ],
  );

  return (
    <WidgetCartographieTAContext.Provider
      value={{ territoiresAvancement, statistiques }}
    >
      {children}
    </WidgetCartographieTAContext.Provider>
  );
};

const IndicateurProvider = ({
  indicateurId,
  chantierId,
  maille,
  jalon,
  children,
}: {
  indicateurId: string;
  chantierId: string;
  maille: MailleInterne;
  jalon: number;
  children: ReactNode;
}) => {
  const [[territoiresAvancement, statistiques]] = api.useSuspenseQueries(
    (t) => [
      t.indicateur.recupererTauxAvancementTerritoires(
        { indicateurId, chantierId, jalon },
        { staleTime: WIDGET_STALE_TIME },
      ),
      t.indicateur.recupererStatistiquesTauxAvancement(
        { indicateurId, chantierId, maille, jalon },
        { staleTime: WIDGET_STALE_TIME },
      ),
    ],
  );

  return (
    <WidgetCartographieTAContext.Provider
      value={{ territoiresAvancement, statistiques }}
    >
      {children}
    </WidgetCartographieTAContext.Provider>
  );
};

// --- Content ---

const formatValeurTA = (valeur: number | null | undefined): string | null => {
  if (valeur === null || valeur === undefined) return null;
  return `${Math.round(valeur)}%`;
};

type WidgetCartographieTAContentProps = {
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
} & (
  | { mode: "chantiers" }
  | { mode: "indicateur"; indicateurId: string; chantierId: string }
);

const WidgetCartographieTAContent = (
  props: WidgetCartographieTAContentProps,
) => {
  const { maille, territoireCode, jalon, mode } = props;
  const widgetRef = useRef<HTMLDivElement>(null);
  const { territoiresAvancement, statistiques } =
    useWidgetCartographieTAContext();

  const valeursRemarquables = {
    minimum: formatValeurTA(statistiques?.minimum),
    mediane: formatValeurTA(statistiques?.médiane),
    maximum: formatValeurTA(statistiques?.maximum),
  };

  const donneesCartographie = useDonneesCartographieTA(
    territoiresAvancement,
    jalon,
  );
  const legende = useLegendeTA(territoiresAvancement);
  const {
    territoiresSelectionnes,
    onSelectTerritoire,
    ajouterTerritoire,
    ajouterTerritoires,
    supprimerTerritoire,
  } = useSelectionTerritoires({
    territoires: territoiresAvancement,
    territoireCode,
  });

  const titreSuivi = "Suivi et évolution des taux d'avancement";

  const utils = api.useUtils();
  const handlePrefetchVue = useCallback(
    (vue: VueWidget) => {
      if (vue === "tableau" && mode === "indicateur") {
        const jalons = buildJalons();
        for (const jalon of jalons) {
          void utils.indicateur.recupererTauxAvancementTerritoires.prefetch(
            {
              indicateurId: props.indicateurId,
              chantierId: props.chantierId,
              jalon,
            },
            { staleTime: WIDGET_STALE_TIME },
          );
        }
      }
    },
    [utils, mode, props],
  );

  const genererCSV = useCallback(() => {
    const header = "Territoire;Taux d'avancement (%);Applicable;Date MAJ";
    const lignes = territoiresAvancement.map((territoire) => {
      const tauxAvancement =
        territoire.tauxAvancementJalon !== null
          ? String(Math.round(territoire.tauxAvancementJalon))
          : "";
      const applicable =
        territoire.estApplicable === null
          ? "Non renseigné"
          : territoire.estApplicable
            ? "Oui"
            : "Non";
      const dateMaj = territoire.dateTauxAvancementAnnuel ?? "";
      return `${territoire.territoireCode};${tauxAvancement};${applicable};${dateMaj}`;
    });
    return [header, ...lignes].join("\n");
  }, [territoiresAvancement]);

  return (
    <BaseCartographieWidgetLayout
      ref={widgetRef}
      titre={
        <WidgetCartographieTitle
          title="Taux d'avancement"
          subtitle={String(jalon)}
        />
      }
      cartographie={
        <CartographieV2
          onTerritoireSelect={onSelectTerritoire}
          donnees={donneesCartographie}
          maille={maille}
          territoiresSelectionnes={territoiresSelectionnes.map(
            (territoire) => territoire.territoireCode,
          )}
        />
      }
      complementsCartographie={
        <ComplementsCartographie>
          <ValeursRemarquables
            valeurs={valeursRemarquables}
            palette={{
              minimum: "#cbcbe8",
              mediane: "#6666bd",
              maximum: "#000091",
            }}
            maille={maille}
          />
          <LegendeCartographie items={legende} />
        </ComplementsCartographie>
      }
      footer={
        <>
          <AjouterTerritoirePicker
            territoiresSelectionnesCodes={territoiresSelectionnes.map(
              (territoire) => territoire.territoireCode,
            )}
            onAjouterTerritoire={ajouterTerritoire}
            onAjouterTerritoires={ajouterTerritoires}
          />
          <ExportCartographieButtons
            widgetRef={widgetRef}
            nomFichier="cartographie-taux-avancement"
            genererCSV={genererCSV}
          />
        </>
      }
    >
      {mode === "indicateur" ? (
        <SelecteurVueWidget
          titre={titreSuivi}
          jalon={jalon}
          onPrefetchVue={handlePrefetchVue}
          renderVue={(vue) => {
            if (vue === "situation") {
              return (
                <SuiviTauxAvancement
                  territoireCode={territoireCode}
                  onSupprimerTerritoire={supprimerTerritoire}
                  territoiresSelectionnes={territoiresSelectionnes}
                />
              );
            }
            if (vue === "tableau") {
              return (
                <TableauEvolutionTA
                  indicateurId={props.indicateurId}
                  chantierId={props.chantierId}
                  territoiresSelectionnes={territoiresSelectionnes}
                  territoireCode={territoireCode}
                  onSupprimerTerritoire={supprimerTerritoire}
                  jalonActif={jalon}
                />
              );
            }
            if (vue === "courbes") {
              return (
                <EvolutionCourbesTauxAvancement
                  indicateurId={props.indicateurId}
                  chantierId={props.chantierId}
                  jalon={jalon}
                  territoiresSelectionnesCodes={territoiresSelectionnes.map(
                    (territoire) => territoire.territoireCode,
                  )}
                />
              );
            }
            return null;
          }}
        />
      ) : (
        <>
          <TitreWidget>{titreSuivi}</TitreWidget>
          <SuiviTauxAvancement
            territoireCode={territoireCode}
            onSupprimerTerritoire={supprimerTerritoire}
            territoiresSelectionnes={territoiresSelectionnes}
          />
        </>
      )}
    </BaseCartographieWidgetLayout>
  );
};

// --- Public API ---

type WidgetCartographieTAProps = {
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
} & (
  | { mode: "chantiers"; chantierIds: string[] }
  | { mode: "indicateur"; indicateurId: string; chantierId: string }
);

export const WidgetCartographieTA = (props: WidgetCartographieTAProps) => {
  if (props.mode === "indicateur") {
    return (
      <IndicateurProvider
        indicateurId={props.indicateurId}
        chantierId={props.chantierId}
        maille={props.maille}
        jalon={props.jalon}
      >
        <WidgetCartographieTAContent
          mode="indicateur"
          indicateurId={props.indicateurId}
          chantierId={props.chantierId}
          maille={props.maille}
          territoireCode={props.territoireCode}
          jalon={props.jalon}
        />
      </IndicateurProvider>
    );
  }

  return (
    <ChantiersProvider
      chantierIds={props.chantierIds}
      maille={props.maille}
      jalon={props.jalon}
    >
      <WidgetCartographieTAContent
        mode="chantiers"
        maille={props.maille}
        territoireCode={props.territoireCode}
        jalon={props.jalon}
      />
    </ChantiersProvider>
  );
};
