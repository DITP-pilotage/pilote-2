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
import { NombrePropositionsValeur } from "./NombrePropositionsValeur";
import { useDonneesCartographiePVA } from "./useDonneesCartographiePVA";
import { useLegendePVA } from "./useLegendePVA";

export const WidgetCartographiePVA = ({
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
  const [territoiresPVA] =
    api.chantier.recupererPVATerritoires.useSuspenseQuery({
      chantierId,
      jalon,
    });

  const donneesCartographie = useDonneesCartographiePVA(territoiresPVA);
  const legende = useLegendePVA(territoiresPVA);
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
      <TitreWidget>Nombres de propositions de valeur d'avancement</TitreWidget>
      <NombrePropositionsValeur
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
