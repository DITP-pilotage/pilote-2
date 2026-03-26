import { useCallback, useRef } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { libellesMeteos } from "@/server/domain/météo/Météo.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import {
  BaseCartographieWidgetLayout,
  TitreWidget,
} from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import api from "@/server/infrastructure/api/trpc/api";
import { AjouterTerritoirePicker } from "@/components/_commons/Widget/AjouterTerritoirePicker";
import { ComplementsCartographie } from "@/components/_commons/Widget/ComplementsCartographie";
import { WidgetCartographieTitle } from "@/components/_commons/Widget/WidgetCartographieTitle";
import { ExportCartographieButtons } from "@/components/_commons/Widget/ExportCartographieButtons";
import { RepartitionNiveauxDeConfiance } from "./RepartitionNiveauxDeConfiance";
import { useDonneesCartographie } from "./useDonneesCartographie";
import { useLegendeMeteo } from "./useLegendeMeteo";
import { useSelectionTerritoires } from "./useSelectionTerritoires";

export const WidgetCartographieMeteo = ({
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
  const widgetRef = useRef<HTMLDivElement>(null);

  const [territoiresMeteo] =
    api.chantier.recupererMeteosTerritoires.useSuspenseQuery({
      chantierId,
      jalon,
    });

  const donneesCartographie = useDonneesCartographie(territoiresMeteo);
  const legende = useLegendeMeteo(territoiresMeteo);
  const {
    territoiresSelectionnes,
    onSelectTerritoire,
    ajouterTerritoire,
    ajouterTerritoires,
    supprimerTerritoire,
  } = useSelectionTerritoires({
    territoires: territoiresMeteo,
    territoireCode,
  });

  const genererCSV = useCallback(() => {
    const header = "Territoire;Météo;Applicable;Date MAJ";
    const lignes = territoiresMeteo.map((territoire) => {
      const meteoLabel = libellesMeteos[territoire.meteo] ?? territoire.meteo;
      const applicable =
        territoire.estApplicable === null
          ? "Non renseigné"
          : territoire.estApplicable
            ? "Oui"
            : "Non";
      const dateMaj = territoire.dateDeMajQualitative ?? "";
      return `${territoire.territoireCode};${meteoLabel};${applicable};${dateMaj}`;
    });
    return [header, ...lignes].join("\n");
  }, [territoiresMeteo]);

  return (
    <BaseCartographieWidgetLayout
      ref={widgetRef}
      titre={<WidgetCartographieTitle title="Niveaux de confiance" />}
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
            nomFichier="cartographie-niveaux-de-confiance"
            genererCSV={genererCSV}
          />
        </>
      }
    >
      <TitreWidget>Répartition des niveaux de confiance</TitreWidget>
      <RepartitionNiveauxDeConfiance
        territoireCode={territoireCode}
        jalon={jalon}
        onSupprimerTerritoire={supprimerTerritoire}
        territoiresSelectionnes={territoiresSelectionnes}
      />
    </BaseCartographieWidgetLayout>
  );
};
