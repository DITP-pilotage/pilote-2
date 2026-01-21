import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { FunctionComponent, useMemo, useRef, useState } from "react";
import { toBlob, toPng } from "html-to-image";
import { flushSync } from "react-dom";
import Titre from "@/components/_commons/Titre/Titre";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";
import { IndicateurDétailsParTerritoire } from "@/client/components/_commons/IndicateursChantier/Bloc/IndicateurBloc.interface";
import { Download1Icon } from "@/components/_commons/Icones/Download1Icon";
import { ClipboardIcon } from "@/components/_commons/Icones/ClipboardIcon";
import { Icone } from "@/components/_commons/Icone";
import IndicateurÉvolutionStyled from "./IndicateurÉvolution.styled";
import { useIndicateurÉvolution } from "./useIndicateurÉvolution";
import useIndicateurEvolutionNew from "./useIndicateurEvolutionNew";
import LineChart from "./LineChart/LineChart";
import "nprogress/nprogress.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
);

type IndicateurÉvolutionProps = {
  indicateurDétailsParTerritoiresComparés: IndicateurDétailsParTerritoire[];
  dateDeMiseAJourIndicateur: string | null;
  nouveauxGraphiquesSontActifs: boolean;
};

export const IndicateurÉvolution: FunctionComponent<
  IndicateurÉvolutionProps
> = ({
  indicateurDétailsParTerritoiresComparés,
  dateDeMiseAJourIndicateur,
  nouveauxGraphiquesSontActifs,
}) => {
  const { indicateur } = useBlocIndicateurContext();
  const composantRef = useRef<HTMLDivElement>(null);
  const [modeImpression, setModeImpression] = useState(false);

  const {
    detailIndicateurDuTerritoire,
    indicateur: { source },
  } = useBlocIndicateurContext();
  const detailTerritoireSelectionne = useTerritoireSelectionne();

  const tousLesIndicateursDetails = useMemo(() => {
    return [
      {
        données: detailIndicateurDuTerritoire,
        territoireNom: detailTerritoireSelectionne.nom,
        territoireCode: detailTerritoireSelectionne.code,
      },
      ...indicateurDétailsParTerritoiresComparés,
    ];
  }, [
    detailIndicateurDuTerritoire,
    detailTerritoireSelectionne,
    indicateurDétailsParTerritoiresComparés,
  ]);

  const { options, donnéesParTerritoire } = useIndicateurÉvolution();

  const {
    optionsNew,
    afficherLesCibles,
    setAfficherLesCibles,
    territoiresAAfficher,
    setTerritoiresAAfficher,
    periodeSelectionnee,
    changerLaPeriodeSelectionnee,
    periodesSelectionnablesZoom,
  } = useIndicateurEvolutionNew({
    modeImpression,
    tousLesIndicateursDetails,
  });

  const enregistrerCommeImage = async () => {
    if (!composantRef.current) return;

    flushSync(() => {
      setModeImpression(true);
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const dataUrl = await toPng(composantRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const lien = document.createElement("a");
      lien.download = `evolution-indicateur-${new Date().toISOString().split("T")[0]}.png`;
      lien.href = dataUrl;
      lien.click();
    } finally {
      setModeImpression(false);
    }
  };

  const copierDansLePressePapiers = async () => {
    if (!composantRef.current) return;

    flushSync(() => {
      setModeImpression(true);
    });

    try {
      await new Promise((resolve) => setTimeout(resolve, 1_000));

      const blob = await toBlob(composantRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      if (!blob) {
        throw new Error("Impossible de créer l'image");
      }

      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
    } catch (error) {
      console.error("Erreur lors de la copie dans le presse-papiers:", error);
    } finally {
      setModeImpression(false);
    }
  };

  return (
    <div>
      <div className="fixed inset-0 -z-1">
        <div className="fr-container">
          <IndicateurÉvolutionStyled className="!p-10" ref={composantRef}>
            <div className="flex justify-between items-start gap-4 mb-2">
              <div>
                <Titre baliseHtml="h5" className="fr-text--lg fr-mb-0">
                  Évolution de l'indicateur : {indicateur.nom} ({indicateur.id})
                </Titre>

                <p className="fr-text--xs !text-dsfr-mention-grey">
                  {`Mis à jour le : ${dateDeMiseAJourIndicateur} | Source : ${source ?? "Non renseigné"}`}
                </p>
              </div>
            </div>
            {donnéesParTerritoire.datasets.some(
              (dataset) => dataset.data.length > 0,
            ) ? (
              <div className="graphique-bloc">
                <div className="graphique-conteneur">
                  {nouveauxGraphiquesSontActifs ? (
                    <LineChart
                      afficherLesCibles={afficherLesCibles}
                      changerLaPeriodeSelectionnee={
                        changerLaPeriodeSelectionnee
                      }
                      modeImpression
                      option={optionsNew}
                      periodeSelectionnee={periodeSelectionnee}
                      periodesSelectionnablesZoom={periodesSelectionnablesZoom}
                      setAfficherLesCibles={setAfficherLesCibles}
                      setTerritoiresAAfficher={setTerritoiresAAfficher}
                      territoiresAAfficher={territoiresAAfficher}
                      tousLesIndicateursDetails={tousLesIndicateursDetails}
                    />
                  ) : (
                    <Line data={donnéesParTerritoire} options={options} />
                  )}
                </div>
              </div>
            ) : (
              <p className="fr-badge fr-badge--no-icon">NON RENSEIGNÉ</p>
            )}
          </IndicateurÉvolutionStyled>
        </div>
      </div>

      <IndicateurÉvolutionStyled>
        <div className="flex justify-between items-start gap-4 mb-2">
          <div>
            <Titre baliseHtml="h5" className="fr-text--lg fr-mb-0">
              Évolution de l'indicateur : {indicateur.nom} ({indicateur.id})
            </Titre>

            <p className="fr-text--xs !text-dsfr-mention-grey">
              {`Mis à jour le : ${dateDeMiseAJourIndicateur} | Source : ${source ?? "Non renseigné"}`}
            </p>
          </div>
          <div className="flex items-end flex-col gap-3">
            <button
              className="flex items-center gap-2 !text-dsfr-blue-france-sun-113 font-medium text-sm"
              onClick={enregistrerCommeImage}
              type="button"
            >
              <Icone className="w-4 h-4" icone={Download1Icon} />
              Enregistrer comme image
            </button>
            <button
              className="flex items-center gap-2 !text-dsfr-blue-france-sun-113 font-medium text-sm"
              onClick={copierDansLePressePapiers}
              type="button"
            >
              <Icone className="w-4 h-4" icone={ClipboardIcon} />
              Copier dans le presse-papiers
            </button>
          </div>
        </div>
        {donnéesParTerritoire.datasets.some(
          (dataset) => dataset.data.length > 0,
        ) ? (
          <div className="graphique-bloc">
            <div className="graphique-conteneur">
              {nouveauxGraphiquesSontActifs ? (
                <LineChart
                  afficherLesCibles={afficherLesCibles}
                  changerLaPeriodeSelectionnee={changerLaPeriodeSelectionnee}
                  option={optionsNew}
                  periodeSelectionnee={periodeSelectionnee}
                  periodesSelectionnablesZoom={periodesSelectionnablesZoom}
                  setAfficherLesCibles={setAfficherLesCibles}
                  setTerritoiresAAfficher={setTerritoiresAAfficher}
                  territoiresAAfficher={territoiresAAfficher}
                  tousLesIndicateursDetails={tousLesIndicateursDetails}
                />
              ) : (
                <Line data={donnéesParTerritoire} options={options} />
              )}
            </div>
          </div>
        ) : (
          <p className="fr-badge fr-badge--no-icon">NON RENSEIGNÉ</p>
        )}
      </IndicateurÉvolutionStyled>
    </div>
  );
};
