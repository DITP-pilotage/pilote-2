import { useState } from "react";
import { ToggleGroup } from "radix-ui";
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
import { useDonneesCartographieTA } from "./useDonneesCartographieTA";
import { useLegendeTA } from "./useLegendeTA";
import { SuiviTauxAvancement } from "./SuiviTauxAvancement";

type VueCartographieTA = "situation" | "tableau" | "courbes";

export const WidgetCartographieTA = ({
  chantierId,
  maille,
  territoireCode,
  jalon,
}: {
  chantierId: string;
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
}) => {
  const [vueActive, setVueActive] = useState<VueCartographieTA>("situation");

  const [territoiresAvancement] =
    api.chantier.recupererAvancementsTerritoires.useSuspenseQuery({
      chantierId,
      jalon,
    });

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
          <LegendeCartographie items={legende} />
        </CartographieV2>
      }
      titre="Suivi et évolution des taux d'avancement"
    >
      <ToggleGroup.Root
        type="single"
        value={vueActive}
        onValueChange={(value) => {
          if (value) setVueActive(value as VueCartographieTA);
        }}
        className="flex flex-wrap justify-center gap-2"
      >
        <ToggleGroup.Item
          value="situation"
          className="leading-none rounded-full px-2 py-1.5 text-[10px] font-medium flex items-center gap-1.5 data-[state=on]:bg-dsfr-blue-france-925 data-[state=off]:bg-dsfr-alt-blue-france text-dsfr-blue-france-sun-113"
        >
          <EqualizerIcon className="w-3 h-3" />
          situation en {jalon}
        </ToggleGroup.Item>
        <ToggleGroup.Item
          value="tableau"
          className="leading-none rounded-full px-2 py-1.5 text-[10px] font-medium flex items-center gap-1.5 data-[state=on]:bg-dsfr-blue-france-925 data-[state=off]:bg-dsfr-alt-blue-france text-dsfr-blue-france-sun-113"
        >
          <GridIcon className="w-3 h-3" />
          {"\u00e9volution temporelle \u2013 tableau"}
        </ToggleGroup.Item>
        <ToggleGroup.Item
          value="courbes"
          className="leading-none rounded-full px-2 py-1.5 text-[10px] font-medium flex items-center gap-1.5 data-[state=on]:bg-dsfr-blue-france-925 data-[state=off]:bg-dsfr-alt-blue-france text-dsfr-blue-france-sun-113"
        >
          <LineChartIcon className="w-3 h-3" />
          {"\u00e9volution temporelle \u2013 courbes"}
        </ToggleGroup.Item>
      </ToggleGroup.Root>

      {vueActive === "situation" && (
        <>
          <SuiviTauxAvancement
            territoireCode={territoireCode}
            onSupprimerTerritoire={supprimerTerritoire}
            territoiresSelectionnes={territoiresSelectionnes}
          />

          <AjouterTerritoirePicker
            territoiresSelectionnesCodes={territoiresSelectionnes.map(
              (territoire) => territoire.territoireCode,
            )}
            onAjouterTerritoire={ajouterTerritoire}
            onAjouterTerritoires={ajouterTerritoires}
          />
        </>
      )}
    </BaseCartographieWidgetLayout>
  );
};
