import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import { useTuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidgetContext";
import { clsxm } from "@/utils/clsxm";
import api from "@/server/infrastructure/api/trpc/api";
import { useSelectionTerritoires } from "@/components/_commons/Widget/WidgetCartographieMeteo/useSelectionTerritoires";
import { useDonneesCartographieTA } from "./useDonneesCartographieTA";
import { useLegendeTA } from "./useLegendeTA";

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
  const { territoiresSelectionnes, onSelectTerritoire } =
    useSelectionTerritoires({
      territoires: territoiresAvancement,
      territoireCode,
    });

  // TODO(layout): disposition P / G
  const { isTailleTuileXL, isModeDispositionG } = useTuileWidget();

  return (
    <div
      className={clsxm("flex flex-col gap-4", {
        "flex-row": isModeDispositionG() && isTailleTuileXL(),
      })}
    >
      <div className="flex flex-col gap-2">
        <span className="fr-text font-bold">
          Répartition des taux d'avancement
        </span>
        <div className="max-w-[400px] mx-auto">
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
        </div>
      </div>
    </div>
  );
};
