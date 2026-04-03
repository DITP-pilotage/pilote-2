import { useState, useRef, useEffect } from "react";
import { BoutonsAffichage } from "@/components/_commons/BoutonsAffichage/BoutonsAffichage";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { SyntheseDesResultatsHistoriqueItem } from "@/server/syntheses-des-resultats/queries/RecupererHistoriqueSyntheseDesResultatsQuery";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";

const SynthèseDesRésultatsAffichage = ({
  itemHistoriqueSyntheseDesResultats: synthèseDesRésultats,
  onModifier,
}: {
  itemHistoriqueSyntheseDesResultats: SyntheseDesResultatsHistoriqueItem | null;
  onModifier?: () => void;
}) => {
  const [afficherContenuComplet, setAfficherContenuComplet] = useState(false);
  const [contenuTronque, setContenuTronque] = useState(false);
  const contenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const contenuElement = contenuRef.current;
    if (contenuElement) {
      setContenuTronque(
        contenuElement.scrollHeight > contenuElement.clientHeight,
      );
    }
  }, [synthèseDesRésultats?.contenu]);

  if (!synthèseDesRésultats) {
    return (
      <p className="fr-text--sm !text-dsfr-mention-grey">
        Aucune synthèse des résultats.
      </p>
    );
  }

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
      <div
        ref={contenuRef}
        className={`fr-text--sm mb-1 ${!afficherContenuComplet ? "line-clamp-3" : ""}`}
      >
        <RenduContenuHtml
          className="[&_p]:text-sm [&_p]:mb-1"
          html={synthèseDesRésultats.contenu}
        />
      </div>
      {contenuTronque || afficherContenuComplet ? (
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
