import { useState } from "react";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { Icone } from "@/components/_commons/Icone";
import { Icone1Icon } from "@/components/_commons/Icones/Icone1Icon";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import {
  CommentaireAvecNomsAuteurs,
  CommentaireV2,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { useRefreshRouter } from "@/client/hooks/useRefreshRouter";
import { CommentaireAction } from "@/components/_commons/CommentairesNew/CommentaireSection/AlerteCommentaire";
import { useEditerBrouillonCommentaire } from "./useEditerBrouillonCommentaire";
import { ModaleFormulaireCommentaire } from "./ModaleFormulaireCommentaire";

const BoutonEditerBrouillonCommentaire = ({
  commentaire,
  brouillon,
  onAction,
}: {
  commentaire: CommentaireAvecNomsAuteurs | null;
  brouillon: CommentaireV2 | null;
  onAction: (action: CommentaireAction) => void;
}) => {
  const [open, setOpen] = useState(false);
  const refreshRouter = useRefreshRouter();

  const { publier, enregistrerEnBrouillon } = useEditerBrouillonCommentaire({
    brouillonId: brouillon!.id,
    onSuccess: (action) => {
      setOpen(false);
      refreshRouter();
      onAction(action);
    },
  });

  return (
    <ModaleFormulaireCommentaire
      brouillon={brouillon}
      commentaire={commentaire}
      onBrouillon={enregistrerEnBrouillon}
      onOpenChange={setOpen}
      onPublier={publier}
      open={open}
      title="Editer un brouillon"
      type={brouillon!.type}
      trigger={
        <Bouton
          iconLeft={
            <Icone className="text-current h-4 w-4" icone={Icone1Icon} />
          }
          iconRight={
            <Infobulle classNameIcone="w-5 h-5">
              Vous avez déjà saisi un nouveau commentaire mais vous ne l'avez
              pas publié. Vous pouvez éditer ce nouveau commentaire pour le
              publier ou le conserver en tant que brouillon.
            </Infobulle>
          }
          label="Editer un brouillon"
          variant="secondary"
        />
      }
    />
  );
};

export default BoutonEditerBrouillonCommentaire;
