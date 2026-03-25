import { useState } from "react";
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from "@/client/utils/strings";
import { BoutonsAffichage } from "@/components/_commons/BoutonsAffichage/BoutonsAffichage";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { SyntheseDesResultatsHistoriqueItem } from "@/server/syntheses-des-resultats/queries/RecupererHistoriqueSyntheseDesResultatsQuery";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";

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

  const contenuTronque =
    synthèseDesRésultats.contenu.length >
    LIMITE_CARACTERES_AFFICHAGE_SYNTHESE_DES_RESULTATS;
  const contenuAAfficher =
    afficherContenuComplet || !contenuTronque
      ? synthèseDesRésultats.contenu
      : synthèseDesRésultats.contenu.slice(
          0,
          LIMITE_CARACTERES_AFFICHAGE_SYNTHESE_DES_RESULTATS,
        ) + "...";

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
      <p
        className="fr-text--sm mb-1"
        dangerouslySetInnerHTML={{
          __html:
            nettoyerUneChaîneDeCaractèresPourAffichageHTML(contenuAAfficher),
        }}
      />
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
