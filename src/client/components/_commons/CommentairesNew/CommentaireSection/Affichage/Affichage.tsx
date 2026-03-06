import { useEffect, useState } from "react";
import { CommentaireAvecNomsAuteurs } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { formaterDate } from "@/client/utils/date/date";
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from "@/client/utils/strings";
import { BoutonsAffichage } from "@/components/PageChantier/SynthèseDesRésultatsChantier/BoutonsAffichage/BoutonsAffichage";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";

const LIMITE_AFFICHAGE = 250;

const AffichageCommentaire = ({
  commentaire,
  onModifier,
}: {
  commentaire: CommentaireAvecNomsAuteurs | null;
  onModifier?: () => void;
}) => {
  const [afficherContenuComplet, setAfficherContenuComplet] = useState(false);
  const [afficherBoutonsAffichage, setAfficherBoutonsAffichage] =
    useState(false);
  const [contenuAAfficher, setContenuAAfficher] = useState("");

  useEffect(() => {
    setAfficherBoutonsAffichage(
      (commentaire?.contenu.length ?? 0) > LIMITE_AFFICHAGE,
    );
    setAfficherContenuComplet(false);
  }, [commentaire]);

  useEffect(() => {
    if (commentaire) {
      setContenuAAfficher(
        afficherContenuComplet || commentaire.contenu.length <= LIMITE_AFFICHAGE
          ? commentaire.contenu
          : commentaire.contenu.slice(0, LIMITE_AFFICHAGE) + "...",
      );
    }
  }, [commentaire, afficherContenuComplet]);

  if (!commentaire) {
    return (
      <p className="fr-text--sm !text-dsfr-mention-grey">Aucun commentaire.</p>
    );
  }

  return (
    <>
      <p className="text-xs text-dsfr-mention-grey mb-1">
        {commentaire.dateCreation === commentaire.dateModification
          ? `Publié le ${formaterDate(commentaire.dateCreation, "DD/MM/YYYY")}`
          : `Publié le ${formaterDate(commentaire.dateCreation, "DD/MM/YYYY")} et modifié le ${formaterDate(commentaire.dateModification, "DD/MM/YYYY")}`}
        {!!commentaire.auteurModificationNom &&
          ` | Par ${commentaire.auteurModificationNom}`}
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
        className="fr-text--sm fr-mb-0"
        dangerouslySetInnerHTML={{
          __html:
            nettoyerUneChaîneDeCaractèresPourAffichageHTML(contenuAAfficher),
        }}
      />
      {afficherBoutonsAffichage ? (
        <BoutonsAffichage
          afficherVoirMoins={afficherContenuComplet}
          afficherVoirPlus={!afficherContenuComplet}
          déplierLeContenu={() => setAfficherContenuComplet(true)}
          replierLeContenu={() => setAfficherContenuComplet(false)}
        />
      ) : null}
    </>
  );
};

export default AffichageCommentaire;
