import { createContext, ReactNode, useContext, useMemo } from "react";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import {
  BaseCartographieWidgetLayout,
  TitreWidget,
} from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import { api } from "@/server/framework/trpc/api";
import { AjouterTerritoirePicker } from "@/components/_commons/Widget/AjouterTerritoirePicker";
import { useSelectionTerritoires } from "@/components/_commons/Widget/WidgetCartographieMeteo/useSelectionTerritoires";
import { ComplementsCartographie } from "@/components/_commons/Widget/ComplementsCartographie";
import { WidgetCartographieTitle } from "@/components/_commons/Widget/WidgetCartographieTitle";
import {
  buildLegend,
  NonAJourMode,
  TerritoireNonAJour,
} from "./nonAJourDisplay";
import { useNonAJourMapData } from "./useNonAJourMapData";
import { TerritoiresNonAJourTable } from "./TerritoiresNonAJourTable";

// --- Context ---

const NonAJourMapContext = createContext<{
  territoires: TerritoireNonAJour[];
  mode: NonAJourMode;
} | null>(null);

const useNonAJourMapContext = () => {
  const ctx = useContext(NonAJourMapContext);
  if (!ctx) {
    throw new Error(
      "useNonAJourMapContext must be used within a WidgetCartographieIndicateursNonAJour provider",
    );
  }
  return ctx;
};

// --- Providers ---

const ChantierProvider = ({
  chantierId,
  children,
}: {
  chantierId: string;
  children: ReactNode;
}) => {
  const [territoires] = api.chantier.getTerritoiresNonAJour.useSuspenseQuery({
    chantierId,
  });

  return (
    <NonAJourMapContext.Provider value={{ territoires, mode: "chantier" }}>
      {children}
    </NonAJourMapContext.Provider>
  );
};

const IndicateurProvider = ({
  indicateurId,
  chantierId,
  children,
}: {
  indicateurId: string;
  chantierId: string;
  children: ReactNode;
}) => {
  const [territoires] = api.indicateur.getTerritoiresNonAJour.useSuspenseQuery({
    indicateurId,
    chantierId,
  });

  return (
    <NonAJourMapContext.Provider value={{ territoires, mode: "indicateur" }}>
      {children}
    </NonAJourMapContext.Provider>
  );
};

// --- Content ---

const NonAJourMapContent = ({
  maille,
  territoireCode,
}: {
  maille: MailleInterne;
  territoireCode: string;
}) => {
  const { territoires, mode } = useNonAJourMapContext();

  const mapData = useNonAJourMapData(territoires, mode);
  const legend = useMemo(
    () => buildLegend(territoires, mode),
    [territoires, mode],
  );
  const {
    territoiresSelectionnes,
    onSelectTerritoire,
    ajouterTerritoire,
    ajouterTerritoires,
    supprimerTerritoire,
  } = useSelectionTerritoires({ territoires, territoireCode });

  const selectedTerritoireCodes = territoiresSelectionnes.map(
    (territoire) => territoire.territoireCode,
  );

  return (
    <BaseCartographieWidgetLayout
      titre={
        <WidgetCartographieTitle
          title={
            mode === "chantier"
              ? "Indicateurs non à jour"
              : "Mise à jour de l'indicateur"
          }
        />
      }
      cartographie={
        <CartographieV2
          onTerritoireSelect={onSelectTerritoire}
          donnees={mapData}
          maille={maille}
          territoiresSelectionnes={selectedTerritoireCodes}
        />
      }
      complementsCartographie={
        <ComplementsCartographie>
          <LegendeCartographie items={legend} />
        </ComplementsCartographie>
      }
      footer={
        <AjouterTerritoirePicker
          territoiresSelectionnesCodes={selectedTerritoireCodes}
          onAjouterTerritoire={ajouterTerritoire}
          onAjouterTerritoires={ajouterTerritoires}
        />
      }
    >
      <TitreWidget>
        {mode === "chantier"
          ? "Nombre d'indicateurs non à jour"
          : "Date de mise à jour par territoire"}
      </TitreWidget>
      <TerritoiresNonAJourTable
        mode={mode}
        territoireCode={territoireCode}
        onSupprimerTerritoire={supprimerTerritoire}
        territoiresSelectionnes={territoiresSelectionnes}
      />
    </BaseCartographieWidgetLayout>
  );
};

// --- Public API ---

type WidgetCartographieIndicateursNonAJourProps = {
  maille: MailleInterne;
  territoireCode: string;
} & (
  | { mode: "chantier"; chantierId: string }
  | { mode: "indicateur"; indicateurId: string; chantierId: string }
);

export const WidgetCartographieIndicateursNonAJour = (
  props: WidgetCartographieIndicateursNonAJourProps,
) => {
  const content = (
    <NonAJourMapContent
      maille={props.maille}
      territoireCode={props.territoireCode}
    />
  );

  if (props.mode === "indicateur") {
    return (
      <IndicateurProvider
        indicateurId={props.indicateurId}
        chantierId={props.chantierId}
      >
        {content}
      </IndicateurProvider>
    );
  }

  return (
    <ChantierProvider chantierId={props.chantierId}>{content}</ChantierProvider>
  );
};
