import { FunctionComponent, useMemo, useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import { flushSync } from "react-dom";
import { toast } from "sonner";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";
import { IndicateurDetailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";
import { BoutonCopier } from "@/components/_commons/BoutonCopier/BoutonCopier";
import { Icone } from "@/components/_commons/Icone";
import useIndicateurEvolution from "./useIndicateurEvolution";
import { BaseIndicateurEvolution } from "./BaseIndicateurEvolution";
import { ChartConfig, IndicatorMetadata } from "./types";

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
        territoireCode: detailTerritoireSelectionne.code,
      },
      ...indicateurDetailsParTerritoiresCompares,
    ];
  }, [
    detailIndicateurDuTerritoire,
    detailTerritoireSelectionne,
    indicateurDetailsParTerritoiresCompares,
  ]);

  const aDesValeurs =
    detailIndicateurDuTerritoire.historiquesValeurs.length > 0;

  const {
    getOptions,
    afficherLesCibles,
    setAfficherLesCibles,
    territoiresAAfficher,
    setTerritoiresAAfficher,
    periodeSelectionnee,
    changerLaPeriodeSelectionnee,
    periodesSelectionnablesZoom,
  } = useIndicateurEvolution({
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

      toast.success("Image copiée dans le presse-papiers", {
        duration: 3000,
      });
    });
  };

  const actionButtons = (
    <div className="flex items-end flex-col gap-3">
      <button
        className="flex items-center gap-2 text-dsfr-blue-france-sun-113 font-medium text-sm whitespace-nowrap"
        onClick={enregistrerCommeImage}
        type="button"
      >
        <Icone className="w-4 h-4" icone={Download1Icon} />
        Enregistrer comme image
      </button>
      <BoutonCopier
        className="gap-2 font-medium whitespace-nowrap"
        libelle="Copier dans le presse-papiers"
        onClick={copierDansLePressePapiers}
        texte="Copier dans le presse-papiers"
      />
    </div>
  );

  return (
    <div>
      {modeImpression ? (
        <div className="fixed inset-0 -z-1">
          <div className="fr-container">
            <BaseIndicateurEvolution
              chartConfig={chartConfig}
              aDesValeurs={aDesValeurs}
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
        aDesValeurs={aDesValeurs}
        indicateur={indicatorMetadata}
        mode="default"
      />
    </div>
  );
};
