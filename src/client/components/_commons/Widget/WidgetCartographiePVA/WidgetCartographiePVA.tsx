import { createContext, ReactNode, useContext } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import {
  BaseCartographieWidgetLayout,
  TitreWidget,
} from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import api from "@/server/infrastructure/api/trpc/api";
import { AjouterTerritoirePicker } from "@/components/_commons/Widget/AjouterTerritoirePicker";
import { useSelectionTerritoires } from "@/components/_commons/Widget/WidgetCartographieMeteo/useSelectionTerritoires";
import { ComplementsCartographie } from "@/components/_commons/Widget/ComplementsCartographie";
import { WidgetCartographieTitle } from "@/components/_commons/Widget/WidgetCartographieTitle";
import { PVATerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierPVACountTerritoiresQuery";
import { NombrePropositionsValeur } from "./NombrePropositionsValeur";
import { useDonneesCartographiePVA } from "./useDonneesCartographiePVA";
import { useLegendePVA } from "./useLegendePVA";

// --- Context ---

type ModePVA = "chantier" | "indicateur";

const WidgetCartographiePVAContext = createContext<{
  territoiresPVA: PVATerritoireViewModel[];
  mode: ModePVA;
} | null>(null);

const useWidgetCartographiePVAContext = () => {
  const ctx = useContext(WidgetCartographiePVAContext);
  if (!ctx) {
    throw new Error(
      "useWidgetCartographiePVAContext must be used within a WidgetCartographiePVA provider",
    );
  }
  return ctx;
};

// --- Providers ---

const ChantierProvider = ({
  chantierId,
  jalon,
  children,
}: {
  chantierId: string;
  jalon: number;
  children: ReactNode;
}) => {
  const [territoiresPVA] =
    api.chantier.recupererPVAChantierTerritoires.useSuspenseQuery({
      chantierId,
      jalon,
    });

  return (
    <WidgetCartographiePVAContext.Provider
      value={{ territoiresPVA, mode: "chantier" }}
    >
      {children}
    </WidgetCartographiePVAContext.Provider>
  );
};

const IndicateurProvider = ({
  indicateurId,
  chantierId,
  jalon,
  children,
}: {
  indicateurId: string;
  chantierId: string;
  jalon: number;
  children: ReactNode;
}) => {
  const [territoiresPVA] =
    api.indicateur.recupererPVATerritoires.useSuspenseQuery({
      indicateurId,
      chantierId,
      jalon,
    });

  return (
    <WidgetCartographiePVAContext.Provider
      value={{ territoiresPVA, mode: "indicateur" }}
    >
      {children}
    </WidgetCartographiePVAContext.Provider>
  );
};

// --- Content ---

const WidgetCartographiePVAContent = ({
  maille,
  territoireCode,
  jalon,
}: {
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
}) => {
  const { territoiresPVA, mode } = useWidgetCartographiePVAContext();

  const donneesCartographie = useDonneesCartographiePVA(territoiresPVA, mode);
  const legende = useLegendePVA(territoiresPVA, mode);
  const {
    territoiresSelectionnes,
    onSelectTerritoire,
    ajouterTerritoire,
    ajouterTerritoires,
    supprimerTerritoire,
  } = useSelectionTerritoires({
    territoires: territoiresPVA,
    territoireCode,
  });

  return (
    <BaseCartographieWidgetLayout
      titre={
        <WidgetCartographieTitle title="Propositions de valeurs d'avancement" />
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
          <LegendeCartographie items={legende} />
        </ComplementsCartographie>
      }
      footer={
        <AjouterTerritoirePicker
          territoiresSelectionnesCodes={territoiresSelectionnes.map(
            (territoire) => territoire.territoireCode,
          )}
          onAjouterTerritoire={ajouterTerritoire}
          onAjouterTerritoires={ajouterTerritoires}
        />
      }
    >
      <TitreWidget>Nombres de propositions de valeur d'avancement</TitreWidget>
      <NombrePropositionsValeur
        territoireCode={territoireCode}
        jalon={jalon}
        onSupprimerTerritoire={supprimerTerritoire}
        territoiresSelectionnes={territoiresSelectionnes}
      />
    </BaseCartographieWidgetLayout>
  );
};

// --- Public API ---

type WidgetCartographiePVAProps = {
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
} & (
  | { mode: "chantier"; chantierId: string }
  | { mode: "indicateur"; indicateurId: string; chantierId: string }
);

export const WidgetCartographiePVA = (props: WidgetCartographiePVAProps) => {
  const content = (
    <WidgetCartographiePVAContent
      maille={props.maille}
      territoireCode={props.territoireCode}
      jalon={props.jalon}
    />
  );

  if (props.mode === "indicateur") {
    return (
      <IndicateurProvider
        indicateurId={props.indicateurId}
        chantierId={props.chantierId}
        jalon={props.jalon}
      >
        {content}
      </IndicateurProvider>
    );
  }

  return (
    <ChantierProvider chantierId={props.chantierId} jalon={props.jalon}>
      {content}
    </ChantierProvider>
  );
};
