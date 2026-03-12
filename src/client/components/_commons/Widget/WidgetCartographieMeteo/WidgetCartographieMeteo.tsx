import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import { useTuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidgetContext";
import { RepartitionNiveauxDeConfiance } from "./RepartitionNiveauxDeConfiance";
import { useWidgetCartographieMeteo } from "./useWidgetCartographieMeteo";

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
  console.log(useTuileWidget());
  const {
    donneesCartographie,
    legende,
    territoiresSelectionnes,
    auClicTerritoire,
    ajouterTerritoire,
    ajouterTerritoires,
    supprimerTerritoire,
    isLoading,
  } = useWidgetCartographieMeteo({
    chantierId,
    territoireCode,
    jalon,
  });

  if (isLoading) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="fr-text font-bold">
          Répartition des niveaux de confiance
        </span>
        <div className="max-w-[400px] mx-auto">
          <CartographieV2
            onTerritoireSelect={auClicTerritoire}
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

      <div className="flex flex-col gap-2">
        <span className="fr-text font-bold">
          Répartition des niveaux de confiance
        </span>
        <RepartitionNiveauxDeConfiance
          territoireCode={territoireCode}
          jalon={jalon}
          onAjouterTerritoire={ajouterTerritoire}
          onAjouterTerritoires={ajouterTerritoires}
          onSupprimerTerritoire={supprimerTerritoire}
          territoiresSelectionnes={territoiresSelectionnes}
        />
      </div>
    </>
  );
};
