import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import {
  CommentaireAvecNomsAuteurs,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { ModaleEditerBrouillonCommentaire } from "./ModaleEditerBrouillonCommentaire";

const BoutonEditerBrouillonCommentaire = ({
  commentaire,
  réformeId,
  territoireCode,
  type,
  maille,
}: {
  commentaire: CommentaireAvecNomsAuteurs | null;
  réformeId: string;
  territoireCode: string;
  type: TypeCommentaireChantier;
  maille: Maille;
}) => {
  return (
    <ModaleEditerBrouillonCommentaire
      commentaire={commentaire}
      maille={maille}
      réformeId={réformeId}
      territoireCode={territoireCode}
      type={type}
    >
      <Bouton
        iconLeft={<Icone className="text-current h-4 w-4" icone={Icone1Icon} />}
        iconRight={
          <Infobulle classNameIcone="w-5 h-5">
            Vous avez déjà saisi un nouveau commentaire mais vous ne l'avez pas
            publié. Vous pouvez éditer ce nouveau commentaire pour le publier ou
            le conserver en tant que brouillon.
          </Infobulle>
        }
        label="Editer un brouillon"
        variant="secondary"
      />
    </ModaleEditerBrouillonCommentaire>
  );
};

export default BoutonEditerBrouillonCommentaire;
