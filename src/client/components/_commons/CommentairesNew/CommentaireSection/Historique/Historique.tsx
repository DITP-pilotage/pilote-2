import { Fragment } from "react";
import { Modale } from "@/components/shared/Modale";
import { BoutonSousLigné } from "@/components/_commons/BoutonSousLigné/BoutonSousLigné";
import { Icone } from "@/components/_commons/Icone";
import { Eye1Icon } from "@/components/_commons/Icones/Eye1Icon";
import { TypeCommentaireChantier } from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import AffichageCommentaire from "@/components/_commons/CommentairesNew/CommentaireSection/Affichage/Affichage";
import useHistoriqueCommentaire from "./useHistoriqueCommentaire";

const HistoriqueCommentaire = ({
  réformeId,
  territoireCode,
  type,
  maille: _maille,
}: {
  réformeId: string;
  territoireCode: string;
  type: TypeCommentaireChantier;
  maille: Maille;
}) => {
  const { historique, récupérerHistorique } = useHistoriqueCommentaire({
    réformeId,
    territoireCode,
    type,
  });

  return (
    <Modale
      onOpenChange={(open) => {
        if (open) récupérerHistorique();
      }}
      title="Historique - Commentaires"
      trigger={
        <BoutonSousLigné
          className="fr-mt-1w fr-ml-3w"
          iconLeft={
            <Icone className="w-4 h-4 !text-current" icone={Eye1Icon} />
          }
          type="button"
        >
          Voir l'historique
        </BoutonSousLigné>
      }
    >
      {historique ? (
        historique.map((item, index) => (
          <Fragment key={item.dateModification}>
            {index !== 0 && <hr className="fr-mt-4w" />}
            <AffichageCommentaire
              commentaire={{
                ...item,
                id: "",
                statut: "PUBLIE" as const,
                auteurCreationId: "",
                dateCreation: item.dateCreation,
                auteurModificationId: "",
                dateDernierBrouillon: null,
              }}
            />
          </Fragment>
        ))
      ) : (
        <p>Chargement de l'historique...</p>
      )}
    </Modale>
  );
};

export default HistoriqueCommentaire;
