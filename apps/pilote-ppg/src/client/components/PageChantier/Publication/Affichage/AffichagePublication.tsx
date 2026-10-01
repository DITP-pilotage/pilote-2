import { ReactNode, useState, useRef, useEffect } from "react";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/shared/Infobulle";
import { Badge } from "@/components/shared/Badge";
import { PiloteDateFormatter } from "@/utils/PiloteDateFormatter";
import { Publication } from "@/components/PageChantier/Publication/Publication.interface";
import { BoutonsAffichage } from "@/components/_commons/BoutonsAffichage/BoutonsAffichage";
import { RenduContenuHtml } from "@/components/_commons/EditeurRiche/RenduContenuHtml";
import { NomUtilisateurAvecTooltip } from "@/components/_commons/NomUtilisateurAvecTooltip/NomUtilisateurAvecTooltip";
import { clsxm } from "@/utils/clsxm";

interface AffichagePublicationProps {
  commentaire: Publication | null;
  onModifier?: () => void;
  annexe?: ReactNode;
  messageAbsence?: string;
}

export const AffichagePublication = ({
  annexe,
  ...props
}: AffichagePublicationProps) =>
  annexe ? (
    <div className="flex gap-4">
      <div className="flex-none flex flex-col items-center gap-4">{annexe}</div>
      <div className="min-w-0">
        <ContenuPublication {...props} />
      </div>
    </div>
  ) : (
    <ContenuPublication {...props} />
  );

const ContenuPublication = ({
  commentaire,
  onModifier,
  messageAbsence,
}: Omit<AffichagePublicationProps, "annexe">) => {
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
    return messageAbsence ? (
      <p className="fr-text--sm text-dsfr-mention-grey">{messageAbsence}</p>
    ) : (
      <Badge size="sm">Non renseigné</Badge>
    );
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
