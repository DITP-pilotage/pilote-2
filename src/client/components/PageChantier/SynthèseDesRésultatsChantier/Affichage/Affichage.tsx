import { useState } from "react";
import { BoutonsAffichage } from "@/components/_commons/BoutonsAffichage/BoutonsAffichage";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { SyntheseDesResultatsHistoriqueItem } from "@/server/syntheses-des-resultats/queries/RecupererHistoriqueSyntheseDesResultatsQuery";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { extractVisibleText } from "@/client/utils/html/extractVisibleText";
import { truncateHtml } from "@/client/utils/html/truncateHtml";

const LIMITE_CARACTERES_AFFICHAGE_SYNTHESE_DES_RESULTATS = 250;

const SynthèseDesRésultatsAffichage = ({
  itemHistoriqueSyntheseDesResultats: synthèseDesRésultats,
  onModifier,
}: {
  itemHistoriqueSyntheseDesResultats: SyntheseDesResultatsHistoriqueItem | null;
  onModifier?: () => void;
}) => {
  const [afficherContenuComplet, setAfficherContenuComplet] = useState(false);

  if (!synthèseDesRésultats) {
    return (
      <p className="fr-text--sm !text-dsfr-mention-grey">
        Aucune synthèse des résultats.
      </p>
    );
  }

  const source = synthèseDesRésultats.contenu;
  const contenuTronque =
    extractVisibleText(source).length >
    LIMITE_CARACTERES_AFFICHAGE_SYNTHESE_DES_RESULTATS;
  const contenuAAfficher =
    afficherContenuComplet || !contenuTronque
      ? source
      : truncateHtml(
          source,
          LIMITE_CARACTERES_AFFICHAGE_SYNTHESE_DES_RESULTATS,
        );

  return (
    <>
      <p className="text-xs text-dsfr-mention-grey mb-1">
        {synthèseDesRésultats.dateCreation ===
        synthèseDesRésultats.dateModification
          ? `Publié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(synthèseDesRésultats.dateCreation)} | Par ${synthèseDesRésultats.auteurCreationNom}`
          : `Publié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(synthèseDesRésultats.dateCreation)} par ${synthèseDesRésultats.auteurCreationNom} et modifié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(synthèseDesRésultats.dateModification)} par ${synthèseDesRésultats.auteurModificationNom}`}
      </p>
      {!!onModifier ? (
        <div className="flex items-center gap-1 mb-3">
          <BoutonSousLigné
            className="text-dsfr-mention-grey text-xs"
            iconLeft={
              <Icone className="w-3 h-3 text-current" icone={Icone1Icon} />
            }
            onClick={onModifier}
          >
            Modifier le commentaire
          </BoutonSousLigné>
          <Infobulle
            classNameBouton="text-dsfr-mention-grey"
            classNameIcone="w-5 h-5"
          >
            Toute modification de commentaire annule et remplace le commentaire
            affiché.
          </Infobulle>
        </div>
      ) : null}
      <div className="fr-text--sm mb-1">
        <RenduContenuHtml html={contenuAAfficher} />
      </div>
      {contenuTronque ? (
        <BoutonsAffichage
          deplie={afficherContenuComplet}
          deplierLeContenu={() => setAfficherContenuComplet(true)}
          replierLeContenu={() => setAfficherContenuComplet(false)}
        />
      ) : null}
    </>
  );
};

export default SynthèseDesRésultatsAffichage;
