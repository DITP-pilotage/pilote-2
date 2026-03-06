import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import {
  CommentaireAvecNomsAuteurs,
  TypeCommentaireChantier,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { Maille } from "@/server/domain/maille/Maille.interface";
import { ModaleNouveauCommentaire } from "./ModaleNouveauCommentaire";

const BoutonNouveauCommentaire = ({
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
    <ModaleNouveauCommentaire
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
            Vous pouvez ici saisir un nouveau commentaire et le publier ou
            l'enregistrer en tant que brouillon. Si vous choisissez de publier
            votre nouveau commentaire, le commentaire précédemment affiché sera
            automatiquement archivé dans l'historique des commentaires.
          </Infobulle>
        }
        label="Nouveau commentaire"
        variant="secondary"
      />
    </ModaleNouveauCommentaire>
  );
};

export default BoutonNouveauCommentaire;
