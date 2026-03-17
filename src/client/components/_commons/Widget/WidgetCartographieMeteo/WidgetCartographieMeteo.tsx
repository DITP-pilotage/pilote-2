import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import api from "@/server/infrastructure/api/trpc/api";
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
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 shrink-0">
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

      <div className="flex flex-col gap-2 shrink-0">
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
    </div>
  );
};
