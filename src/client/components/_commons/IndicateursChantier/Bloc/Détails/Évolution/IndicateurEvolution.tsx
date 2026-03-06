import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { FunctionComponent, useMemo, useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import { flushSync } from "react-dom";
import { Toaster } from "@/client/utils/toaster";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";
import { IndicateurDetailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";
import { Icone } from "@/components/_commons/Icone";
import { useIndicateurEvolution } from "./useIndicateurEvolution";
import useIndicateurEvolutionNew from "./useIndicateurEvolutionNew";
import { BaseIndicateurEvolution } from "./BaseIndicateurEvolution";
import { ChartConfig, IndicatorMetadata } from "./types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

export const IndicateurEvolution: FunctionComponent<{
  indicateurDetailsParTerritoiresCompares: IndicateurDetailsParTerritoire[];
  dateDeMiseAJourIndicateur: string | null;
}> = ({
  indicateurDetailsParTerritoiresCompares,
  dateDeMiseAJourIndicateur,
}) => {
  const { detailIndicateurDuTerritoire, indicateur } =
    useBlocIndicateurContext();
  const composantRef = useRef<HTMLElement>(null);
  const [modeImpression, setModeImpression] = useState(false);
  const detailTerritoireSelectionne = useTerritoireSelectionne();

  const tousLesIndicateursDetails = useMemo(() => {
    return [
      {
        données: detailIndicateurDuTerritoire,
        territoireNom: detailTerritoireSelectionne.nomAffiché,
        territoireCode: detailTerritoireSelectionne.code,
      },
      ...indicateurDetailsParTerritoiresCompares,
    ];
  }, [
    detailIndicateurDuTerritoire,
    detailTerritoireSelectionne,
    indicateurDetailsParTerritoiresCompares,
  ]);

  const { donnéesParTerritoire } = useIndicateurEvolution();

  const {
    getOptions,
    afficherLesCibles,
    setAfficherLesCibles,
    territoiresAAfficher,
    setTerritoiresAAfficher,
    periodeSelectionnee,
    changerLaPeriodeSelectionnee,
    periodesSelectionnablesZoom,
  } = useIndicateurEvolutionNew({
    tousLesIndicateursDetails,
  });

  const chartConfig: ChartConfig = {
    getOptions,
    tousLesIndicateursDetails,
    territoiresAAfficher,
    setTerritoiresAAfficher,
    afficherLesCibles,
    setAfficherLesCibles,
    periodeSelectionnee,
    changerLaPeriodeSelectionnee,
    periodesSelectionnablesZoom,
  };

  const indicatorMetadata: IndicatorMetadata = {
    nom: indicateur.nom,
    id: indicateur.id,
    dateDeMiseAJour: dateDeMiseAJourIndicateur,
    source: indicateur.source,
  };

  const genererImage = async (
    callback: (element: HTMLElement) => void | Promise<void>,
  ) => {
    flushSync(() => {
      setModeImpression(true);
    });

    if (!composantRef.current) return;

    try {
      await new Promise((resolve) => setTimeout(resolve, 100));
      await callback(composantRef.current);
    } finally {
      setModeImpression(false);
    }
  };

  const enregistrerCommeImage = async () => {
    await genererImage(async (element) => {
      const dataUrl = await toPng(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const lien = document.createElement("a");
      lien.download = `evolution-indicateur-${indicateur.id}.png`;
      lien.href = dataUrl;
      lien.click();
    });
  };

  const copierDansLePressePapiers = async () => {
    await genererImage(async (element) => {
      const blob = await toBlob(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });
      if (blob == null) return;

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);

      Toaster.success("Image copiée dans le presse-papiers");
    });
  };

  const actionButtons = (
    <div className="flex items-end flex-col gap-3">
      <button
        className="flex items-center gap-2 !text-dsfr-blue-france-sun-113 font-medium text-sm whitespace-nowrap"
        onClick={enregistrerCommeImage}
        type="button"
      >
        <Icone className="w-4 h-4" icone={Download1Icon} />
        Enregistrer comme image
      </button>
      <button
        className="flex items-center gap-2 !text-dsfr-blue-france-sun-113 font-medium text-sm whitespace-nowrap"
        onClick={copierDansLePressePapiers}
        type="button"
      >
        <Icone className="w-4 h-4" icone={ClipboardIcon} />
        Copier dans le presse-papiers
      </button>
    </div>
  );

  return (
    <div>
      {modeImpression ? (
        <div className="fixed inset-0 -z-1">
          <div className="fr-container">
            <BaseIndicateurEvolution
              chartConfig={chartConfig}
              donnéesParTerritoire={donnéesParTerritoire}
              indicateur={indicatorMetadata}
              mode="impression"
              ref={composantRef}
            />
          </div>
        </div>
      ) : null}

      <BaseIndicateurEvolution
        actions={actionButtons}
        chartConfig={chartConfig}
        donnéesParTerritoire={donnéesParTerritoire}
        indicateur={indicatorMetadata}
        mode="default"
      />
    </div>
  );
};
