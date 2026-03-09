import { CommentaireAvecNomsAuteurs } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { formaterDate } from "@/client/utils/date/date";
import { nettoyerUneChaîneDeCaractèresPourAffichageHTML } from "@/client/utils/strings";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import { Badge } from "@/components/_commons/Badge";

const AffichageCommentaire = ({
  commentaire,
  onModifier,
}: {
  commentaire: CommentaireAvecNomsAuteurs | null;
  onModifier?: () => void;
}) => {
  if (!commentaire) {
    return <Badge type="gris">Non renseigné</Badge>;
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
        className="fr-text--sm fr-mb-2"
        dangerouslySetInnerHTML={{
          __html: nettoyerUneChaîneDeCaractèresPourAffichageHTML(
            commentaire.contenu,
          ),
        }}
      />
    </>
  );
};

export default AffichageCommentaire;
