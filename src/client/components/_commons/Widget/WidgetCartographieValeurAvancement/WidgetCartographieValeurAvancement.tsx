import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import { BaseCartographieWidgetLayout } from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import api from "@/server/infrastructure/api/trpc/api";
import { useSelectionTerritoires } from "@/components/_commons/Widget/WidgetCartographieMeteo/useSelectionTerritoires";
import { AjouterTerritoirePicker } from "@/components/_commons/Widget/AjouterTerritoirePicker";
import { useDonneesCartographieVA } from "./useDonneesCartographieVA";
import { useLegendeVA } from "./useLegendeVA";
import { LegendeDegradeVA } from "./LegendeDegradeVA";
import { SuiviValeurAvancement } from "./SuiviValeurAvancement";
import { ValeursRemarquables } from "./ValeursRemarquables";

export const WidgetCartographieValeurAvancement = ({
  indicateurId,
  chantierId,
  maille,
  territoireCode,
  jalon,
  unite,
}: {
  indicateurId: string;
  chantierId: string;
  maille: MailleInterne;
  territoireCode: string;
  jalon: number;
  unite: string | null;
}) => {
  const [territoiresValeurAvancement] =
    api.indicateur.recupererValeursAvancementTerritoires.useSuspenseQuery({
      indicateurId,
      chantierId,
      jalon,
    });

  const donneesCartographie = useDonneesCartographieVA(
    territoiresValeurAvancement,
    jalon,
    unite,
  );
  const legende = useLegendeVA(territoiresValeurAvancement, unite);
  const {
    territoiresSelectionnes,
    onSelectTerritoire,
    ajouterTerritoire,
    ajouterTerritoires,
    supprimerTerritoire,
  } = useSelectionTerritoires({
    territoires: territoiresValeurAvancement,
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
            territoires={territoiresValeurAvancement}
            maille={maille}
            unite={unite}
          />
          <LegendeDegradeVA
            libelle={legende.degrade.libellé}
            valeurMin={legende.degrade.valeurMin}
            valeurMax={legende.degrade.valeurMax}
            couleurMin={legende.degrade.couleurMin}
            couleurMax={legende.degrade.couleurMax}
          />
          <LegendeCartographie items={legende.items} />
        </CartographieV2>
      }
      titre="Valeurs d'avancement par territoire"
    >
      <SuiviValeurAvancement
        territoireCode={territoireCode}
        onSupprimerTerritoire={supprimerTerritoire}
        territoiresSelectionnes={territoiresSelectionnes}
        jalon={jalon}
        unite={unite}
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
