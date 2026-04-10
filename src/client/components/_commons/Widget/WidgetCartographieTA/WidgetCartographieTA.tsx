import { useRouter } from "next/router";
import { useCallback } from "react";
import { getFiltresActifs } from "@/stores/useFiltresStoreNew/useFiltresStoreNew";
import { getQueryParamString } from "@/client/utils/getQueryParamString";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import { BaseCartographieWidgetLayout } from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import { ComplementsCartographie } from "@/components/_commons/Widget/ComplementsCartographie";
import { ValeursRemarquables } from "@/components/_commons/Widget/ValeursRemarquables";
import { WidgetCartographieTitle } from "@/components/_commons/Widget/WidgetCartographieTitle";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";
import { useDonneesCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTAComparaison/useDonneesCartographieTA";
import { useLegendeTA } from "@/components/_commons/Widget/WidgetCartographieTAComparaison/useLegendeTA";
import api from "@/server/infrastructure/api/trpc/api";

type WidgetCartographieTAProps = {
  chantierIds: string[];
  maille: MailleInterne;
  jalon: number;
};

const formatValeurTA = (valeur: number | null | undefined): string | null => {
  if (valeur === null || valeur === undefined) return null;
  return `${Math.round(valeur)}%`;
};

export const WidgetCartographieTA = ({
  chantierIds,
  maille,
  jalon,
}: WidgetCartographieTAProps) => {
  const router = useRouter();

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

  const donneesCartographie = useDonneesCartographieTA(
    territoiresAvancement,
    jalon,
  );
  const legende = useLegendeTA(territoiresAvancement);

  const valeursRemarquables = {
    minimum: formatValeurTA(statistiques?.minimum),
    mediane: formatValeurTA(statistiques?.médiane),
    maximum: formatValeurTA(statistiques?.maximum),
  };

  const naviguerVersTerritoire = useCallback(
    (territoireCode: string) => {
      const filtresActifs = getFiltresActifs();
      const queryParamString = getQueryParamString(
        filtresActifs,
        new Set(["territoireCode"]),
      );
      const href = `/accueil/chantier/${territoireCode}${
        queryParamString.length > 0 ? `?${queryParamString}` : ""
      }`;
      void router.push(href);
    },
    [router],
  );

  return (
    <BaseCartographieWidgetLayout
      titre={
        <WidgetCartographieTitle
          title="Taux d'avancement"
          subtitle={String(jalon)}
        />
      }
      cartographie={
        <CartographieV2
          onTerritoireSelect={naviguerVersTerritoire}
          donnees={donneesCartographie}
          maille={maille}
          territoiresSelectionnes={[]}
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
    />
  );
};
