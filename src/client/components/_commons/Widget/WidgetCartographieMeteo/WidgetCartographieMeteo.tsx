import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import {
  BaseCartographieWidgetLayout,
  TitreWidget,
} from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import api from "@/server/infrastructure/api/trpc/api";
import { AjouterTerritoirePicker } from "@/components/_commons/Widget/AjouterTerritoirePicker";
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
    >
      <TitreWidget>Répartition des niveaux de confiance</TitreWidget>
      <RepartitionNiveauxDeConfiance
        territoireCode={territoireCode}
        jalon={jalon}
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
    </BaseCartographieWidgetLayout>
  );
};
