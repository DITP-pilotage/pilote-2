import { FunctionComponent } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import { TuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { RepartitionNiveauxDeConfiance } from "./RepartitionNiveauxDeConfiance";
import { useWidgetCartographieMeteo } from "./useWidgetCartographieMeteo";

type WidgetCartographieMeteoProps = {
  chantierId: string;
  maille: MailleInterne;
  initialTerritoiresCodes: string[];
  territoireCode: string;
  jalon: number;
};

export const WidgetCartographieMeteo: FunctionComponent<
  WidgetCartographieMeteoProps
> = ({ chantierId, maille, initialTerritoiresCodes, jalon }) => {
  const {
    donneesCartographie,
    legende,
    territoiresSelectionnes,
    territoiresDisponibles,
    auClicTerritoire,
    ajouterTerritoire,
    supprimerTerritoire,
    isLoading,
  } = useWidgetCartographieMeteo({
    chantierId,
    initialTerritoiresCodes,
    jalon,
  });

  if (isLoading) {
    return (
      <TuileWidget titre="Carte des valeurs météo 2026">
        <p>Chargement…</p>
      </TuileWidget>
    );
  }

  return (
    <TuileWidget titre="Carte des valeurs météo 2026">
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

      <RepartitionNiveauxDeConfiance
        initialTerritoiresCodes={initialTerritoiresCodes}
        jalon={jalon}
        onAjouterTerritoire={ajouterTerritoire}
        onSupprimerTerritoire={supprimerTerritoire}
        territoiresDisponibles={territoiresDisponibles}
        territoiresSelectionnes={territoiresSelectionnes}
      />
    </TuileWidget>
  );
};
