import { useState, useRef, useEffect } from "react";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { Badge } from "@/components/_commons/Badge";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { Publication } from "@/components/PageChantier/PublicationV2/Publication.interface";
import { BoutonsAffichage } from "@/components/_commons/BoutonsAffichage/BoutonsAffichage";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { NomUtilisateurAvecTooltip } from "@/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip";
import { clsxm } from "@/utils/clsxm";

export const AffichagePublication = ({
  commentaire,
  onModifier,
}: {
  commentaire: Publication | null;
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
  }, [commentaire?.contenu]);

  if (!commentaire) {
    return <Badge type="gris">Non renseigné</Badge>;
  }

  return (
    <>
      <p className="text-xs text-dsfr-mention-grey mb-1">
        {commentaire.dateCreation === commentaire.dateModification ? (
          <>
            {`Publié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(commentaire.dateCreation)} | Par `}
            <NomUtilisateurAvecTooltip
              fonction={commentaire.auteurCreationFonction}
              nom={commentaire.auteurCreationNom}
              service={commentaire.auteurCreationService}
            />
          </>
        ) : (
          <>
            {`Publié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(commentaire.dateCreation)} par `}
            <NomUtilisateurAvecTooltip
              fonction={commentaire.auteurCreationFonction}
              nom={commentaire.auteurCreationNom}
              service={commentaire.auteurCreationService}
            />
            {` et modifié le ${PiloteDateFormatter.isoDateFranceMetropolitaine(commentaire.dateModification)} par `}
            <NomUtilisateurAvecTooltip
              fonction={commentaire.auteurModificationFonction}
              nom={commentaire.auteurModificationNom}
              service={commentaire.auteurModificationService}
            />
          </>
        )}
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
        className={clsxm(
          "fr-text--sm mb-1 print:line-clamp-none",
          !afficherContenuComplet && "line-clamp-3",
        )}
      >
        <RenduContenuHtml
          className="[&_p]:text-sm [&_p]:mb-1"
          html={commentaire.contenu}
        />
      </div>
      {contenuTronque || afficherContenuComplet ? (
        <div className="print:hidden">
          <BoutonsAffichage
            deplie={afficherContenuComplet}
            deplierLeContenu={() => setAfficherContenuComplet(true)}
            replierLeContenu={() => setAfficherContenuComplet(false)}
          />
        </div>
      ) : null}
    </>
  );
};
