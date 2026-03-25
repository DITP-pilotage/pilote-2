import { useState } from "react";
import { PillToggleGroup } from "@/components/shared/PillToggleGroup";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import { EqualizerIcon } from "@/components/_commons/Icones/EqualizerIcon";
import { GridIcon } from "@/components/_commons/Icones/GridIcon";
import { LineChartIcon } from "@/components/_commons/Icones/LineChartIcon";
import { BaseCartographieWidgetLayout } from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import api from "@/server/infrastructure/api/trpc/api";
import { useSelectionTerritoires } from "@/components/_commons/Widget/WidgetCartographieMeteo/useSelectionTerritoires";
import { AjouterTerritoirePicker } from "@/components/_commons/Widget/AjouterTerritoirePicker";
import { ValeursRemarquables } from "@/components/_commons/Widget/ValeursRemarquables";
import { TauxAvancementComparaisonTerritoireViewModel } from "@/server/chantiers/app/contrats/TauxAvancementComparaisonTerritoireViewModel";
import { useDonneesCartographieTA } from "./useDonneesCartographieTA";
import { useLegendeTA } from "./useLegendeTA";
import { SuiviTauxAvancement } from "./SuiviTauxAvancement";

type VueCartographieTA = "situation" | "tableau" | "courbes";

type WidgetCartographieTAProps = {
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
} & (
  | { mode: "chantiers"; chantierIds: string[] }
  | { mode: "indicateur"; indicateurId: string; chantierId: string }
);

type WidgetCartographieTAContentProps = {
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
  territoiresAvancement: TauxAvancementComparaisonTerritoireViewModel[];
  statistiques: {
    minimum: number | null | undefined;
    médiane: number | null | undefined;
    maximum: number | null | undefined;
  } | null;
};

const formatValeurTA = (valeur: number | null | undefined): string | null => {
  if (valeur === null || valeur === undefined) return null;
  return `${Math.round(valeur)}%`;
};

const WidgetCartographieTAContent = ({
  maille,
  territoireCode,
  jalon,
  territoiresAvancement,
  statistiques,
}: WidgetCartographieTAContentProps) => {
  const [vueActive, setVueActive] = useState<VueCartographieTA>("situation");

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

  return (
    <BaseCartographieWidgetLayout
      cartographie={
        <CartographieV2
          onTerritoireSelect={onSelectTerritoire}
          donnees={donneesCartographie}
          maille={maille}
          territoiresSelectionnes={territoiresSelectionnes.map(
            (territoire) => territoire.territoireCode,
          )}
        >
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
        </CartographieV2>
      }
      titre="Suivi et évolution des taux d'avancement"
    >
      <PillToggleGroup.Root
        type="single"
        value={vueActive}
        onValueChange={(value) => {
          if (value) setVueActive(value as VueCartographieTA);
        }}
      >
        <PillToggleGroup.Item value="situation">
          <EqualizerIcon className="w-3 h-3" />
          situation en {jalon}
        </PillToggleGroup.Item>
        <PillToggleGroup.Item value="tableau">
          <GridIcon className="w-3 h-3" />
          évolution temporelle - tableau
        </PillToggleGroup.Item>
        <PillToggleGroup.Item value="courbes">
          <LineChartIcon className="w-3 h-3" />
          évolution temporelle - courbes
        </PillToggleGroup.Item>
      </PillToggleGroup.Root>

      {vueActive === "situation" && (
        <SuiviTauxAvancement
          territoireCode={territoireCode}
          onSupprimerTerritoire={supprimerTerritoire}
          territoiresSelectionnes={territoiresSelectionnes}
        />
      )}
      <AjouterTerritoirePicker
        territoiresSelectionnesCodes={territoiresSelectionnes.map(
          (territoire) => territoire.territoireCode,
        )}
        onAjouterTerritoire={ajouterTerritoire}
        onAjouterTerritoires={ajouterTerritoires}
      />
    </BaseCartographieWidgetLayout>
  );
};

const WidgetCartographieTAChantiers = ({
  chantierIds,
  maille,
  territoireCode,
  jalon,
}: {
  chantierIds: string[];
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
}) => {
  const [territoiresAvancement] =
    api.chantier.recupererAvancementsTerritoires.useSuspenseQuery({
      chantierIds,
      jalon,
    });

  const [statistiques] =
    api.chantier.recupererStatistiquesAvancement.useSuspenseQuery({
      chantierIds,
      maille,
      jalon,
    });

  return (
    <WidgetCartographieTAContent
      maille={maille}
      territoireCode={territoireCode}
      jalon={jalon}
      territoiresAvancement={territoiresAvancement}
      statistiques={statistiques}
    />
  );
};

const WidgetCartographieTAIndicateur = ({
  indicateurId,
  chantierId,
  maille,
  territoireCode,
  jalon,
}: {
  indicateurId: string;
  chantierId: string;
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
}) => {
  const [territoiresAvancement] =
    api.indicateur.recupererTauxAvancementTerritoires.useSuspenseQuery({
      indicateurId,
      chantierId,
      jalon,
    });

  const [statistiques] =
    api.indicateur.recupererStatistiquesTauxAvancement.useSuspenseQuery({
      indicateurId,
      chantierId,
      maille,
      jalon,
    });

  return (
    <WidgetCartographieTAContent
      maille={maille}
      territoireCode={territoireCode}
      jalon={jalon}
      territoiresAvancement={territoiresAvancement}
      statistiques={statistiques}
    />
  );
};

export const WidgetCartographieTA = (props: WidgetCartographieTAProps) => {
  if (props.mode === "indicateur") {
    return (
      <WidgetCartographieTAIndicateur
        indicateurId={props.indicateurId}
        chantierId={props.chantierId}
        maille={props.maille}
        territoireCode={props.territoireCode}
        jalon={props.jalon}
      />
    );
  }

  return (
    <WidgetCartographieTAChantiers
      chantierIds={props.chantierIds}
      maille={props.maille}
      territoireCode={props.territoireCode}
      jalon={props.jalon}
    />
  );
};
