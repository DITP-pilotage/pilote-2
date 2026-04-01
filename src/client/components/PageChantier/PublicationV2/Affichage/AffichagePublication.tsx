import { useState } from "react";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { Badge } from "@/components/_commons/Badge";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { Publication } from "@/components/PageChantier/PublicationV2/Publication.interface";
import { BoutonsAffichage } from "@/components/_commons/BoutonsAffichage/BoutonsAffichage";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { extractVisibleText } from "@/client/utils/html/extractVisibleText";
import { truncateHtml } from "@/client/utils/html/truncateHtml";

const LIMITE_CARACTERES_AFFICHAGE_PUBLICATION = 250;

export const AffichagePublication = ({
  commentaire,
  onModifier,
}: {
  commentaire: Publication | null;
  onModifier?: () => void;
}) => {
  const [afficherContenuComplet, setAfficherContenuComplet] = useState(false);

  if (!commentaire) {
    return <Badge type="gris">Non renseigné</Badge>;
  }

  const commentaireComplet = commentaire.contenu;
  const contenuTronque =
    extractVisibleText(commentaireComplet).length >
    LIMITE_CARACTERES_AFFICHAGE_PUBLICATION;
  const contenuAAfficher =
    afficherContenuComplet || !contenuTronque
      ? commentaireComplet
      : truncateHtml(
          commentaireComplet,
          LIMITE_CARACTERES_AFFICHAGE_PUBLICATION,
        );

  return (
    <>
      <p className="text-xs text-dsfr-mention-grey mb-1">
        {commentaire.dateCreation === commentaire.dateModification
          ? `Publié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(commentaire.dateCreation)} | Par ${commentaire.auteurCreationNom}`
          : `Publié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(commentaire.dateCreation)} par ${commentaire.auteurCreationNom} et modifié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(commentaire.dateModification)} par ${commentaire.auteurModificationNom}`}
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
        <RenduContenuHtml
          className="[&_p]:text-sm [&_p]:mb-1"
          html={contenuAAfficher}
        />
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
