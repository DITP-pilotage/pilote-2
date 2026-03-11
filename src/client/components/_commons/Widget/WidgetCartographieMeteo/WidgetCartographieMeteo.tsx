import { FunctionComponent } from "react";
import { MailleInterne } from "@/server/domain/maille/Maille.interface";
import Cartographie from "@/components/_commons/Cartographie/Cartographie";
import CartographieLégendeListe from "@/components/_commons/Cartographie/Légende/Liste/CartographieLégendeListe";
import { TuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidget";
import { RepartitionNiveauxDeConfiance } from "./RepartitionNiveauxDeConfiance";
import { useWidgetCartographieMeteo } from "./useWidgetCartographieMeteo";

type WidgetCartographieMeteoProps = {
  chantierId: string;
  maille: MailleInterne;
  initialTerritoiresCodes: string[];
  territoireCode: string;
};

export const WidgetCartographieMeteo: FunctionComponent<
  WidgetCartographieMeteoProps
> = ({ chantierId, maille, initialTerritoiresCodes, territoireCode }) => {
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
      <Cartographie
        auClicTerritoireCallback={(codeInsee) => auClicTerritoire(codeInsee)}
        données={donneesCartographie}
        mailleSelectionnee={maille}
        pathname={null}
        territoireCode={territoireCode}
      >
        <CartographieLégendeListe contenu={legende} />
      </Cartographie>

      <RepartitionNiveauxDeConfiance
        onAjouterTerritoire={ajouterTerritoire}
        onSupprimerTerritoire={supprimerTerritoire}
        territoiresDisponibles={territoiresDisponibles}
        territoiresSelectionnes={territoiresSelectionnes}
      />
    </TuileWidget>
  );
};
